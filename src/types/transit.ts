export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Decker, Double Decker, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface NextBusArrival {
  estimatedArrival: string; // ISO timestamp
  arrivalMinutes: number; // e.g. 3, 0 = Arr
  arrivalSeconds?: number;
  load: BusLoad;
  feature: 'WAB' | ''; // Wheelchair Accessible Bus
  type: BusType;
  latitude?: number;
  longitude?: number;
  visitNumber?: number;
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: BusOperator;
  nextBus?: NextBusArrival;
  nextBus2?: NextBusArrival;
  nextBus3?: NextBusArrival;
  inService: boolean;
}

export interface BusStop {
  id: string; // 5-digit code, e.g. "08057"
  name: string; // e.g. "Dhoby Ghaut Stn"
  road: string; // e.g. "Orchard Rd"
  lat: number;
  lng: number;
  services: string[];
  distanceMeters?: number;
}

export interface SavedRoute {
  id: string;
  busStopCode: string;
  busStopName: string;
  roadName: string;
  lat: number;
  lng: number;
  selectedBuses: string[]; // User can track multiple buses at this stop
  customTag?: string; // e.g. "Office", "Home", "Gym"
  walkingSpeed: 'slow' | 'normal' | 'brisk'; // 70m/min, 85m/min, 105m/min
  manualWalkMinutes?: number; // User override if preferred
  alertMinutesBeforeLeave: number; // e.g. 3 mins
  isPinned?: boolean;
  createdAt: number;
}

export interface LeaveCalculation {
  serviceNo: string;
  busStopCode: string;
  busArrivalMinutes: number;
  walkingMinutes: number;
  bufferMinutes: number;
  leaveInMinutes: number; // busArrivalMinutes - walkingMinutes - bufferMinutes
  leaveInSeconds: number;
  leaveByTimeFormatted: string; // e.g. "1:15 PM"
  urgency: 'plenty' | 'soon' | 'leave_now' | 'hurry' | 'missed';
  urgencyLabel: string;
  nextOption?: {
    arrivalMinutes: number;
    leaveInMinutes: number;
    leaveByTimeFormatted: string;
    load?: BusLoad;
  };
}

export interface WeatherInfo {
  area: string;
  temperature: number; // °C
  condition: string; // e.g. "Partly Cloudy", "Thundery Showers", "Fair"
  conditionIcon: string;
  humidity: number;
  windSpeed: string;
  inOneHour: {
    condition: string;
    conditionIcon: string;
    temperature: number;
    rainProbability: number; // percentage 0-100
  };
  umbrellaAdvice: {
    bringUmbrella: boolean;
    reason: string;
    adviceBadge: string;
  };
  rainAlert: {
    imminent: boolean;
    startsInMinutes?: number;
    message?: string;
  };
}

export interface BusRouteStop {
  stopSeq: number;
  busStopCode: string;
  busStopName: string;
  roadName: string;
  distanceKm: number;
  isOrigin?: boolean;
  isDestination?: boolean;
  isCurrentStop?: boolean;
  estimatedArrivalMin?: number;
}

export interface BusRouteDetail {
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  originCode: string;
  originName: string;
  destCode: string;
  destName: string;
  firstBus: string;
  lastBus: string;
  peakFreq: string;
  offPeakFreq: string;
  stops: BusRouteStop[];
}

export interface DepartureAlert {
  id: string;
  busStopCode: string;
  busStopName: string;
  serviceNo: string;
  targetLeaveTimestamp: number;
  minutesNotice: number;
  hasFired: boolean;
}

export type ThemePalette = 'pastel' | 'ocean' | 'dark';

