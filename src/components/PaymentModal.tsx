import React, { useState } from 'react';
import { Party, PaymentMethod, PaymentRecord } from '../types';
import { getTodayDateInputValue, toBengaliNumber, toBnCurrency, convertEnToBnDigits, parseBengaliToNumber } from '../utils/bengaliUtils';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PaymentModalProps {
  party: Party | null;
  isOpen: boolean;
  useBengali: boolean;
  onClose: () => void;
  onRecordPayment: (payment: PaymentRecord, newDue: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  party,
  isOpen,
  useBengali,
  onClose,
  onRecordPayment,
}) => {
  const [amountStr, setAmountStr] = useState<string>(party?.currentDue ? convertEnToBnDigits(party.currentDue, false) : '');
  const [method, setMethod] = useState<PaymentMethod>('নগদ');
  const [date, setDate] = useState<string>(getTodayDateInputValue());
  const [note, setNote] = useState<string>('');

  const amount = parseBengaliToNumber(amountStr);

  React.useEffect(() => {
    if (party) {
      setAmountStr(party.currentDue ? convertEnToBnDigits(party.currentDue, false) : '');
    }
  }, [party]);

  if (!isOpen || !party) return null;

  const remainingDue = Math.max(0, party.currentDue - (amount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('সঠিক জমার পরিমাণ লিখুন');
      return;
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      partyId: party.id,
      partyName: party.name,
      amount: amount,
      date,
      method,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(payment, remainingDue);
    onClose();
  };

  return (
    <div 
      id="payment-collection-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs"
    >
      <div 
        id="payment-collection-card"
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight">টাকা জমা / বাকি আদায়</h3>
              <p className="text-[11px] text-emerald-100 font-medium">খরিদ্দারের বকেয়া আদায়ের হিসাব</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Party info badge */}
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-stone-500">পার্টির নাম:</p>
              <p className="text-sm font-bold text-stone-800">{party.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">বর্তমান বাকি:</p>
              <p className="text-sm font-bold text-rose-600">
                {toBnCurrency(party.currentDue, useBengali)}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-[11px] text-stone-700 block mb-0.5">জমা বা আদায়ের পরিমাণ (টাকা)</label>
            <input
              type="text"
              required
              placeholder="আদায়ের পরিমাণ"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full text-sm font-bold border border-stone-300 rounded-lg p-2 bg-white text-stone-950"
            />
          </div>

          {/* Method and Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-stone-700 block mb-0.5">পেমেন্ট মাধ্যম</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full text-xs font-bold border border-stone-300 rounded-lg p-2 bg-white text-stone-950"
              >
                <option value="নগদ">নগদ ক্যাশ</option>
                <option value="বিকাশ">বিকাশ</option>
                <option value="ব্যাংক">ব্যাংক</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-stone-700 block mb-0.5">তারিখ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-bold border border-stone-300 rounded-lg p-2 bg-white text-stone-950"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] text-stone-700 block mb-0.5">মন্তব্য / নোট (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="ঐচ্ছিক মন্তব্য"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs font-bold border border-stone-300 rounded-lg p-2 bg-white text-stone-950"
            />
          </div>

          {/* Balance Preview Indicator */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-extrabold text-stone-800 dark:text-stone-200">
            <span>জমা পরবর্তী বকেয়া:</span>
            <span className={remainingDue > 0 ? 'text-rose-700 dark:text-rose-400 font-black' : 'text-emerald-700 dark:text-emerald-400 font-black'}>
              {toBnCurrency(remainingDue, useBengali)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black shadow-sm transition active:scale-95"
            >
              জমা নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
