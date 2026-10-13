import React from 'react';
import { Memo, Party, Supplier, SupplierChalan, SupplierPayment, BaseRate, ShopProfile } from '../types';
import { PartiesView } from './PartiesView';
import { SuppliersView } from './SuppliersView';
import { toBengaliNumber } from '../utils/bengaliUtils';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { hapticLight } from '../utils/haptics';

export type KhataSubTab = 'parties' | 'suppliers';

interface UnifiedKhataViewProps {
  currentSubTab: KhataSubTab;
  onSubTabChange: (tab: KhataSubTab) => void;
  // Parties Props
  parties: Party[];
  memos: Memo[];
  useBengali: boolean;
  onSelectPartyForSale: (party: Party) => void;
  onOpenPaymentModal: (party: Party) => void;
  onAddParty: (party: Omit<Party, 'id' | 'createdAt'>) => void;
  onDeleteParty: (partyId: string) => void;
  onViewMemoVoucher: (memo: Memo) => void;
  onOpenPartyDetails: (party: Party) => void;
  onUpdateParty?: (partyId: string, updatedFields: Partial<Omit<Party, 'id' | 'createdAt'>>) => void;
  // Suppliers Props
  suppliers: Supplier[];
  chalans: SupplierChalan[];
  payments: SupplierPayment[];
  baseRate: BaseRate;
  shopProfile?: ShopProfile;
  onSelectSupplierForChalan?: (supplier: Supplier) => void;
  onOpenSupplierPaymentModal?: (supplier: Supplier) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onUpdateSupplier?: (supplierId: string, updatedFields: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
  onAddChalan: (chalan: SupplierChalan) => void;
  onDeleteChalan?: (chalanId: string) => void;
  onAddSupplierPayment: (payment: SupplierPayment) => void;
  onViewChalanVoucher?: (chalan: SupplierChalan) => void;
  onOpenSupplierDetails?: (supplier: Supplier) => void;
}

export const UnifiedKhataView: React.FC<UnifiedKhataViewProps> = ({
  currentSubTab,
  onSubTabChange,
  parties,
  memos,
  useBengali,
  onSelectPartyForSale,
  onOpenPaymentModal,
  onAddParty,
  onDeleteParty,
  onViewMemoVoucher,
  onOpenPartyDetails,
  onUpdateParty,
  suppliers,
  chalans,
  payments,
  baseRate,
  shopProfile,
  onSelectSupplierForChalan,
  onOpenSupplierPaymentModal,
  onAddSupplier,
  onDeleteSupplier,
  onUpdateSupplier,
  onAddChalan,
  onDeleteChalan,
  onAddSupplierPayment,
  onViewChalanVoucher,
  onOpenSupplierDetails,
}) => {
  // Financial computations
  const totalPartyDue = parties.reduce((sum, p) => sum + (p.currentDue || 0), 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);

  return (
    <div id="unified-khata-view-container" className="space-y-2.5">
      {/* 1. Primary Switch Tabs - Glass-Card Segmented Control */}
      <div 
        id="unified-khata-switcher"
        className="glass-card rounded-2xl p-1.5 shadow-md border"
      >
        <div className="grid grid-cols-2 gap-1.5 p-1 soft-inset rounded-xl">
          {/* Party Khata Tab Button */}
          <button
            type="button"
            id="tab-btn-parties-khata"
            onClick={() => {
              hapticLight();
              onSubTabChange('parties');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 active:scale-[0.98] tactile-tap ${
              currentSubTab === 'parties'
                ? 'soft-btn-primary font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-bold'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${currentSubTab === 'parties' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
              <PeopleAltRoundedIcon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1.5">
                <span>পার্টি খাতা</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentSubTab === 'parties' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-black/10 dark:bg-white/15 text-slate-700 dark:text-slate-300'
                }`}>
                  {toBengaliNumber(parties.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate tabular-nums ${currentSubTab === 'parties' ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                পাওনা: ৳{toBengaliNumber(totalPartyDue, useBengali)}
              </div>
            </div>
          </button>

          {/* Supplier Khata Tab Button */}
          <button
            type="button"
            id="tab-btn-suppliers-khata"
            onClick={() => {
              hapticLight();
              onSubTabChange('suppliers');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 active:scale-[0.98] tactile-tap ${
              currentSubTab === 'suppliers'
                ? 'soft-btn-purple font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-bold'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${currentSubTab === 'suppliers' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
              <LocalShippingRoundedIcon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1.5">
                <span>মহাজন খাতা</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentSubTab === 'suppliers' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-black/10 dark:bg-white/15 text-slate-700 dark:text-slate-300'
                }`}>
                  {toBengaliNumber(suppliers.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate tabular-nums ${currentSubTab === 'suppliers' ? 'text-rose-200' : 'text-slate-600 dark:text-slate-300'}`}>
                দেনা: ৳{toBengaliNumber(totalSupplierDue, useBengali)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Active View: Parties or Suppliers */}
      <div id="unified-khata-active-content">
        {currentSubTab === 'parties' ? (
          <PartiesView
            parties={parties}
            memos={memos}
            useBengali={useBengali}
            onSelectPartyForSale={onSelectPartyForSale}
            onOpenPaymentModal={onOpenPaymentModal}
            onAddParty={onAddParty}
            onDeleteParty={onDeleteParty}
            onViewMemoVoucher={onViewMemoVoucher}
            onOpenPartyDetails={onOpenPartyDetails}
          />
        ) : (
          <SuppliersView
            suppliers={suppliers}
            chalans={chalans}
            payments={payments}
            useBengali={useBengali}
            onSelectSupplierForChalan={onSelectSupplierForChalan || (() => {})}
            onOpenPaymentModal={onOpenSupplierPaymentModal}
            onAddSupplier={(sup) => onAddSupplier({
              ...sup,
              id: `sup-${Date.now()}`,
              createdAt: new Date().toISOString(),
            })}
            onDeleteSupplier={onDeleteSupplier}
            onUpdateSupplier={onUpdateSupplier}
            onViewChalanVoucher={onViewChalanVoucher || (() => {})}
            onOpenSupplierDetails={onOpenSupplierDetails || (() => {})}
            onAddSupplierPayment={onAddSupplierPayment}
          />
        )}
      </div>
    </div>
  );
};
