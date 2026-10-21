import React, { useState } from 'react';
import { X, Check, Sliders, Tag, Clock } from 'lucide-react';
import { SavedRoute } from '../types/transit';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeTransitData';

interface EditBusesModalProps {
  route: SavedRoute;
  onClose: () => void;
  onSave: (updated: SavedRoute) => void;
}

export const EditBusesModal: React.FC<EditBusesModalProps> = ({
  route,
  onClose,
  onSave
}) => {
  const [selectedBuses, setSelectedBuses] = useState<string[]>(route.selectedBuses);
  const [customTag, setCustomTag] = useState(route.customTag || '');
  const [walkMinutes, setWalkMinutes] = useState(route.manualWalkMinutes || 4);

  const stopData = SINGAPORE_BUS_STOPS.find((s) => s.id === route.busStopCode);
  const availableServices = stopData ? stopData.services : route.selectedBuses;

  const toggleBus = (svc: string) => {
    if (selectedBuses.includes(svc)) {
      if (selectedBuses.length > 1) {
        setSelectedBuses(selectedBuses.filter((b) => b !== svc));
      }
    } else {
      setSelectedBuses([...selectedBuses, svc]);
    }
  };

  const handleDone = () => {
    onSave({
      ...route,
      selectedBuses,
      customTag: customTag.trim() || undefined,
      manualWalkMinutes: walkMinutes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md clay-card shadow-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 clay-bus-lavender flex items-center justify-center text-white shadow-sm">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Configure Buses</h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{route.busStopName} (#{route.busStopCode})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <div className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider mb-2">
              Select Services at this Stop
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {availableServices.map((svc) => {
                const isSelected = selectedBuses.includes(svc);
                return (
                  <button
                    key={svc}
                    onClick={() => toggleBus(svc)}
                    className={`h-11 rounded-2xl font-mono text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'clay-btn-mint shadow-md'
                        : 'clay-pill-white text-slate-700 hover:text-purple-600'
                    }`}
                  >
                    <span>{svc}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-pink-500" />
              <span>Custom Location Label</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Work, Home, Gym"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="w-full px-3.5 py-2.5 clay-inset text-slate-800 placeholder-slate-400 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Walking Time (Minutes)</span>
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
              <span className="text-xs font-mono font-black clay-badge-mint px-3 py-1.5 min-w-[70px] text-center">
                {walkMinutes}m
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/60 border-t border-purple-100/60 shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 clay-pill-white text-slate-600 hover:text-slate-900 text-xs font-black cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2.5 clay-btn-mint text-white font-black text-xs rounded-full shadow-md cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
