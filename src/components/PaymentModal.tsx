import React, { useState } from 'react';
import { Party, PaymentMethod, PaymentRecord } from '../types';
import { getTodayDateInputValue, toBnCurrency, formatTypingNumber, convertEnToBnDigits, parseBengaliToNumber } from '../utils/bengaliUtils';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { hapticSuccess, hapticError, hapticLight } from '../utils/haptics';

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
  const [amountStr, setAmountStr] = useState<string>(party?.currentDue ? formatTypingNumber(party.currentDue, false, useBengali) : '');
  const [method, setMethod] = useState<PaymentMethod>('নগদ');
  const [date, setDate] = useState<string>(getTodayDateInputValue());
  const [note, setNote] = useState<string>('');

  const amount = parseBengaliToNumber(amountStr);

  React.useEffect(() => {
    if (party) {
      setAmountStr(party.currentDue ? formatTypingNumber(party.currentDue, false, useBengali) : '');
    }
  }, [party, useBengali]);

  if (!isOpen || !party) return null;

  const remainingDue = Math.max(0, party.currentDue - (amount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      hapticError();
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

    hapticSuccess();
    onRecordPayment(payment, remainingDue);
    onClose();
  };

  return (
    <div 
      id="payment-collection-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/75 backdrop-blur-md"
    >
      <div 
        id="payment-collection-card"
        className="material-card modal-enter w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden border text-slate-900 dark:text-slate-100"
      >
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight">টাকা জমা / বাকি আদায়</h3>
              <p className="text-[11px] text-emerald-100 font-medium">খরিদ্দারের বকেয়া আদায়ের হিসাব</p>
            </div>
          </div>
          <button 
            onClick={() => {
              hapticLight();
              onClose();
            }} 
            className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Party info badge */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">পার্টির নাম:</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{party.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">বর্তমান বাকি:</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {toBnCurrency(party.currentDue, useBengali)}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">জমা বা আদায়ের পরিমাণ (টাকা)</label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="আদায়ের পরিমাণ"
              value={amountStr}
              onChange={(e) => setAmountStr(formatTypingNumber(e.target.value, false, useBengali))}
              className="w-full text-sm font-black border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          {/* Method and Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">পেমেন্ট মাধ্যম</label>
              <select
                value={method}
                onChange={(e) => {
                  hapticLight();
                  setMethod(e.target.value as any);
                }}
                className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="নগদ">নগদ ক্যাশ</option>
                <option value="বিকাশ">বিকাশ</option>
                <option value="ব্যাংক">ব্যাংক</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">তারিখ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">মন্তব্য / নোট (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="ঐচ্ছিক মন্তব্য"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          {/* Balance Preview Indicator */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
            <span>জমা পরবর্তী বকেয়া:</span>
            <span className={remainingDue > 0 ? 'text-rose-700 dark:text-rose-400 font-black' : 'text-emerald-700 dark:text-emerald-400 font-black'}>
              {toBnCurrency(remainingDue, useBengali)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onClose();
              }}
              className="soft-btn rounded-xl px-3.5 py-2 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="soft-btn-emerald rounded-xl px-4 py-2 text-white text-xs font-black transition active:scale-95"
            >
              জমা নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
