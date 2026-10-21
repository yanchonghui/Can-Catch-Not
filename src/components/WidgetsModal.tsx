import React, { useState } from 'react';
import { X, Smartphone, Umbrella, Footprints, Sparkles } from 'lucide-react';
import { LeaveCalculation, NextBusArrival, WeatherInfo } from '../types/transit';

interface WidgetsModalProps {
  onClose: () => void;
  serviceNo: string;
  busStopName: string;
  busStopCode: string;
  leaveCalc: LeaveCalculation;
  nextBus?: NextBusArrival;
  weather: WeatherInfo;
}

export const WidgetsModal: React.FC<WidgetsModalProps> = ({
  onClose,
  serviceNo,
  busStopName,
  busStopCode,
  leaveCalc,
  nextBus,
  weather
}) => {
  const [activeWidgetTab, setActiveWidgetTab] = useState<'lock_screen' | 'small' | 'medium'>('lock_screen');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg clay-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 clay-bus-lavender flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>iOS Widgets & Lock Screen</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Glanceable transit updates for your home and lock screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 3D Pill Segmented Format Selector */}
        <div className="p-4 border-b border-purple-100/60 bg-white/40">
          <div className="grid grid-cols-3 gap-2 p-1.5 clay-inset-pill">
            <button
              onClick={() => setActiveWidgetTab('lock_screen')}
              className={`py-2 text-xs font-black rounded-full transition-all cursor-pointer ${
                activeWidgetTab === 'lock_screen'
                  ? 'clay-btn-lavender shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lock Screen
            </button>
            <button
              onClick={() => setActiveWidgetTab('small')}
              className={`py-2 text-xs font-black rounded-full transition-all cursor-pointer ${
                activeWidgetTab === 'small'
                  ? 'clay-btn-mint shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Small (2x2)
            </button>
            <button
              onClick={() => setActiveWidgetTab('medium')}
              className={`py-2 text-xs font-black rounded-full transition-all cursor-pointer ${
                activeWidgetTab === 'medium'
                  ? 'clay-btn-pink shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medium (4x2)
            </button>
          </div>
        </div>

        {/* Preview Canvas with Studio Lighting */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-b from-purple-50/30 to-pink-50/20">
          {activeWidgetTab === 'lock_screen' && (
            <div className="w-full max-w-sm space-y-3">
              <div className="text-center text-[10px] uppercase tracking-wider text-purple-700 font-black">
                Lock Screen Live Activity Complication
              </div>

              {/* Glossy Lock Screen Clay Card */}
              <div className="w-full rounded-[26px] bg-slate-900/90 backdrop-blur-xl text-white p-5 shadow-2xl border border-white/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 clay-bus-mint flex items-center justify-center font-black text-xs text-white">
                      {serviceNo}
                    </div>
                    <div>
                      <div className="text-xs font-black leading-tight">
                        Bus {serviceNo} · {busStopName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        #{busStopCode}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-black bg-white/15 px-2.5 py-0.5 rounded-full">
                    Arr in {nextBus?.arrivalMinutes ?? leaveCalc.busArrivalMinutes}m
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                      Departure
                    </div>
                    <div className="text-base font-black font-mono text-emerald-300">
                      {leaveCalc.leaveInMinutes <= 0 ? 'Leave in 0 mins (NOW!)' : `Leave in ${leaveCalc.leaveInMinutes} mins`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      {leaveCalc.walkingMinutes}m walk
                    </div>
                    <div className="text-xs font-black text-pink-300 flex items-center gap-1 justify-end mt-0.5">
                      <Umbrella className="w-3.5 h-3.5" />
                      <span>{weather.umbrellaAdvice.bringUmbrella ? 'Rain Soon' : 'Clear'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWidgetTab === 'small' && (
            <div className="space-y-3 flex flex-col items-center">
              <div className="text-center text-[10px] uppercase tracking-wider text-emerald-700 font-black">
                Home Screen Small Widget (2x2)
              </div>

              {/* 2x2 Squircle Cute Clay Widget */}
              <div className="w-48 h-48 clay-card-mint p-4 shadow-xl flex flex-col justify-between text-slate-800">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 clay-bus-mint text-white flex items-center justify-center font-black text-sm">
                    {serviceNo}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-emerald-800 block">
                      Arr {nextBus?.arrivalMinutes ?? 8}m
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block truncate max-w-[75px]">
                      {busStopName}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">
                    Departure
                  </div>
                  <div className="text-xl font-black text-slate-800 tabular-nums">
                    {leaveCalc.leaveInMinutes <= 0 ? 'Leave in 0 mins' : `Leave in ${leaveCalc.leaveInMinutes} mins`}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>{leaveCalc.walkingMinutes} min walk</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>Can Catch Not?</span>
                  <span className="flex items-center gap-1 text-pink-600 font-black">
                    <Umbrella className="w-3 h-3" />
                    <span>{weather.umbrellaAdvice.bringUmbrella ? 'Bring ☔' : 'Dry ☀️'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeWidgetTab === 'medium' && (
            <div className="space-y-3 flex flex-col items-center w-full max-w-md">
              <div className="text-center text-[10px] uppercase tracking-wider text-pink-700 font-black">
                Home Screen Medium Widget (4x2)
              </div>

              {/* 4x2 Horizontal Cute Clay Widget */}
              <div className="w-full clay-card-pink p-5 shadow-xl flex flex-col justify-between text-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 clay-bus-pink text-white flex items-center justify-center font-black text-xs">
                      {serviceNo}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">{busStopName}</div>
                      <div className="text-[10px] font-bold text-slate-500">#{busStopCode} · {leaveCalc.walkingMinutes}m walk</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-pink-600 font-black">Next Option</div>
                    <div className="text-xs font-black text-slate-800">
                      {leaveCalc.nextOption ? `in ${leaveCalc.nextOption.arrivalMinutes}m` : 'in 18m'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 clay-inset p-3">
                  <div>
                    <div className="text-[10px] uppercase font-black text-pink-600 tracking-wider">
                      Current Bus
                    </div>
                    <div className="text-base font-black text-pink-700 tabular-nums">
                      {leaveCalc.leaveInMinutes <= 0 ? 'Leave in 0 mins (NOW)' : `Leave in ${leaveCalc.leaveInMinutes} mins`}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                      Arrival in {nextBus?.arrivalMinutes ?? 7}m
                    </div>
                  </div>

                  <div className="border-l border-pink-200/60 pl-3">
                    <div className="text-[10px] uppercase font-black text-purple-600 tracking-wider">
                      Subsequent Bus
                    </div>
                    <div className="text-base font-black text-purple-700 tabular-nums">
                      {leaveCalc.nextOption ? `Leave in ${leaveCalc.nextOption.leaveInMinutes} mins` : 'Leave in 18 mins'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                      <Umbrella className="w-3 h-3 text-pink-500" />
                      <span>{weather.umbrellaAdvice.bringUmbrella ? 'Rain in 45m' : 'Clear sky'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1 text-emerald-600 font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Live LTA DataMall Synced</span>
                  </span>
                  <span className="text-slate-600 font-black">Can Catch Not? Widget</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/60 border-t border-purple-100/60 text-xs text-slate-600 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-500">
            Keep Can Catch Not? added to Home Screen for live lock screen access.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 clay-btn-mint text-white font-black text-xs rounded-full shadow-md cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
