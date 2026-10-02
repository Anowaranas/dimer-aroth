import React from 'react';
import { Memo, Party, Supplier, SupplierChalan } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber, formatDisplayChalanNumber } from '../utils/bengaliUtils';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  type: 'memo' | 'party' | 'supplier' | 'chalan';
  memo?: Memo | null;
  party?: Party | null;
  supplier?: Supplier | null;
  chalan?: SupplierChalan | null;
  memosCount?: number;
  useBengali: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  type,
  memo,
  party,
  supplier,
  chalan,
  memosCount = 0,
  useBengali,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const modalTitle = 
    type === 'memo' ? 'মেমো মুছে ফেলতে চান?' :
    type === 'party' ? 'পার্টি মুছে ফেলতে চান?' :
    type === 'chalan' ? 'চালান মেমো মুছে ফেলতে চান?' :
    'মহাজন মুছে ফেলতে চান?';

  return (
    <div
      id="confirm-delete-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        id="confirm-delete-modal-card"
        className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 max-w-sm w-full shadow-2xl border border-rose-250 dark:border-rose-900/80 animate-in zoom-in-95 duration-150 space-y-3.5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          aria-label="বন্ধ করুন"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 shadow-xs">
            <WarningIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
              স্থায়ীভাবে মুছে ফেলা সতর্কতা
            </span>
            <h3 className="text-base font-black text-stone-950 dark:text-stone-50 leading-tight mt-0.5">
              {modalTitle}
            </h3>
          </div>
        </div>

        {/* CONTENT FOR MEMO DELETION */}
        {type === 'memo' && memo && (
          <div className="space-y-2.5">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
              আপনি কি নিশ্চিত যে নিচের মেমোটি স্থায়ীভাবে ডিলিট করতে চান?
            </p>

            {/* Memo Details Card */}
            <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-750 text-xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-750 font-bold">
                <div className="flex items-center gap-1.5">
                  <DescriptionIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-mono font-black text-stone-950 dark:text-stone-100">
                    {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {memo.formattedDate}
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>খরিদ্দার / Partei:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {memo.partyName} ({memo.partyType})
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>মোট ডিম:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {toBengaliNumber(memo.totalEggs, useBengali)} পিস
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>মোট বিক্রয় বিল:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {toBnCurrency(memo.totalBill, useBengali)}
                </span>
              </div>

              {memo.cashPaid > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>নগদ জমা:</span>
                  <span>{toBnCurrency(memo.cashPaid, useBengali)}</span>
                </div>
              )}

              {memo.remainingDue > 0 && (
                <div className="flex justify-between text-rose-700 dark:text-rose-400 font-bold border-t border-dashed border-stone-300 dark:border-stone-700 pt-1">
                  <span>বাকি সমন্বয় হবে:</span>
                  <span>-{toBnCurrency(memo.remainingDue, useBengali)}</span>
                </div>
              )}
            </div>

            {/* Crucial Consequence Warning */}
            <div className="bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-rose-900 dark:text-rose-200">
                <ShieldIcon className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>হিসাব সমন্বয় ও তথ্য হারানোর সতর্কতা:</span>
              </div>
              <p className="leading-snug">
                এই মেমোটি মুছলে খরিদ্দারের বাকি খাতা থেকে উক্ত বকেয়া হ্রাস করা হবে এবং মেমোর বিস্তারিত চিরতরে মুছে যাবে।
              </p>
            </div>
          </div>
        )}

        {/* CONTENT FOR PARTY DELETION */}
        {type === 'party' && party && (
          <div className="space-y-2.5">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
              আপনি কি নিশ্চিত যে খরিদ্দার <strong className="text-stone-950 dark:text-stone-50 font-bold">"{party.name}"</strong> কে খাতা থেকে চিরতরে মুছে ফেলতে চান?
            </p>

            {/* Party Details Card */}
            <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-750 text-xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-750 font-bold">
                <div className="flex items-center gap-1.5">
                  <PersonIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-stone-950 dark:text-stone-100">{party.name}</span>
                </div>
                <span className="text-[10px] bg-stone-200 dark:bg-stone-700 px-1.5 py-0.2 rounded font-bold">
                  {party.type}
                </span>
              </div>

              {party.phone && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>মোবাইল নম্বর:</span>
                  <span className="font-semibold text-stone-950 dark:text-stone-100">{party.phone}</span>
                </div>
              )}

              {party.address && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>ঠিকানা:</span>
                  <span className="font-semibold text-stone-950 dark:text-stone-100">{party.address}</span>
                </div>
              )}

              {memosCount > 0 && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>মোট মেমো লেনদেন:</span>
                  <span className="font-black text-stone-950 dark:text-stone-100">
                    {toBengaliNumber(memosCount, useBengali)} টি
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-stone-200 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">বর্তমান বকেয়া পাওনা:</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                  party.currentDue > 0
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {toBnCurrency(party.currentDue, useBengali)}
                </span>
              </div>
            </div>

            {/* Prominent High-Risk Due Warning */}
            {party.currentDue > 0 ? (
              <div className="bg-rose-50 dark:bg-rose-950/70 p-3 rounded-2xl border-2 border-rose-400 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-rose-950 dark:text-rose-100 text-xs">
                  <ErrorIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>সতর্কবার্তা: পাওনা টাকা নষ্ট হওয়ার ঝুঁকি!</span>
                </div>
                <p className="leading-snug">
                  এই পার্টির কাছে এখনো <strong className="underline decoration-rose-500 underline-offset-2">{toBnCurrency(party.currentDue, useBengali)}</strong> টাকা বাকি রয়েছে। পার্টি মুছে দিলে এই পাওনার রেকর্ড সম্পূর্ণ হারিয়ে যাবে!
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                পার্টি মুছে দিলে তালিকা থেকে খরিদ্দারের নাম সরিয়ে দেওয়া হবে।
              </div>
            )}
          </div>
        )}

        {/* CONTENT FOR CHALAN DELETION */}
        {type === 'chalan' && chalan && (
          <div className="space-y-2.5">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
              আপনি কি নিশ্চিত যে নিচের চালান মেমোটি ডিলিট করতে চান?
            </p>

            <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-750 text-xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-750 font-bold">
                <div className="flex items-center gap-1.5">
                  <ReceiptIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-mono font-black text-stone-950 dark:text-stone-100">
                    {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {chalan.formattedDate}
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>মহাজন / খামারি:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {chalan.supplierName}
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>মোট ডিম:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {toBengaliNumber(chalan.eggCount, useBengali)} পিস
                </span>
              </div>

              <div className="flex justify-between text-stone-700 dark:text-stone-300">
                <span>চালানের বিল:</span>
                <span className="font-black text-stone-950 dark:text-stone-100">
                  {toBnCurrency(chalan.totalAmount, useBengali)}
                </span>
              </div>

              {chalan.paidAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>নগদ পরিশোধ:</span>
                  <span>{toBnCurrency(chalan.paidAmount, useBengali)}</span>
                </div>
              )}
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-rose-900 dark:text-rose-200">
                <ShieldIcon className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>হিসাব সমন্বয় ও চালান বাতিলের সতর্কতা:</span>
              </div>
              <p className="leading-snug">
                চালানটি মুছলে মহাজনের দেনা খাতা থেকে এই বিলের হিসাব প্রত্যাহার করা হবে এবং চালানের তথ্য মুছে যাবে।
              </p>
            </div>
          </div>
        )}

        {/* CONTENT FOR SUPPLIER DELETION */}
        {type === 'supplier' && supplier && (
          <div className="space-y-2.5">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
              আপনি কি নিশ্চিত যে মহাজন <strong className="text-stone-950 dark:text-stone-50 font-bold">"{supplier.name}"</strong> কে খাতা থেকে চিরতরে মুছে ফেলতে চান?
            </p>

            <div className="bg-stone-50 dark:bg-stone-850 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-750 text-xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-750 font-bold">
                <div className="flex items-center gap-1.5">
                  <LocalShippingIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-stone-950 dark:text-stone-100">{supplier.name}</span>
                </div>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 px-1.5 py-0.2 rounded font-bold">
                  মহাজন / খামারি
                </span>
              </div>

              {supplier.phone && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>মোবাইল নম্বর:</span>
                  <span className="font-semibold text-stone-950 dark:text-stone-100">{supplier.phone}</span>
                </div>
              )}

              {supplier.farmLocation && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>খামার / ঠিকানা:</span>
                  <span className="font-semibold text-stone-950 dark:text-stone-100">{supplier.farmLocation}</span>
                </div>
              )}

              {memosCount > 0 && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>মোট চালান সংখ্যা:</span>
                  <span className="font-black text-stone-950 dark:text-stone-100">
                    {toBengaliNumber(memosCount, useBengali)} টি
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-stone-200 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">বর্তমান পাওনা দেনা:</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                  supplier.totalPayable > 0
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {toBnCurrency(supplier.totalPayable, useBengali)}
                </span>
              </div>
            </div>

            {supplier.totalPayable > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/70 p-3 rounded-2xl border-2 border-rose-400 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-rose-950 dark:text-rose-100 text-xs">
                  <ErrorIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>সতর্কবার্তা: মহাজনের দেনা হিসাব মুছে যাওয়ার ঝুঁকি!</span>
                </div>
                <p className="leading-snug">
                  এই মহাজনের কাছে এখনো <strong className="underline decoration-rose-500 underline-offset-2">{toBnCurrency(supplier.totalPayable, useBengali)}</strong> টাকা দেনা রয়েছে। মহাজন মুছে দিলে পূর্বের সকল দেনা-পাওনার রেকর্ড মুছে যাবে!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Cancel (Safe) vs Delete (Danger) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="confirm-delete-cancel-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 font-bold text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition active:scale-95 disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            id="confirm-delete-submit-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-950/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <DeleteIcon className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'মোছা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
