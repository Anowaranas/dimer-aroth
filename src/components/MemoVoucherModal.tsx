import React, { useState } from 'react';
import { Memo, ShopProfile } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber } from '../utils/bengaliUtils';
import { downloadElementAsImage, formatMemoShareText, shareUniversal, shareMemoAnywhere } from '../utils/shareUtils';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import { hapticCancel } from '../utils/haptics';

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
        className="soft-elevated modal-enter w-full max-w-xl md:max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[96vh] border border-stone-200/80 dark:border-white/10"
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
              type="button"
              onClick={handleDirectShareImage}
              disabled={isSharingDirect}
              title="মেমোর ছবি শেয়ার করুন"
              className="p-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {isSharingDirect ? <CircularProgress size={14} color="inherit" /> : <ShareRoundedIcon className="w-4 h-4" />}
            </button>
            <button
              id="voucher-download-img-btn"
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              title="মেমোর ছবি (PNG) ডাউনলোড করুন"
              className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {isDownloading ? <CircularProgress size={14} color="inherit" /> : <DownloadRoundedIcon className="w-4 h-4" />}
            </button>
            <button
              id="voucher-print-btn"
              type="button"
              onClick={handlePrint}
              title="প্রিন্ট করুন"
              className="p-1.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg shadow-xs transition active:scale-95 flex items-center justify-center"
            >
              <PrintRoundedIcon className="w-4 h-4" />
            </button>
            {onDeleteMemo && (
              <button
                id="voucher-delete-btn"
                type="button"
                onClick={() => {
                  hapticCancel();
                  setShowDeleteConfirm(true);
                }}
                title="মেমো মুছুন"
                className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition active:scale-95 flex items-center justify-center"
              >
                <DeleteOutlineRoundedIcon className="w-4 h-4" />
              </button>
            )}
            <button
              id="voucher-close-btn"
              type="button"
              onClick={() => {
                hapticCancel();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-stone-700 dark:text-stone-200 flex items-center justify-center transition active:scale-90 shadow-2xs ml-1"
              title="মেমো বন্ধ করুন"
            >
              <CloseRoundedIcon className="w-5 h-5" />
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
                className="bg-white border-2 border-slate-900 p-2.5 sm:p-3 rounded-xl shadow-xl text-slate-950 max-w-[530px] mx-auto text-[13px] sm:text-[15px] relative overflow-hidden font-['Anek_Bangla','Hind_Siliguri','Noto_Sans_Bengali',sans-serif]"
                style={{ lineHeight: '1.45', letterSpacing: 'normal' }}
              >
                {/* Top Color Accent Strip based on Party Color Theme */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${theme.headerBar} -mt-2.5 -mx-2.5 sm:-mt-3 sm:-mx-3 mb-2`}></div>

                {/* 1. Header: Shop Identity (7% larger) */}
                <div className="text-center pb-2.5 border-b-2 border-slate-300">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight" style={{ lineHeight: '1.3', letterSpacing: 'normal' }}>
                    {shopProfile.name}
                  </h2>
                  {shopProfile.tagline && (
                    <p className="text-xs sm:text-[13.5px] text-blue-950 font-black mt-0.5">
                      {shopProfile.tagline}
                    </p>
                  )}
                  <p className="text-xs sm:text-[13.5px] text-slate-900 font-bold mt-0.5">
                    {shopProfile.proprietor && <span>প্রোঃ {shopProfile.proprietor}</span>}
                    {shopProfile.proprietor && shopProfile.mobile && <span className="text-blue-600 font-black px-1.5">•</span>}
                    {shopProfile.mobile && <span>মোবাইল: {shopProfile.mobile}</span>}
                  </p>
                  {shopProfile.address && (
                    <p className="text-[11.5px] sm:text-[13px] text-slate-700 font-medium mt-0.5">
                      {shopProfile.address}
                    </p>
                  )}
                  <div className="inline-block mt-1.5 px-3.5 py-0.5 bg-slate-950 text-white rounded-full text-xs font-black shadow-xs">
                    ক্যাশ মেমো / চালান
                  </div>
                </div>

                {/* 2. Customer & Memo Info (High Contrast Clean Box) */}
                <div className={`bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 sm:p-3 my-2 grid grid-cols-2 gap-2 text-xs sm:text-sm shadow-xs`}>
                  <div className="space-y-1 min-w-0">
                    <div>
                      <span className="text-slate-700 font-bold text-xs block mb-0.5">খরিদ্দার / পার্টির নাম:</span>
                      <span className="font-black text-slate-950 text-sm sm:text-lg block break-words leading-tight tracking-tight">
                        {memo.partyName}
                      </span>
                    </div>
                    {memo.partyPhone && (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-slate-700 font-bold text-xs shrink-0">মোবাইল:</span>
                        <span className="font-black text-slate-950 tabular-nums text-xs sm:text-sm truncate">{memo.partyPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className={`inline-block border-2 px-2.5 py-0.5 rounded-md font-black text-xs ${typeBadgeStyle}`}>
                        {memo.partyType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-slate-700 font-bold text-xs block mb-0.5">মেমো নং:</span>
                      <span className="inline-block bg-slate-950 text-white font-black font-mono text-xs sm:text-sm px-2.5 py-0.5 rounded-md shadow-xs max-w-full truncate">
                        {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-700 font-bold text-xs block mb-0.5">তারিখ:</span>
                      <span className="font-black text-slate-950 text-xs sm:text-sm block break-keep leading-tight">
                        {memo.formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table: Crystal-Clear, High-Contrast Table with Sharp Grid */}
                <div className="py-0.5">
                  <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-950 text-white font-black text-xs sm:text-[13px]">
                          <th className="py-2 px-2.5 w-[34%] border-r border-slate-800">ডিমের বিবরণ</th>
                          <th className="py-2 px-1 text-center w-[18%] border-r border-slate-800">পরিমাণ</th>
                          <th className="py-2 px-1 text-right w-[18%] border-r border-slate-800">দর</th>
                          <th className="py-2 px-2.5 text-right w-[30%]">মোট (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-200">
                        {memo.items.map((item, idx) => {
                          const pieceRate = item.ratePerPiece || (item.ratePerHundred / 100);
                          const formattedPieceRate = Number.isInteger(pieceRate)
                            ? pieceRate.toString()
                            : pieceRate % 1 === 0 ? pieceRate.toFixed(0) : pieceRate.toFixed(2).replace(/\.?0+$/, '');
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-2 px-2.5 font-black text-slate-950 text-xs sm:text-[14px] border-r-2 border-slate-200 break-words">
                                <span className="leading-tight block">{item.eggType}</span>
                              </td>
                              <td className="py-2 px-1 text-center font-black text-slate-950 border-r-2 border-slate-200 tabular-nums text-xs sm:text-[14px]">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 inline-block whitespace-nowrap">
                                  {toBengaliNumber(item.count, useBengali)}&nbsp;টি
                                </span>
                              </td>
                              <td className="py-2 px-1 text-right font-black text-slate-950 border-r-2 border-slate-200 tabular-nums text-xs sm:text-[14px] whitespace-nowrap">
                                <span>৳{toBengaliNumber(formattedPieceRate, useBengali)}</span>
                              </td>
                              <td className="py-2 px-2.5 text-right font-black text-slate-950 tabular-nums text-xs sm:text-[14px] whitespace-nowrap">
                                <span>৳{toBengaliNumber(item.totalAmount, useBengali)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Financial Summary: High Contrast Boxed Rows with Clear Alignment */}
                <div className="pt-2">
                  <div className="w-full bg-white border-2 border-slate-900 rounded-2xl p-2.5 sm:p-3 space-y-1.5 text-xs sm:text-sm shadow-sm">
                    {/* মোট ডিমের মূল্য */}
                    <div className="flex justify-between items-center gap-2 bg-amber-50 text-amber-950 border-2 border-amber-400 font-black px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-2xs min-w-0">
                      <span className="shrink-0 font-extrabold whitespace-nowrap text-xs sm:text-[13.5px]">মোট ডিমের মূল্য:</span>
                      <span className="tabular-nums font-black whitespace-nowrap text-right ml-auto pl-2 text-xs sm:text-base">
                        {toBnCurrency(memo.totalBill, useBengali)}
                      </span>
                    </div>

                    {/* পূর্বের বাকি */}
                    {memo.previousDue > 0 && (
                      <div className="flex justify-between items-center gap-2 text-purple-950 font-black bg-purple-50 border-2 border-purple-400 px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-2xs min-w-0">
                        <span className="shrink-0 font-extrabold whitespace-nowrap text-xs sm:text-[13.5px]">পূর্বের বাকি (জের):</span>
                        <span className="tabular-nums font-black whitespace-nowrap text-right ml-auto pl-2 text-xs sm:text-base">+{toBnCurrency(memo.previousDue, useBengali)}</span>
                      </div>
                    )}

                    {/* সর্বমোট দাবি বিল */}
                    <div className="flex justify-between items-center gap-2 font-black text-blue-950 bg-blue-50 border-2 border-blue-500 px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-2xs min-w-0">
                      <span className="shrink-0 font-extrabold whitespace-nowrap text-xs sm:text-[13.5px]">সর্বমোট দাবি বিল:</span>
                      <span className="tabular-nums font-black whitespace-nowrap text-right ml-auto pl-2 text-xs sm:text-base">{toBnCurrency(memo.totalDemand, useBengali)}</span>
                    </div>

                    {/* জমা / নগদ পরিশোধ */}
                    <div className="flex justify-between items-center gap-2 text-emerald-950 font-black bg-emerald-50 border-2 border-emerald-500 px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-2xs min-w-0">
                      <span className="shrink-0 font-extrabold whitespace-nowrap text-xs sm:text-[13.5px]">নগদ জমা / পরিশোধ:</span>
                      <span className="tabular-nums font-black whitespace-nowrap text-right ml-auto pl-2 text-xs sm:text-base">-{toBnCurrency(memo.cashPaid, useBengali)}</span>
                    </div>

                    {/* বর্তমান বাকি অবস্থা */}
                    <div className={`flex justify-between items-center gap-2 font-black text-xs sm:text-sm px-3 py-2 rounded-xl border-2 shadow-xs min-w-0 ${
                      memo.remainingDue > 0
                        ? 'bg-rose-600 border-rose-800 text-white'
                        : 'bg-emerald-600 border-emerald-800 text-white'
                    }`}>
                      <span className="shrink-0 font-extrabold whitespace-nowrap text-xs sm:text-[14px]">{memo.remainingDue > 0 ? 'বর্তমান বাকি (দাবি):' : 'পেমেন্ট অবস্থা:'}</span>
                      <span className="tabular-nums font-black whitespace-nowrap text-right ml-auto pl-2 text-sm sm:text-base">
                        {memo.remainingDue > 0 
                          ? toBnCurrency(memo.remainingDue, useBengali) 
                          : '✓ সম্পূর্ণ পরিশোধিত'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Note (if present) - Clean Border */}
                {memo.note && (
                  <div className="mt-2 bg-slate-50 border-2 border-slate-300 rounded-xl p-2 text-xs sm:text-sm text-slate-900 font-bold break-words">
                    <span className="text-slate-700">মন্তব্য: </span>
                    <span className="font-black text-slate-950">{memo.note}</span>
                  </div>
                )}

                {/* 6. Signatures */}
                <div className="mt-2 pt-2 flex justify-between text-xs text-slate-950 font-black">
                  <div className="text-center w-28 sm:w-36">
                    <div className="border-t-2 border-dashed border-slate-500 mb-1"></div>
                    <span className="text-slate-800 font-bold text-xs">ক্রেতার স্বাক্ষর</span>
                  </div>
                  <div className="text-center w-28 sm:w-36">
                    <div className="border-t-2 border-slate-900 mb-1"></div>
                    <span className="text-slate-950 font-black text-xs">বিক্রেতার স্বাক্ষর</span>
                  </div>
                </div>

                {/* 7. Footer Slogan */}
                <div className="mt-2 pt-1 border-t border-slate-200 text-center text-xs text-slate-800 font-bold">
                  <p>{shopProfile.memoFooter || 'ধন্যবাদ, আবার আসবেন।'}</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom Actions Bar - Soft UI Sleek Bar (Image Share & Print) */}
        <div className="p-2 bg-stone-100/95 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 print:hidden">
          {/* Direct Share with Image Only */}
          <button
            id="modal-direct-share-btn"
            type="button"
            onClick={handleDirectShareImage}
            disabled={isSharingDirect}
            className="flex-1 py-2 px-3 soft-btn-primary rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="মেমোর ছবি সরাসরি শেয়ার করুন"
          >
            {isSharingDirect ? (
              <CircularProgress size={13} color="inherit" />
            ) : (
              <ShareRoundedIcon className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">ছবি শেয়ার</span>
          </button>

          {/* Download PNG Image */}
          <button
            id="modal-download-image-btn"
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="py-2 px-3 soft-btn rounded-xl font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
            title="মেমোর ছবি ডাউনলোড"
          >
            {isDownloading ? (
              <CircularProgress size={13} color="inherit" />
            ) : downloadSuccess ? (
              <CheckRoundedIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <DownloadRoundedIcon className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>ডাউনলোড</span>
          </button>

          {/* Print */}
          <button
            id="modal-print-slip"
            type="button"
            onClick={handlePrint}
            className="py-2 px-3 soft-btn bg-stone-900 text-white hover:bg-stone-950 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition active:scale-95"
            title="প্রিন্ট করুন"
          >
            <PrintRoundedIcon className="w-3.5 h-3.5 shrink-0" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>
    </div>
  );
};
