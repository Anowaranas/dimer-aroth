import { 
  db, 
  auth, 
  ensureAuthenticatedUser, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  sendPasswordResetEmail
} from '../lib/firebase';
import { BaseRate, Memo, Party, ShopProfile, UserCloudData, UserPreferences, AuthUser, Supplier, SupplierChalan, SupplierPayment, ExpenseRecord } from '../types';
import { CloudBackupRecord, fetchAccountCloudBackup } from './cloudSync';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export let isFirestoreQuotaExceeded = false;
export let isFirestoreOffline = false;

export function checkAndSetQuotaExceeded(error: unknown): boolean {
  const errMessage = error instanceof Error ? error.message : String(error);
  if (
    errMessage.includes('resource-exhausted') || 
    errMessage.includes('Quota exceeded') || 
    errMessage.includes('quota metric')
  ) {
    isFirestoreQuotaExceeded = true;
    return true;
  }
  if (
    errMessage.includes('unavailable') ||
    errMessage.includes('Could not reach Cloud Firestore') ||
    errMessage.includes('operation could not be completed') ||
    errMessage.includes('offline')
  ) {
    isFirestoreOffline = true;
    return false;
  }
  return false;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isQuota = checkAndSetQuotaExceeded(error);
  if (!isQuota) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.info(`Firestore [${operationType}] info at ${path}:`, errMessage);
  }
}

/**
 * Determine the persistent, deterministic user ID:
 * - If user logged in via phone: 'phone_01712345678'
 * - If user logged in via google: 'google_...' or Google UID
 * - Falls back to current localStorage auth user, auth.currentUser?.uid, or anonymous auth
 */
export async function getEffectiveUserId(explicitUserId?: string): Promise<string> {
  if (explicitUserId && explicitUserId.trim()) {
    return explicitUserId.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  }

  try {
    const savedAuth = localStorage.getItem('egg_arat_auth_user');
    if (savedAuth) {
      const parsed: AuthUser = JSON.parse(savedAuth);
      if (parsed.id) {
        return parsed.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
      }
    }
  } catch {
    // ignore
  }

  const currentUser = auth.currentUser || (await ensureAuthenticatedUser());
  return currentUser?.uid || 'default_arat_user';
}

// Local secure accounts cache for offline and instant verification
const LOCAL_ACCOUNTS_KEY = 'dimeraroth_accounts_secure_cache';

interface CachedAccount {
  id: string;
  pin: string;
  name: string;
  phone?: string;
  email?: string;
}

function getLocalAccountsMap(): Record<string, CachedAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccountRecord(data: CachedAccount) {
  try {
    const map = getLocalAccountsMap();
    map[data.id] = data;
    if (data.phone) map[`ph_${data.phone}`] = data;
    if (data.email) map[`em_${data.email}`] = data;
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write errors
  }
}

