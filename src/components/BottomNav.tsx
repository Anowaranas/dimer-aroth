import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';

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

  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl"
    >
      <div className="max-w-xl md:max-w-2xl mx-auto grid grid-cols-5 h-16 px-2 items-center">
        {/* 1. ড্যাশবোর্ড - Royal Blue Theme */}
        <button
          type="button"
          id="nav-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center relative transition-all duration-200 py-1 ${
            currentTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-3 py-1 rounded-xl transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30 shadow-2xs'
                : ''
            }`}
          >
            <DashboardIcon className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-105 text-blue-600 dark:text-blue-400' : ''}`} />
          </div>
          <span className={`text-[11px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'dashboard' ? 'font-black text-blue-950 dark:text-blue-200' : 'font-semibold'}`}>
            ড্যাশবোর্ড
          </span>
          {currentTab === 'dashboard' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* 2. খাতা (পার্টি ও মহাজন খাতা একত্র) - Indigo Theme */}
        <button
          type="button"
          id="nav-tab-khata"
          onClick={() => setActiveTab('khata')}
          className={`flex flex-col items-center justify-center relative transition-all duration-200 py-1 ${
            currentTab === 'khata'
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-3 py-1 rounded-xl transition-all duration-200 ${
              currentTab === 'khata'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30 shadow-2xs'
                : ''
            }`}
          >
            <MenuBookIcon className={`w-5 h-5 transition-transform ${currentTab === 'khata' ? 'scale-105 text-indigo-600 dark:text-indigo-400' : ''}`} />
            {hasDueNotification && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900 animate-pulse shadow-xs" />
            )}
          </div>
          <span className={`text-[11px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'khata' ? 'font-black text-indigo-950 dark:text-indigo-200' : 'font-semibold'}`}>
            খাতা
          </span>
          {currentTab === 'khata' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        {/* 3. center button: ➕ নতুন বিক্রি (Refined Vibrant Primary Action Button) */}
        <div className="flex flex-col items-center justify-center -mt-5 relative z-10">
          <button
            type="button"
            id="nav-btn-center-new-sale"
            onClick={onOpenNewSale}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 ring-4 ring-white dark:ring-slate-900 active:scale-90 hover:scale-105 transition-all duration-150 group"
            title="নতুন বিক্রি মেমো তৈরি করুন"
            aria-label="নতুন বিক্রি মেমো"
          >
            <AddIcon className="w-7 h-7 text-white transition-transform group-hover:rotate-90 duration-200 drop-shadow-xs" />
          </button>
          <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-200 mt-1 leading-none tracking-tight">
            নতুন বিক্রি
          </span>
        </div>

        {/* 4. সকল মেমো - Emerald Theme */}
        <button
          type="button"
          id="nav-tab-memos"
          onClick={() => setActiveTab('memos')}
          className={`flex flex-col items-center justify-center relative transition-all duration-200 py-1 ${
            currentTab === 'memos'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-3 py-1 rounded-xl transition-all duration-200 ${
              currentTab === 'memos'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
                : ''
            }`}
          >
            <DescriptionIcon className={`w-5 h-5 transition-transform ${currentTab === 'memos' ? 'scale-105 text-emerald-600 dark:text-emerald-400' : ''}`} />
          </div>
          <span className={`text-[11px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'memos' ? 'font-black text-emerald-950 dark:text-emerald-200' : 'font-semibold'}`}>
            মেমো
          </span>
          {currentTab === 'memos' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        {/* 5. সেটিংস - Slate Theme */}
        <button
          type="button"
          id="nav-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center relative transition-all duration-200 py-1 ${
            currentTab === 'settings'
              ? 'text-slate-900 dark:text-slate-100 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div 
            className={`relative px-3 py-1 rounded-xl transition-all duration-200 ${
              currentTab === 'settings'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-1 ring-slate-500/30 shadow-2xs'
                : ''
            }`}
          >
            <SettingsIcon className={`w-5 h-5 transition-transform ${currentTab === 'settings' ? 'scale-105 text-slate-900 dark:text-slate-100' : ''}`} />
          </div>
          <span className={`text-[11px] mt-0.5 leading-tight tracking-tight whitespace-nowrap ${currentTab === 'settings' ? 'font-black text-slate-950 dark:text-slate-100' : 'font-semibold'}`}>
            সেটিংস
          </span>
          {currentTab === 'settings' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-slate-700 dark:bg-slate-300 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
