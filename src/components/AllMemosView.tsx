import React, { useState } from 'react';
import { Memo, Party, Supplier, SupplierChalan } from '../types';
import { toBengaliNumber, toBnCurrency, getTodayDateInputValue, getYesterdayDateInputValue, getBengaliDateFromInput, formatDisplayMemoNumber, formatDisplayChalanNumber, compareMemosDesc, compareChalansDesc } from '../utils/bengaliUtils';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme, getMemoColorTheme } from '../utils/partyColors';
import { hapticCancel, hapticDelete } from '../utils/haptics';
import { AnimatedSearchBox } from './AnimatedSearchBox';

interface AllMemosViewProps {
  memos: Memo[];
  parties?: Party[];
  chalans?: SupplierChalan[];
  suppliers?: Supplier[];
  useBengali: boolean;
  onViewMemoVoucher: (memo: Memo) => void;
  onViewChalanVoucher?: (chalan: SupplierChalan) => void;
  onDeleteMemo: (memoId: string) => void;
  onDeleteChalan?: (chalanId: string) => void;
  onOpenNewMemo: () => void;
  onOpenNewChalan?: () => void;
  onOpenShareModal?: (memo: Memo) => void;
  onOpenPartyDetails?: (party: Party) => void;
  onOpenSupplierDetails?: (supplier: Supplier) => void;
}

