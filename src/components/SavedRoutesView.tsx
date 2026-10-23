import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Clock, 
  Bell, 
  BellRing, 
  Navigation, 
  Trash2, 
  Plus, 
  Sliders, 
  Bookmark, 
  BookmarkCheck, 
  Eye, 
  Accessibility, 
  Compass, 
  Footprints,
  Sparkles
} from 'lucide-react';
import { SavedRoute, BusServiceArrival, NextBusArrival, LeaveCalculation, BusLoad } from '../types/transit';
import { calculateDistanceMeters, formatDistance, calculateWalkMinutes, calculateLeaveStatus } from '../utils/transitUtils';

interface SavedRoutesViewProps {
  savedRoutes: SavedRoute[];
  userCoords: { lat: number; lng: number };
  arrivalsData: Record<string, Record<string, BusServiceArrival>>; // [busStopCode][serviceNo]
  activeDepartureAlerts: string[]; // routeId_serviceNo
  onToggleDepartureAlert: (route: SavedRoute, serviceNo: string, leaveCalc: LeaveCalculation) => void;
  onPeekRoute: (serviceNo: string, busStopCode: string) => void;
  onEditBusesForStop: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: string) => void;
  onTogglePinRoute: (routeId: string) => void;
  onOpenSearch: () => void;
  onSelectPrimaryBus: (serviceNo: string, busStopCode: string, busStopName: string, leaveCalc: LeaveCalculation, nextBus?: NextBusArrival) => void;
}

