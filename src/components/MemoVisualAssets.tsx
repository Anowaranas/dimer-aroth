import React from 'react';
import { toBengaliNumber, toBnCurrency } from '../utils/bengaliUtils';

interface BarcodeProps {
  code: string;
  className?: string;
}

export const MemoBarcode: React.FC<BarcodeProps> = ({ code, className = '' }) => {
  // Generate a deterministic aesthetic barcode pattern based on the string
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        className="w-36 h-7 text-stone-900"
        viewBox="0 0 160 28"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {pattern.map((width, idx) => {
          const x = idx * 6 + ((hash + idx) % 3);
          return (
            <rect
              key={idx}
              x={x}
              y="0"
              width={width}
              height="24"
              fill="currentColor"
            />
          );
        })}
      </svg>
      <span className="text-[9px] font-mono tracking-widest text-stone-600 uppercase font-bold -mt-0.5">
        *{code}*
      </span>
    </div>
  );
};

interface QRCodeProps {
  memoNumber: string;
  shopName: string;
  partyName: string;
  totalBill: number;
  remainingDue: number;
  date: string;
  size?: number;
  className?: string;
}

export const MemoQRCode: React.FC<QRCodeProps> = ({
  memoNumber,
  size = 64,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-1 bg-white border border-stone-300 rounded-lg shadow-2xs select-none ${className}`}
      style={{ width: size + 8, height: size + 8 }}
      title={`ভেরিফাইড মেমো: ${memoNumber}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 45 45"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-stone-900"
      >
        {/* Finder Pattern Top-Left */}
        <rect x="2" y="2" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" rx="1.5" />
        <rect x="5.5" y="5.5" width="4" height="4" fill="currentColor" rx="0.5" />

        {/* Finder Pattern Top-Right */}
        <rect x="32" y="2" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" rx="1.5" />
        <rect x="35.5" y="5.5" width="4" height="4" fill="currentColor" rx="0.5" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="2" y="32" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" rx="1.5" />
        <rect x="5.5" y="35.5" width="4" height="4" fill="currentColor" rx="0.5" />

        {/* Timing Pattern Lines */}
        <line x1="15" y1="6.5" x2="30" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
        <line x1="6.5" y1="15" x2="6.5" y2="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />

        {/* Data Matrix Dots representing verified transaction hash */}
        <rect x="16" y="11" width="2" height="2" fill="currentColor" />
        <rect x="20" y="11" width="2" height="2" fill="currentColor" />
        <rect x="24" y="11" width="2" height="2" fill="currentColor" />
        <rect x="28" y="11" width="2" height="2" fill="currentColor" />

        <rect x="14" y="15" width="2" height="2" fill="currentColor" />
        <rect x="18" y="15" width="2" height="2" fill="currentColor" />
        <rect x="26" y="15" width="2" height="2" fill="currentColor" />
        <rect x="30" y="15" width="2" height="2" fill="currentColor" />
        <rect x="34" y="15" width="2" height="2" fill="currentColor" />
        <rect x="38" y="15" width="2" height="2" fill="currentColor" />

        <rect x="15" y="19" width="3" height="3" fill="currentColor" />
        <rect x="21" y="19" width="2" height="2" fill="currentColor" />
        <rect x="25" y="19" width="2" height="2" fill="currentColor" />
        <rect x="29" y="19" width="3" height="3" fill="currentColor" />

        {/* Center Verified Emblem: Little Egg */}
        <circle cx="22.5" cy="22.5" r="4.5" fill="#ffffff" stroke="currentColor" strokeWidth="1" />
        <path
          d="M22.5 19.5 C20.8 19.5 19.8 21.2 19.8 23.2 C19.8 25 21 26 22.5 26 C24 26 25.2 25 25.2 23.2 C25.2 21.2 24.2 19.5 22.5 19.5 Z"
          fill="#d97706"
        />

        <rect x="14" y="27" width="2" height="2" fill="currentColor" />
        <rect x="18" y="27" width="3" height="3" fill="currentColor" />
        <rect x="25" y="27" width="2" height="2" fill="currentColor" />
        <rect x="33" y="27" width="3" height="3" fill="currentColor" />
        <rect x="38" y="27" width="2" height="2" fill="currentColor" />

        <rect x="16" y="33" width="2" height="2" fill="currentColor" />
        <rect x="20" y="33" width="3" height="3" fill="currentColor" />
        <rect x="26" y="33" width="2" height="2" fill="currentColor" />
        <rect x="32" y="33" width="2" height="2" fill="currentColor" />
        <rect x="38" y="33" width="3" height="3" fill="currentColor" />

        <rect x="15" y="38" width="3" height="3" fill="currentColor" />
        <rect x="22" y="38" width="2" height="2" fill="currentColor" />
        <rect x="27" y="38" width="3" height="3" fill="currentColor" />
        <rect x="34" y="38" width="2" height="2" fill="currentColor" />
      </svg>
      <span className="text-[7.5px] font-bold text-stone-500 uppercase tracking-tighter mt-0.5">
        VERIFIED
      </span>
    </div>
  );
};

interface RubberStampProps {
  status: 'paid' | 'due' | 'partial';
  amount?: number;
  useBengali?: boolean;
  className?: string;
}

export const OfficialRubberStamp: React.FC<RubberStampProps> = ({
  status,
  amount = 0,
  useBengali = true,
  className = '',
}) => {
  const isPaid = status === 'paid';
  const isPartial = status === 'partial';

  const borderColor = isPaid
    ? 'border-emerald-700 text-emerald-800 bg-emerald-500/10'
    : isPartial
    ? 'border-indigo-700 text-indigo-900 bg-indigo-500/10'
    : 'border-rose-700 text-rose-800 bg-rose-500/10';

  const innerBorder = isPaid
    ? 'border-emerald-600'
    : isPartial
    ? 'border-indigo-500'
    : 'border-rose-600';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-1.5 border-2 border-dashed rounded-xl select-none transform -rotate-6 shadow-xs ${borderColor} ${className}`}
      style={{ minWidth: '110px' }}
    >
      <div className={`w-full py-0.5 px-2 border border-dotted ${innerBorder} rounded-lg flex flex-col items-center text-center`}>
        <div className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest opacity-80">
          <span>★</span>
          <span>ডিমের আড়ৎ</span>
          <span>★</span>
        </div>
        <span className="text-xs sm:text-sm font-black tracking-tight leading-tight uppercase my-0.5 font-mono">
          {isPaid ? 'পরিশোধিত' : isPartial ? 'আংশিক জমা' : 'বকেয়া চালান'}
        </span>
        <span className="text-[9px] font-bold tracking-wider opacity-90">
          {isPaid ? 'PAID IN FULL' : isPartial ? `বাকি: ${toBnCurrency(amount, useBengali)}` : `DUE: ${toBnCurrency(amount, useBengali)}`}
        </span>
      </div>
    </div>
  );
};
