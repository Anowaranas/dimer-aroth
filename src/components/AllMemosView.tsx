import React, { useState } from 'react';
import { Memo, Party, Supplier, SupplierChalan } from '../types';
import { toBengaliNumber, toBnCurrency, getTodayDateInputValue, getYesterdayDateInputValue, getBengaliDateFromInput, formatDisplayMemoNumber, formatDisplayChalanNumber, compareMemosDesc, compareChalansDesc } from '../utils/bengaliUtils';
import { Search, Eye, Printer, Share2, Trash2, ArrowUpRight, Plus, FileText, Truck, ShieldAlert } from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';

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
  const totalMemosBill = filteredMemos.reduce((sum, m) => sum + m.totalBill, 0);
  const totalMemosDue = filteredMemos.reduce((sum, m) => sum + m.remainingDue, 0);

  const totalChalansBill = filteredChalans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalChalansDue = filteredChalans.reduce((sum, c) => {
    const rem = c.remainingDue !== undefined ? c.remainingDue : (c.dueAmount || 0);
    return sum + rem;
  }, 0);

  return (
    <div id="all-memos-view-container" className="space-y-2 pb-16">
      {/* 1. Primary Top Switcher: পার্টির মেমো vs মহাজনের চালান - Crisp & Clean */}
      <div 
        id="memos-subtab-switcher"
        className="bg-slate-900 dark:bg-slate-800 rounded-xl p-1 shadow-xs border border-slate-700/60 text-white"
      >
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/25 rounded-lg border border-white/10">
          {/* Party Memos Tab Button */}
          <button
            type="button"
            id="tab-btn-party-memos"
            onClick={() => {
              setViewMode('memos');
              setSearchTerm('');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 ${
              viewMode === 'memos'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-300 hover:bg-white/10 font-bold'
            }`}
          >
            <DescriptionIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1">
                <span>পার্টির মেমো</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  viewMode === 'memos' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-white/15 text-slate-300'
                }`}>
                  {toBengaliNumber(memos.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold truncate ${viewMode === 'memos' ? 'text-blue-100' : 'text-slate-300'}`}>
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
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 ${
              viewMode === 'chalans'
                ? 'bg-indigo-600 text-white font-black shadow-xs'
                : 'text-slate-300 hover:bg-white/10 font-bold'
            }`}
          >
            <LocalShippingIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1">
                <span>মহাজনের চালান</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  viewMode === 'chalans' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-white/15 text-slate-300'
                }`}>
                  {toBengaliNumber(chalans.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold truncate ${viewMode === 'chalans' ? 'text-indigo-100' : 'text-slate-300'}`}>
                ক্রয়: {toBnCurrency(totalChalansBill, useBengali)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Compact Search & Filter Row */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-2.5 top-2" />
            <input
              id="search-memo-input"
              type="text"
              placeholder={
                viewMode === 'memos'
                  ? "খরিদ্দারের নাম, মোবাইল বা মেমো নং..."
                  : "মহাজন/খামারির নাম, মোবাইল বা চালান নং..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
          {viewMode === 'memos' ? (
            <button
              onClick={onOpenNewMemo}
              className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন মেমো</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewChalan}
              className="text-xs font-black bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
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
              <CalendarTodayIcon style={{ fontSize: '11px' }} />
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
        /* PARTIES MEMOS LIST */
        <div className="space-y-2">
          {filteredMemos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-800 font-bold">
              কোনো মেমো পাওয়া যায়নি
            </div>
          ) : (
            filteredMemos.map((memo) => {
              const theme = getPartyColorTheme(memo.partyName, memo.partyId);
              const typeBadgeStyle = 
                memo.partyType === 'পাইকারি' ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700' :
                memo.partyType === 'হোটেল' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700' :
                'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700';

              return (
                <div
                  key={memo.id}
                  onClick={() => onViewMemoVoucher(memo)}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border-2 border-l-[5px] ${theme.borderLeft} ${theme.border} shadow-2xs hover:shadow-md ${theme.hoverBorder} transition-all cursor-pointer space-y-1.5`}
                >
                  {/* Top Row: Memo No, Distinct Party Pill & Type */}
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
                        <span className="font-black text-xs sm:text-sm leading-tight">
                          {memo.partyName}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-70 shrink-0" />
                      </button>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border ${typeBadgeStyle}`}>
                        {memo.partyType}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <CalendarTodayIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      {memo.formattedDate}
                    </span>
                  </div>

                  {/* Second Row: Egg items with rates and total in distinct clear boxes */}
                  <div className="space-y-1 my-1">
                    {memo.items.map((it, idx) => {
                      if (!it.count || it.count <= 0) return null;
                      const isRed = it.eggType === 'লাল ডিম';
                      const isWhite = it.eggType === 'সাদা ডিম';
                      const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                      const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg border shadow-2xs ${
                            isRed
                              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                              : isWhite
                              ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100'
                              : 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-xs">
                              {it.eggType}: <span className="underline decoration-dotted">{toBengaliNumber(it.count, useBengali)} পিস</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-250 dark:border-slate-700">
                              ৳{toBengaliNumber(rateHundred, useBengali)}/শ
                            </span>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums">
                              = {toBnCurrency(itemTotal, useBengali)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Third Row: Financials and Action Buttons */}
                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-950 dark:text-white tabular-nums flex items-center gap-1.5">
                        <span>মোট দাবি: {toBnCurrency(memo.totalDemand, useBengali)}</span>
                        {memo.previousDue > 0 && (
                          <span className="text-[10.5px] font-bold text-purple-700 dark:text-purple-300">
                            (সাবেক: +{toBnCurrency(memo.previousDue, useBengali)})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] flex items-center gap-1 flex-wrap font-bold">
                        <span className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700 tabular-nums">
                          নগদ: {toBnCurrency(memo.cashPaid, useBengali)}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded border tabular-nums ${
                          memo.remainingDue > 0 
                            ? 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700' 
                            : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        }`}>
                          {memo.remainingDue > 0 ? `বাকি: ${toBnCurrency(memo.remainingDue, useBengali)}` : '✓ সম্পূর্ণ পরিশোধিত'}
                        </span>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="মেমো দেখুন"
                        onClick={() => onViewMemoVoucher(memo)}
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="মেমো প্রিন্ট করুন"
                        onClick={() => onViewMemoVoucher(memo)}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition active:scale-95 shadow-2xs"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        title="হোয়াটসঅ্যাপে শেয়ার"
                        onClick={(e) => handleShareMemo(memo, e)}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        title="মেমো মুছে ফেলুন"
                        type="button"
                        onClick={() => setMemoToDelete(memo)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MAHAJAN CHALANS LIST */
        <div className="space-y-2">
          {filteredChalans.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-800 font-bold space-y-2">
              <p>কোনো মহাজন চালান পাওয়া যায়নি</p>
              {onOpenNewChalan && (
                <button
                  type="button"
                  onClick={onOpenNewChalan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-sky-700 text-white text-xs font-black shadow-xs active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন চালান তৈরি করুন</span>
                </button>
              )}
            </div>
          ) : (
            filteredChalans.map((chalan) => {
              const theme = getPartyColorTheme(chalan.supplierName, chalan.supplierId);
              const remainingDue = chalan.remainingDue !== undefined ? chalan.remainingDue : (chalan.dueAmount || 0);
              const isPaid = remainingDue <= 0;

              return (
                <div
                  key={chalan.id}
                  onClick={() => onViewChalanVoucher && onViewChalanVoucher(chalan)}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border-2 border-l-[5px] ${theme.borderLeft} ${theme.border} shadow-2xs hover:shadow-md ${theme.hoverBorder} transition-all cursor-pointer space-y-1.5`}
                >
                  {/* Top Row: Chalan No, Mahajan Pill, Date */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-sky-100 text-sky-950 dark:bg-sky-950/80 dark:text-sky-200 font-mono font-black text-xs px-2 py-0.5 rounded-lg border border-sky-300 dark:border-sky-700 shadow-2xs">
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${theme.nameBadge} hover:scale-[1.02] active:scale-95 transition-all text-left shadow-2xs`}
                        title="ক্লিক করে এই মহাজনের সম্পূর্ণ খতিয়ান ও চালান দেখুন"
                      >
                        <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>
                          {chalan.supplierName.trim().charAt(0)}
                        </span>
                        <span className="font-black text-xs sm:text-sm leading-tight">
                          {chalan.supplierName}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-70 shrink-0" />
                      </button>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold border bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-700">
                        মহাজন চালান
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <CalendarTodayIcon className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                      {chalan.formattedDate}
                    </span>
                  </div>

                  {/* Second Row: Egg items with rates and total in distinct clear boxes */}
                  <div className="space-y-1 my-1">
                    {/* Red Egg */}
                    {chalan.redEggCount && chalan.redEggCount > 0 ? (
                      <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg border bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-extrabold text-xs">
                            🔴 লাল ডিম: <span className="underline decoration-dotted">{toBengaliNumber(chalan.redEggCount, useBengali)} পিস</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 border border-rose-250 dark:border-rose-800">
                            ৳{toBengaliNumber(chalan.redRatePerHundred || 0, useBengali)}/শ
                          </span>
                          <span className="font-black text-slate-950 dark:text-white tabular-nums">
                            = {toBnCurrency(chalan.redTotalAmount || 0, useBengali)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* White Egg */}
                    {chalan.whiteEggCount && chalan.whiteEggCount > 0 ? (
                      <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg border bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-extrabold text-xs">
                            ⚪ সাদা ডিম: <span className="underline decoration-dotted">{toBengaliNumber(chalan.whiteEggCount, useBengali)} পিস</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 border border-cyan-250 dark:border-cyan-800">
                            ৳{toBengaliNumber(chalan.whiteRatePerHundred || 0, useBengali)}/শ
                          </span>
                          <span className="font-black text-slate-950 dark:text-white tabular-nums">
                            = {toBnCurrency(chalan.whiteTotalAmount || 0, useBengali)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Generic Egg if no red/white breakdown */}
                    {!chalan.redEggCount && !chalan.whiteEggCount && chalan.eggCount > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg border bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-extrabold text-xs">
                            ডিম: <span className="underline decoration-dotted">{toBengaliNumber(chalan.eggCount, useBengali)} পিস</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {chalan.ratePerHundred ? (
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 border border-purple-250 dark:border-purple-800">
                              ৳{toBengaliNumber(chalan.ratePerHundred, useBengali)}/শ
                            </span>
                          ) : null}
                          <span className="font-black text-slate-950 dark:text-white tabular-nums">
                            = {toBnCurrency(chalan.totalAmount, useBengali)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Third Row: Financials and Action Buttons */}
                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-950 dark:text-white tabular-nums flex items-center gap-1.5">
                        <span>মোট বিল: {toBnCurrency(chalan.totalAmount, useBengali)}</span>
                        {chalan.previousDue && chalan.previousDue > 0 ? (
                          <span className="text-[10.5px] font-bold text-purple-700 dark:text-purple-300">
                            (সাবেক দেনা: +{toBnCurrency(chalan.previousDue, useBengali)})
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] flex items-center gap-1 flex-wrap font-bold">
                        <span className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700 tabular-nums">
                          নগদ পরিশোধ: {toBnCurrency(chalan.paidAmount || 0, useBengali)}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded border tabular-nums ${
                          remainingDue > 0 
                            ? 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700' 
                            : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        }`}>
                          {remainingDue > 0 ? `দেনা: ${toBnCurrency(remainingDue, useBengali)}` : '✓ সম্পূর্ণ পরিশোধ'}
                        </span>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {onViewChalanVoucher && (
                        <>
                          <button
                            title="চালান দেখুন"
                            onClick={() => onViewChalanVoucher(chalan)}
                            className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="চালান প্রিন্ট করুন"
                            onClick={() => onViewChalanVoucher(chalan)}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition active:scale-95 shadow-2xs"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        title="হোয়াটসঅ্যাপে শেয়ার"
                        onClick={(e) => handleShareChalan(chalan, e)}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {onDeleteChalan && (
                        <button
                          title="চালান মুছে ফেলুন"
                          type="button"
                          onClick={() => setChalanToDelete(chalan)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
                        >
                          <Trash2 className="w-4 h-4" />
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
