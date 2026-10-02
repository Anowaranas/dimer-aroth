import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { 
  INITIAL_BASE_RATE, 
  INITIAL_MEMOS, 
  INITIAL_PARTIES, 
  INITIAL_SHOP_PROFILE,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_CHALANS,
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_EXPENSES
} from './data/initialData';
import { 
  AuthUser, 
  BaseRate, 
  Memo, 
  Party, 
  PaymentRecord, 
  ShopProfile, 
  UserCloudData,
  Supplier,
  SupplierChalan,
  SupplierPayment,
  ExpenseRecord 
} from './types';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { UnifiedKhataView, KhataSubTab } from './components/UnifiedKhataView';
import { AllMemosView } from './components/AllMemosView';
import { SettingsView } from './components/SettingsView';
import { NewMemoModal } from './components/NewMemoModal';
import { MemoVoucherModal } from './components/MemoVoucherModal';
import { NewChalanModal } from './components/NewChalanModal';
import { ChalanVoucherModal } from './components/ChalanVoucherModal';
import { PaymentModal } from './components/PaymentModal';
import { ShareModal } from './components/ShareModal';
import { LoginModal } from './components/LoginModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { PartyDetailsModal } from './components/PartyDetailsModal';
import { SupplierDetailsModal } from './components/SupplierDetailsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { performOnlineBackup, isAutoCloudSyncEnabled } from './utils/cloudSync';
import { ensureAuthenticatedUser } from './lib/firebase';
import { 
  syncMemoToFirebase, 
  syncPartyToFirebase, 
  deletePartyFromFirebase, 
  deleteSupplierFromFirebase,
  deleteSupplierChalanFromFirebase,
  syncSupplierToFirebase,
  syncSupplierChalanToFirebase,
  syncSupplierPaymentToFirebase,
  syncExpenseToFirebase,
  deleteExpenseFromFirebase,
  deleteMemoFromFirebase, 
  syncShopProfileToFirebase, 
  syncBaseRateToFirebase,
  loadUserDataFromFirebase,
  subscribeToRealtimeUserData,
  isFirestoreQuotaExceeded,
  isFirestoreOffline
} from './utils/firebaseDataService';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [khataSubTab, setKhataSubTab] = useState<KhataSubTab>('parties');

  // Firestore quota and connection status states
  const [hasQuotaError, setHasQuotaError] = useState<boolean>(false);
  const [hasOfflineNotice, setHasOfflineNotice] = useState<boolean>(false);

  // Periodic module-level check for Firestore quota-exceeded & offline connection status
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFirestoreQuotaExceeded) {
        setHasQuotaError(true);
      }
      if (isFirestoreOffline) {
        setHasOfflineNotice(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // App Data with LocalStorage Persistence - Clean empty state
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    const CLEAN_KEY = 'egg_arat_clean_empty_v5';
    if (typeof window !== 'undefined' && !localStorage.getItem(CLEAN_KEY)) {
      localStorage.setItem(CLEAN_KEY, 'true');
      localStorage.removeItem('egg_arat_profile');
      localStorage.removeItem('egg_arat_rates');
      localStorage.removeItem('egg_arat_parties');
      localStorage.removeItem('egg_arat_memos');
      localStorage.removeItem('egg_arat_auth_user');
      localStorage.removeItem('egg_arat_online_cloud_latest');
      localStorage.removeItem('egg_arat_online_cloud_history');
      return INITIAL_SHOP_PROFILE;
    }
    const saved = localStorage.getItem('egg_arat_profile');
    return saved ? JSON.parse(saved) : INITIAL_SHOP_PROFILE;
  });

  const [baseRate, setBaseRate] = useState<BaseRate>(() => {
    const saved = localStorage.getItem('egg_arat_rates');
    return saved ? JSON.parse(saved) : INITIAL_BASE_RATE;
  });

  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem('egg_arat_parties');
    if (!saved) return INITIAL_PARTIES;
    try {
      const parsed: Party[] = JSON.parse(saved);
      return parsed.filter((p) => !['p-1', 'p-2', 'p-3'].includes(p.id));
    } catch {
      return [];
    }
  });

  const [memos, setMemos] = useState<Memo[]>(() => {
    const saved = localStorage.getItem('egg_arat_memos');
    if (!saved) return INITIAL_MEMOS;
    try {
      const parsed: Memo[] = JSON.parse(saved);
      const valid = parsed.filter((m) => !['m-1', 'm-2', 'm-3'].includes(m.id));
      // Sanitize legacy mixed memo numbers so they start cleanly from 1
      const sanitized = valid.map((m, idx) => {
        if (!m.memoNumber || m.memoNumber.includes('২৬০০')) {
          const seqNum = valid.length - idx;
          return { ...m, memoNumber: seqNum > 0 ? `${seqNum}` : `${idx + 1}` };
        }
        return m;
      });
      return sanitized;
    } catch {
      return [];
    }
  });

  // Feature 2: Suppliers / Farmers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('egg_arat_suppliers');
    if (!saved) return INITIAL_SUPPLIERS;
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [supplierChalans, setSupplierChalans] = useState<SupplierChalan[]>(() => {
    const saved = localStorage.getItem('egg_arat_supplier_chalans');
    if (!saved) return INITIAL_SUPPLIER_CHALANS;
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem('egg_arat_supplier_payments');
    if (!saved) return INITIAL_SUPPLIER_PAYMENTS;
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Feature 3: Daily Expenses state
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('egg_arat_expenses');
    if (!saved) return INITIAL_EXPENSES;
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [useBengali, setUseBengali] = useState<boolean>(() => {
    const saved = localStorage.getItem('egg_arat_use_bn');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('egg_arat_dark_mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Mobile Logged-in User (starts clean / null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('egg_arat_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Modals
  const [isNewMemoModalOpen, setIsNewMemoModalOpen] = useState<boolean>(false);
  const [selectedPartyForNewMemo, setSelectedPartyForNewMemo] = useState<Party | null>(null);
  const [newMemoInitialDate, setNewMemoInitialDate] = useState<string | undefined>(undefined);
  const [activeVoucherMemo, setActiveVoucherMemo] = useState<Memo | null>(null);
  const [isNewChalanModalOpen, setIsNewChalanModalOpen] = useState<boolean>(false);
  const [selectedSupplierForNewChalan, setSelectedSupplierForNewChalan] = useState<Supplier | null>(null);
  const [newChalanInitialDate, setNewChalanInitialDate] = useState<string | undefined>(undefined);
  const [activeChalanVoucher, setActiveChalanVoucher] = useState<SupplierChalan | null>(null);
  const [paymentModalParty, setPaymentModalParty] = useState<Party | null>(null);
  const [activeShareMemo, setActiveShareMemo] = useState<Memo | null>(null);
  const [viewingPartyDetails, setViewingPartyDetails] = useState<Party | null>(null);
  const [viewingSupplierDetails, setViewingSupplierDetails] = useState<Supplier | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCloudBackupModalOpen, setIsCloudBackupModalOpen] = useState<boolean>(false);

  // Cloud Data Notification Toast Banner
  const [cloudNotification, setCloudNotification] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Auto Online Cloud Backup Sync (debounced, both Mobile & Google sync)
  useEffect(() => {
    if (!isAutoCloudSyncEnabled()) return;
    const timer = setTimeout(() => {
      performOnlineBackup({
        shopProfile,
        baseRate,
        parties,
        memos,
        suppliers,
        supplierChalans,
        supplierPayments,
        expenses,
        userAccount: authUser,
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(timer);
  }, [memos, parties, baseRate, shopProfile, suppliers, supplierChalans, supplierPayments, expenses, authUser]);



  // Handler: Restore Cloud Backup
  const handleRestoreCloudData = (data: {
    shopProfile?: ShopProfile;
    baseRate?: BaseRate;
    parties: Party[];
    memos: Memo[];
  }) => {
    if (data.shopProfile) setShopProfile(data.shopProfile);
    if (data.baseRate) setBaseRate(data.baseRate);
    if (data.parties) setParties(data.parties);
    if (data.memos) setMemos(data.memos);
  };

  // Firebase initial boot & account auto-sync on mount / auth change
  useEffect(() => {
    ensureAuthenticatedUser().catch(() => {});
    if (authUser?.id) {
      loadUserDataFromFirebase(authUser.id).then((cloudData) => {
        if (cloudData && cloudData.hasData) {
          if (cloudData.shopProfile) setShopProfile(cloudData.shopProfile);
          if (cloudData.baseRate) setBaseRate(cloudData.baseRate);
          if (cloudData.parties && cloudData.parties.length > 0) {
            const incomingParties = cloudData.parties;
            setParties(prev => {
              const map = new Map<string, Party>();
              incomingParties.forEach(p => map.set(p.id, p));
              prev.forEach(p => {
                if (!map.has(p.id) || (p.currentDue !== 0 && map.get(p.id)?.currentDue === 0)) {
                  map.set(p.id, p);
                }
              });
              return Array.from(map.values());
            });
          }
          if (cloudData.memos && cloudData.memos.length > 0) {
            const incomingMemos = cloudData.memos;
            setMemos(prev => {
              const map = new Map<string, Memo>();
              incomingMemos.forEach(m => map.set(m.id, m));
              prev.forEach(m => {
                if (!map.has(m.id)) map.set(m.id, m);
              });
              return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
            });
          }
          if (cloudData.suppliers && cloudData.suppliers.length > 0) {
            const incomingSuppliers = cloudData.suppliers;
            setSuppliers(prev => {
              const map = new Map<string, Supplier>();
              incomingSuppliers.forEach(s => map.set(s.id, s));
              prev.forEach(s => {
                if (!map.has(s.id)) map.set(s.id, s);
              });
              return Array.from(map.values());
            });
          }
          if (cloudData.supplierChalans && cloudData.supplierChalans.length > 0) {
            const incomingChalans = cloudData.supplierChalans;
            setSupplierChalans(prev => {
              const map = new Map<string, SupplierChalan>();
              incomingChalans.forEach(c => map.set(c.id, c));
              prev.forEach(c => {
                if (!map.has(c.id)) map.set(c.id, c);
              });
              return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
            });
          }
          if (cloudData.supplierPayments && cloudData.supplierPayments.length > 0) {
            const incomingPayments = cloudData.supplierPayments;
            setSupplierPayments(prev => {
              const map = new Map<string, SupplierPayment>();
              incomingPayments.forEach(p => map.set(p.id, p));
              prev.forEach(p => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
          }
          if (cloudData.expenses && cloudData.expenses.length > 0) {
            const incomingExpenses = cloudData.expenses;
            setExpenses(prev => {
              const map = new Map<string, ExpenseRecord>();
              incomingExpenses.forEach(e => map.set(e.id, e));
              prev.forEach(e => {
                if (!map.has(e.id)) map.set(e.id, e);
              });
              return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
          }
        }
      }).catch(() => {});
    }
  }, [authUser?.id]);

  // Multi-Device Realtime Cloud Synchronization
  useEffect(() => {
    if (!authUser?.id) return;
    const unsubscribe = subscribeToRealtimeUserData(authUser.id, {
      onMemosUpdate: (remoteMemos) => {
        if (remoteMemos && remoteMemos.length > 0) {
          setMemos((prev) => {
            const map = new Map<string, Memo>();
            remoteMemos.forEach((m) => map.set(m.id, m));
            prev.forEach((m) => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
            );
            localStorage.setItem('egg_arat_memos', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onPartiesUpdate: (remoteParties) => {
        if (remoteParties && remoteParties.length > 0) {
          setParties((prev) => {
            const map = new Map<string, Party>();
            remoteParties.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('egg_arat_parties', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onSuppliersUpdate: (remoteSuppliers) => {
        if (remoteSuppliers && remoteSuppliers.length > 0) {
          setSuppliers((prev) => {
            const map = new Map<string, Supplier>();
            remoteSuppliers.forEach((s) => map.set(s.id, s));
            prev.forEach((s) => {
              if (!map.has(s.id)) map.set(s.id, s);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('egg_arat_suppliers', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onChalansUpdate: (remoteChalans) => {
        if (remoteChalans && remoteChalans.length > 0) {
          setSupplierChalans((prev) => {
            const map = new Map<string, SupplierChalan>();
            remoteChalans.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
            );
            localStorage.setItem('egg_arat_supplier_chalans', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onPaymentsUpdate: (remotePayments) => {
        if (remotePayments && remotePayments.length > 0) {
          setSupplierPayments((prev) => {
            const map = new Map<string, SupplierPayment>();
            remotePayments.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            localStorage.setItem('egg_arat_supplier_payments', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onExpensesUpdate: (remoteExpenses) => {
        if (remoteExpenses && remoteExpenses.length > 0) {
          setExpenses((prev) => {
            const map = new Map<string, ExpenseRecord>();
            remoteExpenses.forEach((e) => map.set(e.id, e));
            prev.forEach((e) => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            localStorage.setItem('egg_arat_expenses', JSON.stringify(merged));
            return merged;
          });
        }
      },
      onProfileUpdate: (remoteProfile) => {
        if (remoteProfile && remoteProfile.name) {
          localStorage.setItem('egg_arat_profile_last_firebase', JSON.stringify(remoteProfile));
          setShopProfile(remoteProfile);
        }
      },
      onRateUpdate: (remoteRate) => {
        if (remoteRate && (remoteRate.redRate > 0 || remoteRate.whiteRate > 0)) {
          localStorage.setItem('egg_arat_rates_last_firebase', JSON.stringify(remoteRate));
          setBaseRate(remoteRate);
        }
      },
    });

    return () => unsubscribe();
  }, [authUser?.id]);

  // Sync to LocalStorage & Firebase
  useEffect(() => {
    const cached = localStorage.getItem('egg_arat_profile_last_firebase');
    const currentStr = JSON.stringify(shopProfile);
    if (cached === currentStr) return; // Already synced!

    localStorage.setItem('egg_arat_profile', currentStr);
    localStorage.setItem('egg_arat_profile_last_firebase', currentStr);
    syncShopProfileToFirebase(shopProfile).catch(() => {});
  }, [shopProfile]);

  useEffect(() => {
    const cached = localStorage.getItem('egg_arat_rates_last_firebase');
    const currentStr = JSON.stringify(baseRate);
    if (cached === currentStr) return; // Already synced!

    localStorage.setItem('egg_arat_rates', currentStr);
    localStorage.setItem('egg_arat_rates_last_firebase', currentStr);
    syncBaseRateToFirebase(baseRate).catch(() => {});
  }, [baseRate]);

  useEffect(() => {
    localStorage.setItem('egg_arat_parties', JSON.stringify(parties));
  }, [parties]);

  useEffect(() => {
    localStorage.setItem('egg_arat_memos', JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    localStorage.setItem('egg_arat_use_bn', JSON.stringify(useBengali));
  }, [useBengali]);

  useEffect(() => {
    localStorage.setItem('egg_arat_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('egg_arat_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('egg_arat_supplier_chalans', JSON.stringify(supplierChalans));
  }, [supplierChalans]);

  useEffect(() => {
    localStorage.setItem('egg_arat_supplier_payments', JSON.stringify(supplierPayments));
  }, [supplierPayments]);

  useEffect(() => {
    localStorage.setItem('egg_arat_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem('egg_arat_auth_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('egg_arat_auth_user');
    }
  }, [authUser]);

  // Supplier & Chalan Handlers
  const handleAddSupplier = (supplier: Supplier) => {
    const nowIso = new Date().toISOString();
    const supWithTime: Supplier = { ...supplier, createdAt: supplier.createdAt || nowIso, updatedAt: nowIso };
    setSuppliers((prev) => [supWithTime, ...prev.filter(s => s.id !== supWithTime.id)]);
    syncSupplierToFirebase(supWithTime).catch(() => {});
    performOnlineBackup({
      shopProfile,
      baseRate,
      parties,
      memos,
      suppliers: [supWithTime, ...suppliers.filter(s => s.id !== supWithTime.id)],
      supplierChalans,
      supplierPayments,
      expenses,
      userAccount: authUser,
    }).catch(() => {});
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    setSupplierChalans((prev) => prev.filter((c) => c.supplierId !== supplierId));
    setSupplierPayments((prev) => prev.filter((p) => p.supplierId !== supplierId));
    deleteSupplierFromFirebase(supplierId).catch(() => {});
    performOnlineBackup({
      shopProfile,
      baseRate,
      parties,
      memos,
      suppliers: suppliers.filter((s) => s.id !== supplierId),
      supplierChalans: supplierChalans.filter((c) => c.supplierId !== supplierId),
      supplierPayments: supplierPayments.filter((p) => p.supplierId !== supplierId),
      expenses,
      userAccount: authUser,
    }).catch(() => {});
  };

  const handleAddSupplierChalan = (chalan: SupplierChalan) => {
    const updatedChalans = [chalan, ...supplierChalans.filter(c => c.id !== chalan.id)];
    setSupplierChalans(updatedChalans);
    try {
      localStorage.setItem('egg_arat_supplier_chalans', JSON.stringify(updatedChalans));
    } catch {
      // ignore
    }

    syncSupplierChalanToFirebase(chalan).catch(() => {});

    setSuppliers((prev) => {
      const existing = prev.find(s => s.id === chalan.supplierId);
      const newPayable = chalan.remainingDue !== undefined 
        ? chalan.remainingDue 
        : ((existing?.totalPayable || 0) + (chalan.dueAmount || 0));
      const nowIso = new Date().toISOString();

      let nextSuppliers: Supplier[] = prev;
      if (existing) {
        const updatedSup: Supplier = {
          ...existing,
          totalPurchased: (existing.totalPurchased || 0) + chalan.totalAmount,
          totalPayable: newPayable,
          totalPaid: (existing.totalPaid || 0) + (chalan.paidAmount || 0),
          updatedAt: nowIso,
        };
        syncSupplierToFirebase(updatedSup).catch(() => {});
        nextSuppliers = [updatedSup, ...prev.filter(s => s.id !== existing.id)];
      } else if (chalan.supplierId && chalan.supplierName) {
        const newSup: Supplier = {
          id: chalan.supplierId,
          name: chalan.supplierName,
          phone: chalan.supplierPhone || '',
          farmLocation: '',
          totalPurchased: chalan.totalAmount,
          totalPayable: chalan.remainingDue || chalan.dueAmount || 0,
          totalPaid: chalan.paidAmount || 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        syncSupplierToFirebase(newSup).catch(() => {});
        nextSuppliers = [newSup, ...prev.filter(s => s.id !== newSup.id)];
      }

      performOnlineBackup({
        shopProfile,
        baseRate,
        parties,
        memos,
        suppliers: nextSuppliers,
        supplierChalans: updatedChalans,
        supplierPayments,
        expenses,
        userAccount: authUser,
      }).catch(() => {});

      return nextSuppliers;
    });
  };

  const handleDeleteChalan = (chalanId: string) => {
    setSupplierChalans((prev) => prev.filter((c) => c.id !== chalanId));
    deleteSupplierChalanFromFirebase(chalanId).catch(() => {});
    performOnlineBackup({
      shopProfile,
      baseRate,
      parties,
      memos,
      suppliers,
      supplierChalans: supplierChalans.filter((c) => c.id !== chalanId),
      supplierPayments,
      expenses,
      userAccount: authUser,
    }).catch(() => {});
  };

  const handleAddSupplierPayment = (payment: SupplierPayment) => {
    setSupplierPayments((prev) => [payment, ...prev.filter(p => p.id !== payment.id)]);
    syncSupplierPaymentToFirebase(payment).catch(() => {});

    setSuppliers((prev) => {
      const existing = prev.find(s => s.id === payment.supplierId);
      if (!existing) return prev;
      const nowIso = new Date().toISOString();
      const updatedSup: Supplier = {
        ...existing,
        totalPaid: (existing.totalPaid || 0) + payment.amount,
        totalPayable: Math.max(0, (existing.totalPayable || 0) - payment.amount),
        updatedAt: nowIso,
      };
      syncSupplierToFirebase(updatedSup).catch(() => {});
      return [updatedSup, ...prev.filter(s => s.id !== existing.id)];
    });

    performOnlineBackup({
      shopProfile,
      baseRate,
      parties,
      memos,
      suppliers,
      supplierChalans,
      supplierPayments: [payment, ...supplierPayments],
      expenses,
      userAccount: authUser,
    }).catch(() => {});
  };

  // Expense Handlers
  const handleAddExpense = (expense: ExpenseRecord) => {
    setExpenses((prev) => [expense, ...prev]);
    syncExpenseToFirebase(expense).catch(() => {});
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    deleteExpenseFromFirebase(expenseId).catch(() => {});
  };

  // Handler: Save New Memo
  const handleSaveMemo = (newMemo: Memo, updatedPartyDue: number) => {
    // 1. Prepend new memo
    setMemos((prev) => [newMemo, ...prev]);
    syncMemoToFirebase(newMemo).catch(() => {});

    // 2. Update party's current due or create party if doesn't exist and place at top
    const nowIso = new Date().toISOString();
    setParties((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.id === newMemo.partyId || (p.name.trim().toLowerCase() === newMemo.partyName.trim().toLowerCase() && newMemo.partyName.trim().toLowerCase() !== 'নগদ বিক্রি')
      );
      if (existingIdx >= 0) {
        const existingParty = prev[existingIdx];
        const updatedParty = {
          ...existingParty,
          currentDue: updatedPartyDue,
          totalPurchased: (existingParty.totalPurchased || 0) + newMemo.totalBill,
          updatedAt: nowIso,
        };
        syncPartyToFirebase(updatedParty).catch(() => {});
        return [updatedParty, ...prev.filter((_, idx) => idx !== existingIdx)];
      } else {
        // Create new party
        const newParty: Party = {
          id: newMemo.partyId,
          name: newMemo.partyName,
          phone: newMemo.partyPhone,
          type: newMemo.partyType,
          currentDue: updatedPartyDue,
          totalPurchased: newMemo.totalBill,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        syncPartyToFirebase(newParty).catch(() => {});
        return [newParty, ...prev];
      }
    });

    // 3. Open the newly created memo's voucher for instant review/print/WhatsApp share
    setActiveVoucherMemo(newMemo);
  };

  // Handler: Record payment (টাকা জমা / বাকি আদায়)
  const handleRecordPayment = (payment: PaymentRecord, newDue: number) => {
    const nowIso = new Date().toISOString();
    setParties((prev) => {
      const existing = prev.find(p => p.id === payment.partyId);
      if (!existing) return prev;
      const updated = { ...existing, currentDue: newDue, updatedAt: nowIso };
      syncPartyToFirebase(updated).catch(() => {});
      return [updated, ...prev.filter(p => p.id !== existing.id)];
    });
  };

  // Handler: Add new party manually
  const handleAddParty = (partyData: Omit<Party, 'id' | 'createdAt'>) => {
    const nowIso = new Date().toISOString();
    const newP: Party = {
      ...partyData,
      id: `p-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setParties((prev) => [newP, ...prev]);
    syncPartyToFirebase(newP).catch(() => {});
  };

  // Handler: Update existing party manually (updates name, phone, address, type, notes & syncs memos)
  const handleUpdateParty = (partyId: string, updatedFields: Partial<Omit<Party, 'id' | 'createdAt'>>) => {
    const nowIso = new Date().toISOString();
    setParties((prev) => {
      const existing = prev.find(p => p.id === partyId);
      if (!existing) return prev;
      const updated = { ...existing, ...updatedFields, updatedAt: nowIso };
      syncPartyToFirebase(updated).catch(() => {});
      // Immediately update viewing state if open so modal shows changes
      if (viewingPartyDetails && viewingPartyDetails.id === partyId) {
        setViewingPartyDetails(updated);
      }
      return [updated, ...prev.filter(p => p.id !== partyId)];
    });

    // If name, phone, or type changed, also update matching fields in memos
    if (updatedFields.name || updatedFields.phone || updatedFields.type) {
      setMemos((prev) =>
        prev.map((m) => {
          if (m.partyId === partyId) {
            const updatedMemo = {
              ...m,
              partyName: updatedFields.name !== undefined ? updatedFields.name : m.partyName,
              partyPhone: updatedFields.phone !== undefined ? updatedFields.phone : m.partyPhone,
              partyType: updatedFields.type !== undefined ? updatedFields.type : m.partyType,
            };
            syncMemoToFirebase(updatedMemo).catch(() => {});
            return updatedMemo;
          }
          return m;
        })
      );
    }
  };

  // Handler: Update existing supplier
  const handleUpdateSupplier = (supplierId: string, updatedFields: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const updated = { ...s, ...updatedFields };
          syncSupplierToFirebase(updated).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  // Handler: Delete party
  const handleDeleteParty = (partyId: string) => {
    setParties((prev) => prev.filter((p) => p.id !== partyId));
    deletePartyFromFirebase(partyId).catch(() => {});
  };

  // Handler: Delete memo
  const handleDeleteMemo = (memoId: string) => {
    const memoToDelete = memos.find((m) => m.id === memoId);
    if (memoToDelete) {
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === memoToDelete.partyId) {
            const adjustedDue = Math.max(0, p.currentDue - memoToDelete.remainingDue);
            const adjustedPurchased = Math.max(0, (p.totalPurchased || 0) - memoToDelete.totalBill);
            const updated = { ...p, currentDue: adjustedDue, totalPurchased: adjustedPurchased };
            syncPartyToFirebase(updated).catch(() => {});
            return updated;
          }
          return p;
        })
      );
    }
    setMemos((prev) => prev.filter((m) => m.id !== memoId));
    deleteMemoFromFirebase(memoId).catch(() => {});
    if (activeVoucherMemo?.id === memoId) {
      setActiveVoucherMemo(null);
    }
    if (activeShareMemo?.id === memoId) {
      setActiveShareMemo(null);
    }
  };

  // Handler: Export data
  const handleExportData = () => {
    const backup = {
      shopProfile,
      baseRate,
      parties,
      memos,
      version: '1.0',
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dimer_arat_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Import data
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.parties && parsed.memos) {
          if (parsed.shopProfile) setShopProfile(parsed.shopProfile);
          if (parsed.baseRate) setBaseRate(parsed.baseRate);
          setParties(parsed.parties);
          setMemos(parsed.memos);
          alert('ডেটা সফলভাবে রিস্টোর করা হয়েছে!');
        } else {
          alert('ভুল ফাইল ফরম্যাট!');
        }
      } catch {
        alert('ফাইল পড়তে সমস্যা হয়েছে!');
      }
    };
    reader.readAsText(file);
  };

  // Handler: Reset all data and empty all boxes
  const handleResetData = () => {
    localStorage.removeItem('egg_arat_profile');
    localStorage.removeItem('egg_arat_rates');
    localStorage.removeItem('egg_arat_parties');
    localStorage.removeItem('egg_arat_memos');
    localStorage.removeItem('egg_arat_auth_user');
    localStorage.removeItem('egg_arat_online_cloud_latest');
    localStorage.removeItem('egg_arat_online_cloud_history');
    setShopProfile(INITIAL_SHOP_PROFILE);
    setBaseRate(INITIAL_BASE_RATE);
    setParties([]);
    setMemos([]);
    setAuthUser(null);
  };

  // Handler: Comprehensive Login Success with Automatic Cloud Data Restoration
  const handleLoginSuccess = (user: AuthUser, cloudData?: UserCloudData | null) => {
    setAuthUser(user);
    setIsLoginModalOpen(false);

    if (cloudData && cloudData.hasData) {
      if (cloudData.shopProfile) {
        setShopProfile(cloudData.shopProfile);
        localStorage.setItem('egg_arat_profile', JSON.stringify(cloudData.shopProfile));
      }
      if (cloudData.baseRate) {
        setBaseRate(cloudData.baseRate);
        localStorage.setItem('egg_arat_rates', JSON.stringify(cloudData.baseRate));
      }
      if (cloudData.parties && cloudData.parties.length > 0) {
        setParties((prev) => {
          const cloudMap = new Map(cloudData.parties!.map((p) => [p.id, p]));
          prev.forEach((localP) => {
            if (!cloudMap.has(localP.id)) {
              cloudMap.set(localP.id, localP);
            }
          });
          const merged = Array.from(cloudMap.values());
          localStorage.setItem('egg_arat_parties', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.memos && cloudData.memos.length > 0) {
        setMemos((prev) => {
          const cloudMemoMap = new Map(cloudData.memos!.map((m) => [m.id, m]));
          prev.forEach((localM) => {
            if (!cloudMemoMap.has(localM.id)) {
              cloudMemoMap.set(localM.id, localM);
            }
          });
          const merged = Array.from(cloudMemoMap.values()).sort(
            (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          );
          localStorage.setItem('egg_arat_memos', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.suppliers && cloudData.suppliers.length > 0) {
        setSuppliers((prev) => {
          const map = new Map(cloudData.suppliers!.map((s) => [s.id, s]));
          prev.forEach((s) => {
            if (!map.has(s.id)) map.set(s.id, s);
          });
          const merged = Array.from(map.values());
          localStorage.setItem('egg_arat_suppliers', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.supplierChalans && cloudData.supplierChalans.length > 0) {
        setSupplierChalans((prev) => {
          const map = new Map(cloudData.supplierChalans!.map((c) => [c.id, c]));
          prev.forEach((c) => {
            if (!map.has(c.id)) map.set(c.id, c);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          );
          localStorage.setItem('egg_arat_supplier_chalans', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.supplierPayments && cloudData.supplierPayments.length > 0) {
        setSupplierPayments((prev) => {
          const map = new Map(cloudData.supplierPayments!.map((p) => [p.id, p]));
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          localStorage.setItem('egg_arat_supplier_payments', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.expenses && cloudData.expenses.length > 0) {
        setExpenses((prev) => {
          const map = new Map(cloudData.expenses!.map((e) => [e.id, e]));
          prev.forEach((e) => {
            if (!map.has(e.id)) map.set(e.id, e);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          localStorage.setItem('egg_arat_expenses', JSON.stringify(merged));
          return merged;
        });
      }

      setCloudNotification({
        type: 'success',
        message: `🎉 স্বাগতম ${user.name}! মেমো, পার্টি, চালান ও হিসাব ক্লাউড থেকে রিস্টোর করা হয়েছে।`,
      });
      setTimeout(() => setCloudNotification(null), 6000);
    } else {
      // ONLY perform online backup on first login if local state actually has data!
      if (parties.length > 0 || memos.length > 0 || suppliers.length > 0 || supplierChalans.length > 0) {
        performOnlineBackup({
          shopProfile,
          baseRate,
          parties,
          memos,
          suppliers,
          supplierChalans,
          supplierPayments,
          expenses,
          userAccount: user,
        }).catch(() => {});
      }

      setCloudNotification({
        type: 'info',
        message: `স্বাগতম ${user.name}! ক্লাউডে অটো-ব্যাকআপ সফলভাবে সংযুক্ত হয়েছে।`,
      });
      setTimeout(() => setCloudNotification(null), 4500);
    }
  };

  // Handler: Safe Logout with Cloud Persistence Guarantee
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);

  // Manual Instant Cloud Pull / Restore
  const handleManualCloudRefresh = async () => {
    if (!authUser?.id) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsRefreshingCloud(true);
    try {
      const cloudData = await loadUserDataFromFirebase(authUser.id);
      if (cloudData && cloudData.hasData) {
        if (cloudData.shopProfile) {
          setShopProfile(cloudData.shopProfile);
          localStorage.setItem('egg_arat_profile', JSON.stringify(cloudData.shopProfile));
        }
        if (cloudData.baseRate) {
          setBaseRate(cloudData.baseRate);
          localStorage.setItem('egg_arat_rates', JSON.stringify(cloudData.baseRate));
        }
        if (cloudData.parties && cloudData.parties.length > 0) {
          setParties((prev) => {
            const map = new Map(cloudData.parties!.map((p) => [p.id, p]));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('egg_arat_parties', JSON.stringify(merged));
            return merged;
          });
        }
        if (cloudData.memos && cloudData.memos.length > 0) {
          setMemos((prev) => {
            const map = new Map(cloudData.memos!.map((m) => [m.id, m]));
            prev.forEach((m) => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
            );
            localStorage.setItem('egg_arat_memos', JSON.stringify(merged));
            return merged;
          });
        }
        if (cloudData.suppliers && cloudData.suppliers.length > 0) {
          setSuppliers((prev) => {
            const map = new Map(cloudData.suppliers!.map((s) => [s.id, s]));
            prev.forEach((s) => {
              if (!map.has(s.id)) map.set(s.id, s);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('egg_arat_suppliers', JSON.stringify(merged));
            return merged;
          });
        }
        if (cloudData.supplierChalans && cloudData.supplierChalans.length > 0) {
          setSupplierChalans((prev) => {
            const map = new Map(cloudData.supplierChalans!.map((c) => [c.id, c]));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
            );
            localStorage.setItem('egg_arat_supplier_chalans', JSON.stringify(merged));
            return merged;
          });
        }
        if (cloudData.supplierPayments && cloudData.supplierPayments.length > 0) {
          setSupplierPayments((prev) => {
            const map = new Map(cloudData.supplierPayments!.map((p) => [p.id, p]));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            localStorage.setItem('egg_arat_supplier_payments', JSON.stringify(merged));
            return merged;
          });
        }
        if (cloudData.expenses && cloudData.expenses.length > 0) {
          setExpenses((prev) => {
            const map = new Map(cloudData.expenses!.map((e) => [e.id, e]));
            prev.forEach((e) => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            localStorage.setItem('egg_arat_expenses', JSON.stringify(merged));
            return merged;
          });
        }

        setCloudNotification({
          type: 'success',
          message: `🔄 ক্লাউড থেকে সর্বশেষ সকল তথ্য (${cloudData.totalMemos || 0}টি মেমো, ${cloudData.totalParties || 0}টি পার্টি) সফলভাবে রিলোড করা হয়েছে।`,
        });
      } else {
        await performOnlineBackup({
          shopProfile,
          baseRate,
          parties,
          memos,
          suppliers,
          supplierChalans,
          supplierPayments,
          expenses,
          userAccount: authUser,
        });
        setCloudNotification({
          type: 'info',
          message: 'ক্লাউড সিঙ্ক আপডেট সম্পন্ন হয়েছে। আপনার সকল হিসাব ক্লাউডে সংরক্ষিত আছে।',
        });
      }
      setTimeout(() => setCloudNotification(null), 4000);
    } catch (err) {
      console.warn('Cloud refresh error:', err);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  const handleLogout = () => {
    if (authUser) {
      performOnlineBackup({
        shopProfile,
        baseRate,
        parties,
        memos,
        suppliers,
        supplierChalans,
        supplierPayments,
        expenses,
        userAccount: authUser,
      }).catch(() => {});
    }

    setAuthUser(null);
    localStorage.removeItem('egg_arat_auth_user');
    setShopProfile(INITIAL_SHOP_PROFILE);
    setBaseRate(INITIAL_BASE_RATE);
    setParties([]);
    setMemos([]);
    setSuppliers([]);
    setSupplierChalans([]);
    setSupplierPayments([]);
    setExpenses([]);
    localStorage.removeItem('egg_arat_profile');
    localStorage.removeItem('egg_arat_rates');
    localStorage.removeItem('egg_arat_parties');
    localStorage.removeItem('egg_arat_memos');
    localStorage.removeItem('egg_arat_suppliers');
    localStorage.removeItem('egg_arat_supplier_chalans');
    localStorage.removeItem('egg_arat_supplier_payments');
    localStorage.removeItem('egg_arat_expenses');

    setCloudNotification({
      type: 'info',
      message: 'সফলভাবে লগআউট সম্পন্ন হয়েছে। পুনরায় লগইন করলে ক্লাউড থেকে পূর্বের সমস্ত তথ্য ফেরত পাবেন।',
    });
    setTimeout(() => setCloudNotification(null), 5000);
  };

  const hasDueNotification = parties.some((p) => p.currentDue > 0) || suppliers.some((s) => s.totalPayable > 0);

  return (
    <div className={`${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} min-h-screen transition-colors`}>
      {/* Responsive App View Wrapper - comfortable on desktop, tablet and mobile */}
      <div className="max-w-xl md:max-w-2xl mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative border-x border-slate-200/90 dark:border-slate-800">
        

        
        {/* Cloud Notification Toast Banner */}
        {cloudNotification && (
          <div
            id="cloud-notification-banner"
            className={`mx-2 mt-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center justify-between border animate-in slide-in-from-top-2 ${
              cloudNotification.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-700'
                : 'bg-sky-50 text-sky-950 border-sky-300 dark:bg-sky-950/80 dark:text-sky-100 dark:border-sky-700'
            }`}
          >
            <div className="flex items-center gap-2 pr-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{cloudNotification.message}</span>
            </div>
            <button
              onClick={() => setCloudNotification(null)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-stone-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Firestore Quota Exceeded Friendly Alert Banner */}
        {hasQuotaError && (
          <div
            id="firestore-quota-exceeded-banner"
            className="mx-2 mt-1.5 p-3 rounded-2xl bg-rose-50 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-900/60 shadow-md space-y-2 animate-in slide-in-from-top-2 relative"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black leading-tight">ফায়ারবেস ক্লাউড কোটা শেষ হয়েছে (Quota Exceeded)</h4>
                <p className="text-[11px] leading-relaxed opacity-90">
                  আজকের জন্য ফায়ারবেস ডাটাবেজের দৈনিক ফ্রি রিড/রাইট কোটা সম্পূর্ণ শেষ হয়ে গেছে। তবে চিন্তার কিছু নেই! আপনার আড়তের সকল হিসাব লোকাল স্টোরেজে <b>১০০% সুরক্ষিত (Offline Mode Active)</b> রয়েছে এবং আগামীকাল এটি স্বয়ংক্রিয়ভাবে আবার সচল হবে। আপনি অফলাইনেই কাজ চালিয়ে যেতে পারবেন।
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a 
                    href="https://console.firebase.google.com/project/annular-coda-jmn89/firestore/databases/ai-studio-dimeraroth1-152fef0d-fb57-408e-95b1-63f8b82ba46d/data?openUpgradeDialog=true" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-black px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition active:scale-95 inline-flex items-center gap-1"
                  >
                    🚀 ডাটাবেজ লিমিট বৃদ্ধি করুন
                  </a>
                  <a 
                    href="https://firebase.google.com/pricing#cloud-firestore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:underline"
                  >
                    কোটা বিস্তারিত জানুন
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setHasQuotaError(false)}
              className="absolute right-2 top-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-rose-700 dark:text-rose-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Firestore Offline Friendly Info Banner */}
        {hasOfflineNotice && !hasQuotaError && (
          <div
            id="firestore-offline-banner"
            className="mx-2 mt-1.5 p-3 rounded-2xl bg-indigo-50 text-indigo-950 border border-indigo-200 dark:bg-slate-900/90 dark:text-indigo-200 dark:border-indigo-950/60 shadow-md space-y-1.5 animate-in slide-in-from-top-2 relative"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">📶</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black leading-tight">ডাটাবেজ অফলাইন মোড চালু (Offline Mode Active)</h4>
                <p className="text-[11px] leading-relaxed opacity-90">
                  ক্লাউড ডাটাবেজের সাথে সংযোগ সাময়িক বিচ্ছিন্ন হয়েছে। তবে চিন্তার কিছু নেই! আপনার আড়তের সকল হিসাব লোকাল স্টোরেজে <b>১০০% সুরক্ষিত (Saved Locally)</b> রয়েছে। আপনি ইন্টারনেট ছাড়াই অ্যাপ্লিকেশনে নতুন মেমো, হিসাব ও পেমেন্ট রেকর্ড করতে পারবেন। সংযোগ পুনরায় সচল হলে এটি স্বয়ংক্রিয়ভাবে ক্লাউডে ব্যাকআপ হয়ে যাবে।
                </p>
              </div>
            </div>
            <button
              onClick={() => setHasOfflineNotice(false)}
              className="absolute right-2 top-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-indigo-700 dark:text-indigo-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area - instant, zero-delay rendering */}
        <main className="flex-1 p-1 sm:p-1.5">
          {activeTab === 'dashboard' && (
            <DashboardView
              shopProfile={shopProfile}
              baseRate={baseRate}
              memos={memos}
              chalans={supplierChalans}
              parties={parties}
              suppliers={suppliers}
              useBengali={useBengali}
              onOpenNewMemo={(date) => {
                setNewMemoInitialDate(date);
                setSelectedPartyForNewMemo(null);
                setIsNewMemoModalOpen(true);
              }}
              onOpenNewChalan={(date) => {
                setNewChalanInitialDate(date);
                setSelectedSupplierForNewChalan(null);
                setIsNewChalanModalOpen(true);
              }}
              onViewMemoVoucher={(memo) => setActiveVoucherMemo(memo)}
              onViewChalanVoucher={(chalan) => setActiveChalanVoucher(chalan)}
              onSelectParty={(party) => {
                setSelectedPartyForNewMemo(party);
                setIsNewMemoModalOpen(true);
              }}
              onGoToPartiesTab={() => {
                setActiveTab('khata');
                setKhataSubTab('parties');
              }}
              onGoToMemosTab={() => setActiveTab('memos')}
              onGoToSuppliersTab={() => {
                setActiveTab('khata');
                setKhataSubTab('suppliers');
              }}
              onOpenRateSettings={() => setActiveTab('settings')}
              onOpenShareModal={(memo) => setActiveShareMemo(memo)}
              onDeleteMemo={handleDeleteMemo}
              onDeleteChalan={handleDeleteChalan}
              onOpenPartyDetails={(party) => setViewingPartyDetails(party)}
              onOpenSupplierDetails={(supplier) => setViewingSupplierDetails(supplier)}
            />
          )}


            {(activeTab === 'khata' || activeTab === 'parties' || activeTab === 'suppliers') && (
              <UnifiedKhataView
                currentSubTab={khataSubTab}
                onSubTabChange={(sub) => setKhataSubTab(sub)}
                parties={parties}
                memos={memos}
                useBengali={useBengali}
                onSelectPartyForSale={(party) => {
                  setSelectedPartyForNewMemo(party);
                  setIsNewMemoModalOpen(true);
                }}
                onOpenPaymentModal={(party) => setPaymentModalParty(party)}
                onAddParty={handleAddParty}
                onDeleteParty={handleDeleteParty}
                onViewMemoVoucher={(memo) => setActiveVoucherMemo(memo)}
                onOpenPartyDetails={(party) => setViewingPartyDetails(party)}
                onUpdateParty={handleUpdateParty}
                suppliers={suppliers}
                chalans={supplierChalans}
                payments={supplierPayments}
                baseRate={baseRate}
                shopProfile={shopProfile}
                onSelectSupplierForChalan={(sup) => {
                  setSelectedSupplierForNewChalan(sup);
                  setIsNewChalanModalOpen(true);
                }}
                onViewChalanVoucher={(chalan) => setActiveChalanVoucher(chalan)}
                onOpenSupplierDetails={(sup) => setViewingSupplierDetails(sup)}
                onAddSupplier={handleAddSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onAddChalan={handleAddSupplierChalan}
                onDeleteChalan={handleDeleteChalan}
                onAddSupplierPayment={handleAddSupplierPayment}
              />
            )}

            {activeTab === 'memos' && (
              <AllMemosView
                memos={memos}
                parties={parties}
                chalans={supplierChalans}
                suppliers={suppliers}
                useBengali={useBengali}
                onViewMemoVoucher={(memo) => setActiveVoucherMemo(memo)}
                onViewChalanVoucher={(chalan) => setActiveChalanVoucher(chalan)}
                onDeleteMemo={handleDeleteMemo}
                onDeleteChalan={handleDeleteChalan}
                onOpenNewMemo={() => {
                  setNewMemoInitialDate(undefined);
                  setSelectedPartyForNewMemo(null);
                  setIsNewMemoModalOpen(true);
                }}
                onOpenNewChalan={() => {
                  setNewChalanInitialDate(undefined);
                  setSelectedSupplierForNewChalan(null);
                  setIsNewChalanModalOpen(true);
                }}
                onOpenShareModal={(memo) => setActiveShareMemo(memo)}
                onOpenPartyDetails={(party) => setViewingPartyDetails(party)}
                onOpenSupplierDetails={(supplier) => setViewingSupplierDetails(supplier)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                baseRate={baseRate}
                shopProfile={shopProfile}
                useBengali={useBengali}
                darkMode={darkMode}
                authUser={authUser}
                onUpdateBaseRate={(updatedRate) => setBaseRate(updatedRate)}
                onUpdateShopProfile={(updatedProfile) => setShopProfile(updatedProfile)}
                onToggleBengaliNumerals={() => setUseBengali(!useBengali)}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetData={handleResetData}
                isRefreshingCloud={isRefreshingCloud}
                onRefreshCloud={handleManualCloudRefresh}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onLogout={handleLogout}
                onOpenCloudBackup={() => setIsCloudBackupModalOpen(true)}
              />
            )}
        </main>

        {/* Offline Connectivity Notification Banner */}
        <OfflineIndicator />

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          onOpenNewSale={() => {
            setNewMemoInitialDate(undefined);
            setSelectedPartyForNewMemo(null);
            setIsNewMemoModalOpen(true);
          }}
          hasDueNotification={hasDueNotification}
        />


        {/* New Sale Memo Modal */}
        {isNewMemoModalOpen && (
          <NewMemoModal
            isOpen={isNewMemoModalOpen}
            parties={parties}
            memos={memos}
            baseRate={baseRate}
            useBengali={useBengali}
            initialSelectedParty={selectedPartyForNewMemo}
            initialDate={newMemoInitialDate}
            onClose={() => {
              setIsNewMemoModalOpen(false);
              setSelectedPartyForNewMemo(null);
              setNewMemoInitialDate(undefined);
            }}
            onSaveMemo={handleSaveMemo}
          />
        )}

        {/* Memo Voucher Slip Modal (Print / Image Download / All Share) */}
        {activeVoucherMemo && (
          <MemoVoucherModal
            memo={activeVoucherMemo}
            shopProfile={shopProfile}
            useBengali={useBengali}
            onClose={() => setActiveVoucherMemo(null)}
            onOpenAllShare={(memo) => setActiveShareMemo(memo)}
            onDeleteMemo={handleDeleteMemo}
          />
        )}

        {/* New Mahajan Chalan Modal (নতুন মেমোর মতো রিচ চালান তৈরি) */}
        {isNewChalanModalOpen && (
          <NewChalanModal
            isOpen={isNewChalanModalOpen}
            suppliers={suppliers}
            chalans={supplierChalans}
            baseRate={baseRate}
            shopProfile={shopProfile}
            useBengali={useBengali}
            initialSelectedSupplier={selectedSupplierForNewChalan}
            initialDate={newChalanInitialDate}
            onClose={() => {
              setIsNewChalanModalOpen(false);
              setSelectedSupplierForNewChalan(null);
              setNewChalanInitialDate(undefined);
            }}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onSaveChalan={(chalan) => {
              handleAddSupplierChalan(chalan);
              syncSupplierChalanToFirebase(chalan).catch(() => {});
              setIsNewChalanModalOpen(false);
              setActiveChalanVoucher(chalan);
            }}
          />
        )}

        {/* Mahajan Chalan Voucher Slip Modal (ছবি ডাউনলোড, শেয়ার ও প্রিন্ট) */}
        {activeChalanVoucher && (
          <ChalanVoucherModal
            chalan={activeChalanVoucher}
            shopProfile={shopProfile}
            useBengali={useBengali}
            onClose={() => setActiveChalanVoucher(null)}
          />
        )}

        {/* Payment Collection Modal */}
        {paymentModalParty && (
          <PaymentModal
            party={paymentModalParty}
            isOpen={!!paymentModalParty}
            useBengali={useBengali}
            onClose={() => setPaymentModalParty(null)}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {/* All Share Modal (WhatsApp, SMS, Image Download, All Apps, Copy) */}
        {activeShareMemo && (
          <ShareModal
            isOpen={!!activeShareMemo}
            memo={activeShareMemo}
            shopProfile={shopProfile}
            useBengali={useBengali}
            onClose={() => setActiveShareMemo(null)}
            onViewVoucher={(memo) => {
              setActiveShareMemo(null);
              setActiveVoucherMemo(memo);
            }}
            onDownloadImage={(memo) => {
              setActiveShareMemo(null);
              setActiveVoucherMemo(memo);
            }}
          />
        )}

        {/* Mobile Number & Google Login Modal */}
        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            currentUser={authUser}
            shopProfile={shopProfile}
            baseRate={baseRate}
            parties={parties}
            memos={memos}
            useBengali={useBengali}
            onClose={() => setIsLoginModalOpen(false)}
            onLogin={handleLoginSuccess}
            onLogout={handleLogout}
            onRestoreData={handleRestoreCloudData}
          />
        )}

        {/* Online Cloud Backup & Restore Modal */}
        {isCloudBackupModalOpen && (
          <CloudBackupModal
            isOpen={isCloudBackupModalOpen}
            shopProfile={shopProfile}
            baseRate={baseRate}
            parties={parties}
            memos={memos}
            useBengali={useBengali}
            onClose={() => setIsCloudBackupModalOpen(false)}
            onRestoreData={handleRestoreCloudData}
          />
        )}

        {/* Party Details & All Memos Modal */}
        {viewingPartyDetails && (
          <PartyDetailsModal
            party={viewingPartyDetails}
            memos={memos}
            useBengali={useBengali}
            onClose={() => setViewingPartyDetails(null)}
            onOpenNewMemoForParty={(party) => {
              setSelectedPartyForNewMemo(party);
              setIsNewMemoModalOpen(true);
            }}
            onOpenPaymentModal={(party) => {
              setPaymentModalParty(party);
            }}
            onViewMemoVoucher={(memo) => {
              setActiveVoucherMemo(memo);
            }}
            onOpenShareModal={(memo) => {
              setActiveShareMemo(memo);
            }}
            onDeleteParty={handleDeleteParty}
            onDeleteMemo={handleDeleteMemo}
            onUpdateParty={handleUpdateParty}
          />
        )}

        {/* Supplier Details & Ledger Modal */}
        {viewingSupplierDetails && (
          <SupplierDetailsModal
            supplier={viewingSupplierDetails}
            chalans={supplierChalans.filter((c) => c.supplierId === viewingSupplierDetails.id || (c.supplierName && viewingSupplierDetails.name && c.supplierName.trim().toLowerCase() === viewingSupplierDetails.name.trim().toLowerCase()))}
            payments={supplierPayments.filter((p) => p.supplierId === viewingSupplierDetails.id || (p.supplierName && viewingSupplierDetails.name && p.supplierName.trim().toLowerCase() === viewingSupplierDetails.name.trim().toLowerCase()))}
            shopProfile={shopProfile}
            useBengali={useBengali}
            onClose={() => setViewingSupplierDetails(null)}
            onOpenNewChalanForSupplier={(sup) => {
              setSelectedSupplierForNewChalan(sup);
              setIsNewChalanModalOpen(true);
            }}
            onOpenPaymentModal={() => {}}
            onViewChalanVoucher={(chalan) => {
              setActiveChalanVoucher(chalan);
            }}
            onDeleteSupplier={handleDeleteSupplier}
            onDeleteChalan={handleDeleteChalan}
            onUpdateSupplier={handleUpdateSupplier}
          />
        )}
      </div>
    </div>
  );
}
