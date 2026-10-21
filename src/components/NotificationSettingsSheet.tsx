import React, { useState } from 'react';
import { X, Bell, Volume2, CloudRain, Key, Check, ShieldCheck, Footprints, Sparkles, Palette, Moon, Sun } from 'lucide-react';
import { ThemePalette } from '../types/transit';

interface NotificationSettingsSheetProps {
  onClose: () => void;
  noticeMinutes: number;
  onChangeNoticeMinutes: (mins: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  rainAlertEnabled: boolean;
  onToggleRainAlert: () => void;
  walkingSpeed: 'slow' | 'normal' | 'brisk';
  onChangeWalkingSpeed: (speed: 'slow' | 'normal' | 'brisk') => void;
  bufferMinutes: number;
  onChangeBufferMinutes: (mins: number) => void;
  lowDataMode: boolean;
  onToggleLowDataMode: () => void;
  ltaApiKey: string;
  onSaveLtaApiKey: (key: string) => void;
  onRequestPushPermission: () => Promise<boolean>;
  pushPermissionState: NotificationPermission | 'unsupported';
  theme: ThemePalette;
  onChangeTheme: (theme: ThemePalette) => void;
}

export const NotificationSettingsSheet: React.FC<NotificationSettingsSheetProps> = ({
  onClose,
  noticeMinutes,
  onChangeNoticeMinutes,
  soundEnabled,
  onToggleSound,
  rainAlertEnabled,
  onToggleRainAlert,
  walkingSpeed,
  onChangeWalkingSpeed,
  bufferMinutes,
  onChangeBufferMinutes,
  lowDataMode,
  onToggleLowDataMode,
  ltaApiKey,
  onSaveLtaApiKey,
  onRequestPushPermission,
  pushPermissionState,
  theme,
  onChangeTheme
}) => {
  const [tempApiKey, setTempApiKey] = useState(ltaApiKey);
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveKey = () => {
    onSaveLtaApiKey(tempApiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg clay-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 clay-bus-lavender flex items-center justify-center text-white shadow-sm">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>Alerts & Settings</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Customize leave-by alerts, rain warnings, and walking speed
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* UI Accent Palette & Theme Personalization */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black text-purple-600/80 tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-500" />
                <span>UI Accent Palette & Theme</span>
              </label>
              <span className="text-[10px] font-black text-slate-500">
                {theme === 'pastel' ? '🌸 Blush & Lavender' : theme === 'ocean' ? '🌊 Ocean Breeze' : '🌙 Midnight Clay'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'pastel' as ThemePalette,
                  label: 'Blush & Mint',
                  sub: 'Soft pink & lavender',
                  badge: '🌸 Pastel',
                  swatches: ['#F472B6', '#34D399', '#C084FC'],
                  activeClass: 'clay-card-pink ring-2 ring-pink-400'
                },
                {
                  id: 'ocean' as ThemePalette,
                  label: 'Ocean Breeze',
                  sub: 'Soft blues & teals',
                  badge: '🌊 Ocean',
                  swatches: ['#38BDF8', '#2DD4BF', '#0284C7'],
                  activeClass: 'clay-card-lavender ring-2 ring-sky-400'
                },
                {
                  id: 'dark' as ThemePalette,
                  label: 'Midnight Clay',
                  sub: 'Tactile dark slate',
                  badge: '🌙 Dark',
                  swatches: ['#1E293B', '#818CF8', '#34D399'],
                  activeClass: 'clay-card ring-2 ring-purple-400'
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeTheme(item.id)}
                  className={`p-3 rounded-[22px] text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[96px] ${
                    theme === item.id
                      ? `${item.activeClass} shadow-md scale-[1.02]`
                      : 'clay-pill-white text-slate-700 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black">{item.badge}</span>
                    {theme === item.id && (
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="my-1.5 flex items-center gap-1.5">
                    {item.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/60 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div>
                    <div className="text-xs font-black leading-tight">{item.label}</div>
                    <div className="text-[10px] font-bold text-slate-400 leading-tight mt-0.5">{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Push Notification Card */}
          <div className="p-4 rounded-[24px] clay-card-lavender space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 clay-btn-lavender flex items-center justify-center text-white shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">Push Notifications</div>
                  <div className="text-[11px] font-bold text-slate-500">
                    Status: <strong className="text-purple-700 capitalize font-black">{pushPermissionState}</strong>
                  </div>
                </div>
              </div>

              {pushPermissionState !== 'granted' && (
                <button
                  onClick={onRequestPushPermission}
                  className="px-4 py-2 clay-btn-lavender text-xs font-black cursor-pointer shadow-sm"
                >
                  Enable
                </button>
              )}
            </div>

            <p className="text-xs font-bold text-purple-900/80 leading-relaxed">
              Can Catch Not? gives you a friendly nudge before it's time to step out the door, and alerts you ahead of tropical storms! ☂️
            </p>
          </div>

          {/* Departure Notice Options */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider">
              Departure Alert Notice Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 5, 8].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onChangeNoticeMinutes(mins)}
                  className={`py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                    noticeMinutes === mins
                      ? 'clay-btn-mint shadow-md'
                      : 'clay-pill-white text-slate-700 hover:text-emerald-600'
                  }`}
                >
                  {mins}m before
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400">
              When an alert is armed, we alert you {noticeMinutes} minutes before your leave-by deadline.
            </p>
          </div>

          {/* Rain & Sound Toggles */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider">
              Audio & Weather Alerts
            </label>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-[22px] clay-card-pink">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full clay-btn-pink flex items-center justify-center text-white">
                    <CloudRain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800">Pre-Rain Shower Alarm</div>
                    <div className="text-[11px] font-bold text-slate-500">Alert before rain clouds reach your stop</div>
                  </div>
                </div>
                <button
                  onClick={onToggleRainAlert}
                  className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${
                    rainAlertEnabled ? 'clay-btn-pink' : 'clay-inset'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                      rainAlertEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-[22px] clay-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full clay-pill-white flex items-center justify-center text-purple-600">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800">Audio Chimes & Haptics</div>
                    <div className="text-[11px] font-bold text-slate-500">Play sweet chime when departure window opens</div>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${
                    soundEnabled ? 'clay-btn-lavender' : 'clay-inset'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                      soundEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Walking Pace */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider">
              Walking Speed & Buffer Cushion
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'slow', label: 'Relaxed', speed: '68 m/min' },
                { id: 'normal', label: 'Normal', speed: '84 m/min' },
                { id: 'brisk', label: 'Brisk', speed: '105 m/min' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeWalkingSpeed(item.id as any)}
                  className={`p-3 rounded-[20px] text-left transition-all cursor-pointer ${
                    walkingSpeed === item.id
                      ? 'clay-card-mint shadow-md'
                      : 'clay-pill-white text-slate-700 hover:text-emerald-700'
                  }`}
                >
                  <div className="text-xs font-black">{item.label}</div>
                  <div className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{item.speed}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-[22px] clay-card mt-2">
              <div>
                <div className="text-xs font-black text-slate-800">Safety Buffer Cushion</div>
                <div className="text-[11px] font-bold text-slate-500">Arrive before the bus pulls in</div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((b) => (
                  <button
                    key={b}
                    onClick={() => onChangeBufferMinutes(b)}
                    className={`w-9 h-9 rounded-full font-mono text-xs font-black transition-all cursor-pointer ${
                      bufferMinutes === b ? 'clay-btn-mint shadow-sm' : 'clay-pill-white text-slate-700'
                    }`}
                  >
                    {b}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Low Data Mode */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider">
              Data & Battery Saver
            </label>
            <div className="flex items-center justify-between p-3.5 rounded-[22px] clay-card">
              <div>
                <div className="text-xs font-black text-slate-800">Low Data Mode</div>
                <div className="text-[11px] font-bold text-slate-500">Batches sync calls every 20s to conserve mobile data</div>
              </div>
              <button
                onClick={onToggleLowDataMode}
                className={`w-12 h-7 rounded-full transition-all relative cursor-pointer ${
                  lowDataMode ? 'clay-btn-mint' : 'clay-inset'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                    lowDataMode ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* LTA DataMall Key */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-purple-600/70 tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>LTA DataMall Account Key</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="LTA Account Key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="flex-1 px-3.5 py-2.5 clay-inset text-slate-800 placeholder-slate-400 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleSaveKey}
                className="px-5 py-2.5 clay-btn-mint text-white text-xs font-black rounded-full shrink-0 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {keySaved ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : null}
                <span>{keySaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              Can Catch Not? works automatically out-of-the-box. Providing an LTA key connects directly to your DataMall account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/60 border-t border-purple-100/60 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 clay-btn-mint text-white font-black text-xs rounded-full shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
