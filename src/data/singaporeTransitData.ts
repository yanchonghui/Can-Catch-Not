import { BusStop, BusRouteDetail, BusServiceArrival, WeatherInfo } from '../types/transit';

export const SINGAPORE_BUS_STOPS: BusStop[] = [
  // Central / Orchard / Civic District
  {
    id: '08057',
    name: 'Dhoby Ghaut Stn',
    road: 'Orchard Rd',
    lat: 1.2993,
    lng: 103.8453,
    services: ['16', '16M', '36', '65', '77', '106', '111', '124', '162', '167', '174', '175', '190', '857']
  },
  {
    id: '09048',
    name: 'Orchard Stn / Lucky Plaza',
    road: 'Orchard Rd',
    lat: 1.3039,
    lng: 103.8341,
    services: ['7', '14', '16', '65', '106', '111', '123', '175', '502']
  },
  {
    id: '09022',
    name: 'Opp 313@Somerset',
    road: 'Orchard Rd',
    lat: 1.3009,
    lng: 103.8385,
    services: ['7', '14', '16', '65', '106', '111', '123', '174', '175']
  },
  {
    id: '01112',
    name: 'Bugis Stn Exit A',
    road: 'Victoria St',
    lat: 1.3006,
    lng: 103.8561,
    services: ['2', '12', '33', '130', '133', '960', '980']
  },
  {
    id: '01119',
    name: 'Bugis Junction',
    road: 'Victoria St',
    lat: 1.3001,
    lng: 103.8553,
    services: ['2', '12', '32', '33', '51', '61', '63', '80', '145', '175', '197']
  },
  {
    id: '04121',
    name: 'City Hall Stn Exit B',
    road: 'Nth Bridge Rd',
    lat: 1.2929,
    lng: 103.8519,
    services: ['61', '124', '145', '166', '174', '197']
  },
  {
    id: '03019',
    name: 'Fullerton Sq / Raffles Place',
    road: 'Fullerton Rd',
    lat: 1.2863,
    lng: 103.8530,
    services: ['10', '70', '100', '107', '130', '131', '167', '196']
  },
  {
    id: '03211',
    name: 'Suntec City / Promenade Stn',
    road: 'Temasek Blvd',
    lat: 1.2952,
    lng: 103.8588,
    services: ['36', '56', '70M', '97', '106', '111', '133', '502', '518']
  },
  {
    id: '05013',
    name: 'Chinatown Stn Exit E',
    road: 'Eu Tong Sen St',
    lat: 1.2849,
    lng: 103.8441,
    services: ['2', '12', '33', '54', '143', '147', '190', '851', '970']
  },
  {
    id: '04179',
    name: 'SMU / Bras Basah Stn',
    road: 'Bras Basah Rd',
    lat: 1.2971,
    lng: 103.8505,
    services: ['7', '14', '16', '36', '77', '106', '111', '131', '167', '175']
  },
  {
    id: '10169',
    name: 'VivoCity / HarbourFront Stn',
    road: 'Telok Blangah Rd',
    lat: 1.2647,
    lng: 103.8227,
    services: ['10', '30', '57', '61', '65', '80', '97', '100', '131', '143', '145', '166']
  },

  // East / Tampines / Bedok / Changi
  {
    id: '75009',
    name: 'Tampines Bus Interchange',
    road: 'Tampines Ave 4',
    lat: 1.3532,
    lng: 103.9452,
    services: ['3', '4', '8', '10', '19', '20', '23', '28', '29', '31', '65', '67', '291', '293']
  },
  {
    id: '76191',
    name: 'Tampines West Stn',
    road: 'Tampines Ave 4',
    lat: 1.3456,
    lng: 103.9378,
    services: ['22', '46', '65', '67', '118', '129']
  },
  {
    id: '84009',
    name: 'Bedok Bus Interchange',
    road: 'Bedok Nth Dr',
    lat: 1.3241,
    lng: 103.9300,
    services: ['7', '9', '14', '16', '17', '18', '25', '26', '30', '32', '33', '35', '40', '60', '66', '69', '87', '168', '196', '197', '222']
  },
  {
    id: '95029',
    name: 'Changi Airport Terminal 1',
    road: 'PTB1 Basement',
    lat: 1.3601,
    lng: 103.9898,
    services: ['24', '27', '34', '36', '53', '110', '858']
  },

  // West / Jurong East / Clementi / Buona Vista / NUS
  {
    id: '28009',
    name: 'Jurong East Bus Interchange',
    road: 'Jurong Gateway Rd',
    lat: 1.3336,
    lng: 103.7423,
    services: ['41', '49', '51', '52', '66', '78', '79', '97', '98', '105', '143', '160', '183', '197', '333', '334', '335', '506']
  },
  {
    id: '17179',
    name: 'Clementi Stn Exit A',
    road: 'Clementi Ave 3',
    lat: 1.3151,
    lng: 103.7652,
    services: ['52', '96', '99', '147', '156', '165', '166', '175', '196', '285']
  },
  {
    id: '11361',
    name: 'Buona Vista Stn Exit C',
    road: 'Nth Buona Vista Rd',
    lat: 1.3069,
    lng: 103.7906,
    services: ['74', '91', '92', '95', '191', '196', '198', '200']
  },
  {
    id: '16189',
    name: 'University Town (UTown)',
    road: 'College Link',
    lat: 1.3042,
    lng: 103.7725,
    services: ['96', '151', '154', '196']
  },

  // North / Bishan / AMK / Woodlands / Yishun
  {
    id: '53009',
    name: 'Bishan Bus Interchange',
    road: 'Bishan St 13',
    lat: 1.3503,
    lng: 103.8496,
    services: ['50', '52', '53', '54', '55', '56', '57', '58', '59', '410G', '410W']
  },
  {
    id: '54009',
    name: 'Ang Mo Kio Bus Interchange',
    road: 'AMK Ave 8',
    lat: 1.3698,
    lng: 103.8493,
    services: ['22', '24', '25', '73', '86', '130', '133', '135', '136', '138', '166', '169', '261', '262', '265', '269']
  },
  {
    id: '46009',
    name: 'Woodlands Integrated Transport Hub',
    road: 'Woodlands Sq',
    lat: 1.4371,
    lng: 103.7865,
    services: ['161', '168', '169', '178', '187', '856', '900', '901', '903', '911', '912', '913', '925', '960', '961', '962', '963', '964', '965', '966', '969']
  },
  {
    id: '59009',
    name: 'Yishun Bus Interchange',
    road: 'Yishun Ave 2',
    lat: 1.4296,
    lng: 103.8351,
    services: ['39', '85', '171', '800', '803', '804', '805', '806', '807', '811', '812', '851', '852', '853', '854', '855', '857', '858', '860']
  }
];

