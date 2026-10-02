import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Smartphone, X, Check, Apple, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running as standalone native app, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Header compact badge variant
  if (variant === 'header') {
    if (isInstallable) {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-orange-700 transition active:scale-95 ${className}`}
          title="মোবাইলে বা কম্পিউটারে সরাসরি অ্যাপ হিসেবে ইনস্টল করুন"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>অ্যাপ ইনস্টল</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition ${className}`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>আইফোনে ইনস্টল</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-base">iPhone / iPad এ ইনস্টল করুন</h3>
                  </div>
                  <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="py-4 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">১</span>
                    <p className="text-slate-700 dark:text-slate-300">সাফারি (Safari) ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> বাটনে ক্লিক করুন।</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">২</span>
                    <p className="text-slate-700 dark:text-slate-300">একটু নিচে গিয়ে <strong>Add to Home Screen (হোম স্ক্রিনে যোগ)</strong> চাপুন।</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">৩</span>
                    <p className="text-slate-700 dark:text-slate-300">উপরে ডানে <strong>Add</strong> চাপলেই মোবাইলে আসল অ্যাপের মতো চলে আসবে!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 active:scale-98 transition shadow"
                >
                  ঠিক আছে, বুঝেছি
                </button>
              </div>
            </div>
          )}
        </>
      );
    }
  }

  // Card or Banner variant (e.g. in Settings or Dashboard)
  if (isInstallable || isIOS) {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg relative overflow-hidden ${className}`}>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-base leading-tight">
                <span>মোবাইলে অ্যাপ ইনস্টল করুন</span>
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                কোনো ইন্টারনেট ছাড়াও অ্যাপ ওপেন হবে ও সুপারফাস্ট চলবে!
              </p>
            </div>
          </div>
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-4 py-2 rounded-xl bg-white text-orange-700 font-extrabold text-sm shadow hover:bg-orange-50 active:scale-95 transition shrink-0"
            >
              ইনস্টল
            </button>
          ) : (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-xs text-white font-bold text-xs hover:bg-white/30 transition shrink-0 border border-white/30"
            >
              নিয়ম দেখুন
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
