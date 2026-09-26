import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../lib/formatters';
import { Plus, Minus, Flame, Leaf, PackageX } from 'lucide-react';

export const ItemGrid: React.FC = () => {
  const { searchQuery, selectedCategory, setSelectedCategory } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const cartLines = useCartStore((s) => s.lines);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const items = useLiveQuery(() => db.items.filter((i) => i.active).toArray(), []);

  // Compute available categories matching user preference: Tiffin, Lunch, Snacks, Special, Sweets
  const categories = useMemo(() => {
    const preferred = ['All', 'Tiffin', 'Lunch', 'Snacks', 'Special', 'Sweets'];
    if (!items) return preferred;
    const cats = Array.from(new Set(items.map((i) => i.category)));
    cats.forEach((c) => {
      if (!preferred.includes(c)) preferred.push(c);
    });
    return preferred;
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      // Category match
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Diet match
      if (dietFilter === 'veg' && item.isVeg !== true) return false;
      if (dietFilter === 'non-veg' && item.isVeg === true) return false;
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesCategory;
      }
      return true;
    });
  }, [items, selectedCategory, dietFilter, searchQuery]);

  const getItemCartQty = (itemId: string) => {
    const line = cartLines.find((l) => l.itemId === itemId);
    return line ? line.qty : 0;
  };

  const handleCardClick = (item: any) => {
    if (item.price === 0) {
      const entered = prompt(`Set price for "${item.name}" (₹):`, '50');
      if (entered === null) return;
      const parsed = parseFloat(entered);
      const customPrice = isNaN(parsed) ? 0 : parsed;
      addItem({ ...item, price: customPrice });
    } else {
      addItem(item);
    }
  };

  return (
    <div className="flex flex-col w-full lg:h-full lg:overflow-hidden bg-slate-50">
      {/* Filters Bar: Categories & Diet Filters */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0 sticky top-0 z-10 shadow-2xs">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none min-w-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Diet & Quick Toggle */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setDietFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                dietFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Diet
            </button>
            <button
              onClick={() => setDietFilter('veg')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <Leaf className="w-3 h-3" />
              100% Veg
            </button>
            <button
              onClick={() => setDietFilter('non-veg')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                dietFilter === 'non-veg'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              <Flame className="w-3 h-3" />
              Non-Veg
            </button>
          </div>

          <div className="text-slate-400 font-medium text-[11px]">
            {filteredItems.length} items
          </div>
        </div>
      </div>

      {/* Item Grid - Tappable 2-column cards on mobile, 3-5 columns on desktop */}
      <div className={`p-3 lg:flex-1 lg:overflow-y-auto ${cartLines.length > 0 ? 'pb-32' : 'pb-16'} lg:pb-3`}>
        {filteredItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <PackageX className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No items match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting another category or clearing search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredItems.map((item) => {
              const inCartQty = getItemCartQty(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative bg-white rounded-2xl p-2.5 sm:p-3 border transition-all duration-150 flex flex-col justify-between select-none cursor-pointer active:scale-[0.98] ${
                    inCartQty > 0
                      ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md hover:border-teal-700'
                      : 'border-slate-200 hover:border-teal-500 hover:shadow-md'
                  }`}
                >
                  {/* Top Bar inside Card: Veg icon + SKU + Cart count */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    {/* Food veg icon */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                          item.isVeg
                            ? 'border-emerald-600'
                            : 'border-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                        {item.code}
                      </span>
                    </div>

                    {/* In-cart badge */}
                    {inCartQty > 0 && (
                      <span className="bg-teal-700 text-white text-[10px] sm:text-[11px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs animate-in zoom-in-50 duration-150">
                        {inCartQty} in bill
                      </span>
                    )}
                  </div>

                  {/* Item Name & Category */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-teal-700 transition">
                        {item.name}
                      </h4>
                      {item.name === 'Veg Omlet' && (
                        <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" title="Egg substitute. Flagged for owner confirmation.">
                          Confirm
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.category}
                    </span>
                  </div>

                  {/* Bottom: Price / Stepper or Add Button */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                    <div className="min-w-0 flex-1">
                      {item.price === 0 ? (
                        <span className="inline-block text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Set price
                        </span>
                      ) : (
                        <div className="font-extrabold text-xs sm:text-base text-slate-900 font-mono tracking-tight">
                          {formatCurrency(item.price)}
                        </div>
                      )}
                    </div>

                    {inCartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center bg-teal-700 text-white rounded-full p-0.5 shadow-xs shrink-0 select-none"
                      >
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            decrementQty(item.id);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-teal-100 hover:bg-teal-800 hover:text-white active:scale-90 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="min-w-[18px] sm:min-w-[22px] px-0.5 text-center font-extrabold font-mono text-xs text-white">
                          {inCartQty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.price === 0) {
                              handleCardClick(item);
                            } else {
                              incrementQty(item.id);
                            }
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-teal-100 hover:bg-teal-800 hover:text-white active:scale-90 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Add ${item.name} to bill`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(item);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-teal-700 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
