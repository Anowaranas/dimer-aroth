import { BaseRate, Memo, Party, ShopProfile, Supplier, SupplierChalan, SupplierPayment, ExpenseRecord } from '../types';

export const INITIAL_SHOP_PROFILE: ShopProfile = {
  name: '',
  tagline: '',
  proprietor: '',
  mobile: '',
  address: '',
  memoFooter: '',
};

export const INITIAL_BASE_RATE: BaseRate = {
  redRate: 0,
  whiteRate: 0,
  lastUpdated: '',
  effectiveDate: '',
  note: '',
};

export const INITIAL_PARTIES: Party[] = [];

export const INITIAL_MEMOS: Memo[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_SUPPLIER_CHALANS: SupplierChalan[] = [];

export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

