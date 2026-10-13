import React, { useState, useEffect } from 'react';
import { BaseRate, Memo, Party, ShopProfile, Supplier, SupplierChalan } from '../types';
import { 
  toBengaliNumber, 
  toBnCurrency, 
  getBengaliDateString,
  getTodayDateInputValue,
  getYesterdayDateInputValue,
  getBengaliDateFromInput,
  getDayOfWeekBn,
  formatDisplayMemoNumber,
  formatDisplayChalanNumber,
  compareMemosDesc,
  compareChalansDesc
} from '../utils/bengaliUtils';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { hapticCancel, hapticDelete, hapticLight, hapticMedium } from '../utils/haptics';
import eggWarehouseBanner from '../assets/images/egg_warehouse_banner_1790454797592.jpg';
import { StatsCard } from './StatsCard';
import { ShoppingBag, Users as LucideUsers, DollarSign, Receipt as LucideReceipt, Wallet, Truck } from 'lucide-react';
import { AnimatedSearchBox } from './AnimatedSearchBox';

interface DashboardViewProps {
  shopProfile: ShopProfile;
  baseRate?: BaseRate;
  memos: Memo[];
  chalans?: SupplierChalan[];
  parties: Party[];
  suppliers?: Supplier[];
  useBengali: boolean;
  onOpenNewMemo: (defaultDate?: string) => void;
  onOpenNewChalan?: (defaultDate?: string) => void;
  onOpenRateSettings?: () => void;
  onUpdateBaseRate?: (newRate: BaseRate) => void;
  onViewMemoVoucher: (memo: Memo) => void;
  onViewChalanVoucher?: (chalan: SupplierChalan) => void;
  onSelectParty: (party: Party) => void;
  onGoToPartiesTab: () => void;
  onGoToMemosTab: () => void;
  onGoToSuppliersTab?: () => void;
  onOpenShareModal?: (memo: Memo) => void;
  onDeleteMemo?: (memoId: string) => void;
  onDeleteChalan?: (chalanId: string) => void;
  onOpenPartyDetails?: (party: Party) => void;
  onOpenSupplierDetails?: (supplier: Supplier) => void;
  onOpenGuide?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  shopProfile,
  baseRate,
  memos,
  chalans = [],
  parties,
  suppliers = [],
  useBengali,
  onOpenNewMemo,
  onOpenNewChalan,
  onOpenRateSettings,
  onUpdateBaseRate,
  onViewMemoVoucher,
  onViewChalanVoucher,
  onSelectParty,
  onGoToPartiesTab,
  onGoToMemosTab,
  onGoToSuppliersTab,
  onOpenShareModal,
  onDeleteMemo,
  onDeleteChalan,
  onOpenPartyDetails,
  onOpenSupplierDetails,
  onOpenGuide,
}) => {
  const [dashboardListTab, setDashboardListTab] = useState<'memos' | 'chalans'>('memos');
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  const [chalanToDelete, setChalanToDelete] = useState<SupplierChalan | null>(null);
  const [showTipsBanner, setShowTipsBanner] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('egg_arat_dismiss_quick_tips') !== 'true';
  });
  const todayStr = getTodayDateInputValue();
  const yesterdayStr = getYesterdayDateInputValue();

  // Date filtering mode: today | yesterday | custom (past date) | all
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(yesterdayStr);

  // Active target date string for filtering
  const activeDateString = 
    dateFilter === 'today' ? todayStr :
    dateFilter === 'yesterday' ? yesterdayStr :
    dateFilter === 'custom' ? customDate :
    null;

  // Filter memos by selected date - Memoized for extreme performance
  const filteredMemos = React.useMemo(() => {
    return memos
      .filter((m) => {
        if (dateFilter === 'all') return true;
        if (!activeDateString) return true;
        return m.date === activeDateString || m.createdAt.startsWith(activeDateString);
      })
      .sort(compareMemosDesc);
  }, [memos, dateFilter, activeDateString]);

  // Calculate metrics specifically for the selected date - Memoized
  const { totalEggsSold, totalBill, totalCashCollected, totalDueToday } = React.useMemo(() => {
    let eggs = 0, bill = 0, cash = 0, due = 0;
    for (let i = 0; i < filteredMemos.length; i++) {
      const m = filteredMemos[i];
      eggs += m.totalEggs || 0;
      bill += m.totalBill || 0;
      cash += m.cashPaid || 0;
      due += m.remainingDue || 0;
    }
    return { totalEggsSold: eggs, totalBill: bill, totalCashCollected: cash, totalDueToday: due };
  }, [filteredMemos]);

  // Filter chalans by selected date - Memoized
  const filteredChalans = React.useMemo(() => {
    return chalans
      .filter((c) => {
        if (dateFilter === 'all') return true;
        if (!activeDateString) return true;
        return c.date === activeDateString || (c.createdAt && c.createdAt.startsWith(activeDateString));
      })
      .sort(compareChalansDesc);
  }, [chalans, dateFilter, activeDateString]);

  const [dashSearch, setDashSearch] = useState('');

  const searchedMemos = React.useMemo(() => {
    if (!dashSearch.trim()) return filteredMemos;
    const q = dashSearch.trim().toLowerCase();
    return filteredMemos.filter((m) => 
      m.partyName.toLowerCase().includes(q) ||
      (m.memoNumber && m.memoNumber.toString().includes(q)) ||
      (m.partyPhone && m.partyPhone.includes(q))
    );
  }, [filteredMemos, dashSearch]);

  const searchedChalans = React.useMemo(() => {
    if (!dashSearch.trim()) return filteredChalans;
    const q = dashSearch.trim().toLowerCase();
    return filteredChalans.filter((c) => 
      c.supplierName.toLowerCase().includes(q) ||
      (c.chalanNumber && c.chalanNumber.toString().includes(q)) ||
      (c.supplierPhone && c.supplierPhone.includes(q))
    );
  }, [filteredChalans, dashSearch]);

  // Suppliers metrics - Memoized
  const totalSupplierPayable = React.useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
  }, [suppliers]);

  // Top due parties - Memoized
  const dueParties = React.useMemo(() => {
    return parties
      .filter((p) => p.currentDue > 0)
      .sort((a, b) => b.currentDue - a.currentDue);
  }, [parties]);

  // Top due suppliers (mahajon payables) - Memoized
  const dueSuppliers = React.useMemo(() => {
    return suppliers
      .filter((s) => (s.totalPayable || 0) > 0)
      .sort((a, b) => (b.totalPayable || 0) - (a.totalPayable || 0));
  }, [suppliers]);

  const today = new Date();
  const currentDayName = getDayOfWeekBn(todayStr);
  const todayDateFormatted = `${currentDayName ? `${currentDayName}, ` : ''}${getBengaliDateString(today, useBengali)}`;

  // Display label for currently selected date
  const selectedDateLabel = 
    dateFilter === 'today' ? 'আজকের হিসাব' :
    dateFilter === 'yesterday' ? `গতকালের হিসাব (${getBengaliDateFromInput(yesterdayStr, useBengali)})` :
    dateFilter === 'custom' ? `${getDayOfWeekBn(customDate) ? `${getDayOfWeekBn(customDate)}, ` : ''}${getBengaliDateFromInput(customDate, useBengali)}` :
    'সকল মেমোর হিসাব';

  // Helper to jump N days back
  const jumpDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${d.getFullYear()}-${m}-${day}`;
    setCustomDate(iso);
    setDateFilter('custom');
  };

  const handleShareVoucher = (memo: Memo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenShareModal) {
      onOpenShareModal(memo);
    } else {
      const text = `*${shopProfile.name}*
