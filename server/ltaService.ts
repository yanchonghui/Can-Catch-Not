import fs from 'fs';
import path from 'path';

export interface LtaBusStop {
  id: string; // BusStopCode
  name: string; // Description
  road: string; // RoadName
  lat: number; // Latitude
  lng: number; // Longitude
  services: string[]; // List of services calling at this stop
}

export interface LtaBusService {
  serviceNo: string;
  operator: string;
  direction: number;
  category: string;
  originCode: string;
  destinationCode: string;
  loopDesc?: string;
}

export interface LtaSyncStatus {
  isSyncing: boolean;
  totalStops: number;
  totalServices: number;
  totalRoutes: number;
  lastSyncedAt: string | null;
  error?: string | null;
}

const DEFAULT_LTA_KEY = process.env.LTA_DATAMALL_API_KEY || 'LQcDSpOhQGyKlvfSVGEg9Q==';
const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';
const CACHE_DIR = path.resolve('data');
const CACHE_FILE = path.join(CACHE_DIR, 'lta-master.json');

// In-memory master storage
const busStops = new Map<string, LtaBusStop>();
const busServices = new Map<string, LtaBusService>();
const serviceToStops = new Map<string, Set<string>>(); // serviceNo -> Set of busStopCodes

let syncStatus: LtaSyncStatus = {
  isSyncing: false,
  totalStops: 0,
  totalServices: 0,
  totalRoutes: 0,
  lastSyncedAt: null,
  error: null
};

// Arrival cache for fast repeated responses
const arrivalCache = new Map<string, { timestamp: number; data: any }>();
const ARRIVAL_CACHE_TTL_MS = 6000; // 6 seconds

/**
 * Fetch all pages from an LTA endpoint ($skip=0, 500, 1000...)
 */
