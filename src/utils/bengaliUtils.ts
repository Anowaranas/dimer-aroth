const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toBengaliNumber(num: number | string | undefined | null, useBengali = true): string {
  if (num === undefined || num === null) return useBengali ? '০' : '0';
  
  // Format with thousand separator
  let str: string;
  if (typeof num === 'number') {
    str = Number.isInteger(num) 
      ? num.toLocaleString('en-US') 
      : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  } else {
    str = num.toString();
  }

  if (!useBengali) return str;

  return str.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

export function toBnCurrency(num: number | string | undefined | null, useBengali = true): string {
  return `৳\u00A0${toBengaliNumber(num, useBengali)}`;
}

export function parseBengaliToNumber(str: string | number | undefined | null): number {
  if (str === undefined || str === null || str === '') return 0;
  let normalized = str.toString();
  for (let i = 0; i < 10; i++) {
    normalized = normalized.split(bnDigits[i]).join(enDigits[i]);
  }
  normalized = normalized.replace(/[^0-9.-]/g, '');
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

/**
 * Convert any string containing English digits (0-9) to Bengali digits (০-৯).
 * Also cleans out invalid characters for numbers, preserving decimal points.
 */
export function convertEnToBnDigits(str: string | number | undefined | null, allowDecimal = true): string {
  if (str === undefined || str === null) return '';
  let s = str.toString();
  if (allowDecimal) {
    s = s.replace(/,/g, '.');
  }
  // Replace 0-9 with ০-৯
  const converted = s.replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
  if (allowDecimal) {
    let hasDot = false;
    let result = '';
    for (const char of converted) {
      if (bnDigits.includes(char)) {
        result += char;
      } else if (char === '.' && !hasDot) {
        hasDot = true;
        result += '.';
      }
    }
    return result;
  } else {
    return converted.replace(/[^০-৯]/g, '');
  }
}

/**
 * Convert any string containing Bengali digits (০-৯) to English digits (0-9).
 */
export function convertBnToEnDigits(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let res = str.toString();
  for (let i = 0; i < 10; i++) {
    res = res.split(bnDigits[i]).join(enDigits[i]);
  }
  return res;
}

export const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function getBengaliDateString(dateObj: Date = new Date(), useBengali = true): string {
  const day = dateObj.getDate();
  const month = BENGALI_MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const dayStr = toBengaliNumber(day, useBengali);
  const yearStr = toBengaliNumber(year, useBengali);
  return `${dayStr} ${month}, ${yearStr}`;
}

export function getTodayDateInputValue(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function getYesterdayDateInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function getBengaliDateFromInput(dateStr: string, useBengali = true): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, monthIndex, day);
    return getBengaliDateString(d, useBengali);
  }
  return dateStr;
}

export const BENGALI_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export function getDayOfWeekBn(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, monthIndex, day);
    return BENGALI_DAYS[d.getDay()] || '';
  }
  return '';
}

export function formatShortDateBn(dateStr: string, useBengali = true): string {
  if (!dateStr) return '';
  // if format is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const month = parts[1];
    const year = parts[0];
    const formatted = `${day}/${month}/${year}`;
    return toBengaliNumber(formatted, useBengali);
  }
  return dateStr;
}

const BN_NUM_WORDS: { [key: number]: string } = {
  0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ',
  6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
  11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো',
  16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
  21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ',
  26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'ঊনত্রিশ', 30: 'ত্রিশ',
  31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ',
  36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'ঊনচল্লিশ', 40: 'চল্লিশ',
  41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ',
  46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'ঊনপঞ্চাশ', 50: 'পঞ্চাশ',
  51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন',
  56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'ঊনষাট', 60: 'ষাট',
  61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি',
  66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'ঊনসত্তর', 70: 'সত্তর',
  71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিহাত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর',
  76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'ঊনআশি', 80: 'আশি',
  81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি',
  86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'আটাশি', 89: 'ঊননব্বই', 90: 'নব্বই',
  91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই',
  96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
};

