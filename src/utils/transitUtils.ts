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

/**
 * Compute the "When to Leave" status & next option
 */
export function calculateLeaveStatus(
  serviceNo: string,
  busStopCode: string,
  firstArrival: NextBusArrival | undefined,
  secondArrival: NextBusArrival | undefined,
  walkMinutes: number,
  bufferMinutes: number = 1
): LeaveCalculation {
  const now = new Date();
  const arrivalMin = firstArrival?.arrivalMinutes ?? 12;
  const arrivalSec = firstArrival?.arrivalSeconds ?? arrivalMin * 60;

  const totalWalkAndBufferSec = (walkMinutes + bufferMinutes) * 60;
  const leaveInSec = arrivalSec - totalWalkAndBufferSec;
  const leaveInMin = Math.round(leaveInSec / 60);

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
    urgencyLabel = 'Missed — Wait for next';
  }

  // Next option bus
  let nextOption: LeaveCalculation['nextOption'] = undefined;
  if (secondArrival) {
    const nextArrMin = secondArrival.arrivalMinutes;
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
      load: secondArrival.load
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
