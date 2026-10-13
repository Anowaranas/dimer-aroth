import React, { useState } from 'react';
import { Supplier, SupplierChalan, SupplierPayment, PaymentMethod } from '../types';
import { 
  toBengaliNumber, 
  toBnCurrency, 
  formatDisplayChalanNumber, 
  compareChalansDesc, 
  compareSuppliersByRecentActivity,
  getTodayDateInputValue,
  formatTypingNumber,
  convertEnToBnDigits,
  parseBengaliToNumber
} from '../utils/bengaliUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import { hapticCancel, hapticDelete } from '../utils/haptics';
import { AnimatedSearchBox } from './AnimatedSearchBox';

export interface SuppliersViewProps {
  suppliers: Supplier[];
  chalans: SupplierChalan[];
  payments?: SupplierPayment[];
  useBengali: boolean;
  onSelectSupplierForChalan: (supplier: Supplier) => void;
  onOpenPaymentModal?: (supplier: Supplier) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onViewChalanVoucher: (chalan: SupplierChalan) => void;
  onOpenSupplierDetails: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplierId: string, updatedFields: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
  onAddSupplierPayment?: (payment: SupplierPayment) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  chalans,
  payments = [],
  useBengali,
  onSelectSupplierForChalan,
  onOpenPaymentModal,
  onAddSupplier,
  onDeleteSupplier,
  onViewChalanVoucher,
  onOpenSupplierDetails,
  onUpdateSupplier,
  onAddSupplierPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Quick Payment Modal State
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('নগদ ক্যাশ');
  const [payDate, setPayDate] = useState(getTodayDateInputValue());
  const [payNote, setPayNote] = useState('');

  // New Supplier Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newInitialDue, setNewInitialDue] = useState<number>(0);
  const [newInitialDueStr, setNewInitialDueStr] = useState<string>('');

