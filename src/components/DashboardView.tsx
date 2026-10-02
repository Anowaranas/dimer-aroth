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
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import eggWarehouseBanner from '../assets/images/egg_warehouse_banner_1790454797592.jpg';
import { 
  ArrowUpRight, 
  CheckCircle, 
  Phone, 
  Eye, 
  Printer, 
  Share2, 
  Trash2, 
  Filter, 
  Clock, 
  Receipt, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

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
}) => {
  const [dashboardListTab, setDashboardListTab] = useState<'memos' | 'chalans'>('memos');
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  const [chalanToDelete, setChalanToDelete] = useState<SupplierChalan | null>(null);
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
    <div id="dashboard-container" className="space-y-2 pb-14">
      {/* ১. সবার উপরে তারিখ এর বক্স - সম্পূর্ণ স্বচ্ছ ও ট্রান্সপারেন্ট (ডিমের আড়তের ছবির উপরে তারিখ) */}
      <div 
        id="dashboard-date-card"
        className="relative overflow-hidden text-white rounded-xl p-2.5 sm:p-3 shadow-md border border-white/20 transition-all mt-0"
      >
        {/* Background Banner Image of Egg Warehouse - Completely Clear, Natural & Crisp */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden">
          <img 
            src={eggWarehouseBanner} 
            alt="ডিমের আড়ৎ ব্যানার" 
            className="w-full h-full object-cover brightness-100 contrast-[1.05] saturate-110 object-center transition-all duration-300" 
            onError={(e) => {
              e.currentTarget.src = '/egg_warehouse_banner.jpg';
            }}
          />
          {/* Transparent minimal gradient only so the egg warehouse photo remains fully clear and transparent while text stays sharp */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
          {/* Left: Transparent Date Display directly on the egg warehouse image */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-8 h-8 shrink-0 bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center border border-amber-200/80 shadow-xs">
              <CalendarTodayIcon style={{ fontSize: '18px' }} className="text-slate-950" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  {dateFilter === 'today' ? todayDateFormatted : selectedDateLabel}
                </span>
                <span className="bg-amber-400 text-slate-950 text-[9.5px] font-black px-2 py-0.2 rounded-full shadow-xs shrink-0">
                  {dateFilter === 'today' ? 'আজকের দিন' : 'ফিল্টার'}
                </span>
              </div>
              <span className="text-[11px] text-white/90 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,1)] flex items-center gap-1.5 mt-0.2">
                <span>ডিমের আড়ৎ হিসাব</span>
                <span>•</span>
                <span className="text-white font-mono font-black">{activeDateString || todayStr}</span>
              </span>
            </div>
          </div>

          {/* Right: Transparent Filter Buttons Styled Exactly Like the Top Part */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none pt-1 sm:pt-0">
            <button
              id="filter-today"
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 ${
                dateFilter === 'today'
                  ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-200'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/25 hover:bg-black/40 border border-white/20'
              }`}
            >
              আজকের হিসাব
            </button>
            <button
              id="filter-yesterday"
              type="button"
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 ${
                dateFilter === 'yesterday'
                  ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-200'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/25 hover:bg-black/40 border border-white/20'
              }`}
            >
              গতকালের
            </button>
            <button
              id="filter-custom"
              type="button"
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black flex items-center gap-1 whitespace-nowrap active:scale-95 ${
                dateFilter === 'custom'
                  ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-200'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/25 hover:bg-black/40 border border-white/20'
              }`}
            >
              <CalendarTodayIcon className="w-3.5 h-3.5" />
              <span>পূর্বের তারিখ</span>
            </button>
            <button
              id="filter-all"
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-full transition-all text-xs font-black whitespace-nowrap active:scale-95 ${
                dateFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-200'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/25 hover:bg-black/40 border border-white/20'
              }`}
            >
              সকল মেমো
            </button>
          </div>
        </div>

        {/* Interactive Custom Date Picker Section (When 'পূর্বের তারিখ' is selected) - Fully Transparent and Seamless */}
        {dateFilter === 'custom' && (
          <div className="mt-2.5 pt-2 border-t border-white/15 space-y-2 animate-in fade-in duration-150 relative z-10 text-xs">
            <div className="flex items-center justify-between text-white flex-wrap gap-1">
              <span className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-1.5 text-xs sm:text-sm">
                <CalendarTodayIcon className="w-4 h-4 text-amber-400" />
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
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 text-xs sm:text-sm font-black py-1.5 px-3 bg-black/40 border-2 border-amber-400 rounded-xl text-white [color-scheme:dark] shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => jumpDaysAgo(2)}
                  className="text-xs font-black px-3 py-1 bg-black/25 hover:bg-black/40 text-white border border-white/25 rounded-full shadow-xs transition active:scale-95 whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
                >
                  -২ দিন
                </button>
                <button
                  type="button"
                  onClick={() => jumpDaysAgo(3)}
                  className="text-xs font-black px-3 py-1 bg-black/25 hover:bg-black/40 text-white border border-white/25 rounded-full shadow-xs transition active:scale-95 whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
                >
                  -৩ দিন
                </button>
                <button
                  type="button"
                  onClick={() => jumpDaysAgo(7)}
                  className="text-xs font-black px-3 py-1 bg-black/25 hover:bg-black/40 text-white border border-white/25 rounded-full shadow-xs transition active:scale-95 whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
                >
                  -৭ দিন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ২. দ্রুত অ্যাকশন বার (Quick Action Bar with New Memo & New Chalan - Compact & Harmonious Colors) */}
      <div className="space-y-1.5">
        {/* Row 1: The Two Main Creation Actions: New Memo & New Chalan */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            id="btn-dashboard-new-memo"
            onClick={() => onOpenNewMemo(activeDateString || todayStr)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-2.5 shadow-sm shadow-blue-600/20 transition active:scale-95 text-center flex items-center justify-between group border border-blue-500/30"
          >
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1 font-black text-xs sm:text-sm">
                <AddIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>+ নতুন মেমো</span>
              </div>
              <span className="text-[9.5px] text-blue-100 font-bold block truncate">ডিম বিক্রি মেমো</span>
            </div>
            <span className="text-lg opacity-90 group-hover:scale-110 transition-transform ml-1">📝</span>
          </button>

          <button
            type="button"
            id="btn-dashboard-new-chalan"
            onClick={() => {
              if (onOpenNewChalan) onOpenNewChalan(activeDateString || todayStr);
              else if (onGoToSuppliersTab) onGoToSuppliersTab();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-2.5 shadow-sm shadow-indigo-600/20 transition active:scale-95 text-center flex items-center justify-between group border border-indigo-500/30"
          >
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1 font-black text-xs sm:text-sm">
                <AddIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>+ নতুন চালান</span>
              </div>
              <span className="text-[9.5px] text-indigo-100 font-bold block truncate">মহাজন ডিম ক্রয়</span>
            </div>
            <span className="text-lg opacity-90 group-hover:scale-110 transition-transform ml-1">🚚</span>
          </button>
        </div>

        {/* Row 2: Secondary Quick Shortcuts with Real-time Balances */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onGoToPartiesTab}
            className="bg-emerald-50/85 dark:bg-emerald-950/35 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/40 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 rounded-xl py-1.5 px-2.5 transition active:scale-95 flex items-center justify-between shadow-2xs text-xs font-black"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span>👥</span>
              <span className="truncate">পার্টি বাকি:</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-300 font-mono font-black shrink-0 ml-1">
              {toBnCurrency(parties.reduce((sum, p) => sum + (p.currentDue || 0), 0), useBengali)}
            </span>
          </button>

          <button
            type="button"
            onClick={onGoToSuppliersTab}
            className="bg-rose-50/85 dark:bg-rose-950/35 hover:bg-rose-100/90 dark:hover:bg-rose-900/40 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800/80 rounded-xl py-1.5 px-2.5 transition active:scale-95 flex items-center justify-between shadow-2xs text-xs font-black"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span>🚛</span>
              <span className="truncate">মহাজন দেনা:</span>
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-mono font-black shrink-0 ml-1">
              {toBnCurrency(totalSupplierPayable, useBengali)}
            </span>
          </button>
        </div>
      </div>

      {/* ৩. চারটি মূল হিসাব মেট্রিক কার্ড - Harmonious, High-Contrast & Crisp */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Metric 1: Total Eggs Sold (Pieces) */}
        <div className="bg-sky-50/80 dark:bg-slate-900 rounded-xl p-2.5 shadow-2xs border border-sky-200/90 dark:border-sky-800/80 relative overflow-hidden transition-all hover:border-sky-400 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🥚</span>
              <p className="text-xs text-sky-950 dark:text-sky-100 font-black">
                মোট বিক্রি
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-xs" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1.5 tabular-nums">
            {toBengaliNumber(totalEggsSold, useBengali)} <span className="text-xs font-bold text-sky-700 dark:text-sky-300">পিস</span>
          </p>
          <div className="mt-1">
            <span className="text-[10px] text-sky-950 dark:text-sky-200 font-bold bg-sky-100 dark:bg-sky-950/80 px-1.5 py-0.2 rounded inline-block border border-sky-200 dark:border-sky-800">
              {dateFilter === 'today' ? 'আজকের ডিম' : 'তারিখের ডিম'}
            </span>
          </div>
        </div>

        {/* Metric 2: Total Bill */}
        <div className="bg-indigo-50/80 dark:bg-slate-900 rounded-xl p-2.5 shadow-2xs border border-indigo-200/90 dark:border-indigo-800/80 relative overflow-hidden transition-all hover:border-indigo-400 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📋</span>
              <p className="text-xs text-indigo-950 dark:text-indigo-100 font-black">
                মোট বিল
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1.5 tabular-nums">
            {toBnCurrency(totalBill, useBengali)}
          </p>
          <div className="mt-1">
            <span className="text-[10px] text-indigo-950 dark:text-indigo-200 font-bold bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded inline-block border border-indigo-200 dark:border-indigo-800">
              {toBengaliNumber(filteredMemos.length, useBengali)} টি মেমো
            </span>
          </div>
        </div>

        {/* Metric 3: Cash Collected */}
        <div className="bg-emerald-50/80 dark:bg-slate-900 rounded-xl p-2.5 shadow-2xs border border-emerald-200/90 dark:border-emerald-800/80 relative overflow-hidden transition-all hover:border-emerald-400 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💵</span>
              <p className="text-xs text-emerald-950 dark:text-emerald-100 font-black">
                নগদ আদায়
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 leading-tight mt-1.5 tabular-nums">
            {toBnCurrency(totalCashCollected, useBengali)}
          </p>
          <div className="mt-1">
            <span className="text-[10px] text-emerald-950 dark:text-emerald-200 font-bold bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded inline-block border border-emerald-200 dark:border-emerald-800">
              ক্যাশ জমা
            </span>
          </div>
        </div>

        {/* Metric 4: Due Today */}
        <div className="bg-rose-50/80 dark:bg-slate-900 rounded-xl p-2.5 shadow-2xs border border-rose-200/90 dark:border-rose-800/80 relative overflow-hidden transition-all hover:border-rose-400 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚠️</span>
              <p className="text-xs text-rose-950 dark:text-rose-100 font-black">
                বাকি পাওনা
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 leading-tight mt-1.5 tabular-nums">
            {toBnCurrency(totalDueToday, useBengali)}
          </p>
          <div className="mt-1">
            <span className="text-[10px] text-rose-950 dark:text-rose-200 font-bold bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.2 rounded inline-block border border-rose-200 dark:border-rose-800">
              বকেয়া হিসাব
            </span>
          </div>
        </div>
      </div>

      {/* ৪. রিসেন্ট পার্টি মেমো ও মহাজন খতিয়ান (সিরিয়াল অনুযায়ী উপরে থাকবে) */}
      <div id="dashboard-recent-memos-section" className="space-y-2">
        <div className="flex items-center justify-between px-0.5 flex-wrap gap-2">
          {/* Subtab switcher between পার্টির মেমো vs মহাজন খতিয়ান */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              id="dash-subtab-memos"
              onClick={() => setDashboardListTab('memos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 ${
                dashboardListTab === 'memos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📝 রিসেন্ট পার্টি মেমো</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dashboardListTab === 'memos' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {toBengaliNumber(filteredMemos.length, useBengali)} টি
              </span>
            </button>

            <button
              type="button"
              id="dash-subtab-chalans"
              onClick={() => setDashboardListTab('chalans')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 ${
                dashboardListTab === 'chalans'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🚚 মহাজন খতিয়ান</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dashboardListTab === 'chalans' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {toBengaliNumber(filteredChalans.length, useBengali)} টি
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={dashboardListTab === 'memos' ? onGoToMemosTab : (onGoToSuppliersTab || onGoToPartiesTab)}
              className="text-xs font-black text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1"
            >
              <span>{dashboardListTab === 'memos' ? 'সকল মেমো' : 'সকল মহাজন'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* --- ৪.১ রিসেন্ট পার্টির মেমো তালিকা (সিরিয়াল অনুযায়ী উপরে) --- */}
        {dashboardListTab === 'memos' && (
          <div className="space-y-1.5">
            {filteredMemos.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 space-y-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg mx-auto shadow-xs">
                  🥚
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
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95"
                >
                  <AddIcon className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ নতুন বিক্রি মেমো লিখুন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredMemos.map((memo) => {
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
                      className={`bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border-2 border-l-[5px] ${theme.borderLeft} ${theme.border} hover:shadow-md ${theme.hoverBorder} transition-all cursor-pointer space-y-1.5 shadow-2xs`}
                    >
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`${theme.memoNumBadge} font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs`}>
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${theme.nameBadge} hover:scale-[1.02] active:scale-95 transition-all text-left shadow-2xs`}
                            title="ক্লিক করে এই পার্টির সমস্ত মেমো ও হিসাব দেখুন"
                          >
                            <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>
                              {memo.partyName.trim().charAt(0)}
                            </span>
                            <span className="font-black text-xs sm:text-sm">
                              {memo.partyName}
                            </span>
                            <ArrowUpRight className="w-3 h-3 opacity-70 shrink-0" />
                          </button>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border ${typeBadgeStyle}`}>
                            {memo.partyType}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                          📅 {memo.formattedDate}
                        </span>
                      </div>

                      {/* Serialized Egg items with rates and total */}
                      <div className="space-y-0.5">
                        {memo.items.map((it, idx) => {
                          if (!it.count || it.count <= 0) return null;
                          const isRed = it.eggType === 'লাল ডিম';
                          const isWhite = it.eggType === 'সাদা ডিম';
                          const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                          const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                isRed
                                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                                  : isWhite
                                  ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100'
                                  : 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${isRed ? 'bg-rose-600' : isWhite ? 'bg-cyan-600' : 'bg-purple-600'}`}>
                                  {toBengaliNumber(idx + 1, useBengali)}
                                </span>
                                <span className="truncate">
                                  {toBengaliNumber(it.count, useBengali)} {it.eggType} {toBengaliNumber(rateHundred, useBengali)} টাকা করে
                                </span>
                              </div>
                              <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-2">
                                = {toBnCurrency(itemTotal, useBengali)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {memo.note && (
                        <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold italic bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                          "{memo.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-950 dark:text-white block tabular-nums">
                            মোট দাবি: {toBnCurrency(memo.totalDemand, useBengali)}
                          </span>
                          <div className="text-xs font-bold">
                            {isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 px-2 py-0.2 rounded-md border border-emerald-300 dark:border-emerald-700 text-[11px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> পরিশোধিত
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 px-2 py-0.2 rounded-md border border-rose-300 dark:border-rose-700 tabular-nums text-[11px]">
                                বাকি: {toBnCurrency(memo.remainingDue, useBengali)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="মেমো দেখুন"
                            onClick={() => onViewMemoVoucher(memo)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="প্রিন্ট করুন"
                            onClick={() => onViewMemoVoucher(memo)}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition active:scale-95 shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="হোয়াটসঅ্যাপে শেয়ার"
                            onClick={(e) => handleShareVoucher(memo, e)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteMemo && (
                            <button
                              title="মেমো মুছুন"
                              type="button"
                              onClick={() => setMemoToDelete(memo)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* --- ৪.২ মহাজন খতিয়ান (ক্রয় চালান তালিকা - সিরিয়াল অনুযায়ী উপরে) --- */}
        {dashboardListTab === 'chalans' && (
          <div className="space-y-1.5">
            {filteredChalans.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 space-y-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-lg mx-auto shadow-xs">
                  🚚
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
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-700 hover:opacity-95 px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95"
                >
                  <AddIcon className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ নতুন চালান যুক্ত করুন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredChalans.map((chalan) => {
                  const remDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);
                  const isFullyPaid = remDue <= 0;

                  return (
                    <div
                      key={chalan.id}
                      onClick={() => onViewChalanVoucher && onViewChalanVoucher(chalan)}
                      className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border-2 border-l-[5px] border-l-purple-600 border-purple-200 dark:border-purple-800/80 hover:shadow-md transition-all cursor-pointer space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs">
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
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-2xs"
                            title="ক্লিক করে এই মহাজনের খতিয়ান দেখুন"
                          >
                            <span className="w-4 h-4 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              {chalan.supplierName.trim().charAt(0)}
                            </span>
                            <span className="font-black text-xs sm:text-sm">
                              {chalan.supplierName}
                            </span>
                            <ArrowUpRight className="w-3 h-3 opacity-70 shrink-0" />
                          </button>
                          {chalan.truckNumber && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 flex items-center gap-1">
                              <span>🚚</span>
                              <span>{chalan.truckNumber}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                          📅 {chalan.formattedDate}
                        </span>
                      </div>

                      {/* Egg summary items */}
                      <div className="space-y-0.5">
                        {chalan.redEggCount && chalan.redEggCount > 0 ? (
                          <div className="flex items-center justify-between text-[11px] font-bold px-2 py-0.5 rounded-md border bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 bg-rose-600">
                                ১
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.redEggCount, useBengali)} লাল ডিম {toBengaliNumber(chalan.redRatePerHundred || 0, useBengali)} টাকা করে
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-2">
                              = {toBnCurrency(chalan.redTotalAmount || 0, useBengali)}
                            </span>
                          </div>
                        ) : null}

                        {chalan.whiteEggCount && chalan.whiteEggCount > 0 ? (
                          <div className="flex items-center justify-between text-[11px] font-bold px-2 py-0.5 rounded-md border bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 bg-cyan-600">
                                {chalan.redEggCount && chalan.redEggCount > 0 ? '২' : '১'}
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.whiteEggCount, useBengali)} সাদা ডিম {toBengaliNumber(chalan.whiteRatePerHundred || 0, useBengali)} টাকা করে
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-2">
                              = {toBnCurrency(chalan.whiteTotalAmount || 0, useBengali)}
                            </span>
                          </div>
                        ) : null}

                        {!chalan.redEggCount && !chalan.whiteEggCount && chalan.eggCount > 0 && (
                          <div className="flex items-center justify-between text-[11px] font-bold px-2 py-0.5 rounded-md border bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 bg-purple-600">
                                ১
                              </span>
                              <span className="truncate">
                                {toBengaliNumber(chalan.eggCount, useBengali)} পিস ডিম {chalan.ratePerHundred ? `${toBengaliNumber(chalan.ratePerHundred, useBengali)} টাকা করে` : ''} {chalan.khachaCount ? `(${toBengaliNumber(chalan.khachaCount, useBengali)} খাঁচা)` : ''}
                              </span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-2">
                              = {toBnCurrency(chalan.totalAmount, useBengali)}
                            </span>
                          </div>
                        )}
                      </div>

                      {chalan.note && (
                        <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold italic bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                          "{chalan.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-950 dark:text-white block tabular-nums">
                            মোট বিল: {toBnCurrency(chalan.totalAmount, useBengali)}
                          </span>
                          <div className="text-xs font-bold">
                            {isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 px-2 py-0.2 rounded-md border border-emerald-300 dark:border-emerald-700 text-[11px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> পরিশোধিত
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 px-2 py-0.2 rounded-md border border-rose-300 dark:border-rose-700 tabular-nums text-[11px]">
                                দেনা: {toBnCurrency(remDue, useBengali)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {onViewChalanVoucher && (
                            <button
                              title="চালান ভাউচার দেখুন"
                              onClick={() => onViewChalanVoucher(chalan)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            title="হোয়াটসঅ্যাপে শেয়ার"
                            onClick={(e) => handleShareChalan(chalan, e)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteChalan && (
                            <button
                              title="চালান মুছুন"
                              type="button"
                              onClick={() => setChalanToDelete(chalan)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* ৫. খতিয়ান ও বাকি হিসাব - পাশাপাশি বা পরপর কমপ্যাক্ট সারসংক্ষেপ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* ৫.১ শীর্ষ বকেয়া খরিদ্দার (পার্টি বাকি খাতা) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-xs border border-rose-200 dark:border-rose-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👥</span>
              <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">বাকি খরিদ্দার (পার্টি খাতা)</span>
            </div>
            <button
              onClick={onGoToPartiesTab}
              className="text-[11px] text-white font-extrabold bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1 transition active:scale-95"
            >
              <span>সকল বাকি</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {dueParties.length === 0 ? (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
                        {party.name.trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-xs text-slate-900 dark:text-white block truncate">
                          {party.name}
                        </span>
                        {party.phone && (
                          <a 
                            href={`tel:${party.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 hover:underline"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>{party.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[9.5px] text-rose-700 dark:text-rose-400 font-bold block">বাকি</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-xs border border-purple-200 dark:border-purple-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🚛</span>
              <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">মহাজন দেনা (মহাজন খতিয়ান)</span>
            </div>
            <button
              onClick={onGoToSuppliersTab}
              className="text-[11px] text-white font-extrabold bg-indigo-600 hover:bg-indigo-700 px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1 transition active:scale-95"
            >
              <span>সকল মহাজন</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {dueSuppliers.length === 0 ? (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                  className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                      {supplier.name.trim().charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-xs text-slate-900 dark:text-white block truncate">
                        {supplier.name}
                      </span>
                      {supplier.phone && (
                        <a 
                          href={`tel:${supplier.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{supplier.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[9.5px] text-rose-700 dark:text-rose-400 font-bold block">দেনা</span>
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