export const SavedRoutesView: React.FC<SavedRoutesViewProps> = ({
  savedRoutes,
  userCoords,
  arrivalsData,
  activeDepartureAlerts,
  onToggleDepartureAlert,
  onPeekRoute,
  onEditBusesForStop,
  onDeleteRoute,
  onTogglePinRoute,
  onOpenSearch,
  onSelectPrimaryBus
}) => {
  const [filterMode, setFilterMode] = useState<'near' | 'all'>('near');
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState<string | null>(null);

  const routesWithDistance = savedRoutes.map((route) => {
    const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, route.lat, route.lng);
    return {
      ...route,
      distanceMeters: dist,
      isNear: dist <= 2000
    };
  });

  const nearRoutes = routesWithDistance.filter((r) => r.isNear);
  const displayedRoutes = filterMode === 'near' ? nearRoutes : routesWithDistance;

  const handlePointerDown = (serviceNo: string, busStopCode: string) => {
    setIsPressing(`${busStopCode}-${serviceNo}`);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onPeekRoute(serviceNo, busStopCode);
      setIsPressing(null);
    }, 450);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(null);
  };

  const getLoadBadge = (load?: BusLoad) => {
    switch (load) {
      case 'SEA':
        return (
          <span className="text-[10px] font-black clay-badge-mint px-2 py-0.5">
            Seats Available
          </span>
        );
      case 'SDA':
        return (
          <span className="text-[10px] font-black clay-badge-lavender px-2 py-0.5">
            Standing Only
          </span>
        );
      case 'LSD':
        return (
          <span className="text-[10px] font-black clay-badge-pink px-2 py-0.5">
            Crowded
          </span>
        );
      default:
        return null;
    }
  };

  const getBusColorClass = (idx: number) => {
    const mod = idx % 3;
    if (mod === 0) return 'clay-bus-mint';
    if (mod === 1) return 'clay-bus-pink';
    return 'clay-bus-lavender';
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Bar: 3D Pill Segmented Controls & Route Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 3D Pill Segmented Control */}
          <div className="flex items-center gap-2 p-1.5 clay-inset-pill">
            <button
              onClick={() => setFilterMode('near')}
              className={`px-4 py-2 text-xs font-black rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                filterMode === 'near'
                  ? 'clay-btn-mint shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Near Me (≤ 2 km)</span>
              <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                filterMode === 'near' ? 'bg-white/20 text-white' : 'clay-pill-white text-slate-700'
              }`}>
                {nearRoutes.length}
              </span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 text-xs font-black rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                filterMode === 'all'
                  ? 'clay-btn-lavender shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Saved Stops</span>
              <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                filterMode === 'all' ? 'bg-white/20 text-white' : 'clay-pill-white text-slate-700'
              }`}>
                {savedRoutes.length}
              </span>
            </button>
          </div>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-4 py-2.5 clay-btn-pink text-xs font-black shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bus Stop</span>
          </button>
        </div>

        {/* Horizontal Scroll of Saved Stops */}
        {savedRoutes.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] text-purple-600/70 font-black uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <span>Stops</span>
              <Sparkles className="w-2.5 h-2.5" />
            </span>
            {savedRoutes.map((r, idx) => {
              const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, r.lat, r.lng);
              const isNear = dist <= 2000;
              const isSelected = activeStopId === r.id;

              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveStopId(isSelected ? null : r.id);
                    const el = document.getElementById(`stop-card-${r.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'clay-btn-lavender shadow-md'
                      : isNear
                      ? 'clay-pill-white text-slate-800'
                      : 'clay-inset text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isNear ? 'text-pink-500' : 'text-slate-400'}`} />
                  <span className="truncate max-w-[130px]">{r.busStopName}</span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {formatDistance(dist)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {displayedRoutes.length === 0 && (
        <div className="clay-card p-8 sm:p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full clay-pill-white text-purple-500 flex items-center justify-center mx-auto shadow-md">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800">
              {filterMode === 'near' ? 'No Saved Stops within 2 km 📍' : 'No Saved Stops Yet 🚌'}
            </h4>
            <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto mt-1.5">
              {filterMode === 'near'
                ? `Closest saved stop is ${formatDistance(
                    Math.min(...routesWithDistance.map((r) => r.distanceMeters), 99999)
                  )} away. Switch to "All Saved Stops" or search for a nearby Singapore bus stop.`
                : 'Search for any Singapore bus stop or service to track departure countdowns and walk times.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {filterMode === 'near' && savedRoutes.length > 0 && (
              <button
                onClick={() => setFilterMode('all')}
                className="px-4 py-2.5 clay-pill-white text-slate-700 text-xs font-black cursor-pointer"
              >
                View All {savedRoutes.length} Stops
              </button>
            )}
            <button
              onClick={onOpenSearch}
              className="px-5 py-2.5 clay-btn-mint text-white text-xs font-black cursor-pointer shadow-md"
            >
              Search & Add Stop
            </button>
          </div>
        </div>
      )}

      {/* List of Bus Stop Cards in Cute Claymorphism Style */}
      <div className="space-y-5">
        {displayedRoutes.map((route, routeIdx) => {
          const walkMins = calculateWalkMinutes(
            route.distanceMeters,
            route.walkingSpeed,
            route.manualWalkMinutes
          );
          const stopArrivals = arrivalsData[route.busStopCode] || {};

          return (
            <div
              key={route.id}
              id={`stop-card-${route.id}`}
              className={`clay-card overflow-hidden transition-all duration-200 ${
                route.isPinned ? 'ring-3 ring-purple-300/60' : ''
              }`}
            >
              {/* Bus Stop Header */}
              <div className="p-4 sm:p-5 border-b border-purple-100/50 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-black clay-inset px-2.5 py-0.5 text-purple-700">
                      #{route.busStopCode}
                    </span>
                    <h3 className="text-base font-black text-slate-800 truncate">
                      {route.busStopName}
                    </h3>
                    {route.customTag && (
                      <span className="text-[10px] font-black clay-badge-pink px-2.5 py-0.5">
                        {route.customTag}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1 flex-wrap">
                    <span className="truncate">{route.roadName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-700 font-extrabold flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatDistance(route.distanceMeters)} ({walkMins} min walk)</span>
                    </span>
                    {route.isNear && (
                      <span className="text-[10px] font-black clay-badge-mint px-2 py-0.2">
                        Within 2km
                      </span>
                    )}
                  </div>
                </div>

                {/* Stop Card Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onEditBusesForStop(route)}
                    title="Change selected buses"
                    className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-600 hover:text-purple-600 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onTogglePinRoute(route.id)}
                    title={route.isPinned ? 'Unpin' : 'Pin to top'}
                    className={`w-8 h-8 clay-icon-btn flex items-center justify-center cursor-pointer ${
                      route.isPinned ? 'text-pink-600' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {route.isPinned ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDeleteRoute(route.id)}
                    title="Remove stop"
                    className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-pink-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Buses Grid / Rows */}
              <div className="p-3 sm:p-5 divide-y divide-purple-100/40">
                {route.selectedBuses.length === 0 ? (
                  <div className="text-center py-5 text-xs font-bold text-slate-400">
                    No buses selected. Tap the sliders icon to choose buses to track.
                  </div>
                ) : (
                  route.selectedBuses.map((serviceNo, busIdx) => {
                    const arrivalInfo = stopArrivals[serviceNo];
                    const nextBus1 = arrivalInfo?.nextBus;
                    const nextBus2 = arrivalInfo?.nextBus2;

                    const leaveCalc = calculateLeaveStatus(
                      serviceNo,
                      route.busStopCode,
                      nextBus1,
                      nextBus2,
                      walkMins,
                      1,
                      arrivalInfo?.nextBus3,
                      false
                    );

                    const alertKey = `${route.id}_${serviceNo}`;
                    const isAlertActive = activeDepartureAlerts.includes(alertKey);
                    const pressingKey = `${route.busStopCode}-${serviceNo}`;

                    return (
                      <div
                        key={serviceNo}
                        onPointerDown={() => handlePointerDown(serviceNo, route.busStopCode)}
                        onPointerUp={handlePointerUpOrLeave}
                        onPointerLeave={handlePointerUpOrLeave}
                        className={`py-3.5 first:pt-1 last:pb-1 transition-all rounded-[20px] select-none ${
                          isPressing === pressingKey ? 'bg-purple-100/40 scale-[0.99]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Bus Badge & Info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${getBusColorClass(busIdx)} flex items-center justify-center font-black text-base shrink-0 shadow-md`}>
                              {serviceNo}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">
                                  Bus {serviceNo}
                                </span>
                                {nextBus1?.type && (
                                  <span className="text-[10px] font-mono font-bold clay-inset px-1.5 py-0.2 text-slate-500">
                                    {nextBus1.type}
                                  </span>
                                )}
                                {nextBus1?.feature === 'WAB' && (
                                  <span title="Wheelchair Accessible">
                                    <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-extrabold text-slate-700">
                                  {nextBus1 ? `Arr in ${nextBus1.arrivalMinutes}m` : 'Arriving soon'}
                                </span>
                                {getLoadBadge(nextBus1?.load)}
                              </div>
                            </div>
                          </div>

                          {/* Right: When To Leave 3D Bento Pill */}
                          <div className="text-right shrink-0">
                            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                              Departure
                            </div>
                            <div className="text-sm font-black font-mono tabular-nums">
                              {leaveCalc.leaveInMinutes <= 0 ? (
                                <span className="clay-badge-pink px-2.5 py-0.5 inline-block font-black text-pink-700">
                                  Leave in 0m (NOW!)
                                </span>
                              ) : (
                                <span className="clay-badge-mint px-2.5 py-0.5 inline-block font-black text-emerald-700">
                                  Leave in {leaveCalc.leaveInMinutes} mins
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-slate-500 font-mono mt-0.5">
                              By {leaveCalc.leaveByTimeFormatted}
                            </div>
                          </div>
                        </div>

                        {/* Subsequent Bus (Next Option) & Action Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-purple-100/50 flex items-center justify-between gap-2 text-xs">
                          {/* Next Option Info */}
                          <div className="min-w-0 text-[11px] font-bold text-slate-500 truncate flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            {leaveCalc.nextOption ? (
                              <span className="truncate">
                                Subsequent: <strong className="text-slate-800">in {leaveCalc.nextOption.arrivalMinutes}m</strong> (Leave in {leaveCalc.nextOption.leaveInMinutes}m)
                              </span>
                            ) : (
                              <span>Subsequent bus in ~15 mins</span>
                            )}
                          </div>

                          {/* Actions: Pin to Live Activity, Departure Alert, Peek */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPrimaryBus(serviceNo, route.busStopCode, route.busStopName, leaveCalc, nextBus1);
                              }}
                              title="Pin to Live Activity / Dynamic Island"
                              className="w-7 h-7 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-purple-600 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDepartureAlert(route, serviceNo, leaveCalc);
                              }}
                              title={isAlertActive ? 'Departure alert active' : 'Set departure alert'}
                              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                                isAlertActive
                                  ? 'clay-btn-pink shadow-xs'
                                  : 'clay-pill-white text-slate-600 hover:text-pink-600'
                              }`}
                            >
                              {isAlertActive ? (
                                <>
                                  <BellRing className="w-3 h-3 text-white animate-bounce" />
                                  <span>Alert On</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3 h-3 text-slate-400" />
                                  <span className="hidden sm:inline">Alert</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPeekRoute(serviceNo, route.busStopCode);
                              }}
                              className="px-3 py-1 rounded-full clay-pill-white text-slate-600 hover:text-purple-600 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Long press or tap to peek full route"
                            >
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span className="hidden sm:inline">Route</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