  const totalDueAmount = React.useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPayable > 0 ? s.totalPayable : 0), 0);
  }, [suppliers]);

  const suppliersWithDue = React.useMemo(() => {
    return suppliers.filter((s) => (s.totalPayable || 0) > 0);
  }, [suppliers]);

  const filteredSuppliers = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [...suppliers].sort((a, b) => compareSuppliersByRecentActivity(a, b, chalans));
    }
    return suppliers
      .filter((s) => {
        const matchName = s.name.toLowerCase().includes(term);
        const matchPhone = s.phone && s.phone.includes(term);
        const matchLocation = s.farmLocation && s.farmLocation.toLowerCase().includes(term);
        return matchName || matchPhone || matchLocation;
      })
      .sort((a, b) => compareSuppliersByRecentActivity(a, b, chalans));
  }, [suppliers, searchTerm, chalans]);

  const handleAddNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddSupplier({
      name: newName.trim(),
      phone: newPhone.trim(),
      farmLocation: newLocation.trim() || undefined,
      address: newAddress.trim() || undefined,
      totalPayable: Number(newInitialDue) || 0,
      totalPurchased: Number(newInitialDue) || 0,
      totalPaid: 0,
      notes: '',
    });

    setNewName('');
    setNewPhone('');
    setNewLocation('');
    setNewAddress('');
    setNewInitialDue(0);
    setNewInitialDueStr('');
    setShowAddSupplierModal(false);
  };

  const handleOpenPayment = (sup: Supplier) => {
    if (onOpenPaymentModal) {
      onOpenPaymentModal(sup);
    } else {
      setPaymentSupplier(sup);
      setPayAmountStr(sup.totalPayable > 0 ? formatTypingNumber(sup.totalPayable, false, useBengali) : '');
      setPayMethod('নগদ ক্যাশ');
      setPayDate(getTodayDateInputValue());
      setPayNote('');
    }
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSupplier) return;
    const amount = parseBengaliToNumber(payAmountStr);
    if (!amount || amount <= 0) {
      alert('সঠিক পরিশোধের টাকার পরিমাণ লিখুন');
      return;
    }

    if (onAddSupplierPayment) {
      const payment: SupplierPayment = {
        id: `spay-${Date.now()}`,
        supplierId: paymentSupplier.id,
        supplierName: paymentSupplier.name,
        amount: amount,
        date: payDate,
        method: payMethod,
        note: payNote.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddSupplierPayment(payment);
    }

    setPaymentSupplier(null);
    setPayAmountStr('');
    setPayNote('');
  };

  return (
    <div id="suppliers-view-container" className="space-y-2.5 pb-16">

      {/* Action Bar with AnimatedSearchBox & "+ নতুন মহাজন" Button */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          <AnimatedSearchBox
            id="search-supplier-box"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="মহাজনের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            buttonText="খুঁজুন"
            compact={true}
            resultsCount={filteredSuppliers.length}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddSupplierModal(true)}
          className="text-xs font-black soft-btn-purple px-3.5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
        >
          <AddRoundedIcon className="w-4 h-4" />
          <span>নতুন মহাজন</span>
        </button>
      </div>

      {/* 3. Suppliers List - Responsive 1 column on phones, 2 columns on tablets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {filteredSuppliers.map((sup) => {
          const isExpanded = expandedSupplierId === sup.id;
          const hasDue = (sup.totalPayable || 0) > 0;
          const isAdvance = (sup.totalPayable || 0) < 0;
          const supChalans = chalans
            .filter((c) => c.supplierId === sup.id || (c.supplierName && sup.name && c.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase()))
            .sort(compareChalansDesc);
          const theme = getPartyColorTheme(sup.name, sup.id);

          const totalEggs = supChalans.reduce((sum, c) => sum + (c.eggCount || 0), 0);

          return (
            <div
              key={sup.id}
              className={`glass-card rounded-2xl p-3 border shadow-xs hover:shadow-md transition-all space-y-2.5 border-l-4 ${theme.borderLeft} ${theme.border} relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-500 via-orange-400 to-rose-600 pointer-events-none" />
              {/* Top Row: Avatar & Supplier Name, Location Badge, Due Badge */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div 
                    onClick={() => onOpenSupplierDetails(sup)}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-xs shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0`}
                    title="এই মহাজনের সমস্ত চালান ও খতিয়ান দেখুন"
                  >
                    {sup.name.trim().charAt(0)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSupplierDetails(sup)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold transition-all text-left shadow-2xs hover:scale-[1.01] active:scale-95 ${theme.nameBadge}`}
                    title="ক্লিক করে এই মহাজনের খতিয়ান ও হিসাব দেখুন"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{sup.name}</span>
                    <ArrowOutwardRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </button>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold border shrink-0 bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700">
                    {sup.farmLocation || 'মহাজন'}
                  </span>
                </div>

                {/* Right side: Due / Advance Badge */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className={`text-[10.5px] px-2 py-0.5 rounded-lg font-bold border whitespace-nowrap ${
                    isAdvance
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-300'
                      : hasDue
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {isAdvance 
                      ? `অগ্রিম: ${toBnCurrency(Math.abs(sup.totalPayable), useBengali)}` 
                      : hasDue 
                      ? `দেনা: ${toBnCurrency(sup.totalPayable, useBengali)}` 
                      : '✓ পরিশোধিত'}
                  </span>
                </div>
              </div>

              {/* Middle Row: Phone and Total Egg Supplied */}
              <div className="flex items-center justify-between text-xs font-medium px-2.5 py-1.5 rounded-xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                  {sup.phone ? (
                    <a href={`tel:${sup.phone}`} className="hover:text-blue-600 flex items-center gap-1 font-semibold text-[11px]">
                      <PhoneRoundedIcon style={{ fontSize: '13px' }} className="text-blue-600" />
                      <span>{sup.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">মোবাইল নেই</span>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white shrink-0 ml-1.5">
                  🥚 সরবরাহ: {toBengaliNumber(totalEggs, useBengali)} পিস
                </span>
              </div>

              {/* Bottom Row: Financials and Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 flex-wrap text-xs min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenSupplierDetails(sup)}
                    className="text-[10.5px] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition shadow-2xs"
                  >
                    <ReceiptLongRoundedIcon style={{ fontSize: '12px' }} />
                    <span>খতিয়ান ({toBengaliNumber(supChalans.length, useBengali)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedSupplierId(isExpanded ? null : sup.id)}
                    className="text-[10.5px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded transition font-bold"
                  >
                    <span>{isExpanded ? 'সংক্ষিপ্ত' : 'বিস্তারিত'}</span>
                  </button>
                </div>

                {/* Compact Action Icons */}
                <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    title="নতুন চালান"
                    onClick={() => onSelectSupplierForChalan(sup)}
                    className="w-7 h-7 rounded-lg border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-teal-100 active:scale-90 transition shadow-2xs cursor-pointer"
                  >
                    <AddRoundedIcon style={{ fontSize: '15px' }} />
                  </button>
                  {hasDue && (
                    <button
                      title="পরিশোধ / জমা"
                      onClick={() => handleOpenPayment(sup)}
                      className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition shadow-2xs cursor-pointer"
                    >
                      <PaymentRoundedIcon style={{ fontSize: '15px' }} />
                    </button>
                  )}
                  <button
                    title="মহাজন মুছে ফেলুন"
                    type="button"
                    onClick={() => {
                      hapticCancel();
                      setSupplierToDelete(sup);
                    }}
                    className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 active:scale-90 transition shadow-2xs cursor-pointer"
                  >
                    <DeleteOutlineRoundedIcon style={{ fontSize: '15px' }} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs sm:text-sm flex-wrap gap-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">খামার / এলাকা: </span>
                      <span className="font-bold text-slate-950 dark:text-white">{sup.farmLocation || 'মহাজন'}</span>
                      {sup.address && (
                        <span className="text-slate-600 dark:text-slate-400 ml-2 font-medium">• 📍 {sup.address}</span>
                      )}
                    </div>

                    {(() => {
                      let red = 0;
                      let white = 0;
                      supChalans.forEach((c) => {
                        red += c.redEggCount || 0;
                        white += c.whiteEggCount || 0;
                      });
                      if (red > 0 || white > 0) {
                        return (
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 space-x-2">
                            {red > 0 && <span className="text-rose-700 dark:text-rose-400 font-bold">লাল: {toBengaliNumber(red, useBengali)} পিস</span>}
                            {white > 0 && <span className="text-blue-700 dark:text-blue-400 font-bold">সাদা: {toBengaliNumber(white, useBengali)} পিস</span>}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Action buttons inside expanded row - Sleek & Balanced */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectSupplierForChalan(sup)}
                      className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                    >
                      <AddRoundedIcon className="w-3.5 h-3.5" />
                      <span>নতুন চালান</span>
                    </button>
                    {hasDue && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(sup)}
                        className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                      >
                        <PaymentRoundedIcon className="w-3.5 h-3.5" />
                        <span>পরিশোধ / জমা</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSupplierToDelete(sup)}
                      className="py-1.5 px-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition active:scale-95"
                      title="এই মহাজনকে মুছে ফেলুন"
                    >
                      <DeleteOutlineRoundedIcon className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  {/* All chalans trigger button */}
                  <button
                    type="button"
                    onClick={() => onOpenSupplierDetails(sup)}
                    className="w-full py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                  >
                    <ReceiptLongRoundedIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>খতিয়ান ও চালান খাতা দেখুন ({toBengaliNumber(supChalans.length, useBengali)} টি চালান)</span>
                    <ArrowOutwardRoundedIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous chalans by this supplier (হুবহু পার্টি খাতার মতো সেইম) */}
                  {supChalans.length > 0 && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-750 space-y-1.5">
                      <p className="font-bold text-stone-800 dark:text-stone-200 text-xs sm:text-sm">সাম্প্রতিক চালানসমূহ (ডিমের পিস ও বিল):</p>
                      {supChalans.slice(0, 3).map((c) => {
                        const remainingDue = c.remainingDue !== undefined ? c.remainingDue : c.dueAmount;
                        return (
                          <div
                            key={c.id}
                            onClick={() => onViewChalanVoucher(c)}
                            className="bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition text-xs sm:text-sm"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <ReceiptLongRoundedIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                                <span className="font-mono font-black text-stone-900 dark:text-stone-100">{formatDisplayChalanNumber(c.chalanNumber, useBengali)}</span>
                                <span className="text-stone-500 dark:text-stone-400 text-xs">({c.formattedDate})</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-stone-900 dark:text-stone-100">{toBnCurrency(c.totalAmount, useBengali)}</span>
                                {remainingDue > 0 ? (
                                  <span className="text-xs text-rose-600 dark:text-rose-400 ml-1.5 font-bold">
                                    (দেনা: {toBnCurrency(remainingDue, useBengali)})
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                                    (পরিশোধ)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Egg items with rates and total in distinct clear boxes */}
                            <div className="space-y-1 pt-1.5 border-t border-stone-100 dark:border-stone-700 text-xs">
                              {c.redEggCount && c.redEggCount > 0 ? (
                                <div className="flex items-center justify-between px-2 py-1 rounded-lg border font-bold text-xs bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-2xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-extrabold text-xs">
                                      🔴 লাল ডিম: <span className="underline decoration-dotted">{toBengaliNumber(c.redEggCount, useBengali)} পিস</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-stone-900/80 border border-rose-250 dark:border-rose-800">
                                      ৳{toBengaliNumber(c.redRatePerHundred || Math.round((c.redRatePerPiece || 0) * 100), useBengali)}/শ
                                    </span>
                                    <span className="font-black tabular-nums">
                                      = {toBnCurrency(c.redTotalAmount || 0, useBengali)}
                                    </span>
                                  </div>
                                </div>
                              ) : null}

                              {c.whiteEggCount && c.whiteEggCount > 0 ? (
                                <div className="flex items-center justify-between px-2 py-1 rounded-lg border font-bold text-xs bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100 shadow-2xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-extrabold text-xs">
                                      ⚪ সাদা ডিম: <span className="underline decoration-dotted">{toBengaliNumber(c.whiteEggCount, useBengali)} পিস</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-stone-900/80 border border-cyan-250 dark:border-cyan-800">
                                      ৳{toBengaliNumber(c.whiteRatePerHundred || Math.round((c.whiteRatePerPiece || 0) * 100), useBengali)}/শ
                                    </span>
                                    <span className="font-black tabular-nums">
                                      = {toBnCurrency(c.whiteTotalAmount || 0, useBengali)}
                                    </span>
                                  </div>
                                </div>
                              ) : null}

                              {/* Calculation strip: মোট ডিমের বিল, পূর্বের দেনা, মোট দাবি, নগদ পরিশোধ, বর্তমান দেনা */}
                              <div className="space-y-1 pt-1 border-t border-stone-200/80 dark:border-stone-700/80">
                                {/* আজকের মোট বিল */}
                                <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-stone-900 dark:text-stone-200 border border-slate-200 dark:border-slate-700">
                                  <span>আজকের মোট বিল:</span>
                                  <span className="font-black tabular-nums">{toBnCurrency(c.totalAmount, useBengali)}</span>
                                </div>

                                {/* সাবেক দেনা */}
                                <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  <span>সাবেক দেনা (পূর্বের জের):</span>
                                  <span className="font-black tabular-nums">+{(c.previousDue || 0) > 0 ? toBnCurrency(c.previousDue || 0, useBengali) : '০ ৳'}</span>
                                </div>

                                {/* সর্বমোট দাবি */}
                                <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-purple-50/80 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                  <span>সর্বমোট দাবি:</span>
                                  <span className="font-black tabular-nums">{toBnCurrency(c.totalDemand || c.totalAmount, useBengali)}</span>
                                </div>

                                {/* নগদ পরিশোধ */}
                                <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                  <span>নগদ পরিশোধ (জমা):</span>
                                  <span className="font-black tabular-nums">-{(c.paidAmount || 0) > 0 ? toBnCurrency(c.paidAmount || 0, useBengali) : '০ ৳'}</span>
                                </div>

                                {/* অবশিষ্ট দেনা */}
                                <div className={`flex items-center justify-between text-xs font-black px-2 py-1 rounded-lg border-2 ${
                                  remainingDue > 0
                                    ? 'bg-rose-100/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200'
                                    : 'bg-emerald-100/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                                }`}>
                                  <span>অবশিষ্ট দেনা (জের):</span>
                                  <span className="tabular-nums">{remainingDue > 0 ? toBnCurrency(remainingDue, useBengali) : '০ ৳ (পরিশোধ)'}</span>
                                </div>
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
          );
        })}
      </div>

      {/* Add Supplier Modal - Material Design 3 Dialog */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md">
          <div className="material-card w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  <LocalShippingRoundedIcon className="w-5 h-5" />
                </span>
                <span>নতুন মহাজন যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <CloseRoundedIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewSupplier} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">মহাজনের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজী মকবুল"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="০১৭০০-০০০০০০"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">খামার / এলাকা</label>
                  <input
                    type="text"
                    placeholder="যেমন: টাঙ্গাইল"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: আড়ত নং ৫, ঢাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">পূর্বের কোনো দেনা বাকি থাকলে (টাকা)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newInitialDueStr}
                  onChange={(e) => {
                    const formatted = formatTypingNumber(e.target.value, false, useBengali);
                    setNewInitialDueStr(formatted);
                    setNewInitialDue(parseBengaliToNumber(formatted));
                  }}
                  placeholder="০"
                  className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold tabular-nums transition"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation Modal (হুবহু ConfirmDeleteModal এর মতো) */}
      <ConfirmDeleteModal
        isOpen={!!supplierToDelete}
        type="supplier"
        supplier={supplierToDelete}
        memosCount={supplierToDelete ? chalans.filter((c) => c.supplierId === supplierToDelete.id).length : 0}
        useBengali={useBengali}
        onConfirm={() => {
          if (supplierToDelete) {
            onDeleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
          }
        }}
        onCancel={() => setSupplierToDelete(null)}
      />

      {/* Quick Supplier Payment Modal - Material Design 3 Dialog */}
      {paymentSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md">
          <div className="material-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  <PaymentRoundedIcon className="w-5 h-5" />
                </span>
                <span>মহাজন দেনা পরিশোধ / জমা</span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentSupplier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <CloseRoundedIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold space-y-1">
                <div className="flex justify-between items-center text-emerald-950 dark:text-emerald-100">
                  <span>মহাজনের নাম:</span>
                  <span className="font-bold">{paymentSupplier.name}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
                  <span>বর্তমান দেনা বাকি:</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    {toBnCurrency(paymentSupplier.totalPayable, useBengali)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    পরিশোধের টাকার পরিমাণ (৳) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="০"
                    value={payAmountStr}
                    onChange={(e) => setPayAmountStr(formatTypingNumber(e.target.value, false, useBengali))}
                    className="w-full text-base font-bold border-2 border-emerald-500 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 tabular-nums transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">তারিখ</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">পেমেন্ট মাধ্যম</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="নগদ ক্যাশ">নগদ ক্যাশ</option>
                      <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
                      <option value="বিকাশ">বিকাশ</option>
                      <option value="রকেট">রকেট</option>
                      <option value="নগদ">নগদ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">মন্তব্য / নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ব্যাংক চেক নং..."
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentSupplier(null)}
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
                  >
                    পরিশোধ নিশ্চিত করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
