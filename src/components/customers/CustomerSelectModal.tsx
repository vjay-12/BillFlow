import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, UserPlus, X, Phone, Check } from 'lucide-react';
import { db } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import type { Customer } from '../../types';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const setCustomer = useCartStore((s) => s.setCustomer);
  const currentCustomer = useCartStore((s) => s.customer);
  const { setIsCustomerFormModalOpen, setEditingCustomer } = useUIStore();

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
    onClose();
  };

  const handleAddNew = () => {
    onClose();
    setEditingCustomer(null);
    setIsCustomerFormModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Select Customer</h3>
            <p className="text-xs text-slate-500">Link customer to this bill for loyalty rewards</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Add New */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold border border-teal-200 transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Customer List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1.5 divide-y divide-slate-100 dark:divide-[#3D2C20]">
          {customers && customers.length > 0 ? (
            customers.map((c) => {
              const isSelected = currentCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-teal-50/80 border border-teal-300'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{c.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        <span>⭐</span>
                        <span>{c.loyaltyPoints} pts</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSelected ? (
                      <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Attached
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No customers found. Click <strong>+ New</strong> to register one.
            </div>
          )}
        </div>

        {/* Clear Customer */}
        {currentCustomer && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={() => {
                setCustomer(null);
                onClose();
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5"
            >
              Detach Current Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
