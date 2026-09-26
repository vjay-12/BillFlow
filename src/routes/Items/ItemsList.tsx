import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Search, 
  Edit2, 
  Archive, 
  RotateCcw, 
  Package 
} from 'lucide-react';
import { db } from '../../db/schema';
import { itemsRepo } from '../../db/itemsRepo';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../lib/formatters';
import type { Item } from '../../types';

export const ItemsList: React.FC = () => {
  const { setIsItemFormModalOpen, setEditingItem } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [showArchived, setShowArchived] = useState(false);

  const items = useLiveQuery(async () => {
    let query = db.items.toCollection();
    let all = await query.toArray();

    return all.filter((i) => {
      if (!showArchived && !i.active) return false;
      if (showArchived && i.active) return false;
      if (selectedCat !== 'All' && i.category !== selectedCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, selectedCat, showArchived]);

  const allItemsForCategories = useLiveQuery(() => db.items.toArray(), []);
  const categories = useMemo(() => {
    const preferred = ['All', 'Tiffin', 'Lunch', 'Snacks', 'Special', 'Sweets'];
    if (!allItemsForCategories) return preferred;
    const catsInDb = Array.from(new Set(allItemsForCategories.map((i) => i.category)));
    catsInDb.forEach((c) => {
      if (!preferred.includes(c)) preferred.push(c);
    });
    return preferred;
  }, [allItemsForCategories]);

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsItemFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsItemFormModalOpen(true);
  };

  const handleToggleArchive = async (item: Item) => {
    await itemsRepo.toggleActive(item.id, item.active);
  };

  return (
    <div className="flex-1 px-4 py-3 md:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Menu Catalog
          </h2>
          <p className="text-xs text-slate-500">
            Manage your menu items and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showArchived
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {showArchived ? 'Showing Archived' : 'View Archived'}
          </button>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
        {/* Horizontally scrollable category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none w-full sm:w-auto min-w-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                selectedCat === cat
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Items Container */}
      {items && items.length > 0 ? (
        <>
          {/* MOBILE VIEW: Single-column stacked row layout (no horizontal scroll) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-[#3D2C20] bg-white rounded-2xl border border-slate-200 dark:border-[#3D2C20] shadow-xs overflow-hidden">
            {items.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 hover:bg-slate-50/70 transition flex flex-col gap-1"
              >
                {/* Line 1: Item name (bold) + veg/non-veg dot icon, with price aligned to the right on the same line */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <span className="font-bold text-slate-900 text-sm leading-snug break-words">
                      {item.name}
                    </span>
                  </div>

                  <div className="shrink-0 text-right font-mono font-extrabold text-slate-900 text-sm">
                    {item.price === 0 ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Set price
                      </span>
                    ) : (
                      formatCurrency(item.price)
                    )}
                  </div>
                </div>

                {/* Line 2: Directly under the item name: the SKU/code, in small muted gray text */}
                <div className="pl-[22px] -mt-0.5">
                  <span className="font-mono uppercase text-slate-400 text-xs font-semibold">
                    {item.code}
                  </span>
                </div>

                {/* Line 3: Category tag as small pill/chip & Vegetarian label, with Edit/Archive action buttons */}
                <div className="pl-[22px] flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 text-[10px] font-bold">
                      {item.category}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {item.isVeg ? 'Vegetarian' : 'Non-Veg'}
                    </span>
                  </div>

                  {/* Actions: Edit & Archive */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      aria-label="Edit Item"
                      title="Edit Item"
                      className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(item)}
                      aria-label={item.active ? 'Archive Item' : 'Restore Item'}
                      title={item.active ? 'Archive Item' : 'Restore Item'}
                      className={`p-1.5 rounded-lg transition ${
                        item.active
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200'
                      }`}
                    >
                      {item.active ? (
                        <Archive className="w-3.5 h-3.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP/TABLET VIEW: Structured table without stock/tax columns */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#3D2C20] font-medium text-slate-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                              item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.isVeg ? 'Vegetarian' : 'Non-Veg'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 text-[11px] font-semibold">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono uppercase text-slate-500 font-semibold">
                        {item.code}
                      </td>

                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                        {item.price === 0 ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Set price
                          </span>
                        ) : (
                          formatCurrency(item.price)
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(item)}
                            title={item.active ? 'Archive Item' : 'Restore Item'}
                            className={`p-1.5 rounded-lg transition ${
                              item.active
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {item.active ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 stroke-[1.2] text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600">No items in this filter</p>
          <p className="text-xs text-slate-400 mt-1">
            Add new dishes using the "Add Item" button above.
          </p>
        </div>
      )}

    </div>
  );
};
