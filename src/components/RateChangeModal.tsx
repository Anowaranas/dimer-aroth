import React, { useState } from 'react';
import { BaseRate } from '../types';
import { toBengaliNumber, formatTypingNumber, parseBengaliToNumber } from '../utils/bengaliUtils';
import { hapticSuccess, hapticCancel, hapticLight } from '../utils/haptics';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';

interface RateChangeModalProps {
  isOpen: boolean;
  baseRate: BaseRate;
  useBengali: boolean;
  onClose: () => void;
  onSaveRate: (updatedRate: BaseRate) => void;
}

export const RateChangeModal: React.FC<RateChangeModalProps> = ({
  isOpen,
  baseRate,
  useBengali,
  onClose,
  onSaveRate,
}) => {
  const [redRateStr, setRedRateStr] = useState<string>(
    baseRate?.redRate ? formatTypingNumber(baseRate.redRate, false, useBengali) : '১,১৭০'
  );
  const [whiteRateStr, setWhiteRateStr] = useState<string>(
    baseRate?.whiteRate ? formatTypingNumber(baseRate.whiteRate, false, useBengali) : '১,১২০'
  );

  React.useEffect(() => {
    if (baseRate?.redRate) setRedRateStr(formatTypingNumber(baseRate.redRate, false, useBengali));
    if (baseRate?.whiteRate) setWhiteRateStr(formatTypingNumber(baseRate.whiteRate, false, useBengali));
  }, [baseRate, isOpen, useBengali]);

  if (!isOpen) return null;

  const redRateNum = parseBengaliToNumber(redRateStr);
  const whiteRateNum = parseBengaliToNumber(whiteRateStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hapticSuccess();
    onSaveRate({
      ...baseRate,
      redRate: redRateNum,
      whiteRate: whiteRateNum,
      lastUpdated: new Date().toISOString(),
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-sm md:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center text-base font-black shadow-2xs">
              🥚
            </span>
            <div>
              <h3 className="text-sm font-black text-white">আজকের ডিমের বাজার দর পরিবর্তন</h3>
              <p className="text-[10px] text-amber-100 font-bold">নতুন মেমো তৈরিতে এই রেটগুলো ব্যবহৃত হবে</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticCancel();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95"
          >
            <CloseRoundedIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* 1. লাল ডিম দর */}
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span>লাল ডিম (প্রতি ১০০ পিস)</span>
              </span>
              <span className="text-[10.5px] text-slate-600 dark:text-slate-400 font-bold">
                প্রতি পিস: ৳{toBengaliNumber((redRateNum / 100).toFixed(2), useBengali)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="text"
                inputMode="numeric"
                value={redRateStr}
                onChange={(e) => {
                  hapticLight();
                  setRedRateStr(formatTypingNumber(e.target.value, false, useBengali));
                }}
                placeholder="১,১৭০"
                className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                required
              />
            </div>
          </div>

          {/* 2. সাদা ডিম দর */}
          <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                <span>সাদা ডিম (প্রতি ১০০ পিস)</span>
              </span>
              <span className="text-[10.5px] text-slate-600 dark:text-slate-400 font-bold">
                প্রতি পিস: ৳{toBengaliNumber((whiteRateNum / 100).toFixed(2), useBengali)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="text"
                inputMode="numeric"
                value={whiteRateStr}
                onChange={(e) => {
                  hapticLight();
                  setWhiteRateStr(formatTypingNumber(e.target.value, false, useBengali));
                }}
                placeholder="১,১২০"
                className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                hapticCancel();
                onClose();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs transition active:scale-95"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <SaveRoundedIcon className="w-4 h-4" />
              <span>দর সংরক্ষণ</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
