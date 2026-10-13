import React, { useState, useEffect } from 'react';
import { AuthUser, ShopProfile } from '../types';
import { 
  Store, 
  Save, 
  Check, 
  Smartphone, 
  LogOut, 
  LogIn, 
  Cloud, 
  Mail, 
  Database, 
  Copy,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Edit,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Vibrate
} from 'lucide-react';
import { toBengaliNumber, toBnCurrency } from '../utils/bengaliUtils';

import { isHapticsEnabled, setHapticsEnabled, hapticSuccess, hapticLight, hapticMedium } from '../utils/haptics';

interface SettingsViewProps {
  shopProfile: ShopProfile;
  useBengali: boolean;
  darkMode: boolean;
  authUser?: AuthUser | null;
  baseRate?: any;
  isRefreshingCloud?: boolean;
  onRefreshCloud?: () => void;
  onUpdateBaseRate?: (updatedRate: any) => void;
  onUpdateShopProfile: (updatedProfile: ShopProfile) => void;
  onToggleBengaliNumerals: () => void;
  onToggleDarkMode: () => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
  onResetData?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenCloudBackup?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  shopProfile,
  useBengali,
  darkMode,
  authUser,
  baseRate,
  onUpdateBaseRate,
  isRefreshingCloud,
  onRefreshCloud,
  onUpdateShopProfile,
  onToggleBengaliNumerals,
  onToggleDarkMode,
  onOpenLoginModal,
  onLogout,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'account'>('profile');

  // Local Profile Form State
  const [shopName, setShopName] = useState(shopProfile.name || '');
  const [shopTagline, setShopTagline] = useState(shopProfile.tagline || '');
  const [proprietor, setProprietor] = useState(shopProfile.proprietor || '');
  const [mobile, setMobile] = useState(shopProfile.mobile || '');
  const [address, setAddress] = useState(shopProfile.address || '');
  const [memoFooter, setMemoFooter] = useState(shopProfile.memoFooter || '');
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Whether profile card is minimized for a clean, minimal appearance
  const [isProfileMinimized, setIsProfileMinimized] = useState<boolean>(() => {
    return Boolean(shopProfile.name && shopProfile.name.trim().length > 0);
  });

