import React, { useState } from 'react';
import { Memo, ShopProfile } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber } from '../utils/bengaliUtils';
import { downloadElementAsImage, formatMemoShareText, shareUniversal, shareMemoAnywhere } from '../utils/shareUtils';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Loader2, 
  Trash2, 
  Copy, 
  Check, 
  Send
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';

interface MemoVoucherModalProps {
  memo: Memo | null;
  shopProfile: ShopProfile;
  useBengali: boolean;
  onClose: () => void;
  onOpenAllShare?: (memo: Memo) => void;
  onDeleteMemo?: (memoId: string) => void;
}

export const MemoVoucherModal: React.FC<MemoVoucherModalProps> = ({
  memo,
  shopProfile,
  useBengali,
  onClose,
  onOpenAllShare,
  onDeleteMemo,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingDirect, setIsSharingDirect] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!memo) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (isDownloading) return;
    const cleanMemoNum = memo.memoNumber.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `Memo_${cleanMemoNum || memo.id}_${memo.partyName.replace(/\s+/g, '_')}`;
    const success = await downloadElementAsImage('printable-voucher-paper', fileName, setIsDownloading);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleDirectShareImage = async () => {
    if (isSharingDirect) return;
    const cleanMemoNum = memo.memoNumber.replace(/[^a-zA-Z0-9]/g, '') || memo.id.slice(0, 6);
    await shareMemoAnywhere({
      fileName: `Memo_${cleanMemoNum}_${memo.partyName.replace(/\s+/g, '_')}`,
      elementId: 'printable-voucher-paper',
      imageOnly: true,
      onProgress: (p) => setIsSharingDirect(p),
    });
  };

  const isPaid = memo.remainingDue === 0;

  return (
    <div 
      id="memo-voucher-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="memo-voucher-card"
        className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-stone-200 dark:border-stone-800"
      >
        {/* Modal Top Toolbar & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-stone-100/90 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-black text-stone-900 dark:text-stone-100 text-sm sm:text-base">
              ক্যাশ মেমো
            </span>
            <span className="bg-stone-800 text-white text-xs sm:text-sm px-2.5 py-0.5 rounded-md font-mono font-black">
              {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
            </span>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              id="voucher-share-top-btn"
              onClick={handleDirectShareImage}
              disabled={isSharingDirect}
              title="মেমোর ছবি শেয়ার করুন"
              className="p-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isSharingDirect ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              id="voucher-download-img-btn"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              title="মেমোর ছবি (PNG) ডাউনলোড করুন"
              className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>
            <button
              id="voucher-print-btn"
              onClick={handlePrint}
              title="প্রিন্ট করুন"
              className="p-1.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg shadow-xs transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            {onDeleteMemo && (
              <button
                id="voucher-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="মেমো মুছুন"
                className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="voucher-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-stone-700 dark:text-stone-200 flex items-center justify-center transition active:scale-90 shadow-2xs ml-1"
              title="মেমো বন্ধ করুন"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          type="memo"
          memo={memo}
          useBengali={useBengali}
          onConfirm={() => {
            if (onDeleteMemo && memo) {
              onDeleteMemo(memo.id);
            }
            setShowDeleteConfirm(false);
            onClose();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Printable Memo Container (১০% বড় ও দৃষ্টিনন্দন) */}
        <div id="printable-memo-content" className="p-2 sm:p-4 overflow-y-auto bg-stone-100 dark:bg-stone-950 print:bg-white print:p-0">
          
          {/* =========================================================
              COLORFUL & CRYSTAL-CLEAR CASH MEMO (সুস্পষ্ট ও এক পলকে দেখার মতো ক্যাশ মেমো)
              ========================================================= */}
          {(() => {
            const theme = getPartyColorTheme(memo.partyName, memo.partyId);
            const typeBadgeStyle = 
              memo.partyType === 'পাইকারি' ? 'bg-blue-100 text-blue-950 border-blue-300' :
              memo.partyType === 'হোটেল' ? 'bg-purple-100 text-purple-950 border-purple-300' :
              'bg-emerald-100 text-emerald-950 border-emerald-300';

            return (
              <div 
                id="printable-voucher-paper" 
                className="bg-white border-2 border-slate-900 p-2 sm:p-2.5 rounded-xl shadow-xl text-slate-950 max-w-[520px] mx-auto text-xs sm:text-sm relative overflow-hidden font-['Anek_Bangla','Hind_Siliguri','Noto_Sans_Bengali',sans-serif]"
                style={{ lineHeight: '1.4', letterSpacing: 'normal' }}
              >
                {/* Top Color Accent Strip based on Party Color Theme */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${theme.headerBar} -mt-2 -mx-2 sm:-mt-2.5 sm:-mx-2.5 mb-1.5`}></div>

                {/* 1. Header: Shop Identity */}
                <div className="text-center pb-2 border-b-2 border-slate-300">
                  <h2 className="text-lg sm:text-xl font-black text-slate-950" style={{ lineHeight: '1.3', letterSpacing: 'normal' }}>
                    {shopProfile.name}
                  </h2>
                  {shopProfile.tagline && (
                    <p className="text-[11px] sm:text-xs text-blue-950 font-black mt-0.5">
                      {shopProfile.tagline}
                    </p>
                  )}
                  <p className="text-[11px] sm:text-xs text-slate-900 font-bold mt-0.5">
                    {shopProfile.proprietor && <span>প্রোঃ {shopProfile.proprietor}</span>}
                    {shopProfile.proprietor && shopProfile.mobile && <span className="text-blue-600 font-black px-1.5">•</span>}
                    {shopProfile.mobile && <span>মোবাইল: {shopProfile.mobile}</span>}
                  </p>
                  {shopProfile.address && (
                    <p className="text-[10.5px] sm:text-xs text-slate-700 font-medium mt-0.5">
                      {shopProfile.address}
                    </p>
                  )}
                  <div className="inline-block mt-1.5 px-3 py-0.5 bg-slate-950 text-white rounded-full text-[11px] font-black shadow-xs">
                    ক্যাশ মেমো / চালান
                  </div>
                </div>

                {/* 2. Customer & Memo Info (Clear High Contrast Box with Party Accent) */}
                <div className={`bg-slate-50/90 border-2 border-slate-800 border-l-[5px] ${theme.borderLeft} rounded-xl p-2.5 my-2 grid grid-cols-2 gap-2 text-xs sm:text-sm`}>
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-600 font-bold text-[10.5px] block mb-0.5">খরিদ্দার / পার্টির নাম:</span>
                      <span className="font-black text-slate-950 text-xs sm:text-sm block">
                        {memo.partyName}
                      </span>
                    </div>
                    {memo.partyPhone && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-bold text-[10.5px]">মোবাইল:</span>
                        <span className="font-black text-slate-950 tabular-nums text-xs">{memo.partyPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className={`inline-block border px-1.5 py-0.2 rounded font-black text-[10.5px] ${typeBadgeStyle}`}>
                        {memo.partyType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right flex flex-col justify-between">
                    <div>
                      <span className="text-slate-600 font-bold text-[10.5px] block mb-0.5">মেমো নং:</span>
                      <span className="inline-block bg-slate-950 text-white font-black font-mono text-xs px-2 py-0.5 rounded shadow-xs">
                        {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-bold text-[10.5px] block mb-0.5">তারিখ:</span>
                      <span className="font-black text-slate-950 text-xs block">
                        {memo.formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table: Crisp High-Contrast Header & Clean Boxes */}
                <div className="py-0.5">
                  <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-white font-black text-[11px] sm:text-xs whitespace-nowrap">
                          <th className="py-2 px-2.5 w-[38%] border-r border-slate-800 whitespace-nowrap">ডিমের বিবরণ</th>
                          <th className="py-2 px-2 text-center w-[20%] whitespace-nowrap border-r border-slate-800">পরিমাণ</th>
                          <th className="py-2 px-2 text-right w-[20%] whitespace-nowrap border-r border-slate-800">দর (প্রতি পিস)</th>
                          <th className="py-2 px-2.5 text-right w-[22%] whitespace-nowrap">মোট (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-200">
                        {memo.items.map((item, idx) => {
                          const pieceRate = item.ratePerPiece || (item.ratePerHundred / 100);
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/90 hover:bg-slate-100'}>
                              <td className="py-2 px-2.5 font-black text-slate-950 text-xs border-r border-slate-200 whitespace-nowrap">
                                <span className="leading-tight whitespace-nowrap">{item.eggType}</span>
                              </td>
                              <td className="py-2 px-2 text-center font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-xs">
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300 inline-block whitespace-nowrap">
                                  {toBengaliNumber(item.count, useBengali)}&nbsp;পিস
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-xs">
                                <span className="whitespace-nowrap">৳&nbsp;{toBengaliNumber(pieceRate.toFixed(2), useBengali)}</span>
                              </td>
                              <td className="py-2 px-2.5 text-right font-black text-slate-950 whitespace-nowrap tabular-nums text-xs">
                                <span className="whitespace-nowrap">৳&nbsp;{toBengaliNumber(item.totalAmount.toFixed(2), useBengali)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Financial Summary: Clearly Separated Distinct Boxed Rows */}
                <div className="pt-2">
                  <div className="w-full sm:w-11/12 ml-auto bg-white border-2 border-slate-900 rounded-2xl p-3 space-y-2 text-xs sm:text-sm shadow-md">
                    {/* মোট ডিমের মূল্য */}
                    <div className="flex justify-between items-center gap-2 flex-nowrap bg-amber-100 text-amber-950 border-2 border-amber-400 font-black px-3 py-1.5 rounded-xl text-xs shadow-xs">
                      <span className="whitespace-nowrap shrink-0">মোট ডিমের মূল্য:</span>
                      <span className="tabular-nums text-xs sm:text-sm whitespace-nowrap shrink-0 text-right">
                        {toBnCurrency(memo.totalBill, useBengali)}
                      </span>
                    </div>

                    {/* পূর্বের বাকি */}
                    {memo.previousDue > 0 && (
                      <div className="flex justify-between items-center gap-2 flex-nowrap text-purple-950 font-black bg-purple-100 border-2 border-purple-300 px-3 py-1.5 rounded-xl text-xs shadow-xs">
                        <span className="whitespace-nowrap shrink-0">পূর্বের বাকি (জের):</span>
                        <span className="tabular-nums text-xs sm:text-sm whitespace-nowrap shrink-0 text-right">+{toBnCurrency(memo.previousDue, useBengali)}</span>
                      </div>
                    )}

                    {/* সর্বমোট দাবি বিল */}
                    <div className="flex justify-between items-center gap-2 flex-nowrap font-black text-blue-950 bg-blue-100 border-2 border-blue-400 px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-xs">
                      <span className="whitespace-nowrap shrink-0">সর্বমোট দাবি বিল:</span>
                      <span className="tabular-nums text-xs sm:text-sm font-black whitespace-nowrap shrink-0 text-right">{toBnCurrency(memo.totalDemand, useBengali)}</span>
                    </div>

                    {/* জমা / নগদ পরিশোধ */}
                    <div className="flex justify-between items-center gap-2 flex-nowrap text-emerald-950 font-black bg-emerald-100 border-2 border-emerald-400 px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-xs">
                      <span className="whitespace-nowrap shrink-0">নগদ জমা / পরিশোধ:</span>
                      <span className="tabular-nums text-xs sm:text-sm whitespace-nowrap shrink-0 text-right">-{toBnCurrency(memo.cashPaid, useBengali)}</span>
                    </div>

                    {/* বর্তমান বাকি অবস্থা */}
                    <div className={`flex justify-between items-center gap-2 flex-nowrap font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl border-2 shadow-sm ${
                      memo.remainingDue > 0
                        ? 'bg-rose-600 border-rose-800 text-white'
                        : 'bg-emerald-600 border-emerald-800 text-white'
                    }`}>
                      <span className="whitespace-nowrap shrink-0">{memo.remainingDue > 0 ? 'বর্তমান বাকি (দাবি):' : 'পেমেন্ট অবস্থা:'}</span>
                      <span className="tabular-nums text-xs sm:text-sm font-black whitespace-nowrap shrink-0 text-right">
                        {memo.remainingDue > 0 
                          ? toBnCurrency(memo.remainingDue, useBengali) 
                          : '✓ সম্পূর্ণ পরিশোধিত'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Note (if present) */}
                {memo.note && (
                  <div className="mt-1.5 bg-slate-100 border-l-4 border-indigo-600 rounded-r-lg p-1.5 text-xs text-slate-900 font-bold">
                    <span>মন্তব্য: </span>
                    <span className="font-black">{memo.note}</span>
                  </div>
                )}

                {/* 6. Signatures */}
                <div className="mt-2.5 pt-1.5 flex justify-between text-xs text-slate-950 font-black">
                  <div className="text-center w-26 sm:w-34">
                    <div className="border-t-2 border-dashed border-slate-500 mb-0.5"></div>
                    <span className="text-slate-800 font-bold text-[10px]">ক্রেতার স্বাক্ষর</span>
                  </div>
                  <div className="text-center w-26 sm:w-34">
                    <div className="border-t-2 border-slate-900 mb-0.5"></div>
                    <span className="text-slate-950 font-black text-[10px]">বিক্রেতার স্বাক্ষর</span>
                  </div>
                </div>

                {/* 7. Footer Slogan */}
                <div className="mt-1.5 pt-0.5 border-t border-slate-200 text-center text-[10px] text-slate-800 font-bold">
                  <p>{shopProfile.memoFooter || 'ধন্যবাদ, আবার আসবেন।'}</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom Actions Bar - Ultra Compact & Sleek (Image Share & Print) */}
        <div className="p-1.5 sm:p-2 bg-stone-100/95 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-1.5 print:hidden">
          {/* Direct Share with Image Only */}
          <button
            id="modal-direct-share-btn"
            onClick={handleDirectShareImage}
            disabled={isSharingDirect}
            className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-blue-750 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-850 text-white rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-95 disabled:opacity-50"
            title="মেমোর ছবি সরাসরি শেয়ার করুন"
          >
            {isSharingDirect ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">মেমোর ছবি শেয়ার</span>
          </button>

          {/* Download PNG Image */}
          <button
            id="modal-download-image-btn"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="py-1.5 px-2.5 bg-stone-200 dark:bg-stone-750 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
            title="মেমোর ছবি ডাউনলোড"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>ডাউনলোড</span>
          </button>

          {/* Print */}
          <button
            id="modal-print-slip"
            onClick={handlePrint}
            className="py-1.5 px-2.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition active:scale-95"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>
    </div>
  );
};