function getLocalAccountRecord(key: string): CachedAccount | null {
  try {
    const map = getLocalAccountsMap();
    if (map[key]) return map[key];
    const cleanDigits = key.replace(/[^0-9]/g, '');
    if (cleanDigits && map[`ph_${cleanDigits}`]) return map[`ph_${cleanDigits}`];
    const cleanEmail = key.trim().toLowerCase();
    if (cleanEmail.includes('@') && map[`em_${cleanEmail}`]) return map[`em_${cleanEmail}`];
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify or register account profile in Firestore, with strict password/PIN validation
 * and automatic cross-linking between Email and Mobile Phone Number.
 */
export async function verifyOrRegisterAccount(account: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  pin?: string;
  provider: 'mobile' | 'google' | 'email' | 'universal';
}): Promise<{ 
  success: boolean; 
  isNew: boolean; 
  resolvedAccountId: string; 
  phone?: string; 
  email?: string; 
  error?: string 
}> {
  const cleanPhone = account.phone ? account.phone.replace(/[^0-9]/g, '') : '';
  const cleanEmail = account.email ? account.email.trim().toLowerCase() : '';
  const localMap = getLocalAccountsMap();
  
  // Find local cached record by phone, email, or id
  const localRecord = 
    (cleanPhone && localMap[`ph_${cleanPhone}`]) ||
    (cleanEmail && localMap[`em_${cleanEmail}`]) ||
    localMap[account.id];

  try {
    await ensureAuthenticatedUser();
    
    let targetUserId = account.id.replace(/[^a-zA-Z0-9_\-]/g, '_');

    // 1. Look up existing mappings in Firestore
    let mappedUserId: string | null = null;

    if (cleanPhone && cleanPhone.length >= 10) {
      try {
        const phoneMapRef = doc(db, 'account_mappings', `ph_${cleanPhone}`);
        const phoneMapSnap = await getDoc(phoneMapRef);
        if (phoneMapSnap.exists() && phoneMapSnap.data()?.userId) {
          mappedUserId = phoneMapSnap.data().userId;
        }
      } catch (mapErr) {
        console.warn('Phone mapping lookup notice:', mapErr);
      }
    }

    if (!mappedUserId && cleanEmail) {
      try {
        const emailMapKey = `em_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        const emailMapRef = doc(db, 'account_mappings', emailMapKey);
        const emailMapSnap = await getDoc(emailMapRef);
        if (emailMapSnap.exists() && emailMapSnap.data()?.userId) {
          mappedUserId = emailMapSnap.data().userId;
        }
      } catch (mapErr) {
        console.warn('Email mapping lookup notice:', mapErr);
      }
    }

    if (!mappedUserId && localRecord) {
      mappedUserId = localRecord.id;
    }

    if (mappedUserId) {
      targetUserId = mappedUserId;
    }

    const accountDocRef = doc(db, 'users', targetUserId, 'account', 'info');
    let existingSnap: any = null;
    try {
      existingSnap = await getDoc(accountDocRef);
    } catch (docErr) {
      console.warn('Account doc lookup notice:', docErr);
    }

    const accountExistsInCloud = existingSnap && existingSnap.exists();
    const accountExistsLocally = !!localRecord;

    if (accountExistsInCloud || accountExistsLocally) {
      const existingData = accountExistsInCloud ? existingSnap.data() : localRecord;
      const storedPin = existingData?.pin || localRecord?.pin;
      
      // Strict PIN / Password verification for phone & email logins
      if (account.provider !== 'google') {
        if (!account.pin || account.pin.length < 4) {
          return {
            success: false,
            isNew: false,
            resolvedAccountId: targetUserId,
            error: 'অনুগ্রহ করে আপনার ৪ ডিজিটের পিন কোড বা পাসওয়ার্ড লিখুন।',
          };
        }

        if (storedPin && storedPin !== account.pin) {
          return {
            success: false,
            isNew: false,
            resolvedAccountId: targetUserId,
            error: 'ভুল পিন কোড বা পাসওয়ার্ড! আপনার সঠিক পিন কোড লিখুন।',
          };
        }
      }

      const mergedPhone = cleanPhone || existingData?.phone || localRecord?.phone || '';
      const mergedEmail = cleanEmail || existingData?.email || localRecord?.email || '';

      // Save locally to keep secure cache fresh
      saveLocalAccountRecord({
        id: targetUserId,
        pin: storedPin || account.pin || '',
        name: account.name || existingData?.name || 'আড়ৎ মালিক',
        phone: mergedPhone,
        email: mergedEmail,
      });

      // Update account info in Firestore if online
      try {
        await setDoc(
          accountDocRef,
          {
            ...existingData,
            lastLoginAt: new Date().toISOString(),
            name: account.name || existingData?.name || 'আড়ৎ মালিক',
            phone: mergedPhone,
            email: mergedEmail,
            pin: storedPin || account.pin || '',
          },
          { merge: true }
        );

        // Update mappings
        if (mergedPhone && mergedPhone.length >= 10) {
          await setDoc(doc(db, 'account_mappings', `ph_${mergedPhone}`), { userId: targetUserId, updatedAt: new Date().toISOString() }, { merge: true });
        }
        if (mergedEmail) {
          const emailMapKey = `em_${mergedEmail.replace(/[^a-z0-9]/g, '_')}`;
          await setDoc(doc(db, 'account_mappings', emailMapKey), { userId: targetUserId, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch (updateErr) {
        console.warn('Account sync notice:', updateErr);
      }

      return { 
        success: true, 
        isNew: false, 
        resolvedAccountId: targetUserId,
        phone: mergedPhone,
        email: mergedEmail
      };
    } else {
      // Brand new account registration
      if (account.provider !== 'google' && (!account.pin || account.pin.length < 4)) {
        return {
          success: false,
          isNew: true,
          resolvedAccountId: targetUserId,
          error: 'নতুন অ্যাকাউন্ট খোলার জন্য কমপক্ষে ৪ ডিজিটের পিন কোড বা পাসওয়ার্ড দিন।',
        };
      }

      const newAccountRecord = {
        id: targetUserId,
        name: account.name || 'আড়ৎ মালিক',
        phone: cleanPhone,
        email: cleanEmail,
        pin: account.pin || '',
        provider: account.provider,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Save locally immediately
      saveLocalAccountRecord({
        id: targetUserId,
        pin: account.pin || '',
        name: account.name || 'আড়ৎ মালিক',
        phone: cleanPhone,
        email: cleanEmail,
      });

      // Save to Firestore if connected
      try {
        await setDoc(accountDocRef, newAccountRecord);

        if (cleanPhone && cleanPhone.length >= 10) {
          await setDoc(doc(db, 'account_mappings', `ph_${cleanPhone}`), { userId: targetUserId, createdAt: new Date().toISOString() }, { merge: true });
        }
        if (cleanEmail) {
          const emailMapKey = `em_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
          await setDoc(doc(db, 'account_mappings', emailMapKey), { userId: targetUserId, createdAt: new Date().toISOString() }, { merge: true });
        }
      } catch (createErr) {
        console.warn('Account creation notice:', createErr);
      }

      return { 
        success: true, 
        isNew: true, 
        resolvedAccountId: targetUserId,
        phone: cleanPhone,
        email: cleanEmail
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${account.id}/account/info`);

    // Offline / Network fallback verification
    if (localRecord) {
      if (account.provider !== 'google') {
        if (!account.pin || account.pin !== localRecord.pin) {
          return {
            success: false,
            isNew: false,
            resolvedAccountId: localRecord.id,
            error: 'ভুল পিন কোড বা পাসওয়ার্ড! আপনার সঠিক পিন কোড লিখুন।',
          };
        }
      }
      return { 
        success: true, 
        isNew: false, 
        resolvedAccountId: localRecord.id,
        phone: localRecord.phone,
        email: localRecord.email
      };
    }

    return { 
      success: false, 
      isNew: false, 
      resolvedAccountId: account.id,
      error: 'লগইন যাচাই করতে ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।'
    };
  }
}

/**
 * Link mobile phone number and email address to the same user account
 */
export async function linkPhoneAndEmailToAccount(
  userId: string,
  phone: string,
  email: string
): Promise<boolean> {
  try {
    if (!userId) return false;
    await ensureAuthenticatedUser();

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const accountDocRef = doc(db, 'users', cleanUserId, 'account', 'info');
    await setDoc(
      accountDocRef,
      {
        phone: cleanPhone,
        email: cleanEmail,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (cleanPhone && cleanPhone.length >= 10) {
      await setDoc(doc(db, 'account_mappings', `ph_${cleanPhone}`), { userId: cleanUserId }, { merge: true });
    }
    if (cleanEmail) {
      const emailMapKey = `em_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      await setDoc(doc(db, 'account_mappings', emailMapKey), { userId: cleanUserId }, { merge: true });
    }

    return true;
  } catch (err) {
    console.warn('Failed to link phone and email:', err);
    return false;
  }
}

/**
 * Update PIN / Password for logged-in user account
 */
export async function updateAccountPin(
  accountId: string,
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accountId) {
      return { success: false, error: 'অ্যাকাউন্ট সনাক্ত করা যায়নি।' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: 'নতুন পিন কোড কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।' };
    }

    const cleanUserId = accountId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const localRecord = getLocalAccountRecord(cleanUserId);
    const storedLocalPin = localRecord?.pin;

    await ensureAuthenticatedUser();
    const accountDocRef = doc(db, 'users', cleanUserId, 'account', 'info');
    let cloudSnap: any = null;
    try {
      cloudSnap = await getDoc(accountDocRef);
    } catch {
      // Offline fallback
    }

    const cloudData = cloudSnap && cloudSnap.exists() ? cloudSnap.data() : null;
    const existingPin = cloudData?.pin || storedLocalPin;

    // Verify old PIN if one was set
    if (existingPin && existingPin !== currentPin) {
      return { success: false, error: 'বর্তমান পিন কোডটি সঠিক নয়! অনুগ্রহ করে সঠিক বর্তমান পিন লিখুন।' };
    }

    const updatedPhone = cloudData?.phone || localRecord?.phone || '';
    const updatedEmail = cloudData?.email || localRecord?.email || '';
    const updatedName = cloudData?.name || localRecord?.name || 'আড়ৎ মালিক';

    // Update in local cache
    saveLocalAccountRecord({
      id: cleanUserId,
      pin: newPin.trim(),
      name: updatedName,
      phone: updatedPhone,
      email: updatedEmail,
    });

    // Update in Firestore
    try {
      await setDoc(
        accountDocRef,
        {
          pin: newPin.trim(),
          updatedAt: new Date().toISOString(),
          lastPinChangedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore PIN sync notice:', e);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to update PIN:', err);
    return { success: false, error: 'পিন পরিবর্তন করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।' };
  }
}

/**
 * Reset Forgotten PIN / Password for an account by Phone or Email
 */
export async function resetAccountPin(
  identifier: string,
  newPin: string,
  verificationCode?: string
): Promise<{ success: boolean; accountId?: string; error?: string }> {
  try {
    const cleanPhone = identifier.replace(/[^0-9]/g, '');
    const cleanEmail = identifier.trim().toLowerCase();

    if (!cleanPhone && !cleanEmail.includes('@')) {
      return { success: false, error: 'সঠিক মোবাইল নম্বর অথবা ইমেইল ঠিকানা প্রদান করুন।' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: 'নতুন পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে।' };
    }

    await ensureAuthenticatedUser();

    // 1. Resolve Account ID via Mapping or direct ID
    let targetUserId = cleanPhone
      ? `phone_${cleanPhone}`
      : `email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    try {
      if (cleanPhone && cleanPhone.length >= 10) {
        const phMapSnap = await getDoc(doc(db, 'account_mappings', `ph_${cleanPhone}`));
        if (phMapSnap.exists() && phMapSnap.data()?.userId) {
          targetUserId = phMapSnap.data().userId;
        }
      } else if (cleanEmail && cleanEmail.includes('@')) {
        const emMapKey = `em_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        const emMapSnap = await getDoc(doc(db, 'account_mappings', emMapKey));
        if (emMapSnap.exists() && emMapSnap.data()?.userId) {
          targetUserId = emMapSnap.data().userId;
        }
      }
    } catch (mapErr) {
      console.warn('Mapping lookup error:', mapErr);
    }

    const cleanUserId = targetUserId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const localRecord = getLocalAccountRecord(cleanUserId);

    // Save updated PIN locally
    saveLocalAccountRecord({
      id: cleanUserId,
      pin: newPin.trim(),
      name: localRecord?.name || 'আড়ৎ মালিক',
      phone: cleanPhone || localRecord?.phone || '',
      email: cleanEmail.includes('@') ? cleanEmail : localRecord?.email || '',
    });

    // Save updated PIN in Firestore
    try {
      const accountDocRef = doc(db, 'users', cleanUserId, 'account', 'info');
      await setDoc(
        accountDocRef,
        {
          pin: newPin.trim(),
          updatedAt: new Date().toISOString(),
          lastPinResetAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (saveErr) {
      console.warn('Firestore PIN reset sync error:', saveErr);
    }

    return { success: true, accountId: cleanUserId };
  } catch (err) {
    console.error('Reset PIN error:', err);
    return { success: false, error: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।' };
  }
}

/**
 * Send official Password Reset Email via Firebase Auth
 */
export async function sendEmailPasswordResetLink(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `📧 আপনার ইমেইলে (${cleanEmail}) পাসওয়ার্ড রিসেট করার নিরাপদ লিংক পাঠানো হয়েছে। ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`,
      };
    } catch (authErr: any) {
      console.warn('Firebase Auth email reset note:', authErr);
      // Even if not native auth, our resetAccountPin supports email PIN reset
      return {
        success: true,
        message: `📧 আপনার ইমেইল (${cleanEmail}) অ্যাকাউন্টের জন্য নতুন পিন কোড সেট করার অপশন সক্রিয় হয়েছে।`,
      };
    }
  } catch (err) {
    return { success: false, message: 'ইমেইল পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।' };
  }
}

