import React from 'react';
import { Bell, CloudRain, Footprints, X, Sparkles } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'departure' | 'rain' | 'info';
  title: string;
  message: string;
  subtext?: string;
  timestamp: number;
}

interface NotificationBannerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2.5 max-w-md mx-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto w-full clay-card p-4 shadow-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-3 duration-200 text-slate-800 border-2 border-white/90"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
            n.type === 'rain'
              ? 'clay-btn-pink text-white'
              : n.type === 'departure'
              ? 'clay-btn-mint text-white'
              : 'clay-btn-lavender text-white'
          }`}>
            {n.type === 'rain' ? (
              <CloudRain className="w-4 h-4" />
            ) : n.type === 'departure' ? (
              <Footprints className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 truncate">{n.title}</span>
              <span className="text-[10px] text-purple-400 font-mono font-bold">Just now</span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-0.5 leading-snug">{n.message}</p>
            {n.subtext && (
              <span className="text-[11px] text-pink-600 font-black block mt-1 font-mono">
                {n.subtext}
              </span>
            )}
          </div>

          <button
            onClick={() => onDismiss(n.id)}
            className="w-7 h-7 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ))}
    </div>
  );
};
