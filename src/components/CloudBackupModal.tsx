import React, { useState, useEffect } from 'react';
import { BaseRate, Memo, Party, ShopProfile } from '../types';
import { 
  CloudBackupRecord, 
  performOnlineBackup, 
  fetchLatestOnlineBackup, 
  getOnlineBackupsHistory,
  isAutoCloudSyncEnabled,
  setAutoCloudSyncEnabled 
} from '../utils/cloudSync';
import { toBengaliNumber, toBnCurrency } from '../utils/bengaliUtils';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  History, 
  AlertTriangle,
  Clock,
  Database,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface CloudBackupModalProps {
  isOpen: boolean;
  shopProfile: ShopProfile;
  baseRate: BaseRate;
  parties: Party[];
  memos: Memo[];
  useBengali: boolean;
  onClose: () => void;
  onRestoreData: (data: {
    shopProfile?: ShopProfile;
    baseRate?: BaseRate;
    parties: Party[];
    memos: Memo[];
  }) => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  shopProfile,
  baseRate,
  parties,
  memos,
  useBengali,
  onClose,
  onRestoreData,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [latestBackup, setLatestBackup] = useState<CloudBackupRecord | null>(null);
  const [backupHistory, setBackupHistory] = useState<CloudBackupRecord[]>([]);
  const [autoSync, setAutoSync] = useState(isAutoCloudSyncEnabled());
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmRestoreRecord, setConfirmRestoreRecord] = useState<CloudBackupRecord | null>(null);

  // Load latest cloud backup on modal open
  useEffect(() => {
    if (isOpen) {
      loadCloudState();
    }
  }, [isOpen]);

  const loadCloudState = async () => {
    const latest = await fetchLatestOnlineBackup();
    setLatestBackup(latest);
    const history = await getOnlineBackupsHistory();
    setBackupHistory(history);
  };

  if (!isOpen) return null;

  // Trigger Online Cloud Backup
  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setStatusMessage({ type: 'info', text: 'অনলাইন ক্লাউডে ডেটা ব্যাকআপ নেওয়া হচ্ছে...' });

    try {
      const result = await performOnlineBackup({
        shopProfile,
        baseRate,
        parties,
        memos,
      });

      if (result.success) {
        setLatestBackup(result.backup);
        const history = await getOnlineBackupsHistory();
        setBackupHistory(history);
        setStatusMessage({
          type: 'success',
          text: 'অভিনন্দন! আপনার দোকানের সকল মেমো ও পার্টির হিসাব অনলাইন ক্লাউডে সফলভাবে সংরক্ষিত হয়েছে।',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'ক্লাউড ব্যাকআপ নিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'অনলাইন ব্যাকআপ ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করুন।',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Trigger Online Cloud Restore
  const handleConfirmRestore = async (recordToRestore: CloudBackupRecord) => {
    setIsRestoring(true);
    setStatusMessage({ type: 'info', text: 'অনলাইন ক্লাউড থেকে ডেটা রিস্টোর করা হচ্ছে...' });

    try {
      onRestoreData({
        shopProfile: recordToRestore.shopProfile,
        baseRate: recordToRestore.baseRate,
        parties: recordToRestore.parties,
        memos: recordToRestore.memos,
      });

      setStatusMessage({
        type: 'success',
        text: `সফলভাবে ${recordToRestore.formattedDate}-এর অনলাইন ব্যাকআপ থেকে ${toBengaliNumber(recordToRestore.summary.totalMemos, useBengali)}টি মেমো ও ${toBengaliNumber(recordToRestore.summary.totalParties, useBengali)} জন পার্টির হিসাব রিস্টোর সম্পন্ন হয়েছে!`,
      });
      setConfirmRestoreRecord(null);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'ডাটা রিস্টোর করতে সমস্যা হয়েছে।',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoCloudSyncEnabled(enabled);
  };

  return (
    <div 
      id="cloud-backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="cloud-backup-modal-card"
        className="bg-white dark:bg-stone-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200 dark:border-stone-700 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-xs text-xl">
              ☁️
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">অনলাইন ডাটা ব্যাকআপ ও রিস্টোর</h3>
              <p className="text-[11px] text-sky-100 font-medium">নিরাপদ ক্লাউড ব্যাকআপ • ডিভাইস নষ্ট হলেও ডাটা হারাবে না</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-stone-800 dark:text-stone-200">
          {/* Status Toast */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0 mt-0.5" />}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* Current Live Status Card */}
          <div className="bg-gradient-to-br from-sky-50 via-blue-50/50 to-indigo-50/40 dark:from-stone-900 dark:to-stone-850 p-4 rounded-2xl border border-sky-200 dark:border-stone-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                  অনলাইন ক্লাউড স্ট্যাটাস
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                সক্রিয় ও সংযুক্ত
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-sky-100 dark:border-stone-700">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">বর্তমান অ্যাপের মেমো:</span>
                <span className="text-sm font-black text-stone-900 dark:text-white">
                  {toBengaliNumber(memos.length, useBengali)} টি মেমো
                </span>
              </div>
              <div className="bg-white dark:bg-stone-800 p-2.5 rounded-xl border border-sky-100 dark:border-stone-700">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">মোট পার্টির হিসাব:</span>
                <span className="text-sm font-black text-stone-900 dark:text-white">
                  {toBengaliNumber(parties.length, useBengali)} জন খরিদ্দার
                </span>
              </div>
            </div>

            {/* Latest Backup Info */}
            <div className="text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-1.5 pt-1 border-t border-sky-200/60 dark:border-stone-700">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {latestBackup ? (
                  <>সর্বশেষ ক্লাউড ব্যাকআপ: <strong className="text-sky-900 dark:text-sky-200 font-bold">{latestBackup.formattedDate}</strong></>
                ) : (
                  <span className="text-stone-500 dark:text-stone-400 font-medium">এখনও কোনো অনলাইন ব্যাকআপ নেওয়া হয়নি</span>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons: Backup & Restore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Backup Button */}
            <button
              id="btn-cloud-backup-now"
              type="button"
              disabled={isBackingUp}
              onClick={handleBackupNow}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span>{isBackingUp ? 'অনলাইন ব্যাকআপ হচ্ছে...' : '☁️ এখনই অনলাইন ব্যাকআপ নিন'}</span>
            </button>

            {/* Restore Latest Button */}
            <button
              id="btn-cloud-restore-latest"
              type="button"
              disabled={!latestBackup || isRestoring}
              onClick={() => {
                if (latestBackup) {
                  setConfirmRestoreRecord(latestBackup);
                }
              }}
              className="w-full py-3 px-4 bg-white dark:bg-stone-700 hover:bg-stone-50 dark:hover:bg-stone-650 text-blue-700 dark:text-blue-300 rounded-2xl font-black text-xs border border-blue-300 dark:border-blue-600 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-40"
            >
              <CloudDownload className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>🔄 ক্লাউড থেকে রিস্টোর করুন</span>
            </button>
          </div>

          {/* Auto-Sync Toggle Card */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div className="pr-2">
              <span className="text-xs font-bold text-stone-900 dark:text-white block">
                অটোমেটিক ক্লাউড ব্যাকআপ
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                নতুন মেমো তৈরি বা পেমেন্ট জমার সাথে সাথে ক্লাউডে ব্যাকআপ হবে
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={autoSync} 
                onChange={(e) => handleToggleAutoSync(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Confirm Restore Popup Overlay */}
          {confirmRestoreRecord && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-400 dark:border-indigo-600 rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>ক্লাউড ব্যাকআপ রিস্টোর নিশ্চিতকরণ</span>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                আপনি কি <strong>{confirmRestoreRecord.formattedDate}</strong>-এর ক্লাউড ব্যাকআপটি ফিরিয়ে আনতে চান? 
                এতে আপনার বর্তমান অ্যাপের মেমো ও পার্টির হিসাব ব্যাকআপের ডাটা দিয়ে প্রতিস্থাপিত হবে:
              </p>
              <div className="bg-white/80 dark:bg-stone-850/80 p-2.5 rounded-xl text-xs space-y-1 text-stone-700 dark:text-stone-300 border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between">
                  <span>মেমোর সংখ্যা:</span>
                  <strong className="text-stone-900 dark:text-white font-bold">{toBengaliNumber(confirmRestoreRecord.summary.totalMemos, useBengali)} টি</strong>
                </div>
                <div className="flex justify-between">
                  <span>পার্টির সংখ্যা:</span>
                  <strong className="text-stone-900 dark:text-white font-bold">{toBengaliNumber(confirmRestoreRecord.summary.totalParties, useBengali)} জন</strong>
                </div>
                <div className="flex justify-between">
                  <span>মোট বকেয়া হিসাব:</span>
                  <strong className="text-rose-600 font-bold">{toBnCurrency(confirmRestoreRecord.summary.totalDue, useBengali)}</strong>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmRestoreRecord(null)}
                  className="flex-1 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-xl hover:bg-stone-100 transition"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => handleConfirmRestore(confirmRestoreRecord)}
                  className="flex-1 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {isRestoring ? 'রিস্টোর হচ্ছে...' : 'হ্যাঁ, রিস্টোর করুন'}
                </button>
              </div>
            </div>
          )}

          {/* Backup History List */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>অনলাইন ক্লাউড ব্যাকআপ হিস্টোরি</span>
              </span>
              <span className="text-[11px] text-stone-500 font-mono">
                {toBengaliNumber(backupHistory.length, useBengali)} টি ব্যাকআপ
              </span>
            </div>

            {backupHistory.length === 0 ? (
              <div className="p-4 text-center bg-stone-50 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-500 text-xs">
                এখনও কোনো অনলাইন ব্যাকআপ ফাইল সংরক্ষিত নেই। উপরের বাটনে ক্লিক করে প্রথম ব্যাকআপটি রাখুন।
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {backupHistory.map((rec) => (
                  <div 
                    key={rec.backupId}
                    className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-600 transition flex items-center justify-between shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-800 dark:text-white">
                        {rec.formattedDate}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {toBengaliNumber(rec.summary.totalMemos, useBengali)} টি মেমো • {toBengaliNumber(rec.summary.totalParties, useBengali)} জন পার্টি
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => setConfirmRestoreRecord(rec)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-700 transition active:scale-95"
                    >
                      রিস্টোর
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 rounded-xl border border-stone-300 dark:border-stone-600 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
