import React, { useState, useEffect } from 'react';
import { BaseRate, EggType, Memo, MemoItem, Party, PartyType } from '../types';
import { 
  getBengaliDateString,
  getTodayDateInputValue, 
  getYesterdayDateInputValue,
  getBengaliDateFromInput,
  getDayOfWeekBn,
  toBengaliNumber, 
  toBnCurrency,
  convertEnToBnDigits,
  convertBnToEnDigits,
  parseBengaliToNumber,
  getNextMemoSequenceNumber,
  formatDisplayMemoNumber
} from '../utils/bengaliUtils';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowRight,
  Hash
} from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface NewMemoModalProps {
  isOpen: boolean;
  parties: Party[];
  memos?: Memo[];
  baseRate: BaseRate;
  useBengali: boolean;
  onClose: () => void;
  onSaveMemo: (newMemo: Memo, updatedPartyDue: number) => void;
  initialSelectedParty?: Party | null;
  initialDate?: string;
}

export const NewMemoModal: React.FC<NewMemoModalProps> = ({
  isOpen,
  parties,
  memos = [],
  baseRate,
  useBengali,
  onClose,
  onSaveMemo,
  initialSelectedParty = null,
  initialDate,
}) => {
  // Memo number sequence starting from 1
  const nextSeq = getNextMemoSequenceNumber(memos);
  const [memoNumStr, setMemoNumStr] = useState<string>(() => 
    useBengali ? toBengaliNumber(nextSeq, true) : nextSeq.toString()
  );

  // Party selection mode: 'saved' (from saved list) or 'new' (brand new party)
  const [partyMode, setPartyMode] = useState<'saved' | 'new'>(() => {
    if (initialSelectedParty) return 'saved';
    return parties.length > 0 ? 'saved' : 'new';
  });

  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialSelectedParty?.id || '');
  const [partyName, setPartyName] = useState<string>(initialSelectedParty?.name || '');
  const [partyPhone, setPartyPhone] = useState<string>(initialSelectedParty?.phone || '');
  const [partyType, setPartyType] = useState<PartyType>(initialSelectedParty?.type || 'পাইকারি');
  const [previousDue, setPreviousDue] = useState<number>(initialSelectedParty?.currentDue || 0);

  const [date, setDate] = useState<string>(initialDate || getTodayDateInputValue());
  const [note, setNote] = useState<string>('');
  const [cashPaid, setCashPaid] = useState<number>(0);

  // Bengali Digit Input Strings - Typing in English immediately converts to Bengali
  const [redCountStr, setRedCountStr] = useState<string>('');
  const [redRateStr, setRedRateStr] = useState<string>('');
  const [whiteCountStr, setWhiteCountStr] = useState<string>('');
  const [whiteRateStr, setWhiteRateStr] = useState<string>('');
  const [cashPaidStr, setCashPaidStr] = useState<string>('');
  const [previousDueStr, setPreviousDueStr] = useState<string>('');

  // Additional egg item inputs map for dynamic items
  const [extraItemInputs, setExtraItemInputs] = useState<Record<string, { countStr: string; rateStr: string }>>({});



  // Sync state whenever the modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      const seq = getNextMemoSequenceNumber(memos);
      setMemoNumStr(useBengali ? toBengaliNumber(seq, true) : seq.toString());

      if (initialSelectedParty) {
        setPartyMode('saved');
        setSelectedPartyId(initialSelectedParty.id);
        setPartyName(initialSelectedParty.name);
        setPartyPhone(initialSelectedParty.phone || '');
        setPartyType(initialSelectedParty.type || 'পাইকারি');
        const due = Number(initialSelectedParty.currentDue) || 0;
        setPreviousDue(due);
        setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
      } else {
        setPartyMode(parties.length > 0 ? 'saved' : 'new');
        setSelectedPartyId('');
        setPartyName('');
        setPartyPhone('');
        setPartyType('পাইকারি');
        setPreviousDue(0);
        setPreviousDueStr('');
      }
      setCashPaid(0);
      setCashPaidStr('');
      setRedCountStr('');
      setRedRateStr('');
      setWhiteCountStr('');
      setWhiteRateStr('');
      setExtraItemInputs({});
      setNote('');
      setDate(initialDate || getTodayDateInputValue());
      setItems([
        {
          id: 'item-red',
          eggType: 'লাল ডিম',
          count: 0,
          ratePerHundred: 0,
          ratePerPiece: 0,
          totalAmount: 0,
        },
        {
          id: 'item-white',
          eggType: 'সাদা ডিম',
          count: 0,
          ratePerHundred: 0,
          ratePerPiece: 0,
          totalAmount: 0,
        },
      ]);
    }
  }, [isOpen, initialSelectedParty, initialDate, parties.length, memos?.length, useBengali]);

  // Items - Purely Pieces and Rate - Start fresh with zero rate for user to enter
  const [items, setItems] = useState<MemoItem[]>([
    {
      id: 'item-red',
      eggType: 'লাল ডিম',
      count: 0,
      ratePerHundred: 0,
      ratePerPiece: 0,
      totalAmount: 0,
    },
    {
      id: 'item-white',
      eggType: 'সাদা ডিম',
      count: 0,
      ratePerHundred: 0,
      ratePerPiece: 0,
      totalAmount: 0,
    },
  ]);

  // When party changes from saved list
  const handlePartySelect = (id: string) => {
    setSelectedPartyId(id);
    if (!id || id === 'NEW') {
      setSelectedPartyId('');
      setPartyName('');
      setPartyPhone('');
      setPartyType('পাইকারি');
      setPreviousDue(0);
      setPreviousDueStr('');
      return;
    }
    const found = parties.find((p) => p.id === id);
    if (found) {
      setPartyMode('saved');
      setPartyName(found.name);
      setPartyPhone(found.phone || '');
      setPartyType(found.type || 'পাইকারি');
      const due = Number(found.currentDue) || 0;
      setPreviousDue(due);
      setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
    }
  };

  const handleNewPartyNameChange = (name: string) => {
    setPartyMode('new');
    setSelectedPartyId('NEW');
    setPartyName(name);
    const matched = parties.find(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (matched) {
      setSelectedPartyId(matched.id);
      setPartyPhone(matched.phone || '');
      setPartyType(matched.type || 'পাইকারি');
      const due = Number(matched.currentDue) || 0;
      setPreviousDue(due);
      setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
    } else {
      setPreviousDue(0);
      setPreviousDueStr('');
    }
  };

  const handleQuickCashSale = () => {
    setPartyMode('new');
    setSelectedPartyId('NEW');
    setPartyName('নগদ বিক্রি');
    setPartyPhone('');
    setPartyType('খুচরা');
    setPreviousDue(0);
    setPreviousDueStr('');
  };

  const switchToNewPartyMode = () => {
    setPartyMode('new');
    setSelectedPartyId('NEW');
    setPartyName('');
    setPartyPhone('');
    setPartyType('পাইকারি');
    setPreviousDue(0);
    setPreviousDueStr('');
  };

  const switchToSavedPartyMode = () => {
    setPartyMode('saved');
  };

  // Calculate totals - purely in pieces
  const totalEggs = items.reduce((sum, item) => sum + item.count, 0);
  const totalBill = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalDemand = totalBill + previousDue;
  const remainingDue = Math.max(0, totalDemand - cashPaid);

  const handleEggTypeChange = (idx: number, type: EggType) => {
    const updated = [...items];
    updated[idx].eggType = type;
    setItems(updated);
  };

  // User inputs Egg Pieces directly
  const handlePiecesChange = (idx: number, piecesVal: number) => {
    const updated = [...items];
    const safePieces = Math.max(0, piecesVal || 0);
    updated[idx].count = safePieces;
    const pieceRate = updated[idx].ratePerPiece || (updated[idx].ratePerHundred / 100);
    updated[idx].totalAmount = Math.round(safePieces * pieceRate);
    setItems(updated);
  };

  // Quick piece shortcut: +100, +500, +1000, +30
  const handleAddPiecesShortcut = (idx: number, delta: number) => {
    const updated = [...items];
    const current = updated[idx].count || 0;
    const newCount = Math.max(0, current + delta);
    updated[idx].count = newCount;
    const pieceRate = updated[idx].ratePerPiece || (updated[idx].ratePerHundred / 100);
    updated[idx].totalAmount = Math.round(newCount * pieceRate);
    setItems(updated);
    if (updated[idx].eggType === 'লাল ডিম') {
      setRedCountStr(newCount > 0 ? convertEnToBnDigits(newCount, false) : '');
    } else if (updated[idx].eggType === 'সাদা ডিম') {
      setWhiteCountStr(newCount > 0 ? convertEnToBnDigits(newCount, false) : '');
    }
  };

  // User inputs Rate per piece directly (e.g. 11.70)
  const handlePieceRateChange = (idx: number, pieceRateVal: number) => {
    const updated = [...items];
    const safePieceRate = Math.max(0, pieceRateVal || 0);
    updated[idx].ratePerPiece = safePieceRate;
    updated[idx].ratePerHundred = Number((safePieceRate * 100).toFixed(2));
    updated[idx].totalAmount = Math.round(updated[idx].count * safePieceRate);
    setItems(updated);
  };

  // User inputs Rate per 100 pieces (e.g. 1170)
  const handleRatePerHundredChange = (idx: number, rateVal: number) => {
    const updated = [...items];
    const safeRate = Math.max(0, rateVal || 0);
    updated[idx].ratePerHundred = safeRate;
    updated[idx].ratePerPiece = Number((safeRate / 100).toFixed(2));
    updated[idx].totalAmount = Math.round((updated[idx].count / 100) * safeRate);
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        eggType: 'সাদা ডিম',
        count: 0,
        ratePerHundred: 0,
        ratePerPiece: 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      if (partyMode === 'saved') {
        alert('অনুগ্রহ করে তালিকা থেকে সেভ করা পার্টি সিলেক্ট করুন অথবা নতুন পার্টির নাম লিখুন');
      } else {
        alert('অনুগ্রহ করে খরিদ্দার বা পার্টির নাম লিখুন');
      }
      return;
    }

    // Sequential memo number starting from 1 (No mixed digits, no random 2600 numbers)
    const cleanNum = memoNumStr.trim().replace(/^#+/, '');
    const finalMemoNum = cleanNum
      ? (useBengali ? convertEnToBnDigits(cleanNum) : convertBnToEnDigits(cleanNum))
      : (useBengali ? toBengaliNumber(nextSeq, true) : nextSeq.toString());

    const dateObj = new Date(date);
    const formattedDate = getBengaliDateString(isNaN(dateObj.getTime()) ? new Date() : dateObj, useBengali);

    // Save items with count > 0, or keep at least 1 item
    const activeItems = items.filter((it) => it.count > 0);
    const finalItems = activeItems.length > 0 ? activeItems : items.slice(0, 1);

    const newMemo: Memo = {
      id: `memo-${Date.now()}`,
      memoNumber: finalMemoNum,
      partyId: selectedPartyId === 'NEW' || !selectedPartyId ? `p-${Date.now()}` : selectedPartyId,
      partyName: partyName.trim(),
      partyPhone: partyPhone.trim() || '',
      partyType,
      date,
      formattedDate,
      items: finalItems,
      totalEggs,
      totalBill,
      previousDue,
      totalDemand,
      cashPaid,
      remainingDue,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveMemo(newMemo, remainingDue);
    onClose();
  };

  const todayStr = getTodayDateInputValue();
  const yesterdayStr = getYesterdayDateInputValue();
  const dayName = getDayOfWeekBn(date);
  const formattedSelectedDate = getBengaliDateFromInput(date, useBengali);

  if (!isOpen) return null;

  return (
    <div 
      id="new-memo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-1 sm:pt-2 bg-stone-950/75 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        id="new-memo-modal-container"
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-0 mt-0.5 sm:mt-1 border border-indigo-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 flex flex-col max-h-[97vh]"
      >
        {/* 1. Modal Header with Clear Title and Memo Number */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-3.5 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🥚</span>
            <h2 className="font-black text-xs sm:text-sm tracking-wide leading-tight">নতুন বিক্রয় মেমো (ক্যাশ ও বাকি)</h2>
          </div>
          <button
            id="close-memo-modal-btn"
            type="button"
            onClick={onClose}
            className="w-6.5 h-6.5 rounded-full bg-black/25 hover:bg-black/40 active:scale-90 flex items-center justify-center text-white transition ring-1 ring-white/30 shadow-xs"
            title="মেমো বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Form - Colorful, Compact and Legible Layout */}
        <form onSubmit={handleSubmit} className="p-2.5 sm:p-3 space-y-1.5 text-xs sm:text-sm overflow-y-auto">
          {/* Top Info Row: মেমো নং (১ থেকে শুরু) ও তারিখ */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Memo Number Starting from 1 */}
            <div 
              id="memo-number-input-card"
              className="bg-indigo-50/90 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.5]" />
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">মেমো নং:</span>
              </div>
              <input
                id="input-custom-memo-number"
                type="text"
                value={memoNumStr}
                onChange={(e) => setMemoNumStr(convertEnToBnDigits(e.target.value, false))}
                placeholder="১"
                className="w-14 text-center font-black font-mono text-xs bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-700 rounded py-0.5 px-1 text-indigo-950 dark:text-white outline-none focus:border-indigo-600 shadow-2xs"
                title="মেমো নম্বর (১ থেকে শুরু, প্রয়োজনে পরিবর্তন করতে পারেন)"
              />
            </div>

            {/* Date Selector */}
            <div 
              id="memo-top-date-section"
              className="bg-sky-50/90 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border-2 border-sky-200 dark:border-sky-800/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-1 min-w-0">
                <CalendarTodayIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="text-[11px] font-extrabold text-sky-950 dark:text-sky-100 truncate">
                  {dayName ? `${dayName}, ` : ''}{formattedSelectedDate}
                </span>
              </div>
              <input
                id="input-memo-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-[11px] font-bold border border-sky-400 dark:border-sky-700 rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 text-sky-950 dark:text-sky-100 outline-none focus:border-sky-500 shadow-2xs w-20"
              />
            </div>
          </div>

          {/* 3. পার্টির বক্স (আকর্ষণীয় ও সুস্পষ্ট ইন্ডিগো কার্ড) */}
          <div 
            id="box-party-container"
            className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2 rounded-xl border-2 border-indigo-200 dark:border-indigo-850/80 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1">
                <span>👤</span>
                <span>খরিদ্দার / পার্টির তথ্য</span>
              </span>
              <button
                type="button"
                onClick={handleQuickCashSale}
                className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 hover:text-white bg-emerald-100 hover:bg-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-600 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded transition shadow-2xs active:scale-95"
                title="নগদ বিক্রি সেট করুন"
              >
                + নগদ বিক্রি
              </button>
            </div>

            {/* রো ১: সেভ করা পার্টি ড্রপডাউন ও নাম ইনপুট */}
            <div className="grid grid-cols-2 gap-1.5">
              <select
                id="select-existing-party"
                value={selectedPartyId}
                onChange={(e) => handlePartySelect(e.target.value)}
                className="w-full text-xs font-bold border-2 border-indigo-300 dark:border-indigo-800 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none truncate shadow-2xs"
              >
                <option value="">-- সেভ করা পার্টি বাছুন --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.currentDue > 0 ? `(বাকি: ৳${toBengaliNumber(p.currentDue, useBengali)})` : ''}
                  </option>
                ))}
              </select>

              <input
                id="input-party-name"
                type="text"
                placeholder="পার্টির নাম লিখুন..."
                value={partyName}
                onChange={(e) => handleNewPartyNameChange(e.target.value)}
                className="w-full text-xs font-bold border-2 border-indigo-300 dark:border-indigo-800 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none shadow-2xs"
                required
              />
            </div>

            {/* রো ২: মোবাইল নং ও ক্যাটাগরি */}
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="input-party-phone"
                type="tel"
                placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                className="w-full text-xs font-bold border border-indigo-300 dark:border-indigo-800 rounded-lg py-0.5 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-2xs"
              />
              <select
                id="select-party-type"
                value={partyType}
                onChange={(e) => setPartyType(e.target.value as PartyType)}
                className="w-full text-xs font-bold border border-indigo-300 dark:border-indigo-800 rounded-lg py-0.5 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="পাইকারি">পাইকারি</option>
                <option value="খুচরা">খুচরা</option>
                <option value="হোটেল">হোটেল</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>

            {/* পূর্বের বাকি পাওনা auto যোগের নোটিশ বার */}
            {previousDue > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-md px-2.5 py-0.5 flex items-center justify-between text-xs font-bold text-rose-950 dark:text-rose-200">
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>পার্টির পূর্বের বাকি পাওনা:</span>
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  ৳{toBnCurrency(previousDue, useBengali)} (অটো যোগ হচ্ছে)
                </span>
              </div>
            )}
          </div>

          {/* 4. লাইন ১: লাল ডিম - Larger & Clearer Input Boxes */}
          {(() => {
            const redIdx = items.findIndex((it) => it.eggType === 'লাল ডিম');
            const actualRedIdx = redIdx !== -1 ? redIdx : 0;
            const redItem = items[actualRedIdx] || {
              id: 'item-red',
              eggType: 'লাল ডিম',
              count: 0,
              ratePerHundred: 0,
              ratePerPiece: 0,
              totalAmount: 0,
            };

            return (
              <div 
                id="line-box-red-egg"
                className="bg-rose-50/90 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-xl p-2 space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-2xs shrink-0" />
                    <span className="font-extrabold text-xs text-rose-950 dark:text-rose-100">🔴 লাল ডিম</span>
                  </div>
                  {redItem.ratePerHundred > 0 ? (
                    <span className="text-[11px] text-rose-900 dark:text-rose-200 font-black bg-rose-200/90 dark:bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-700">
                      ১০০ পিস: ৳{toBengaliNumber(redItem.ratePerHundred, useBengali)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-800/90 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                      দর বসান
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-rose-300 dark:border-rose-700 px-1.5 py-0.5 sm:py-1 focus-within:border-rose-500 shadow-2xs">
                      <input
                        id="input-memo-red-count"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="পিস"
                        value={redCountStr}
                        onChange={(e) => {
                          const bn = convertEnToBnDigits(e.target.value, false);
                          setRedCountStr(bn);
                          handlePiecesChange(actualRedIdx, parseBengaliToNumber(bn));
                        }}
                        className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                      />
                      <span className="text-[11px] text-rose-700 dark:text-rose-400 shrink-0 font-extrabold">টি</span>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-rose-300 dark:border-rose-700 px-1.5 py-0.5 sm:py-1 focus-within:border-rose-500 shadow-2xs">
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400 shrink-0">৳</span>
                      <input
                        id="input-memo-red-rate"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="দর"
                        value={redRateStr}
                        onChange={(e) => {
                          const bn = convertEnToBnDigits(e.target.value, true);
                          setRedRateStr(bn);
                          handlePieceRateChange(actualRedIdx, parseBengaliToNumber(bn));
                        }}
                        className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-4 text-right">
                    <div className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-200 whitespace-nowrap">
                      = {toBnCurrency(redItem.totalAmount, useBengali)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5. লাইন ২: সাদা ডিম - Compact */}
          {(() => {
            const whiteIdx = items.findIndex((it) => it.eggType === 'সাদা ডিম');
            const actualWhiteIdx = whiteIdx !== -1 ? whiteIdx : 1;
            const whiteItem = items[actualWhiteIdx] || {
              id: 'item-white',
              eggType: 'সাদা ডিম',
              count: 0,
              ratePerHundred: 0,
              ratePerPiece: 0,
              totalAmount: 0,
            };

            return (
              <div 
                id="line-box-white-egg"
                className="bg-cyan-50/90 dark:bg-cyan-950/30 border-2 border-cyan-400 dark:border-cyan-800 rounded-xl p-2 space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-cyan-500 shadow-2xs shrink-0" />
                    <span className="font-extrabold text-xs text-cyan-950 dark:text-cyan-100">⚪ সাদা ডিম</span>
                  </div>
                  {whiteItem.ratePerHundred > 0 ? (
                    <span className="text-[11px] text-cyan-900 dark:text-cyan-200 font-black bg-cyan-200/90 dark:bg-cyan-900/60 px-1.5 py-0.2 rounded border border-cyan-400 dark:border-cyan-700">
                      ১০০ পিস: ৳{toBengaliNumber(whiteItem.ratePerHundred, useBengali)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-cyan-800/90 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-300 dark:border-cyan-800">
                      দর বসান
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-cyan-400 dark:border-cyan-700 px-1.5 py-0.5 sm:py-1 focus-within:border-cyan-600 shadow-2xs">
                      <input
                        id="input-memo-white-count"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="পিস"
                        value={whiteCountStr}
                        onChange={(e) => {
                          const bn = convertEnToBnDigits(e.target.value, false);
                          setWhiteCountStr(bn);
                          handlePiecesChange(actualWhiteIdx, parseBengaliToNumber(bn));
                        }}
                        className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                      />
                      <span className="text-[11px] text-cyan-700 dark:text-cyan-400 shrink-0 font-extrabold">টি</span>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-cyan-400 dark:border-cyan-700 px-1.5 py-0.5 sm:py-1 focus-within:border-cyan-600 shadow-2xs">
                      <span className="text-xs font-black text-cyan-700 dark:text-cyan-400 shrink-0">৳</span>
                      <input
                        id="input-memo-white-rate"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="দর"
                        value={whiteRateStr}
                        onChange={(e) => {
                          const bn = convertEnToBnDigits(e.target.value, true);
                          setWhiteRateStr(bn);
                          handlePieceRateChange(actualWhiteIdx, parseBengaliToNumber(bn));
                        }}
                        className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-4 text-right">
                    <div className="text-xs sm:text-sm font-black text-cyan-950 dark:text-cyan-200 whitespace-nowrap">
                      = {toBnCurrency(whiteItem.totalAmount, useBengali)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Optional: Additional items if added */}
          {items.slice(2).map((extraItem, extraOffset) => {
            const actualIdx = extraOffset + 2;
            const pieceRate = extraItem.ratePerPiece || (extraItem.ratePerHundred / 100);
            return (
              <div 
                key={extraItem.id} 
                className="p-2 bg-purple-50/90 dark:bg-purple-950/30 rounded-xl border-2 border-purple-300 dark:border-purple-800 space-y-1 shadow-2xs"
              >
                <div className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-3 flex items-center gap-1">
                    <select
                      value={extraItem.eggType}
                      onChange={(e) => handleEggTypeChange(actualIdx, e.target.value as EggType)}
                      className="w-full text-xs font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg p-0.5 bg-white dark:bg-stone-800 text-purple-950 dark:text-purple-100"
                    >
                      <option value="হাঁসের ডিম">হাঁসের ডিম</option>
                      <option value="দেশি ডিম">দেশি ডিম</option>
                      <option value="লাল ডিম">লাল ডিম</option>
                      <option value="সাদা ডিম">সাদা ডিম</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="পিস"
                      value={extraItemInputs[extraItem.id]?.countStr ?? (extraItem.count > 0 ? convertEnToBnDigits(extraItem.count, false) : '')}
                      onChange={(e) => {
                        const bn = convertEnToBnDigits(e.target.value, false);
                        setExtraItemInputs((prev) => ({
                          ...prev,
                          [extraItem.id]: {
                            countStr: bn,
                            rateStr: prev[extraItem.id]?.rateStr ?? '',
                          },
                        }));
                        handlePiecesChange(actualIdx, parseBengaliToNumber(bn));
                      }}
                      className="w-full text-xs sm:text-sm font-black border-2 border-purple-300 dark:border-purple-700 rounded-lg py-0.5 px-1 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="দর"
                      value={extraItemInputs[extraItem.id]?.rateStr ?? (pieceRate > 0 ? convertEnToBnDigits(pieceRate, true) : '')}
                      onChange={(e) => {
                        const bn = convertEnToBnDigits(e.target.value, true);
                        setExtraItemInputs((prev) => ({
                          ...prev,
                          [extraItem.id]: {
                            countStr: prev[extraItem.id]?.countStr ?? '',
                            rateStr: bn,
                          },
                        }));
                        handlePieceRateChange(actualIdx, parseBengaliToNumber(bn));
                      }}
                      className="w-full text-xs sm:text-sm font-black border-2 border-purple-300 dark:border-purple-700 rounded-lg py-0.5 px-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-center"
                    />
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-1">
                    <span className="font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 truncate">
                      {toBnCurrency(extraItem.totalAmount, useBengali)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(actualIdx)}
                      className="text-stone-400 hover:text-rose-500 p-0.5 rounded"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add extra egg button */}
          <div className="flex justify-end px-1">
            <button
              type="button"
              id="btn-add-egg-item"
              onClick={addItem}
              className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 px-2 py-0.5 rounded flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>+ অন্যান্য ডিম যোগ</span>
            </button>
          </div>

          {/* 6. লাইন ৩: পূর্বের বকেয়া - Compact */}
          <div 
            id="line-box-previous-due"
            className="bg-rose-50/90 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/70 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-rose-950 dark:text-rose-200">পূর্বের বকেয়া:</span>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1 py-0.2 rounded font-bold">Auto যোগ</span>
            </div>

            <div className="relative">
              <input
                id="input-memo-previous-due"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={previousDueStr}
                onChange={(e) => {
                  const bn = convertEnToBnDigits(e.target.value, false);
                  setPreviousDueStr(bn);
                  setPreviousDue(parseBengaliToNumber(bn));
                }}
                placeholder="০"
                className="w-24 text-xs sm:text-sm font-black text-right border-2 border-rose-400 dark:border-rose-800 rounded-lg py-0.5 sm:py-1 px-1.5 pr-4 bg-white dark:bg-stone-900 text-rose-700 dark:text-rose-300 focus:border-rose-600 outline-none shadow-2xs"
              />
              <span className="absolute right-1.5 top-1 sm:top-1.5 text-[11px] font-black text-rose-500 pointer-events-none">৳</span>
            </div>
          </div>

          {/* 7. লাইন ৪: সর্বমোট দাবি - Compact */}
          <div 
            id="line-box-total-demand"
            className="bg-purple-50/90 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100">সর্বমোট দাবি:</span>
              <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-1 py-0.2 rounded font-bold">বিল + বাকি</span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-purple-950 dark:text-purple-200">
                {toBnCurrency(totalDemand, useBengali)}
              </span>
            </div>
          </div>

          {/* 8. লাইন ৫: নগদ জমা - Compact */}
          <div 
            id="line-box-cash-paid"
            className="bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-800/80 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">নগদ জমা:</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">আজকের টাকা</span>
            </div>

            <div className="relative">
              <input
                id="input-cash-paid"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cashPaidStr}
                onChange={(e) => {
                  const bn = convertEnToBnDigits(e.target.value, false);
                  setCashPaidStr(bn);
                  setCashPaid(parseBengaliToNumber(bn));
                }}
                placeholder="০"
                className="w-24 text-xs sm:text-sm font-black text-right border-2 border-emerald-500 dark:border-emerald-700 rounded-lg py-0.5 sm:py-1 px-1.5 pr-4 bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-200 focus:border-emerald-600 outline-none shadow-2xs"
              />
              <span className="absolute right-1.5 top-1 sm:top-1.5 text-[11px] font-black text-emerald-500 pointer-events-none">৳</span>
            </div>
          </div>

          {/* 9. লাইন ৬: অবশিষ্ট বাকি - Compact */}
          <div 
            id="line-box-remaining-due"
            className={`rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 border-2 shadow-2xs ${
              remainingDue > 0
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm">অবশিষ্ট বাকি:</span>
              <span className="text-[10px] bg-rose-200/90 dark:bg-rose-900/90 text-rose-900 dark:text-rose-200 px-1 py-0.2 rounded font-bold">Auto</span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black">
                {remainingDue > 0 ? toBnCurrency(remainingDue, useBengali) : 'পরিশোধিত (০ ৳)'}
              </span>
            </div>
          </div>

          {/* 10. Note & Action Buttons */}
          <div className="pt-0.5 space-y-1">
            <input
              id="input-memo-note"
              type="text"
              placeholder="মন্তব্য / নোট (ঐচ্ছিক)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs font-bold border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-indigo-500"
            />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition active:scale-95"
              >
                বাতিল
              </button>
              <button
                id="submit-memo-btn"
                type="submit"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1"
              >
                <span>💾 মেমো সেভ ও ভাউচার তৈরি করুন</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
