export interface DistinctCardColorTheme {
  id: string;
  name: string;
  border: string;
  borderL: string;
  cardBg: string;
  avatar: string;
  badge: string;
  nameText: string;
  chipBg: string;
  accentBar: string;
}

export const DISTINCT_CARD_THEMES: DistinctCardColorTheme[] = [
  // 1. Royal Blue & Indigo
  {
    id: 'blue',
    name: 'রয়্যাল ব্লু',
    border: 'border-blue-300 dark:border-blue-700/80',
    borderL: 'border-l-[6px] border-l-blue-600 dark:border-l-blue-500',
    cardBg: 'bg-gradient-to-r from-blue-50/80 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20',
    badge: 'bg-blue-600 text-white',
    nameText: 'text-blue-950 dark:text-blue-100 hover:text-blue-700 dark:hover:text-blue-300',
    chipBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    accentBar: 'bg-blue-600',
  },
  // 2. Emerald Green
  {
    id: 'emerald',
    name: 'পান্না সবুজ',
    border: 'border-emerald-300 dark:border-emerald-700/80',
    borderL: 'border-l-[6px] border-l-emerald-600 dark:border-l-emerald-500',
    cardBg: 'bg-gradient-to-r from-emerald-50/80 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/20',
    badge: 'bg-emerald-600 text-white',
    nameText: 'text-emerald-950 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-emerald-300',
    chipBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    accentBar: 'bg-emerald-600',
  },
  // 3. Sky Cyan & Teal
  {
    id: 'cyan',
    name: 'আকাশি সায়ান',
    border: 'border-cyan-300 dark:border-cyan-700/80',
    borderL: 'border-l-[6px] border-l-cyan-600 dark:border-l-cyan-500',
    cardBg: 'bg-gradient-to-r from-cyan-50/80 via-white to-white dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-cyan-500/20',
    badge: 'bg-cyan-600 text-white',
    nameText: 'text-cyan-950 dark:text-cyan-100 hover:text-cyan-700 dark:hover:text-cyan-300',
    chipBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
    accentBar: 'bg-cyan-600',
  },
  // 4. Purple & Violet
  {
    id: 'purple',
    name: 'রাজকীয় বেগুনী',
    border: 'border-purple-300 dark:border-purple-700/80',
    borderL: 'border-l-[6px] border-l-purple-600 dark:border-l-purple-500',
    cardBg: 'bg-gradient-to-r from-purple-50/80 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-purple-500/20',
    badge: 'bg-purple-600 text-white',
    nameText: 'text-purple-950 dark:text-purple-100 hover:text-purple-700 dark:hover:text-purple-300',
    chipBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    accentBar: 'bg-purple-600',
  },
  // 5. Rose & Crimson
  {
    id: 'rose',
    name: 'গোলাপী লাল',
    border: 'border-rose-300 dark:border-rose-700/80',
    borderL: 'border-l-[6px] border-l-rose-600 dark:border-l-rose-500',
    cardBg: 'bg-gradient-to-r from-rose-50/80 via-white to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-rose-600 to-pink-700 text-white shadow-rose-500/20',
    badge: 'bg-rose-600 text-white',
    nameText: 'text-rose-950 dark:text-rose-100 hover:text-rose-700 dark:hover:text-rose-300',
    chipBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    accentBar: 'bg-rose-600',
  },
  // 6. Cyan & Teal
  {
    id: 'cyan',
    name: 'সায়ান ও নীল',
    border: 'border-cyan-300 dark:border-cyan-700/80',
    borderL: 'border-l-[6px] border-l-cyan-600 dark:border-l-cyan-500',
    cardBg: 'bg-gradient-to-r from-cyan-50/80 via-white to-white dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-cyan-500/20',
    badge: 'bg-cyan-600 text-white',
    nameText: 'text-cyan-950 dark:text-cyan-100 hover:text-cyan-700 dark:hover:text-cyan-300',
    chipBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
    accentBar: 'bg-cyan-600',
  },
  // 7. Indigo & Violet
  {
    id: 'indigo',
    name: 'গাঢ় ইন্ডিগো',
    border: 'border-indigo-300 dark:border-indigo-700/80',
    borderL: 'border-l-[6px] border-l-indigo-600 dark:border-l-indigo-500',
    cardBg: 'bg-gradient-to-r from-indigo-50/80 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-indigo-500/20',
    badge: 'bg-indigo-600 text-white',
    nameText: 'text-indigo-950 dark:text-indigo-100 hover:text-indigo-700 dark:hover:text-indigo-300',
    chipBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    accentBar: 'bg-indigo-600',
  },
  // 8. Fuchsia / Magenta
  {
    id: 'fuchsia',
    name: 'ম্যাজেন্টা',
    border: 'border-fuchsia-300 dark:border-fuchsia-700/80',
    borderL: 'border-l-[6px] border-l-fuchsia-600 dark:border-l-fuchsia-500',
    cardBg: 'bg-gradient-to-r from-fuchsia-50/80 via-white to-white dark:from-fuchsia-950/40 dark:via-slate-900 dark:to-slate-900',
    avatar: 'bg-gradient-to-br from-fuchsia-600 to-pink-700 text-white shadow-fuchsia-500/20',
    badge: 'bg-fuchsia-600 text-white',
    nameText: 'text-fuchsia-950 dark:text-fuchsia-100 hover:text-fuchsia-700 dark:hover:text-fuchsia-300',
    chipBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-900 dark:text-fuchsia-200 border-fuchsia-200 dark:border-fuchsia-800',
    accentBar: 'bg-fuchsia-600',
  },
];

/**
 * Returns a deterministic distinctive color theme based on an index or string key (like party id, name, or memo number).
 */
export function getDistinctCardTheme(keyOrIndex: string | number): DistinctCardColorTheme {
  if (typeof keyOrIndex === 'number') {
    const idx = Math.abs(keyOrIndex) % DISTINCT_CARD_THEMES.length;
    return DISTINCT_CARD_THEMES[idx];
  }

  // Hash string to pick a stable color for the same party/memo
  let hash = 0;
  const str = String(keyOrIndex || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DISTINCT_CARD_THEMES.length;
  return DISTINCT_CARD_THEMES[idx];
}
