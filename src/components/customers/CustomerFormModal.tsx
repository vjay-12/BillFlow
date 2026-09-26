import { useState, useEffect } from 'react';
import { X, Save, User, Phone, Wallet } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { customersRepo } from '../../db/customersRepo';
import type { Customer } from '../../types';

export const CustomerFormModal: React.FC = () => {
  const { isCustomerFormModalOpen, setIsCustomerFormModalOpen, editingCustomer, setEditingCustomer } = useUIStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [outstanding, setOutstanding] = useState<number>(0);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setOutstanding(editingCustomer.outstanding);
    } else {
      setName('');
      setPhone('');
      setOutstanding(0);
    }
  }, [editingCustomer, isCustomerFormModalOpen]);

  if (!isCustomerFormModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a customer name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    try {
      if (editingCustomer) {
        await customersRepo.update(editingCustomer.id, {
          name,
          phone,
          outstanding: Number(outstanding),
        });
      } else {
        const newCust: Customer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          phone,
          outstanding: Number(outstanding),
          loyaltyPoints: 0,
          createdAt: Date.now(),
        };
        await customersRepo.create(newCust);
      }

      setIsCustomerFormModalOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      alert(`Error saving customer: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              {editingCustomer ? 'Edit Customer' : 'Register New Customer'}
            </h3>
            <p className="text-xs text-slate-500">
              Manage loyalty points and credit account ledger
            </p>
          </div>
          <button
            onClick={() => setIsCustomerFormModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Initial Outstanding Credit / Due (₹)
            </label>
            <div className="relative">
              <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={outstanding}
                onChange={(e) => setOutstanding(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Enter 0 if the customer has no existing credit dues.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomerFormModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{editingCustomer ? 'Save Changes' : 'Register Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
