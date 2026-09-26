import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Award, 
  Wallet, 
  Edit2, 
  Users, 
  CreditCard
} from 'lucide-react';
import { db } from '../../db/schema';
import { customersRepo } from '../../db/customersRepo';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDate } from '../../lib/formatters';
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

  const handleConfirmSettle = async (c: Customer) => {
    const input = prompt(`Enter amount to settle for ${c.name} (Current due: ₹${c.outstanding}):`, c.outstanding.toString());
    if (!input) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    await customersRepo.settleOutstanding(c.id, amount);
    alert(`Settled ₹${amount} for ${c.name}.`);
  };

  const totalOutstanding = customers
    ? customers.reduce((sum, c) => sum + (c.outstanding || 0), 0)
    : 0;

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Customer Directory & Khata
          </h2>
          <p className="text-xs text-slate-500">
            Track customer contact details, loyalty points reward balances, and outstanding credits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Outstanding Total Tag */}
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-800 hidden sm:block">
            Total Dues: <span className="font-mono">{formatCurrency(totalOutstanding)}</span>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          {customers?.length || 0} registered
        </span>
      </div>

      {/* Customer Cards Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {customers && customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-teal-500/50 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(c)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badges for Loyalty & Due */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="bg-amber-50 border border-amber-200/80 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-amber-700 font-bold block uppercase flex items-center justify-center gap-1">
                      <Award className="w-3 h-3" /> Loyalty Points
                    </span>
                    <span className="font-extrabold font-mono text-amber-900 text-sm">
                      {c.loyaltyPoints} pts
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl text-center border ${
                      c.outstanding > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="text-[10px] font-bold block uppercase flex items-center justify-center gap-1">
                      <Wallet className="w-3 h-3" /> Due Balance
                    </span>
                    <span className="font-extrabold font-mono text-sm">
                      {c.outstanding > 0 ? formatCurrency(c.outstanding) : 'Nil'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Joined {formatDate(c.createdAt)}</span>

                {c.outstanding > 0 && (
                  <button
                    onClick={() => handleConfirmSettle(c)}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg border border-teal-200 transition flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3 text-teal-600" />
                    <span>Settle Dues</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Users className="w-12 h-12 stroke-[1.2] text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add customers to track repeat orders, points, and credit accounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
