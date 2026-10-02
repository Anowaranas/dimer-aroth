import { toPng } from 'html-to-image';
import { Memo, ShopProfile, SupplierChalan } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber, formatDisplayChalanNumber } from './bengaliUtils';

/**
 * Format memo text nicely for WhatsApp, SMS, Messenger, or Clipboard (Single clean line per row)
 */
export function formatMemoShareText(memo: Memo, shopProfile: ShopProfile, useBengali: boolean): string {
  const lines: string[] = [];

  lines.push(`🏢 *${shopProfile.name}*`);
  if (shopProfile.tagline) {
    lines.push(`${shopProfile.tagline}`);
  }
  lines.push(`================================`);
  lines.push(`📄 *ক্যাশ মেমো নং:* ${formatDisplayMemoNumber(memo.memoNumber, useBengali)}`);
  lines.push(`📅 *তারিখ:* ${memo.formattedDate}`);
  lines.push(`👤 *ক্রেতা / পার্টি:* ${memo.partyName} (${memo.partyType})`);
  if (memo.partyPhone) {
    lines.push(`📱 *মোবাইল:* ${memo.partyPhone}`);
  }
  lines.push(`================================`);
  lines.push(`🥚 *ডিমের বিবরণ:*`);

  memo.items.forEach((item) => {
    const pieceRate = item.ratePerPiece || (item.ratePerHundred / 100);
    lines.push(`• ${item.eggType}: ${toBengaliNumber(item.count, useBengali)} পিস @ ৳${toBengaliNumber(pieceRate.toFixed(2), useBengali)} = ৳${toBengaliNumber(item.totalAmount, useBengali)}`);
  });

  lines.push(`--------------------------------`);
  lines.push(`🥚 *মোট ডিম:* ${toBengaliNumber(memo.totalEggs, useBengali)} পিস`);
  lines.push(`💵 *আজকের মোট বিল:* ${toBnCurrency(memo.totalBill, useBengali)}`);

  if (memo.previousDue > 0) {
    lines.push(`⏳ *পূর্বের বকেয়া জের:* +${toBnCurrency(memo.previousDue, useBengali)}`);
  }

  lines.push(`📌 *সর্বমোট দাবি:* ${toBnCurrency(memo.totalDemand, useBengali)}`);
  lines.push(`💰 *নগদ / জমা:* ${toBnCurrency(memo.cashPaid, useBengali)}`);

  if (memo.remainingDue > 0) {
    lines.push(`⚠️ *অবশিষ্ট মোট বকেয়া:* ${toBnCurrency(memo.remainingDue, useBengali)}`);
  } else {
    lines.push(`✅ *পরিশোধ স্থিতি:* সম্পূর্ণ পরিশোধিত`);
  }

  if (memo.note) {
    lines.push(`📝 *মন্তব্য:* ${memo.note}`);
  }

  lines.push(`================================`);
  if (shopProfile.proprietor) lines.push(`প্রোঃ ${shopProfile.proprietor}`);
  if (shopProfile.mobile) lines.push(`মোবাইল: ${shopProfile.mobile}`);
  if (shopProfile.address) lines.push(`📍 ${shopProfile.address}`);

  return lines.join('\n');
}

/**
 * Format chalan text nicely for WhatsApp, SMS, Messenger, or Clipboard (Single clean line per row)
 */
