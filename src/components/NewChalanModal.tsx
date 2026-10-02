import React, { useState, useEffect } from 'react';
import { BaseRate, EggType, ShopProfile, Supplier, SupplierChalan } from '../types';
import { 
  getBengaliDateFromInput, 
  getTodayDateInputValue,
  getDayOfWeekBn,
  toBengaliNumber, 
  toBnCurrency, 
  convertEnToBnDigits,
  convertBnToEnDigits,
  parseBengaliToNumber,
  getNextChalanSequenceNumber,
  formatDisplayChalanNumber
} from '../utils/bengaliUtils';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowRight,
  Truck,
  Hash
} from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface NewChalanModalProps {
  isOpen: boolean;
  suppliers: Supplier[];
  chalans?: SupplierChalan[];
  baseRate?: BaseRate;
  shopProfile?: ShopProfile;
  useBengali: boolean;
  onClose: () => void;
  onSaveChalan: (chalan: SupplierChalan) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplierId: string, updatedFields: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
  initialSelectedSupplier?: Supplier | null;
  initialDate?: string;
  startInNewMode?: boolean;
}

interface ExtraEggItem {
  id: string;
  eggType: string;
  count: number;
  ratePerPiece: number;
  totalAmount: number;
}

export const NewChalanModal: React.FC<NewChalanModalProps> = ({
  isOpen,
  suppliers,
  chalans = [],
  baseRate,
  shopProfile,
  useBengali,
  onClose,
  onSaveChalan,
  onAddSupplier,
  onUpdateSupplier,
  initialSelectedSupplier = null,
  initialDate,
  startInNewMode = false,
}) => {
  // Chalan number sequence starting from 1
  const nextSeq = getNextChalanSequenceNumber(chalans);
  const [chalanNumStr, setChalanNumStr] = useState<string>(() => 
    useBengali ? toBengaliNumber(nextSeq, true) : nextSeq.toString()
  );

  const [chalanSupplierId, setChalanSupplierId] = useState('');
  const [chalanSupplierName, setChalanSupplierName] = useState('');
  const [chalanSupplierPhone, setChalanSupplierPhone] = useState('');
  const [chalanSupplierLocation, setChalanSupplierLocation] = useState('');
  const [previousDue, setPreviousDue] = useState<number>(0);
  const [previousDueStr, setPreviousDueStr] = useState<string>('');

  const [chalanDate, setChalanDate] = useState(initialDate || getTodayDateInputValue());
  const [note, setNote] = useState('');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [cashPaidStr, setCashPaidStr] = useState<string>('');

  // Bengali Digit Input Strings - Typing in English immediately converts to Bengali
  const [redCountStr, setRedCountStr] = useState<string>('');
  const [redRateStr, setRedRateStr] = useState<string>('');
  const [whiteCountStr, setWhiteCountStr] = useState<string>('');
  const [whiteRateStr, setWhiteRateStr] = useState<string>('');

  // Additional egg items
  const [extraItems, setExtraItems] = useState<ExtraEggItem[]>([]);
  const [extraItemInputs, setExtraItemInputs] = useState<Record<string, { countStr: string; rateStr: string }>>({});

  // Auto initialize on open
  useEffect(() => {
    if (isOpen) {
      const seq = getNextChalanSequenceNumber(chalans);
      setChalanNumStr(useBengali ? toBengaliNumber(seq, true) : seq.toString());
      setChalanDate(initialDate || getTodayDateInputValue());

      if (initialSelectedSupplier) {
        setChalanSupplierId(initialSelectedSupplier.id);
        setChalanSupplierName(initialSelectedSupplier.name);
        setChalanSupplierPhone(initialSelectedSupplier.phone || '');
        setChalanSupplierLocation(initialSelectedSupplier.farmLocation || '');
        const due = initialSelectedSupplier.totalPayable || 0;
        setPreviousDue(due);
        setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
      } else if (suppliers.length > 0 && !startInNewMode) {
        setChalanSupplierId('');
        setChalanSupplierName('');
        setChalanSupplierPhone('');
        setChalanSupplierLocation('');
        setPreviousDue(0);
        setPreviousDueStr('');
      } else {
        setChalanSupplierId('NEW');
        setChalanSupplierName('');
        setChalanSupplierPhone('');
        setChalanSupplierLocation('');
        setPreviousDue(0);
        setPreviousDueStr('');
      }

      setRedCountStr('');
      setRedRateStr('');
      setWhiteCountStr('');
      setWhiteRateStr('');
      setExtraItems([]);
      setExtraItemInputs({});
      setCashPaid(0);
      setCashPaidStr('');
      setNote('');
    }
  }, [isOpen, initialSelectedSupplier, initialDate, startInNewMode, suppliers, chalans, useBengali]);

  if (!isOpen) return null;

  // Supplier selection change
  const handleSupplierSelect = (id: string) => {
    setChalanSupplierId(id);
    if (!id) {
      setChalanSupplierName('');
      setChalanSupplierPhone('');
      setChalanSupplierLocation('');
      setPreviousDue(0);
      setPreviousDueStr('');
      return;
    }
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      setChalanSupplierName(sup.name);
      setChalanSupplierPhone(sup.phone || '');
      setChalanSupplierLocation(sup.farmLocation || '');
      const due = sup.totalPayable || 0;
      setPreviousDue(due);
      setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
    }
  };

  const handleSupplierNameChange = (val: string) => {
    setChalanSupplierName(val);
    const matched = suppliers.find((s) => s.name.trim().toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setChalanSupplierId(matched.id);
      if (!chalanSupplierPhone) setChalanSupplierPhone(matched.phone || '');
      if (!chalanSupplierLocation) setChalanSupplierLocation(matched.farmLocation || '');
      const due = matched.totalPayable || 0;
      setPreviousDue(due);
      setPreviousDueStr(due > 0 ? convertEnToBnDigits(due, false) : '');
    } else {
      setChalanSupplierId('NEW');
    }
  };

  // Calculations
  const redCount = parseBengaliToNumber(redCountStr);
  const redPieceRate = parseBengaliToNumber(redRateStr);
  const redTotal = redCount > 0 && redPieceRate > 0 ? Math.round(redCount * redPieceRate) : 0;
  const redHundredRate = redPieceRate > 0 ? Math.round(redPieceRate * 100) : 0;

  const whiteCount = parseBengaliToNumber(whiteCountStr);
  const whitePieceRate = parseBengaliToNumber(whiteRateStr);
  const whiteTotal = whiteCount > 0 && whitePieceRate > 0 ? Math.round(whiteCount * whitePieceRate) : 0;
  const whiteHundredRate = whitePieceRate > 0 ? Math.round(whitePieceRate * 100) : 0;

  // Extra items total
  const extraEggsCount = extraItems.reduce((sum, it) => sum + (it.count || 0), 0);
  const extraTotalAmount = extraItems.reduce((sum, it) => sum + (it.totalAmount || 0), 0);

  const totalChalanEggs = redCount + whiteCount + extraEggsCount;
  const calculatedChalanTotal = redTotal + whiteTotal + extraTotalAmount;

  // Total Demand = Today's bill + Previous payable due
  const totalDemand = calculatedChalanTotal + previousDue;
  const remainingDue = totalDemand - cashPaid;

  // Add extra egg item
  const handleAddExtraItem = () => {
    const newItemId = `extra-${Date.now()}`;
    setExtraItems((prev) => [
      ...prev,
      {
        id: newItemId,
        eggType: 'হাঁসের ডিম',
        count: 0,
        ratePerPiece: 0,
        totalAmount: 0,
      },
    ]);
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems((prev) => prev.filter((it) => it.id !== id));
    setExtraItemInputs((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleExtraItemChange = (id: string, field: 'eggType' | 'count' | 'ratePerPiece', val: any) => {
    setExtraItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'count' || field === 'ratePerPiece') {
          updated.totalAmount = Math.round((updated.count || 0) * (updated.ratePerPiece || 0));
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalanSupplierName.trim()) {
      alert('অনুগ্রহ করে মহাজন বা খামারির নাম লিখুন অথবা তালিকা থেকে সিলেক্ট করুন');
      return;
    }

    if (totalChalanEggs <= 0 && calculatedChalanTotal <= 0 && cashPaid <= 0) {
      alert('অনুগ্রহ করে ডিমের সংখ্যা ও দর অথবা নগদ পরিশোধ উল্লেখ করুন');
      return;
    }

    // Clean sequential chalan number
    const cleanNum = chalanNumStr.trim().replace(/^#+/, '');
    const finalChalanNum = cleanNum
      ? (useBengali ? convertEnToBnDigits(cleanNum) : convertBnToEnDigits(cleanNum))
      : (useBengali ? toBengaliNumber(nextSeq, true) : nextSeq.toString());

    const formattedDate = getBengaliDateFromInput(chalanDate, useBengali);

    // Save or update supplier if needed
    let finalSupplierId = chalanSupplierId;
    if (finalSupplierId === 'NEW' || !finalSupplierId) {
      const existing = suppliers.find((s) => s.name.trim().toLowerCase() === chalanSupplierName.trim().toLowerCase());
      if (existing) {
        finalSupplierId = existing.id;
      } else {
        finalSupplierId = `sup-${Date.now()}`;
        if (onAddSupplier) {
          const newSup: Supplier = {
            id: finalSupplierId,
            name: chalanSupplierName.trim(),
            phone: chalanSupplierPhone.trim(),
            farmLocation: chalanSupplierLocation.trim() || 'মহাজন',
            totalPurchased: calculatedChalanTotal,
            totalPaid: cashPaid,
            totalPayable: remainingDue,
            createdAt: new Date().toISOString(),
          };
          onAddSupplier(newSup);
        }
      }
    }

    const newChalan: SupplierChalan = {
      id: `chalan-${Date.now()}`,
      chalanNumber: finalChalanNum,
      supplierId: finalSupplierId,
      supplierName: chalanSupplierName.trim(),
      supplierPhone: chalanSupplierPhone.trim(),
      date: chalanDate,
      formattedDate,
      eggType: 'মিশ্র ডিম',
      eggCount: totalChalanEggs,
      ratePerPiece: totalChalanEggs > 0 ? Number((calculatedChalanTotal / totalChalanEggs).toFixed(2)) : 0,
      totalAmount: calculatedChalanTotal,
      previousDue,
      totalDemand,
      paidAmount: cashPaid,
      dueAmount: Math.max(0, calculatedChalanTotal - cashPaid),
      remainingDue,
      redEggCount: redCount,
      redRatePerPiece: redPieceRate,
      redRatePerHundred: redHundredRate,
      redTotalAmount: redTotal,
      whiteEggCount: whiteCount,
      whiteRatePerPiece: whitePieceRate,
      whiteRatePerHundred: whiteHundredRate,
      whiteTotalAmount: whiteTotal,
      note: note.trim(),
      notes: note.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveChalan(newChalan);
    onClose();
  };

  const dayName = getDayOfWeekBn(chalanDate);
  const formattedSelectedDate = getBengaliDateFromInput(chalanDate, useBengali);

  return (
    <div 
      id="new-chalan-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-1 sm:pt-2 bg-stone-950/75 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        id="new-chalan-modal-container"
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-0 mt-0.5 sm:mt-1 border border-indigo-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 flex flex-col max-h-[97vh]"
      >
        {/* 1. Modal Header with Clear Title and Chalan Number (হুবহু মেমোর মতো সেইম ডিজাইন) */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-3.5 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚚</span>
            <h2 className="font-black text-xs sm:text-sm tracking-wide leading-tight">নতুন মহাজন চালান (ক্রয় ও দেনা হিসাব)</h2>
          </div>
          <button
            id="close-chalan-modal-btn"
            type="button"
            onClick={onClose}
            className="w-6.5 h-6.5 rounded-full bg-black/25 hover:bg-black/40 active:scale-90 flex items-center justify-center text-white transition ring-1 ring-white/30 shadow-xs"
            title="চালান বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Form - Colorful, Compact and Legible Layout (পার্টির মেমোর সাথে ১০০% হুবহু এক) */}
        <form onSubmit={handleSubmit} className="p-2.5 sm:p-3 space-y-1.5 text-xs sm:text-sm overflow-y-auto">
          {/* Top Info Row: চালান নং (১ থেকে শুরু) ও তারিখ */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Chalan Number Starting from 1 */}
            <div 
              id="chalan-number-input-card"
              className="bg-indigo-50/90 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.5]" />
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">চালান নং:</span>
              </div>
              <input
                id="input-custom-chalan-number"
                type="text"
                value={chalanNumStr}
                onChange={(e) => setChalanNumStr(convertEnToBnDigits(e.target.value, false))}
                placeholder="১"
                className="w-14 text-center font-black font-mono text-xs bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-700 rounded py-0.5 px-1 text-indigo-950 dark:text-white outline-none focus:border-indigo-600 shadow-2xs"
                title="চালান নম্বর (১ থেকে শুরু, প্রয়োজনে পরিবর্তন করতে পারেন)"
              />
            </div>

            {/* Date Selector */}
            <div 
              id="chalan-top-date-section"
              className="bg-sky-50/90 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border-2 border-sky-200 dark:border-sky-800/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-1 min-w-0">
                <CalendarTodayIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="text-[11px] font-extrabold text-sky-950 dark:text-sky-100 truncate">
                  {dayName ? `${dayName}, ` : ''}{formattedSelectedDate}
                </span>
              </div>
              <input
                id="input-chalan-date"
                type="date"
                value={chalanDate}
                onChange={(e) => setChalanDate(e.target.value)}
                className="text-[11px] font-bold border border-sky-400 dark:border-sky-700 rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 text-sky-950 dark:text-sky-100 outline-none focus:border-sky-500 shadow-2xs w-20"
              />
            </div>
          </div>

          {/* 3. মহাজনের বক্স (আকর্ষণীয় ও সুস্পষ্ট ইন্ডিগো কার্ড - পার্টির বক্সের হুবহু কপি) */}
          <div 
            id="box-supplier-container"
            className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2 rounded-xl border-2 border-indigo-200 dark:border-indigo-855/80 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1">
                <span>🚚</span>
                <span>মহাজন / খামারির তথ্য</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                ডিম সরবরাহকারী
              </span>
            </div>

            {/* রো ১: সেভ করা মহাজন ড্রপডাউন ও নাম ইনপুট */}
            <div className="grid grid-cols-2 gap-1.5">
              <select
                id="select-existing-supplier"
                value={chalanSupplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full text-xs font-bold border-2 border-indigo-300 dark:border-indigo-800 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none truncate shadow-2xs"
              >
                <option value="">-- সেভ করা মহাজন বাছুন --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.totalPayable > 0 ? `(দেনা: ৳${toBengaliNumber(s.totalPayable, useBengali)})` : ''}
                  </option>
                ))}
              </select>

              <input
                id="input-supplier-name"
                type="text"
                placeholder="মহাজনের নাম লিখুন..."
                value={chalanSupplierName}
                onChange={(e) => handleSupplierNameChange(e.target.value)}
                className="w-full text-xs font-bold border-2 border-indigo-300 dark:border-indigo-800 rounded-lg py-1 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none shadow-2xs"
                required
              />
            </div>

            {/* রো ২: মোবাইল নং ও খামার/এলাকা */}
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="input-supplier-phone"
                type="tel"
                placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                value={chalanSupplierPhone}
                onChange={(e) => setChalanSupplierPhone(e.target.value)}
                className="w-full text-xs font-bold border border-indigo-300 dark:border-indigo-800 rounded-lg py-0.5 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-2xs"
              />
              <input
                id="input-supplier-location"
                type="text"
                placeholder="খামার / আড়ত এলাকা (ঐচ্ছিক)"
                value={chalanSupplierLocation}
                onChange={(e) => setChalanSupplierLocation(e.target.value)}
                className="w-full text-xs font-bold border border-indigo-300 dark:border-indigo-800 rounded-lg py-0.5 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* পূর্বের দেনা বাকি auto যোগের নোটিশ বার */}
            {previousDue > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-md px-2.5 py-0.5 flex items-center justify-between text-xs font-bold text-rose-950 dark:text-rose-200">
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>মহাজনের পূর্বের দেনা বাকি:</span>
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  ৳{toBnCurrency(previousDue, useBengali)} (অটো যোগ হচ্ছে)
                </span>
              </div>
            )}
          </div>

          {/* 4. লাইন ১: লাল ডিম - Larger & Clearer Input Boxes (মেমোর সাথে হুবহু এক) */}
          <div 
            id="line-box-red-egg"
            className="bg-rose-50/90 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-xl p-2 space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-2xs shrink-0" />
                <span className="font-extrabold text-xs text-rose-950 dark:text-rose-100">🔴 লাল ডিম</span>
              </div>
              {redHundredRate > 0 ? (
                <span className="text-[11px] text-rose-900 dark:text-rose-200 font-black bg-rose-200/90 dark:bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-700">
                  ১০০ পিস: ৳{toBengaliNumber(redHundredRate, useBengali)}
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
                    id="input-chalan-red-count"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="পিস"
                    value={redCountStr}
                    onChange={(e) => setRedCountStr(convertEnToBnDigits(e.target.value, false))}
                    className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                  />
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 shrink-0 font-extrabold">টি</span>
                </div>
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-rose-300 dark:border-rose-700 px-1.5 py-0.5 sm:py-1 focus-within:border-rose-500 shadow-2xs">
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400 shrink-0">৳</span>
                  <input
                    id="input-chalan-red-rate"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="দর"
                    value={redRateStr}
                    onChange={(e) => setRedRateStr(convertEnToBnDigits(e.target.value, true))}
                    className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                  />
                </div>
              </div>

              <div className="col-span-4 text-right">
                <div className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-200 whitespace-nowrap">
                  = {toBnCurrency(redTotal, useBengali)}
                </div>
              </div>
            </div>
          </div>

          {/* 5. লাইন ২: সাদা ডিম - Compact (মেমোর সাথে হুবহু এক) */}
          <div 
            id="line-box-white-egg"
            className="bg-cyan-50/90 dark:bg-cyan-950/30 border-2 border-cyan-400 dark:border-cyan-800 rounded-xl p-2 space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-cyan-500 shadow-2xs shrink-0" />
                <span className="font-extrabold text-xs text-cyan-950 dark:text-cyan-100">⚪ সাদা ডিম</span>
              </div>
              {whiteHundredRate > 0 ? (
                <span className="text-[11px] text-cyan-900 dark:text-cyan-200 font-black bg-cyan-200/90 dark:bg-cyan-900/60 px-1.5 py-0.2 rounded border border-cyan-400 dark:border-cyan-700">
                  ১০০ পিস: ৳{toBengaliNumber(whiteHundredRate, useBengali)}
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
                    id="input-chalan-white-count"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="পিস"
                    value={whiteCountStr}
                    onChange={(e) => setWhiteCountStr(convertEnToBnDigits(e.target.value, false))}
                    className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                  />
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-400 shrink-0 font-extrabold">টি</span>
                </div>
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-cyan-400 dark:border-cyan-700 px-1.5 py-0.5 sm:py-1 focus-within:border-cyan-600 shadow-2xs">
                  <span className="text-xs font-black text-cyan-700 dark:text-cyan-400 shrink-0">৳</span>
                  <input
                    id="input-chalan-white-rate"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="দর"
                    value={whiteRateStr}
                    onChange={(e) => setWhiteRateStr(convertEnToBnDigits(e.target.value, true))}
                    className="w-full text-center font-black text-xs sm:text-sm bg-transparent text-stone-950 dark:text-stone-50 outline-none"
                  />
                </div>
              </div>

              <div className="col-span-4 text-right">
                <div className="text-xs sm:text-sm font-black text-cyan-950 dark:text-cyan-200 whitespace-nowrap">
                  = {toBnCurrency(whiteTotal, useBengali)}
                </div>
              </div>
            </div>
          </div>

          {/* Optional: Additional egg items if added */}
          {extraItems.map((extraItem) => (
            <div 
              key={extraItem.id} 
              className="p-2 bg-purple-50/90 dark:bg-purple-950/30 rounded-xl border-2 border-purple-300 dark:border-purple-800 space-y-1 shadow-2xs"
            >
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-3 flex items-center gap-1">
                  <select
                    value={extraItem.eggType}
                    onChange={(e) => handleExtraItemChange(extraItem.id, 'eggType', e.target.value)}
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
                      handleExtraItemChange(extraItem.id, 'count', parseBengaliToNumber(bn));
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
                    value={extraItemInputs[extraItem.id]?.rateStr ?? (extraItem.ratePerPiece > 0 ? convertEnToBnDigits(extraItem.ratePerPiece, true) : '')}
                    onChange={(e) => {
                      const bn = convertEnToBnDigits(e.target.value, true);
                      setExtraItemInputs((prev) => ({
                        ...prev,
                        [extraItem.id]: {
                          countStr: prev[extraItem.id]?.countStr ?? '',
                          rateStr: bn,
                        },
                      }));
                      handleExtraItemChange(extraItem.id, 'ratePerPiece', parseBengaliToNumber(bn));
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
                    onClick={() => handleRemoveExtraItem(extraItem.id)}
                    className="text-stone-400 hover:text-rose-500 p-0.5 rounded"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add extra egg button */}
          <div className="flex justify-end px-1">
            <button
              type="button"
              id="btn-add-chalan-egg-item"
              onClick={handleAddExtraItem}
              className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 px-2 py-0.5 rounded flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>+ অন্যান্য ডিম যোগ</span>
            </button>
          </div>

          {/* 6. লাইন ৩: পূর্বের দেনা বাকি - Compact */}
          <div 
            id="line-box-previous-due"
            className="bg-rose-50/90 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/70 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-rose-950 dark:text-rose-200">পূর্বের দেনা বাকি:</span>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1 py-0.2 rounded font-bold">Auto যোগ</span>
            </div>

            <div className="relative">
              <input
                id="input-chalan-previous-due"
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
              <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-1 py-0.2 rounded font-bold">বিল + দেনা</span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-purple-950 dark:text-purple-200">
                {toBnCurrency(totalDemand, useBengali)}
              </span>
            </div>
          </div>

          {/* 8. লাইন ৫: নগদ পরিশোধ - Compact */}
          <div 
            id="line-box-cash-paid"
            className="bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-800/80 rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 shadow-2xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">নগদ পরিশোধ:</span>
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

          {/* 9. লাইন ৬: অবশিষ্ট দেনা বাকি - Compact */}
          <div 
            id="line-box-remaining-due"
            className={`rounded-xl px-2.5 py-1 flex items-center justify-between gap-1 border-2 shadow-2xs ${
              remainingDue > 0
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100'
                : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm">অবশিষ্ট দেনা বাকি:</span>
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
              id="input-chalan-note"
              type="text"
              placeholder="মন্তব্য / গাড়ির নম্বর / চালান নোট (ঐচ্ছিক)"
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
                id="submit-chalan-btn"
                type="submit"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1"
              >
                <span>💾 চালান সেভ ও ভাউচার তৈরি করুন</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