async function fetchAllPages(endpoint: string, apiKey: string): Promise<any[]> {
  const records: any[] = [];
  let skip = 0;
  const pageSize = 500;

  while (true) {
    const url = `${LTA_BASE_URL}/${endpoint}?$skip=${skip}`;
    try {
      const response = await fetch(url, {
        headers: {
          AccountKey: apiKey.trim(),
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`LTA API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const items = json.value || [];
      records.push(...items);

      if (items.length < pageSize) {
        break;
      }
      skip += pageSize;
    } catch (err) {
      console.error(`[LTA Service] Error fetching ${endpoint} at skip=${skip}:`, err);
      throw err;
    }
  }

  return records;
}

/**
 * Ingest fresh data from LTA DataMall
 */
export async function ingestLtaData(apiKey: string = DEFAULT_LTA_KEY): Promise<LtaSyncStatus> {
  if (syncStatus.isSyncing) {
    return syncStatus;
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;
  console.log('[LTA Service] Starting dynamic ingestion from official LTA DataMall API...');

  try {
    // 1. Fetch Bus Stops
    console.log('[LTA Service] Fetching Bus Stops...');
    const rawStops = await fetchAllPages('BusStops', apiKey);
    console.log(`[LTA Service] Ingested ${rawStops.length} bus stops.`);

    // 2. Fetch Bus Services
    console.log('[LTA Service] Fetching Bus Services...');
    const rawServices = await fetchAllPages('BusServices', apiKey);
    console.log(`[LTA Service] Ingested ${rawServices.length} bus services.`);

    // 3. Fetch Bus Routes
    console.log('[LTA Service] Fetching Bus Routes...');
    const rawRoutes = await fetchAllPages('BusRoutes', apiKey);
    console.log(`[LTA Service] Ingested ${rawRoutes.length} bus route mappings.`);

    // Map routes to stops
    const stopServicesMap = new Map<string, Set<string>>();
    const svcToStopsMap = new Map<string, Set<string>>();

    for (const r of rawRoutes) {
      const stopCode = String(r.BusStopCode).trim();
      const svcNo = String(r.ServiceNo).trim();

      if (!stopServicesMap.has(stopCode)) {
        stopServicesMap.set(stopCode, new Set<string>());
      }
      stopServicesMap.get(stopCode)!.add(svcNo);

      if (!svcToStopsMap.has(svcNo)) {
        svcToStopsMap.set(svcNo, new Set<string>());
      }
      svcToStopsMap.get(svcNo)!.add(stopCode);
    }

    // Populate in-memory bus stops
    busStops.clear();
    for (const s of rawStops) {
      const code = String(s.BusStopCode).trim();
      const svcs = stopServicesMap.has(code)
        ? Array.from(stopServicesMap.get(code)!).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        : [];

      busStops.set(code, {
        id: code,
        name: s.Description || `Bus Stop #${code}`,
        road: s.RoadName || '',
        lat: parseFloat(s.Latitude) || 0,
        lng: parseFloat(s.Longitude) || 0,
        services: svcs
      });
    }

    // Populate in-memory bus services
    busServices.clear();
    for (const s of rawServices) {
      const svcNo = String(s.ServiceNo).trim();
      busServices.set(svcNo, {
        serviceNo: svcNo,
        operator: s.Operator || '',
        direction: s.Direction || 1,
        category: s.Category || '',
        originCode: s.OriginCode || '',
        destinationCode: s.DestinationCode || '',
        loopDesc: s.LoopDesc || undefined
      });
    }

    // Service to stops map
    serviceToStops.clear();
    for (const [svc, stops] of svcToStopsMap.entries()) {
      serviceToStops.set(svc, stops);
    }

    // Persist to disk cache
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      const cachePayload = {
        syncedAt: new Date().toISOString(),
        stops: Array.from(busStops.values()),
        services: Array.from(busServices.values()),
        serviceToStops: Array.from(serviceToStops.entries()).map(([svc, stopSet]) => [svc, Array.from(stopSet)])
      };

      fs.writeFileSync(CACHE_FILE, JSON.stringify(cachePayload), 'utf-8');
      console.log(`[LTA Service] Saved cache to ${CACHE_FILE}`);
    } catch (writeErr) {
      console.warn('[LTA Service] Could not save master cache to disk:', writeErr);
    }

    syncStatus = {
      isSyncing: false,
      totalStops: busStops.size,
      totalServices: busServices.size,
      totalRoutes: rawRoutes.length,
      lastSyncedAt: new Date().toISOString(),
      error: null
    };

    console.log(`[LTA Service] Ingestion complete! Total ${busStops.size} stops and ${busServices.size} services.`);
  } catch (err: any) {
    console.error('[LTA Service] Master data ingestion failed:', err);
    syncStatus.isSyncing = false;
    syncStatus.error = err.message || 'Ingestion failed';
  }

  return syncStatus;
}

/**
 * Load cached data from disk on boot
 */
