import { AuthUser, BaseRate, Memo, Party, ShopProfile, Supplier, SupplierChalan, SupplierPayment, ExpenseRecord } from '../types';
import { toBengaliNumber, toBnCurrency } from './bengaliUtils';
import { 
  saveBackupToFirebase, 
  fetchBackupsFromFirebase,
  isFirestoreQuotaExceeded,
  syncShopProfileToFirebase,
  syncBaseRateToFirebase,
  syncPartyToFirebase,
  syncMemoToFirebase,
  syncSupplierToFirebase,
  syncSupplierChalanToFirebase,
  syncSupplierPaymentToFirebase,
  syncExpenseToFirebase
} from './firebaseDataService';
import { syncDataToCloudSql, loadDataFromCloudSql } from '../lib/cloudDbService.ts';
import { saveToSupabaseCloud, fetchFromSupabaseCloud } from '../lib/supabase.ts';

export interface CloudBackupRecord {
  backupId: string;
  backupTimestamp: number;
  formattedDate: string;
  userAccount?: {
    id: string;
    name: string;
    provider: 'mobile' | 'google' | 'email' | 'universal';
    phone?: string;
    email?: string;
  };
  shopProfile: ShopProfile;
  baseRate: BaseRate;
  parties: Party[];
  memos: Memo[];
  suppliers?: Supplier[];
  supplierChalans?: SupplierChalan[];
  supplierPayments?: SupplierPayment[];
  expenses?: ExpenseRecord[];
  summary: {
    totalMemos: number;
    totalParties: number;
    totalSuppliers?: number;
    totalExpenses?: number;
    totalBill: number;
    totalDue: number;
  };
}

const STORAGE_KEY_LATEST = 'egg_arat_online_cloud_latest';
const STORAGE_KEY_HISTORY = 'egg_arat_online_cloud_history';
const STORAGE_KEY_AUTOSYNC = 'egg_arat_auto_cloud_sync';
const STORAGE_KEY_GOOGLE = 'egg_arat_google_cloud_latest';
const STORAGE_KEY_MOBILE = 'egg_arat_mobile_cloud_latest';

// Format date in Bengali
function getBengaliFormattedTimestamp(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return now.toLocaleDateString('bn-BD', options);
}

/**
 * Utility to check if payload has identical state to the latest cloud backup record
 * to prevent redundant writes and infinite ping-pong/circular sync loops.
 */
function isPayloadEqualToBackup(payload: {
  shopProfile: ShopProfile;
  baseRate: BaseRate;
  parties: Party[];
  memos: Memo[];
  suppliers?: Supplier[];
  supplierChalans?: SupplierChalan[];
  supplierPayments?: SupplierPayment[];
  expenses?: ExpenseRecord[];
}, backup: CloudBackupRecord): boolean {
  try {
    if (payload.memos.length !== backup.memos.length) return false;
    if (payload.parties.length !== backup.parties.length) return false;
    if ((payload.suppliers || []).length !== (backup.suppliers || []).length) return false;
    if ((payload.supplierChalans || []).length !== (backup.supplierChalans || []).length) return false;
    if ((payload.supplierPayments || []).length !== (backup.supplierPayments || []).length) return false;
    if ((payload.expenses || []).length !== (backup.expenses || []).length) return false;

    const payloadTotalBill = payload.memos.reduce((sum, m) => sum + (m.totalBill || 0), 0);
    const backupTotalBill = backup.memos.reduce((sum, m) => sum + (m.totalBill || 0), 0);
    if (payloadTotalBill !== backupTotalBill) return false;

    const payloadTotalDue = payload.parties.reduce((sum, p) => sum + (p.currentDue || 0), 0);
    const backupTotalDue = backup.parties.reduce((sum, p) => sum + (p.currentDue || 0), 0);
    if (payloadTotalDue !== backupTotalDue) return false;

    // Fast content summary check to see if any specific field actually updated
    const payloadShort = {
      memos: payload.memos.map((m) => ({ id: m.id, date: m.date, totalBill: m.totalBill, cashPaid: m.cashPaid, remainingDue: m.remainingDue })),
      parties: payload.parties.map((p) => ({ id: p.id, currentDue: p.currentDue, phone: p.phone })),
      suppliers: (payload.suppliers || []).map((s) => ({ id: s.id, totalPayable: s.totalPayable })),
      expenses: (payload.expenses || []).map((e) => ({ id: e.id, amount: e.amount })),
      shopProfile: { name: payload.shopProfile.name, mobile: payload.shopProfile.mobile },
      baseRate: { redRate: payload.baseRate.redRate, whiteRate: payload.baseRate.whiteRate }
    };

    const backupShort = {
      memos: backup.memos.map((m) => ({ id: m.id, date: m.date, totalBill: m.totalBill, cashPaid: m.cashPaid, remainingDue: m.remainingDue })),
      parties: backup.parties.map((p) => ({ id: p.id, currentDue: p.currentDue, phone: p.phone })),
      suppliers: (backup.suppliers || []).map((s) => ({ id: s.id, totalPayable: s.totalPayable })),
      expenses: (backup.expenses || []).map((e) => ({ id: e.id, amount: e.amount })),
      shopProfile: { name: backup.shopProfile.name, mobile: backup.shopProfile.mobile },
      baseRate: { redRate: backup.baseRate.redRate, whiteRate: backup.baseRate.whiteRate }
    };

    return JSON.stringify(payloadShort) === JSON.stringify(backupShort);
  } catch {
    return false;
  }
}