  // Haptic feedback enabled state
  const [hapticsEnabled, setLocalHapticsEnabled] = useState<boolean>(() => isHapticsEnabled());

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setLocalHapticsEnabled(next);
    setHapticsEnabled(next);
    if (next) {
      hapticSuccess();
    } else {
      hapticLight();
    }
  };





  useEffect(() => {
    setShopName(shopProfile.name || '');
    setShopTagline(shopProfile.tagline || '');
    setProprietor(shopProfile.proprietor || '');
    setMobile(shopProfile.mobile || '');
    setAddress(shopProfile.address || '');
    setMemoFooter(shopProfile.memoFooter || '');
  }, [shopProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShopProfile({
      name: shopName.trim(),
      tagline: shopTagline.trim(),
      proprietor: proprietor.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      memoFooter: memoFooter.trim(),
    });
    setProfileSavedSuccess(true);
    setTimeout(() => {
      setProfileSavedSuccess(false);
      setIsProfileMinimized(true);
    }, 700);
  };

  const handleCopyAppLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="settings-view-container" className="space-y-2.5 pb-20">
      {/* Sub-tabs Navigation & Quick Haptics Toggle */}
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1 bg-slate-100/90 dark:bg-stone-850 p-1.5 rounded-2xl text-xs font-black border border-slate-200 dark:border-stone-750 shadow-xs">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setActiveSubTab('profile');
            }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 text-center tactile-tap ${
              activeSubTab === 'profile'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-md font-black'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-800'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">১. প্রোফাইল ও মেমো</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticLight();
              setActiveSubTab('account');
            }}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 text-center tactile-tap ${
              activeSubTab === 'account'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-md font-black'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">২. ব্যাকআপ ও ক্লাউড</span>
          </button>
        </div>

        <button
          id="btn-toggle-haptics"
          type="button"
          onClick={handleToggleHaptics}
          className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center gap-1.5 border shadow-xs transition active:scale-95 shrink-0 ${
            hapticsEnabled 
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700' 
              : 'bg-slate-100 dark:bg-stone-850 text-stone-500 border-slate-200 dark:border-stone-750'
          }`}
          title="স্পর্শীয় হেপটিক ভাইব্রেশন চালু/বন্ধ করুন"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="text-[11px] font-extrabold">{hapticsEnabled ? 'ভাইব্রেশন' : 'নীরব'}</span>
        </button>
      </div>


      {/* =========================================================================
          PAGE 1: দোকান প্রোফাইল ও মেমো (মিনিমাল ভিউ ও এডিট ফর্ম)
          ========================================================================= */}
      {activeSubTab === 'profile' && (
        isProfileMinimized ? (
          <div className="glass-card rounded-2xl p-3 sm:p-4 border shadow-xs space-y-3 animate-in fade-in duration-150">
            {/* Minimal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-blue-50/80 dark:from-slate-800/80 dark:to-slate-800/40 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Store className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 truncate">
                    {shopProfile.name || 'আড়তের পরিচিতি'}
                  </h3>
                  <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium truncate">
                    {shopProfile.tagline || 'ডিমের পাইকারি ও খুচরা বিক্রেতা'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>সংরক্ষিত</span>
              </span>
            </div>

            {/* Minimal Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-stone-800 dark:text-stone-200">
              <div className="soft-inset p-2 rounded-xl border flex items-center gap-2">
                <span className="text-purple-600 font-black">👤 মালিক:</span>
                <span className="font-extrabold text-stone-900 dark:text-white truncate">{shopProfile.proprietor || '—'}</span>
              </div>
              <div className="soft-inset p-2 rounded-xl border flex items-center gap-2">
                <span className="text-blue-600 font-black">📞 মোবাইল:</span>
                <span className="font-extrabold text-stone-900 dark:text-white truncate">{shopProfile.mobile || '—'}</span>
              </div>
              {shopProfile.address && (
                <div className="soft-inset p-2 rounded-xl border flex items-center gap-2 sm:col-span-2">
                  <span className="text-rose-600 font-black">📍 ঠিকানা:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 truncate">{shopProfile.address}</span>
                </div>
              )}
              {shopProfile.memoFooter && (
                <div className="soft-inset p-2 rounded-xl border flex items-center gap-2 sm:col-span-2">
                  <span className="text-teal-600 font-black">💬 মেমো নোট:</span>
                  <span className="italic text-stone-700 dark:text-stone-300 font-medium truncate">"{shopProfile.memoFooter}"</span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => setIsProfileMinimized(false)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 text-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>প্রোফাইল তথ্য এডিট / পরিবর্তন করুন</span>
            </button>
          </div>
        ) : (
          <form 
            onSubmit={handleSaveProfile} 
            className="glass-card rounded-2xl p-3 sm:p-4 border shadow-xs space-y-3 animate-in fade-in duration-150"
          >
            {/* Top Title Banner with Minimize Button */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-blue-50/80 dark:from-slate-800/80 dark:to-slate-800/40 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                    আড়তের পরিচিতি ও ক্যাশ মেমো ব্র্যান্ডিং
                  </h3>
                  <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                    ক্যাশ মেমো ও চালানের শীর্ষে এই তথ্য প্রদর্শিত হবে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileMinimized(true)}
                className="text-[10.5px] font-black text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-2xs flex items-center gap-1 transition"
                title="মিনিমাইজ করুন"
              >
                <span>মিনিমাইজ</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Row: দোকান / আড়তের নাম & স্লোগান (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Field 1: দোকান / আড়তের নাম */}
              <div className="bg-emerald-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      🏪
                    </span>
                    <span>দোকান / আড়তের নাম</span>
                  </label>
                  <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                    মেমোর মূল শিরোনাম
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="যেমন: হাজী ডিমের আড়ৎ"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-black text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Field 2: স্লোগান */}
              <div className="bg-sky-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-sky-200/70 dark:border-sky-900/40 space-y-1">
                <label className="text-[11px] font-black text-sky-950 dark:text-sky-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    ✨
                  </span>
                  <span>আড়তের স্লোগান / বিবরণ</span>
                </label>
                <input
                  type="text"
                  value={shopTagline}
                  onChange={(e) => setShopTagline(e.target.value)}
                  placeholder="যেমন: পাইকারি ও খুচরা ডিম বিক্রেতা"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-sky-300 dark:border-sky-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Field 3: প্রোপ্রাইটর ও মোবাইল */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-purple-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-purple-200/70 dark:border-purple-900/40 space-y-1">
                <label className="text-[11px] font-black text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px]">
                    👤
                  </span>
                  <span>প্রোপ্রাইটর / মালিকের নাম</span>
                </label>
                <input
                  type="text"
                  value={proprietor}
                  onChange={(e) => setProprietor(e.target.value)}
                  placeholder="মালিকের নাম"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-purple-300 dark:border-purple-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                />
              </div>

              <div className="bg-blue-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-blue-200/70 dark:border-blue-900/40 space-y-1">
                <label className="text-[11px] font-black text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    📞
                  </span>
                  <span>মোবাইল নম্বর</span>
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="০১৭১১-XXXXXX"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-blue-300 dark:border-blue-700 rounded-xl text-xs font-black text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Row: ঠিকানা ও মেমোর নিচের বার্তা (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Field 4: ঠিকানা */}
              <div className="bg-rose-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-900/40 space-y-1">
                <label className="text-[11px] font-black text-rose-950 dark:text-rose-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px]">
                    📍
                  </span>
                  <span>আড়ত / দোকানের ঠিকানা</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="বাজারের নাম, রোড, জেলা"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-rose-300 dark:border-rose-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>

              {/* Field 5: মেমোর নিচের বার্তা */}
              <div className="bg-teal-50/40 dark:bg-stone-850/60 p-2.5 rounded-xl border border-teal-200/70 dark:border-teal-900/40 space-y-1">
                <label className="text-[11px] font-black text-teal-950 dark:text-teal-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-[10px]">
                    🤝
                  </span>
                  <span>মেমোর নিচের ধন্যবাদ বার্তা</span>
                </label>
                <input
                  type="text"
                  value={memoFooter}
                  onChange={(e) => setMemoFooter(e.target.value)}
                  placeholder="যেমন: ডিমের খাঁচা ফেরত দিন। ধন্যবাদ আবার আসবেন।"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border-2 border-teal-300 dark:border-teal-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Save Profile Button */}
            <button
              type="submit"
              onClick={() => hapticMedium()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm tactile-tap"
            >
              {profileSavedSuccess ? <Check className="w-5 h-5 stroke-[3]" /> : <Save className="w-4 h-4" />}
              <span>{profileSavedSuccess ? 'প্রোফাইল সফলভাবে সংরক্ষিত!' : 'আড়ত প্রোফাইল তথ্য সংরক্ষণ করুন'}</span>
            </button>
          </form>
        )
      )}



      {/* =========================================================================
          PAGE 2: মাল্টিপল ডিভাইস ও ক্লাউড
          ========================================================================= */}
      {activeSubTab === 'account' && (
        <div className="glass-card rounded-2xl p-3 sm:p-4 border shadow-xs space-y-3.5 text-xs">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-50 via-indigo-50 to-cyan-50 dark:from-stone-850 dark:to-stone-800 p-2.5 rounded-xl border border-sky-200/80 dark:border-stone-700">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Smartphone className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-sky-950 dark:text-sky-200">
                  মাল্টিপল ডিভাইস সিঙ্ক ও ক্লাউড ব্যাকআপ
                </h3>
                <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                  একাধিক মোবাইল, ট্যাবলেট বা কম্পিউটারে একসাথে ব্যবহার করুন
                </p>
              </div>
            </div>

            {authUser?.isLoggedIn ? (
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                সিঙ্ক সক্রিয়
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-700">
                লগইন বাকি
              </span>
            )}
          </div>



          {/* User Status / Login Actions */}
          {authUser?.isLoggedIn ? (
            <div className="space-y-2.5 pt-1">
              {/* Active Profile Card */}
              <div className="soft-card p-3 rounded-2xl border flex items-center gap-3">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center text-sm shadow-xs shrink-0 ${
                    authUser.provider === 'google' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600' 
                      : 'bg-gradient-to-br from-violet-600 to-indigo-600'
                  }`}>
                    {authUser.provider === 'google' ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6 text-white" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs sm:text-sm text-stone-950 dark:text-stone-50 truncate">{authUser.name}</h4>
                    <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.2 rounded-full border border-indigo-300 dark:border-indigo-800">
                      {authUser.role || 'আড়তদার'}
                    </span>
                  </div>
                  <div className="space-y-0.5 mt-0.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    {authUser.phone && <div>📱 মোবাইল: {authUser.phone}</div>}
                    {authUser.email && <div>📧 ইমেইল: {authUser.email}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[9.5px] text-emerald-700 dark:text-emerald-400 font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>সকল ফোনে ও কম্পিউটারে একই লাইভ অ্যাকাউন্ট সক্রিয় ({authUser.loginTime})</span>
                  </div>
                </div>
              </div>

        

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black shadow-md transition flex items-center justify-center gap-1.5 text-xs active:scale-95"
                >
                  <Cloud className="w-4 h-4" />
                  <span>ডিভাইস ব্যাকআপ ও সিঙ্ক</span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl font-black border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-1 text-xs active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-5 space-y-3 bg-gradient-to-b from-sky-50/70 via-indigo-50/50 to-blue-50/70 dark:from-stone-850 dark:to-stone-800 rounded-2xl p-4 border-2 border-indigo-200/90 dark:border-stone-700 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white mx-auto flex items-center justify-center text-2xl shadow-md">
                ☁️
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm sm:text-base text-stone-950 dark:text-stone-50">
                  ক্লাউড অ্যাকাউন্ট লগইন ও ডাটা ফেরত আনুন
                </h4>
                <p className="text-stone-600 dark:text-stone-400 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                  আপনার মোবাইল নম্বর বা গুগল অ্যাকাউন্ট দিয়ে লগইন করলেই ক্লাউডে সংরক্ষিত পূর্বের সমস্ত মেমো, বাকি খাতা ও তথ্য তাৎক্ষণিক এই ডিভাইসে ফেরত আসবে।
                </p>
              </div>
              <div className="pt-2 max-w-xs mx-auto">
                <button
                  type="button"
                  id="btn-settings-login-fetch-data"
                  onClick={onOpenLoginModal}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/25 transition inline-flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>লগইন করুন / ডাটা ফেরত আনুন</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