export function loadCachedData(): boolean {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      console.log(`[LTA Service] Loading cached LTA data from ${CACHE_FILE}...`);
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (data && Array.isArray(data.stops) && data.stops.length > 0) {
        // If raw format with 'routes'
        const stopServicesMap = new Map<string, Set<string>>();
        const svcToStopsMap = new Map<string, Set<string>>();

        if (Array.isArray(data.routes)) {
          for (const r of data.routes) {
            const stopCode = String(r.BusStopCode).trim();
            const svcNo = String(r.ServiceNo).trim();

            if (!stopServicesMap.has(stopCode)) {
              stopServicesMap.set(stopCode, new Set<string>());
            }
            stopServicesMap.get(stopCode)!.add(svcNo);

            if (!svcToStopsMap.has(svcNo)) {
              svcToStopsMap.set(svcNo, new Set<string>());
            }
            svcToStopsMap.get(svcNo)!.add(stopCode);
          }
        }

        busStops.clear();
        for (const stop of data.stops) {
          const code = String(stop.id || stop.BusStopCode).trim();
          let svcs: string[] = [];

          if (Array.isArray(stop.services)) {
            svcs = stop.services;
          } else if (stopServicesMap.has(code)) {
            svcs = Array.from(stopServicesMap.get(code)!).sort((a, b) =>
              a.localeCompare(b, undefined, { numeric: true })
            );
          }

          busStops.set(code, {
            id: code,
            name: stop.name || stop.Description || `Bus Stop #${code}`,
            road: stop.road || stop.RoadName || '',
            lat: parseFloat(stop.lat || stop.Latitude) || 0,
            lng: parseFloat(stop.lng || stop.Longitude) || 0,
            services: svcs
          });
        }

        busServices.clear();
        if (Array.isArray(data.services)) {
          for (const s of data.services) {
            const svcNo = String(s.serviceNo || s.ServiceNo).trim();
            busServices.set(svcNo, {
              serviceNo: svcNo,
              operator: s.operator || s.Operator || '',
              direction: s.direction || s.Direction || 1,
              category: s.category || s.Category || '',
              originCode: s.originCode || s.OriginCode || '',
              destinationCode: s.destinationCode || s.DestinationCode || '',
              loopDesc: s.loopDesc || s.LoopDesc || undefined
            });
          }
        }

        serviceToStops.clear();
        if (Array.isArray(data.serviceToStops)) {
          for (const [svc, stopList] of data.serviceToStops) {
            serviceToStops.set(svc, new Set(stopList));
          }
        } else {
          for (const [svc, stopSet] of svcToStopsMap.entries()) {
            serviceToStops.set(svc, stopSet);
          }
        }

        syncStatus = {
          isSyncing: false,
          totalStops: busStops.size,
          totalServices: busServices.size,
          totalRoutes: Array.isArray(data.routes) ? data.routes.length : 0,
          lastSyncedAt: data.syncedAt || new Date().toISOString(),
          error: null
        };

        console.log(`[LTA Service] Successfully loaded ${busStops.size} stops & ${busServices.size} services from cache.`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[LTA Service] Failed to load cached master file:', err);
  }
  return false;
}

/**
 * Initialize LTA Service: load from disk or ingest dynamically
 */
export async function initializeLtaService(): Promise<void> {
  const loaded = loadCachedData();

  // If cache is missing, empty, or older than 24 hours, start background sync
  const isStale = !syncStatus.lastSyncedAt || (Date.now() - new Date(syncStatus.lastSyncedAt).getTime()) > 86400000;

  if (!loaded || isStale) {
    console.log('[LTA Service] Cache missing or older than 24h. Initiating background sync...');
    // Run sync in background so startup remains instantaneous
    ingestLtaData().catch((e) => console.error('[LTA Service] Background sync failed:', e));
  }
}

/**
 * Dynamic lookup fallback directly calling LTA DataMall if a stop isn't in memory yet
 */
async function dynamicStopLookup(code: string, apiKey: string = DEFAULT_LTA_KEY): Promise<LtaBusStop | null> {
  try {
    const url = `${LTA_BASE_URL}/v3/BusArrival?BusStopCode=${encodeURIComponent(code)}`;
    const resp = await fetch(url, {
      headers: {
        AccountKey: apiKey.trim(),
        accept: 'application/json'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.Services) && data.Services.length > 0) {
        const liveServices = data.Services.map((s: any) => String(s.ServiceNo).trim());
        const newStop: LtaBusStop = {
          id: code,
          name: `Bus Stop #${code}`,
          road: 'Singapore',
          lat: 1.3521,
          lng: 103.8198,
          services: liveServices
        };
        busStops.set(code, newStop);
        return newStop;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Search bus stops and services dynamically
 */
export async function searchLtaData(
  query: string,
  limit: number = 25,
  apiKey: string = DEFAULT_LTA_KEY
): Promise<{ stops: LtaBusStop[]; services: LtaBusService[]; exactMatchStop?: LtaBusStop }> {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return sample stops
    return {
      stops: Array.from(busStops.values()).slice(0, limit),
      services: Array.from(busServices.values()).slice(0, 10)
    };
  }

  const results: LtaBusStop[] = [];
  let exactMatchStop: LtaBusStop | undefined;

  // 1. Check exact stop code
  const exactCode = busStops.get(q);
  if (exactCode) {
    exactMatchStop = exactCode;
    results.push(exactCode);
  } else if (/^\d{4,5}$/.test(q)) {
    // If not found in memory, try dynamic lookup against LTA API
    const dynamicStop = await dynamicStopLookup(q, apiKey);
    if (dynamicStop) {
      exactMatchStop = dynamicStop;
      results.push(dynamicStop);
    }
  }

  // 2. Check if query is a Bus Service number (e.g. "298", "65", "190")
  const upperQ = q.toUpperCase();
  const matchedServiceStops = serviceToStops.get(upperQ);
  if (matchedServiceStops) {
    for (const stopCode of matchedServiceStops) {
      const stop = busStops.get(stopCode);
      if (stop && !results.some((r) => r.id === stop.id)) {
        results.push(stop);
        if (results.length >= limit) break;
      }
    }
  }

  // 3. Search across all bus stops by description, road, or service prefix
  if (results.length < limit) {
    for (const stop of busStops.values()) {
      if (results.some((r) => r.id === stop.id)) continue;

      const codeMatch = stop.id.toLowerCase().includes(q);
      const nameMatch = stop.name.toLowerCase().includes(q);
      const roadMatch = stop.road.toLowerCase().includes(q);
      const svcMatch = stop.services.some((s) => s.toLowerCase() === q || s.toLowerCase().startsWith(q));

      if (codeMatch || nameMatch || roadMatch || svcMatch) {
        results.push(stop);
        if (results.length >= limit) break;
      }
    }
  }

  // Filter matching services
  const matchedServices: LtaBusService[] = [];
  for (const svc of busServices.values()) {
    if (svc.serviceNo.toLowerCase().includes(q)) {
      matchedServices.push(svc);
      if (matchedServices.length >= 10) break;
    }
  }

  return {
    stops: results,
    services: matchedServices,
    exactMatchStop
  };
}

/**
 * Get nearest bus stops from coordinates
 */
export function getNearestBusStops(lat: number, lng: number, limit: number = 8): (LtaBusStop & { distanceMeters: number })[] {
  function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  const stopsList = Array.from(busStops.values());
  const withDistance = stopsList.map((stop) => ({
    ...stop,
    distanceMeters: haversineMeters(lat, lng, stop.lat, stop.lng)
  }));

  withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return withDistance.slice(0, limit);
}

/**
 * Fetch real-time bus arrivals from LTA BusArrival endpoint
 */
export async function getLiveBusArrivals(
  busStopCode: string,
  serviceNo?: string,
  apiKey: string = DEFAULT_LTA_KEY
): Promise<any> {
  const code = busStopCode.trim();
  const cacheKey = `${code}_${serviceNo || 'ALL'}`;
  const cached = arrivalCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ARRIVAL_CACHE_TTL_MS) {
    return {
      ...cached.data,
      _fromCache: true,
      _cachedAt: cached.timestamp
    };
  }

  try {
    let url = `${LTA_BASE_URL}/v3/BusArrival?BusStopCode=${encodeURIComponent(code)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo.trim())}`;
    }

    const response = await fetch(url, {
      headers: {
        AccountKey: apiKey.trim(),
        accept: 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      arrivalCache.set(cacheKey, { timestamp: Date.now(), data });
      return { ...data, _source: 'lta_datamall' };
    } else {
      console.warn(`[LTA Service] BusArrival failed with HTTP ${response.status}`);
    }
  } catch (err) {
    console.error('[LTA Service] Error in getLiveBusArrivals:', err);
  }

  return {
    BusStopCode: code,
    Services: [],
    _source: 'live_engine'
  };
}

/**
 * Get single bus stop by code
 */
export async function getBusStopByCode(code: string, apiKey: string = DEFAULT_LTA_KEY): Promise<LtaBusStop | null> {
  const stop = busStops.get(code.trim());
  if (stop) return stop;
  return dynamicStopLookup(code, apiKey);
}

/**
 * Get current sync status
 */
export function getLtaSyncStatus(): LtaSyncStatus {
  return syncStatus;
}

/**
 * Export all bus stops as an array (up to limit or all)
 */
export function getAllBusStops(limit?: number): LtaBusStop[] {
  const all = Array.from(busStops.values());
  return limit ? all.slice(0, limit) : all;
}
