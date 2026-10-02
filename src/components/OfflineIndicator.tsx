import React from 'react';
import { useOnlineStatus } from '../utils/usePWAInstall';
import { WifiOff, CloudOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 flex items-center justify-between gap-3 bg-amber-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-amber-400/30 text-xs font-semibold animate-slide-up">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-lg bg-amber-700/50">
          <WifiOff className="w-4 h-4 text-amber-100" />
        </span>
        <div>
          <p className="font-bold">অফলাইন মোড চালু আছে</p>
          <p className="text-[11px] text-amber-100 opacity-90">সব মেমো ও হিসাব ডিভাইসে জমা থাকছে, নেট পেলে স্বয়ংক্রিয় সিঙ্ক হবে।</p>
        </div>
      </div>
      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
    </div>
  );
};
