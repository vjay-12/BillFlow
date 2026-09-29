import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Edit2, 
  Users 
} from 'lucide-react';
import { db } from '../../db/schema';
import { useUIStore } from '../../stores/uiStore';
import { formatDate } from '../../lib/formatters';
import type { Customer } from '../../types';

export const CustomerList: React.FC = () => {
  const { setIsCustomerFormModalOpen, setEditingCustomer } = useUIStore();
  const [search, setSearch] = useState('');

  const customers = useLiveQuery(async () => {
    let all = await db.customers.toArray();
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(search));
  }, [search]);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsCustomerFormModalOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setIsCustomerFormModalOpen(true);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#2E2119] p-4 rounded-2xl border border-slate-200 dark:border-[#3D2C20] shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-[#F5F0E6] tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#B8A990]">
            Track customer contact details and loyalty points reward balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#2E2119] p-3 rounded-2xl border border-slate-200 dark:border-[#3D2C20] flex items-center justify-between gap-2">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-[#271C15] text-slate-800 dark:text-[#F5F0E6] rounded-xl border border-slate-200 dark:border-[#3D2C20] focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
          />
        </div>

        <span className="text-xs text-slate-400 dark:text-[#B8A990] font-semibold shrink-0">
          {customers?.length || 0} registered
        </span>
      </div>

      {/* Customer Cards Grid - Compact redesign */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {customers && customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#2E2119] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-[#3D2C20] shadow-xs hover:border-teal-500/50 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Line 1: Name + Loyalty Points directly next to each other on the same line */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-[#F5F0E6] leading-tight truncate" title={c.name}>
                      {c.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50 shrink-0">
                      <span>⭐</span>
                      <span>{c.loyaltyPoints || 0} pts</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] hover:bg-slate-100 dark:hover:bg-[#38291F] transition cursor-pointer shrink-0"
                    title={`Edit ${c.name}`}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line 2: Phone number below name */}
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#B8A990] text-xs mt-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono font-medium">{c.phone}</span>
                </div>
              </div>

              {/* Line 3: Footer date with consistent padding */}
              <div className="pt-2 mt-2.5 border-t border-slate-100 dark:border-[#3D2C20] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#B8A990]">
                <span>Joined {formatDate(c.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-[#2E2119] rounded-2xl border border-slate-200 dark:border-[#3D2C20]">
            <Users className="w-12 h-12 stroke-[1.2] text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 dark:text-[#F5F0E6]">No customers found</p>
            <p className="text-xs text-slate-400 dark:text-[#B8A990] mt-1">
              Add customers to track repeat orders and loyalty rewards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
