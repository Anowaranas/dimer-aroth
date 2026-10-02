import React from 'react';
import { Memo, Party, Supplier, SupplierChalan, SupplierPayment, BaseRate, ShopProfile } from '../types';
import { PartiesView } from './PartiesView';
import { SuppliersView } from './SuppliersView';
import { toBengaliNumber } from '../utils/bengaliUtils';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

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
    <div id="unified-khata-view-container" className="space-y-2">
      {/* 1. Primary Switch Tabs - Clean, Crisp & High-Contrast */}
      <div 
        id="unified-khata-switcher"
        className="bg-slate-900 dark:bg-slate-800 rounded-xl p-1 shadow-xs border border-slate-700/60 text-white"
      >
        {/* 2 Primary Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/25 rounded-lg border border-white/10">
          {/* Party Khata Tab Button */}
          <button
            type="button"
            id="tab-btn-parties-khata"
            onClick={() => onSubTabChange('parties')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 ${
              currentSubTab === 'parties'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-300 hover:bg-white/10 font-bold'
            }`}
          >
            <PeopleIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1">
                <span>পার্টি খাতা</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentSubTab === 'parties' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-white/15 text-slate-300'
                }`}>
                  {toBengaliNumber(parties.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate ${currentSubTab === 'parties' ? 'text-emerald-200' : 'text-slate-300'}`}>
                পাওনা: ৳{toBengaliNumber(totalPartyDue, useBengali)}
              </div>
            </div>
          </button>

          {/* Supplier Khata Tab Button */}
          <button
            type="button"
            id="tab-btn-suppliers-khata"
            onClick={() => onSubTabChange('suppliers')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 ${
              currentSubTab === 'suppliers'
                ? 'bg-indigo-600 text-white font-black shadow-xs'
                : 'text-slate-300 hover:bg-white/10 font-bold'
            }`}
          >
            <LocalShippingIcon className="w-4 h-4" />
            <div className="text-left min-w-0">
              <div className="text-xs leading-tight flex items-center gap-1">
                <span>মহাজন খাতা</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentSubTab === 'suppliers' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-white/15 text-slate-300'
                }`}>
                  {toBengaliNumber(suppliers.length, useBengali)}
                </span>
              </div>
              <div className={`text-[10.5px] leading-tight font-bold mt-0.5 truncate ${currentSubTab === 'suppliers' ? 'text-rose-200' : 'text-slate-300'}`}>
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
