import React, { useState, useMemo, useEffect } from 'react';
import { Supplier, SupplierChalan, SupplierPayment, ShopProfile } from '../types';
import { 
  toBengaliNumber, 
  toBnCurrency, 
  formatDisplayChalanNumber, 
  compareChalansDesc 
} from '../utils/bengaliUtils';
import { getPartyColorTheme } from '../utils/partyColors';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  X, 
  Phone, 
  MapPin, 
  FileText, 
  Plus, 
  CreditCard, 
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
  MessageSquare,
  Truck
} from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  chalans: SupplierChalan[];
  payments: SupplierPayment[];
  shopProfile?: ShopProfile;
  useBengali: boolean;
  onClose: () => void;
  onOpenNewChalanForSupplier: (supplier: Supplier) => void;
  onOpenPaymentModal: (supplier: Supplier) => void;
  onViewChalanVoucher: (chalan: SupplierChalan) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onDeleteChalan?: (chalanId: string) => void;
  onUpdateSupplier?: (supplierId: string, updatedFields: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  supplier,
  chalans,
  payments,
  shopProfile,
  useBengali,
  onClose,
  onOpenNewChalanForSupplier,
  onOpenPaymentModal,
  onViewChalanVoucher,
  onDeleteSupplier,
  onDeleteChalan,
  onUpdateSupplier,
}) => {
  const [chalanSearchQuery, setChalanSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chalanToDelete, setChalanToDelete] = useState<SupplierChalan | null>(null);

  // Edit supplier details state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(supplier?.name || '');
  const [editPhone, setEditPhone] = useState(supplier?.phone || '');
  const [editLocation, setEditLocation] = useState(supplier?.farmLocation || '');
  const [editNotes, setEditNotes] = useState(supplier?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update edit fields when the supplier changes
  useEffect(() => {
    if (supplier) {
      setEditName(supplier.name);
      setEditPhone(supplier.phone || '');
      setEditLocation(supplier.farmLocation || '');
      setEditNotes(supplier.notes || '');
      setIsEditing(false);
    }
  }, [supplier]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !editName.trim()) return;

    setIsSaving(true);
    if (onUpdateSupplier) {
      onUpdateSupplier(supplier.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        farmLocation: editLocation.trim(),
        notes: editNotes.trim(),
      });
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleShareChalan = (chalan: SupplierChalan, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `চালান নং: ${formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
মহাজন: ${chalan.supplierName}
তারিখ: ${chalan.formattedDate}
ডিম: ${toBengaliNumber(chalan.eggCount || 0, useBengali)} পিস
মোট বিল: ${toBnCurrency(chalan.totalAmount, useBengali)}
নগদ পরিশোধ: ${toBnCurrency(chalan.paidAmount || 0, useBengali)}
দেনা বাকি: ${toBnCurrency(chalan.remainingDue !== undefined ? chalan.remainingDue : chalan.dueAmount, useBengali)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!supplier) return null;

  // Filter all chalans for this specific supplier
  const supplierChalans = useMemo(() => {
    return chalans
      .filter(
        (c) => c.supplierId === supplier.id || (c.supplierName && c.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase())
      )
      .sort(compareChalansDesc);
  }, [chalans, supplier.id, supplier.name]);

  // Search filter within supplier chalans
  const filteredChalans = useMemo(() => {
    return supplierChalans
      .filter((c) => {
        if (!chalanSearchQuery.trim()) return true;
        const q = chalanSearchQuery.toLowerCase().trim();
        return (
          c.chalanNumber.toLowerCase().includes(q) ||
          c.formattedDate.toLowerCase().includes(q) ||
          c.date.includes(q) ||
          Boolean((c.note || c.notes)?.toLowerCase().includes(q))
        );
      })
      .sort(compareChalansDesc);
  }, [supplierChalans, chalanSearchQuery]);

  // Egg Analytics
  const eggAnalytics = useMemo(() => {
    let redCount = 0;
    let whiteCount = 0;
    let otherCount = 0;

    supplierChalans.forEach((chalan) => {
      redCount += chalan.redEggCount || 0;
      whiteCount += chalan.whiteEggCount || 0;
      if (!chalan.redEggCount && !chalan.whiteEggCount && chalan.eggCount) {
        otherCount += chalan.eggCount;
      }
    });

    const totalEggs = redCount + whiteCount + otherCount;
    const totalKhachi = Math.floor(totalEggs / 30);
    const extraEggs = totalEggs % 30;

    return {
      redCount,
      whiteCount,
      otherCount,
      totalEggs,
      totalKhachi,
      extraEggs,
    };
  }, [supplierChalans]);

  const totalLifetimeBilled = supplierChalans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalLifetimePaid = supplierChalans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const hasDue = supplier.totalPayable > 0;
  const isAdvance = supplier.totalPayable < 0;

  const theme = getPartyColorTheme(supplier.name, supplier.id);

  return (
    <div 
      id="supplier-details-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="supplier-details-card"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
      >
        {/* Color accent strip (পার্টির খাতার মতো হুবহু সেম) */}
        <div className={`h-2 w-full bg-gradient-to-r ${theme.headerBar}`}></div>

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-750">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
              <span>🚚</span>
              <span>খতিয়ান ও চালান খাতা (মহাজন লেজার)</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onUpdateSupplier && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                title="মহাজনের তথ্য সংশোধন করুন"
                className={`p-1.5 rounded-lg transition ${
                  isEditing 
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' 
                    : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDeleteSupplier && !supplier.id.startsWith('temp-') && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="মহাজন ডিলিট করুন"
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
          {/* 1. Supplier Primary Profile Card (পার্টির প্রোফাইলের মতো হুবহু সেম) */}
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border-2 border-l-[6px] ${theme.borderLeft} ${theme.border} space-y-2.5 shadow-xs`}>
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <h3 className="font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm flex items-center gap-1.5 border-b border-indigo-200/40 dark:border-slate-800 pb-1.5">
                  <span>📝</span>
                  <span>মহাজনের তথ্য সংশোধন খাতা</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      মহাজনের নাম (আবশ্যিক)
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="যেমন: হাজী মকবুল"
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
                      খামার / আড়ত এলাকা
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="যেমন: টাঙ্গাইল খামার"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      অতিরিক্ত নোট / বিবরণ
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="মন্তব্য বা অন্যান্য তথ্য..."
                    />
                  </div>
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
                    {supplier.name.trim().charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                        {supplier.name}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-lg font-black border bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
                        {supplier.farmLocation || 'মহাজন'}
                      </span>
                    </div>

                    {(supplier.farmLocation || supplier.notes) && (
                      <div className="space-y-0.5 mt-1 text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {supplier.farmLocation && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{supplier.farmLocation}</span>
                          </p>
                        )}
                        {supplier.notes && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                            নোট: {supplier.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Outstanding Due Badge - Auto Added Result */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block leading-none">
                    {isAdvance ? 'অগ্রিম জমা' : 'বর্তমান দেনা বাকি'}
                  </span>
                  <div
                    className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl shadow-xs mt-1 tabular-nums ${
                      isAdvance
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                        : hasDue
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                    }`}
                  >
                    {isAdvance ? `অগ্রিম: ${toBnCurrency(Math.abs(supplier.totalPayable), useBengali)}` : hasDue ? toBnCurrency(supplier.totalPayable, useBengali) : 'পরিশোধিত'}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Contact & Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-800">
                {supplier.phone ? (
                  <>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 text-xs sm:text-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>কল করুন ({supplier.phone})</span>
                    </a>
                    <a
                      href={`sms:${supplier.phone}`}
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

          {/* 2. Action Buttons (New Chalan & Payment) - On Top (হুবহু পার্টির মেমোর মতো সেইম) */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewChalanForSupplier(supplier);
              }}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ নতুন চালান দিন</span>
            </button>

            {hasDue && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(supplier);
                }}
                className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>পেমেন্ট পরিশোধ</span>
              </button>
            )}
          </div>

          {/* 3. Compact Financials Summary Strip */}
          <div className="grid grid-cols-3 gap-1.5 text-center p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">মোট ক্রয়</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                {toBnCurrency(totalLifetimeBilled, useBengali)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">মোট পরিশোধ</span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {toBnCurrency(totalLifetimePaid, useBengali)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">বর্তমান দেনা</span>
              <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300 tabular-nums">
                {toBnCurrency(supplier.totalPayable, useBengali)}
              </span>
            </div>
          </div>

          {/* 4. Section: খতিয়ান ভিউ সিলেক্টর ও চালানের তালিকা */}
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                  চালান ও খতিয়ান তালিকা ({toBengaliNumber(supplierChalans.length, useBengali)} টি)
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
                  <span>কার্ড ভিউ</span>
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
                  <span>খতিয়ান টেবিল</span>
                </button>
              </div>
            </div>

            {/* Search Input for Chalans */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={chalanSearchQuery}
                onChange={(e) => setChalanSearchQuery(e.target.value)}
                placeholder="চালান নম্বর, তারিখ বা নোট দিয়ে খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* List Content */}
            {filteredChalans.length === 0 ? (
              <div className="bg-stone-50 dark:bg-stone-850 p-6 rounded-2xl text-center text-stone-500 dark:text-stone-400 text-xs border border-stone-200 dark:border-stone-750 font-bold">
                {chalanSearchQuery ? 'কোনো চালান পাওয়া যায়নি' : 'এখনো কোনো চালান তৈরি করা হয়নি'}
              </div>
            ) : viewMode === 'ledger' ? (
              /* Ledger Table View (হুবহু পার্টির মেমোর টেবিল ভিউয়ের মতো সেইম) */
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-xs text-left border-collapse bg-white dark:bg-stone-900">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-black border-b border-stone-200 dark:border-stone-700">
                      <th className="p-2 text-center">চালান নং</th>
                      <th className="p-2">তারিখ</th>
                      <th className="p-2 text-center">মোট ডিম</th>
                      <th className="p-2 text-right">মোট বিল</th>
                      <th className="p-2 text-right">পরিশোধ</th>
                      <th className="p-2 text-right">দেনা বাকি</th>
                      <th className="p-2 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-bold">
                    {filteredChalans.map((chalan) => {
                      const remainingDue = chalan.remainingDue !== undefined ? chalan.remainingDue : chalan.dueAmount;
                      return (
                        <tr 
                          key={chalan.id} 
                          onClick={() => onViewChalanVoucher(chalan)}
                          className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition"
                        >
                          <td className="p-2 text-center font-mono font-black text-indigo-700 dark:text-indigo-400">
                            {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
                          </td>
                          <td className="p-2 whitespace-nowrap text-stone-600 dark:text-stone-400">
                            {chalan.formattedDate}
                          </td>
                          <td className="p-2 text-center font-black tabular-nums">
                            {toBengaliNumber(chalan.eggCount || 0, useBengali)} পিস
                          </td>
                          <td className="p-2 text-right font-black tabular-nums text-stone-900 dark:text-white">
                            {toBnCurrency(chalan.totalAmount, useBengali)}
                          </td>
                          <td className="p-2 text-right font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                            {toBnCurrency(chalan.paidAmount || 0, useBengali)}
                          </td>
                          <td className="p-2 text-right font-black tabular-nums">
                            <span className={remainingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {remainingDue > 0 ? toBnCurrency(remainingDue, useBengali) : 'পরিশোধ'}
                            </span>
                          </td>
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onViewChalanVoucher(chalan)}
                                title="ভাউচার স্লিপ দেখুন"
                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-indigo-600 dark:text-indigo-400"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleShareChalan(chalan, e)}
                                title="হোয়াটসঅ্যাপে শেয়ার"
                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-emerald-600 dark:text-emerald-400"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Cards View (হুবহু পার্টির মেমোর কার্ড ভিউয়ের মতো সেইম ডিজাইন) */
              <div className="space-y-2">
                {filteredChalans.map((chalan) => {
                  const remainingDue = chalan.remainingDue !== undefined ? chalan.remainingDue : chalan.dueAmount;
                  const isPaid = remainingDue <= 0;

                  return (
                    <div
                      key={chalan.id}
                      onClick={() => onViewChalanVoucher(chalan)}
                      className={`bg-white dark:bg-stone-900 border-2 rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2 ${
                        isPaid
                          ? 'border-emerald-200 dark:border-emerald-900/60'
                          : 'border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      {/* Top Row: Chalan Number & Date */}
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs sm:text-sm bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400">
                            {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
                          </span>
                          <span className={`text-[10.5px] px-1.5 py-0.2 rounded font-black border ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                              : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700'
                          }`}>
                            {isPaid ? 'পরিশোধিত' : 'দেনা বাকি'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                          <CalendarTodayIcon className="w-3 h-3 text-sky-600" />
                          <span>{chalan.formattedDate}</span>
                        </div>
                      </div>

                      {/* Middle: Items summary */}
                      <div className="space-y-1 text-xs">
                        {chalan.redEggCount && chalan.redEggCount > 0 ? (
                          <div className="flex items-center justify-between font-bold bg-rose-50/70 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200">
                            <span>🔴 লাল ডিম: {toBengaliNumber(chalan.redEggCount, useBengali)} পিস ({toBengaliNumber(chalan.redRatePerHundred || Math.round((chalan.redRatePerPiece || 0) * 100), useBengali)} ৳/১০০)</span>
                            <span className="font-black tabular-nums">{toBnCurrency(chalan.redTotalAmount || 0, useBengali)}</span>
                          </div>
                        ) : null}

                        {chalan.whiteEggCount && chalan.whiteEggCount > 0 ? (
                          <div className="flex items-center justify-between font-bold bg-cyan-50/70 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200">
                            <span>⚪ সাদা ডিম: {toBengaliNumber(chalan.whiteEggCount, useBengali)} পিস ({toBengaliNumber(chalan.whiteRatePerHundred || Math.round((chalan.whiteRatePerPiece || 0) * 100), useBengali)} ৳/১০০)</span>
                            <span className="font-black tabular-nums">{toBnCurrency(chalan.whiteTotalAmount || 0, useBengali)}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Bottom Financial Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800 text-xs">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-stone-600 dark:text-stone-400 font-bold">
                            মোট দাবি: <strong className="text-stone-900 dark:text-white font-black">{toBnCurrency(chalan.totalDemand, useBengali)}</strong>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap font-bold text-[10.5px]">
                            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                              পরিশোধ: {toBnCurrency(chalan.paidAmount || 0, useBengali)}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded border ${
                              remainingDue > 0
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {remainingDue > 0 ? `বাকি: ${toBnCurrency(remainingDue, useBengali)}` : '✓ সম্পূর্ণ পরিশোধ'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons inside card */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onViewChalanVoucher(chalan)}
                            title="চালান স্লিপ দেখুন"
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 transition active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleShareChalan(chalan, e)}
                            title="শেয়ার করুন"
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteChalan && (
                            <button
                              type="button"
                              onClick={() => setChalanToDelete(chalan)}
                              title="চালান ডিলিট করুন"
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 transition active:scale-95 shadow-2xs"
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
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        type="supplier"
        supplier={supplier}
        useBengali={useBengali}
        onConfirm={() => {
          if (onDeleteSupplier && supplier) {
            onDeleteSupplier(supplier.id);
          }
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(chalanToDelete)}
        type="chalan"
        chalan={chalanToDelete}
        useBengali={useBengali}
        onConfirm={() => {
          if (onDeleteChalan && chalanToDelete) {
            onDeleteChalan(chalanToDelete.id);
          }
          setChalanToDelete(null);
        }}
        onCancel={() => setChalanToDelete(null)}
      />
    </div>
  );
};
