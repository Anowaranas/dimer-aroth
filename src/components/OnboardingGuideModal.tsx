import React, { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import { hapticLight, hapticMedium } from '../utils/haptics';

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewMemo?: () => void;
  onOpenNewChalan?: () => void;
}

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenNewMemo,
  onOpenNewChalan,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'step-memo',
      title: '১. দ্রুত বিক্রি মেমো তৈরি করুন',
      tag: 'সবচেয়ে গুরুত্বপূর্ণ',
      tagColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      icon: <ReceiptLongRoundedIcon className="w-8 h-8 text-blue-400" />,
      gradient: 'from-blue-600/30 via-indigo-600/20 to-transparent',
      borderColor: 'border-blue-500/40',
      description: 'মাত্র ৩টি সহজ ক্লিকে পার্টির জন্য পাকা ক্যাশ মেমো বানান:',
      points: [
        'পার্টির নাম নির্বাচন করুন অথবা নতুন নাম লিখুন।',
        'খাঁচা বা পিস অনুযায়ী লাল ও সাদা ডিমের সংখ্যা দিন (১ খাঁচা = ৩০ পিস অটো হিসাব)।',
        'নগদ জমা ও পূর্বের বাকি স্বয়ংক্রিয়ভাবে মোট বিলের সাথে সমন্বয় হবে।',
      ],
      actionText: 'মেমো লিখুন',
      actionHandler: () => {
        onClose();
        if (onOpenNewMemo) onOpenNewMemo();
      },
    },
    {
      id: 'step-khata',
      title: '২. খরিদ্দার বাকি ও জমা আদায়',
      tag: 'স্বয়ংক্রিয় খতিয়ান',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: <PeopleAltRoundedIcon className="w-8 h-8 text-emerald-400" />,
      gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent',
      borderColor: 'border-emerald-500/40',
      description: 'কোনো খাতা-কলমের ঝামেলা নেই, বাকি ও আদায়ের নির্ভুল হিসাব:',
      points: [
        'খাতা ট্যাবে সকল পার্টির বকেয়া টাকার তালিকা একনজরে দেখুন।',
        '"জমা নিন" বোতামে এক ক্লিকে ক্যাশ বা ব্যাংক জমা রেকর্ড করুন।',
        'পার্টির নামে ক্লিক করে তার পূর্বের সকল মেমো ও ভাউচার হিস্টোরি দেখুন।',
      ],
    },
    {
      id: 'step-supplier',
      title: '৩. মহাজন / খামারি চালান ও দেনা',
      tag: 'ডিম ক্রয়ের হিসাব',
      tagColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      icon: <LocalShippingRoundedIcon className="w-8 h-8 text-purple-400" />,
      gradient: 'from-purple-600/30 via-indigo-600/20 to-transparent',
      borderColor: 'border-purple-500/40',
      description: 'মহাজন বা খামার থেকে ডিম আসার সাথে সাথে চালান লিপিবদ্ধ করুন:',
      points: [
        'খামারি/মহাজনের নাম, গাড়ি নম্বর ও ডিমের শতকরা দর দিন।',
        'চালানের মোট বিল, নগদ পরিশোধ ও দেনার হিসাব স্বয়ংক্রিয়ভাবে খতিয়ানে যুক্ত হবে।',
        'মহাজন চালানের ডিজিটাল ভাউচার তৈরি ও শেয়ার করুন।',
      ],
      actionText: 'নতুন চালান লিখুন',
      actionHandler: () => {
        onClose();
        if (onOpenNewChalan) onOpenNewChalan();
      },
    },
    {
      id: 'step-share',
      title: '৪. মেমো প্রিন্ট ও হোয়াটসঅ্যাপ শেয়ার',
      tag: '১-ক্লিকে পাঠানো',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: <ShareRoundedIcon className="w-8 h-8 text-amber-400" />,
      gradient: 'from-amber-600/30 via-orange-600/20 to-transparent',
      borderColor: 'border-amber-500/40',
      description: 'খরিদ্দার ও মহাজনকে ডিজিটাল মেমো স্লিপ তাৎক্ষণিক পাঠান:',
      points: [
        'মেমোর চোখ (ভিউ) আইকনে ক্লিক করে মেমো ভাউচার দেখুন।',
        'হোয়াটসঅ্যাপ বোতামে চাপ দিলে অটো-মেসেজ তৈরি হয়ে সেন্ড হবে।',
        'ছবি ডাউনলোড (PNG) বা সরাসরি ব্লুটুথ/ওয়াইফাই প্রিন্টারে প্রিন্ট করুন।',
      ],
    },
    {
      id: 'step-cloud',
      title: '৫. ক্লাউড ব্যাকআপ ও সার্বক্ষণিক সুরক্ষা',
      tag: '১০০% নিরাপদ',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      icon: <CloudDoneRoundedIcon className="w-8 h-8 text-cyan-400" />,
      gradient: 'from-cyan-600/30 via-blue-600/20 to-transparent',
      borderColor: 'border-cyan-500/40',
      description: 'মোবাইল হারালেও আপনার আড়তের হিসাব কখনো হারাবে না:',
      points: [
        'গুগল অথবা মোবাইল নম্বর দিয়ে লগইন করলে সকল তথ্য ক্লাউডে অটো-সিঙ্ক হয়।',
        'ইন্টারনেট না থাকলেও অফলাইনে নিরবচ্ছিন্ন কাজ করতে পারবেন।',
        'সেটিংস থেকে যেকোনো সময় ব্যাকআপ ফাইল ডাউনলোড করে রাখতে পারেন।',
      ],
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    hapticLight();
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    hapticLight();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 w-full max-w-md md:max-w-lg rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <LightbulbRoundedIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>ডিমের আড়ৎ সহজ গাইড</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                সহজে ও দ্রুত অ্যাপ ব্যবহারের জরুরি টিপস
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="বন্ধ করুন"
          >
            <CloseRoundedIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Dots Bar */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between gap-1.5 bg-slate-950/30">
          <div className="flex items-center gap-1.5 flex-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  hapticLight();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : idx < currentStep
                    ? 'w-3 bg-emerald-500/80'
                    : 'w-3 bg-slate-700'
                }`}
                title={`ধাপ ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono font-black text-amber-300 shrink-0 ml-2">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Body Content of Active Step */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Card Hero Box */}
          <div className={`p-4 rounded-2xl bg-gradient-to-b ${current.gradient} border ${current.borderColor} space-y-3 relative overflow-hidden`}>
            <div className="flex items-center justify-between gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                {current.icon}
              </div>
              <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${current.tagColor}`}>
                {current.tag}
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white tracking-tight leading-snug">
                {current.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Feature Bullet Points */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              মূল সুবিধাসমূহ:
            </p>
            {current.points.map((point, pIdx) => (
              <div key={pIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <CheckCircleRoundedIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200 font-medium leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition active:scale-95 border border-slate-700"
            >
              <ArrowBackRoundedIcon className="w-4 h-4" />
              <span>পূর্ববর্তী</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onClose();
              }}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-bold transition"
            >
              পরে দেখব
            </button>
          )}

          <div className="flex items-center gap-2">
            {current.actionHandler && (
              <button
                type="button"
                onClick={() => {
                  hapticMedium();
                  current.actionHandler!();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition active:scale-95"
              >
                {current.actionText}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 flex items-center gap-1 transition active:scale-95"
            >
              <span>{currentStep === steps.length - 1 ? 'বুঝেছি / শুরু করুন' : 'পরবর্তী ধাপ'}</span>
              <ArrowForwardRoundedIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
