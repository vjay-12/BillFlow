import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, User, Phone } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import { customersRepo } from '../../db/customersRepo';
import type { Customer } from '../../types';

export const CustomerFormModal: React.FC = () => {
  const { t } = useTranslation();
  const { isCustomerFormModalOpen, setIsCustomerFormModalOpen, editingCustomer, setEditingCustomer } = useUIStore();

  const [name, setName] = useState(editingCustomer?.name || '');
  const [phone, setPhone] = useState(editingCustomer?.phone || '');
  const [prevEditing, setPrevEditing] = useState(editingCustomer);

  if (editingCustomer !== prevEditing) {
    setPrevEditing(editingCustomer);
    setName(editingCustomer?.name || '');
    setPhone(editingCustomer?.phone || '');
  }

  if (!isCustomerFormModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('customers.enterNameAlert'));
      return;
    }
    if (!phone.trim()) {
      alert(t('customers.enterPhoneAlert'));
      return;
    }

    try {
      if (editingCustomer) {
        await customersRepo.update(editingCustomer.id, {
          name,
          phone,
        });
      } else {
        const newCust: Customer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          phone,
          outstanding: 0,
          loyaltyPoints: 0,
          createdAt: Date.now(),
        };
        await customersRepo.create(newCust);
        useCartStore.getState().setCustomer(newCust);
      }

      setIsCustomerFormModalOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      alert(t('customers.errorSaving', { message: err.message }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              {editingCustomer ? t('customers.editCustomer') : t('customers.registerNewCustomer')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('customers.formSubtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsCustomerFormModalOpen(false)}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('customers.customerFullName')}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={t('customers.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('customers.phoneNumber')}</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder={t('customers.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomerFormModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              {t('customers.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingCustomer ? t('customers.saveChanges') : t('customers.registerCustomer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
