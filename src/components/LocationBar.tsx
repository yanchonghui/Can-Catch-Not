import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, Check, Compass } from 'lucide-react';

interface LocationBarProps {
  currentLocationName: string;
  isGpsActive: boolean;
  onUseGps: () => void;
  onSelectPreset: (name: string, lat: number, lng: number) => void;
  currentCoords: { lat: number; lng: number };
}

const PRESET_LOCATIONS = [
  { name: 'Dhoby Ghaut / Orchard (Central)', lat: 1.2993, lng: 103.8453 },
  { name: 'Raffles Place / CBD (South)', lat: 1.2863, lng: 103.8530 },
  { name: 'Tampines Hub (East)', lat: 1.3532, lng: 103.9452 },
  { name: 'Jurong East (West)', lat: 1.3336, lng: 103.7423 },
  { name: 'Woodlands Square (North)', lat: 1.4371, lng: 103.7865 }
];

export const LocationBar: React.FC<LocationBarProps> = ({
  currentLocationName,
  isGpsActive,
  onUseGps,
  onSelectPreset,
  currentCoords
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 clay-card transition-all text-left cursor-pointer hover:translate-y-[-1px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
            isGpsActive ? 'clay-btn-mint text-white' : 'clay-pill-white text-slate-700'
          }`}>
            {isGpsActive ? <Navigation className="w-4 h-4 animate-pulse" /> : <MapPin className="w-4 h-4 text-pink-500" />}
          </div>
          <div className="truncate">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Current Departure Point</span>
              {isGpsActive && (
                <span className="text-[10px] clay-badge-mint px-2 py-0.2 font-black">
                  GPS Live
                </span>
              )}
            </div>
            <div className="text-sm font-extrabold text-slate-800 truncate">
              {currentLocationName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Change</span>
          <div className="w-6 h-6 clay-icon-btn flex items-center justify-center">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2.5 z-50 clay-card p-3 text-xs animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            <div className="px-2.5 py-1 text-[10px] font-black text-purple-600 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Select Transit Origin</span>
            </div>

            <button
              onClick={() => {
                onUseGps();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full clay-btn-mint my-1.5 font-black text-xs cursor-pointer"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>Use Real-time Device GPS</span>
            </button>

            <div className="h-px bg-purple-100/60 my-2" />

            <div className="space-y-1">
              {PRESET_LOCATIONS.map((preset) => {
                const isSelected =
                  Math.abs(preset.lat - currentCoords.lat) < 0.005 &&
                  Math.abs(preset.lng - currentCoords.lng) < 0.005;

                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onSelectPreset(preset.name, preset.lat, preset.lng);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left transition-all cursor-pointer font-bold ${
                      isSelected
                        ? 'clay-card-lavender text-purple-900 shadow-sm'
                        : 'text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
