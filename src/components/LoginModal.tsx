import React, { useState, useEffect } from 'react';
import { AuthUser, BaseRate, Memo, Party, ShopProfile, UserCloudData } from '../types';
import { APP_LOGO_SRC } from '../assets/logo';
import { 
  CloudBackupRecord, 
  performOnlineBackup, 
  fetchAccountCloudBackup,
  isAutoCloudSyncEnabled,
  setAutoCloudSyncEnabled 
} from '../utils/cloudSync';
import { signInWithGoogleAccount, signUpWithEmail, signInWithEmail, auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { 
  verifyOrRegisterAccount, 
  loadUserDataFromFirebase,
  resetAccountPin,
  sendEmailPasswordResetLink
} from '../utils/firebaseDataService';
import { toBengaliNumber, toBnCurrency } from '../utils/bengaliUtils';
import { 
  X, 
  Smartphone, 
  Mail,
  AtSign,
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react';

// Official Google 'G' Colorful Brand Logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface LoginModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  shopProfile: ShopProfile;
  baseRate?: BaseRate;
  parties?: Party[];
  memos?: Memo[];
  useBengali: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser, cloudData?: UserCloudData | null) => void;
  onLogout: () => void;
  onRestoreData?: (data: {
    shopProfile?: ShopProfile;
    baseRate?: BaseRate;
    parties: Party[];
    memos: Memo[];
  }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  shopProfile,
  baseRate,
  parties = [],
  memos = [],
  useBengali,
  onClose,
  onLogin,
  onLogout,
  onRestoreData,
}) => {
  // Mobile & Email Login State
  const [mobileInput, setMobileInput] = useState(
    currentUser?.phone || shopProfile.mobile || ''
  );
  const [emailInput, setEmailInput] = useState(
    currentUser?.email || ''
  );
  const [pinCode, setPinCode] = useState('');
  const [showMobileForm, setShowMobileForm] = useState(true);

  // Email Auth State
  const [authMode, setAuthMode] = useState<'google_mobile' | 'email_auth'>('google_mobile');
  const [emailAuthMode, setEmailAuthMode] = useState<'signin' | 'signup'>('signin');
  const [firebaseEmail, setFirebaseEmail] = useState('');
  const [firebasePassword, setFirebasePassword] = useState('');
  const [firebaseName, setFirebaseName] = useState(shopProfile.proprietor || '');

  // Loading & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'google' | 'mobile' | 'demo' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = firebaseEmail.trim().toLowerCase();
    const pass = firebasePassword;
    const name = firebaseName.trim() || shopProfile.proprietor || 'আড়ৎ মালিক';

    if (!email || !email.includes('@')) {
      setErrorMsg('সঠিক ইমেইল ঠিকানা লিখুন');
      return;
    }
    if (!pass || pass.length < 6) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsSubmitting(true);
    setSubmittingAction('mobile');
    setErrorMsg('');
    setSuccessMsg(emailAuthMode === 'signup' ? 'নতুন অ্যাকাউন্ট তৈরি হচ্ছে...' : 'ইমেইল দিয়ে লগইন হচ্ছে...');

    try {
      let fbUser;
      if (emailAuthMode === 'signup') {
        fbUser = await signUpWithEmail(email, pass, name);
      } else {
        fbUser = await signInWithEmail(email, pass);
      }

      const accountId = `email_auth_${email.replace(/[^a-z0-9]/g, '_')}`;
      const cleanName = fbUser.displayName || name;

      await verifyOrRegisterAccount({
        id: accountId,
        name: cleanName,
        email: email,
        provider: 'email',
      });

      const cloudData = await loadUserDataFromFirebase(accountId);

      const newUser: AuthUser = {
        id: accountId,
        name: cleanName,
        email: email,
        provider: 'google',
        role: 'মালিক / ইমেইল অ্যাকাউন্ট',
        isLoggedIn: true,
        loginTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setIsSubmitting(false);
      setSubmittingAction(null);
      setSuccessMsg(`🎉 স্বাগতম ${cleanName}! সফলভাবে ইমেইল অথেন্টিকেশন সম্পন্ন হয়েছে।`);

      setTimeout(() => {
        onLogin(newUser, cloudData);
        setSuccessMsg('');
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmittingAction(null);
      console.error('Email Auth Error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('এই ইমেইলটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।');
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setErrorMsg('ভুল ইমেইল বা পাসওয়ার্ড! সঠিকভাবে তথ্য দিন।');
      } else {
        setErrorMsg(err.message || 'ইমেইল অথেন্টিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    }
  };

  // Password / PIN Reset State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Cloud Backup State inside Modal
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [latestBackupTime, setLatestBackupTime] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(isAutoCloudSyncEnabled());
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [cachedBackup, setCachedBackup] = useState<CloudBackupRecord | null>(null);

  // Load account-specific backup record on open
  useEffect(() => {
    if (isOpen && currentUser?.isLoggedIn) {
      const bak = fetchAccountCloudBackup(currentUser.provider, currentUser.id);
      setCachedBackup(bak);
      if (bak?.formattedDate) {
        setLatestBackupTime(bak.formattedDate);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  /**
   * 1. GOOGLE LOGIN WITH ACCOUNT CHOOSER (prompt: 'select_account')
   * Shows all Google emails on phone/device so user can select any email directly!
   */
  const handleGoogleSignInWithPicker = async () => {
    try {
      setIsSubmitting(true);
      setSubmittingAction('google');
      setErrorMsg('');
      setSuccessMsg('ফোনের গুগল ইমেইল তালিকা খোলা হচ্ছে...');

      // Ensure select_account is always requested so all device accounts are shown
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (fbUser) {
        const cleanEmail = (fbUser.email || '').toLowerCase();
        const accountId = `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        const cleanName = fbUser.displayName || shopProfile.proprietor || 'গুগল ব্যবহারকারী';

        // Register / update in Firestore
        const accResult = await verifyOrRegisterAccount({
          id: accountId,
          name: cleanName,
          email: cleanEmail,
          provider: 'google',
        });

        const finalAccountId = accResult.resolvedAccountId || accountId;

        setSuccessMsg('গুগল ক্লাউড থেকে আপনার সংরক্ষিত হিসাব লোড হচ্ছে...');
        const cloudData = await loadUserDataFromFirebase(finalAccountId);

        const newUser: AuthUser = {
          id: finalAccountId,
          name: cleanName,
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          provider: 'google',
          role: 'মালিক / গুগল অ্যাকাউন্ট',
          isLoggedIn: true,
          loginTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };

        setIsSubmitting(false);
        setSubmittingAction(null);

        if (cloudData && cloudData.hasData) {
          setSuccessMsg(`🎉 স্বাগতম ${cleanName}! পূর্বের ${toBengaliNumber(cloudData.totalMemos, useBengali)}টি মেমো, ${toBengaliNumber(cloudData.totalParties, useBengali)}টি পার্টি ও ডিমের দর ক্লাউড থেকে রিস্টোর হয়েছে!`);
        } else {
          setSuccessMsg(`🎉 স্বাগতম ${cleanName}! গুগল ক্লাউড ব্যাকআপ সফলভাবে সক্রিয় হয়েছে।`);
        }

        setTimeout(() => {
          onLogin(newUser, cloudData);
          setSuccessMsg('');
        }, 600);
      } else {
        setIsSubmitting(false);
        setSubmittingAction(null);
        setSuccessMsg('');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmittingAction(null);
      setSuccessMsg('');

      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }

      console.warn('Google Sign-in notice:', err);
      setErrorMsg('গুগল সাইন ইন সম্পন্ন হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা মোবাইল নম্বর দিয়ে প্রবেশ করুন।');
    }
  };

  /**
   * 2. MOBILE NUMBER AND/OR EMAIL + PIN SUBMISSION
   * Enables dual-linking so same PIN & Account works with Phone on Device A and Email on Device B!
   */
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mobileInput.replace(/[^0-9]/g, '');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanPhone && !cleanEmail) {
      setErrorMsg('অনুগ্রহ করে মোবাইল নম্বর অথবা ইমেইল ঠিকানা লিখুন');
      return;
    }
    if (cleanPhone && cleanPhone.length < 10) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: ০১৭১২-৩৪৫৬৭৮)');
      return;
    }
    if (pinCode.length < 4) {
      setErrorMsg('কমপক্ষে ৪ ডিজিটের পিন কোড বা পাসওয়ার্ড লিখুন (যেমন: ১২৩৪)');
      return;
    }

    setIsSubmitting(true);
    setSubmittingAction('mobile');
    setErrorMsg('');
    setSuccessMsg('অ্যাকাউন্ট ও সিকিউরিটি পিন যাচাই হচ্ছে...');

    const cleanName = shopProfile.proprietor || 'আড়ৎ মালিক';
    const primaryId = cleanPhone
      ? `phone_${cleanPhone}`
      : `email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    try {
      const accResult = await verifyOrRegisterAccount({
        id: primaryId,
        name: cleanName,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
        pin: pinCode,
        provider: cleanPhone && cleanEmail ? 'universal' : cleanEmail ? 'email' : 'mobile',
      });

      if (!accResult.success) {
        setIsSubmitting(false);
        setSubmittingAction(null);
        setErrorMsg(accResult.error || 'ভুল পিন কোড! আপনার সঠিক ৪ ডিজিটের পিন কোড লিখুন।');
        setSuccessMsg('');
        return;
      }

      const finalAccountId = accResult.resolvedAccountId || primaryId;
      setSuccessMsg('ক্লাউড থেকে আপনার সংরক্ষিত হিসাব লোড হচ্ছে...');
      const cloudData = await loadUserDataFromFirebase(finalAccountId);

      const newUser: AuthUser = {
        id: finalAccountId,
        name: cleanName,
        phone: accResult.phone || cleanPhone || undefined,
        email: accResult.email || cleanEmail || undefined,
        provider: 'universal',
        role: 'মালিক / স্বত্বাধিকারী',
        isLoggedIn: true,
        loginTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setIsSubmitting(false);
      setSubmittingAction(null);
      setSuccessMsg(`🎉 স্বাগতম ${cleanName}! উভয় মোবাইল ও ইমেইলে ক্লাউড অ্যাকাউন্ট সংযুক্ত হয়েছে।`);

      setTimeout(() => {
        onLogin(newUser, cloudData);
        setSuccessMsg('');
      }, 500);
    } catch {
      setIsSubmitting(false);
      setSubmittingAction(null);
      setErrorMsg('লগইন সম্পন্ন করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    }
  };

  /**
   * 2.5 RESET FORGOTTEN PIN / PASSWORD HANDLER
   */
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ident = resetIdentifier.trim();
    if (!ident) {
      setResetErrorMsg('আপনার মোবাইল নম্বর বা ইমেইল লিখুন');
      return;
    }
    if (resetNewPin.length < 4) {
      setResetErrorMsg('নতুন পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে');
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      setResetErrorMsg('দুইবার লেখা নতুন পিন কোড মেলেনি! সঠিকভাবে লিখুন।');
      return;
    }

    setIsResetSubmitting(true);
    setResetErrorMsg('');
    setResetSuccessMsg('নতুন পিন কোড আপডেট হচ্ছে...');

    try {
      const res = await resetAccountPin(ident, resetNewPin);
      if (res.success) {
        setResetSuccessMsg('🎉 সফলভাবে নতুন পিন কোড সেট হয়েছে! এখন লগইন করুন।');
        setPinCode(resetNewPin);
        if (ident.includes('@')) {
          setEmailInput(ident);
        } else {
          setMobileInput(ident);
        }
        setTimeout(() => {
          setIsResetMode(false);
          setResetSuccessMsg('');
          setResetNewPin('');
          setResetConfirmPin('');
        }, 1500);
      } else {
        setResetErrorMsg(res.error || 'পিন রিসেট ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
      }
    } catch {
      setResetErrorMsg('পিন রিসেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleSendEmailReset = async () => {
    if (!resetIdentifier || !resetIdentifier.includes('@')) {
      setResetErrorMsg('ইমেইলে লিংক পেতে সঠিক ইমেইল ঠিকানা লিখুন');
      return;
    }
    setIsResetSubmitting(true);
    setResetErrorMsg('');
    try {
      const res = await sendEmailPasswordResetLink(resetIdentifier);
      if (res.success) {
        setResetSuccessMsg(res.message);
      } else {
        setResetErrorMsg(res.message);
      }
    } catch {
      setResetErrorMsg('ইমেইল পাঠানো যায়নি।');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  /**
   * 3. QUICK 1-CLICK DEMO LOGIN (Instant testing)
   */
  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    setSubmittingAction('demo');
    setErrorMsg('');
    const accountId = 'phone_01712345678';
    const cleanName = shopProfile.proprietor || 'আনোয়ার হোসেন';

    try {
      await verifyOrRegisterAccount({
        id: accountId,
        name: cleanName,
        phone: '01712345678',
        pin: '1234',
        provider: 'mobile',
      });

      const cloudData = await loadUserDataFromFirebase(accountId);

      const defaultUser: AuthUser = {
        id: accountId,
        name: cleanName,
        phone: shopProfile.mobile || '০১৭১২-৩৪৫৬৭৮',
        provider: 'mobile',
        role: 'মালিক / স্বত্বাধিকারী',
        isLoggedIn: true,
        loginTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setIsSubmitting(false);
      setSubmittingAction(null);
      onLogin(defaultUser, cloudData);
    } catch {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  /**
   * Trigger Manual Cloud Backup
   */
  const handleManualBackupNow = async () => {
    if (!baseRate) return;
    setIsBackingUp(true);
    setErrorMsg('');
    try {
      const res = await performOnlineBackup({
        shopProfile,
        baseRate,
        parties,
        memos,
        userAccount: currentUser,
      });
      if (res.success) {
        setBackupSuccess(true);
        setCachedBackup(res.backup);
        setLatestBackupTime(res.backup.formattedDate);
        setTimeout(() => setBackupSuccess(false), 3000);
      }
    } catch {
      setErrorMsg('ক্লাউড ব্যাকআপ নিতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setIsBackingUp(false);
    }
  };

  /**
   * Trigger Manual Cloud Restore
   */
  const handleConfirmRestore = async () => {
    if (!onRestoreData) return;
    setIsBackingUp(true);
    setErrorMsg('');
    try {
      const targetUid = currentUser?.id;
      const cloudData = await loadUserDataFromFirebase(targetUid);
      if (cloudData && cloudData.hasData) {
        onRestoreData({
          shopProfile: cloudData.shopProfile || shopProfile,
          baseRate: cloudData.baseRate || baseRate,
          parties: cloudData.parties || parties,
          memos: cloudData.memos || memos,
        });
        setSuccessMsg(`ক্লাউড থেকে ${toBengaliNumber(cloudData.totalMemos, useBengali)}টি মেমো ও ${toBengaliNumber(cloudData.totalParties, useBengali)}টি পার্টি রিস্টোর হয়েছে!`);
      } else if (cachedBackup) {
        onRestoreData({
          shopProfile: cachedBackup.shopProfile,
          baseRate: cachedBackup.baseRate,
          parties: cachedBackup.parties || [],
          memos: cachedBackup.memos || [],
        });
        setSuccessMsg('ক্লাউড মিরর থেকে ডেটা রিস্টোর করা হয়েছে!');
      } else {
        setErrorMsg('ক্লাউডে কোনো সংরক্ষিত ডেটা পাওয়া যায়নি।');
      }
    } catch {
      setErrorMsg('ক্লাউড থেকে ডেটা রিস্টোর করতে সমস্যা হয়েছে।');
    } finally {
      setIsBackingUp(false);
      setShowRestoreConfirm(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3500);
    }
  };

  // Toggle Auto Sync
  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    setAutoCloudSyncEnabled(nextVal);
  };

  return (
    <div
      id="login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="login-modal-card"
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-stone-200 dark:border-stone-800 max-h-[92vh] flex flex-col"
      >
        {/* Clean Modern Header - Rich Mixed Jewel Tone */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white px-5 py-3.5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight">গুগল ক্লাউড ব্যাকআপ ও লগইন</h3>
              <p className="text-[11px] text-indigo-100 font-medium">আড়তের সমস্ত হিসাব চিরতরে সুরক্ষিত</p>
            </div>
          </div>
          <button
            id="login-modal-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-full text-white/90 hover:text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-900 dark:text-stone-100">
          {currentUser?.isLoggedIn ? (
            /* ========================================================
               CURRENTLY LOGGED IN: Simple & Clean Cloud Dashboard
               ======================================================== */
            <div className="space-y-4">
              {/* User Identity Card */}
              <div className="bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 ${
                    currentUser.provider === 'google' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600' 
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                  }`}>
                    {currentUser.provider === 'google' ? <GoogleIcon /> : <Smartphone className="w-6 h-6 text-white" />}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      {currentUser.provider === 'google' ? 'গুগল ক্লাউড সিঙ্ক সক্রিয়' : 'মোবাইল অ্যাকাউন্ট সক্রিয়'}
                    </span>
                  </div>
                  <h4 className="font-black text-base truncate mt-0.5">{currentUser.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                    {currentUser.provider === 'google' ? currentUser.email : currentUser.phone}
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Live Cloud Stats */}
              <div className="grid grid-cols-3 gap-2 bg-stone-100 dark:bg-stone-850 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 text-center">
                <div>
                  <span className="text-[10px] text-stone-500 block">মোট মেমো</span>
                  <span className="text-sm font-black">
                    {toBengaliNumber(memos.length, useBengali)} টি
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">মোট পার্টি</span>
                  <span className="text-sm font-black">
                    {toBengaliNumber(parties.length, useBengali)} জন
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">মোট বাকি</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {toBnCurrency(parties.reduce((sum, p) => sum + (p.currentDue || 0), 0), useBengali)}
                  </span>
                </div>
              </div>

              {/* Cloud Action Buttons */}
              <div className="space-y-2">
                <button
                  id="btn-cloud-backup-now"
                  type="button"
                  onClick={handleManualBackupNow}
                  disabled={isBackingUp}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ক্লাউডে সেভ হচ্ছে...</span>
                    </>
                  ) : backupSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>গুগল ক্লাউডে ব্যাকআপ সম্পন্ন!</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>এখনই গুগল ক্লাউড ব্যাকআপ নিন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block text-xs">
                    স্বয়ংক্রিয় ক্লাউড ব্যাকআপ
                  </span>
                  <span className="text-[10.5px] text-stone-500">
                    প্রতিটি মেমো তৈরি ও জমার পর অটো সেভ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className={`w-10 h-6 rounded-full transition p-0.5 ${autoSync ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${autoSync ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>অ্যাপে ফিরে যান</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================
               CLEAN, SIMPLE LOGIN INTERFACE
               ======================================================== */
            <div className="space-y-4">
            {/* Feedback messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ========================================================
               FORGOT PASSWORD / PIN RESET VIEW
               ======================================================== */}
            {isResetMode ? (
              <div className="space-y-3.5 bg-gradient-to-b from-indigo-50/50 to-purple-50/30 dark:from-stone-850 dark:to-stone-800 p-4 rounded-2xl border-2 border-indigo-300/80 dark:border-indigo-700/60 shadow-md animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-stone-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        পিন কোড বা পাসওয়ার্ড রিসেট
                      </h4>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                        নতুন গোপন পিন সেট করে অ্যাকাউন্টে প্রবেশ করুন
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(false);
                      setResetErrorMsg('');
                      setResetSuccessMsg('');
                    }}
                    className="text-xs font-black text-indigo-700 dark:text-indigo-300 hover:underline px-2 py-1 bg-white dark:bg-stone-800 rounded-lg border border-indigo-200 dark:border-stone-700"
                  >
                    লগইনে ফিরুন
                  </button>
                </div>

                {resetErrorMsg && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}
                {resetSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleResetPinSubmit} className="space-y-2.5 text-xs">
                  {/* Identifier */}
                  <div>
                    <label className="font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                      📱 আপনার মোবাইল নম্বর বা ইমেইল
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3 top-3 text-indigo-600 shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="01712-345678 অথবা email@gmail.com"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* New PIN */}
                  <div>
                    <label className="font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                      🔑 নতুন ৪ ডিজিটের পিন কোড
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="password"
                        required
                        maxLength={12}
                        placeholder="যেমন: ৫৬৭৮"
                        value={resetNewPin}
                        onChange={(e) => setResetNewPin(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Confirm New PIN */}
                  <div>
                    <label className="font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                      🔒 নতুন পিন কোড পুনরায় লিখুন
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="password"
                        required
                        maxLength={12}
                        placeholder="একই পিন পুনরায় লিখুন"
                        value={resetConfirmPin}
                        onChange={(e) => setResetConfirmPin(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResetMode(false)}
                      className="py-2.5 px-3 bg-stone-200 dark:bg-stone-750 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isResetSubmitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isResetSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>রিসেট হচ্ছে...</span>
                        </>
                      ) : (
                        <span>নতুন পিন সেট করুন</span>
                      )}
                    </button>
                  </div>

                  {resetIdentifier.includes('@') && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={handleSendEmailReset}
                        disabled={isResetSubmitting}
                        className="text-[11px] font-black text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>অথবা ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান</span>
                      </button>
                    </div>
                  )}
                </form>

                {/* Helpful Note */}
                <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-800 text-[10.5px] text-indigo-950 dark:text-indigo-200 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-indigo-900 dark:text-indigo-300">
                    <span>💡 বিকল্প রিকভারি পদ্ধতি:</span>
                  </div>
                  <p>• আপনি যদি পূর্বে কোনো জিমেইল দিয়ে থাকেন, তবে উপরে <strong>"গুগল দিয়ে সরাসরি লগইন"</strong> বাটন চেপে ১-ক্লিকে প্রবেশ করতে পারেন।</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Auth Method Switcher Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAuthMode('google_mobile')}
                    className={`py-2 rounded-lg transition-all ${authMode === 'google_mobile' ? 'bg-white dark:bg-stone-900 text-indigo-700 dark:text-indigo-300 shadow-sm font-black' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'}`}
                  >
                    গুগল ও মোবাইল পিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('email_auth')}
                    className={`py-2 rounded-lg transition-all ${authMode === 'email_auth' ? 'bg-white dark:bg-stone-900 text-indigo-700 dark:text-indigo-300 shadow-sm font-black' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'}`}
                  >
                    📧 ইমেইল ও পাসওয়ার্ড
                  </button>
                </div>

            {authMode === 'email_auth' && (
              <div className="space-y-3">
                  {/* EMAIL & PASSWORD AUTHENTICATION FORM */}
                  <form onSubmit={handleEmailAuthSubmit} className="space-y-3 bg-stone-50 dark:bg-stone-850/80 p-4 rounded-2xl border-2 border-indigo-300/80 dark:border-indigo-700/50 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-750 pb-2">
                      <span className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-sky-600" />
                        <span>ইমেইল অথেন্টিকেশন</span>
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setEmailAuthMode('signin')}
                          className={`px-2.5 py-1 rounded-md transition ${emailAuthMode === 'signin' ? 'bg-indigo-600 text-white font-black' : 'text-stone-600 dark:text-stone-400'}`}
                        >
                          লগইন
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailAuthMode('signup')}
                          className={`px-2.5 py-1 rounded-md transition ${emailAuthMode === 'signup' ? 'bg-indigo-600 text-white font-black' : 'text-stone-600 dark:text-stone-400'}`}
                        >
                          রেজিস্ট্রেশন
                        </button>
                      </div>
                    </div>

                    {emailAuthMode === 'signup' && (
                      <div>
                        <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                          👤 আপনার নাম / আড়তের নাম
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: মো: আনোয়ার হোসেন"
                          value={firebaseName}
                          onChange={(e) => setFirebaseName(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                        📧 ইমেইল ঠিকানা
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-sky-600 shrink-0" />
                        <input
                          type="email"
                          required
                          placeholder="example@gmail.com"
                          value={firebaseEmail}
                          onChange={(e) => setFirebaseEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                        🔒 পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="পাসওয়ার্ড লিখুন"
                          value={firebasePassword}
                          onChange={(e) => setFirebasePassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-1"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>প্রক্রিয়াকরণ হচ্ছে...</span>
                        </>
                      ) : (
                        <span>{emailAuthMode === 'signup' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'ইমেইল দিয়ে প্রবেশ করুন'}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {authMode === 'google_mobile' && (
                <div className="space-y-3">
                {/* 🌟 HERO 1: PROMINENT GOOGLE 1-CLICK SIGN-IN */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-1 rounded-2xl border border-indigo-400/30">
                  <button
                    id="btn-google-signin-main"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGoogleSignInWithPicker}
                    className="w-full py-3.5 px-4 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl shadow-sm flex items-center justify-between gap-3 transition active:scale-95 disabled:opacity-50 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                        {isSubmitting && submittingAction === 'google' ? (
                          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                      </div>
                      <div>
                        <span className="font-black text-sm text-stone-900 dark:text-stone-50 block leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          গুগল দিয়ে সরাসরি লগইন
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block mt-0.5">
                          {isSubmitting && submittingAction === 'google'
                            ? 'গুগল ইমেইল তালিকা লোড হচ্ছে...'
                            : 'ফোনের সব ইমেলের তালিকা থেকে বেছে নিন'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                </div>

                {/* Clean Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-stone-200 dark:border-stone-800"></div>
                  <span className="shrink mx-3 text-[11px] text-stone-400 font-bold">
                    অথবা মোবাইল নম্বর দিয়ে
                  </span>
                  <div className="grow border-t border-stone-200 dark:border-stone-800"></div>
                </div>

                {/* 🌟 OPTION 2: UNIFIED MOBILE / EMAIL LOGIN & PIN */}
                {!showMobileForm ? (
                  <button
                    id="btn-show-mobile-login"
                    type="button"
                    onClick={() => setShowMobileForm(true)}
                    className="w-full py-3 px-4 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition text-stone-700 dark:text-stone-300 active:scale-95"
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <Mail className="w-4 h-4 text-sky-600" />
                    </div>
                    <span>মোবাইল নম্বর বা পিন দিয়ে প্রবেশ</span>
                  </button>
                ) : (
                  <form onSubmit={handleMobileSubmit} className="space-y-3 bg-stone-50 dark:bg-stone-850/80 p-3.5 rounded-2xl border-2 border-indigo-300/80 dark:border-indigo-700/50 shadow-2xs">
                    {/* 1. Mobile Number Field */}
                    <div>
                      <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200 block mb-1">
                        📱 মোবাইল নম্বর
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 absolute left-3 top-3 text-indigo-600 shrink-0" />
                        <input
                          id="input-mobile-number"
                          type="text"
                          placeholder="01712-345678"
                          value={mobileInput}
                          onChange={(e) => setMobileInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* 2. 4-digit PIN Code / Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                          🔑 ৪ ডিজিট পিন কোড বা পাসওয়ার্ড
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetMode(true);
                            setResetIdentifier(mobileInput);
                            setResetErrorMsg('');
                            setResetSuccessMsg('');
                          }}
                          className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          ভুলে গেছেন?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                        <input
                          id="input-mobile-pin"
                          type="password"
                          maxLength={12}
                          required
                          placeholder="যেমন: ১২৩৪"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Mobile Submit Button */}
                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMobileForm(false)}
                        className="py-2.5 px-3 bg-stone-200 dark:bg-stone-750 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs"
                      >
                        লুকান
                      </button>
                      <button
                        id="btn-mobile-login-submit"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting && submittingAction === 'mobile' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>সংযুক্ত ও যাচাই হচ্ছে...</span>
                          </>
                        ) : (
                          <span>লগইন / লিঙ্ক করুন</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

            {/* Clean Features Summary */}
              <div className="pt-2 space-y-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>প্রতিটি মেমো ও বাকি খাতা গুগল ক্লাউডে অটো সেভ</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ফোন নষ্ট বা পরিবর্তন হলেও এক ক্লিকে সব ডেটা ফেরত</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>সম্পূর্ণ নিরাপদ, দ্রুত এবং ১০০% ফ্রি</span>
                </div>
              </div>

              {/* Discrete Demo Login & Close */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-800 text-xs">
                <button
                  id="btn-quick-demo-login"
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isSubmitting}
                  className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 py-1"
                >
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>১-ক্লিক ডেমো লগইন</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 py-1"
                >
                  পরে করব (বন্ধ করুন)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