ক্যাশ মেমো: ${memo.memoNumber}
খরিদ্দার: ${memo.partyName}
তারিখ: ${memo.formattedDate}
ডিম: ${memo.items.map(i => `${i.eggType} (${toBengaliNumber(i.count, useBengali)} পিস)`).join(', ')}
মোট বিল: ${toBnCurrency(memo.totalBill, useBengali)}
পরিশোধ: ${toBnCurrency(memo.cashPaid, useBengali)}
বাকি: ${toBnCurrency(memo.remainingDue, useBengali)}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleShareChalan = (chalan: SupplierChalan, e: React.MouseEvent) => {
    e.stopPropagation();
    const remDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);
    const text = `*${shopProfile.name}*
ডিমের ক্রয় চালান নং: ${formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
মহাজন / খামারি: ${chalan.supplierName}
তারিখ: ${chalan.formattedDate}
মোট ডিম: ${toBengaliNumber(chalan.eggCount, useBengali)} পিস
চালানের বিল: ${toBnCurrency(chalan.totalAmount, useBengali)}
নগদ পরিশোধ: ${toBnCurrency(chalan.paidAmount, useBengali)}
দেনা / বাকি: ${toBnCurrency(remDue, useBengali)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="dashboard-container" className="space-y-3 pb-16">
      {/* ১. সবার উপরে তারিখ এর বক্স - Material Elevated Hero Container with Egg Warehouse Banner */}
      <div 
        id="dashboard-date-card"
        className="relative overflow-hidden text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-white/20 transition-all mt-0"
      >
        {/* Background Banner Image of Egg Warehouse */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden">
          <img 
            src={eggWarehouseBanner} 
            alt="ডিমের আড়ৎ ব্যানার" 
            className="w-full h-full object-cover brightness-95 contrast-[1.05] saturate-110 object-center transition-all duration-300" 
            onError={(e) => {
              e.currentTarget.src = '/egg_warehouse_banner.jpg';
            }}
          />
          {/* Measured scrim to ensure high-contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/60 to-slate-950/40" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
          {/* Left: Material Date Display directly on the egg warehouse image */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 shrink-0 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center border border-amber-300/80 shadow-sm shadow-amber-400/20">
              <CalendarTodayRoundedIcon className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {dateFilter === 'today' ? todayDateFormatted : selectedDateLabel}
                </span>
                <span className="bg-amber-400/90 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs shrink-0 tracking-tight">
                  {dateFilter === 'today' ? 'আজকের দিন' : 'তারিখ ফিল্টার'}
                </span>
              </div>
              <div className="text-[11px] text-white/90 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-1.5 mt-0.5">
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{shopProfile.name || 'ডিমের আড়ৎ হিসাব'}</span>
                <span className="opacity-60">•</span>
                <span className="text-amber-200 font-mono font-black shrink-0">{activeDateString || todayStr}</span>
              </div>
            </div>
          </div>

          {/* Right: Material Segmented Filter Chips */}
          <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none pt-1 sm:pt-0 bg-black/40 p-1 rounded-full border border-white/20 backdrop-blur-md">
            <button
              id="filter-today"
              type="button"
              onClick={() => {
                hapticLight();
                setDateFilter('today');
              }}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 tactile-tap ${
                dateFilter === 'today'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md border border-amber-200 font-black'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              আজকের হিসাব
            </button>
            <button
              id="filter-yesterday"
              type="button"
              onClick={() => {
                hapticLight();
                setDateFilter('yesterday');
              }}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 tactile-tap ${
                dateFilter === 'yesterday'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md border border-amber-200 font-black'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              গতকালের
            </button>
            <button
              id="filter-custom"
              type="button"
              onClick={() => {
                hapticLight();
                setDateFilter('custom');
              }}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black flex items-center gap-1 whitespace-nowrap active:scale-95 tactile-tap ${
                dateFilter === 'custom'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md border border-amber-200 font-black'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <FilterAltRoundedIcon className="w-3.5 h-3.5" />
              <span>পূর্বের তারিখ</span>
            </button>
            <button
              id="filter-all"
              type="button"
              onClick={() => {
                hapticLight();
                setDateFilter('all');
              }}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 tactile-tap ${
                dateFilter === 'all'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md border border-amber-200 font-black'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              সকল মেমো
            </button>
          </div>
        </div>

        {/* Interactive Custom Date Picker Section (When 'পূর্বের তারিখ' is selected) */}
        {dateFilter === 'custom' && (
          <div className="mt-3 pt-2.5 border-t border-white/20 space-y-2 animate-in fade-in duration-150 relative z-10 text-xs">
            <div className="flex items-center justify-between text-white flex-wrap gap-1">
              <span className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-1.5 text-xs sm:text-sm">
                <CalendarTodayRoundedIcon className="w-4 h-4 text-amber-400" />
                <span>পূর্বের তারিখ নির্বাচন করুন:</span>
              </span>
              <span className="font-black text-slate-950 bg-amber-400 px-3 py-0.5 rounded-full text-xs shadow-md border border-amber-200">
                {getDayOfWeekBn(customDate) ? `${getDayOfWeekBn(customDate)}, ` : ''}{getBengaliDateFromInput(customDate, useBengali)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                id="input-dashboard-custom-date"
                type="date"
                value={customDate}
                max={todayStr}
                onChange={(e) => {
                  hapticLight();
                  setCustomDate(e.target.value);
                }}
                className="flex-1 text-xs sm:text-sm font-black py-1.5 px-3 bg-black/60 border-2 border-amber-400 rounded-xl text-white [color-scheme:dark] shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    jumpDaysAgo(2);
                  }}
                  className="text-[11px] font-bold px-2 py-0.5 bg-black/50 hover:bg-black/70 text-white border border-white/30 rounded-lg shadow-2xs transition active:scale-95 whitespace-nowrap tactile-tap"
                >
                  -২ দিন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    jumpDaysAgo(3);
                  }}
                  className="text-[11px] font-bold px-2 py-0.5 bg-black/50 hover:bg-black/70 text-white border border-white/30 rounded-lg shadow-2xs transition active:scale-95 whitespace-nowrap tactile-tap"
                >
                  -৩ দিন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    jumpDaysAgo(7);
                  }}
                  className="text-[11px] font-bold px-2 py-0.5 bg-black/50 hover:bg-black/70 text-white border border-white/30 rounded-lg shadow-2xs transition active:scale-95 whitespace-nowrap tactile-tap"
                >
                  -৭ দিন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Quick Tips Banner for First-Time Users */}
      {showTipsBanner && (
        <div 
          id="dashboard-onboarding-banner"
          className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/40 border-2 border-amber-400/50 dark:border-amber-600/40 rounded-2xl p-3 shadow-xs space-y-2 animate-in slide-in-from-top-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                <LightbulbRoundedIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>প্রথমবার ব্যবহারকারীদের জন্য সহজ টিপস</span>
                  <span className="bg-amber-400 text-slate-950 text-[9.5px] px-1.5 py-0.2 rounded-full font-black">নতুন</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  মাত্র ৩ ক্লিকে ডিমের ক্যাশ মেমো বানান, বাকি খতিয়ান রাখুন এবং হোয়াটসঅ্যাপে ভাউচার পাঠান।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticLight();
                setShowTipsBanner(false);
                localStorage.setItem('egg_arat_dismiss_quick_tips', 'true');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="টিপস বন্ধ করুন"
            >
              <CloseRoundedIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-300/40 dark:border-amber-800/40">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-slate-700 shrink-0">
                ১. মেমো তৈরি
              </span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-slate-700 shrink-0">
                ২. বাকি আদায়
              </span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-slate-700 shrink-0">
                ৩. চালান খতিয়ান
              </span>
            </div>

            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  hapticMedium();
                  onOpenGuide();
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow-2xs transition active:scale-95 shrink-0 flex items-center gap-1"
              >
                <span>গাইড দেখুন</span>
                <ArrowOutwardRoundedIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ২. দ্রুত অ্যাকশন বার - Sleek & Attractive Proportional Action Buttons */}
      <div className="space-y-1.5">
        {/* Row 1: The Two Main Creation Actions: New Memo & New Chalan */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-dashboard-new-memo"
            onClick={() => {
              hapticMedium();
              onOpenNewMemo(activeDateString || todayStr);
            }}
            className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl py-2.5 px-3 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black shadow-md border border-blue-400/50 tactile-tap"
          >
            <AddRoundedIcon className="w-4 h-4" />
            <span>নতুন বিক্রি মেমো</span>
          </button>

          <button
            type="button"
            id="btn-dashboard-new-chalan"
            onClick={() => {
              hapticMedium();
              if (onOpenNewChalan) onOpenNewChalan(activeDateString || todayStr);
              else if (onGoToSuppliersTab) onGoToSuppliersTab();
            }}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl py-2.5 px-3 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black shadow-md border border-purple-400/50 tactile-tap"
          >
            <AddRoundedIcon className="w-4 h-4" />
            <span>নতুন মহাজন চালান</span>
          </button>
        </div>

        {/* Row 2: Secondary Quick Balance Indicators - Ultra-Slim & Sleek */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onGoToPartiesTab();
            }}
            className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 dark:from-emerald-950/40 dark:to-teal-950/25 rounded-lg py-0.5 px-2 h-7 sm:h-7.5 transition-all active:scale-[0.98] flex items-center justify-between text-[10px] sm:text-[11px] font-bold min-w-0 group border border-emerald-300/80 dark:border-emerald-700/70 shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
              <div className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <LucideUsers size={10} />
              </div>
              <span className="truncate text-emerald-950 dark:text-emerald-200">পার্টি বাকি:</span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-300 font-mono font-black shrink-0 ml-1 tabular-nums text-[11px] sm:text-xs">
              {toBnCurrency(parties.reduce((sum, p) => sum + (p.currentDue || 0), 0), useBengali)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              if (onGoToSuppliersTab) onGoToSuppliersTab();
            }}
            className="bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-rose-500/15 dark:from-rose-950/40 dark:to-orange-950/25 rounded-lg py-0.5 px-2 h-7 sm:h-7.5 transition-all active:scale-[0.98] flex items-center justify-between text-[10px] sm:text-[11px] font-bold min-w-0 group border border-rose-300/80 dark:border-rose-700/70 shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
              <div className="w-4 h-4 rounded-md bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Truck size={10} />
              </div>
              <span className="truncate text-rose-950 dark:text-rose-200">মহাজন দেনা:</span>
            </div>
            <span className="text-rose-700 dark:text-rose-300 font-mono font-black shrink-0 ml-1 tabular-nums text-[11px] sm:text-xs">
              {toBnCurrency(totalSupplierPayable, useBengali)}
            </span>
          </button>
        </div>
      </div>

      {/* ৩. আজকের ডিমের বাজার দর (Daily Market Base Rates Widget with Settings Button) */}
      <div 
        id="dashboard-base-rates-card"
        className="glass-card rounded-xl p-2 sm:p-2.5 border shadow-xs space-y-1.5 transition-all"
      >
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-[11px] shadow-xs shrink-0 ring-1 ring-amber-400/50">
              🥚
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
              আজকের ডিমের বাজার দর (প্রতি ১০০ পিস)
            </span>
          </div>

          {onOpenRateSettings && (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onOpenRateSettings();
              }}
              className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 shadow-2xs flex items-center gap-1 transition active:scale-95 shrink-0"
              title="বাজার দর পরিবর্তন করুন"
            >
              <span>দর পরিবর্তন</span>
              <ArrowOutwardRoundedIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 2 Egg Category Rates Grid (Red & White only, Read-Only) */}
        <div className="grid grid-cols-2 gap-2 text-center">
          {/* 1. লাল ডিম */}
          <div className="p-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px] font-black text-rose-700 dark:text-rose-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>লাল ডিম:</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
              <span className="text-xs font-black text-slate-950 dark:text-white tabular-nums">
                ৳{toBengaliNumber(baseRate?.redRate || 1170, useBengali)}
              </span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold">
                (৳{toBengaliNumber(((baseRate?.redRate || 1170) / 100).toFixed(2), useBengali)}/টি)
              </span>
            </div>
          </div>

          {/* 2. সাদা ডিম */}
          <div className="p-1.5 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-900/60 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px] font-black text-cyan-700 dark:text-cyan-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
              <span>সাদা ডিম:</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
              <span className="text-xs font-black text-slate-950 dark:text-white tabular-nums">
                ৳{toBengaliNumber(baseRate?.whiteRate || 1120, useBengali)}
              </span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold">
                (৳{toBengaliNumber(((baseRate?.whiteRate || 1120) / 100).toFixed(2), useBengali)}/টি)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ৪. চারটি মূল হিসাব মেট্রিক কার্ড - Glassmorphism Stats Cards from design snippet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
        {/* Metric 1: Total Eggs Sold */}
        <StatsCard
          title="মোট ডিম বিক্রি"
          value={`${toBengaliNumber(totalEggsSold, useBengali)} পিস`}
          change={`${toBengaliNumber(Math.floor(totalEggsSold / 30), useBengali)} খাঁচা ${totalEggsSold % 30 > 0 ? `+ ${toBengaliNumber(totalEggsSold % 30, useBengali)}` : ''}`}
          changeType="positive"
          icon={ShoppingBag}
          gradient="from-sky-500 to-blue-600"
        />

        {/* Metric 2: Total Bill */}
        <StatsCard
          title="মোট বিক্রি বিল"
          value={toBnCurrency(totalBill, useBengali)}
          change={`${toBengaliNumber(filteredMemos.length, useBengali)} টি মেমো`}
          changeType="positive"
          icon={LucideReceipt}
          gradient="from-indigo-500 to-purple-600"
        />

        {/* Metric 3: Cash Collected */}
        <StatsCard
          title="নগদ জমা আদায়"
          value={toBnCurrency(totalCashCollected, useBengali)}
          change="ক্যাশ কালেকশন"
          changeType="positive"
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
        />

        {/* Metric 4: Due Today */}
        <StatsCard
          title="আজকের বাকি পাওনা"
          value={toBnCurrency(totalDueToday, useBengali)}
          change={totalDueToday > 0 ? "বকেয়া জের" : "পরিশোধিত"}
          changeType={totalDueToday > 0 ? "negative" : "positive"}
          icon={Wallet}
          gradient="from-rose-500 to-orange-500"
        />
      </div>

      {/* ৪. রিসেন্ট পার্টি মেমো ও মহাজন খতিয়ান - Material 3 Segmented Lists */}
      <div id="dashboard-recent-memos-section" className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5 flex-wrap gap-2">
          {/* Subtab switcher between পার্টির মেমো vs মহাজন খতিয়ান - Sleek & Modern */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              id="dash-subtab-memos"
              onClick={() => {
                hapticLight();
                setDashboardListTab('memos');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all active:scale-95 tactile-tap ${
                dashboardListTab === 'memos'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ReceiptLongRoundedIcon className="w-3.5 h-3.5" />
              <span>রিসেন্ট মেমো</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dashboardListTab === 'memos' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {toBengaliNumber(filteredMemos.length, useBengali)}
              </span>
            </button>

            <button
              type="button"
              id="dash-subtab-chalans"
              onClick={() => {
                hapticLight();
                setDashboardListTab('chalans');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all active:scale-95 tactile-tap ${
                dashboardListTab === 'chalans'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LocalShippingRoundedIcon className="w-3.5 h-3.5" />
              <span>মহাজন খতিয়ান</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dashboardListTab === 'chalans' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {toBengaliNumber(filteredChalans.length, useBengali)}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={dashboardListTab === 'memos' ? onGoToMemosTab : (onGoToSuppliersTab || onGoToPartiesTab)}
              className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 px-2.5 py-1 rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1"
            >
              <span>{dashboardListTab === 'memos' ? 'সকল মেমো' : 'সকল মহাজন'}</span>
              <ArrowOutwardRoundedIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Animated Search Bar for Dashboard */}
        <AnimatedSearchBox
          id="dash-search-box"
          value={dashSearch}
          onChange={setDashSearch}
          placeholder={dashboardListTab === 'memos' ? "মেমো নং, পার্টির নাম বা ফোন..." : "চালান নং, মহাজনের নাম বা ফোন..."}
          badgeText="স্মার্ট সার্চ"
          buttonText="খুঁজুন"
          compact={true}
          resultsCount={dashboardListTab === 'memos' ? searchedMemos.length : searchedChalans.length}
        />

        {/* --- ৪.১ রিসেন্ট পার্টির মেমো তালিকা --- */}
        {dashboardListTab === 'memos' && (
          <div className="space-y-2">
            {searchedMemos.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs border border-blue-200 dark:border-blue-800">
                  <ReceiptLongRoundedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {dateFilter === 'today' ? 'আজকে এখনো কোনো মেমো তৈরি করা হয়নি' : 'এই তারিখে কোনো বিক্রয় মেমো পাওয়া যায়নি'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    {dateFilter === 'today' ? 'নতুন বিক্রি লিখতে নিচের বাটনে চাপুন অথবা পূর্বের দিন দেখতে তারিখ ফিল্টার ব্যবহার করুন' : 'অন্য তারিখ নির্বাচন করুন অথবা এই তারিখে নতুন মেমো লিখুন'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenNewMemo(activeDateString || todayStr)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition active:scale-95"
                >
                  <AddRoundedIcon className="w-4 h-4" />
                  <span>+ নতুন বিক্রি মেমো লিখুন</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {searchedMemos.map((memo) => {
                  const theme = getPartyColorTheme(memo.partyName, memo.partyId);
                  const isFullyPaid = memo.remainingDue <= 0;
                  const typeBadgeStyle = 
                    memo.partyType === 'পাইকারি' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700' :
                    memo.partyType === 'হোটেল' ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700' :
                    'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';

                  return (
                    <div
                      key={memo.id}
                      onClick={() => onViewMemoVoucher(memo)}
                      className={`glass-card rounded-2xl p-3 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 border-l-4 ${theme.borderLeft} ${theme.border}`}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`${theme.memoNumBadge} font-mono font-black text-[10px] px-1 py-0.2 rounded shadow-2xs`}>
                            {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPartyDetails) {
                                const matched = parties.find(
                                  (p) => p.id === memo.partyId || p.name.trim().toLowerCase() === memo.partyName.trim().toLowerCase()
                                );
                                if (matched) {
                                  onOpenPartyDetails(matched);
                                } else {
                                  onOpenPartyDetails({
                                    id: memo.partyId || 'temp-' + memo.partyName,
                                    name: memo.partyName,
                                    phone: memo.partyPhone,
                                    type: memo.partyType,
                                    currentDue: memo.remainingDue,
                                    createdAt: memo.createdAt,
                                  });
                                }
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-1 py-0.2 rounded border ${theme.nameBadge} hover:scale-[1.01] active:scale-95 transition-all text-left shadow-2xs`}
                            title="ক্লিক করে এই পার্টির সমস্ত মেমো ও হিসাব দেখুন"
                          >
                            <span className={`w-3 h-3 rounded bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[8.5px] font-black shrink-0`}>
                              {memo.partyName.trim().charAt(0)}
                            </span>
                            <span className="font-bold text-[11px] leading-none">
                              {memo.partyName}
                            </span>
                            <ArrowOutwardRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          </button>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-bold border ${typeBadgeStyle}`}>
                            {memo.partyType}
                          </span>
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <CalendarTodayRoundedIcon className="w-2.5 h-2.5 text-slate-500" />
                          <span>{memo.formattedDate}</span>
                        </span>
                      </div>

                      {/* Serialized Egg items with rates and total - ultra compact */}
                      <div className="space-y-0.5 my-0.5">
                        {memo.items.map((it, idx) => {
                          if (!it.count || it.count <= 0) return null;
                          const isRed = it.eggType === 'লাল ডিম';
                          const isWhite = it.eggType === 'সাদা ডিম';
                          const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                          const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-[10px] sm:text-[10.5px] font-bold px-1.5 py-0.2 rounded border ${
                                isRed
                                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                                  : isWhite
                                  ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100'
                                  : 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100'
                              }`}
                            >
                              <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                                <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8.5px] font-black text-white shrink-0 ${isRed ? 'bg-rose-600' : isWhite ? 'bg-cyan-600' : 'bg-purple-600'}`}>
                                  {toBengaliNumber(idx + 1, useBengali)}
                                </span>
                                <span className="truncate">
                                  {toBengaliNumber(it.count, useBengali)} {it.eggType} {toBengaliNumber(rateHundred, useBengali)} টাকা
                                </span>
                              </div>
                              <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-1 whitespace-nowrap text-right">
                                = {toBnCurrency(itemTotal, useBengali)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {memo.note && (
                        <p className="text-[9.5px] text-slate-800 dark:text-slate-200 font-bold italic bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
                          "{memo.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 flex-wrap min-w-0 text-[10px] sm:text-[10.5px]">
                          <span className="font-black text-slate-950 dark:text-white tabular-nums">
                            দাবি: {toBnCurrency(memo.totalDemand, useBengali)}
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-700 text-[9.5px] font-bold">
                              <CheckCircleRoundedIcon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> পরিশোধ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 px-1 py-0.2 rounded border border-rose-300 dark:border-rose-700 tabular-nums text-[9.5px] font-bold">
                              বাকি: {toBnCurrency(memo.remainingDue, useBengali)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="মেমো দেখুন"
                            onClick={() => {
                              hapticLight();
                              onViewMemoVoucher(memo);
                            }}
                            className="p-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs tactile-tap"
                          >
                            <VisibilityRoundedIcon style={{ fontSize: '13px' }} />
                          </button>
                          <button
                            title="প্রিন্ট করুন"
                            onClick={() => {
                              hapticLight();
                              onViewMemoVoucher(memo);
                            }}
                            className="p-1 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition active:scale-95 shadow-2xs tactile-tap"
                          >
                            <PrintRoundedIcon style={{ fontSize: '13px' }} />
                          </button>
                          <button
                            title="হোয়াটসঅ্যাপে শেয়ার"
                            onClick={(e) => {
                              hapticMedium();
                              handleShareVoucher(memo, e);
                            }}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs tactile-tap"
                          >
                            <ShareRoundedIcon style={{ fontSize: '13px' }} />
                          </button>
                          {onDeleteMemo && (
                            <button
                              title="মেমো মুছুন"
                              type="button"
                              onClick={() => {
                                hapticCancel();
                                setMemoToDelete(memo);
                              }}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs tactile-tap"
                            >
                              <DeleteOutlineRoundedIcon style={{ fontSize: '13px' }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- ৪.২ মহাজন খতিয়ান (ক্রয় চালান তালিকা) --- */}
        {dashboardListTab === 'chalans' && (
          <div className="space-y-2">
            {searchedChalans.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs border border-indigo-200 dark:border-indigo-800">
                  <LocalShippingRoundedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {dateFilter === 'today' ? 'আজকে এখনো কোনো চালান তৈরি করা হয়নি' : 'এই তারিখে কোনো চালান পাওয়া যায়নি'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    {dateFilter === 'today' ? 'মহাজন বা খামারির ডিম ক্রয়ের চালান যুক্ত করতে নিচের বাটনে চাপুন' : 'অন্য তারিখ নির্বাচন করুন অথবা এই তারিখে নতুন চালান লিখুন'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenNewChalan) onOpenNewChalan(activeDateString || todayStr);
                    else if (onGoToSuppliersTab) onGoToSuppliersTab();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-xs transition active:scale-95"
                >
                  <AddRoundedIcon className="w-4 h-4" />
                  <span>+ নতুন চালান যুক্ত করুন</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {searchedChalans.map((chalan) => {
                  const remDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);
                  const isFullyPaid = remDue <= 0;

                  return (
                    <div
                      key={chalan.id}
                      onClick={() => onViewChalanVoucher && onViewChalanVoucher(chalan)}
                      className="glass-card rounded-2xl p-3 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 border-l-4 border-l-purple-600 border-purple-200 dark:border-purple-800/80"
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-mono font-black text-[10px] px-1 py-0.2 rounded shadow-2xs">
                            {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenSupplierDetails) {
                                const matched = suppliers.find(
                                  (s) => s.id === chalan.supplierId || s.name.trim().toLowerCase() === chalan.supplierName.trim().toLowerCase()
                                );
                                if (matched) {
                                  onOpenSupplierDetails(matched);
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 px-1 py-0.2 rounded border bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 hover:scale-[1.01] active:scale-95 transition-all text-left shadow-2xs"
                            title="ক্লিক করে এই মহাজনের খতিয়ান দেখুন"
                          >
                            <span className="w-3 h-3 rounded bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[8.5px] font-black shrink-0">
                              {chalan.supplierName.trim().charAt(0)}
                            </span>
                            <span className="font-bold text-[11px] leading-none">
                              {chalan.supplierName}
                            </span>
                            <ArrowOutwardRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          </button>
                          {chalan.truckNumber && (
                            <span className="text-[8.5px] px-1 py-0.2 rounded font-bold border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 flex items-center gap-0.5">
                              <LocalShippingRoundedIcon className="w-2.5 h-2.5 text-slate-500" />
                              <span>{chalan.truckNumber}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <CalendarTodayRoundedIcon className="w-2.5 h-2.5 text-slate-500" />
                          <span>{chalan.formattedDate}</span>
                        </span>
                      </div>

                      {/* Egg summary items - ultra compact */}
                      <div className="space-y-0.5 my-0.5">
                        {chalan.redEggCount && chalan.redEggCount > 0 ? (
                          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-bold px-1.5 py-0.2 rounded border bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100">
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8.5px] font-black text-white shrink-0 bg-rose-600">
                                ১
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.redEggCount, useBengali)} লাল ডিম {toBengaliNumber(chalan.redRatePerHundred || 0, useBengali)} টাকা
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-1 whitespace-nowrap text-right">
                              = {toBnCurrency(chalan.redTotalAmount || 0, useBengali)}
                            </span>
                          </div>
                        ) : null}

                        {chalan.whiteEggCount && chalan.whiteEggCount > 0 ? (
                          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-bold px-1.5 py-0.2 rounded border bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100">
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8.5px] font-black text-white shrink-0 bg-cyan-600">
                                {chalan.redEggCount && chalan.redEggCount > 0 ? '২' : '১'}
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.whiteEggCount, useBengali)} সাদা ডিম {toBengaliNumber(chalan.whiteRatePerHundred || 0, useBengali)} টাকা
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-1 whitespace-nowrap text-right">
                              = {toBnCurrency(chalan.whiteTotalAmount || 0, useBengali)}
                            </span>
                          </div>
                        ) : null}

                        {!chalan.redEggCount && !chalan.whiteEggCount && chalan.eggCount > 0 && (
                          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-bold px-1.5 py-0.2 rounded border bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100">
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8.5px] font-black text-white shrink-0 bg-purple-600">
                                ১
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.eggCount, useBengali)} পিস {chalan.ratePerHundred ? `${toBengaliNumber(chalan.ratePerHundred, useBengali)} টাকা` : ''}
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-1 whitespace-nowrap text-right">
                              = {toBnCurrency(chalan.totalAmount, useBengali)}
                            </span>
                          </div>
                        )}
                      </div>

                      {chalan.note && (
                        <p className="text-[9.5px] text-slate-800 dark:text-slate-200 font-bold italic bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
                          "{chalan.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 flex-wrap min-w-0 text-[10px] sm:text-[10.5px]">
                          <span className="font-black text-slate-950 dark:text-white tabular-nums">
                            বিল: {toBnCurrency(chalan.totalAmount, useBengali)}
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-700 text-[9.5px] font-bold">
                              <CheckCircleRoundedIcon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> পরিশোধ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 px-1 py-0.2 rounded border border-rose-300 dark:border-rose-700 tabular-nums text-[9.5px] font-bold">
                              দেনা: {toBnCurrency(remDue, useBengali)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {onViewChalanVoucher && (
                            <button
                              title="চালান ভাউচার দেখুন"
                              onClick={() => {
                                hapticLight();
                                onViewChalanVoucher(chalan);
                              }}
                              className="p-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs tactile-tap"
                            >
                              <VisibilityRoundedIcon style={{ fontSize: '13px' }} />
                            </button>
                          )}
                          <button
                            title="হোয়াটসঅ্যাপে শেয়ার"
                            onClick={(e) => {
                              hapticMedium();
                              handleShareChalan(chalan, e);
                            }}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs tactile-tap"
                          >
                            <ShareRoundedIcon style={{ fontSize: '13px' }} />
                          </button>
                          {onDeleteChalan && (
                            <button
                              title="চালান মুছুন"
                              type="button"
                              onClick={() => {
                                hapticCancel();
                                setChalanToDelete(chalan);
                              }}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs tactile-tap"
                            >
                              <DeleteOutlineRoundedIcon style={{ fontSize: '13px' }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ৫. খতিয়ান ও বাকি হিসাব - Material 3 Surface Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ৫.১ শীর্ষ বকেয়া খরিদ্দার (পার্টি বাকি খাতা) */}
        <div className="glass-card rounded-2xl p-3.5 shadow-xs border border-rose-200/80 dark:border-rose-900/60 space-y-2.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/60">
                <PeopleAltRoundedIcon className="w-4 h-4" />
              </div>
              <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">বাকি খরিদ্দার (পার্টি খাতা)</span>
            </div>
            <button
              onClick={onGoToPartiesTab}
              className="text-[11px] text-white font-extrabold bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1 transition active:scale-95"
            >
              <span>সকল বাকি</span>
              <ArrowOutwardRoundedIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {dueParties.length === 0 ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircleRoundedIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                কোনো বকেয়া নেই (সকল পাওনা পরিশোধিত)
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {dueParties.slice(0, 4).map((party) => {
                const theme = getPartyColorTheme(party.name, party.id);
                return (
                  <div
                    key={party.id}
                    onClick={() => (onOpenPartyDetails ? onOpenPartyDetails(party) : onSelectParty(party))}
                    className="p-2.5 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
                        {party.name.trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-xs text-slate-950 dark:text-white block truncate">
                          {party.name}
                        </span>
                        {party.phone && (
                          <a 
                            href={`tel:${party.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline mt-0.5"
                          >
                            <CallRoundedIcon className="w-3 h-3" />
                            <span>{party.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">বাকি পাওনা</span>
                      <span className="text-xs font-black text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                        {toBnCurrency(party.currentDue, useBengali)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ৫.২ শীর্ষ দেনা মহাজন (মহাজন দেনা খতিয়ান) */}
        <div className="glass-card rounded-2xl p-3.5 shadow-xs border border-purple-200/80 dark:border-purple-900/60 space-y-2.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/60">
                <LocalShippingRoundedIcon className="w-4 h-4" />
              </div>
              <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">মহাজন দেনা (মহাজন খতিয়ান)</span>
            </div>
            <button
              onClick={onGoToSuppliersTab}
              className="text-[11px] text-white font-extrabold bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1 transition active:scale-95"
            >
              <span>সকল মহাজন</span>
              <ArrowOutwardRoundedIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {dueSuppliers.length === 0 ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircleRoundedIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                কোনো মহাজন দেনা নেই (সকল বিল পরিশোধিত)
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {dueSuppliers.slice(0, 4).map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => onOpenSupplierDetails && onOpenSupplierDetails(supplier)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                      {supplier.name.trim().charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-xs text-slate-950 dark:text-white block truncate">
                        {supplier.name}
                      </span>
                      {supplier.phone && (
                        <a 
                          href={`tel:${supplier.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline mt-0.5"
                        >
                          <CallRoundedIcon className="w-3 h-3" />
                          <span>{supplier.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">দেনা বাকি</span>
                    <span className="text-xs font-black text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                      {toBnCurrency(supplier.totalPayable, useBengali)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Memo Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!memoToDelete}
        type="memo"
        memo={memoToDelete}
        useBengali={useBengali}
        onConfirm={() => {
          if (memoToDelete && onDeleteMemo) {
            onDeleteMemo(memoToDelete.id);
            setMemoToDelete(null);
          }
        }}
        onCancel={() => setMemoToDelete(null)}
      />

      {/* Chalan Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!chalanToDelete}
        type="chalan"
        chalan={chalanToDelete}
        useBengali={useBengali}
        onConfirm={() => {
          if (chalanToDelete && onDeleteChalan) {
            onDeleteChalan(chalanToDelete.id);
            setChalanToDelete(null);
          }
        }}
        onCancel={() => setChalanToDelete(null)}
      />
    </div>
  );
};
