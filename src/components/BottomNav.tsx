import React from 'react';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { hapticLight, hapticMedium } from '../utils/haptics';

export type TabType = 'dashboard' | 'khata' | 'parties' | 'suppliers' | 'memos' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewSale: () => void;
  hasDueNotification?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewSale,
  hasDueNotification = true,
}) => {
  // Normalize active tab so 'parties' or 'suppliers' highlights 'khata'
  const currentTab = (activeTab === 'parties' || activeTab === 'suppliers') ? 'khata' : activeTab;

  const handleTabClick = (tab: TabType) => {
    hapticLight();
    setActiveTab(tab);
  };

  const handleNewSaleClick = () => {
    hapticMedium();
    onOpenNewSale();
  };

  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_28px_rgba(0,0,0,0.5)] safe-area-pb"
    >
      <div className="w-full max-w-xl sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto grid grid-cols-5 h-16 px-1.5 sm:px-4 md:px-10 items-center">
        {/* 1. ড্যাশবোর্ড */}
        <button
          type="button"
          id="nav-tab-dashboard"
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center relative transition-all duration-150 py-0.5 active:scale-95 group tactile-tap ${
            currentTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-2.5 py-1 rounded-xl transition-all duration-150 flex items-center justify-center ${
              currentTab === 'dashboard'
                ? 'soft-inset bg-blue-500/15 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-xs'
                : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
            }`}
          >
            <DashboardRoundedIcon className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'dashboard' ? 'scale-105 text-blue-600 dark:text-blue-400' : 'group-hover:scale-105'}`} />
          </div>
          <span className={`text-[10.5px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'dashboard' ? 'font-black text-blue-900 dark:text-blue-200' : 'font-semibold'}`}>
            ড্যাশবোর্ড
          </span>
        </button>

        {/* 2. খাতা (পার্টি ও মহাজন খাতা একত্র) - Indigo Theme */}
        <button
          type="button"
          id="nav-tab-khata"
          onClick={() => handleTabClick('khata')}
          className={`flex flex-col items-center justify-center relative transition-all duration-150 py-0.5 active:scale-95 group tactile-tap ${
            currentTab === 'khata'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-2.5 py-1 rounded-xl transition-all duration-150 flex items-center justify-center ${
              currentTab === 'khata'
                ? 'soft-inset bg-indigo-500/15 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-xs'
                : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
            }`}
          >
            <MenuBookRoundedIcon className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'khata' ? 'scale-105 text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-105'}`} />
            {hasDueNotification && (
              <span className="absolute top-0 right-0.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900 animate-pulse shadow-xs" />
            )}
          </div>
          <span className={`text-[10.5px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'khata' ? 'font-black text-indigo-950 dark:text-indigo-200' : 'font-semibold'}`}>
            খাতা
          </span>
        </button>

        {/* 3. center button: ➕ নতুন বিক্রি (Refined Soft UI FAB) */}
        <div className="flex flex-col items-center justify-center -mt-3.5 relative z-10">
          <button
            type="button"
            id="nav-btn-center-new-sale"
            onClick={handleNewSaleClick}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center soft-fab soft-btn-primary ring-4 ring-white dark:ring-[#0c1222] active:scale-95 transition-all duration-200 group tactile-tap"
            title="নতুন বিক্রি মেমো তৈরি করুন"
            aria-label="নতুন বিক্রি মেমো"
          >
            <AddRoundedIcon className="w-6 h-6 text-white transition-transform group-hover:rotate-90 duration-200 drop-shadow-xs" />
          </button>
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 mt-1 leading-none tracking-tight">
            নতুন বিক্রি
          </span>
        </div>

        {/* 4. সকল মেমো - Emerald Theme */}
        <button
          type="button"
          id="nav-tab-memos"
          onClick={() => handleTabClick('memos')}
          className={`flex flex-col items-center justify-center relative transition-all duration-150 py-0.5 active:scale-95 group tactile-tap ${
            currentTab === 'memos'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-2.5 py-1 rounded-xl transition-all duration-150 flex items-center justify-center ${
              currentTab === 'memos'
                ? 'soft-inset bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs'
                : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
            }`}
          >
            <ReceiptLongRoundedIcon className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'memos' ? 'scale-105 text-emerald-600 dark:text-emerald-400' : 'group-hover:scale-105'}`} />
          </div>
          <span className={`text-[10.5px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'memos' ? 'font-black text-emerald-950 dark:text-emerald-200' : 'font-semibold'}`}>
            মেমো
          </span>
        </button>

        {/* 5. সেটিংস - Slate/Amber Theme */}
        <button
          type="button"
          id="nav-tab-settings"
          onClick={() => handleTabClick('settings')}
          className={`flex flex-col items-center justify-center relative transition-all duration-150 py-0.5 active:scale-95 group tactile-tap ${
            currentTab === 'settings'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-2.5 py-1 rounded-xl transition-all duration-150 flex items-center justify-center ${
              currentTab === 'settings'
                ? 'soft-inset bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs'
                : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
            }`}
          >
            <SettingsRoundedIcon className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'settings' ? 'scale-105 text-amber-600 dark:text-amber-400' : 'group-hover:scale-105'}`} />
          </div>
          <span className={`text-[10.5px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'settings' ? 'font-black text-amber-950 dark:text-amber-200' : 'font-semibold'}`}>
            সেটিংস
          </span>
        </button>
      </div>
    </nav>
  );
};
