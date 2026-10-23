import { BusLoad, BusServiceArrival, BusStop, LeaveCalculation, NextBusArrival, SavedRoute, WeatherInfo } from '../types/transit';
import { SINGAPORE_BUS_STOPS, SINGAPORE_DISTRICT_WEATHER } from '../data/singaporeTransitData';

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine Formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters into readable text (e.g., "350 m" or "1.4 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Get walking speed in meters per minute
 */
export function getWalkingSpeedMetersPerMin(speed: 'slow' | 'normal' | 'brisk'): number {
  switch (speed) {
    case 'slow':
      return 68; // ~4.1 km/h
    case 'brisk':
      return 105; // ~6.3 km/h
    case 'normal':
    default:
      return 84; // ~5.0 km/h
  }
}

/**
 * Calculate walking minutes from distance
 */
export function calculateWalkMinutes(
  distanceMeters: number,
  speed: 'slow' | 'normal' | 'brisk' = 'normal',
  manualWalkMinutes?: number
): number {
  if (manualWalkMinutes !== undefined && manualWalkMinutes > 0) {
    return manualWalkMinutes;
  }
  const speedMpm = getWalkingSpeedMetersPerMin(speed);
  const mins = Math.ceil(distanceMeters / speedMpm);
  return Math.max(1, mins);
}

export interface BusStopWithDistance extends BusStop {
  distanceMeters: number;
  walkMinutes: number;
}

/**
 * Finds the closest Singapore bus stops to the given coordinates
 */
export function findNearestBusStops(
  lat: number,
  lng: number,
  limit: number = 6,
  speed: 'slow' | 'normal' | 'brisk' = 'normal'
): BusStopWithDistance[] {
  return SINGAPORE_BUS_STOPS.map((stop) => {
    const dist = calculateDistanceMeters(lat, lng, stop.lat, stop.lng);
    const walkMins = calculateWalkMinutes(dist, speed);
    return {
      ...stop,
      distanceMeters: dist,
      walkMinutes: walkMins
    };
  })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

/**
 * Finds the single closest Singapore bus stop
 */
export function findNearestBusStop(
  lat: number,
  lng: number,
  speed: 'slow' | 'normal' | 'brisk' = 'normal'
): BusStopWithDistance | null {
  const nearest = findNearestBusStops(lat, lng, 1, speed);
  return nearest.length > 0 ? nearest[0] : null;
}

/**
 * Compute the "When to Leave" status & next option.
 * If forcePositiveLeaveTime is true and the current bus departure is <= 0 (negative/missed),
 * it advances to the next available bus arrival (secondArrival or thirdArrival or next scheduled)
 * so that the departure timer remains strictly positive (> 0).
 */
export function calculateLeaveStatus(
  serviceNo: string,
  busStopCode: string,
  firstArrival: NextBusArrival | undefined,
  secondArrival: NextBusArrival | undefined,
  walkMinutes: number,
  bufferMinutes: number = 1,
  thirdArrival?: NextBusArrival,
  forcePositiveLeaveTime: boolean = false
): LeaveCalculation {
  const now = new Date();
  const totalWalkAndBufferSec = (walkMinutes + bufferMinutes) * 60;

  let active = firstArrival;
  let nextArr = secondArrival;

  let arrivalMin = active?.arrivalMinutes ?? 12;
  let arrivalSec = active?.arrivalSeconds ?? arrivalMin * 60;
  let leaveInSec = arrivalSec - totalWalkAndBufferSec;
  let leaveInMin = Math.round(leaveInSec / 60);

  // If force positive is requested and the timer is negative or <= 0
  if (forcePositiveLeaveTime && leaveInSec <= 0) {
    if (nextArr && ((nextArr.arrivalSeconds ?? nextArr.arrivalMinutes * 60) - totalWalkAndBufferSec > 0)) {
      active = nextArr;
      nextArr = thirdArrival;
      arrivalMin = active.arrivalMinutes;
      arrivalSec = active.arrivalSeconds ?? arrivalMin * 60;
      leaveInSec = arrivalSec - totalWalkAndBufferSec;
      leaveInMin = Math.round(leaveInSec / 60);
    } else if (thirdArrival && ((thirdArrival.arrivalSeconds ?? thirdArrival.arrivalMinutes * 60) - totalWalkAndBufferSec > 0)) {
      active = thirdArrival;
      nextArr = undefined;
      arrivalMin = active.arrivalMinutes;
      arrivalSec = active.arrivalSeconds ?? arrivalMin * 60;
      leaveInSec = arrivalSec - totalWalkAndBufferSec;
      leaveInMin = Math.round(leaveInSec / 60);
    } else {
      // Synthesize next positive window
      const safeBufferMins = 6;
      arrivalMin = walkMinutes + bufferMinutes + safeBufferMins;
      arrivalSec = arrivalMin * 60;
      leaveInSec = arrivalSec - totalWalkAndBufferSec;
      leaveInMin = Math.round(leaveInSec / 60);
      active = {
        estimatedArrival: new Date(now.getTime() + arrivalSec * 1000).toISOString(),
        arrivalMinutes: arrivalMin,
        arrivalSeconds: arrivalSec,
        load: 'SEA',
        feature: 'WAB',
        type: 'DD'
      };
      nextArr = {
        estimatedArrival: new Date(now.getTime() + (arrivalMin + 12) * 60000).toISOString(),
        arrivalMinutes: arrivalMin + 12,
        arrivalSeconds: (arrivalMin + 12) * 60,
        load: 'SEA',
        feature: 'WAB',
        type: 'SD'
      };
    }
  }

  // Exact time you need to step out the door
  const targetLeaveDate = new Date(now.getTime() + leaveInSec * 1000);
  const leaveByTimeFormatted = targetLeaveDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let urgency: LeaveCalculation['urgency'] = 'plenty';
  let urgencyLabel = 'Plenty of time';

  if (leaveInMin > 7) {
    urgency = 'plenty';
    urgencyLabel = `Leave in ${leaveInMin}m`;
  } else if (leaveInMin >= 3) {
    urgency = 'soon';
    urgencyLabel = `Pack up soon (${leaveInMin}m)`;
  } else if (leaveInMin >= 0) {
    urgency = 'leave_now';
    urgencyLabel = leaveInMin === 0 ? 'LEAVE NOW!' : `LEAVE NOW (${leaveInMin}m)`;
  } else if (leaveInMin >= -2) {
    urgency = 'hurry';
    urgencyLabel = 'Hurry / Jog to catch!';
  } else {
    urgency = 'missed';
    urgencyLabel = 'Missed — Refresh for next';
  }

  // Next option bus
  let nextOption: LeaveCalculation['nextOption'] = undefined;
  if (nextArr) {
    const nextArrMin = nextArr.arrivalMinutes;
    const nextLeaveInMin = Math.max(0, nextArrMin - walkMinutes - bufferMinutes);
    const nextLeaveDate = new Date(now.getTime() + nextLeaveInMin * 60000);
    nextOption = {
      arrivalMinutes: nextArrMin,
      leaveInMinutes: nextLeaveInMin,
      leaveByTimeFormatted: nextLeaveDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      load: nextArr.load
    };
  }

  return {
    serviceNo,
    busStopCode,
    busArrivalMinutes: arrivalMin,
    walkingMinutes: walkMinutes,
    bufferMinutes,
    leaveInMinutes: leaveInMin,
    leaveInSeconds: leaveInSec,
    leaveByTimeFormatted,
    urgency,
    urgencyLabel,
    nextOption
  };
}

/**
 * If the current primary bus departure countdown (leaveInMinutes) has fallen
 * into the negative (or <= 0), advances to the next available bus arrival (NextBus2,
 * NextBus3, or next projected arrival) so that the user's departure timer is strictly
 * in the positive (> 0 minutes).
 */
export function advanceArrivalsToPositive(
  arrival: BusServiceArrival,
  walkMinutes: number,
  bufferMinutes: number = 1
): { updatedArrival: BusServiceArrival; shifted: boolean; activeBus: NextBusArrival } {
  const totalWalkAndBufferSec = (walkMinutes + bufferMinutes) * 60;
  const now = Date.now();

  const getSecs = (bus?: NextBusArrival) => {
    if (!bus) return -1;
    return bus.arrivalSeconds ?? bus.arrivalMinutes * 60;
  };

  const getLeaveSecs = (bus?: NextBusArrival) => {
    if (!bus) return -9999;
    return getSecs(bus) - totalWalkAndBufferSec;
  };

  const bus1 = arrival.nextBus;
  const bus2 = arrival.nextBus2;
  const bus3 = arrival.nextBus3;

  // If nextBus departure is already strictly positive (> 0), no need to advance
  if (bus1 && getLeaveSecs(bus1) > 0) {
    return {
      updatedArrival: arrival,
      shifted: false,
      activeBus: bus1
    };
  }

  // NextBus departure has passed or is non-positive (leaveInSec <= 0).
  // Check if NextBus2 has positive leave time (> 0)
  if (bus2 && getLeaveSecs(bus2) > 0) {
    const nextArrMin = bus2.arrivalMinutes + 10;
    const newBus3: NextBusArrival = bus3 && getLeaveSecs(bus3) > 0 ? bus3 : {
      estimatedArrival: new Date(now + nextArrMin * 60000).toISOString(),
      arrivalMinutes: nextArrMin,
      arrivalSeconds: nextArrMin * 60,
      load: 'SEA',
      feature: 'WAB',
      type: 'DD'
    };

    const next3ArrMin = nextArrMin + 11;
    const synthesizedBus4: NextBusArrival = {
      estimatedArrival: new Date(now + next3ArrMin * 60000).toISOString(),
      arrivalMinutes: next3ArrMin,
      arrivalSeconds: next3ArrMin * 60,
      load: 'SEA',
      feature: 'WAB',
      type: 'SD'
    };

    const updatedArrival: BusServiceArrival = {
      ...arrival,
      nextBus: bus2,
      nextBus2: newBus3,
      nextBus3: synthesizedBus4
    };

    return {
      updatedArrival,
      shifted: true,
      activeBus: bus2
    };
  }

  // Check if NextBus3 has positive leave time (> 0)
  if (bus3 && getLeaveSecs(bus3) > 0) {
    const nextArrMin = bus3.arrivalMinutes + 10;
    const newBus2: NextBusArrival = {
      estimatedArrival: new Date(now + nextArrMin * 60000).toISOString(),
      arrivalMinutes: nextArrMin,
      arrivalSeconds: nextArrMin * 60,
      load: 'SEA',
      feature: 'WAB',
      type: 'DD'
    };
    const next3ArrMin = nextArrMin + 12;
    const newBus3: NextBusArrival = {
      estimatedArrival: new Date(now + next3ArrMin * 60000).toISOString(),
      arrivalMinutes: next3ArrMin,
      arrivalSeconds: next3ArrMin * 60,
      load: 'SEA',
      feature: 'WAB',
      type: 'SD'
    };

    const updatedArrival: BusServiceArrival = {
      ...arrival,
      nextBus: bus3,
      nextBus2: newBus2,
      nextBus3: newBus3
    };

    return {
      updatedArrival,
      shifted: true,
      activeBus: bus3
    };
  }

  // If even bus3 is not positive or unavailable, project the next available arrival
  // ensuring the user has ample positive minutes to leave (e.g. 5-7 minutes leave time)
  const safeLeaveMins = 6;
  const safeArrivalMins = walkMinutes + bufferMinutes + safeLeaveMins;
  const safeArrivalSecs = safeArrivalMins * 60;

  const positiveBus: NextBusArrival = {
    estimatedArrival: new Date(now + safeArrivalSecs * 1000).toISOString(),
    arrivalMinutes: safeArrivalMins,
    arrivalSeconds: safeArrivalSecs,
    load: 'SEA',
    feature: 'WAB',
    type: 'DD'
  };

  const positiveBus2Min = safeArrivalMins + 10;
  const positiveBus2: NextBusArrival = {
    estimatedArrival: new Date(now + positiveBus2Min * 60000).toISOString(),
    arrivalMinutes: positiveBus2Min,
    arrivalSeconds: positiveBus2Min * 60,
    load: 'SEA',
    feature: 'WAB',
    type: 'DD'
  };

  const positiveBus3Min = positiveBus2Min + 12;
  const positiveBus3: NextBusArrival = {
    estimatedArrival: new Date(now + positiveBus3Min * 60000).toISOString(),
    arrivalMinutes: positiveBus3Min,
    arrivalSeconds: positiveBus3Min * 60,
    load: 'SEA',
    feature: 'WAB',
    type: 'SD'
  };

  const updatedArrival: BusServiceArrival = {
    ...arrival,
    nextBus: positiveBus,
    nextBus2: positiveBus2,
    nextBus3: positiveBus3
  };

  return {
    updatedArrival,
    shifted: true,
    activeBus: positiveBus
  };
}

/**
 * Generate simulated dynamic arrivals for a bus stop that tick realistically
 * with current wall-clock seconds.
 */
export function generateRealtimeArrivals(
  busStopCode: string,
  serviceNumbers: string[]
): Record<string, BusServiceArrival> {
  const result: Record<string, BusServiceArrival> = {};
  const now = Date.now();
  const currentMinute = new Date().getMinutes();
  const currentSecond = new Date().getSeconds();

  serviceNumbers.forEach((svc, index) => {
    // Generate deterministic yet living pseudo-random ETA based on service & bus stop
    const hash = (busStopCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + svc.charCodeAt(0) * 7 + index * 11) % 60;
    
    // Cycle between 1 and 16 minutes
    const cycleOffset = (currentMinute + hash) % 15;
    const baseMinutes = (15 - cycleOffset) || 12;
    const arrivalSeconds = Math.max(15, baseMinutes * 60 - currentSecond);
    const arrivalMinutes = Math.floor(arrivalSeconds / 60);

    // Next bus 2
    const next2Minutes = arrivalMinutes + 8 + ((hash % 4));
    // Next bus 3
    const next3Minutes = next2Minutes + 10 + ((hash % 5));

    const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SDA', 'LSD'];
    const load1 = loads[(hash + currentMinute) % loads.length];
    const load2 = loads[(hash + currentMinute + 1) % loads.length];
    const load3 = loads[(hash + currentMinute + 2) % loads.length];

    const types: ('SD' | 'DD' | 'BD')[] = ['DD', 'DD', 'SD', 'DD'];
    const type1 = types[(hash + svc.length) % types.length];
    const type2 = types[(hash + svc.length + 1) % types.length];

    result[svc] = {
      serviceNo: svc,
      operator: ['65', '16', '147', '36', '10', '14'].includes(svc) ? 'SBST' : 'SMRT',
      inService: true,
      nextBus: {
        estimatedArrival: new Date(now + arrivalSeconds * 1000).toISOString(),
        arrivalMinutes,
        arrivalSeconds,
        load: load1,
        feature: 'WAB',
        type: type1
      },
      nextBus2: {
        estimatedArrival: new Date(now + next2Minutes * 60000).toISOString(),
        arrivalMinutes: next2Minutes,
        load: load2,
        feature: 'WAB',
        type: type2
      },
      nextBus3: {
        estimatedArrival: new Date(now + next3Minutes * 60000).toISOString(),
        arrivalMinutes: next3Minutes,
        load: load3,
        feature: 'WAB',
        type: 'DD'
      }
    };
  });

  return result;
}

/**
 * Determine Singapore district from coordinates
 */
export function getDistrictFromCoords(lat: number, lng: number): 'Central' | 'East' | 'West' | 'North' {
  if (lng > 103.89) return 'East';
  if (lng < 103.78) return 'West';
  if (lat > 1.35) return 'North';
  return 'Central';
}

/**
 * Get weather for coordinates
 */
export function getWeatherForLocation(lat: number, lng: number): WeatherInfo {
  const district = getDistrictFromCoords(lat, lng);
  return SINGAPORE_DISTRICT_WEATHER[district] || SINGAPORE_DISTRICT_WEATHER.Central;
}

/**
 * Initial Default Saved Routes for a first-time user
 */
export const DEFAULT_SAVED_ROUTES: SavedRoute[] = [
  {
    id: 'sr-dhoby-ghaut',
    busStopCode: '08057',
    busStopName: 'Dhoby Ghaut Stn',
    roadName: 'Orchard Rd',
    lat: 1.2993,
    lng: 103.8453,
    selectedBuses: ['65', '190', '16', '175'],
    customTag: 'Downtown Hub',
    walkingSpeed: 'normal',
    manualWalkMinutes: 4,
    alertMinutesBeforeLeave: 3,
    isPinned: true,
    createdAt: Date.now() - 100000
  },
  {
    id: 'sr-somerset',
    busStopCode: '09022',
    busStopName: 'Opp 313@Somerset',
    roadName: 'Orchard Rd',
    lat: 1.3009,
    lng: 103.8385,
    selectedBuses: ['65', '14', '106'],
    customTag: 'Shopping & Dining',
    walkingSpeed: 'normal',
    manualWalkMinutes: 6,
    alertMinutesBeforeLeave: 3,
    isPinned: false,
    createdAt: Date.now() - 80000
  },
  {
    id: 'sr-tampines',
    busStopCode: '75009',
    busStopName: 'Tampines Bus Interchange',
    roadName: 'Tampines Ave 4',
    lat: 1.3532,
    lng: 103.9452,
    selectedBuses: ['65', '67', '10', '291'],
    customTag: 'East Hub / Home',
    walkingSpeed: 'normal',
    manualWalkMinutes: 7,
    alertMinutesBeforeLeave: 4,
    isPinned: false,
    createdAt: Date.now() - 60000
  },
  {
    id: 'sr-tampines-north-75541',
    busStopCode: '75541',
    busStopName: 'Opp Blk 648A',
    roadName: 'Tampines St 62',
    lat: 1.368309,
    lng: 103.941523,
    selectedBuses: ['298', '454'],
    customTag: 'Tampines North (LTA DataMall)',
    walkingSpeed: 'normal',
    manualWalkMinutes: 3,
    alertMinutesBeforeLeave: 3,
    isPinned: true,
    createdAt: Date.now() - 50000
  },
  {
    id: 'sr-jurong-east',
    busStopCode: '28009',
    busStopName: 'Jurong East Bus Interchange',
    roadName: 'Jurong Gateway Rd',
    lat: 1.3336,
    lng: 103.7423,
    selectedBuses: ['51', '97', '143', '197'],
    customTag: 'West Terminal',
    walkingSpeed: 'normal',
    manualWalkMinutes: 5,
    alertMinutesBeforeLeave: 3,
    isPinned: false,
    createdAt: Date.now() - 40000
  }
];

export const STORAGE_KEYS = {
  SAVED_ROUTES: 'catchbus_sg_saved_routes_v1',
  SETTINGS: 'catchbus_sg_settings_v1',
  USER_LOCATION: 'catchbus_sg_user_loc_v1',
  NOTIFICATIONS_ACTIVE: 'catchbus_sg_notifications_v1',
  RAIN_ALERTS_ACTIVE: 'catchbus_sg_rain_alert_v1',
  THEME: 'catchbus_sg_theme_v1'
};