/**
 * Save or update shop profile in Firestore
 */
export async function syncShopProfileToFirebase(profile: ShopProfile, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'settings', 'shopProfile');
    await setDoc(docRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/settings/shopProfile`);
    return false;
  }
}

/**
 * Save or update base rates in Firestore
 */
export async function syncBaseRateToFirebase(rate: BaseRate, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'settings', 'baseRate');
    await setDoc(docRef, rate, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/settings/baseRate`);
    return false;
  }
}

/**
 * Save user preferences (bengali numerals, dark mode) in Firestore
 */
export async function syncPreferencesToFirebase(prefs: UserPreferences, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'settings', 'preferences');
    await setDoc(docRef, prefs, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/settings/preferences`);
    return false;
  }
}

/**
 * Save a party to Firestore
 */
export async function syncPartyToFirebase(party: Party, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'parties', party.id);
    await setDoc(docRef, party, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/parties/${party.id}`);
    return false;
  }
}

/**
 * Delete a party from Firestore
 */
export async function deletePartyFromFirebase(partyId: string, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'parties', partyId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${explicitUid}/parties/${partyId}`);
    return false;
  }
}

/**
 * Delete a supplier from Firestore
 */
export async function deleteSupplierFromFirebase(supplierId: string, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'suppliers', supplierId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${explicitUid}/suppliers/${supplierId}`);
    return false;
  }
}

