import React, { useState, useMemo, useEffect } from 'react';
import { Memo, Party } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber, compareMemosDesc } from '../utils/bengaliUtils';
import { getPartyColorTheme } from '../utils/partyColors';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  X, 
  Phone, 
  MapPin, 
  FileText, 
  Plus, 
  DollarSign, 
  Search, 
  ArrowUpRight,
  Share2, 
  Eye, 
  Trash2,
  Edit,
  Printer,
  Table,
  Layers,
  Sparkles,
  Calculator,
  MessageSquare
} from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface PartyDetailsModalProps {
  party: Party | null;
  memos: Memo[];
  useBengali: boolean;
  onClose: () => void;
  onOpenNewMemoForParty: (party: Party) => void;
  onOpenPaymentModal: (party: Party) => void;
  onViewMemoVoucher: (memo: Memo) => void;
  onOpenShareModal?: (memo: Memo) => void;
  onDeleteParty?: (partyId: string) => void;
  onDeleteMemo?: (memoId: string) => void;
  onUpdateParty?: (partyId: string, updatedFields: Partial<Omit<Party, 'id' | 'createdAt'>>) => void;
}

export const PartyDetailsModal: React.FC<PartyDetailsModalProps> = ({
  party,
  memos,
  useBengali,
  onClose,
  onOpenNewMemoForParty,
  onOpenPaymentModal,
  onViewMemoVoucher,
  onOpenShareModal,
  onDeleteParty,
  onDeleteMemo,
  onUpdateParty,
}) => {
  const [memoSearchQuery, setMemoSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);

  // Edit party details state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(party?.name || '');
  const [editPhone, setEditPhone] = useState(party?.phone || '');
  const [editType, setEditType] = useState<Party['type']>(party?.type || 'পাইকারি');
  const [editAddress, setEditAddress] = useState(party?.address || '');
  const [editNotes, setEditNotes] = useState(party?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update edit fields when the party changes
  useEffect(() => {
    if (party) {
      setEditName(party.name);
      setEditPhone(party.phone || '');
      setEditType(party.type);
      setEditAddress(party.address || '');
      setEditNotes(party.notes || '');
      setIsEditing(false); // Reset editing mode when switching parties
    }
  }, [party]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || !editName.trim()) return;

    setIsSaving(true);
    if (onUpdateParty) {
      onUpdateParty(party.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        type: editType,
        address: editAddress.trim(),
        notes: editNotes.trim(),
      });
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleShare = (memo: Memo, e: React.MouseEvent) => {
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

  if (!party) return null;

  // Filter all memos for this specific party (by partyId OR matching partyName) - Sorted by recency & serial on top
  const partyMemos = useMemo(() => {
    return memos
      .filter(
        (m) => m.partyId === party.id || m.partyName.trim().toLowerCase() === party.name.trim().toLowerCase()
      )
      .sort(compareMemosDesc);
  }, [memos, party.id, party.name]);

  // Search filter within party memos - Sorted by recency & serial on top
  const filteredMemos = useMemo(() => {
    return partyMemos
      .filter((m) => {
        if (!memoSearchQuery.trim()) return true;
        const q = memoSearchQuery.toLowerCase().trim();
        return (
          m.memoNumber.toLowerCase().includes(q) ||
          m.formattedDate.toLowerCase().includes(q) ||
          m.date.includes(q) ||
          (m.note && m.note.toLowerCase().includes(q))
        );
      })
      .sort(compareMemosDesc);
  }, [partyMemos, memoSearchQuery]);

  // Calculate Party Detailed Egg Pieces Analytics across all their memos
  const eggAnalytics = useMemo(() => {
    let redCount = 0;
    let whiteCount = 0;
    let otherCount = 0;

    partyMemos.forEach((memo) => {
      memo.items.forEach((item) => {
        if (item.eggType === 'লাল ডিম') {
          redCount += item.count || 0;
        } else if (item.eggType === 'সাদা ডিম') {
          whiteCount += item.count || 0;
        } else {
          otherCount += item.count || 0;
        }
      });
    });

    const totalEggs = redCount + whiteCount + otherCount;
    const totalKhachi = Math.floor(totalEggs / 30);
    const extraEggs = totalEggs % 30;

    const redKhachi = Math.floor(redCount / 30);
    const redExtra = redCount % 30;

    const whiteKhachi = Math.floor(whiteCount / 30);
    const whiteExtra = whiteCount % 30;

    return {
      redCount,
      redKhachi,
      redExtra,
      whiteCount,
      whiteKhachi,
      whiteExtra,
      otherCount,
      totalEggs,
      totalKhachi,
      extraEggs,
    };
  }, [partyMemos]);

  const totalLifetimeBilled = partyMemos.reduce((sum, m) => sum + (m.totalBill || 0), 0);
  const totalLifetimePaid = partyMemos.reduce((sum, m) => sum + (m.cashPaid || 0), 0);
  const hasDue = party.currentDue > 0;

  const typeBadgeStyle = 
    party.type === 'পাইকারি' ? 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800' :
    party.type === 'হোটেল' ? 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800' :
    'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';

  const theme = getPartyColorTheme(party.name, party.id);

  return (
    <div 
      id="party-details-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="party-details-card"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
      >
        {/* Color accent strip */}
        <div className={`h-2 w-full bg-gradient-to-r ${theme.headerBar}`}></div>

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-750">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
              <span>👤</span>
              <span>খতিয়ান ও মেমো খাতা (পার্টি লেজার)</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onUpdateParty && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                title="পার্টি সংশোধন করুন"
                className={`p-1.5 rounded-lg transition ${
                  isEditing 
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' 
                    : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDeleteParty && !party.id.startsWith('temp-') && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="পার্টি ডিলিট করুন"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 text-xs sm:text-sm">
          {/* 1. Party Primary Profile Card with distinct party colors / Inline Edit Form */}
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border-2 border-l-[6px] ${theme.borderLeft} ${theme.border} space-y-2.5 shadow-xs`}>
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <h3 className="font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm flex items-center gap-1.5 border-b border-indigo-200/40 dark:border-slate-800 pb-1.5">
                  <span>📝</span>
                  <span>পার্টির তথ্য সংশোধন খাতা</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      পার্টির নাম (আবশ্যিক)
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="যেমন: কুদ্দুস মিয়া"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="যেমন: ০১৭১২-৩৪৫৬৭৮"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      ঠিকানা / আড়ত / এলাকা
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="যেমন: কারওয়ান বাজার, ঢাকা"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      পার্টির ধরণ
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as Party['type'])}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 dark:text-white text-xs"
                    >
                      <option value="পাইকারি">পাইকারি (Wholesaler)</option>
                      <option value="হোটেল">হোটেল / রেস্টুরেন্ট</option>
                      <option value="খুচরা">খুচরা বিক্রেতা (Retailer)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                    অতিরিক্ত নোট / মন্তব্য (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                    placeholder="মন্তব্য বা অন্যান্য বিবরণ..."
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5"
                  >
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0`}>
                    {party.name.trim().charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                        {party.name}
                      </h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-black border ${typeBadgeStyle}`}>
                        {party.type}
                      </span>
                    </div>

                    {(party.address || party.notes) && (
                      <div className="space-y-0.5 mt-1 text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {party.address && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{party.address}</span>
                          </p>
                        )}
                        {party.notes && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                            নোট: {party.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Outstanding Due Badge - Auto Added Result */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block leading-none">
                    বর্তমান বাকি পাওনা
                  </span>
                  <div
                    className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl shadow-xs mt-1 tabular-nums ${
                      hasDue
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                    }`}
                  >
                    {toBnCurrency(party.currentDue, useBengali)}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Contact & Action Buttons */}
            {/* Quick Contact & Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-800">
                {party.phone ? (
                  <>
                    <a
                      href={`tel:${party.phone}`}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 text-xs sm:text-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>কল করুন ({party.phone})</span>
                    </a>
                    <a
                      href={`sms:${party.phone}`}
                      className="py-1.5 px-3.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 text-xs sm:text-sm"
                      title="এসএমএস পাঠান"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>এসএমএস</span>
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-stone-400 italic">কোনো ফোন নম্বর যুক্ত নেই</span>
                )}
              </div>
            )}
          </div>



          {/* 2. Action Buttons (New Memo & Payment Collection) - On Top */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewMemoForParty(party);
              }}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ নতুন মেমো দিন</span>
            </button>

            {hasDue && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(party);
                }}
                className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                <span>বাকি জমা নিন</span>
              </button>
            )}
          </div>

          {/* 3. Compact Financials Summary Strip */}
          <div className="grid grid-cols-3 gap-1.5 text-center p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">মোট বিক্রয়</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                {toBnCurrency(totalLifetimeBilled, useBengali)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">মোট জমা</span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {toBnCurrency(totalLifetimePaid, useBengali)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">বর্তমান বাকি</span>
              <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300 tabular-nums">
                {toBnCurrency(party.currentDue, useBengali)}
              </span>
            </div>
          </div>

          {/* 5. Section: খতিয়ান ভিউ সিলেক্টর ও মেমোর তালিকা */}
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                  মেমো ও খতিয়ান তালিকা ({toBengaliNumber(partyMemos.length, useBengali)} টি)
                </h3>
              </div>

              {/* View Mode Toggle: Cards vs Khotiyan Ledger Table */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-stone-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>মেমো ভিউ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('ledger')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition ${
                    viewMode === 'ledger'
                      ? 'bg-white dark:bg-stone-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>লেজার খতিয়ান শিট</span>
                </button>
              </div>
            </div>

            {/* Search if party has more than 2 memos */}
            {partyMemos.length > 2 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="মেমো নং বা তারিখ দিয়ে খুঁজুন..."
                  value={memoSearchQuery}
                  onChange={(e) => setMemoSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-stone-400"
                />
              </div>
            )}

            {/* If no memos */}
            {partyMemos.length === 0 ? (
              <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-5 text-center border border-dashed border-stone-300 dark:border-stone-700 space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-base mx-auto">
                  📑
                </div>
                <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                  এই পার্টির নামে এখনো কোনো মেমো তৈরি করা হয়নি
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewMemoForParty(party);
                  }}
                  className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 hover:underline"
                >
                  + প্রথম মেমো লিখুন
                </button>
              </div>
            ) : filteredMemos.length === 0 ? (
              <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-4 text-center text-stone-400 text-xs sm:text-sm font-semibold">
                কোনো মেমো পাওয়া যায়নি
              </div>
            ) : viewMode === 'ledger' ? (
              /* ========================================================
                 Khotiyan Ledger Table Sheet (লেজার খতিয়ান শিট)
                 ডিমের পিচ হিসাব ও বাকি পাওনা auto যোগের স্পষ্ট টেবিল
                 ======================================================== */
              <div className="border border-stone-200 dark:border-stone-750 rounded-xl overflow-x-auto shadow-xs bg-white dark:bg-stone-850">
                <table className="w-full text-[11px] sm:text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700">
                      <th className="py-2.5 px-2.5 whitespace-nowrap">তারিখ ও মেমো</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">ডিমের বিবরণ ও দর (রেট সহ মোট টাকা)</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap">মেমোর বিল</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">+ সাবেক বাকি</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-indigo-700 dark:text-indigo-300">= মোট দাবি</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">- জমা</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap font-black text-stone-950 dark:text-stone-100">বর্তমান বাকি (জের)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-750">
                    {filteredMemos.map((m) => {
                      return (
                        <tr 
                          key={m.id}
                          onClick={() => {
                            onClose();
                            onViewMemoVoucher(m);
                          }}
                          className="hover:bg-slate-50 dark:hover:bg-stone-800/60 cursor-pointer transition"
                        >
                          <td className="py-2.5 px-2.5 font-medium whitespace-nowrap align-top">
                            <div className="font-bold text-stone-900 dark:text-stone-100">{formatDisplayMemoNumber(m.memoNumber, useBengali)}</div>
                            <div className="text-[10.5px] text-stone-500 dark:text-stone-400">{m.formattedDate}</div>
                          </td>
                          <td className="py-2.5 px-2.5 align-top min-w-[220px]">
                            <div className="space-y-1">
                              {m.items.map((it, idx) => {
                                if (!it.count || it.count <= 0) return null;
                                const isRed = it.eggType === 'লাল ডিম';
                                const isWhite = it.eggType === 'সাদা ডিম';
                                const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                                const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                                return (
                                  <div key={idx} className="flex items-center justify-between text-[11px] font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${isRed ? 'bg-rose-600' : isWhite ? 'bg-cyan-500' : 'bg-purple-600'}`} />
                                      <span>{toBengaliNumber(it.count, useBengali)} {it.eggType} {toBengaliNumber(rateHundred, useBengali)} টাকা করে</span>
                                    </span>
                                    <span className="font-black text-slate-900 dark:text-white tabular-nums ml-2 shrink-0">
                                      = {toBnCurrency(itemTotal, useBengali)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-stone-900 dark:text-stone-100 whitespace-nowrap align-top">
                            {toBnCurrency(m.totalBill, useBengali)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap align-top">
                            {m.previousDue > 0 ? `+${toBnCurrency(m.previousDue, useBengali)}` : '০ ৳'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap align-top">
                            {toBnCurrency(m.totalDemand, useBengali)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap align-top">
                            {m.cashPaid > 0 ? `-${toBnCurrency(m.cashPaid, useBengali)}` : '০ ৳'}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-black whitespace-nowrap align-top">
                            <span className={m.remainingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {m.remainingDue > 0 ? toBnCurrency(m.remainingDue, useBengali) : 'পরিশোধ'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100/90 dark:bg-stone-800/90 font-black text-stone-950 dark:text-stone-50 border-t-2 border-stone-300 dark:border-stone-700">
                      <td className="py-2.5 px-2.5">সর্বমোট জের:</td>
                      <td className="py-2.5 px-2.5 text-indigo-700 dark:text-indigo-400">
                        মোট ডিম: {toBengaliNumber(eggAnalytics.totalEggs, useBengali)} পিস
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {toBnCurrency(totalLifetimeBilled, useBengali)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-stone-400">-</td>
                      <td className="py-2.5 px-2 text-right text-stone-400">-</td>
                      <td className="py-2.5 px-2 text-right text-emerald-600">
                        {toBnCurrency(totalLifetimePaid, useBengali)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-rose-600 dark:text-rose-400">
                        {toBnCurrency(party.currentDue, useBengali)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* ========================================================
                 Memos Card View (কার্ড তালিকা ভিউ)
                 ১ লাইনে ডিমের সংখ্যা, রেট ও টোটাল টাকা
                 ======================================================== */
              <div className="space-y-3">
                {filteredMemos.map((memo) => {
                  const isFullyPaid = memo.remainingDue <= 0;
                  const typeBadgeStyle = 
                    memo.partyType === 'পাইকারি' ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700' :
                    memo.partyType === 'হোটেল' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700' :
                    'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700';

                  return (
                    <div
                      key={memo.id}
                      onClick={() => {
                        onClose();
                        onViewMemoVoucher(memo);
                      }}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border-2 border-l-[5px] ${theme.borderLeft} ${theme.border} shadow-2xs hover:shadow-md ${theme.hoverBorder} transition-all cursor-pointer space-y-1.5`}
                    >
                      {/* Top Row: Memo No, Distinct Party Pill & Type */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`${theme.memoNumBadge} font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs`}>
                            {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${theme.nameBadge} text-left shadow-2xs`}>
                            <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>
                              {memo.partyName.trim().charAt(0)}
                            </span>
                            <span className="font-black text-xs sm:text-sm leading-tight">
                              {memo.partyName}
                            </span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border ${typeBadgeStyle}`}>
                            {memo.partyType}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <CalendarTodayIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          {memo.formattedDate}
                        </span>
                      </div>

                      {/* Second Row: Egg items with rates and total */}
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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span>
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

                      {/* Third Row: Financials and Action Buttons (High Contrast & Clear) */}
                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-950 dark:text-white tabular-nums flex items-center gap-1.5">
                            <span>মোট দাবি: {toBnCurrency(memo.totalDemand, useBengali)}</span>
                            {memo.previousDue > 0 && (
                              <span className="text-[10.5px] font-bold text-purple-800 dark:text-purple-300">
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
                            onClick={() => {
                              onClose();
                              onViewMemoVoucher(memo);
                            }}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="মেমো প্রিন্ট করুন"
                            onClick={() => {
                              onClose();
                              onViewMemoVoucher(memo);
                            }}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition active:scale-95 shadow-2xs"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            title="হোয়াটসঅ্যাপে শেয়ার"
                            onClick={(e) => handleShare(memo, e)}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {onDeleteMemo && (
                            <button
                              title="মেমো মুছুন"
                              type="button"
                              onClick={() => setMemoToDelete(memo)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>

        {/* Modal Close Button Bar */}
        <div className="px-3 py-2 bg-stone-100 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 text-right">
          <button
            onClick={onClose}
            className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-xs transition active:scale-95"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border-2 border-rose-300 dark:border-rose-800/80 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-stone-100">পার্টি মুছে ফেলুন</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">মুছে ফেলার পূর্বে নিশ্চিত করুন</p>
              </div>
            </div>

            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-750 leading-relaxed">
              আপনি কি নিশ্চিত যে <span className="text-rose-600 dark:text-rose-400 font-black">"{party.name}"</span> পার্টিকে খতিয়ান থেকে মুছতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold text-xs transition active:scale-95"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteParty) {
                    onDeleteParty(party.id);
                  }
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition active:scale-95"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memo Delete Confirmation Modal */}
      {onDeleteMemo && (
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
      )}
    </div>
  );
};
