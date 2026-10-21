import React, { useState, useEffect } from 'react';
import { Bus, Clock, Umbrella, ChevronUp, ChevronDown, Sparkles, Footprints } from 'lucide-react';
import { LeaveCalculation, NextBusArrival } from '../types/transit';

interface LiveActivityBannerProps {
  busServiceNo: string;
  busStopName: string;
  busStopCode: string;
  leaveCalc: LeaveCalculation;
  nextBus?: NextBusArrival;
  umbrellaNeeded: boolean;
  onOpenWidgetsModal: () => void;
}

export const LiveActivityBanner: React.FC<LiveActivityBannerProps> = ({
  busServiceNo,
  busStopName,
  busStopCode,
  leaveCalc,
  nextBus,
  umbrellaNeeded,
  onOpenWidgetsModal
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(leaveCalc.leaveInSeconds);

  useEffect(() => {
    setRemainingSeconds(leaveCalc.leaveInSeconds);
  }, [leaveCalc.leaveInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(-600, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    if (secs < 0) {
      const positiveSecs = Math.abs(secs);
      const m = Math.floor(positiveSecs / 60);
      const s = positiveSecs % 60;
      return `Missed -${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const getUrgencyPillClass = (secs: number) => {
    if (secs < 0) return 'clay-btn-pink';
    if (secs <= 120) return 'clay-btn-pink';
    if (secs <= 360) return 'clay-btn-lavender';
    return 'clay-btn-mint';
  };

  return (
    <div className="w-full transition-all duration-200">
      {/* Cute Claymorphic Live Activity Card */}
      <div className="w-full clay-card p-4 sm:p-5 space-y-3 relative overflow-hidden">
        {/* Soft studio lighting ambient highlight */}
        <div className="absolute top-0 left-10 w-28 h-28 bg-pink-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          {/* Left: Bus Service and Stop Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 clay-bus-mint flex items-center justify-center font-black text-lg shadow-md shrink-0">
              {busServiceNo}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-800 truncate">
                  Bus {busServiceNo}
                </span>
                <span className="text-xs font-mono font-bold clay-inset px-2 py-0.5 text-slate-500">
                  #{busStopCode}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 truncate mt-0.5">
                {busStopName}
              </div>
            </div>
          </div>

          {/* Right: Departure Countdown 3D Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                Leave In
              </div>
              <div className={`text-xs font-black px-3 py-1.5 shadow-md flex items-center gap-1 ${getUrgencyPillClass(remainingSeconds)}`}>
                <Clock className="w-3 h-3 text-white" />
                <span>{formatCountdown(remainingSeconds)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-500 hover:text-purple-600 cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand Live Activity Details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Expanded Live Activity Clay Sub-panel */}
        {isExpanded && (
          <div className="pt-3 border-t border-purple-100/60 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="clay-card-pink p-3 text-center">
                <div className="text-[10px] uppercase font-black text-pink-700/80 tracking-wider">Departure</div>
                <div className="text-xs sm:text-sm font-black text-pink-900 mt-0.5 truncate">
                  {leaveCalc.leaveInMinutes <= 0 ? 'Leave in 0m (NOW!)' : `Leave in ${leaveCalc.leaveInMinutes} mins`}
                </div>
              </div>

              <div className="clay-card-mint p-3 text-center">
                <div className="text-[10px] uppercase font-black text-emerald-700/80 tracking-wider">Walking</div>
                <div className="text-xs sm:text-sm font-black text-emerald-900 mt-0.5 flex items-center justify-center gap-1">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>{leaveCalc.walkingMinutes} min</span>
                </div>
              </div>

              <div className="clay-card-lavender p-3 text-center">
                <div className="text-[10px] uppercase font-black text-purple-700/80 tracking-wider">Bus Arrives</div>
                <div className="text-xs sm:text-sm font-black text-purple-900 mt-0.5">
                  {nextBus?.arrivalMinutes ?? leaveCalc.busArrivalMinutes} min
                </div>
              </div>
            </div>

            {/* Next Option Subsequent Bus */}
            {leaveCalc.nextOption && (
              <div className="flex items-center justify-between text-xs clay-inset px-3.5 py-2.5">
                <div className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-purple-500" />
                  <span>Subsequent Bus: in <strong className="text-slate-800">{leaveCalc.nextOption.arrivalMinutes}m</strong></span>
                </div>
                <div className="text-pink-600 font-black text-xs clay-badge-pink px-2.5 py-0.5">
                  Leave in {leaveCalc.nextOption.leaveInMinutes} mins
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Umbrella className={`w-3.5 h-3.5 ${umbrellaNeeded ? 'text-pink-500' : 'text-slate-400'}`} />
                <span>{umbrellaNeeded ? 'Rain in 1h (take umbrella! ☂️)' : 'Weather clear ☀️'}</span>
              </div>

              <button
                onClick={onOpenWidgetsModal}
                className="text-xs text-purple-600 hover:text-purple-700 font-black flex items-center gap-1 cursor-pointer"
              >
                <span>Preview iOS Widgets</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
