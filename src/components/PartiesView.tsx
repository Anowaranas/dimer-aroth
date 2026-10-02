import React, { useState } from 'react';
import { Memo, Party } from '../types';
import { toBengaliNumber, toBnCurrency, formatDisplayMemoNumber, compareMemosDesc, comparePartiesByRecentActivity } from '../utils/bengaliUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getPartyColorTheme } from '../utils/partyColors';
import { 
  Users, 
  Search, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  DollarSign, 
  FileText,
  ArrowUpRight
} from 'lucide-react';

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
    setShowAddPartyModal(false);
  };

  return (
    <div id="parties-view-container" className="space-y-2 pb-16">
      {/* 1. Top Summary Banner - Compact */}
      <div 
        id="parties-due-summary-card"
        className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white border border-blue-400/40 rounded-xl p-2.5 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-cyan-200 shrink-0">
                <Users className="w-3 h-3" />
              </span>
              <span className="text-xs font-bold text-blue-100">সর্বমোট পাওনা বাকি:</span>
              <strong className="text-sm sm:text-base font-black text-white tracking-tight tabular-nums">
                {toBnCurrency(totalDueAmount, useBengali)}
              </strong>
            </div>
            <p className="text-[11px] text-blue-100 font-medium truncate mt-0.5">
              মোট {toBengaliNumber(parties.length, useBengali)} জনের মধ্যে <span className="text-white font-bold bg-white/20 px-1 py-0.2 rounded">{toBengaliNumber(partiesWithDue.length, useBengali)} জনের কাছে</span> বাকি
            </p>
          </div>

          <button
            onClick={() => setShowAddPartyModal(true)}
            className="text-xs font-black bg-white text-blue-950 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-blue-700" />
            <span>+ নতুন পার্টি</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar - Compact */}
      <div className="relative">
        <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-2.5" />
        <input
          id="search-party-input"
          type="text"
          placeholder="পার্টির নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
        />
      </div>

      {/* 3. Parties List */}
      <div className="space-y-2.5">
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
              className={`bg-white dark:bg-slate-900 rounded-xl border-2 border-l-[5px] ${theme.borderLeft} ${theme.border} shadow-2xs hover:shadow-md ${theme.hoverBorder} overflow-hidden transition-all`}
            >
              {/* Main Party Row - Sleek, Slim & Attractive */}
              <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    onClick={() => onOpenPartyDetails(party)}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.avatarGradient} text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-2xs cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0`}
                    title="এই পার্টির সমস্ত মেমো ও খতিয়ান দেখুন"
                  >
                    {party.name.trim().charAt(0)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenPartyDetails(party)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${theme.nameBadge} hover:scale-[1.02] active:scale-95 transition-all text-left shadow-2xs group`}
                        title="ক্লিক করে এই পার্টির খতিয়ান ও হিসাব দেখুন"
                      >
                        <span className="font-black text-xs sm:text-sm leading-tight">
                          {party.name}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border shrink-0 ${typeBadgeStyle}`}>
                        {party.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenPartyDetails(party)}
                        className="text-[11px] text-blue-950 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition shrink-0 shadow-2xs"
                        title="খতিয়ান ও বিস্তারিত বিবরণ দেখুন"
                      >
                        <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>খতিয়ান ({toBengaliNumber(partyMemos.length, useBengali)})</span>
                      </button>
                      <button
                        onClick={() => setExpandedPartyId(isExpanded ? null : party.id)}
                        className="text-[11px] text-slate-800 dark:text-slate-200 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-1.5 py-0.5 rounded-md transition font-bold shrink-0"
                      >
                        <span>{isExpanded ? 'সংক্ষিপ্ত' : 'হিসাব'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        title="পার্টি ডিলিট করুন"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPartyToDelete(party);
                        }}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-1 rounded-md transition active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {party.phone && (
                        <a
                          href={`tel:${party.phone}`}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{party.phone}</span>
                        </a>
                      )}

                      {(() => {
                        const totalEggs = partyMemos.reduce((sum, m) => sum + (m.totalEggs || 0), 0);
                        if (totalEggs > 0) {
                          return (
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-50/90 dark:bg-indigo-950/60 px-2 py-0.2 rounded text-[10.5px] border border-indigo-200 dark:border-indigo-800">
                              🥚 ক্রয়: {toBengaliNumber(totalEggs, useBengali)} পিস
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Due Badge - Slim & High Contrast */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-tight">বর্তমান বাকি</span>
                  <div
                    className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-2xs mt-0.5 tabular-nums ${
                      hasDue
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                    }`}
                  >
                    {toBnCurrency(party.currentDue, useBengali)}
                  </div>
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

                  {/* Action buttons inside expanded row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectPartyForSale(party)}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন মেমো</span>
                    </button>
                    {hasDue && (
                      <button
                        onClick={() => onOpenPaymentModal(party)}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>জমা / আদায়</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPartyToDelete(party)}
                      className="py-2 px-3 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition active:scale-95"
                      title="এই পার্টিকে মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  {/* All memos trigger button */}
                  <button
                    type="button"
                    onClick={() => onOpenPartyDetails(party)}
                    className="w-full py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>খতিয়ান ও মেমো খাতা দেখুন ({toBengaliNumber(partyMemos.length, useBengali)} টি মেমো)</span>
                    <ArrowUpRight className="w-4 h-4" />
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
                              <FileText className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
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

      {/* Add Party Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-5 space-y-3.5 border border-stone-200 dark:border-stone-750">
            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>👤</span>
              <span>নতুন পার্টি যোগ করুন</span>
            </h3>
            <form onSubmit={handleAddNewParty} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">পার্টির নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ভাই ভাই ট্রেডার্স"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-650 rounded-xl p-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">মোবাইল</label>
                  <input
                    type="text"
                    placeholder="০১৭০০-০০০০০০"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-650 rounded-xl p-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">পার্টির ধরণ</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Party['type'])}
                    className="w-full text-xs sm:text-sm border border-stone-300 dark:border-stone-650 rounded-xl p-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="পাইকারি">পাইকারি</option>
                    <option value="খুচরা">খুচরা</option>
                    <option value="হোটেল">হোটেল</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: কারওয়ান বাজার, ঢাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-650 rounded-xl p-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">পূর্বের কোনো বাকি থাকলে (টাকা)</label>
                <input
                  type="number"
                  min="0"
                  value={newInitialDue || ''}
                  onChange={(e) => setNewInitialDue(Number(e.target.value))}
                  placeholder="০"
                  className="w-full text-xs sm:text-sm border border-stone-300 dark:border-stone-650 rounded-xl p-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 rounded-xl shadow-xs transition active:scale-95"
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