export function formatChalanShareText(chalan: SupplierChalan, shopProfile: ShopProfile, useBengali: boolean): string {
  const lines: string[] = [];

  lines.push(`🏢 *${shopProfile.name}*`);
  if (shopProfile.tagline) {
    lines.push(`${shopProfile.tagline}`);
  }
  lines.push(`================================`);
  lines.push(`📄 *মহাজন চালান নং:* ${formatDisplayChalanNumber(chalan.chalanNumber, useBengali)}`);
  lines.push(`📅 *তারিখ:* ${chalan.formattedDate}`);
  lines.push(`👤 *মহাজন / খামারী:* ${chalan.supplierName}`);
  if (chalan.supplierPhone) {
    lines.push(`📱 *মোবাইল:* ${chalan.supplierPhone}`);
  }
  lines.push(`================================`);
  lines.push(`📦 *ডিম সরবরাহের বিবরণ:*`);

  if (chalan.redEggCount && chalan.redEggCount > 0) {
    const rate = chalan.redRatePerPiece 
      ? chalan.redRatePerPiece.toFixed(2) 
      : (((chalan.redRatePerHundred || 0) / 100).toFixed(2));
    lines.push(`• 🔴 লাল ডিম: ${toBengaliNumber(chalan.redEggCount, useBengali)} পিস @ ৳${toBengaliNumber(rate, useBengali)} = ৳${toBengaliNumber(chalan.redTotalAmount || 0, useBengali)}`);
  }

  if (chalan.whiteEggCount && chalan.whiteEggCount > 0) {
    const rate = chalan.whiteRatePerPiece 
      ? chalan.whiteRatePerPiece.toFixed(2) 
      : (((chalan.whiteRatePerHundred || 0) / 100).toFixed(2));
    lines.push(`• ⚪ সাদা ডিম: ${toBengaliNumber(chalan.whiteEggCount, useBengali)} পিস @ ৳${toBengaliNumber(rate, useBengali)} = ৳${toBengaliNumber(chalan.whiteTotalAmount || 0, useBengali)}`);
  }

  if (!chalan.redEggCount && !chalan.whiteEggCount) {
    const rate = ((chalan.ratePerHundred || 0) / 100).toFixed(2);
    lines.push(`• 🥚 ${chalan.eggType || 'ডিম'}: ${toBengaliNumber(chalan.eggCount, useBengali)} পিস @ ৳${toBengaliNumber(rate, useBengali)} = ৳${toBengaliNumber(chalan.totalAmount, useBengali)}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`🥚 *সর্বমোট ডিম:* ${toBengaliNumber(chalan.eggCount, useBengali)} পিস`);
  lines.push(`💵 *চালানের মূল্য:* ${toBnCurrency(chalan.totalAmount, useBengali)}`);

  if ((chalan.previousDue || 0) > 0) {
    lines.push(`⏳ *পূর্বের বকেয়া দেনা:* +${toBnCurrency(chalan.previousDue || 0, useBengali)}`);
  }

  const totalDemand = chalan.totalDemand || (chalan.totalAmount + (chalan.previousDue || 0));
  lines.push(`📌 *সর্বমোট দেনা দাবি:* ${toBnCurrency(totalDemand, useBengali)}`);
  lines.push(`💰 *পরিশোধ করা হয়েছে:* -${toBnCurrency(chalan.paidAmount || 0, useBengali)}`);

  const currentRemDue = chalan.remainingDue !== undefined ? chalan.remainingDue : chalan.dueAmount;
  if (currentRemDue > 0) {
    lines.push(`⚠️ *মহাজনের অবশিষ্ট পাওনা:* ${toBnCurrency(currentRemDue, useBengali)}`);
  } else {
    lines.push(`✅ *পরিশোধ স্থিতি:* সম্পূর্ণ পরিশোধিত`);
  }

  if (chalan.note) {
    lines.push(`📝 *মন্তব্য:* ${chalan.note}`);
  }

  lines.push(`================================`);
  if (shopProfile.proprietor) lines.push(`প্রোঃ ${shopProfile.proprietor}`);
  if (shopProfile.mobile) lines.push(`মোবাইল: ${shopProfile.mobile}`);
  if (shopProfile.address) lines.push(`📍 ${shopProfile.address}`);

  return lines.join('\n');
}

/**
 * Format a reminder (tagada) message
 */
export function formatReminderText(memo: Memo, useBengali: boolean): string {
  if (memo.remainingDue <= 0) return `প্রিয় ${memo.partyName}, আপনার বকেয়া এখন পরিশোধিত। ধন্যবাদ!`;

  return `প্রিয় ${memo.partyName},
আপনার নিকট ডিমের আড়তের হিসাব অনুযায়ী মোট বকেয়া ${toBnCurrency(memo.remainingDue, useBengali)} টাকা।
অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হলো।

ধন্যবাদান্তে,
আপনার আড়ত।`;
}

/**
 * Generate a PNG Data URL of the DOM element with zero overlapping and crystal clear font rendering
 */
export async function generateElementPngDataUrl(elementId: string): Promise<string | null> {
  try {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn('Font loading wait warning:', fontErr);
      }
    }

    const element =
      document.getElementById(elementId) ||
      document.getElementById('printable-chalan-paper') ||
      document.getElementById('printable-voucher-paper') ||
      document.getElementById('printable-memo-content');

    if (!element) {
      console.warn(`Element #${elementId} not found`);
      return null;
    }

    const targetWidth = '520px';

    return await toPng(element, {
      quality: 1.0,
      pixelRatio: 3.0,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        width: targetWidth,
        maxWidth: targetWidth,
        minWidth: targetWidth,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        lineHeight: '1.7',
        letterSpacing: '0.01em',
        boxSizing: 'border-box',
      },
    });
  } catch (err) {
    console.error('Error generating PNG data URL:', err);
    return null;
  }
}

