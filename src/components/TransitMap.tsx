import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Navigation, 
  Compass, 
  Bus, 
  Footprints, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Check, 
  LocateFixed, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import { BusStop, ThemePalette } from '../types/transit';
import { BusStopWithDistance, formatDistance } from '../utils/transitUtils';

interface TransitMapProps {
  userCoords: { lat: number; lng: number };
  isGpsActive: boolean;
  onUseGps: () => void;
  nearestStops: BusStopWithDistance[];
  allBusStops: BusStop[];
  onSelectDepartureStop: (stop: BusStop) => void;
  onTrackService?: (busStop: BusStop, serviceNo: string) => void;
  theme: ThemePalette;
}

// Controller component to smoothly pan/zoom map to target coordinates
const MapController: React.FC<{ targetCoords: { lat: number; lng: number }; zoom?: number }> = ({ 
  targetCoords, 
  zoom 
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(targetCoords);
    if (zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [map, targetCoords.lat, targetCoords.lng, zoom]);

  return null;
};

export const TransitMap: React.FC<TransitMapProps> = ({
  userCoords,
  isGpsActive,
  onUseGps,
  nearestStops,
  allBusStops,
  onSelectDepartureStop,
  onTrackService,
  theme
}) => {
  const [selectedStop, setSelectedStop] = useState<BusStopWithDistance | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapTarget, setMapTarget] = useState(userCoords);
  const [mapZoom, setMapZoom] = useState(16);
  const [filterMode, setFilterMode] = useState<'nearest' | 'all'>('nearest');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Read Google Maps API key from Vite environment
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // The single closest bus stop
  const nearestStop = nearestStops.length > 0 ? nearestStops[0] : null;

  // Sync target when user coordinates change
  useEffect(() => {
    setMapTarget(userCoords);
  }, [userCoords.lat, userCoords.lng]);

  // Listen for global quota exceeded events
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Filter stops to show: nearest 8 stops or all stops in database
  const visibleStops = useMemo(() => {
    if (filterMode === 'nearest') {
      return nearestStops;
    }
    return allBusStops.map((stop) => {
      const match = nearestStops.find((ns) => ns.id === stop.id);
      return match || {
        ...stop,
        distanceMeters: 0,
        walkMinutes: 1
      };
    });
  }, [filterMode, nearestStops, allBusStops]);

  const handleRecenterPassenger = () => {
    setMapTarget(userCoords);
    setMapZoom(16.5);
    if (!isGpsActive) {
      onUseGps();
    }
  };

  const handleSelectStop = (stop: BusStopWithDistance) => {
    setSelectedStop(stop);
    setMapTarget({ lat: stop.lat, lng: stop.lng });
  };

  // Claymorphic Map Styling Configurations
  const mapContainerClass = isExpanded 
    ? "fixed inset-3 sm:inset-6 z-50 clay-card overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" 
    : "clay-card overflow-hidden flex flex-col shadow-lg";

  return (
    <div className="space-y-3">
      {/* Quota Exceeded Sticky Notice Banner (Compliance Requirement) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center rounded-2xl shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Interactive Map Shell */}
      <div className={mapContainerClass}>
        {/* Map Header & Fast Context Bar */}
        <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl clay-bus-mint flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">Live Passenger Radar</span>
                {isGpsActive ? (
                  <span className="text-[10px] clay-badge-mint px-2 py-0.5 font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Connected
                  </span>
                ) : (
                  <span className="text-[10px] clay-badge-lavender px-2 py-0.5 font-bold text-slate-500">
                    Preset Mode
                  </span>
                )}
              </div>
              {nearestStop && (
                <p className="text-[11px] font-bold text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <span className="text-pink-500">Nearest:</span> {nearestStop.name} ({formatDistance(nearestStop.distanceMeters)} • ~{nearestStop.walkMinutes} min walk)
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Filter Toggle */}
            <button
              onClick={() => setFilterMode((prev) => (prev === 'nearest' ? 'all' : 'nearest'))}
              className="px-2.5 py-1.5 rounded-full clay-pill-white text-[11px] font-bold text-slate-600 hover:text-purple-600 transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
              title="Toggle nearby vs all Singapore stops"
            >
              <Layers className="w-3 h-3 text-purple-500" />
              <span>{filterMode === 'nearest' ? 'Nearby Stops' : 'All SG Stops'}</span>
            </button>

            {/* Recenter Button */}
            <button
              onClick={handleRecenterPassenger}
              className="px-3 py-1.5 rounded-full clay-btn-mint text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-sm"
              title="Pan to live GPS location"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Locate Me</span>
            </button>

            {/* Expand / Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-full clay-icon-btn flex items-center justify-center text-slate-600 hover:text-purple-600 cursor-pointer"
              title={isExpanded ? "Close full map" : "Expand map view"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className={`w-full relative transition-all duration-300 ${isExpanded ? 'h-[calc(100vh-140px)]' : 'h-72 sm:h-84'}`}>
          {apiKey ? (
            <APIProvider apiKey={apiKey} libraries={['marker']}>
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={userCoords}
                defaultZoom={16}
                gestureHandling="greedy"
                disableDefaultUI={false}
                zoomControl={true}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <MapController targetCoords={mapTarget} zoom={mapZoom} />

                {/* 1. Passenger Live GPS Marker (Pulsing Cute Blue Dot) */}
                <AdvancedMarker
                  position={userCoords}
                  title="Passenger Live Location"
                  zIndex={100}
                >
                  <div className="relative flex items-center justify-center cursor-pointer group">
                    {/* Animated Pulse Aura */}
                    <div className="absolute w-10 h-10 rounded-full bg-sky-400/35 animate-ping pointer-events-none" />
                    <div className="absolute w-8 h-8 rounded-full bg-blue-500/25 blur-[1px] pointer-events-none" />
                    
                    {/* Glossy Clay Blue Core */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 via-sky-400 to-cyan-300 border-2 border-white shadow-xl flex items-center justify-center transition-transform transform group-hover:scale-125">
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    </div>

                    {/* Tooltip Pill */}
                    <div className="absolute bottom-full mb-1.5 hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-full clay-pill-white text-[10px] font-black text-sky-700 whitespace-nowrap shadow-md pointer-events-none">
                      <Navigation className="w-2.5 h-2.5 fill-sky-500 text-sky-500" />
                      <span>You (Live GPS)</span>
                    </div>
                  </div>
                </AdvancedMarker>

                {/* 2. Singapore Bus Stops Markers */}
                {visibleStops.map((stop) => {
                  const isNearest = nearestStop?.id === stop.id;
                  const isSelected = selectedStop?.id === stop.id;

                  return (
                    <AdvancedMarker
                      key={stop.id}
                      position={{ lat: stop.lat, lng: stop.lng }}
                      title={`${stop.name} (${stop.id})`}
                      onClick={() => handleSelectStop(stop)}
                      zIndex={isNearest ? 90 : isSelected ? 85 : 50}
                    >
                      <div className="relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-110">
                        {isNearest ? (
                          /* Highlighted Nearest Stop Pin with Mint Badge */
                          <div className="flex flex-col items-center">
                            <div className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black text-[10px] shadow-lg flex items-center gap-1 border-2 border-white animate-bounce">
                              <Sparkles className="w-2.5 h-2.5 text-yellow-200 fill-yellow-200" />
                              <span>Nearest ({formatDistance(stop.distanceMeters || 0)})</span>
                            </div>
                            <div className="w-8 h-8 rounded-2xl clay-bus-mint flex items-center justify-center text-white shadow-xl mt-1 border-2 border-white">
                              <Bus className="w-4 h-4" />
                            </div>
                            <div className="w-1.5 h-2 bg-emerald-600 rounded-b-full shadow-sm" />
                          </div>
                        ) : (
                          /* Standard Bus Stop Pin */
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-white shadow-md border-2 border-white ${
                              isSelected ? 'clay-bus-pink ring-2 ring-pink-400' : 'clay-bus-lavender'
                            }`}>
                              <Bus className="w-3.5 h-3.5" />
                            </div>
                            <div className="w-1 h-1.5 bg-slate-400 rounded-b-full" />
                          </div>
                        )}
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* InfoWindow for Selected Stop */}
                {selectedStop && (
                  <InfoWindow
                    position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                    onCloseClick={() => setSelectedStop(null)}
                    pixelOffset={[0, -32]}
                  >
                    <div className="p-1 max-w-[240px] text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-wider">
                          Stop #{selectedStop.id}
                        </span>
                        {nearestStop?.id === selectedStop.id && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                            Closest Stop
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight mt-0.5">
                        {selectedStop.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {selectedStop.road}
                      </p>

                      {/* Distance & Walking ETA */}
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100/80 px-2 py-1 rounded-xl">
                        <Footprints className="w-3.5 h-3.5 text-pink-500" />
                        <span>{formatDistance(selectedStop.distanceMeters || 0)}</span>
                        <span className="text-slate-300">•</span>
                        <span>~{selectedStop.walkMinutes || 1} min walk</span>
                      </div>

                      {/* Available Services */}
                      <div className="mt-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Passing Services
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedStop.services.slice(0, 8).map((svc) => (
                            <button
                              key={svc}
                              onClick={() => onTrackService?.(selectedStop, svc)}
                              className="px-1.5 py-0.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 font-black text-[11px] transition-colors"
                            >
                              {svc}
                            </button>
                          ))}
                          {selectedStop.services.length > 8 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{selectedStop.services.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action: Use as Departure Stop */}
                      <button
                        onClick={() => {
                          onSelectDepartureStop(selectedStop);
                          setSelectedStop(null);
                        }}
                        className="w-full mt-3 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Set Departure Point</span>
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Fallback Map UI if key is missing */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
              <div className="w-12 h-12 rounded-2xl clay-bus-lavender flex items-center justify-center text-white mb-3">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-black text-slate-800">Google Maps Integration Ready</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Please provide your Google Maps API key in settings or environment to enable live map rendering.
              </p>
            </div>
          )}

          {/* Floating Live Quick-Status Capsule */}
          {nearestStop && (
            <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-10 pointer-events-auto">
              <div className="clay-card p-3 shadow-xl backdrop-blur-md bg-white/95 border border-white/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-2xl clay-badge-mint flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                      Auto-Detected Closest Stop
                    </div>
                    <div className="text-xs font-black text-slate-800 truncate">
                      {nearestStop.name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                      <span>{formatDistance(nearestStop.distanceMeters)}</span>
                      <span>•</span>
                      <span>~{nearestStop.walkMinutes} min walk</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectDepartureStop(nearestStop)}
                  className="px-3 py-1.5 rounded-full clay-btn-mint text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Select</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Nearest Stops Slider Bar */}
        <div className="p-3 bg-slate-50/70 border-t border-purple-100/50">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Nearby Bus Stops from your location</span>
            <span className="text-slate-500 font-bold">{nearestStops.length} stops nearby</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {nearestStops.map((stop, index) => {
              const isFirst = index === 0;
              return (
                <button
                  key={stop.id}
                  onClick={() => handleSelectStop(stop)}
                  className={`flex-shrink-0 text-left p-2.5 rounded-2xl transition-all cursor-pointer min-w-[170px] ${
                    isFirst 
                      ? 'clay-card-mint border border-emerald-200' 
                      : 'clay-pill-white hover:translate-y-[-1px]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                      isFirst ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{stop.id}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500">
                      {formatDistance(stop.distanceMeters)}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-800 truncate">
                    {stop.name}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 truncate">
                    {stop.road}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-pink-600">
                    <Footprints className="w-3 h-3" />
                    <span>~{stop.walkMinutes}m walk</span>
                    <span className="text-slate-300 ml-auto">•</span>
                    <span className="text-slate-400 font-bold">{stop.services.length} svcs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