function convertTwoDigits(n: number): string {
  if (n <= 0) return '';
  if (BN_NUM_WORDS[n]) return BN_NUM_WORDS[n];
  return n.toString();
}

/**
 * Convert any taka amount to Bengali words
 * e.g. 11700 -> "এগারো হাজার সাতশত টাকা মাত্র"
 */
export function toBengaliWords(num: number): string {
  if (!num || num <= 0) return 'শূন্য টাকা মাত্র';

  const rounded = Math.round(num);
  let remaining = rounded;
  const parts: string[] = [];

  // কোটি (Crore = 10,000,000)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    parts.push(`${toBengaliWords(crore).replace(' টাকা মাত্র', '')} কোটি`);
  }

  // লাখ (Lakh = 100,000)
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    parts.push(`${convertTwoDigits(lakh)} লাখ`);
  }

  // হাজার (Thousand = 1,000)
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    parts.push(`${convertTwoDigits(thousand)} হাজার`);
  }

  // শত (Hundred = 100)
  if (remaining >= 100) {
    const hundred = Math.floor(remaining / 100);
    remaining %= 100;
    parts.push(`${convertTwoDigits(hundred)} শত`);
  }

  // 1-99
  if (remaining > 0) {
    parts.push(convertTwoDigits(remaining));
  }

  return `${parts.join(' ')} টাকা মাত্র`;
}

/**
 * Calculates the next sequential memo number starting from 1.
 * Inspects all existing memos, parses their sequence, and returns max + 1 (or 1 if none exist).
 */
