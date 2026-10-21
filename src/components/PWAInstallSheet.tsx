import React from 'react';
import { X, Share, PlusSquare, Smartphone, Download, Sparkles } from 'lucide-react';

interface PWAInstallSheetProps {
  onClose: () => void;
  isInstallable: boolean;
  onTriggerInstall: () => void;
}

export const PWAInstallSheet: React.FC<PWAInstallSheetProps> = ({
  onClose,
  isInstallable,
  onTriggerInstall
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md clay-card shadow-2xl p-5 sm:p-6 space-y-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 clay-bus-mint flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>Install Can Catch Not?</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-[11px] font-bold text-slate-500">Add to iPhone or Android Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 clay-icon-btn flex items-center justify-center text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {isInstallable ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600">
              Install Can Catch Not? for instant full-screen access, background departure reminders, and zero data waste.
            </p>
            <button
              onClick={() => {
                onTriggerInstall();
                onClose();
              }}
              className="w-full py-3 clay-btn-mint text-white font-black text-xs rounded-full flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Install to Device</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-4 rounded-[24px] clay-card-lavender space-y-3">
              <div className="font-black text-purple-900 text-xs">
                iOS Safari Installation Steps:
              </div>
              <div className="flex items-start gap-2.5 text-xs text-purple-950 font-bold">
                <span className="w-5 h-5 rounded-full clay-btn-lavender text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                <div>
                  Tap the <strong className="text-slate-900">Share</strong> button <Share className="w-3.5 h-3.5 inline mx-0.5 text-purple-600" /> in the Safari toolbar at the bottom of your screen.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-purple-950 font-bold">
                <span className="w-5 h-5 rounded-full clay-btn-lavender text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                <div>
                  Scroll down the action sheet and tap <strong className="text-slate-900">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-purple-600" />.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-purple-950 font-bold">
                <span className="w-5 h-5 rounded-full clay-btn-lavender text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                <div>
                  Tap <strong className="text-slate-900">Add</strong> in the top right corner. Can Catch Not? will launch in standalone mode!
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 clay-pill-white text-slate-700 hover:text-slate-900 font-black text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