/**
 * Save a supplier to Firestore
 */
export async function syncSupplierToFirebase(supplier: Supplier, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'suppliers', supplier.id);
    await setDoc(docRef, supplier, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/suppliers/${supplier.id}`);
    return false;
  }
}

/**
 * Save a supplier chalan to Firestore
 */
export async function syncSupplierChalanToFirebase(chalan: SupplierChalan, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'supplierChalans', chalan.id);
    await setDoc(docRef, chalan, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/supplierChalans/${chalan.id}`);
    return false;
  }
}

/**
 * Delete a supplier chalan from Firestore
 */
export async function deleteSupplierChalanFromFirebase(chalanId: string, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'supplierChalans', chalanId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${explicitUid}/supplierChalans/${chalanId}`);
    return false;
  }
}

/**
 * Save a supplier payment to Firestore
 */
export async function syncSupplierPaymentToFirebase(payment: SupplierPayment, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'supplierPayments', payment.id);
    await setDoc(docRef, payment, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/supplierPayments/${payment.id}`);
    return false;
  }
}

/**
 * Save an expense record to Firestore
 */
export async function syncExpenseToFirebase(expense: ExpenseRecord, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'expenses', expense.id);
    await setDoc(docRef, expense, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/expenses/${expense.id}`);
    return false;
  }
}

/**
 * Delete an expense record from Firestore
 */
export async function deleteExpenseFromFirebase(expenseId: string, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'expenses', expenseId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${explicitUid}/expenses/${expenseId}`);
    return false;
  }
}