/**
 * Generate a PNG File from DOM element for sharing via Web Share API
 */
export async function generateMemoImageFile(elementId: string, fileName: string): Promise<File | null> {
  try {
    const dataUrl = await generateElementPngDataUrl(elementId);
    if (!dataUrl) return null;

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], `${fileName}.png`, { type: 'image/png' });
  } catch (err) {
    console.error('Failed to convert DOM to File:', err);
    return null;
  }
}

/**
 * Trigger download of DOM element as high-definition PNG
 */
export async function downloadElementAsImage(
  elementId: string,
  fileName: string,
  onProgress?: (isProcessing: boolean) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress(true);

    const dataUrl = await generateElementPngDataUrl(elementId);
    if (!dataUrl) {
      throw new Error(`Could not generate data URL for #${elementId}`);
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onProgress) onProgress(false);
    return true;
  } catch (error) {
    console.error('Failed to download image:', error);
    if (onProgress) onProgress(false);
    return false;
  }
}

/**
 * Direct Native Share to ANY app (WhatsApp, Messenger, IMO, Telegram, Bluetooth, etc.)
 * Strictly shares image file only without any text when imageOnly is true.
 */
export async function shareMemoAnywhere(options: {
  title?: string;
  text?: string;
  fileName?: string;
  elementId?: string;
  imageOnly?: boolean;
  onProgress?: (inProgress: boolean) => void;
}): Promise<{ success: boolean; method: 'image-share' | 'download' | 'text-share' | 'clipboard' | 'cancelled' }> {
  const { title, text, fileName = 'Memo', elementId, imageOnly = true, onProgress } = options;

  if (onProgress) onProgress(true);

  // Attempt 1: Native Share WITH IMAGE FILE ONLY (No text attached)
  if (elementId && navigator.share) {
    try {
      const file = await generateMemoImageFile(elementId, fileName);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
        if (onProgress) onProgress(false);
        return { success: true, method: 'image-share' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        if (onProgress) onProgress(false);
        return { success: false, method: 'cancelled' };
      }
      console.warn('Image share failed or not allowed:', err);
    }
  }

  // If imageOnly is true, DO NOT fall back to text share; download image directly instead!
  if (imageOnly && elementId) {
    try {
      const downloaded = await downloadElementAsImage(elementId, fileName);
      if (onProgress) onProgress(false);
      return { success: downloaded, method: 'download' };
    } catch (downloadErr) {
      console.error('Download fallback failed:', downloadErr);
    }
  }

  // Fallback only if imageOnly is false
  if (!imageOnly && text && navigator.share) {
    try {
      await navigator.share({
        title: title || 'Memo',
        text,
      });
      if (onProgress) onProgress(false);
      return { success: true, method: 'text-share' };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        if (onProgress) onProgress(false);
        return { success: false, method: 'cancelled' };
      }
    }
  }

  if (onProgress) onProgress(false);
  return { success: false, method: 'cancelled' };
}

/**
 * Universal Native Share helper
 */
export async function shareUniversal(options: {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return false;
      console.warn('Native share error, falling back:', err);
      return false;
    }
  }
  return false;
}
