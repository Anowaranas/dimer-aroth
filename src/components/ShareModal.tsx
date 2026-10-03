import React, { useState } from 'react';
import { Memo, ShopProfile } from '../types';
import { shareMemoAnywhere, downloadElementAsImage, shareUniversal, formatReminderText } from '../utils/shareUtils';
import { 
  X, 
  Share2, 
  Printer, 
  Download, 
  Check, 
  Loader2, 
  Receipt, 
  Bell 
} from 'lucide-react';
import { toBnCurrency, toBengaliNumber, formatDisplayMemoNumber } from '../utils/bengaliUtils';
import { getPartyColorTheme } from '../utils/partyColors';

interface ShareModalProps {
  memo: Memo | null;
  shopProfile: ShopProfile;
  useBengali: boolean;
  isOpen: boolean;
  onClose: () => void;
  onViewVoucher: (memo: Memo) => void;
  onDownloadImage?: (memo: Memo) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  memo,
  shopProfile,
  useBengali,
  isOpen,
  onClose,
  onViewVoucher,
}) => {
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!isOpen || !memo) return null;

  const cleanMemoNum = memo.memoNumber.replace(/[^a-zA-Z0-9]/g, '') || memo.id.slice(0, 6);
  const fileName = `Memo_${cleanMemoNum}_${memo.partyName.replace(/\s+/g, '_')}`;

  // 1. Direct Native Android Share with Picture ONLY (No third-party links)
  const handleAndroidShare = async () => {
    if (isSharingImage) return;
    const result = await shareMemoAnywhere({
      fileName,
      elementId: 'printable-voucher-paper',
      imageOnly: true,
      onProgress: (inProgress) => setIsSharingImage(inProgress),
    });

    if (result.success) {
      if (result.method === 'image-share') {
        setShareFeedback('✅ মেমোর ছবি সরাসরি শেয়ার হয়েছে!');
      } else if (result.method === 'download') {
        setShareFeedback('📥 মেমোর ছবি ডাউনলোড হয়েছে!');
      }
      setTimeout(() => setShareFeedback(null), 3500);
    }
  };

  // 2. Direct Print
  const handlePrint = () => {
    onViewVoucher(memo);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // 3. Download PNG to phone
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const success = await downloadElementAsImage('printable-voucher-paper', fileName);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  // 4. Send Reminder (তাগাদা পাঠান)
  const handleSendReminder = async () => {
    const text = formatReminderText(memo, useBengali);
    await shareUniversal({
      title: 'বকেয়া পরিশোধের তাগাদা',
      text,
    });
    setShareFeedback('✅ তাগাদা বার্তা সফলভাবে শেয়ার করা হয়েছে!');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="share-modal-card"
        className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-stone-200 dark:border-stone-800"
      >
        {/* Header - Sleek & Modern */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/25 shadow-2xs">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight text-white drop-shadow-2xs">মেমো শেয়ার ও প্রিন্ট</h3>
              <p className="text-[11px] text-blue-100 font-bold leading-tight">
                মেমো {formatDisplayMemoNumber(memo.memoNumber, useBengali)} • {memo.partyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/15 rounded-full text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Notification Toast */}
        {shareFeedback && (
          <div className="mx-3 mt-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-xl text-center animate-in fade-in">
            {shareFeedback}
          </div>
        )}

        {/* Memo Quick Overview Pill */}
        <div className="px-4 pt-3">
          <div className="bg-stone-50 dark:bg-stone-850 p-2.5 rounded-2xl border border-stone-200 dark:border-stone-750 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block text-xs">{memo.partyName}</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">মোট ডিম: {memo.totalEggs} পিস</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-black text-stone-950 dark:text-stone-50 block text-xs">{toBnCurrency(memo.totalDemand, useBengali)}</span>
              <span className={`text-[10px] font-bold ${memo.remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {memo.remainingDue > 0 ? `বাকি: ${toBnCurrency(memo.remainingDue, useBengali)}` : 'পরিশোধিত'}
              </span>
            </div>
          </div>
        </div>

        {/* Only 2 Core Options Requested by User: Android Share & Print */}
        <div className="p-4 space-y-2.5">
          {/* 1. Android Share Button (ছবি শেয়ার) */}
          <button
            id="btn-android-share"
            onClick={handleAndroidShare}
            disabled={isSharingImage}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 hover:from-blue-800 hover:to-indigo-700 text-white flex items-center justify-between shadow-md shadow-blue-900/20 transition active:scale-[0.98] border border-blue-400/40 relative overflow-hidden disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                {isSharingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5 text-cyan-200" />
                )}
              </div>
              <div className="text-left">
                <span className="font-black text-sm block text-white">
                  {isSharingImage ? 'ছবি প্রসেস হচ্ছে...' : 'এন্ড্রয়েড শেয়ার (মেমোর ছবি)'}
                </span>
                <span className="text-[10.5px] text-blue-100 font-medium block leading-tight">
                  সরাসরি যেকোনো অ্যাপে ছবি শেয়ার করুন
                </span>
              </div>
            </div>
            <Share2 className="w-5 h-5 text-white/90 shrink-0 ml-1" />
          </button>

          {/* 2. Print Memo Button */}
          <button
            id="btn-print-memo"
            onClick={handlePrint}
            className="w-full p-3 rounded-2xl bg-stone-900 hover:bg-stone-950 text-white flex items-center justify-between shadow-md transition active:scale-[0.98] border border-stone-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-black text-xs sm:text-sm block">প্রিন্ট মেমো</span>
                <span className="text-[10px] text-stone-300 font-medium block">
                  ক্যাশ ভাউচার প্রিন্ট করুন
                </span>
              </div>
            </div>
            <Printer className="w-4 h-4 text-stone-300 shrink-0 ml-1" />
          </button>

          {/* 3. Send Reminder Button (তাগাদা পাঠান) */}
          {memo.remainingDue > 0 ? (
            <button
              id="btn-send-due-reminder"
              type="button"
              onClick={handleSendReminder}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shadow-md hover:from-amber-600 hover:to-rose-600 transition active:scale-98 border border-amber-400/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-black text-xs sm:text-sm block">বকেয়া তাগাদা পাঠান</span>
                  <span className="text-[10px] text-amber-100 font-medium block">
                    হোয়াটসঅ্যাপ, এসএমএস বা মেসেঞ্জারে শেয়ার করুন
                  </span>
                </div>
              </div>
              <Share2 className="w-4 h-4 text-white/90 shrink-0 ml-1" />
            </button>
          ) : (
            <button
              id="btn-send-reminder"
              onClick={handleSendReminder}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md transition active:scale-98 border border-emerald-400/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-black text-xs block text-white">পরিশোধিত রসিদ শেয়ার করুন</span>
                  <span className="text-[9.5px] text-emerald-100 font-medium">সম্পূর্ণ পরিশোধের কৃতজ্ঞতা বার্তা</span>
                </div>
              </div>
              <Share2 className="w-3.5 h-3.5 text-white/90" />
            </button>
          )}

          {/* 4. Download Image Utility */}
          <button
            id="btn-download-image-util"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 flex items-center justify-between border border-stone-200 dark:border-stone-700 transition active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="text-left">
                <span className="font-bold text-xs block">
                  {downloadSuccess ? 'মেমোর ছবি ডাউনলোড সম্পন্ন!' : 'মেমোর ছবি ডাউনলোড (PNG)'}
                </span>
                <span className="text-[9.5px] text-stone-500 dark:text-stone-400">
                  ফোনের গ্যালারিতে সেভ রাখুন
                </span>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Off-screen high-res printable voucher paper for pristine image export */}
      {(() => {
        const theme = getPartyColorTheme(memo.partyName, memo.partyId);
        const typeBadgeStyle = 
          memo.partyType === 'পাইকারি' ? 'bg-blue-100 text-blue-950 border-blue-300' :
          memo.partyType === 'হোটেল' ? 'bg-purple-100 text-purple-950 border-purple-300' :
          'bg-emerald-100 text-emerald-950 border-emerald-300';

        return (
          <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none', zIndex: -100, width: '540px' }}>
            <div 
              id="printable-voucher-paper" 
              className="bg-white border-2 border-slate-900 p-4 rounded-xl text-slate-950 w-[540px] text-xs sm:text-sm relative overflow-hidden font-['Anek_Bangla','Hind_Siliguri','Noto_Sans_Bengali',sans-serif]"
              style={{ lineHeight: '1.5', letterSpacing: 'normal', width: '540px', minWidth: '540px', maxWidth: '540px' }}
            >
              <div className={`h-2.5 w-full bg-gradient-to-r ${theme.headerBar} -mt-4 -mx-4 mb-2.5`}></div>

              {/* Shop Header */}
              <div className="text-center pb-2.5 border-b-2 border-slate-300">
                <h2 className="text-2xl font-black text-slate-950" style={{ lineHeight: '1.4', letterSpacing: 'normal' }}>
                  {shopProfile.name}
                </h2>
                {shopProfile.tagline && (
                  <p className="text-xs text-blue-950 font-black mt-1">
                    {shopProfile.tagline}
                  </p>
                )}
                <p className="text-xs text-slate-900 font-bold mt-1">
                  {shopProfile.proprietor && <span>প্রোঃ {shopProfile.proprietor}</span>}
                  {shopProfile.proprietor && shopProfile.mobile && <span className="text-blue-600 font-black px-1.5">•</span>}
                  {shopProfile.mobile && <span>মোবাইল: {shopProfile.mobile}</span>}
                </p>
                {shopProfile.address && (
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    {shopProfile.address}
                  </p>
                )}
                <div className="inline-block mt-2 px-4 py-1 bg-slate-950 text-white rounded-full text-xs font-black shadow-xs">
                  ক্যাশ মেমো / চালান
                </div>
              </div>

              {/* Customer Info */}
              <div className={`bg-slate-50/90 border-2 border-slate-800 border-l-[5px] ${theme.borderLeft} rounded-xl p-3 my-3 grid grid-cols-2 gap-3 text-xs`}>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-600 font-bold text-[11px] block mb-0.5">খরিদ্দার / পার্টির নাম:</span>
                    <span className="font-black text-slate-950 text-base block">
                      {memo.partyName}
                    </span>
                  </div>
                  {memo.partyPhone && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600 font-bold text-[11px]">মোবাইল:</span>
                      <span className="font-black text-slate-950 tabular-nums text-xs">{memo.partyPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className={`inline-block border px-2 py-0.5 rounded font-black text-[11px] ${typeBadgeStyle}`}>
                      {memo.partyType}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right flex flex-col justify-between">
                  <div>
                    <span className="text-slate-600 font-bold text-[11px] block mb-0.5">মেমো নং:</span>
                    <span className="inline-block bg-slate-950 text-white font-black font-mono text-sm px-2.5 py-0.5 rounded shadow-xs">
                      {formatDisplayMemoNumber(memo.memoNumber, useBengali)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold text-[11px] block mb-0.5">তারিখ:</span>
                    <span className="font-black text-slate-950 text-sm block">
                      {memo.formattedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-1">
                <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white font-black text-xs whitespace-nowrap">
                        <th className="py-2.5 px-3 w-[38%] border-r border-slate-800 whitespace-nowrap">ডিমের বিবরণ</th>
                        <th className="py-2.5 px-2 text-center w-[20%] whitespace-nowrap border-r border-slate-800">পরিমাণ</th>
                        <th className="py-2.5 px-2 text-right w-[20%] whitespace-nowrap border-r border-slate-800">দর (প্রতি পিস)</th>
                        <th className="py-2.5 px-3 text-right w-[22%] whitespace-nowrap">মোট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-200">
                      {memo.items.map((item, idx) => {
                        const pieceRate = item.ratePerPiece || (item.ratePerHundred / 100);
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/90'}>
                            <td className="py-2.5 px-3 font-black text-slate-950 text-sm border-r border-slate-200 whitespace-nowrap">
                              <span className="leading-relaxed whitespace-nowrap">{item.eggType}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-sm">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-block whitespace-nowrap">
                                {toBengaliNumber(item.count, useBengali)}&nbsp;পিস
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-sm">
                              <span className="whitespace-nowrap">৳&nbsp;{toBengaliNumber(pieceRate.toFixed(2), useBengali)}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-950 whitespace-nowrap tabular-nums text-sm">
                              <span className="whitespace-nowrap">৳&nbsp;{toBengaliNumber(item.totalAmount.toFixed(2), useBengali)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-2">
                <div className="w-5/6 ml-auto bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 space-y-1.5 text-xs shadow-xs">
                  <div className="flex justify-between items-center gap-2 flex-nowrap bg-white border border-slate-250 px-2.5 py-1.5 rounded-lg text-slate-900 shadow-2xs">
                    <span className="font-bold text-xs whitespace-nowrap shrink-0">মোট ডিমের মূল্য:</span>
                    <span className="font-black text-slate-950 text-sm tabular-nums whitespace-nowrap shrink-0 text-right">
                      {toBnCurrency(memo.totalBill, useBengali)}
                    </span>
                  </div>

                  {memo.previousDue > 0 && (
                    <div className="flex justify-between items-center gap-2 flex-nowrap text-purple-950 font-black bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                      <span className="whitespace-nowrap shrink-0">পূর্বের বাকি (জের):</span>
                      <span className="tabular-nums whitespace-nowrap shrink-0 text-right">+{toBnCurrency(memo.previousDue, useBengali)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2 flex-nowrap font-black text-blue-950 bg-blue-100 border-2 border-blue-400 px-2.5 py-1.5 rounded-lg text-xs shadow-2xs">
                    <span className="whitespace-nowrap shrink-0">সর্বমোট দাবি বিল:</span>
                    <span className="tabular-nums text-sm font-black whitespace-nowrap shrink-0 text-right">{toBnCurrency(memo.totalDemand, useBengali)}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2 flex-nowrap text-emerald-950 font-black bg-emerald-100 border border-emerald-400 px-2.5 py-1.5 rounded-lg text-xs shadow-2xs">
                    <span className="whitespace-nowrap shrink-0">নগদ জমা / পরিশোধ:</span>
                    <span className="tabular-nums whitespace-nowrap shrink-0 text-right">-{toBnCurrency(memo.cashPaid, useBengali)}</span>
                  </div>

                  <div className={`flex justify-between items-center gap-2 flex-nowrap font-black text-xs px-2.5 py-1.5 rounded-lg border-2 shadow-xs ${
                    memo.remainingDue > 0
                      ? 'bg-rose-600 border-rose-800 text-white'
                      : 'bg-emerald-600 border-emerald-800 text-white'
                  }`}>
                    <span className="whitespace-nowrap shrink-0">{memo.remainingDue > 0 ? 'বর্তমান বাকি (দাবি):' : 'পেমেন্ট অবস্থা:'}</span>
                    <span className="tabular-nums text-sm font-black whitespace-nowrap shrink-0 text-right">
                      {memo.remainingDue > 0 
                        ? toBnCurrency(memo.remainingDue, useBengali) 
                        : '✓ সম্পূর্ণ পরিশোধিত'}
                    </span>
                  </div>
                </div>
              </div>

              {memo.note && (
                <div className="mt-2 bg-slate-100 border-l-4 border-indigo-600 rounded-r-lg p-2 text-xs text-slate-900 font-bold">
                  <span>মন্তব্য: </span>
                  <span className="font-black">{memo.note}</span>
                </div>
              )}

              <div className="mt-3.5 pt-2 flex justify-between text-xs text-slate-950 font-black">
                <div className="text-center w-34">
                  <div className="border-t-2 border-dashed border-slate-500 mb-1"></div>
                  <span className="text-slate-800 font-bold text-[10px]">ক্রেতার স্বাক্ষর</span>
                </div>
                <div className="text-center w-34">
                  <div className="border-t-2 border-slate-900 mb-1"></div>
                  <span className="text-slate-950 font-black text-[10px]">বিক্রেতার স্বাক্ষর</span>
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[10px] text-slate-800 font-bold">
                <p>{shopProfile.memoFooter || 'ধন্যবাদ, আবার আসবেন।'}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
