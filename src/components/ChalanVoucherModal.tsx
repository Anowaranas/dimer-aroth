import React, { useState } from 'react';
import { SupplierChalan, ShopProfile } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayChalanNumber } from '../utils/bengaliUtils';
import { downloadElementAsImage, shareMemoAnywhere, formatChalanShareText, shareUniversal } from '../utils/shareUtils';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Loader2, 
  Trash2, 
  Check, 
  MessageSquare
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';

interface ChalanVoucherModalProps {
  chalan: SupplierChalan | null;
  shopProfile: ShopProfile;
  useBengali: boolean;
  onClose: () => void;
  onDeleteChalan?: (chalanId: string) => void;
}

export const ChalanVoucherModal: React.FC<ChalanVoucherModalProps> = ({
  chalan,
  shopProfile,
  useBengali,
  onClose,
  onDeleteChalan,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingDirect, setIsSharingDirect] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!chalan) return null;

  const cleanChalanNum = chalan.chalanNumber.replace(/[^a-zA-Z0-9]/g, '') || chalan.id.slice(0, 6);
  const fileName = `Chalan_${cleanChalanNum}_${chalan.supplierName.replace(/\s+/g, '_')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (isDownloading) return;
    const success = await downloadElementAsImage('printable-chalan-paper', fileName, setIsDownloading);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleDirectShareImage = async () => {
    if (isSharingDirect) return;
    await shareMemoAnywhere({
      fileName,
      elementId: 'printable-chalan-paper',
      imageOnly: true,
      onProgress: (p) => setIsSharingDirect(p),
    });
  };

  const handleShareText = async () => {
    const text = formatChalanShareText(chalan, shopProfile, useBengali);
    const shared = await shareUniversal({
      title: `মহাজন চালান - ${chalan.supplierName}`,
      text,
    });
    if (!shared) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const currentRemDue = chalan.remainingDue !== undefined ? chalan.remainingDue : chalan.dueAmount;
  const isPaid = currentRemDue <= 0;
  const theme = getPartyColorTheme(chalan.supplierName, chalan.supplierId);

  // Egg items breakdown
  const items = [];
  if (chalan.redEggCount && chalan.redEggCount > 0) {
    items.push({
      name: 'লাল ডিম',
      count: chalan.redEggCount,
      rate: chalan.redRatePerPiece || ((chalan.redRatePerHundred || 0) / 100),
      total: chalan.redTotalAmount || Math.round((chalan.redEggCount || 0) * (chalan.redRatePerPiece || 0)),
    });
  }
  if (chalan.whiteEggCount && chalan.whiteEggCount > 0) {
    items.push({
      name: 'সাদা ডিম',
      count: chalan.whiteEggCount,
      rate: chalan.whiteRatePerPiece || ((chalan.whiteRatePerHundred || 0) / 100),
      total: chalan.whiteTotalAmount || Math.round((chalan.whiteEggCount || 0) * (chalan.whiteRatePerPiece || 0)),
    });
  }
  if (items.length === 0 && chalan.eggCount) {
    items.push({
      name: chalan.eggType || 'মিশ্র ডিম',
      count: chalan.eggCount,
      rate: chalan.ratePerPiece || 0,
      total: chalan.totalAmount || 0,
    });
  }

  return (
    <div 
      id="chalan-voucher-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="chalan-voucher-card"
        className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-stone-200 dark:border-stone-800"
      >
        {/* Modal Top Toolbar & Actions (হুবহু মেমোর ভাউচারের মতো সেইম) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-stone-100/90 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-black text-stone-900 dark:text-stone-100 text-sm sm:text-base">
              মহাজন চালান
            </span>
            <span className="bg-stone-800 text-white text-xs sm:text-sm px-2.5 py-0.5 rounded-md font-mono font-black">
              {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
            </span>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              id="chalan-share-top-btn"
              onClick={handleDirectShareImage}
              disabled={isSharingDirect}
              title="চালানের ছবি শেয়ার করুন"
              className="p-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isSharingDirect ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              id="chalan-download-img-btn"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              title="চালানের ছবি (PNG) ডাউনলোড করুন"
              className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>
            <button
              id="chalan-print-btn"
              onClick={handlePrint}
              title="প্রিন্ট করুন"
              className="p-1.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg shadow-xs transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            {onDeleteChalan && (
              <button
                id="chalan-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="চালান মুছুন"
                className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="chalan-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-stone-700 dark:text-stone-200 flex items-center justify-center transition active:scale-90 shadow-2xs ml-1"
              title="চালান বন্ধ করুন"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          type="chalan"
          chalan={chalan}
          useBengali={useBengali}
          onConfirm={() => {
            if (onDeleteChalan && chalan) {
              onDeleteChalan(chalan.id);
            }
            setShowDeleteConfirm(false);
            onClose();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Printable Chalan Container (হুবহু ক্যাশ মেমোর মতো সেইম ডিজাইন) */}
        <div id="printable-chalan-content" className="p-2 sm:p-4 overflow-y-auto bg-stone-100 dark:bg-stone-950 print:bg-white print:p-0">
          
          <div 
            id="printable-chalan-paper" 
            className="bg-white border-2 border-slate-900 p-4 sm:p-5 rounded-xl shadow-xl text-slate-950 max-w-[520px] mx-auto text-xs sm:text-sm relative overflow-hidden font-['Hind_Siliguri','Noto_Sans_Bengali',sans-serif]"
            style={{ lineHeight: '1.75' }}
          >
            {/* Top Color Accent Strip based on Color Theme */}
            <div className={`h-3 w-full bg-gradient-to-r ${theme.headerBar} -mt-4 -mx-4 sm:-mt-5 sm:-mx-5 mb-3`}></div>

            {/* 1. Header: Shop Identity */}
            <div className="text-center pb-2.5 border-b-2 border-slate-300">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950" style={{ lineHeight: '1.3' }}>
                {shopProfile.name}
              </h2>
              {shopProfile.tagline && (
                <p className="text-[11.5px] sm:text-xs text-blue-950 font-black mt-1">
                  {shopProfile.tagline}
                </p>
              )}
              <p className="text-[11.5px] sm:text-xs text-slate-900 font-bold mt-1">
                {shopProfile.proprietor && <span>প্রোঃ {shopProfile.proprietor}</span>}
                {shopProfile.proprietor && shopProfile.mobile && <span className="text-blue-600 font-black px-1.5">•</span>}
                {shopProfile.mobile && <span>মোবাইল: {shopProfile.mobile}</span>}
              </p>
              {shopProfile.address && (
                <p className="text-[11px] sm:text-xs text-slate-700 font-medium mt-0.5">
                  {shopProfile.address}
                </p>
              )}
              <div className="inline-block mt-2 px-4 py-1 bg-slate-950 text-white rounded-full text-[11px] sm:text-xs font-black tracking-wider shadow-xs">
                মহাজন ডিমের চালান ভাউচার
              </div>
            </div>

            {/* 2. Supplier & Chalan Info (Clear High Contrast Box with Accent) */}
            <div className={`bg-slate-50/90 border-2 border-slate-800 border-l-[5px] ${theme.borderLeft} rounded-xl p-3 my-3 grid grid-cols-2 gap-3 text-xs sm:text-sm`}>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-600 font-bold text-[11px] block leading-none mb-1">মহাজন / খামারির নাম:</span>
                  <span className="font-black text-slate-950 text-sm sm:text-base block leading-snug">
                    {chalan.supplierName}
                  </span>
                </div>
                {chalan.supplierPhone && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 font-bold text-[11px]">মোবাইল:</span>
                    <span className="font-black text-slate-950 tabular-nums text-xs">{chalan.supplierPhone}</span>
                  </div>
                )}
                <div>
                  <span className="inline-block border border-blue-300 bg-blue-100 text-blue-950 px-2 py-0.5 rounded font-black text-[11px]">
                    মহাজন চালান
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-right flex flex-col justify-between">
                <div>
                  <span className="text-slate-600 font-bold text-[11px] block leading-none mb-1">চালান নং:</span>
                  <span className="inline-block bg-slate-950 text-white font-black font-mono text-xs sm:text-sm px-2.5 py-0.5 rounded shadow-xs">
                    {formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 font-bold text-[11px] block leading-none mb-1">তারিখ:</span>
                  <span className="font-black text-slate-950 text-xs sm:text-sm block">
                    {chalan.formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Items Table: Crisp High-Contrast Header & Clean Boxes */}
            <div className="py-1">
              <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-white font-black text-[11px] sm:text-xs">
                      <th className="py-2.5 px-3 w-[40%] border-r border-slate-800">ডিমের বিবরণ</th>
                      <th className="py-2.5 px-2.5 text-center w-[20%] whitespace-nowrap border-r border-slate-800">পরিমাণ</th>
                      <th className="py-2.5 px-2.5 text-right w-[20%] whitespace-nowrap border-r border-slate-800">দর (প্রতি পিস)</th>
                      <th className="py-2.5 px-3 text-right w-[20%] whitespace-nowrap">মোট (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/90 hover:bg-slate-100'}>
                        <td className="py-2.5 px-3 font-black text-slate-950 text-xs sm:text-sm border-r border-slate-200">
                          <span className="leading-relaxed">{item.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-xs sm:text-sm">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {toBengaliNumber(item.count, useBengali)} পিস
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-slate-950 whitespace-nowrap border-r border-slate-200 tabular-nums text-xs sm:text-sm">
                          ৳{toBengaliNumber(item.rate.toFixed(2), useBengali)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-950 whitespace-nowrap tabular-nums text-xs sm:text-sm">
                          ৳{toBengaliNumber(item.total.toFixed(2), useBengali)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Financial Summary: Clearly Boxed Rows */}
            <div className="pt-2">
              <div className="w-full sm:w-5/6 ml-auto bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 space-y-1.5 text-xs sm:text-sm shadow-xs">
                {/* মোট ডিমের ক্রয় মূল্য */}
                <div className="flex justify-between items-center bg-white border border-slate-250 px-2.5 py-1.5 rounded-lg text-slate-900 shadow-2xs">
                  <span className="font-bold text-xs">মোট ডিমের ক্রয় মূল্য:</span>
                  <span className="font-black text-slate-950 text-xs sm:text-sm tabular-nums">
                    {toBnCurrency(chalan.totalAmount, useBengali)}
                  </span>
                </div>

                {/* পূর্বের দেনা বাকি */}
                {chalan.previousDue !== undefined && chalan.previousDue > 0 && (
                  <div className="flex justify-between items-center text-purple-950 font-black bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                    <span>পূর্বের দেনা বাকি (জের):</span>
                    <span className="tabular-nums">+{toBnCurrency(chalan.previousDue, useBengali)}</span>
                  </div>
                )}

                {/* সর্বমোট দাবি বিল */}
                <div className="flex justify-between items-center font-black text-blue-950 bg-blue-100 border-2 border-blue-400 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm shadow-2xs">
                  <span>সর্বমোট দাবি বিল:</span>
                  <span className="tabular-nums text-xs sm:text-sm font-black">{toBnCurrency(chalan.totalDemand, useBengali)}</span>
                </div>

                {/* নগদ পরিশোধ / জমা */}
                <div className="flex justify-between items-center text-emerald-950 font-black bg-emerald-100 border border-emerald-400 px-2.5 py-1.5 rounded-lg text-xs shadow-2xs">
                  <span>নগদ পরিশোধ (জমা):</span>
                  <span className="tabular-nums">-{toBnCurrency(chalan.paidAmount || 0, useBengali)}</span>
                </div>

                {/* বর্তমান দেনা অবস্থা */}
                <div className={`flex justify-between items-center font-black text-xs px-2.5 py-1.5 rounded-lg border-2 shadow-xs ${
                  currentRemDue > 0
                    ? 'bg-rose-600 border-rose-800 text-white'
                    : 'bg-emerald-600 border-emerald-800 text-white'
                }`}>
                  <span>{currentRemDue > 0 ? 'বর্তমান দেনা বাকি:' : 'পেমেন্ট অবস্থা:'}</span>
                  <span className="tabular-nums text-xs sm:text-sm font-black">
                    {currentRemDue > 0 
                      ? toBnCurrency(currentRemDue, useBengali) 
                      : '✓ সম্পূর্ণ পরিশোধিত'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Note (if present) */}
            {(chalan.note || chalan.notes) && (
              <div className="mt-2 bg-slate-100 border-l-4 border-indigo-600 rounded-r-lg p-2 text-xs text-slate-900 font-bold">
                <span>মন্তব্য: </span>
                <span className="font-black">{chalan.note || chalan.notes}</span>
              </div>
            )}

            {/* 6. Signatures */}
            <div className="mt-3.5 pt-2 flex justify-between text-xs text-slate-950 font-black">
              <div className="text-center w-26 sm:w-34">
                <div className="border-t-2 border-dashed border-slate-500 mb-1"></div>
                <span className="text-slate-800 font-bold text-[10px]">মহাজন / বিক্রেতার স্বাক্ষর</span>
              </div>
              <div className="text-center w-26 sm:w-34">
                <div className="border-t-2 border-slate-900 mb-1"></div>
                <span className="text-slate-950 font-black text-[10px]">আড়তদার / ক্রেতার স্বাক্ষর</span>
              </div>
            </div>

            {/* 7. Footer Slogan */}
            <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[10px] text-slate-800 font-bold">
              <p>{shopProfile.memoFooter || 'ধন্যবাদ, আবার আসবেন।'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