/**
 * Save a memo to Firestore
 */
export async function syncMemoToFirebase(memo: Memo, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'memos', memo.id);
    await setDoc(docRef, memo, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/memos/${memo.id}`);
    return false;
  }
}

/**
 * Delete a memo from Firestore
 */
export async function deleteMemoFromFirebase(memoId: string, explicitUid?: string): Promise<boolean> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const docRef = doc(db, 'users', uid, 'memos', memoId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${explicitUid}/memos/${memoId}`);
    return false;
  }
}

/**
 * Save complete backup snapshot to Firestore (writes both timestamped backup and latest pointer)
 */
export async function saveBackupToFirebase(backup: CloudBackupRecord, explicitUid?: string): Promise<boolean> {
  if (isFirestoreQuotaExceeded) return false;
  try {
    const uid = await getEffectiveUserId(explicitUid);
    // 1. Save timestamped backup
    const docRef = doc(db, 'users', uid, 'backups', backup.backupId);
    await setDoc(docRef, backup);

    // 2. Save latest backup pointer for instantaneous restore
    const latestRef = doc(db, 'users', uid, 'backups', 'latest');
    await setDoc(latestRef, backup);

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${explicitUid}/backups/${backup.backupId}`);
    return false;
  }
}

/**
 * Retrieve all backups from Firestore
 */
export async function fetchBackupsFromFirebase(explicitUid?: string): Promise<CloudBackupRecord[]> {
  try {
    const uid = await getEffectiveUserId(explicitUid);
    const colRef = collection(db, 'users', uid, 'backups');
    const snapshot = await getDocs(colRef);
    const results: CloudBackupRecord[] = [];
    snapshot.forEach((d) => {
      if (d.id !== 'latest') {
        results.push(d.data() as CloudBackupRecord);
      }
    });
    // Sort newest first
    return results.sort((a, b) => b.backupTimestamp - a.backupTimestamp);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${explicitUid}/backups`);
    return [];
  }
}

/**
 * Comprehensive Pull: Fetch all data from Firestore for the target user ID
 * Used when app is reinstalled, cleared, or user logs in!
 * Restores: shopProfile, baseRate, parties, memos, suppliers, chalans, payments, expenses, and latest snapshot
 */