/**
 * Perform Online Cloud Backup
 */
export async function performOnlineBackup(payload: {
  shopProfile: ShopProfile;
  baseRate: BaseRate;
  parties: Party[];
  memos: Memo[];
  suppliers?: Supplier[];
  supplierChalans?: SupplierChalan[];
  supplierPayments?: SupplierPayment[];
  expenses?: ExpenseRecord[];
  userAccount?: AuthUser | null;
}): Promise<{ success: boolean; backup: CloudBackupRecord; message: string }> {
  // Check if incoming payload is already identical to the latest online backup we have
  try {
    const latestRaw = localStorage.getItem(STORAGE_KEY_LATEST);
    if (latestRaw) {
      const latestBackup = JSON.parse(latestRaw) as CloudBackupRecord;
      if (latestBackup && isPayloadEqualToBackup(payload, latestBackup)) {
        return {
          success: true,
          backup: latestBackup,
          message: 'ডেটা ইতিমধ্যেই ক্লাউডের সাথে সুসংগত (Synced) রয়েছে।',
        };
      }
    }
  } catch (err) {
    // ignore
  }

  const timestamp = Date.now();
  const formattedDate = getBengaliFormattedTimestamp();
  const backupId = `cloud-bak-${timestamp}`;

  // Check user account if not passed explicitly
  let currentAuth: AuthUser | null = payload.userAccount || null;
  if (!currentAuth) {
    try {
      const stored = localStorage.getItem('egg_arat_auth_user');
      if (stored) currentAuth = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const totalBill = payload.memos.reduce((sum, m) => sum + (m.totalBill || 0), 0);
  const totalDue = payload.parties.reduce((sum, p) => sum + (p.currentDue || 0), 0);

  const backupRecord: CloudBackupRecord = {
    backupId,
    backupTimestamp: timestamp,
    formattedDate,
    userAccount: currentAuth ? {
      id: currentAuth.id,
      name: currentAuth.name,
      provider: currentAuth.provider || (currentAuth.email ? 'google' : 'mobile'),
      phone: currentAuth.phone,
      email: currentAuth.email,
    } : undefined,
    shopProfile: payload.shopProfile,
    baseRate: payload.baseRate,
    parties: payload.parties,
    memos: payload.memos,
    suppliers: payload.suppliers || [],
    supplierChalans: payload.supplierChalans || [],
    supplierPayments: payload.supplierPayments || [],
    expenses: payload.expenses || [],
    summary: {
      totalMemos: payload.memos.length,
      totalParties: payload.parties.length,
      totalSuppliers: (payload.suppliers || []).length,
      totalExpenses: (payload.expenses || []).length,
      totalBill,
      totalDue,
    },
  };

  // 1. Save to local cloud mirror first (guarantees offline/container resilience)
  try {
    localStorage.setItem(STORAGE_KEY_LATEST, JSON.stringify(backupRecord));

    if (currentAuth) {
      localStorage.setItem(`egg_arat_cloud_user_${currentAuth.id}`, JSON.stringify(backupRecord));
      if (currentAuth.provider === 'google' || currentAuth.email) {
        localStorage.setItem(STORAGE_KEY_GOOGLE, JSON.stringify(backupRecord));
      } else {
        localStorage.setItem(STORAGE_KEY_MOBILE, JSON.stringify(backupRecord));
      }
    }

    const existingHistoryRaw = localStorage.getItem(STORAGE_KEY_HISTORY);
    const history: CloudBackupRecord[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
    // Keep last 15 backups
    const updatedHistory = [backupRecord, ...history.filter(b => b.backupId !== backupId)].slice(0, 15);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.warn('LocalStorage backup failed:', err);
  }

  // 2. Save directly to Firebase Firestore (writes 1 snapshot doc)
  if (!isFirestoreQuotaExceeded) {
    try {
      const targetUid = currentAuth?.id;
      await saveBackupToFirebase(backupRecord, targetUid);
      console.info('Firebase Firestore backup successful');
    } catch (fbErr) {
      console.warn('Firebase sync notice:', fbErr);
    }
  }

  // 3. Save to Cloud SQL / PostgreSQL (Supabase compatible backend)
  try {
    await syncDataToCloudSql({
      shopProfile: payload.shopProfile,
      baseRate: payload.baseRate,
      parties: payload.parties,
      memos: payload.memos,
      suppliers: payload.suppliers,
      supplierChalans: payload.supplierChalans,
      supplierPayments: payload.supplierPayments,
      expenses: payload.expenses,
      hasData: true,
      totalMemos: payload.memos.length,
      totalParties: payload.parties.length,
      totalSuppliers: (payload.suppliers || []).length,
      totalExpenses: (payload.expenses || []).length,
      lastBackupDate: new Date().toISOString(),
    });
    console.info('Cloud SQL / PostgreSQL sync complete');
  } catch (sqlErr) {
    console.warn('Cloud SQL sync notice:', sqlErr);
  }

  // 4. Save to Supabase Cloud Client
  if (currentAuth?.id) {
    try {
      await saveToSupabaseCloud(currentAuth.id, {
        shopProfile: payload.shopProfile,
        baseRate: payload.baseRate,
        parties: payload.parties,
        memos: payload.memos,
        suppliers: payload.suppliers,
        supplierChalans: payload.supplierChalans,
        supplierPayments: payload.supplierPayments,
        expenses: payload.expenses,
        hasData: true,
        totalMemos: payload.memos.length,
        totalParties: payload.parties.length,
        totalSuppliers: (payload.suppliers || []).length,
        totalExpenses: (payload.expenses || []).length,
        lastBackupDate: new Date().toISOString(),
      });
      console.info('Supabase cloud backup complete');
    } catch (sbErr) {
      console.warn('Supabase sync notice:', sbErr);
    }
  }

  return {
    success: true,
    backup: backupRecord,
    message: 'PostgreSQL / Supabase ক্লাউড ডাটাবেজে সফলভাবে ব্যাকআপ সংরক্ষিত হয়েছে।',
  };
}

/**
 * Fetch cloud backup specific to account (Mobile or Google)
 */
export function fetchAccountCloudBackup(provider?: 'mobile' | 'google' | 'email' | 'universal' | string, userId?: string): CloudBackupRecord | null {
  try {
    if (userId) {
      const userSpecific = localStorage.getItem(`egg_arat_cloud_user_${userId}`);
      if (userSpecific) return JSON.parse(userSpecific);
    }
    if (provider === 'google') {
      const googleBak = localStorage.getItem(STORAGE_KEY_GOOGLE);
      if (googleBak) return JSON.parse(googleBak);
    } else if (provider === 'mobile') {
      const mobileBak = localStorage.getItem(STORAGE_KEY_MOBILE);
      if (mobileBak) return JSON.parse(mobileBak);
    }
    const latest = localStorage.getItem(STORAGE_KEY_LATEST);
    if (latest) return JSON.parse(latest);
  } catch (err) {
    console.error('Error fetching account backup:', err);
  }
  return null;
}

/**
 * Fetch the latest online cloud backup
 */
export async function fetchLatestOnlineBackup(userId?: string): Promise<CloudBackupRecord | null> {
  // 1. Try Firebase Firestore first
  try {
    const fbBackups = await fetchBackupsFromFirebase(userId);
    if (fbBackups.length > 0) {
      localStorage.setItem(STORAGE_KEY_LATEST, JSON.stringify(fbBackups[0]));
      return fbBackups[0];
    }
  } catch (fbErr) {
    console.warn('Firebase fetch latest backup notice:', fbErr);
  }

  // 2. Try PostgreSQL / Supabase Cloud SQL
  try {
    const cloudSqlData = await loadDataFromCloudSql();
    if (cloudSqlData && (cloudSqlData.memos?.length || cloudSqlData.parties?.length)) {
      const sqlBackupRecord: CloudBackupRecord = {
        backupId: `cloud-sql-${Date.now()}`,
        backupTimestamp: Date.now(),
        formattedDate: getBengaliFormattedTimestamp(),
        shopProfile: cloudSqlData.shopProfile || {
          name: 'মেসার্স আল্লাহর দান ডিমের আড়ৎ',
          tagline: 'পাইকারি ও খুচরা ডিম বিক্রেতা',
          proprietor: 'মো: আনোয়ার হোসেন',
          mobile: '০১৭১২-৩৪৫৬৭৮',
          address: 'আড়ৎ পট্টি, কাপ্তান বাজার, ঢাকা',
          memoFooter: 'বিক্রিত ডিম কোনো অবস্থাতেই ফেরত নেওয়া হয় না।',
        },
        baseRate: cloudSqlData.baseRate || {
          redRate: 1170,
          whiteRate: 1120,
          duckRate: 1350,
          quailRate: 350,
          effectiveDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString(),
        },
        parties: cloudSqlData.parties || [],
        memos: cloudSqlData.memos || [],
        suppliers: cloudSqlData.suppliers || [],
        supplierChalans: cloudSqlData.supplierChalans || [],
        supplierPayments: cloudSqlData.supplierPayments || [],
        expenses: cloudSqlData.expenses || [],
        summary: {
          totalMemos: (cloudSqlData.memos || []).length,
          totalParties: (cloudSqlData.parties || []).length,
          totalSuppliers: (cloudSqlData.suppliers || []).length,
          totalExpenses: (cloudSqlData.expenses || []).length,
          totalBill: (cloudSqlData.memos || []).reduce((s, m) => s + (m.totalBill || 0), 0),
          totalDue: (cloudSqlData.parties || []).reduce((s, p) => s + (p.currentDue || 0), 0),
        },
      };
      localStorage.setItem(STORAGE_KEY_LATEST, JSON.stringify(sqlBackupRecord));
      return sqlBackupRecord;
    }
  } catch (sqlErr) {
    console.info('Cloud SQL load notice:', sqlErr);
  }

  // 3. Try Direct Supabase Cloud
  if (userId) {
    try {
      const sbData = await fetchFromSupabaseCloud(userId);
      if (sbData && (sbData.memos?.length || sbData.parties?.length)) {
        const sbBackupRecord: CloudBackupRecord = {
          backupId: `supabase-${Date.now()}`,
          backupTimestamp: Date.now(),
          formattedDate: getBengaliFormattedTimestamp(),
          shopProfile: sbData.shopProfile || {
            name: 'মেসার্স আল্লাহর দান ডিমের আড়ৎ',
            tagline: 'পাইকারি ও খুচরা ডিম বিক্রেতা',
            proprietor: 'মো: আনোয়ার হোসেন',
            mobile: '০১৭১২-৩৪৫৬৭৮',
            address: 'আড়ৎ পট্টি, কাপ্তান বাজার, ঢাকা',
            memoFooter: 'বিক্রিত ডিম কোনো অবস্থাতেই ফেরত নেওয়া হয় না।',
          },
          baseRate: sbData.baseRate || {
            redRate: 1170,
            whiteRate: 1120,
            duckRate: 1350,
            quailRate: 350,
            effectiveDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString(),
          },
          parties: sbData.parties || [],
          memos: sbData.memos || [],
          suppliers: sbData.suppliers || [],
          supplierChalans: sbData.supplierChalans || [],
          supplierPayments: sbData.supplierPayments || [],
          expenses: sbData.expenses || [],
          summary: {
            totalMemos: (sbData.memos || []).length,
            totalParties: (sbData.parties || []).length,
            totalSuppliers: (sbData.suppliers || []).length,
            totalExpenses: (sbData.expenses || []).length,
            totalBill: (sbData.memos || []).reduce((s, m) => s + (m.totalBill || 0), 0),
            totalDue: (sbData.parties || []).reduce((s, p) => s + (p.currentDue || 0), 0),
          },
        };
        localStorage.setItem(STORAGE_KEY_LATEST, JSON.stringify(sbBackupRecord));
        return sbBackupRecord;
      }
    } catch (sbErr) {
      console.info('Supabase fetch notice:', sbErr);
    }
  }

  // Fallback to local cloud mirror
  try {
    const local = localStorage.getItem(STORAGE_KEY_LATEST);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Failed to parse local cloud backup:', e);
  }

  return null;
}

/**
 * Get online cloud backup history
 */
export async function getOnlineBackupsHistory(): Promise<CloudBackupRecord[]> {
  // 1. Try Firebase Firestore first
  try {
    const fbBackups = await fetchBackupsFromFirebase();
    if (fbBackups.length > 0) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(fbBackups));
      return fbBackups;
    }
  } catch (fbErr) {
    console.warn('Firebase backup history notice:', fbErr);
  }

  // 2. Try server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/cloud-backups', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.backups) && data.backups.length > 0) {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(data.backups));
        return data.backups;
      }
    }
  } catch (e) {
    // silent fallback
  }

  // Fallback to local mirror
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse backup history:', e);
  }

  return [];
}

/**
 * Check Auto Cloud Sync status
 */
export function isAutoCloudSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_AUTOSYNC);
    return val !== null ? JSON.parse(val) : true; // default true
  } catch {
    return true;
  }
}

/**
 * Set Auto Cloud Sync status
 */
export function setAutoCloudSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTOSYNC, JSON.stringify(enabled));
  } catch (e) {
    console.error(e);
  }
}
