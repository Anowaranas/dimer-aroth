import React, { useState } from 'react';
import { Memo, Party } from '../types';
import { 
  toBengaliNumber, 
  toBnCurrency, 
  formatDisplayMemoNumber, 
  compareMemosDesc, 
  comparePartiesByRecentActivity,
  formatTypingNumber,
  parseBengaliToNumber
} from '../utils/bengaliUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { hapticCancel, hapticDelete, hapticSuccess } from '../utils/haptics';
import { AnimatedSearchBox } from './AnimatedSearchBox';

interface PartiesViewProps {
  parties: Party[];
  memos: Memo[];
  useBengali: boolean;
  onSelectPartyForSale: (party: Party) => void;
  onOpenPaymentModal: (party: Party) => void;
  onAddParty: (party: Omit<Party, 'id' | 'createdAt'>) => void;
  onDeleteParty: (partyId: string) => void;
  onViewMemoVoucher: (memo: Memo) => void;
  onOpenPartyDetails: (party: Party) => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  parties,
  memos,
  useBengali,
  onSelectPartyForSale,
  onOpenPaymentModal,
  onAddParty,
  onDeleteParty,
  onViewMemoVoucher,
  onOpenPartyDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);

  // New Party Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<Party['type']>('পাইকারি');
  const [newAddress, setNewAddress] = useState('');
  const [newInitialDue, setNewInitialDue] = useState<number>(0);
  const [newInitialDueStr, setNewInitialDueStr] = useState<string>('');

  const totalDueAmount = React.useMemo(() => {
    return parties.reduce((sum, p) => sum + (p.currentDue || 0), 0);
  }, [parties]);

  const partiesWithDue = React.useMemo(() => {
    return parties.filter((p) => (p.currentDue || 0) > 0);
  }, [parties]);

  const filteredParties = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [...parties].sort((a, b) => comparePartiesByRecentActivity(a, b, memos));
    }
    return parties
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(term);
        const matchPhone = p.phone.includes(term);
        return matchName || matchPhone;
      })
      .sort((a, b) => comparePartiesByRecentActivity(a, b, memos));
  }, [parties, searchTerm, memos]);

  const handleAddNewParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    hapticSuccess();
    onAddParty({
      name: newName.trim(),
      phone: newPhone.trim(),
      type: newType,
      address: newAddress.trim(),
      currentDue: Number(newInitialDue) || 0,
      notes: '',
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewInitialDue(0);
    setNewInitialDueStr('');
    setShowAddPartyModal(false);
  };

  return (
    <div id="parties-view-container" className="space-y-2.5 pb-16">

      {/* Action Bar with AnimatedSearchBox & "+ নতুন পার্টি" Button */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          <AnimatedSearchBox
            id="search-party-box"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="পার্টির নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            buttonText="খুঁজুন"
            compact={true}
            resultsCount={filteredParties.length}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddPartyModal(true)}
          className="text-xs font-black soft-btn-primary px-3.5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
        >
          <AddRoundedIcon className="w-4 h-4" />
          <span>নতুন পার্টি</span>
        </button>
      </div>

      {/* 3. Parties List - Responsive 1 column on phones, 2 columns on tablets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {filteredParties.map((party) => {
          const isExpanded = expandedPartyId === party.id;
          const hasDue = party.currentDue > 0;
          const partyMemos = memos
            .filter((m) => m.partyId === party.id)
            .sort(compareMemosDesc);
          const theme = getPartyColorTheme(party.name, party.id);

          const typeBadgeStyle = 
            party.type === 'পাইকারি' ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700' :
            party.type === 'হোটেল' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700' :
            'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700';

          return (
            <div
              key={party.id}
              className={`glass-card rounded-2xl p-3 border shadow-xs hover:shadow-md transition-all space-y-2.5 border-l-4 ${theme.borderLeft} ${theme.border} relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 pointer-events-none" />
              {/* Top Row: Avatar & Party Name, Type Badge, Due Badge */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div 
                    onClick={() => onOpenPartyDetails(party)}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-xs shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0`}
                    title="এই পার্টির সমস্ত মেমো ও খতিয়ান দেখুন"
                  >
                    {party.name.trim().charAt(0)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenPartyDetails(party)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold transition-all text-left shadow-2xs hover:scale-[1.01] active:scale-95 ${theme.nameBadge}`}
                    title="ক্লিক করে এই পার্টির খতিয়ান ও হিসাব দেখুন"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{party.name}</span>
                    <ArrowOutwardRoundedIcon className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </button>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold border shrink-0 ${typeBadgeStyle}`}>
                    {party.type}
                  </span>
                </div>

                {/* Right side: Due Badge */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className={`text-[10.5px] px-2 py-0.5 rounded-lg font-bold border whitespace-nowrap ${
                    hasDue
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {hasDue ? `বাকি: ${toBnCurrency(party.currentDue, useBengali)}` : '✓ পরিশোধ'}
                  </span>
                </div>
              </div>

              {/* Middle Row: Phone and Total Egg Purchase */}
              <div className="flex items-center justify-between text-xs font-medium px-2.5 py-1.5 rounded-xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                  {party.phone ? (
                    <a href={`tel:${party.phone}`} className="hover:text-blue-600 flex items-center gap-1 font-semibold text-[11px]">
                      <PhoneRoundedIcon style={{ fontSize: '13px' }} className="text-blue-600" />
                      <span>{party.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">মোবাইল নেই</span>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white shrink-0 ml-1.5">
                  🥚 ক্রয়: {toBengaliNumber(partyMemos.reduce((sum, m) => sum + (m.totalEggs || 0), 0), useBengali)} পিস
                </span>
              </div>

              {/* Bottom Row: Financials and Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 flex-wrap text-xs min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenPartyDetails(party)}
                    className="text-[10.5px] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition shadow-2xs"
                  >
                    <ReceiptLongRoundedIcon style={{ fontSize: '12px' }} />
                    <span>খতিয়ান ({toBengaliNumber(partyMemos.length, useBengali)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedPartyId(isExpanded ? null : party.id)}
                    className="text-[10.5px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded transition font-bold"
                  >
                    <span>{isExpanded ? 'সংক্ষিপ্ত' : 'বিস্তারিত'}</span>
                  </button>
                </div>

                {/* Compact Action Icons */}
                <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    title="নতুন মেমো"
                    onClick={() => onSelectPartyForSale(party)}
                    className="w-7 h-7 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 active:scale-90 transition shadow-2xs cursor-pointer"
                  >
                    <AddRoundedIcon style={{ fontSize: '15px' }} />
                  </button>
                  {hasDue && (
                    <button
                      title="জমা নিন"
                      onClick={() => onOpenPaymentModal(party)}
                      className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition shadow-2xs cursor-pointer"
                    >
                      <AccountBalanceWalletRoundedIcon style={{ fontSize: '15px' }} />
                    </button>
                  )}
                  <button
                    title="পার্টি মুছে ফেলুন"
                    type="button"
                    onClick={() => {
                      hapticCancel();
                      setPartyToDelete(party);
                    }}
                    className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 active:scale-90 transition shadow-2xs cursor-pointer"
                  >
                    <DeleteOutlineRoundedIcon style={{ fontSize: '15px' }} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs sm:text-sm flex-wrap gap-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">ধরণ: </span>
                      <span className="font-bold text-slate-950 dark:text-white">{party.type}</span>
                      {party.address && (
                        <span className="text-slate-600 dark:text-slate-400 ml-2 font-medium">• 📍 {party.address}</span>
                      )}
                    </div>

                    {(() => {
                      let red = 0;
                      let white = 0;
                      partyMemos.forEach((m) => {
                        m.items.forEach((it) => {
                          if (it.eggType === 'লাল ডিম') red += it.count || 0;
                          else if (it.eggType === 'সাদা ডিম') white += it.count || 0;
                        });
                      });
                      if (red > 0 || white > 0) {
                        return (
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 space-x-2">
                            {red > 0 && <span className="text-rose-700 dark:text-rose-400 font-bold">লাল: {toBengaliNumber(red, useBengali)} পিস</span>}
                            {white > 0 && <span className="text-blue-700 dark:text-blue-400 font-bold">সাদা: {toBengaliNumber(white, useBengali)} পিস</span>}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Action buttons inside expanded row - Sleek & Balanced */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectPartyForSale(party)}
                      className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                    >
                      <AddRoundedIcon className="w-3.5 h-3.5" />
                      <span>নতুন মেমো</span>
                    </button>
                    {hasDue && (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal(party)}
                        className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                      >
                        <AccountBalanceWalletRoundedIcon className="w-3.5 h-3.5" />
                        <span>জমা / আদায়</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPartyToDelete(party)}
                      className="py-1.5 px-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition active:scale-95"
                      title="এই পার্টিকে মুছে ফেলুন"
                    >
                      <DeleteOutlineRoundedIcon className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  {/* All memos trigger button */}
                  <button
                    type="button"
                    onClick={() => onOpenPartyDetails(party)}
                    className="w-full py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                  >
                    <ReceiptLongRoundedIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>খতিয়ান ও মেমো খাতা দেখুন ({toBengaliNumber(partyMemos.length, useBengali)} টি মেমো)</span>
                    <ArrowOutwardRoundedIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous memos by this party */}
                  {partyMemos.length > 0 && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-750 space-y-1.5">
                      <p className="font-bold text-stone-800 dark:text-stone-200 text-xs sm:text-sm">সাম্প্রতিক মেমোসমূহ (ডিমের পিস ও বিল):</p>
                      {partyMemos.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onViewMemoVoucher(m)}
                          className="bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition text-xs sm:text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <ReceiptLongRoundedIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                              <span className="font-mono font-black text-stone-900 dark:text-stone-100">{formatDisplayMemoNumber(m.memoNumber, useBengali)}</span>
                              <span className="text-stone-500 dark:text-stone-400 text-xs">({m.formattedDate})</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-stone-900 dark:text-stone-100">{toBnCurrency(m.totalBill, useBengali)}</span>
                              {m.remainingDue > 0 ? (
                                <span className="text-xs text-rose-600 dark:text-rose-400 ml-1.5 font-bold">
                                  (বাকি: {toBnCurrency(m.remainingDue, useBengali)})
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                                  (পরিশোধ)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Egg items with rates and total in distinct clear boxes */}
                          <div className="space-y-1 pt-1.5 border-t border-stone-100 dark:border-stone-700 text-xs">
                            {m.items.map((it, idx) => {
                              if (!it.count || it.count <= 0) return null;
                              const isRed = it.eggType === 'লাল ডিম';
                              const isWhite = it.eggType === 'সাদা ডিম';
                              const itemTotal = it.totalAmount || Math.round(it.count * (it.ratePerPiece || (it.ratePerHundred / 100)));
                              const rateHundred = it.ratePerHundred || Math.round((it.ratePerPiece || 0) * 100);

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between px-2 py-1 rounded-lg border font-bold text-xs shadow-2xs ${
                                    isRed
                                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                                      : isWhite
                                      ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100'
                                      : 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-extrabold text-xs">
                                      {it.eggType}: <span className="underline decoration-dotted">{toBengaliNumber(it.count, useBengali)} পিস</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/80 dark:bg-stone-900/80 border border-stone-250 dark:border-stone-700">
                                      ৳{toBengaliNumber(rateHundred, useBengali)}/শ
                                    </span>
                                    <span className="font-black tabular-nums">
                                      = {toBnCurrency(itemTotal, useBengali)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Calculation strip: মোট ডিমের বিল, পূর্বের বাকি, মোট দাবি, নগদ জমা, বর্তমান বাকি */}
                            <div className="space-y-1 pt-1 border-t border-stone-200/80 dark:border-stone-700/80">
                              {/* আজকের মোট বিল */}
                              <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-stone-900 dark:text-stone-200 border border-slate-200 dark:border-slate-700">
                                <span>আজকের মোট বিল:</span>
                                <span className="font-black tabular-nums">{toBnCurrency(m.totalBill, useBengali)}</span>
                              </div>

                              {/* সাবেক বাকি */}
                              <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                <span>সাবেক বাকি (পূর্বের জের):</span>
                                <span className="font-black tabular-nums">+{m.previousDue > 0 ? toBnCurrency(m.previousDue, useBengali) : '০ ৳'}</span>
                              </div>

                              {/* সর্বমোট দাবি */}
                              <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-purple-50/80 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                <span>সর্বমোট দাবি:</span>
                                <span className="font-black tabular-nums">{toBnCurrency(m.totalDemand, useBengali)}</span>
                              </div>

                              {/* নগদ জমা */}
                              <div className="flex items-center justify-between text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <span>নগদ জমা (পরিশোধ):</span>
                                <span className="font-black tabular-nums">-{m.cashPaid > 0 ? toBnCurrency(m.cashPaid, useBengali) : '০ ৳'}</span>
                              </div>

                              {/* অবশিষ্ট বাকি */}
                              <div className={`flex items-center justify-between text-xs font-black px-2 py-1 rounded-lg border-2 ${
                                m.remainingDue > 0
                                  ? 'bg-rose-100/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200'
                                  : 'bg-emerald-100/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                              }`}>
                                <span>অবশিষ্ট বাকি (জের):</span>
                                <span className="tabular-nums">{m.remainingDue > 0 ? toBnCurrency(m.remainingDue, useBengali) : '০ ৳ (পরিশোধ)'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Party Modal - Material Design 3 Dialog */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md">
          <div className="material-card w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  <PersonAddRoundedIcon className="w-5 h-5" />
                </span>
                <span>নতুন পার্টি যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPartyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <CloseRoundedIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddNewParty} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">পার্টির নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ভাই ভাই ট্রেডার্স"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="০১৭০০-০০০০০০"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">পার্টির ধরণ</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Party['type'])}
                    className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold transition"
                  >
                    <option value="পাইকারি">পাইকারি</option>
                    <option value="খুচরা">খুচরা</option>
                    <option value="হোটেল">হোটেল</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: কারওয়ান বাজার, ঢাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">পূর্বের কোনো বাকি থাকলে (টাকা)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newInitialDueStr}
                  onChange={(e) => {
                    const formatted = formatTypingNumber(e.target.value, false, useBengali);
                    setNewInitialDueStr(formatted);
                    setNewInitialDue(parseBengaliToNumber(formatted));
                  }}
                  placeholder="০"
                  className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold tabular-nums transition"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Party Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!partyToDelete}
        type="party"
        party={partyToDelete}
        memosCount={partyToDelete ? memos.filter((m) => m.partyId === partyToDelete.id).length : 0}
        useBengali={useBengali}
        onConfirm={() => {
          if (partyToDelete) {
            onDeleteParty(partyToDelete.id);
            setPartyToDelete(null);
          }
        }}
        onCancel={() => setPartyToDelete(null)}
      />
    </div>
  );
};
