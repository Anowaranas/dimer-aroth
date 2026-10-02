// Distinct, attractive color themes for parties and memos
export interface PartyColorTheme {
  id: string;
  avatarGradient: string;
  borderLeft: string;
  border: string;
  boxBg: string;
  hoverBorder: string;
  nameColor: string;
  nameBadge: string;
  memoNumBadge: string;
  subtleAccent: string;
  accentText: string;
  headerBar: string;
}

export const PARTY_THEMES: PartyColorTheme[] = [
  // 1. Royal Indigo / Blue
  {
    id: 'indigo',
    avatarGradient: 'from-blue-600 via-indigo-600 to-indigo-700',
    borderLeft: 'border-l-indigo-600',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    boxBg: 'bg-indigo-50/40 dark:bg-indigo-950/25',
    hoverBorder: 'hover:border-indigo-500 dark:hover:border-indigo-400',
    nameColor: 'text-indigo-950 dark:text-indigo-100',
    nameBadge: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    memoNumBadge: 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white',
    subtleAccent: 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    accentText: 'text-indigo-900 dark:text-indigo-300',
    headerBar: 'from-blue-700 via-indigo-600 to-indigo-800',
  },
  // 2. Forest Emerald / Teal Green
  {
    id: 'emerald',
    avatarGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    borderLeft: 'border-l-emerald-600',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    boxBg: 'bg-emerald-50/40 dark:bg-emerald-950/25',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-400',
    nameColor: 'text-emerald-950 dark:text-emerald-100',
    nameBadge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    memoNumBadge: 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white',
    subtleAccent: 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-900 dark:text-emerald-300',
    headerBar: 'from-emerald-700 via-teal-600 to-emerald-800',
  },
  // 3. Cyan / Teal
  {
    id: 'cyan',
    avatarGradient: 'from-cyan-600 via-sky-600 to-blue-700',
    borderLeft: 'border-l-cyan-500',
    border: 'border-cyan-200 dark:border-cyan-800/80',
    boxBg: 'bg-cyan-50/40 dark:bg-cyan-950/25',
    hoverBorder: 'hover:border-cyan-500 dark:hover:border-cyan-400',
    nameColor: 'text-cyan-950 dark:text-cyan-100',
    nameBadge: 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    memoNumBadge: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
    subtleAccent: 'bg-cyan-50/80 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    accentText: 'text-cyan-900 dark:text-cyan-300',
    headerBar: 'from-cyan-600 via-sky-600 to-blue-700',
  },
  // 4. Royal Purple / Violet
  {
    id: 'purple',
    avatarGradient: 'from-purple-600 via-violet-600 to-purple-700',
    borderLeft: 'border-l-purple-600',
    border: 'border-purple-200 dark:border-purple-800/80',
    boxBg: 'bg-purple-50/40 dark:bg-purple-950/25',
    hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-400',
    nameColor: 'text-purple-950 dark:text-purple-100',
    nameBadge: 'bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    memoNumBadge: 'bg-gradient-to-r from-purple-700 to-violet-700 text-white',
    subtleAccent: 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    accentText: 'text-purple-900 dark:text-purple-300',
    headerBar: 'from-purple-700 via-violet-600 to-purple-800',
  },
  // 5. Rose / Crimson
  {
    id: 'rose',
    avatarGradient: 'from-rose-600 via-pink-600 to-rose-700',
    borderLeft: 'border-l-rose-600',
    border: 'border-rose-200 dark:border-rose-800/80',
    boxBg: 'bg-rose-50/40 dark:bg-rose-950/25',
    hoverBorder: 'hover:border-rose-500 dark:hover:border-rose-400',
    nameColor: 'text-rose-950 dark:text-rose-100',
    nameBadge: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    memoNumBadge: 'bg-gradient-to-r from-rose-600 to-pink-700 text-white',
    subtleAccent: 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    accentText: 'text-rose-900 dark:text-rose-300',
    headerBar: 'from-rose-600 via-pink-600 to-rose-700',
  },
  // 6. Deep Cyan / Marine
  {
    id: 'cyan',
    avatarGradient: 'from-cyan-600 via-teal-600 to-blue-600',
    borderLeft: 'border-l-cyan-600',
    border: 'border-cyan-200 dark:border-cyan-800/80',
    boxBg: 'bg-cyan-50/40 dark:bg-cyan-950/25',
    hoverBorder: 'hover:border-cyan-500 dark:hover:border-cyan-400',
    nameColor: 'text-cyan-950 dark:text-cyan-100',
    nameBadge: 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    memoNumBadge: 'bg-gradient-to-r from-cyan-700 to-blue-700 text-white',
    subtleAccent: 'bg-cyan-50/80 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    accentText: 'text-cyan-900 dark:text-cyan-300',
    headerBar: 'from-cyan-600 via-teal-600 to-blue-700',
  },
  // 7. Sky Blue / Azure
  {
    id: 'sky',
    avatarGradient: 'from-sky-600 via-blue-600 to-indigo-600',
    borderLeft: 'border-l-sky-600',
    border: 'border-sky-200 dark:border-sky-800/80',
    boxBg: 'bg-sky-50/40 dark:bg-sky-950/25',
    hoverBorder: 'hover:border-sky-500 dark:hover:border-sky-400',
    nameColor: 'text-sky-950 dark:text-sky-100',
    nameBadge: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    memoNumBadge: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white',
    subtleAccent: 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
    accentText: 'text-sky-900 dark:text-sky-300',
    headerBar: 'from-sky-600 via-blue-600 to-indigo-700',
  },
  // 8. Vivid Orange / Coral
  {
    id: 'orange',
    avatarGradient: 'from-orange-600 via-amber-600 to-red-600',
    borderLeft: 'border-l-orange-600',
    border: 'border-orange-200 dark:border-orange-800/80',
    boxBg: 'bg-orange-50/40 dark:bg-orange-950/25',
    hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-400',
    nameColor: 'text-orange-950 dark:text-orange-100',
    nameBadge: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    memoNumBadge: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
    subtleAccent: 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
    accentText: 'text-orange-900 dark:text-orange-300',
    headerBar: 'from-orange-600 via-amber-600 to-red-600',
  },
  // 9. Fuchsia / Magenta
  {
    id: 'fuchsia',
    avatarGradient: 'from-fuchsia-600 via-pink-600 to-purple-600',
    borderLeft: 'border-l-fuchsia-600',
    border: 'border-fuchsia-200 dark:border-fuchsia-800/80',
    boxBg: 'bg-fuchsia-50/40 dark:bg-fuchsia-950/25',
    hoverBorder: 'hover:border-fuchsia-500 dark:hover:border-fuchsia-400',
    nameColor: 'text-fuchsia-950 dark:text-fuchsia-100',
    nameBadge: 'bg-fuchsia-100 text-fuchsia-950 dark:bg-fuchsia-950 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-700',
    memoNumBadge: 'bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white',
    subtleAccent: 'bg-fuchsia-50/80 dark:bg-fuchsia-950/50 border-fuchsia-200 dark:border-fuchsia-800',
    accentText: 'text-fuchsia-900 dark:text-fuchsia-300',
    headerBar: 'from-fuchsia-600 via-pink-600 to-purple-700',
  },
  // 10. Teal / Jade
  {
    id: 'teal',
    avatarGradient: 'from-teal-600 via-emerald-600 to-cyan-700',
    borderLeft: 'border-l-teal-600',
    border: 'border-teal-200 dark:border-teal-800/80',
    boxBg: 'bg-teal-50/40 dark:bg-teal-950/25',
    hoverBorder: 'hover:border-teal-500 dark:hover:border-teal-400',
    nameColor: 'text-teal-950 dark:text-teal-100',
    nameBadge: 'bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    memoNumBadge: 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white',
    subtleAccent: 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    accentText: 'text-teal-900 dark:text-teal-300',
    headerBar: 'from-teal-600 via-emerald-600 to-cyan-700',
  },
];

/**
 * Deterministically get a distinct color theme for any party name.
 * The same party will ALWAYS receive the exact same distinctive theme throughout the entire app.
 */
export function getPartyColorTheme(partyName?: string, partyId?: string): PartyColorTheme {
  const seed = (partyName?.trim() || partyId || 'default').toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PARTY_THEMES.length;
  return PARTY_THEMES[index];
}
