import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  MapPin, 
  Check, 
  Plus, 
  Clock, 
  Tag, 
  Sparkles, 
  Loader2, 
  Database, 
  Bus,
  ArrowRight
} from 'lucide-react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeTransitData';
import { BusStop, SavedRoute } from '../types/transit';

interface SearchAndAddModalProps {
  onClose: () => void;
  onSaveRoute: (route: SavedRoute) => void;
  existingSavedCodes: string[];
}

interface LtaServiceResult {
  serviceNo: string;
  operator: string;
  category: string;
  loopDesc?: string;
}

export const SearchAndAddModal: React.FC<SearchAndAddModalProps> = ({
  onClose,
  onSaveRoute,
  existingSavedCodes
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [walkMinutes, setWalkMinutes] = useState(5);

  // Dynamic API search results
  const [searchResults, setSearchResults] = useState<BusStop[]>([]);
  const [matchedServices, setMatchedServices] = useState<LtaServiceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'lta_api' | 'local'>('lta_api');

  const debounceTimeoutRef = useRef<any>(null);

  // Debounced dynamic query against LTA DataMall backend search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(SINGAPORE_BUS_STOPS.slice(0, 10));
      setMatchedServices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/lta/search?q=${encodeURIComponent(q)}&limit=30`, {
          headers: {
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const json = await response.json();
          if (json.status === 'ok' && Array.isArray(json.stops)) {
            setSearchResults(json.stops);
            setMatchedServices(json.services || []);
            setDataSource('lta_api');
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('LTA search fetch failed, falling back to local dataset:', err);
      }

      // Fallback to local filtering
      const lowerQ = q.toLowerCase();
      const localFiltered = SINGAPORE_BUS_STOPS.filter((stop) => {
        const matchCode = stop.id.toLowerCase().includes(lowerQ);
        const matchName = stop.name.toLowerCase().includes(lowerQ);
        const matchRoad = stop.road.toLowerCase().includes(lowerQ);
        const matchService = stop.services.some(
          (svc) => svc.toLowerCase() === lowerQ || svc.toLowerCase().startsWith(lowerQ)
        );
        return matchCode || matchName || matchRoad || matchService;
      });

      setSearchResults(localFiltered);
      setDataSource('local');
      setIsLoading(false);
    }, 220);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    // If the search query matches a specific service (like '298'), preselect that service
    const trimmedQ = searchQuery.trim().toUpperCase();
    if (stop.services.includes(trimmedQ)) {
      setSelectedBuses([trimmedQ]);
    } else {
      setSelectedBuses(stop.services.slice(0, 3));
    }
  };

  const toggleBusSelection = (serviceNo: string) => {
    if (selectedBuses.includes(serviceNo)) {
      if (selectedBuses.length > 1) {
        setSelectedBuses(selectedBuses.filter((b) => b !== serviceNo));
      }
    } else {
      setSelectedBuses([...selectedBuses, serviceNo]);
    }
  };

  const handleSave = () => {
    if (!selectedStop || selectedBuses.length === 0) return;

    const newRoute: SavedRoute = {
      id: `sr-${selectedStop.id}-${Date.now()}`,
      busStopCode: selectedStop.id,
      busStopName: selectedStop.name,
      roadName: selectedStop.road,
      lat: selectedStop.lat,
      lng: selectedStop.lng,
      selectedBuses,
      customTag: customTag.trim() || undefined,
      walkingSpeed: 'normal',
      manualWalkMinutes: walkMinutes,
      alertMinutesBeforeLeave: 3,
      createdAt: Date.now()
    };

    onSaveRoute(newRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg clay-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden relative border border-purple-100/80">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0 bg-white/60">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 nunito">
              <span>{selectedStop ? 'Select Buses to Track' : 'Search All Singapore Buses & Stops'}</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-slate-500">
                {selectedStop
                  ? 'Tap multiple bus services to watch leave-by timers'
                  : 'Official LTA DataMall Integration (All 5,200+ stops & routes)'}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live LTA
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Search View */}
        {!selectedStop ? (
          <>
            <div className="p-4 border-b border-purple-100/60 bg-white/40 space-y-2">
              <div className="relative">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type="text"
                  placeholder="e.g. 75541, 298, Opp Blk 648A, Tampines, Orchard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 clay-inset text-slate-800 placeholder-slate-400 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Matched Service Card (e.g. Service 298) */}
              {matchedServices.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider flex items-center gap-1">
                    <Bus className="w-3 h-3" />
                    <span>Active Service:</span>
                  </span>
                  {matchedServices.map((svc) => (
                    <button
                      key={svc.serviceNo}
                      onClick={() => setSearchQuery(svc.serviceNo)}
                      className="px-2.5 py-0.8 rounded-full bg-purple-100/80 hover:bg-purple-200 text-purple-800 text-[11px] font-mono font-black flex items-center gap-1 transition-colors cursor-pointer border border-purple-200"
                    >
                      <span>Bus {svc.serviceNo}</span>
                      <span className="text-[9px] text-purple-600 font-sans font-bold">
                        ({svc.operator} · {svc.category})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-black text-purple-600/80 uppercase tracking-wider mb-2">
                <span>
                  {searchQuery ? `Matching Results (${searchResults.length})` : 'Popular & Seed Stops Across Singapore'}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {dataSource === 'lta_api' ? 'LTA DataMall Master Cache' : 'Local Seed'}
                </span>
              </div>

              {searchResults.length === 0 && !isLoading ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-slate-500 font-bold text-xs">
                    No stops or services matching "{searchQuery}".
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Try entering the 5-digit stop code (e.g. <span className="font-mono font-black text-purple-600">75541</span>) or bus service (<span className="font-mono font-black text-purple-600">298</span>).
                  </p>
                </div>
              ) : (
                searchResults.map((stop) => {
                  const alreadySaved = existingSavedCodes.includes(stop.id);
                  const isQueryMatchedService = stop.services.includes(searchQuery.trim().toUpperCase());

                  return (
                    <div
                      key={stop.id}
                      onClick={() => handleSelectStop(stop)}
                      className={`p-3.5 rounded-[22px] clay-card hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-between gap-3 group border ${
                        isQueryMatchedService ? 'border-purple-300 bg-purple-50/40' : 'border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors truncate">
                            {stop.name}
                          </span>
                          <span className="text-[10px] font-mono font-black clay-inset px-2 py-0.5 text-purple-700 shrink-0">
                            #{stop.id}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                          {stop.road}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {stop.services.slice(0, 10).map((svc) => {
                            const isHighlight = svc.toUpperCase() === searchQuery.trim().toUpperCase();
                            return (
                              <span
                                key={svc}
                                className={`text-[10px] font-mono font-black px-2 py-0.5 transition-colors ${
                                  isHighlight
                                    ? 'bg-purple-600 text-white rounded-lg shadow-sm'
                                    : 'clay-pill-white text-slate-700'
                                }`}
                              >
                                {svc}
                              </span>
                            );
                          })}
                          {stop.services.length > 10 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{stop.services.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {alreadySaved && (
                          <span className="text-[10px] clay-badge-mint px-2 py-0.5 font-black">
                            Saved
                          </span>
                        )}
                        <button 
                          className="w-8 h-8 clay-btn-mint flex items-center justify-center cursor-pointer shadow-sm group-hover:scale-105 transition-transform"
                          title="Select Stop"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Multi-Bus Selection View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="p-3.5 rounded-[22px] clay-card-lavender flex items-center justify-between border border-purple-200/60">
              <div className="min-w-0 pr-2">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">{selectedStop.name}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                  #{selectedStop.id} · {selectedStop.road}
                </div>
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="text-xs text-purple-600 font-black hover:underline cursor-pointer shrink-0"
              >
                Change Stop
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-purple-600/80 uppercase tracking-wider">
                  Available Buses ({selectedBuses.length} of {selectedStop.services.length} selected)
                </span>
                <button
                  onClick={() => {
                    if (selectedBuses.length === selectedStop.services.length) {
                      setSelectedBuses(selectedStop.services.slice(0, 1));
                    } else {
                      setSelectedBuses([...selectedStop.services]);
                    }
                  }}
                  className="text-xs text-purple-600 font-black hover:underline cursor-pointer"
                >
                  {selectedBuses.length === selectedStop.services.length ? 'Clear all' : 'Select all'}
                </button>
              </div>

              {selectedStop.services.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-bold clay-inset rounded-2xl">
                  Fetching services calling at this stop...
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {selectedStop.services.map((svc) => {
                    const isChecked = selectedBuses.includes(svc);
                    return (
                      <button
                        key={svc}
                        onClick={() => toggleBusSelection(svc)}
                        type="button"
                        className={`h-11 rounded-2xl font-mono text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isChecked
                            ? 'clay-btn-mint text-white shadow-md'
                            : 'clay-pill-white text-slate-700 hover:text-purple-600'
                        }`}
                      >
                        <span>{svc}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Custom Label Tag (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tampines North, Work, Home, Gym"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="w-full px-3.5 py-2.5 clay-inset text-slate-800 placeholder-slate-400 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Walking Time to Stop</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={walkMinutes}
                  onChange={(e) => setWalkMinutes(parseInt(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-black clay-badge-mint px-3 py-1.5 min-w-[75px] text-center">
                  {walkMinutes} mins
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {selectedStop && (
          <div className="p-4 bg-white/70 border-t border-purple-100/60 shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedStop(null)}
              className="px-4 py-2 clay-pill-white text-slate-600 hover:text-slate-900 text-xs font-black cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={selectedBuses.length === 0}
              className="px-6 py-2.5 clay-btn-mint text-white font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Track {selectedBuses.length} {selectedBuses.length === 1 ? 'Bus' : 'Buses'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
