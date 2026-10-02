export type EggType = 'লাল ডিম' | 'সাদা ডিম' | 'দেশি ডিম' | 'হাঁসের ডিম' | 'মিশ্র ডিম';
export type PartyType = 'পাইকারি' | 'খুচরা' | 'হোটেল' | 'অন্যান্য';
export type PaymentMethod = 'নগদ' | 'বিকাশ' | 'রকেট' | 'নগদ ক্যাশ' | 'ব্যাংক';

export interface Party {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: PartyType;
  currentDue: number;
  totalPurchased?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MemoItem {
  id: string;
  eggType: EggType;
  count: number; // in pieces
  khacha?: number; // optional legacy
  ratePerHundred: number; // e.g. 1170
  ratePerPiece: number; // ratePerHundred / 100
  totalAmount: number;
}

export interface Memo {
  id: string;
  memoNumber: string; // e.g. '#২৬০০১০১'
  partyId: string;
  partyName: string;
  partyPhone: string;
  partyType: PartyType;
  date: string; // ISO or YYYY-MM-DD
  formattedDate: string; // e.g. ১৯ সেপ্টেম্বর, ২০২৬
  items: MemoItem[];
  totalEggs: number;
  totalKhacha?: number;
  totalBill: number;
  previousDue: number;
  totalDemand: number; // totalBill + previousDue
  cashPaid: number;
  remainingDue: number; // totalDemand - cashPaid
  khachaLent?: number; // crates given
  khachaReturned?: number; // empty crates returned
  note?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  partyId: string;
  partyName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
  createdAt: string;
}

export interface BaseRate {
  redRate: number; // rate per 100 (e.g. 1170)
  whiteRate: number; // rate per 100 (e.g. 1120)
  duckRate?: number; // rate per 100 for duck eggs
  quailRate?: number; // rate per 100 for quail eggs
  lastUpdated: string;
  effectiveDate: string;
  note?: string;
}

export interface ShopProfile {
  name: string;
  tagline: string;
  proprietor: string;
  mobile: string;
  address: string;
  memoFooter: string;
}

export interface AppSettings {
  useBengaliNumerals: boolean;
  darkMode: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photoURL?: string;
  provider: 'mobile' | 'google' | 'email' | 'universal';
  role: string;
  isLoggedIn: boolean;
  loginTime: string;
  lastBackupTime?: string;
}

export interface UserPreferences {
  useBengali?: boolean;
  darkMode?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  farmLocation?: string;
  address?: string;
  totalPayable: number; // Current due to supplier (মহাজনের পাওনা)
  totalPurchased: number; // Total goods bought from this supplier
  totalPaid: number; // Total paid to supplier
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierChalan {
  id: string;
  chalanNumber: string; // e.g. 'CH-2601'
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  eggType?: EggType;
  eggCount: number; // total in pieces
  khachaCount?: number; // total in khacha
  ratePerHundred?: number;
  ratePerPiece?: number;

  // লাল ডিম (Red Eggs)
  redEggCount?: number;
  redKhachaCount?: number;
  redRatePerHundred?: number;
  redRatePerPiece?: number;
  redTotalAmount?: number;

  // সাদা ডিম (White Eggs)
  whiteEggCount?: number;
  whiteKhachaCount?: number;
  whiteRatePerHundred?: number;
  whiteRatePerPiece?: number;
  whiteTotalAmount?: number;

  totalAmount: number; // (redTotalAmount + whiteTotalAmount)
  previousDue?: number; // পূর্বের বকেয়া বাকি (Auto যোগ)
  totalDemand?: number; // চালানের দাম + পূর্বের বকেয়া
  paidAmount: number; // Paid immediately
  dueAmount: number; // Remaining due on this chalan
  remainingDue?: number; // মহাজনের নতুন মোট পাওনা বাকি (খাতায় যোগ হওয়া জের)
  truckNumber?: string;
  driverName?: string;
  transportCost?: number; // গাড়ি ভাড়া
  note?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'লেবার / কুলি বিল'
  | 'গাড়ি ভাড়া / পরিবহন'
  | 'ডিমের খাঁচা ও সুতলি'
  | 'চা-নাস্তা ও আপ্যায়ন'
  | 'দোকান ভাড়া'
  | 'বিদ্যুৎ ও অন্যান্য বিল'
  | 'ব্যক্তিগত / মালিকের খরচ'
  | 'অন্যান্য খরচ';

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  formattedDate?: string;
  paymentMethod: 'নগদ' | 'বিকাশ' | 'ব্যাংক';
  note?: string;
  createdAt: string;
}

export interface CashNoteCount {
  note1000: number;
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
}

export interface UserCloudData {
  shopProfile?: ShopProfile;
  baseRate?: BaseRate;
  parties?: Party[];
  memos?: Memo[];
  suppliers?: Supplier[];
  supplierChalans?: SupplierChalan[];
  supplierPayments?: SupplierPayment[];
  expenses?: ExpenseRecord[];
  preferences?: UserPreferences;
  hasData: boolean;
  totalMemos: number;
  totalParties: number;
  totalSuppliers?: number;
  totalExpenses?: number;
  lastBackupDate?: string;
}
