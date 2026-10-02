import React, { useState } from 'react';
import { ExpenseRecord, ExpenseCategory, Memo, SupplierPayment, CashNoteCount } from '../types';
import { 
  toBengaliNumber, 
  toBnCurrency, 
  getBengaliDateFromInput, 
  getTodayDateInputValue, 
  getYesterdayDateInputValue,
  getDayOfWeekBn
} from '../utils/bengaliUtils';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Calculator, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  Coins
} from 'lucide-react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  memos: Memo[];
  supplierPayments: SupplierPayment[];
  useBengali: boolean;
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'লেবার / কুলি বিল',
  'গাড়ি ভাড়া / পরিবহন',
  'ডিমের খাঁচা ও সুতলি',
  'চা-নাস্তা ও আপ্যায়ন',
  'দোকান ভাড়া',
  'বিদ্যুৎ ও অন্যান্য বিল',
  'ব্যক্তিগত / মালিকের খরচ',
  'অন্যান্য খরচ',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  memos,
  supplierPayments,
  useBengali,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue());
  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'cashbox'>('expenses');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modal
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('লেবার / কুলি বিল');
  const [newMethod, setNewMethod] = useState<'নগদ' | 'বিকাশ' | 'ব্যাংক'>('নগদ');
  const [newNote, setNewNote] = useState('');

  // Currency Note Counter state
  const [noteCounts, setNoteCounts] = useState<CashNoteCount>({
    note1000: 0,
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
  });

  // Calculate day's financial flows for selected date
  // Calculate day's financial flows for selected date - Memoized
  const isDateToday = selectedDate === getTodayDateInputValue();
  const dateFormatted = getBengaliDateFromInput(selectedDate, useBengali);

  const {
    dayMemos,
    totalCashFromMemos,
    dayExpenses,
    totalCashExpenses,
    totalNonCashExpenses,
    totalDayExpenses,
    daySupplierPayments,
    totalSupplierCashPaid,
    totalSupplierOtherPaid,
    totalCashIn,
    totalCashOut,
    expectedNetCash
  } = React.useMemo(() => {
    // 1. Inflow: Cash sales from memos of this date
    const dMemos = memos.filter((m) => m.date === selectedDate);
    const cashMemos = dMemos.reduce((sum, m) => sum + (m.cashPaid || 0), 0);

    // 2. Outflow: Expenses of this date
    const dExpenses = expenses.filter((e) => e.date === selectedDate);
    let cashExp = 0, nonCashExp = 0, dayExp = 0;
    for (let i = 0; i < dExpenses.length; i++) {
      const e = dExpenses[i];
      dayExp += e.amount || 0;
      if (e.paymentMethod === 'নগদ') {
        cashExp += e.amount || 0;
      } else {
        nonCashExp += e.amount || 0;
      }
    }

    // 3. Outflow: Supplier cash payments on this date
    const dSupplierPayments = supplierPayments.filter((p) => p.date === selectedDate);
    let supCash = 0, supOther = 0;
    for (let i = 0; i < dSupplierPayments.length; i++) {
      const p = dSupplierPayments[i];
      if (p.method === 'নগদ' || p.method === 'নগদ ক্যাশ') {
        supCash += p.amount || 0;
      } else {
        supOther += p.amount || 0;
      }
    }

    const cIn = cashMemos;
    const cOut = cashExp + supCash;
    const net = cIn - cOut;

    return {
      dayMemos: dMemos,
      totalCashFromMemos: cashMemos,
      dayExpenses: dExpenses,
      totalCashExpenses: cashExp,
      totalNonCashExpenses: nonCashExp,
      totalDayExpenses: dayExp,
      daySupplierPayments: dSupplierPayments,
      totalSupplierCashPaid: supCash,
      totalSupplierOtherPaid: supOther,
      totalCashIn: cIn,
      totalCashOut: cOut,
      expectedNetCash: net,
    };
  }, [memos, expenses, supplierPayments, selectedDate]);

  // Note counts sum
  const counted1000 = noteCounts.note1000 * 1000;
  const counted500 = noteCounts.note500 * 500;
  const counted200 = noteCounts.note200 * 200;
  const counted100 = noteCounts.note100 * 100;
  const counted50 = noteCounts.note50 * 50;
  const counted20 = noteCounts.note20 * 20;
  const counted10 = noteCounts.note10 * 10;
  const totalCountedCash = 
    counted1000 + counted500 + counted200 + counted100 + counted50 + counted20 + counted10;

  const cashDifference = totalCountedCash - expectedNetCash;

  // Filtered expenses list
  const filteredDayExpenses = dayExpenses.filter((e) => {
    if (selectedCategoryFilter === 'all') return true;
    return e.category === selectedCategoryFilter;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newAmount) || 0;
    if (amount <= 0 || !newTitle.trim()) {
      alert('সঠিক বিবরণ ও টাকার পরিমাণ লিখুন');
      return;
    }

    const newExpense: ExpenseRecord = {
      id: 'exp-' + Date.now(),
      title: newTitle.trim(),
      amount: amount,
      category: newCategory,
      date: selectedDate,
      formattedDate: getBengaliDateFromInput(selectedDate, useBengali),
      paymentMethod: newMethod,
      note: newNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    setIsAddExpenseModalOpen(false);
    setNewTitle('');
    setNewAmount('');
    setNewNote('');
  };

  const updateNoteCount = (key: keyof CashNoteCount, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setNoteCounts((prev) => ({ ...prev, [key]: num }));
  };

  const resetNoteCounter = () => {
    setNoteCounts({
      note1000: 0,
      note500: 0,
      note200: 0,
      note100: 0,
      note50: 0,
      note20: 0,
      note10: 0,
    });
  };

  return (
    <div id="expenses-view-container" className="space-y-1.5 pb-16">
      {/* 1. Top Summary Banner (ক্যাশ বাক্স ও নিট নগদ টাকা) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white rounded-xl p-2.5 shadow-sm border border-emerald-400/30">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-md pointer-events-none" />

        <div className="flex items-center justify-between gap-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs border border-white/25">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-tight leading-tight">দোকান খরচ ও ক্যাশ ড্রয়ার</h2>
              <p className="text-[10px] text-emerald-100 font-bold leading-tight">
                {dateFormatted} {getDayOfWeekBn(selectedDate) ? `(${getDayOfWeekBn(selectedDate)})` : ''}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold text-emerald-100 block">ড্রয়ারের নিট নগদ</span>
            <span className="text-sm sm:text-base font-black text-white drop-shadow-2xs">
              {toBnCurrency(expectedNetCash, useBengali)}
            </span>
          </div>
        </div>

        {/* Inflow vs Outflow Mini-Strip */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1.5 border-t border-white/15 text-[10px] font-bold text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-md p-1 border border-white/10 flex items-center justify-between px-2">
            <span className="flex items-center gap-1 text-emerald-200 text-[9.5px]">
              <ArrowDownRight className="w-3 h-3 text-emerald-300" />
              <span>নগদ বিক্রি জমা</span>
            </span>
            <span className="font-black text-white text-xs">{toBnCurrency(totalCashIn, useBengali)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-md p-1 border border-white/10 flex items-center justify-between px-2">
            <span className="flex items-center gap-1 text-rose-200 text-[9.5px]">
              <ArrowUpRight className="w-3 h-3 text-rose-300" />
              <span>মোট খরচ ও পরিশোধ</span>
            </span>
            <span className="font-black text-rose-300 text-xs">{toBnCurrency(totalCashOut, useBengali)}</span>
          </div>
        </div>
      </div>

      {/* 2. Date Switcher and View Tab Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-xl p-2 shadow-2xs border border-stone-200/90 dark:border-stone-800 space-y-1.5">
        {/* Date Selector Row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayDateInputValue())}
              className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                selectedDate === getTodayDateInputValue()
                  ? 'bg-emerald-600 text-white font-black shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              আজ
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayDateInputValue())}
              className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                selectedDate === getYesterdayDateInputValue()
                  ? 'bg-emerald-600 text-white font-black shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              গতকাল
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[10.5px] font-bold py-0.5 px-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-md text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Tab Switcher: Expenses List vs Cashbox & Note Calculator */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-stone-100 dark:bg-stone-850 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`py-1.5 rounded-md transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'expenses'
                ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-black'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>দোকান খরচ ({toBengaliNumber(dayExpenses.length, useBengali)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('cashbox')}
            className={`py-1.5 rounded-md transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'cashbox'
                ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-black'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>ক্যাশ ড্রয়ার ও নোট খাতা</span>
          </button>
        </div>
      </div>

      {/* --- SUB-TAB 1: EXPENSES LIST --- */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-1.5">
          {/* Action Header & Category filters */}
          <div className="bg-white dark:bg-stone-900 rounded-xl p-2 shadow-2xs border border-stone-200/90 dark:border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                মোট খরচ: <strong className="text-rose-600">{toBnCurrency(totalDayExpenses, useBengali)}</strong>
              </span>

              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-2xs flex items-center gap-1 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ খরচ লিখুন</span>
              </button>
            </div>

            {/* Category horizontal scroll badges */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[9.5px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2 py-0.5 rounded-full shrink-0 border transition ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent shadow-2xs font-black'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-750'
                }`}
              >
                সব খাত
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded-full shrink-0 border transition ${
                    selectedCategoryFilter === cat
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-black'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses List */}
          {filteredDayExpenses.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl p-6 text-center border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto text-lg">
                📝
              </div>
              <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                এই তারিখে কোনো খরচের রেকর্ড নেই
              </p>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-black shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন খরচ লিখুন</span>
              </button>
            </div>
          ) : (
            filteredDayExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white dark:bg-stone-900 rounded-xl p-2 sm:p-2.5 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-stone-950 dark:text-stone-50">
                      {exp.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                      {exp.category}
                    </span>
                    <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {exp.paymentMethod}
                    </span>
                  </div>
                  {exp.note && (
                    <p className="text-[10px] text-stone-500 italic mt-0.5">
                      "{exp.note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                    -{toBnCurrency(exp.amount, useBengali)}
                  </span>
                  <button
                    type="button"
                    title="খরচ মুছুন"
                    onClick={() => {
                      if (window.confirm(`আপনি কি এই "${exp.title}" খরচটি মুছে ফেলতে চান?`)) {
                        onDeleteExpense(exp.id);
                      }
                    }}
                    className="p-1 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- SUB-TAB 2: CASHBOX & NOTE COUNTER --- */}
      {activeSubTab === 'cashbox' && (
        <div className="space-y-1.5">
          {/* Detailed Drawer Flow Breakdown */}
          <div className="bg-white dark:bg-stone-900 rounded-xl p-2.5 shadow-2xs border border-stone-200/90 dark:border-stone-800 space-y-2">
            <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center justify-between">
              <span>আজকের ক্যাশ প্রবাহ বিবরণী</span>
              <span className="text-[10px] text-stone-500 font-bold">{dateFormatted}</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              {/* Cash In */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">মেমো থেকে মোট নগদ জমা ({toBengaliNumber(dayMemos.length, useBengali)} টি মেমো)</span>
                </div>
                <span className="font-black">+{toBnCurrency(totalCashIn, useBengali)}</span>
              </div>

              {/* Cash Out - Expenses */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  <span className="font-bold">নগদ দোকান খরচ</span>
                </div>
                <span className="font-black">-{toBnCurrency(totalCashExpenses, useBengali)}</span>
              </div>

              {/* Cash Out - Supplier Payments */}
              {totalSupplierCashPaid > 0 && (
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-bold">মহাজনকে নগদ পরিশোধ</span>
                  </div>
                  <span className="font-black">-{toBnCurrency(totalSupplierCashPaid, useBengali)}</span>
                </div>
              )}

              {/* Resulting Drawer Cash */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900 dark:bg-stone-800 text-white font-black">
                <span>হাতে থাকা উচিত (প্রত্যাশিত ক্যাশ)</span>
                <span className="text-sm text-emerald-400">
                  {toBnCurrency(expectedNetCash, useBengali)}
                </span>
              </div>
            </div>
          </div>

          {/* Currency Note Counter */}
          <div className="bg-white dark:bg-stone-900 rounded-xl p-2.5 shadow-2xs border border-stone-200/90 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>নোট কাউন্টার (ক্যাশ মিলিয়ে দেখুন)</span>
              </h3>
              <button
                type="button"
                onClick={resetNoteCounter}
                className="text-[10px] font-bold text-stone-500 hover:text-rose-600 flex items-center gap-0.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>রিসেট</span>
              </button>
            </div>

            {/* Note Input Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 1000 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳১০০০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note1000 || ''}
                    onChange={(e) => updateNoteCount('note1000', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted1000, useBengali)}
                  </span>
                </div>
              </div>

              {/* 500 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳৫০০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note500 || ''}
                    onChange={(e) => updateNoteCount('note500', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted500, useBengali)}
                  </span>
                </div>
              </div>

              {/* 200 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳২০০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note200 || ''}
                    onChange={(e) => updateNoteCount('note200', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted200, useBengali)}
                  </span>
                </div>
              </div>

              {/* 100 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳১০০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note100 || ''}
                    onChange={(e) => updateNoteCount('note100', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted100, useBengali)}
                  </span>
                </div>
              </div>

              {/* 50 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳৫০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note50 || ''}
                    onChange={(e) => updateNoteCount('note50', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted50, useBengali)}
                  </span>
                </div>
              </div>

              {/* 20 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳২০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note20 || ''}
                    onChange={(e) => updateNoteCount('note20', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted20, useBengali)}
                  </span>
                </div>
              </div>

              {/* 10 Tk */}
              <div className="flex items-center justify-between p-1.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/70 dark:border-stone-750">
                <span className="font-bold text-stone-700 dark:text-stone-300">৳১০ ×</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={noteCounts.note10 || ''}
                    onChange={(e) => updateNoteCount('note10', e.target.value)}
                    className="w-14 text-center font-black p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded text-xs"
                  />
                  <span className="text-[10px] text-stone-500 w-12 text-right font-bold">
                    ৳{toBengaliNumber(counted10, useBengali)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reconciliation Comparison Bar */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span>মোট গোনা ক্যাশ:</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {toBnCurrency(totalCountedCash, useBengali)}
                </span>
              </div>

              {totalCountedCash > 0 && (
                <div className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                  cashDifference === 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                    : cashDifference > 0
                    ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-300'
                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300'
                }`}>
                  {cashDifference === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">
                        অসাধারণ! ক্যাশ ড্রয়ারের হিসেব ১০০% নির্ভুলভাবে মিলেছে।
                      </span>
                    </>
                  ) : cashDifference > 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-bold">
                        ড্রয়ারের হিসাবের চেয়ে ক্যাশ <strong>+{toBnCurrency(cashDifference, useBengali)}</strong> টাকা বেশি আছে!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-bold">
                        ড্রয়ারের হিসাবের চেয়ে ক্যাশ <strong>{toBnCurrency(Math.abs(cashDifference), useBengali)}</strong> টাকা কম আছে!
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD EXPENSE --- */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-3.5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <h3 className="text-xs font-black text-stone-950 dark:text-stone-50 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>দৈনিক নতুন খরচ এন্ট্রি</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-2 text-xs font-bold">
              <div>
                <label className="text-[10px] text-stone-700 dark:text-stone-300 block mb-0.5">খরচের বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ৩ গাড়ি ডিম নামানোর কুলি বিল"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-800 dark:text-rose-300 font-bold block mb-0.5">টাকার পরিমাণ *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-stone-500">৳</span>
                  <input
                    type="number"
                    required
                    placeholder="টাকার পরিমাণ লিখুন"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full text-sm font-black pl-6 pr-2.5 py-2 border border-rose-400 rounded-lg bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-700 dark:text-stone-300 block mb-0.5">খরচের খাত *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs font-bold border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-700 dark:text-stone-300 block mb-0.5">পেমেন্ট মাধ্যম</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="w-full text-xs font-bold border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                  >
                    <option value="নগদ">নগদ ক্যাশ ড্রয়ার</option>
                    <option value="বিকাশ">বিকাশ</option>
                    <option value="ব্যাংক">ব্যাংক</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-700 dark:text-stone-300 block mb-0.5">তারিখ</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-700 dark:text-stone-300 block mb-0.5">মন্তব্য / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="ঐচ্ছিক নোট"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full text-xs font-bold border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-sm"
                >
                  খরচ সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