export const POPULAR_ROUTES: Record<string, BusRouteDetail> = {
  '65': {
    serviceNo: '65',
    operator: 'SBST',
    direction: 1,
    originCode: '75009',
    originName: 'Tampines Int',
    destCode: '10169',
    destName: 'HarbourFront Int',
    firstBus: '05:30',
    lastBus: '23:45',
    peakFreq: '6 - 9 mins',
    offPeakFreq: '8 - 12 mins',
    stops: [
      { stopSeq: 1, busStopCode: '75009', busStopName: 'Tampines Int', roadName: 'Tampines Ave 4', distanceKm: 0.0, isOrigin: true },
      { stopSeq: 2, busStopCode: '76191', busStopName: 'Tampines West Stn', roadName: 'Tampines Ave 4', distanceKm: 1.2 },
      { stopSeq: 3, busStopCode: '75041', busStopName: 'Opp Tampines Stadium', roadName: 'Tampines Ave 5', distanceKm: 2.1 },
      { stopSeq: 4, busStopCode: '72061', busStopName: 'Bedok Reservoir Stn', roadName: 'Bedok Reservoir Rd', distanceKm: 4.3 },
      { stopSeq: 5, busStopCode: '71071', busStopName: 'Kaki Bukit Stn', roadName: 'Kaki Bukit Ave 1', distanceKm: 6.8 },
      { stopSeq: 6, busStopCode: '70251', busStopName: 'MacPherson Stn Exit A', roadName: 'Paya Lebar Rd', distanceKm: 8.9 },
      { stopSeq: 7, busStopCode: '60111', busStopName: 'Boon Keng Stn', roadName: 'Serangoon Rd', distanceKm: 11.5 },
      { stopSeq: 8, busStopCode: '07229', busStopName: 'Little India Stn', roadName: 'Bukit Timah Rd', distanceKm: 13.2 },
      { stopSeq: 9, busStopCode: '08057', busStopName: 'Dhoby Ghaut Stn', roadName: 'Orchard Rd', distanceKm: 14.8, isCurrentStop: true },
      { stopSeq: 10, busStopCode: '09022', busStopName: 'Opp 313@Somerset', roadName: 'Orchard Rd', distanceKm: 15.6 },
      { stopSeq: 11, busStopCode: '09048', busStopName: 'Orchard Stn / Lucky Plaza', roadName: 'Orchard Rd', distanceKm: 16.5 },
      { stopSeq: 12, busStopCode: '13089', busStopName: 'Valley Point Condo', roadName: 'River Valley Rd', distanceKm: 18.2 },
      { stopSeq: 13, busStopCode: '10239', busStopName: 'Opp Radin Mas Community Club', roadName: 'Telok Blangah Way', distanceKm: 20.4 },
      { stopSeq: 14, busStopCode: '10169', busStopName: 'HarbourFront Int / VivoCity', roadName: 'Telok Blangah Rd', distanceKm: 22.1, isDestination: true }
    ]
  },
  '190': {
    serviceNo: '190',
    operator: 'SMRT',
    direction: 1,
    originCode: '44009',
    originName: 'Choa Chu Kang Int',
    destCode: '03229',
    destName: 'Marina Centre Ter',
    firstBus: '05:45',
    lastBus: '23:30',
    peakFreq: '4 - 7 mins',
    offPeakFreq: '7 - 10 mins',
    stops: [
      { stopSeq: 1, busStopCode: '44009', busStopName: 'Choa Chu Kang Int', roadName: 'Choa Chu Kang Ave 4', distanceKm: 0.0, isOrigin: true },
      { stopSeq: 2, busStopCode: '43009', busStopName: 'Bukit Panjang Integrated Transport Hub', roadName: 'Jelebu Rd', distanceKm: 5.6 },
      { stopSeq: 3, busStopCode: '42019', busStopName: 'The Rail Mall / Hillview', roadName: 'Upper Bukit Timah Rd', distanceKm: 8.4 },
      { stopSeq: 4, busStopCode: '08057', busStopName: 'Dhoby Ghaut Stn', roadName: 'Orchard Rd', distanceKm: 16.2, isCurrentStop: true },
      { stopSeq: 5, busStopCode: '05013', busStopName: 'Chinatown Stn Exit E', roadName: 'Eu Tong Sen St', distanceKm: 18.1 },
      { stopSeq: 6, busStopCode: '03019', busStopName: 'Fullerton Sq / Raffles Place', roadName: 'Fullerton Rd', distanceKm: 19.5 },
      { stopSeq: 7, busStopCode: '03229', busStopName: 'Marina Centre Ter', roadName: 'Raffles Ave', distanceKm: 21.0, isDestination: true }
    ]
  },
  '16': {
    serviceNo: '16',
    operator: 'SBST',
    direction: 1,
    originCode: '84009',
    originName: 'Bedok Int',
    destCode: '11009',
    destName: 'Bukit Merah Int',
    firstBus: '05:40',
    lastBus: '23:45',
    peakFreq: '6 - 10 mins',
    offPeakFreq: '10 - 14 mins',
    stops: [
      { stopSeq: 1, busStopCode: '84009', busStopName: 'Bedok Int', roadName: 'Bedok Nth Dr', distanceKm: 0.0, isOrigin: true },
      { stopSeq: 2, busStopCode: '83119', busStopName: 'Siglap Link', roadName: 'Marine Parade Rd', distanceKm: 3.2 },
      { stopSeq: 3, busStopCode: '91059', busStopName: 'Katong Shopping Centre', roadName: 'Mountbatten Rd', distanceKm: 6.8 },
      { stopSeq: 4, busStopCode: '08057', busStopName: 'Dhoby Ghaut Stn', roadName: 'Orchard Rd', distanceKm: 12.3, isCurrentStop: true },
      { stopSeq: 5, busStopCode: '09048', busStopName: 'Orchard Stn / Lucky Plaza', roadName: 'Orchard Rd', distanceKm: 13.9 },
      { stopSeq: 6, busStopCode: '11009', busStopName: 'Bukit Merah Int', roadName: 'Bukit Merah Central', distanceKm: 18.2, isDestination: true }
    ]
  },
  '147': {
    serviceNo: '147',
    operator: 'SBST',
    direction: 1,
    originCode: '17009',
    originName: 'Clementi Int',
    destCode: '66009',
    destName: 'Hougang Central Int',
    firstBus: '05:30',
    lastBus: '23:45',
    peakFreq: '5 - 8 mins',
    offPeakFreq: '7 - 11 mins',
    stops: [
      { stopSeq: 1, busStopCode: '17009', busStopName: 'Clementi Int', roadName: 'Clementi Ave 3', distanceKm: 0.0, isOrigin: true },
      { stopSeq: 2, busStopCode: '17179', busStopName: 'Clementi Stn Exit A', roadName: 'Clementi Ave 3', distanceKm: 0.5 },
      { stopSeq: 3, busStopCode: '16189', busStopName: 'University Town', roadName: 'Clementi Rd', distanceKm: 2.1 },
      { stopSeq: 4, busStopCode: '10169', busStopName: 'HarbourFront Stn / VivoCity', roadName: 'Telok Blangah Rd', distanceKm: 9.3 },
      { stopSeq: 5, busStopCode: '05013', busStopName: 'Chinatown Stn Exit E', roadName: 'Eu Tong Sen St', distanceKm: 13.8 },
      { stopSeq: 6, busStopCode: '01112', busStopName: 'Bugis Stn Exit A', roadName: 'Victoria St', distanceKm: 15.6 },
      { stopSeq: 7, busStopCode: '66009', busStopName: 'Hougang Central Int', roadName: 'Hougang Central', distanceKm: 24.5, isDestination: true }
    ]
  },
  '36': {
    serviceNo: '36',
    operator: 'SBST',
    direction: 1,
    originCode: '95029',
    originName: 'Changi Airport PTB1',
    destCode: '09048',
    destName: 'Tomlinson Rd / Orchard',
    firstBus: '06:00',
    lastBus: '23:58',
    peakFreq: '8 - 11 mins',
    offPeakFreq: '10 - 15 mins',
    stops: [
      { stopSeq: 1, busStopCode: '95029', busStopName: 'Changi Airport PTB1', roadName: 'Basement', distanceKm: 0.0, isOrigin: true },
      { stopSeq: 2, busStopCode: '91059', busStopName: 'Marine Parade Stn', roadName: 'Marine Parade Rd', distanceKm: 12.0 },
      { stopSeq: 3, busStopCode: '03211', busStopName: 'Suntec City / Promenade', roadName: 'Temasek Blvd', distanceKm: 17.5 },
      { stopSeq: 4, busStopCode: '08057', busStopName: 'Dhoby Ghaut Stn', roadName: 'Orchard Rd', distanceKm: 19.3, isCurrentStop: true },
      { stopSeq: 5, busStopCode: '09048', busStopName: 'Orchard Stn / Lucky Plaza', roadName: 'Orchard Rd', distanceKm: 21.0, isDestination: true }
    ]
  }
};

