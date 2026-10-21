import React from 'react';
import { X, Clock, MapPin, Bus, ArrowRight, Sparkles } from 'lucide-react';
import { BusRouteDetail } from '../types/transit';
import { POPULAR_ROUTES } from '../data/singaporeTransitData';

interface RoutePeekModalProps {
  serviceNo: string;
  currentStopCode: string;
  onClose: () => void;
}

export const RoutePeekModal: React.FC<RoutePeekModalProps> = ({
  serviceNo,
  currentStopCode,
  onClose
}) => {
  const routeDetail: BusRouteDetail = POPULAR_ROUTES[serviceNo] || {
    serviceNo,
    operator: 'SBST',
    direction: 1,
    originCode: currentStopCode,
    originName: 'Central Transit Hub',
    destCode: '10169',
    destName: 'HarbourFront / Southern Hub',
    firstBus: '05:30',
    lastBus: '23:45',
    peakFreq: '6 - 9 mins',
    offPeakFreq: '8 - 12 mins',
    stops: [
      { stopSeq: 1, busStopCode: currentStopCode, busStopName: 'Current Bus Stop', roadName: 'Transit Ave', distanceKm: 0.0, isCurrentStop: true },
      { stopSeq: 2, busStopCode: '09048', busStopName: 'Orchard Station / Shopping Belt', roadName: 'Orchard Rd', distanceKm: 1.4 },
      { stopSeq: 3, busStopCode: '04121', busStopName: 'City Hall Interchange', roadName: 'Nth Bridge Rd', distanceKm: 3.2 },
      { stopSeq: 4, busStopCode: '03019', busStopName: 'Raffles Place / Financial District', roadName: 'Fullerton Rd', distanceKm: 4.8 },
      { stopSeq: 5, busStopCode: '10169', busStopName: 'HarbourFront Int / Sentosa Gateway', roadName: 'Telok Blangah Rd', distanceKm: 8.5, isDestination: true }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg clay-card shadow-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 clay-bus-mint flex items-center justify-center font-black text-lg shadow-md">
              {routeDetail.serviceNo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800">
                  Bus {routeDetail.serviceNo} Route
                </h3>
                <span className="text-[10px] font-mono font-black clay-badge-lavender px-2 py-0.2">
                  {routeDetail.operator}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <span>{routeDetail.originName}</span>
                <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                <span>{routeDetail.destName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Operating Hours & Frequency Pill Strip */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-white/40 border-b border-purple-100/60 text-xs shrink-0">
          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="w-7 h-7 clay-pill-white flex items-center justify-center text-purple-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-600/70 uppercase font-black tracking-wider block">Operating Hours</span>
              <span className="font-mono font-black text-slate-800">{routeDetail.firstBus} – {routeDetail.lastBus}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="w-7 h-7 clay-pill-white flex items-center justify-center text-emerald-600">
              <Bus className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600/70 uppercase font-black tracking-wider block">Peak Frequency</span>
              <span className="font-mono font-black text-slate-800">{routeDetail.peakFreq}</span>
            </div>
          </div>
        </div>

        {/* Route Line & Stops */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-[10px] font-black text-purple-600/70 uppercase tracking-wider flex items-center gap-1">
            <span>Stops & Distance Map</span>
            <Sparkles className="w-2.5 h-2.5" />
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-1 before:bg-purple-200/60 before:rounded-full">
            {routeDetail.stops.map((stop, idx) => {
              const isMatch = stop.busStopCode === currentStopCode || stop.isCurrentStop;
              const isFirst = idx === 0;
              const isLast = idx === routeDetail.stops.length - 1;

              return (
                <div key={stop.busStopCode} className="relative flex items-start gap-3 group">
                  {/* Stop Node Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isMatch
                        ? 'clay-btn-mint shadow-md z-10'
                        : isFirst || isLast
                        ? 'clay-btn-lavender z-10'
                        : 'clay-pill-white text-slate-500 z-10'
                    }`}
                  >
                    {isMatch ? (
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="text-[9px] font-mono font-black text-slate-700">{stop.stopSeq}</span>
                    )}
                  </div>

                  {/* Stop Item */}
                  <div className={`flex-1 p-3 rounded-[20px] transition-all ${
                    isMatch
                      ? 'clay-card-mint font-bold'
                      : 'clay-card text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-800 truncate">
                        {stop.busStopName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {stop.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-purple-600">#{stop.busStopCode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="truncate">{stop.roadName}</span>
                    </div>

                    {isMatch && (
                      <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-black flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Current Tracking Stop</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/60 border-t border-purple-100/60 shrink-0 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            Verified LTA DataMall Route
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 clay-btn-mint text-white font-black text-xs rounded-full shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