export const AllMemosView: React.FC<AllMemosViewProps> = ({
  memos,
  parties = [],
  chalans = [],
  suppliers = [],
  useBengali,
  onViewMemoVoucher,
  onViewChalanVoucher,
  onDeleteMemo,
  onDeleteChalan,
  onOpenNewMemo,
  onOpenNewChalan,
  onOpenShareModal,
  onOpenPartyDetails,
  onOpenSupplierDetails,
}) => {
  // Tab switcher state: 'memos' (Party Sales) vs 'chalans' (Supplier Purchases)
  const [viewMode, setViewMode] = useState<'memos' | 'chalans'>('memos');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'পাইকারি' | 'হোটেল' | 'খুচরা'>('all');
  const [chalanStatusFilter, setChalanStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(getTodayDateInputValue());

  // Delete modals state
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  const [chalanToDelete, setChalanToDelete] = useState<SupplierChalan | null>(null);

  const todayStr = getTodayDateInputValue();
  const yesterdayStr = getYesterdayDateInputValue();

  // Filtered Memos (Party Sales) - Memoized for extreme performance
  const filteredMemos = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return memos
      .filter((m) => {
        const matchSearch =
          !term ||
          m.partyName.toLowerCase().includes(term) ||
          m.memoNumber.toLowerCase().includes(term) ||
          (m.partyPhone && m.partyPhone.includes(term));

        const matchType = typeFilter === 'all' || m.partyType === typeFilter;

        let matchDate = true;
        if (dateFilter === 'today') {
          matchDate = m.date === todayStr;
        } else if (dateFilter === 'yesterday') {
          matchDate = m.date === yesterdayStr;
        } else if (dateFilter === 'custom') {
          matchDate = m.date === customDate;
        }

        return matchSearch && matchType && matchDate;
      })
      .sort(compareMemosDesc);
  }, [memos, searchTerm, typeFilter, dateFilter, todayStr, yesterdayStr, customDate]);

  // Filtered Chalans (Mahajan Purchases) - Memoized for extreme performance
  const filteredChalans = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return chalans
      .filter((c) => {
        const matchSearch =
          !term ||
          c.supplierName.toLowerCase().includes(term) ||
          c.chalanNumber.toLowerCase().includes(term) ||
          (c.supplierPhone && c.supplierPhone.includes(term)) ||
          (c.truckNumber && c.truckNumber.toLowerCase().includes(term));

        const remaining = c.remainingDue !== undefined ? c.remainingDue : (c.dueAmount || 0);
        let matchStatus = true;
        if (chalanStatusFilter === 'due') {
          matchStatus = remaining > 0;
        } else if (chalanStatusFilter === 'paid') {
          matchStatus = remaining <= 0;
        }

        let matchDate = true;
        if (dateFilter === 'today') {
          matchDate = c.date === todayStr;
        } else if (dateFilter === 'yesterday') {
          matchDate = c.date === yesterdayStr;
        } else if (dateFilter === 'custom') {
          matchDate = c.date === customDate;
        }

        return matchSearch && matchStatus && matchDate;
      })
      .sort(compareChalansDesc);
  }, [chalans, searchTerm, chalanStatusFilter, dateFilter, todayStr, yesterdayStr, customDate]);

  // Share Handlers
  const handleShareMemo = (memo: Memo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenShareModal) {
      onOpenShareModal(memo);
    } else {
      const text = `মেমো নং: ${formatDisplayMemoNumber(memo.memoNumber, useBengali)}
খরিদ্দার: ${memo.partyName} (${memo.partyType})
তারিখ: ${memo.formattedDate}
ডিম: ${toBengaliNumber(memo.totalEggs, useBengali)} পিস
মোট বিল: ${toBnCurrency(memo.totalBill, useBengali)}
নগদ জমা: ${toBnCurrency(memo.cashPaid, useBengali)}
বাকি: ${toBnCurrency(memo.remainingDue, useBengali)}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleShareChalan = (chalan: SupplierChalan, e: React.MouseEvent) => {
    e.stopPropagation();
    const remDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);
    const text = `ডিমের ক্রয় চালান নং: #${chalan.chalanNumber}
মহাজন / খামারি: ${chalan.supplierName}
তারিখ: ${chalan.formattedDate}
মোট ডিম: ${toBengaliNumber(chalan.eggCount, useBengali)} পিস
চালানের বিল: ${toBnCurrency(chalan.totalAmount, useBengali)}
নগদ পরিশোধ: ${toBnCurrency(chalan.paidAmount, useBengali)}
দেনা / বাকি: ${toBnCurrency(remDue, useBengali)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Aggregated Financials
  const totalMemosEggs = filteredMemos.reduce((sum, m) => sum + (m.totalEggs || 0), 0);
  const totalMemosBill = filteredMemos.reduce((sum, m) => sum + m.totalBill, 0);
  const totalMemosCash = filteredMemos.reduce((sum, m) => sum + (m.cashPaid || 0), 0);
  const totalMemosDue = filteredMemos.reduce((sum, m) => sum + m.remainingDue, 0);

  const totalChalansEggs = filteredChalans.reduce((sum, c) => sum + (c.eggCount || 0), 0);
  const totalChalansBill = filteredChalans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalChalansPaid = filteredChalans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const totalChalansDue = filteredChalans.reduce((sum, c) => {
    const rem = c.remainingDue !== undefined ? c.remainingDue : (c.dueAmount || 0);
    return sum + rem;
  }, 0);

  return (
    <div id="all-memos-view-container" className="space-y-2.5 pb-16">
      {/* 1. Primary Top Switcher: পার্টির মেমো vs মহাজনের চালান */}
      <div 
        id="memos-subtab-switcher"
        className="glass-card rounded-2xl p-1.5 shadow-sm border"
      >
        <div className="grid grid-cols-2 gap-1.5 p-1 soft-inset rounded-xl">
          {/* Party Memos Tab Button */}
          <button
            type="button"
            id="tab-btn-party-memos"
            onClick={() => {
              setViewMode('memos');
              setSearchTerm('');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
              viewMode === 'memos'
                ? 'soft-btn-primary font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-bold'
            }`}
          >
            <DescriptionRoundedIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1.5">
                <span>পার্টির মেমো</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  viewMode === 'memos' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-black/10 dark:bg-white/15 text-slate-700 dark:text-slate-300'
                }`}>
                  {toBengaliNumber(memos.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate tabular-nums ${viewMode === 'memos' ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                বিক্রি: {toBnCurrency(totalMemosBill, useBengali)}
              </div>
            </div>
          </button>

          {/* Supplier Chalans Tab Button */}
          <button
            type="button"
            id="tab-btn-supplier-chalans"
            onClick={() => {
              setViewMode('chalans');
              setSearchTerm('');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
              viewMode === 'chalans'
                ? 'soft-btn-purple font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-bold'
            }`}
          >
            <LocalShippingRoundedIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1.5">
                <span>মহাজনের চালান</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  viewMode === 'chalans' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-black/10 dark:bg-white/15 text-slate-700 dark:text-slate-300'
                }`}>
                  {toBengaliNumber(chalans.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate tabular-nums ${viewMode === 'chalans' ? 'text-purple-100' : 'text-slate-600 dark:text-slate-300'}`}>
                ক্রয়: {toBnCurrency(totalChalansBill, useBengali)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Compact Search & Filter Row */}
      <div className="glass-card p-2.5 sm:p-3 rounded-2xl border shadow-xs space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <AnimatedSearchBox
              id="search-memo-box"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={
                viewMode === 'memos'
                  ? "খরিদ্দারের নাম, মোবাইল বা মেমো নং..."
                  : "মহাজন/খামারির নাম, মোবাইল বা চালান নং..."
              }
              buttonText="খুঁজুন"
              compact={true}
              resultsCount={viewMode === 'memos' ? filteredMemos.length : filteredChalans.length}
            />
          </div>
          {viewMode === 'memos' ? (
            <button
              onClick={onOpenNewMemo}
              className="text-xs font-black soft-btn-primary px-3.5 py-2 rounded-xl transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <AddRoundedIcon className="w-4 h-4" />
              <span>নতুন মেমো</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewChalan}
              className="text-xs font-black soft-btn-purple px-3.5 py-2 rounded-xl transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <AddRoundedIcon className="w-4 h-4" />
              <span>নতুন চালান</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {viewMode === 'memos' ? (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="all">সব পার্টি</option>
              <option value="পাইকারি">পাইকারি</option>
              <option value="হোটেল">হোটেল</option>
              <option value="খুচরা">খুচরা</option>
            </select>
          ) : (
            <select
              value={chalanStatusFilter}
              onChange={(e) => setChalanStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="all">সব চালান</option>
              <option value="due">বাকি আছে</option>
              <option value="paid">পরিশোধিত</option>
            </select>
          )}

          {/* Compact Quick Date Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2 py-0.5 rounded-md font-bold transition whitespace-nowrap ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              সব
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2 py-0.5 rounded-md font-bold transition whitespace-nowrap ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              আজকের ({toBengaliNumber(
                viewMode === 'memos'
                  ? memos.filter((m) => m.date === todayStr).length
                  : chalans.filter((c) => c.date === todayStr).length,
                useBengali
              )})
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-2 py-0.5 rounded-md font-bold transition whitespace-nowrap ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              গতকালের
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-2 py-0.5 rounded-md font-bold transition whitespace-nowrap flex items-center gap-1 ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CalendarTodayRoundedIcon style={{ fontSize: '12px' }} />
              <span>তারিখ</span>
            </button>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="mt-1 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">তারিখ:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-400 rounded px-2 py-0.5 text-slate-900 dark:text-white"
            />
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 ml-auto">
              {getBengaliDateFromInput(customDate, useBengali)}
            </span>
          </div>
        )}
      </div>

      {/* 4. LIST: Party Memos or Mahajan Chalans */}
      {viewMode === 'memos' ? (
        /* PARTIES MEMOS LIST - Responsive 1 column on phones, 2 columns on tablets */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredMemos.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs border shadow-xs font-bold space-y-2">
              <p>কোনো মেমো পাওয়া যায়নি</p>
              <button
                type="button"
                onClick={onOpenNewMemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black shadow-xs active:scale-95 transition"
              >
                <AddRoundedIcon className="w-4 h-4" />
                <span>নতুন মেমো তৈরি করুন</span>
              </button>
            </div>
          ) : (
            filteredMemos.map((memo) => {
              const theme = getMemoColorTheme(memo.memoNumber, memo.partyName, memo.partyId);

              return (
                <div
                  key={memo.id}
                  onClick={() => onViewMemoVoucher(memo)}
                  className={`glass-card rounded-2xl p-3.5 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 ${theme.border} relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 pointer-events-none" />
                  {/* Top Row: Memo No, Distinct Party / Status Pill, Calendar Date */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-2xs ${theme.memoNumBadge}`}>
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold transition-all text-left shadow-2xs hover:scale-[1.01] active:scale-95 ${
                          memo.remainingDue > 0
                            ? 'border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                            : 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        }`}
                        title="ক্লিক করে এই পার্টির সমস্ত মেমো ও হিসাব দেখুন"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[8px] font-black shrink-0`}>
                          {memo.partyName.trim().charAt(0)}
                        </span>
                        <span className="truncate max-w-[120px] sm:max-w-[160px]">{memo.partyName}</span>
                        <span className="text-[10px] font-bold opacity-75">({memo.partyType})</span>
                        <NorthEastRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px] sm:text-xs ml-auto">
                      <CalendarTodayRoundedIcon style={{ fontSize: '13px' }} className="text-sky-500 shrink-0" />
                      <span>{memo.formattedDate}</span>
                    </div>
                  </div>

                  {/* Middle Row: Egg items with rates and total */}
                  <div className="space-y-1">
                    {memo.items.map((it, idx) => {
                      if (!it.count || it.count <= 0) return null;
                      const isRed = it.eggType === 'লাল ডিম';
                      const isWhite = it.eggType === 'সাদা ডিম';
                      const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                      const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs font-medium px-2 py-1 rounded-lg border ${
                            isRed
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-100'
                              : isWhite
                              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/60 text-cyan-950 dark:text-cyan-100'
                              : 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRed ? 'bg-rose-500' : isWhite ? 'bg-cyan-400 border border-slate-300' : 'bg-purple-500'}`} />
                            <span className="font-bold truncate text-slate-900 dark:text-white text-[13px] sm:text-sm">
                              {it.eggType}: {toBengaliNumber(it.count, useBengali)} পিস ({toBengaliNumber(rateHundred, useBengali)} ৳/১০০)
                            </span>
                          </div>
                          <span className="font-black text-[13px] sm:text-sm text-slate-950 dark:text-white tabular-nums shrink-0 ml-1.5">
                            {toBnCurrency(itemTotal, useBengali)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Row: Financials and Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-[13px] min-w-0">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        দাবি: <span className="font-black text-slate-950 dark:text-white tabular-nums text-xs sm:text-[13.5px]">{toBnCurrency(memo.totalDemand, useBengali)}</span>
                        {memo.previousDue > 0 && (
                          <span className="text-[11px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 ml-1">
                            (সাবেক: +{toBnCurrency(memo.previousDue, useBengali)})
                          </span>
                        )}
                      </span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[11.5px] sm:text-xs font-bold whitespace-nowrap">
                        জমা: {toBnCurrency(memo.cashPaid, useBengali)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[11.5px] sm:text-xs font-bold border whitespace-nowrap ${
                        memo.remainingDue > 0 
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {memo.remainingDue > 0 ? `বাকি: ${toBnCurrency(memo.remainingDue, useBengali)}` : '✓ পরিশোধ'}
                      </span>
                    </div>

                    {/* Compact Action Icons */}
                    <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="মেমো দেখুন"
                        onClick={() => onViewMemoVoucher(memo)}
                        className="w-7 h-7 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 active:scale-90 transition shadow-2xs cursor-pointer"
                      >
                        <VisibilityRoundedIcon style={{ fontSize: '15px' }} />
                      </button>
                      <button
                        title="হোয়াটসঅ্যাপে শেয়ার"
                        onClick={(e) => handleShareMemo(memo, e)}
                        className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition shadow-2xs cursor-pointer"
                      >
                        <ShareRoundedIcon style={{ fontSize: '15px' }} />
                      </button>
                      <button
                        title="মেমো মুছে ফেলুন"
                        type="button"
                        onClick={() => {
                          hapticCancel();
                          setMemoToDelete(memo);
                        }}
                        className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 active:scale-90 transition shadow-2xs cursor-pointer"
                      >
                        <DeleteOutlineRoundedIcon style={{ fontSize: '15px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MAHAJAN CHALANS LIST - Responsive 1 column on phones, 2 columns on tablets */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredChalans.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs border shadow-xs font-bold space-y-2">
              <p>কোনো মহাজন চালান পাওয়া যায়নি</p>
              {onOpenNewChalan && (
                <button
                  type="button"
                  onClick={onOpenNewChalan}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-black shadow-xs active:scale-95 transition"
                >
                  <AddRoundedIcon className="w-4 h-4" />
                  <span>নতুন চালান তৈরি করুন</span>
                </button>
              )}
            </div>
          ) : (
            filteredChalans.map((chalan) => {
              const theme = getMemoColorTheme(chalan.chalanNumber, chalan.supplierName, chalan.supplierId);
              const remainingDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);

              return (
                <div
                  key={chalan.id}
                  onClick={() => onViewChalanVoucher && onViewChalanVoucher(chalan)}
                  className={`glass-card rounded-2xl p-3.5 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 ${theme.border} relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 pointer-events-none" />
                  {/* Top Row: Chalan No, Mahajan Pill, Date */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md shadow-2xs ${theme.memoNumBadge}`}>
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
                            } else {
                              onOpenSupplierDetails({
                                id: chalan.supplierId || 'temp-' + chalan.supplierName,
                                name: chalan.supplierName,
                                phone: chalan.supplierPhone || '',
                                totalPayable: remainingDue,
                                totalPurchased: chalan.totalAmount,
                                totalPaid: chalan.paidAmount || 0,
                                createdAt: chalan.createdAt,
                              });
                            }
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 text-xs font-bold transition-all text-left shadow-2xs hover:scale-[1.01] active:scale-95"
                        title="ক্লিক করে এই মহাজনের সম্পূর্ণ খতিয়ান ও চালান দেখুন"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[8px] font-black shrink-0`}>
                          {chalan.supplierName.trim().charAt(0)}
                        </span>
                        <span className="truncate max-w-[120px] sm:max-w-[160px]">{chalan.supplierName}</span>
                        <span className="text-[10px] font-bold opacity-75">(মহাজন)</span>
                        <NorthEastRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px] sm:text-xs ml-auto">
                      <CalendarTodayRoundedIcon style={{ fontSize: '13px' }} className="text-sky-500 shrink-0" />
                      <span>{chalan.formattedDate}</span>
                    </div>
                  </div>

                  {/* Middle Row: Egg items with rates and total */}
                  <div className="space-y-1">
                    {/* Red Egg */}
                    {chalan.redEggCount && chalan.redEggCount > 0 ? (
                      <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium px-2 py-1 rounded-lg border bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-100">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 inline-block" />
                          <span className="font-bold truncate text-slate-900 dark:text-white text-[13px] sm:text-sm">
                            লাল ডিম: {toBengaliNumber(chalan.redEggCount, useBengali)} পিস ({toBengaliNumber(chalan.redRatePerHundred || 0, useBengali)} ৳/১০০)
                          </span>
                        </div>
                        <span className="font-black text-[13px] sm:text-sm text-slate-950 dark:text-white tabular-nums shrink-0 ml-1.5">
                          {toBnCurrency(chalan.redTotalAmount || 0, useBengali)}
                        </span>
                      </div>
                    ) : null}

                    {/* White Egg */}
                    {chalan.whiteEggCount && chalan.whiteEggCount > 0 ? (
                      <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium px-2 py-1 rounded-lg border bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/60 text-cyan-950 dark:text-cyan-100">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-300 shrink-0 inline-block" />
                          <span className="font-bold truncate text-slate-900 dark:text-white text-[13px] sm:text-sm">
                            সাদা ডিম: {toBengaliNumber(chalan.whiteEggCount, useBengali)} পিস ({toBengaliNumber(chalan.whiteRatePerHundred || 0, useBengali)} ৳/১০০)
                          </span>
                        </div>
                        <span className="font-black text-[13px] sm:text-sm text-slate-950 dark:text-white tabular-nums shrink-0 ml-1.5">
                          {toBnCurrency(chalan.whiteTotalAmount || 0, useBengali)}
                        </span>
                      </div>
                    ) : null}

                    {/* Generic Egg if no red/white breakdown */}
                    {!chalan.redEggCount && !chalan.whiteEggCount && chalan.eggCount > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium px-2 py-1 rounded-lg border bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-100">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 inline-block" />
                          <span className="font-bold truncate text-slate-900 dark:text-white text-[13px] sm:text-sm">
                            ডিম: {toBengaliNumber(chalan.eggCount, useBengali)} পিস {chalan.ratePerHundred ? `(${toBengaliNumber(chalan.ratePerHundred, useBengali)} ৳/১০০)` : ''}
                          </span>
                        </div>
                        <span className="font-black text-[13px] sm:text-sm text-slate-950 dark:text-white tabular-nums shrink-0 ml-1.5">
                          {toBnCurrency(chalan.totalAmount, useBengali)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Financials and Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-[13px] min-w-0">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        বিল: <span className="font-black text-slate-950 dark:text-white tabular-nums text-xs sm:text-[13.5px]">{toBnCurrency(chalan.totalAmount, useBengali)}</span>
                        {chalan.previousDue && chalan.previousDue > 0 ? (
                          <span className="text-[11px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 ml-1">
                            (সাবেক: +{toBnCurrency(chalan.previousDue, useBengali)})
                          </span>
                        ) : null}
                      </span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[11.5px] sm:text-xs font-bold whitespace-nowrap">
                        জমা: {toBnCurrency(chalan.paidAmount || 0, useBengali)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[11.5px] sm:text-xs font-bold border whitespace-nowrap ${
                        remainingDue > 0 
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {remainingDue > 0 ? `দেনা: ${toBnCurrency(remainingDue, useBengali)}` : '✓ পরিশোধ'}
                      </span>
                    </div>

                    {/* Compact Action Icons */}
                    <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                      {onViewChalanVoucher && (
                        <button
                          title="চালান দেখুন"
                          onClick={() => onViewChalanVoucher(chalan)}
                          className="w-7 h-7 rounded-lg border border-sky-200 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-100 active:scale-90 transition shadow-2xs cursor-pointer"
                        >
                          <VisibilityRoundedIcon style={{ fontSize: '15px' }} />
                        </button>
                      )}
                      <button
                        title="হোয়াটসঅ্যাপে শেয়ার"
                        onClick={(e) => handleShareChalan(chalan, e)}
                        className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition shadow-2xs cursor-pointer"
                      >
                        <ShareRoundedIcon style={{ fontSize: '15px' }} />
                      </button>
                      {onDeleteChalan && (
                        <button
                          title="চালান মুছে ফেলুন"
                          type="button"
                          onClick={() => {
                            hapticCancel();
                            setChalanToDelete(chalan);
                          }}
                          className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 active:scale-90 transition shadow-2xs cursor-pointer"
                        >
                          <DeleteOutlineRoundedIcon style={{ fontSize: '15px' }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Memo Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!memoToDelete}
        type="memo"
        memo={memoToDelete}
        useBengali={useBengali}
        onConfirm={() => {
          if (memoToDelete) {
            onDeleteMemo(memoToDelete.id);
            setMemoToDelete(null);
          }
        }}
        onCancel={() => setMemoToDelete(null)}
      />

      {/* 6. Chalan Delete Confirmation Modal */}
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