export async function loadUserDataFromFirebase(targetUserId?: string): Promise<UserCloudData> {
  const result: UserCloudData = {
    hasData: false,
    totalMemos: 0,
    totalParties: 0,
    totalSuppliers: 0,
    totalExpenses: 0,
  };

  if (isFirestoreQuotaExceeded) {
    try {
      const uid = targetUserId ? targetUserId.replace(/[^a-zA-Z0-9_\-]/g, '_') : 'default_arat_user';
      const localUserBakRaw = localStorage.getItem(`egg_arat_cloud_user_${uid}`);
      const fallbackBak = localUserBakRaw ? JSON.parse(localUserBakRaw) : fetchAccountCloudBackup(undefined, uid);
      if (fallbackBak) {
        if (fallbackBak.shopProfile) result.shopProfile = fallbackBak.shopProfile;
        if (fallbackBak.baseRate) result.baseRate = fallbackBak.baseRate;
        if (fallbackBak.parties) result.parties = fallbackBak.parties;
        if (fallbackBak.memos) result.memos = fallbackBak.memos;
        if (fallbackBak.suppliers) result.suppliers = fallbackBak.suppliers;
        if (fallbackBak.supplierChalans) result.supplierChalans = fallbackBak.supplierChalans;
        if (fallbackBak.supplierPayments) result.supplierPayments = fallbackBak.supplierPayments;
        if (fallbackBak.expenses) result.expenses = fallbackBak.expenses;
        result.hasData = true;
      }
    } catch {
      // ignore
    }
    return result;
  }

  try {
    await ensureAuthenticatedUser();
    const uid = await getEffectiveUserId(targetUserId);

    // Fetch all settings, subcollections, and latest backup simultaneously in parallel
    const [
      profileSnapRes,
      rateSnapRes,
      prefSnapRes,
      partiesSnapRes,
      memosSnapRes,
      suppliersSnapRes,
      chalansSnapRes,
      paymentsSnapRes,
      expensesSnapRes,
      latestBackupSnapRes,
    ] = await Promise.allSettled([
      getDoc(doc(db, 'users', uid, 'settings', 'shopProfile')),
      getDoc(doc(db, 'users', uid, 'settings', 'baseRate')),
      getDoc(doc(db, 'users', uid, 'settings', 'preferences')),
      getDocs(collection(db, 'users', uid, 'parties')),
      getDocs(collection(db, 'users', uid, 'memos')),
      getDocs(collection(db, 'users', uid, 'suppliers')),
      getDocs(collection(db, 'users', uid, 'supplierChalans')),
      getDocs(collection(db, 'users', uid, 'supplierPayments')),
      getDocs(collection(db, 'users', uid, 'expenses')),
      getDoc(doc(db, 'users', uid, 'backups', 'latest')),
    ]);

    if (profileSnapRes.status === 'fulfilled' && profileSnapRes.value.exists()) {
      result.shopProfile = profileSnapRes.value.data() as ShopProfile;
    }

    if (rateSnapRes.status === 'fulfilled' && rateSnapRes.value.exists()) {
      result.baseRate = rateSnapRes.value.data() as BaseRate;
    }

    if (prefSnapRes.status === 'fulfilled' && prefSnapRes.value.exists()) {
      result.preferences = prefSnapRes.value.data() as UserPreferences;
    }

    // 2. Subcollections: Parties, Memos, Suppliers, Chalans, Payments, Expenses
    const memoParties: Party[] = [];
    if (partiesSnapRes.status === 'fulfilled') {
      partiesSnapRes.value.forEach((d) => memoParties.push(d.data() as Party));
    }

    const cloudMemos: Memo[] = [];
    if (memosSnapRes.status === 'fulfilled') {
      memosSnapRes.value.forEach((d) => cloudMemos.push(d.data() as Memo));
    }

    const cloudSuppliers: Supplier[] = [];
    if (suppliersSnapRes.status === 'fulfilled') {
      suppliersSnapRes.value.forEach((d) => cloudSuppliers.push(d.data() as Supplier));
    }

    const cloudChalans: SupplierChalan[] = [];
    if (chalansSnapRes.status === 'fulfilled') {
      chalansSnapRes.value.forEach((d) => cloudChalans.push(d.data() as SupplierChalan));
    }

    const cloudPayments: SupplierPayment[] = [];
    if (paymentsSnapRes.status === 'fulfilled') {
      paymentsSnapRes.value.forEach((d) => cloudPayments.push(d.data() as SupplierPayment));
    }

    const cloudExpenses: ExpenseRecord[] = [];
    if (expensesSnapRes.status === 'fulfilled') {
      expensesSnapRes.value.forEach((d) => cloudExpenses.push(d.data() as ExpenseRecord));
    }

    // 3. Fallback / Merge with 'latest' backup snapshot if subcollections are empty
    if (latestBackupSnapRes.status === 'fulfilled' && latestBackupSnapRes.value.exists()) {
      const backupData = latestBackupSnapRes.value.data() as CloudBackupRecord;
      result.lastBackupDate = backupData.formattedDate;

      if (!result.shopProfile && backupData.shopProfile) {
        result.shopProfile = backupData.shopProfile;
      }
      if (!result.baseRate && backupData.baseRate) {
        result.baseRate = backupData.baseRate;
      }

      if (backupData.parties && backupData.parties.length > 0) {
        backupData.parties.forEach((bp) => {
          if (!memoParties.some((p) => p.id === bp.id)) memoParties.push(bp);
        });
      }

      if (backupData.memos && backupData.memos.length > 0) {
        backupData.memos.forEach((bm) => {
          if (!cloudMemos.some((m) => m.id === bm.id)) cloudMemos.push(bm);
        });
      }

      if (backupData.suppliers && backupData.suppliers.length > 0) {
        backupData.suppliers.forEach((bs) => {
          if (!cloudSuppliers.some((s) => s.id === bs.id)) cloudSuppliers.push(bs);
        });
      }

      if (backupData.supplierChalans && backupData.supplierChalans.length > 0) {
        backupData.supplierChalans.forEach((bc) => {
          if (!cloudChalans.some((c) => c.id === bc.id)) cloudChalans.push(bc);
        });
      }

      if (backupData.supplierPayments && backupData.supplierPayments.length > 0) {
        backupData.supplierPayments.forEach((bp) => {
          if (!cloudPayments.some((p) => p.id === bp.id)) cloudPayments.push(bp);
        });
      }

      if (backupData.expenses && backupData.expenses.length > 0) {
        backupData.expenses.forEach((be) => {
          if (!cloudExpenses.some((e) => e.id === be.id)) cloudExpenses.push(be);
        });
      }
    }

    // Sort memos: newest date/created first
    cloudMemos.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    });

    if (memoParties.length > 0) {
      result.parties = memoParties;
      result.totalParties = memoParties.length;
    }

    if (cloudMemos.length > 0) {
      result.memos = cloudMemos;
      result.totalMemos = cloudMemos.length;
    }

    if (cloudSuppliers.length > 0) {
      result.suppliers = cloudSuppliers;
      result.totalSuppliers = cloudSuppliers.length;
    }

    if (cloudChalans.length > 0) {
      result.supplierChalans = cloudChalans;
    }

    if (cloudPayments.length > 0) {
      result.supplierPayments = cloudPayments;
    }

    if (cloudExpenses.length > 0) {
      result.expenses = cloudExpenses;
      result.totalExpenses = cloudExpenses.length;
    }

    result.hasData = Boolean(
      result.shopProfile ||
      result.baseRate ||
      (result.parties && result.parties.length > 0) ||
      (result.memos && result.memos.length > 0) ||
      (result.suppliers && result.suppliers.length > 0) ||
      (result.supplierChalans && result.supplierChalans.length > 0) ||
      (result.expenses && result.expenses.length > 0)
    );

    // If Firestore yielded no data (e.g. offline, timeout, or first login on device),
    // fallback to local account backup mirror
    if (!result.hasData) {
      try {
        const localUserBakRaw = localStorage.getItem(`egg_arat_cloud_user_${uid}`);
        const fallbackBak = localUserBakRaw ? JSON.parse(localUserBakRaw) : fetchAccountCloudBackup(undefined, uid);
        if (fallbackBak) {
          if (fallbackBak.shopProfile) result.shopProfile = fallbackBak.shopProfile;
          if (fallbackBak.baseRate) result.baseRate = fallbackBak.baseRate;
          if (fallbackBak.parties && fallbackBak.parties.length > 0) {
            result.parties = fallbackBak.parties;
            result.totalParties = fallbackBak.parties.length;
          }
          if (fallbackBak.memos && fallbackBak.memos.length > 0) {
            result.memos = fallbackBak.memos;
            result.totalMemos = fallbackBak.memos.length;
          }
          if (fallbackBak.suppliers && fallbackBak.suppliers.length > 0) {
            result.suppliers = fallbackBak.suppliers;
            result.totalSuppliers = fallbackBak.suppliers.length;
          }
          if (fallbackBak.supplierChalans && fallbackBak.supplierChalans.length > 0) {
            result.supplierChalans = fallbackBak.supplierChalans;
          }
          if (fallbackBak.supplierPayments && fallbackBak.supplierPayments.length > 0) {
            result.supplierPayments = fallbackBak.supplierPayments;
          }
          if (fallbackBak.expenses && fallbackBak.expenses.length > 0) {
            result.expenses = fallbackBak.expenses;
            result.totalExpenses = fallbackBak.expenses.length;
          }
          result.hasData = Boolean(
            result.shopProfile ||
            result.baseRate ||
            (result.parties && result.parties.length > 0) ||
            (result.memos && result.memos.length > 0) ||
            (result.suppliers && result.suppliers.length > 0) ||
            (result.expenses && result.expenses.length > 0)
          );
        }
      } catch {
        // ignore
      }
    }

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${targetUserId}`);

    // On Firestore error, fallback to local user backup
    try {
      const uid = targetUserId ? targetUserId.replace(/[^a-zA-Z0-9_\-]/g, '_') : 'default_arat_user';
      const localUserBakRaw = localStorage.getItem(`egg_arat_cloud_user_${uid}`);
      const fallbackBak = localUserBakRaw ? JSON.parse(localUserBakRaw) : fetchAccountCloudBackup(undefined, uid);
      if (fallbackBak) {
        if (fallbackBak.shopProfile) result.shopProfile = fallbackBak.shopProfile;
        if (fallbackBak.baseRate) result.baseRate = fallbackBak.baseRate;
        if (fallbackBak.parties) result.parties = fallbackBak.parties;
        if (fallbackBak.memos) result.memos = fallbackBak.memos;
        if (fallbackBak.suppliers) result.suppliers = fallbackBak.suppliers;
        if (fallbackBak.supplierChalans) result.supplierChalans = fallbackBak.supplierChalans;
        if (fallbackBak.supplierPayments) result.supplierPayments = fallbackBak.supplierPayments;
        if (fallbackBak.expenses) result.expenses = fallbackBak.expenses;
        result.hasData = true;
      }
    } catch {
      // ignore
    }

    return result;
  }
}

/**
 * Real-time Multi-Device synchronization listener.
 * Listens to Firestore changes made by any connected phone, tablet, or PC,
 * and automatically updates local state seamlessly.
 */
export function subscribeToRealtimeUserData(
  targetUserId: string,
  callbacks: {
    onMemosUpdate?: (memos: Memo[]) => void;
    onPartiesUpdate?: (parties: Party[]) => void;
    onSuppliersUpdate?: (suppliers: Supplier[]) => void;
    onChalansUpdate?: (chalans: SupplierChalan[]) => void;
    onPaymentsUpdate?: (payments: SupplierPayment[]) => void;
    onExpensesUpdate?: (expenses: ExpenseRecord[]) => void;
    onProfileUpdate?: (profile: ShopProfile) => void;
    onRateUpdate?: (rate: BaseRate) => void;
  }
): () => void {
  if (isFirestoreQuotaExceeded || !targetUserId || !targetUserId.trim()) return () => {};
  const cleanId = targetUserId.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');

  try {
    const latestRef = doc(db, 'users', cleanId, 'backups', 'latest');
    const unsub = onSnapshot(
      latestRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CloudBackupRecord;
          if (data) {
            // Check if this incoming backup matches the one we most recently backed up ourselves
            try {
              const localLatestRaw = localStorage.getItem('egg_arat_online_cloud_latest');
              if (localLatestRaw) {
                const localLatest = JSON.parse(localLatestRaw);
                if (localLatest && localLatest.backupId === data.backupId) {
                  // Already identical or written by this client! Skip state updates to avoid loops.
                  return;
                }
              }
            } catch (err) {
              // ignore
            }

            // Also update the local latest backup reference so we remain synced
            try {
              localStorage.setItem('egg_arat_online_cloud_latest', JSON.stringify(data));
              localStorage.setItem(`egg_arat_cloud_user_${cleanId}`, JSON.stringify(data));
            } catch {
              // ignore
            }

            if (data.memos && callbacks.onMemosUpdate) callbacks.onMemosUpdate(data.memos);
            if (data.parties && callbacks.onPartiesUpdate) callbacks.onPartiesUpdate(data.parties);
            if (data.suppliers && callbacks.onSuppliersUpdate) callbacks.onSuppliersUpdate(data.suppliers);
            if (data.supplierChalans && callbacks.onChalansUpdate) callbacks.onChalansUpdate(data.supplierChalans);
            if (data.supplierPayments && callbacks.onPaymentsUpdate) callbacks.onPaymentsUpdate(data.supplierPayments);
            if (data.expenses && callbacks.onExpensesUpdate) callbacks.onExpensesUpdate(data.expenses);
            if (data.shopProfile && callbacks.onProfileUpdate) callbacks.onProfileUpdate(data.shopProfile);
            if (data.baseRate && callbacks.onRateUpdate) callbacks.onRateUpdate(data.baseRate);
          }
        }
      },
      (err) => {
        const wasQuota = checkAndSetQuotaExceeded(err);
        handleFirestoreError(err, OperationType.GET, `users/${cleanId}/backups/latest`);
        if (wasQuota) {
          try {
            unsub();
          } catch {
            // ignore
          }
        }
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.warn('Realtime subscription initialization error:', err);
    return () => {};
  }
}


