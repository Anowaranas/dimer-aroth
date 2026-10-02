import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

// Users table (links with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shop Profile table
export const shopProfiles = pgTable('shop_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  name: text('name').notNull().default('মেসার্স আল্লাহর দান ডিমের আড়ৎ'),
  tagline: text('tagline').default('পাইকারি ও খুচরা ডিম বিক্রেতা'),
  proprietor: text('proprietor').default('মো: আনোয়ার হোসেন'),
  mobile: text('mobile').default('০১৭১২-৩৪৫৬৭৮'),
  address: text('address').default('আড়ৎ পট্টি, কাপ্তান বাজার, ঢাকা'),
  memoFooter: text('memo_footer').default('বিক্রিত ডিম কোনো অবস্থাতেই ফেরত নেওয়া হয় না।'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Base Egg Rates
export const baseRates = pgTable('base_rates', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  redRate: integer('red_rate').notNull().default(1170),
  whiteRate: integer('white_rate').notNull().default(1120),
  duckRate: integer('duck_rate').default(1350),
  quailRate: integer('quail_rate').default(350),
  effectiveDate: text('effective_date'),
  lastUpdated: text('last_updated'),
  note: text('note'),
});

// Parties (Customers / পাইকারি ও খুচরা কাস্টমার)
export const parties = pgTable('parties', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  type: text('type').notNull().default('পাইকারি'),
  currentDue: integer('current_due').notNull().default(0),
  totalPurchased: integer('total_purchased').default(0),
  notes: text('notes'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Cash Memos (মেমো ভাউচার ও ট্রানজেকশন)
export const memos = pgTable('memos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  memoNumber: text('memo_number').notNull(),
  partyId: text('party_id').notNull(),
  partyName: text('party_name').notNull(),
  partyPhone: text('party_phone').notNull(),
  partyType: text('party_type').notNull(),
  date: text('date').notNull(),
  formattedDate: text('formatted_date'),
  itemsJson: text('items_json').notNull().default('[]'),
  totalEggs: integer('total_eggs').notNull().default(0),
  totalKhacha: integer('total_khacha').default(0),
  totalBill: integer('total_bill').notNull().default(0),
  previousDue: integer('previous_due').notNull().default(0),
  totalDemand: integer('total_demand').notNull().default(0),
  cashPaid: integer('cash_paid').notNull().default(0),
  remainingDue: integer('remaining_due').notNull().default(0),
  khachaLent: integer('khacha_lent').default(0),
  khachaReturned: integer('khacha_returned').default(0),
  note: text('note'),
  createdAt: text('created_at'),
});

// Suppliers (মহাজন / খামারি)
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  farmLocation: text('farm_location'),
  address: text('address'),
  totalPayable: integer('total_payable').notNull().default(0),
  totalPurchased: integer('total_purchased').default(0),
  totalPaid: integer('total_paid').default(0),
  notes: text('notes'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Supplier Chalans (মহাজন চালান)
export const chalans = pgTable('chalans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  chalanNumber: text('chalan_number').notNull(),
  supplierId: text('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  supplierPhone: text('supplier_phone'),
  date: text('date').notNull(),
  formattedDate: text('formatted_date'),
  eggCount: integer('egg_count').notNull().default(0),
  khachaCount: integer('khacha_count').default(0),
  ratePerHundred: integer('rate_per_hundred').default(0),
  redEggCount: integer('red_egg_count').default(0),
  redKhachaCount: integer('red_khacha_count').default(0),
  redRatePerHundred: integer('red_rate_per_hundred').default(0),
  redRatePerPiece: real('red_rate_per_piece').default(0),
  redTotalAmount: integer('red_total_amount').default(0),
  whiteEggCount: integer('white_egg_count').default(0),
  whiteKhachaCount: integer('white_khacha_count').default(0),
  whiteRatePerHundred: integer('white_rate_per_hundred').default(0),
  whiteRatePerPiece: real('white_rate_per_piece').default(0),
  whiteTotalAmount: integer('white_total_amount').default(0),
  totalAmount: integer('total_amount').notNull().default(0),
  previousDue: integer('previous_due').default(0),
  totalDemand: integer('total_demand').default(0),
  paidAmount: integer('paid_amount').notNull().default(0),
  dueAmount: integer('due_amount').notNull().default(0),
  remainingDue: integer('remaining_due').default(0),
  truckNumber: text('truck_number'),
  driverName: text('driver_name'),
  transportCost: integer('transport_cost').default(0),
  note: text('note'),
  createdAt: text('created_at'),
});

// Daily Expenses (দৈনিক খরচ খাতা)
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  title: text('title').notNull(),
  amount: integer('amount').notNull().default(0),
  category: text('category').notNull(),
  date: text('date').notNull(),
  formattedDate: text('formatted_date'),
  paymentMethod: text('payment_method').default('নগদ'),
  note: text('note'),
  createdAt: text('created_at'),
});

// Full Cloud Backup Snapshot Records
export const cloudBackups = pgTable('cloud_backups', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  backupDataJson: text('backup_data_json').notNull(),
  totalRecords: integer('total_records').default(0),
  backupTime: timestamp('backup_time').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  shopProfile: one(shopProfiles, {
    fields: [users.uid],
    references: [shopProfiles.userId],
  }),
  parties: many(parties),
  memos: many(memos),
  suppliers: many(suppliers),
  chalans: many(chalans),
  expenses: many(expenses),
  cloudBackups: many(cloudBackups),
}));
