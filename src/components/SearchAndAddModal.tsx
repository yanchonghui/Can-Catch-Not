import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Check, Plus, Clock, Tag, Sparkles } from 'lucide-react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeTransitData';
import { BusStop, SavedRoute } from '../types/transit';

interface SearchAndAddModalProps {
  onClose: () => void;
  onSaveRoute: (route: SavedRoute) => void;
  existingSavedCodes: string[];
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

  const filteredStops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SINGAPORE_BUS_STOPS.slice(0, 8);

    return SINGAPORE_BUS_STOPS.filter((stop) => {
      const matchCode = stop.id.toLowerCase().includes(q);
      const matchName = stop.name.toLowerCase().includes(q);
      const matchRoad = stop.road.toLowerCase().includes(q);
      const matchService = stop.services.some((svc) => svc.toLowerCase() === q || svc.toLowerCase().startsWith(q));
      return matchCode || matchName || matchRoad || matchService;
    });
  }, [searchQuery]);

  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    setSelectedBuses(stop.services.slice(0, 3));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg clay-card shadow-2xl max-h-[88vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>{selectedStop ? 'Select Buses to Track' : 'Search Buses & Stops'}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {selectedStop
                ? 'Choose multiple buses from this stop'
                : 'Search by bus service, stop code, or road name'}
            </p>
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
            <div className="p-4 border-b border-purple-100/60 bg-white/40">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 65, 190, Dhoby Ghaut, 08057, Orchard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 clay-inset text-slate-800 placeholder-slate-400 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="text-[10px] font-black text-purple-600/70 uppercase tracking-wider mb-2">
                {searchQuery ? `Matching Results (${filteredStops.length})` : 'Popular Stops Across Singapore'}
              </div>

              {filteredStops.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">
                  No bus stops matching "{searchQuery}".
                </div>
              ) : (
                filteredStops.map((stop) => {
                  const alreadySaved = existingSavedCodes.includes(stop.id);

                  return (
                    <div
                      key={stop.id}
                      onClick={() => handleSelectStop(stop)}
                      className="p-3.5 rounded-[22px] clay-card hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors truncate">
                            {stop.name}
                          </span>
                          <span className="text-[10px] font-mono font-black clay-inset px-2 py-0.5 text-purple-700">
                            #{stop.id}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                          {stop.road}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {stop.services.slice(0, 8).map((svc) => (
                            <span
                              key={svc}
                              className="text-[10px] font-mono font-black px-2 py-0.5 clay-pill-white text-slate-700"
                            >
                              {svc}
                            </span>
                          ))}
                          {stop.services.length > 8 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{stop.services.length - 8} more
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
                        <button className="w-8 h-8 clay-btn-mint flex items-center justify-center cursor-pointer shadow-sm">
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 rounded-[22px] clay-card-lavender flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{selectedStop.name}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                  #{selectedStop.id} · {selectedStop.road}
                </div>
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="text-xs text-purple-600 font-black hover:underline cursor-pointer"
              >
                Change Stop
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-purple-600/70 uppercase tracking-wider">
                  Select Buses ({selectedBuses.length} selected)
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
                          ? 'clay-btn-mint shadow-md'
                          : 'clay-pill-white text-slate-700 hover:text-purple-600'
                      }`}
                    >
                      <span>{svc}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Custom Label Tag (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Work, Home, Gym, Library"
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
          <div className="p-4 bg-white/60 border-t border-purple-100/60 shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedStop(null)}
              className="px-4 py-2 clay-pill-white text-slate-600 hover:text-slate-900 text-xs font-black cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={selectedBuses.length === 0}
              className="px-6 py-2.5 clay-btn-mint text-white font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              Track {selectedBuses.length} {selectedBuses.length === 1 ? 'Bus' : 'Buses'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
