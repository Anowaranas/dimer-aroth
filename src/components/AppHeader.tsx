import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  HelpCircle, 
  Cloud, 
  RefreshCw, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { ShopProfile, AuthUser } from '../types';
import { APP_LOGO_SRC } from '../assets/logo';
import { PWAInstallButton } from './PWAInstallButton';
import { toBengaliNumber, BENGALI_MONTHS } from '../utils/bengaliUtils';

interface AppHeaderProps {
  shopProfile: ShopProfile;
  authUser: AuthUser | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  useBengali: boolean;
  setUseBengali: (val: boolean) => void;
  isRefreshingCloud: boolean;
  onRefreshCloud: () => void;
  onOpenCloudModal: () => void;
  onOpenLoginModal: () => void;
  onOpenGuideModal: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  shopProfile,
  authUser,
  darkMode,
  setDarkMode,
  useBengali,
  setUseBengali,
  isRefreshingCloud,
  onRefreshCloud,
  onOpenCloudModal,
  onOpenLoginModal,
  onOpenGuideModal,
  onOpenSettings,
}) => {
  const [logoError, setLogoError] = useState(false);

  // Format today's date neatly
  const today = new Date();
  const todayDateNum = today.getDate();
  const todayMonth = BENGALI_MONTHS[today.getMonth()];
  const todayDateStr = useBengali 
    ? `${toBengaliNumber(todayDateNum, true)} ${todayMonth}`
    : `${todayDateNum} ${today.toLocaleString('en-US', { month: 'short' })}`;

  const isCloudActive = Boolean(authUser?.isLoggedIn);

  const handleCloudBadgeClick = () => {
    if (isCloudActive) {
      onOpenCloudModal();
    } else {
      onOpenLoginModal();
    }
  };

  return (
    <header
      id="global-top-app-bar"
      className="sticky top-0 z-30 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-xs transition-colors safe-area-pt"
    >
      {/* Top Colorful Accent Strip (গ্রাহকের পছন্দের বাড়তি রঙের স্ট্রিপ) */}
      <div 
        className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 shadow-2xs" 
        aria-hidden="true" 
      />

      {/* Main Header Content Bar */}
      <div className="px-2.5 sm:px-4 md:px-6 py-2 flex items-center justify-between gap-2">
        {/* Left: Shop Brand Identity & Profile Navigation */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group active:scale-[0.98] transition-transform"
          title="আড়ত সেটিংস ও প্রোফাইল দেখুন"
        >
          {/* Logo / App Emblem */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-xs ring-1.5 ring-amber-400/40 dark:ring-amber-500/30 shrink-0 overflow-hidden group-hover:ring-amber-500 transition-all">
            {!logoError && APP_LOGO_SRC ? (
              <img 
                src={APP_LOGO_SRC} 
                alt="App Logo" 
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover rounded-[14px]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-600 rounded-[14px] text-white">
                <span className="text-lg drop-shadow-xs">🥚</span>
              </div>
            )}
            {/* Ambient online indicator badge */}
            <span 
              className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0c1222] ${
                isCloudActive ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={isCloudActive ? 'ক্লাউড সিঙ্ক সক্রিয়' : 'লোকাল মেমোরি'}
            />
          </div>

          {/* Shop Title, Cloud Badge & Subtitle */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* First Row: Shop Name & Cloud Badge */}
            <div className="flex items-center gap-1.5 flex-nowrap">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {shopProfile.name || 'প্রতিদিন ডিমের আড়ৎ'}
              </h1>
              
              <span title="ভেরিফাইড ব্যবসায়িক আড়ৎ" className="hidden xs:inline-flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              </span>

              {/* Interactive Cloud / Local Sync Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloudBadgeClick();
                }}
                className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 border transition-all active:scale-95 ${
                  isCloudActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/80'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/80'
                }`}
                title={isCloudActive ? 'ক্লাউড ডাটাবেজ সিঙ্কড (ট্যাপ করে ব্যাকআপ তথ্য দেখুন)' : 'লোকাল মোড (ট্যাপ করে ক্লাউড ব্যাকআপ লগইন করুন)'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isCloudActive ? (
                  isRefreshingCloud ? 'সিঙ্ক হচ্ছে...' : 'ক্লাউড'
                ) : (
                  'লোকাল'
                )}
              </button>
            </div>

            {/* Second Row: Proprietor + Today's Date */}
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate leading-none">
              <span className="truncate">
                {shopProfile.proprietor ? `প্রোঃ ${shopProfile.proprietor}` : (shopProfile.tagline || 'হিসাব খাতা ও মেমো')}
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
              <span className="hidden xs:inline-flex items-center gap-0.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-1 py-0.2 rounded text-[9.5px]">
                <Calendar className="w-2.5 h-2.5 text-amber-500" />
                {todayDateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick PWA Install Button (renders only if installable or iOS) */}
          <PWAInstallButton variant="header" className="hidden sm:flex" />

          {/* Quick Cloud Sync Trigger Button (if user is logged in) */}
          {isCloudActive && (
            <button
              type="button"
              id="top-bar-cloud-sync-btn"
              onClick={onRefreshCloud}
              disabled={isRefreshingCloud}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition active:scale-95 border ${
                isRefreshingCloud
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 border-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 shadow-2xs'
              }`}
              title="ক্লাউড ডাটা রিফ্রেশ ও সিঙ্ক করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          {/* Bengali Numerals / Language Toggle */}
          <button
            type="button"
            id="top-bar-numeral-toggle-btn"
            onClick={() => setUseBengali(!useBengali)}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] sm:text-[11px] font-black transition active:scale-95 shadow-2xs border border-slate-200/70 dark:border-white/10"
            title="বাংলা / ইংরেজি সংখ্যা পরিবর্তন করুন"
          >
            {useBengali ? 'বাংলা' : 'Eng'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            id="top-bar-dark-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs border border-slate-200/70 dark:border-white/10"
            title={darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 drop-shadow-xs" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600 drop-shadow-xs" />
            )}
          </button>

          {/* Guide Button */}
          <button
            type="button"
            id="top-bar-guide-btn"
            onClick={onOpenGuideModal}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-2xs"
            title="ব্যবহারের নিয়ম ও গাইড দেখুন"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xs:inline">গাইড</span>
          </button>
        </div>
      </div>
    </header>
  );
};
