// Distinct, attractive color themes for parties, memos, and chalans
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
    boxBg: 'bg-indigo-50/50 dark:bg-indigo-950/30',
    hoverBorder: 'hover:border-indigo-500 dark:hover:border-indigo-400',
    nameColor: 'text-indigo-950 dark:text-indigo-100',
    nameBadge: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    memoNumBadge: 'bg-indigo-600 text-white font-extrabold',
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
    boxBg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-400',
    nameColor: 'text-emerald-950 dark:text-emerald-100',
    nameBadge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    memoNumBadge: 'bg-emerald-600 text-white font-extrabold',
    subtleAccent: 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-900 dark:text-emerald-300',
    headerBar: 'from-emerald-700 via-teal-600 to-emerald-800',
  },
  // 3. Vibrant Amber / Golden Honey
  {
    id: 'amber',
    avatarGradient: 'from-amber-500 via-yellow-600 to-amber-700',
    borderLeft: 'border-l-amber-500',
    border: 'border-amber-200 dark:border-amber-800/80',
    boxBg: 'bg-amber-50/50 dark:bg-amber-950/30',
    hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-400',
    nameColor: 'text-amber-950 dark:text-amber-100',
    nameBadge: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    memoNumBadge: 'bg-amber-600 text-white font-extrabold',
    subtleAccent: 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    accentText: 'text-amber-900 dark:text-amber-300',
    headerBar: 'from-amber-600 via-yellow-600 to-amber-700',
  },
  // 4. Royal Purple / Violet
  {
    id: 'purple',
    avatarGradient: 'from-purple-600 via-violet-600 to-purple-700',
    borderLeft: 'border-l-purple-600',
    border: 'border-purple-200 dark:border-purple-800/80',
    boxBg: 'bg-purple-50/50 dark:bg-purple-950/30',
    hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-400',
    nameColor: 'text-purple-950 dark:text-purple-100',
    nameBadge: 'bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    memoNumBadge: 'bg-purple-600 text-white font-extrabold',
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
    boxBg: 'bg-rose-50/50 dark:bg-rose-950/30',
    hoverBorder: 'hover:border-rose-500 dark:hover:border-rose-400',
    nameColor: 'text-rose-950 dark:text-rose-100',
    nameBadge: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    memoNumBadge: 'bg-rose-600 text-white font-extrabold',
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
    boxBg: 'bg-cyan-50/50 dark:bg-cyan-950/30',
    hoverBorder: 'hover:border-cyan-500 dark:hover:border-cyan-400',
    nameColor: 'text-cyan-950 dark:text-cyan-100',
    nameBadge: 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    memoNumBadge: 'bg-cyan-700 text-white font-extrabold',
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
    boxBg: 'bg-sky-50/50 dark:bg-sky-950/30',
    hoverBorder: 'hover:border-sky-500 dark:hover:border-sky-400',
    nameColor: 'text-sky-950 dark:text-sky-100',
    nameBadge: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    memoNumBadge: 'bg-sky-600 text-white font-extrabold',
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
    boxBg: 'bg-orange-50/50 dark:bg-orange-950/30',
    hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-400',
    nameColor: 'text-orange-950 dark:text-orange-100',
    nameBadge: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    memoNumBadge: 'bg-orange-600 text-white font-extrabold',
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
    boxBg: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/30',
    hoverBorder: 'hover:border-fuchsia-500 dark:hover:border-fuchsia-400',
    nameColor: 'text-fuchsia-950 dark:text-fuchsia-100',
    nameBadge: 'bg-fuchsia-100 text-fuchsia-950 dark:bg-fuchsia-950 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-700',
    memoNumBadge: 'bg-fuchsia-600 text-white font-extrabold',
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
    boxBg: 'bg-teal-50/50 dark:bg-teal-950/30',
    hoverBorder: 'hover:border-teal-500 dark:hover:border-teal-400',
    nameColor: 'text-teal-950 dark:text-teal-100',
    nameBadge: 'bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    memoNumBadge: 'bg-teal-700 text-white font-extrabold',
    subtleAccent: 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    accentText: 'text-teal-900 dark:text-teal-300',
    headerBar: 'from-teal-600 via-emerald-600 to-cyan-700',
  },
  // 11. Blue / Cobalt
  {
    id: 'blue',
    avatarGradient: 'from-blue-600 via-indigo-500 to-blue-700',
    borderLeft: 'border-l-blue-600',
    border: 'border-blue-200 dark:border-blue-800/80',
    boxBg: 'bg-blue-50/50 dark:bg-blue-950/30',
    hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-400',
    nameColor: 'text-blue-950 dark:text-blue-100',
    nameBadge: 'bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    memoNumBadge: 'bg-blue-600 text-white font-extrabold',
    subtleAccent: 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    accentText: 'text-blue-900 dark:text-blue-300',
    headerBar: 'from-blue-600 via-indigo-600 to-blue-800',
  },
  // 12. Lime / Leaf Green
  {
    id: 'lime',
    avatarGradient: 'from-lime-600 via-emerald-600 to-green-700',
    borderLeft: 'border-l-lime-600',
    border: 'border-lime-200 dark:border-lime-800/80',
    boxBg: 'bg-lime-50/50 dark:bg-lime-950/30',
    hoverBorder: 'hover:border-lime-500 dark:hover:border-lime-400',
    nameColor: 'text-lime-950 dark:text-lime-100',
    nameBadge: 'bg-lime-100 text-lime-950 dark:bg-lime-950 dark:text-lime-200 border-lime-300 dark:border-lime-700',
    memoNumBadge: 'bg-lime-700 text-white font-extrabold',
    subtleAccent: 'bg-lime-50/80 dark:bg-lime-950/50 border-lime-200 dark:border-lime-800',
    accentText: 'text-lime-900 dark:text-lime-300',
    headerBar: 'from-lime-600 via-emerald-600 to-green-700',
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

/**
 * Deterministically get a distinct color theme for any memo or chalan card.
 * Gives each memo/chalan box an individual distinctive color palette!
 */
export function getMemoColorTheme(memoNumber?: string, partyName?: string, partyId?: string): PartyColorTheme {
  const seed = `${memoNumber || ''}_${partyName || ''}_${partyId || ''}`.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PARTY_THEMES.length;
  return PARTY_THEMES[index];
}