/**
 * Weather presets by Singapore district
 */
export const SINGAPORE_DISTRICT_WEATHER: Record<string, WeatherInfo> = {
  Central: {
    area: 'Central (Dhoby Ghaut & Orchard)',
    temperature: 30,
    condition: 'Partly Cloudy',
    conditionIcon: 'partly-cloudy',
    humidity: 78,
    windSpeed: '12 km/h S',
    inOneHour: {
      condition: 'Thundery Showers',
      conditionIcon: 'thunderstorm',
      temperature: 27,
      rainProbability: 85
    },
    umbrellaAdvice: {
      bringUmbrella: true,
      reason: 'Sudden tropical downpour expected in 40-50 minutes',
      adviceBadge: 'Bring Umbrella ☔'
    },
    rainAlert: {
      imminent: true,
      startsInMinutes: 45,
      message: 'Heavy rain cloud moving from Bukit Timah towards Central district.'
    }
  },
  East: {
    area: 'East (Tampines & Bedok)',
    temperature: 31,
    condition: 'Fair & Warm',
    conditionIcon: 'sun',
    humidity: 72,
    windSpeed: '14 km/h SE',
    inOneHour: {
      condition: 'Partly Cloudy',
      conditionIcon: 'partly-cloudy',
      temperature: 31,
      rainProbability: 20
    },
    umbrellaAdvice: {
      bringUmbrella: false,
      reason: 'Low rain risk within next hour, high UV sunlight',
      adviceBadge: 'No Umbrella Needed ☀️'
    },
    rainAlert: {
      imminent: false
    }
  },
  West: {
    area: 'West (Jurong East & Clementi)',
    temperature: 29,
    condition: 'Cloudy',
    conditionIcon: 'cloudy',
    humidity: 82,
    windSpeed: '8 km/h W',
    inOneHour: {
      condition: 'Light Showers',
      conditionIcon: 'rain',
      temperature: 28,
      rainProbability: 65
    },
    umbrellaAdvice: {
      bringUmbrella: true,
      reason: 'Light passing showers moving across Jurong basin in 30 mins',
      adviceBadge: 'Bring Umbrella ☂️'
    },
    rainAlert: {
      imminent: true,
      startsInMinutes: 30,
      message: 'Passing rain showers detected near Tuas & Jurong.'
    }
  },
  North: {
    area: 'North (Woodlands & Bishan)',
    temperature: 30,
    condition: 'Partly Cloudy',
    conditionIcon: 'partly-cloudy',
    humidity: 76,
    windSpeed: '10 km/h NE',
    inOneHour: {
      condition: 'Cloudy',
      conditionIcon: 'cloudy',
      temperature: 30,
      rainProbability: 35
    },
    umbrellaAdvice: {
      bringUmbrella: false,
      reason: 'Moderate cloud cover, low chance of rain',
      adviceBadge: 'Optional Umbrella ⛅'
    },
    rainAlert: {
      imminent: false
    }
  }
};
