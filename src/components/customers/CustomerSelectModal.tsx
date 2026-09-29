import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, UserPlus, X, Phone, Check } from 'lucide-react';
import { db } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import type { Customer } from '../../types';

interface CustomerSelectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const setCustomer = useCartStore((s) => s.setCustomer);
  const currentCustomer = useCartStore((s) => s.customer);
  const { 
    isCustomerSelectModalOpen, 
    setIsCustomerSelectModalOpen, 
    setIsCustomerFormModalOpen, 
    setEditingCustomer 
  } = useUIStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isCustomerSelectModalOpen;
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    }
    setIsCustomerSelectModalOpen(false);
  };

  const customers = useLiveQuery(
    async () => {
      const all = await db.customers.toArray();
      if (!search.trim()) return all;
      const lower = search.toLowerCase();
      return all.filter(
        (c) => c.name.toLowerCase().includes(lower) || c.phone.includes(search)
      );
    },
    [search]
  );

  if (!isOpen) return null;

  const handleSelect = (customer: Customer) => {
    setCustomer(customer);
    handleClose();
  };

  const handleAddNew = () => {
    handleClose();
    setEditingCustomer(null);
    setIsCustomerFormModalOpen(true);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-[#2E2119] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-[#3D2C20] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-[#3D2C20] flex items-center justify-between bg-slate-50/70 dark:bg-[#271C15]">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-[#F5F0E6] text-base">{t('customers.selectCustomerTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-[#B8A990]">{t('customers.selectCustomerSubtitle')}</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] hover:bg-slate-200 dark:hover:bg-[#38291F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Add New */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-[#3D2C20] flex items-center gap-2 bg-white dark:bg-[#2E2119]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder={t('customers.searchSelectPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-[#271C15] text-slate-800 dark:text-[#F5F0E6] rounded-xl border border-slate-200 dark:border-[#3D2C20] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712] transition"
            />
          </div>
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-[#14A89B] hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800/50 transition shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('customers.new')}</span>
          </button>
        </div>

        {/* Customer List - Scrollable */}
        <div className="overflow-y-auto flex-1 min-h-0 p-2 sm:p-3 space-y-1 divide-y divide-slate-100 dark:divide-[#3D2C20]">
          {customers && customers.length > 0 ? (
            customers.map((c) => {
              const isSelected = currentCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-2.5 sm:p-3 rounded-xl cursor-pointer flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700/80'
                      : 'hover:bg-slate-50 dark:hover:bg-[#38291F] border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-[#F5F0E6] truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#B8A990] mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isSelected ? (
                      <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> {t('customers.attached')}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-teal-700 dark:text-[#14A89B] hover:underline">
                        {t('customers.select')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400 dark:text-[#B8A990] text-xs">
              {t('customers.noCustomersClickNew')}
            </div>
          )}
        </div>

        {/* Clear Customer Footer */}
        {currentCustomer && (
          <div className="p-3 border-t border-slate-100 dark:border-[#3D2C20] bg-slate-50/70 dark:bg-[#271C15] flex justify-end">
            <button
              type="button"
              onClick={() => {
                setCustomer(null);
                handleClose();
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              {t('customers.detachCurrentCustomer')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