export function getNextMemoSequenceNumber(memos: { memoNumber?: string; id?: string }[]): number {
  if (!memos || memos.length === 0) return 1;
  let max = 0;
  for (const m of memos) {
    if (!m.memoNumber) continue;
    // Strip hash and non-digits
    const cleanStr = m.memoNumber.replace(/^#+/, '').replace(/[^0-9০-৯]/g, '');
    const val = parseBengaliToNumber(cleanStr);
    // Disregard legacy timestamps or random values over 50,000
    if (!isNaN(val) && val > 0 && val < 50000) {
      if (val > max) max = val;
    }
  }
  if (max === 0) {
    return memos.length + 1;
  }
  return max + 1;
}

/**
 * Format memo number cleanly without mixing Bengali and English digits.
 * Guaranteed no duplicate '#' and consistent numeral system based on useBengali flag.
 */
export function formatDisplayMemoNumber(memoNumber: string | number | undefined | null, useBengali = true): string {
  if (memoNumber === undefined || memoNumber === null || memoNumber === '') {
    return useBengali ? '#১' : '#1';
  }
  let str = memoNumber.toString().trim();
  // Remove all leading '#'
  str = str.replace(/^#+/, '').trim();

  // If it's a numeric string, parse and format with appropriate numerals
  const parsed = parseBengaliToNumber(str);
  if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
    return `#${toBengaliNumber(parsed, useBengali)}`;
  }

// If it contains mixed digits or text, normalize all digits consistently
  if (useBengali) {
    return `#${convertEnToBnDigits(str)}`;
  } else {
    return `#${convertBnToEnDigits(str)}`;
  }
}

/**
 * Calculates the next sequential chalan number starting from 1 (১, ২, ৩...).
 * Inspects all existing chalans, parses their sequence, and returns max + 1 (or 1 if none exist).
 */
export function getNextChalanSequenceNumber(chalans: { chalanNumber?: string; id?: string }[]): number {
  if (!chalans || chalans.length === 0) return 1;
  let max = 0;
  for (const c of chalans) {
    if (!c.chalanNumber) continue;
    const cleanStr = c.chalanNumber.replace(/^#+/, '').replace(/^CH-?/i, '').replace(/[^0-9০-৯]/g, '');
    const val = parseBengaliToNumber(cleanStr);
    if (!isNaN(val) && val > 0 && val < 50000) {
      if (val > max) max = val;
    }
  }
  return max + 1;
}

/**
 * Format chalan number cleanly starting from 1 (e.g. #১, #২).
 */
export function formatDisplayChalanNumber(chalanNumber: string | number | undefined | null, useBengali = true): string {
  if (chalanNumber === undefined || chalanNumber === null || chalanNumber === '') {
    return useBengali ? '#১' : '#1';
  }
  let str = chalanNumber.toString().trim();
  str = str.replace(/^#+/, '').replace(/^CH-?/i, '').trim();

  const parsed = parseBengaliToNumber(str);
  if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
    return `#${toBengaliNumber(parsed, useBengali)}`;
  }

  if (useBengali) {
    return `#${convertEnToBnDigits(str)}`;
  } else {
    return `#${convertBnToEnDigits(str)}`;
  }
}

/**
 * Sorts memos so the calculation/memo done last is ALWAYS at the very top (descending by exact timestamp, then date, then serial).
 */
export function compareMemosDesc(
  a: { date?: string; createdAt?: string; updatedAt?: string; memoNumber?: string },
  b: { date?: string; createdAt?: string; updatedAt?: string; memoNumber?: string }
): number {
  // 1. Primary: Compare by exact latest timestamp (the calculation done last is on top)
  const timeA = Math.max(
    a.updatedAt ? new Date(a.updatedAt).getTime() : 0,
    a.createdAt ? new Date(a.createdAt).getTime() : 0
  );
  const timeB = Math.max(
    b.updatedAt ? new Date(b.updatedAt).getTime() : 0,
    b.createdAt ? new Date(b.createdAt).getTime() : 0
  );
  if (timeA && timeB && timeA !== timeB) {
    return timeB - timeA;
  }
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;

  // 2. Secondary: If timestamps are same or missing, compare by date (YYYY-MM-DD)
  const dateA = a.date || '';
  const dateB = b.date || '';
  if (dateA && dateB && dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }

  // 3. Tertiary: Compare by memoNumber numerically
  const cleanA = (a.memoNumber || '').replace(/[^0-9০-৯]/g, '');
  const cleanB = (b.memoNumber || '').replace(/[^0-9০-৯]/g, '');
  const numA = cleanA ? parseBengaliToNumber(cleanA) : NaN;
  const numB = cleanB ? parseBengaliToNumber(cleanB) : NaN;
  if (!isNaN(numA) && !isNaN(numB) && numA > 0 && numB > 0 && numA !== numB) {
    return numB - numA;
  }

  return (b.memoNumber || '').localeCompare(a.memoNumber || '');
}

/**
 * Sorts supplier chalans so the calculation/chalan done last is ALWAYS at the very top (descending by exact timestamp, then date, then serial).
 */
export function compareChalansDesc(
  a: { date?: string; createdAt?: string; updatedAt?: string; chalanNumber?: string },
  b: { date?: string; createdAt?: string; updatedAt?: string; chalanNumber?: string }
): number {
  // 1. Primary: Compare by exact latest timestamp (the calculation done last is on top)
  const timeA = Math.max(
    a.updatedAt ? new Date(a.updatedAt).getTime() : 0,
    a.createdAt ? new Date(a.createdAt).getTime() : 0
  );
  const timeB = Math.max(
    b.updatedAt ? new Date(b.updatedAt).getTime() : 0,
    b.createdAt ? new Date(b.createdAt).getTime() : 0
  );
  if (timeA && timeB && timeA !== timeB) {
    return timeB - timeA;
  }
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;

  // 2. Secondary: If timestamps are same or missing, compare by date (YYYY-MM-DD)
  const dateA = a.date || '';
  const dateB = b.date || '';
  if (dateA && dateB && dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }

  // 3. Tertiary: Compare by chalanNumber numerically
  const cleanA = (a.chalanNumber || '').replace(/[^0-9০-৯]/g, '');
  const cleanB = (b.chalanNumber || '').replace(/[^0-9০-৯]/g, '');
  const numA = cleanA ? parseBengaliToNumber(cleanA) : NaN;
  const numB = cleanB ? parseBengaliToNumber(cleanB) : NaN;
  if (!isNaN(numA) && !isNaN(numB) && numA > 0 && numB > 0 && numA !== numB) {
    return numB - numA;
  }

  return (b.chalanNumber || '').localeCompare(a.chalanNumber || '');
}

/**
 * Sorts parties so that whichever party had the last calculation, memo, payment or update appears at the very top.
 */
export function comparePartiesByRecentActivity(
  a: { id: string; name: string; createdAt?: string; updatedAt?: string; currentDue?: number },
  b: { id: string; name: string; createdAt?: string; updatedAt?: string; currentDue?: number },
  memos: { partyId?: string; partyName?: string; createdAt?: string; updatedAt?: string; date?: string }[] = []
): number {
  // Find latest memo timestamp for party A
  const matchA = memos.filter(m => m.partyId === a.id || (m.partyName && m.partyName.trim().toLowerCase() === a.name.trim().toLowerCase()));
  const latestMemoTimeA = matchA.length > 0 ? Math.max(...matchA.map(m => new Date(m.updatedAt || m.createdAt || m.date || 0).getTime() || 0)) : 0;

  // Find latest memo timestamp for party B
  const matchB = memos.filter(m => m.partyId === b.id || (m.partyName && m.partyName.trim().toLowerCase() === b.name.trim().toLowerCase()));
  const latestMemoTimeB = matchB.length > 0 ? Math.max(...matchB.map(m => new Date(m.updatedAt || m.createdAt || m.date || 0).getTime() || 0)) : 0;

  const timeA = Math.max(
    latestMemoTimeA,
    a.updatedAt ? new Date(a.updatedAt).getTime() : 0,
    a.createdAt ? new Date(a.createdAt).getTime() : 0
  );
  const timeB = Math.max(
    latestMemoTimeB,
    b.updatedAt ? new Date(b.updatedAt).getTime() : 0,
    b.createdAt ? new Date(b.createdAt).getTime() : 0
  );

  if (timeA !== timeB) {
    return timeB - timeA;
  }
  return (b.currentDue || 0) - (a.currentDue || 0);
}

/**
 * Sorts suppliers so that whichever supplier had the last calculation, chalan, payment or update appears at the very top.
 */
export function compareSuppliersByRecentActivity(
  a: { id: string; name: string; createdAt?: string; updatedAt?: string; totalPayable?: number },
  b: { id: string; name: string; createdAt?: string; updatedAt?: string; totalPayable?: number },
  chalans: { supplierId?: string; supplierName?: string; createdAt?: string; updatedAt?: string; date?: string }[] = []
): number {
  // Find latest chalan timestamp for supplier A
  const matchA = chalans.filter(c => c.supplierId === a.id || (c.supplierName && c.supplierName.trim().toLowerCase() === a.name.trim().toLowerCase()));
  const latestChalanTimeA = matchA.length > 0 ? Math.max(...matchA.map(c => new Date(c.updatedAt || c.createdAt || c.date || 0).getTime() || 0)) : 0;

  // Find latest chalan timestamp for supplier B
  const matchB = chalans.filter(c => c.supplierId === b.id || (c.supplierName && c.supplierName.trim().toLowerCase() === b.name.trim().toLowerCase()));
  const latestChalanTimeB = matchB.length > 0 ? Math.max(...matchB.map(c => new Date(c.updatedAt || c.createdAt || c.date || 0).getTime() || 0)) : 0;

  const timeA = Math.max(
    latestChalanTimeA,
    a.updatedAt ? new Date(a.updatedAt).getTime() : 0,
    a.createdAt ? new Date(a.createdAt).getTime() : 0
  );
  const timeB = Math.max(
    latestChalanTimeB,
    b.updatedAt ? new Date(b.updatedAt).getTime() : 0,
    b.createdAt ? new Date(b.createdAt).getTime() : 0
  );

  if (timeA !== timeB) {
    return timeB - timeA;
  }
  return (b.totalPayable || 0) - (a.totalPayable || 0);
}

