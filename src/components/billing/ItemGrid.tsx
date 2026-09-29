import { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../lib/formatters';
import { Plus, Minus, Flame, Leaf, PackageX, Search, RotateCcw } from 'lucide-react';
import { useTabletLandscape } from '../../lib/useTabletLandscape';

export const ItemGrid: React.FC = () => {
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useUIStore();
  const isTabletLandscape = useTabletLandscape();
  const addItem = useCartStore((s) => s.addItem);
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const cartLines = useCartStore((s) => s.lines);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Profile settings for non-veg visibility and menu display language
  const profile = useLiveQuery(() => db.businessProfile.get('main'), []);
  const showNonVeg = profile?.showNonVeg !== false;
  const menuLanguage = profile?.menuLanguage || 'English';

  // Robust live query to load all active items reliably across devices
  const allActiveItems = useLiveQuery(async () => {
    const all = await db.items.toArray();
    return all.filter((i) => i.active !== false);
  }, []);

  // Filter out non-veg items if toggle is disabled (never delete data)
  const items = useMemo(() => {
    if (!allActiveItems) return undefined;
    if (showNonVeg) return allActiveItems;
    return allActiveItems.filter((i) => i.isVeg !== false);
  }, [allActiveItems, showNonVeg]);

  // Active diet filter: if non-veg is hidden, 'non-veg' filter naturally resolves to 'all'
  const activeDietFilter = (!showNonVeg && dietFilter === 'non-veg') ? 'all' : dietFilter;

  // Guarantee seed data exists if table is empty
  useEffect(() => {
    if (allActiveItems !== undefined && allActiveItems.length === 0) {
      seedInitialDataIfNeeded();
    }
  }, [allActiveItems]);

  // Compute available categories from actual active visible items
  const categories = useMemo(() => {
    const defaultPreferred = ['All', 'Tiffin', 'Lunch', 'Snacks', 'Special', 'Sweets'];
    if (!items || items.length === 0) return defaultPreferred;
    const catsInDb = new Set(items.map((i) => i.category));
    const result = defaultPreferred.filter((c) => c === 'All' || catsInDb.has(c));
    catsInDb.forEach((c) => {
      if (!result.includes(c)) result.push(c);
    });
    return result;
  }, [items]);

  // Reset selected category if it no longer exists
  useEffect(() => {
    if (items && items.length > 0 && selectedCategory !== 'All') {
      const exists = items.some((i) => i.category === selectedCategory);
      if (!exists) {
        setSelectedCategory('All');
      }
    }
  }, [items, selectedCategory, setSelectedCategory]);

  // Filter items based on Category, Diet, and Search query (matching both English & Tamil names)
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      // Category match
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Diet match
      if (activeDietFilter === 'veg' && item.isVeg !== true) return false;
      if (activeDietFilter === 'non-veg' && item.isVeg === true) return false;
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesTamil = item.nameTamil ? item.nameTamil.toLowerCase().includes(query) : false;
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        return matchesName || matchesTamil || matchesCode || matchesCategory;
      }
      return true;
    });
  }, [items, selectedCategory, activeDietFilter, searchQuery]);

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

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setDietFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col w-full lg:h-full lg:overflow-hidden bg-slate-50">
      {/* Filters Bar: Categories, Search & Diet Filters */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0 sticky top-0 z-10 shadow-2xs">
        {/* Mobile-Only Search Input */}
        <div className="relative sm:hidden">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none min-w-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isTabletLandscape 
                    ? 'px-4.5 py-2 text-[13px] sm:text-sm shadow-2xs' 
                    : 'px-3.5 py-1.5 text-xs'
                } ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs dark:bg-[#14A89B] dark:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:bg-[#271C15] dark:text-[#D4C7B5] dark:hover:bg-[#38291F]'
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
              type="button"
              onClick={() => setDietFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeDietFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Diet
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('veg')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeDietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <Leaf className="w-3 h-3" />
              100% Veg
            </button>
            {showNonVeg && (
              <button
                type="button"
                onClick={() => setDietFilter('non-veg')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  activeDietFilter === 'non-veg'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                <Flame className="w-3 h-3" />
                Non-Veg
              </button>
            )}
          </div>

          <div className="text-slate-400 font-medium text-[11px] truncate">
            {items === undefined ? 'Loading...' : `${filteredItems.length} of ${items.length} items`}
          </div>
        </div>
      </div>

      {/* Item Grid - Tappable 2-column cards on mobile, 3 columns on tablet landscape */}
      <div className={`p-3 lg:flex-1 lg:overflow-y-auto ${cartLines.length > 0 ? 'pb-32' : 'pb-16'} lg:pb-3`}>
        {items === undefined ? (
          /* Graceful Loading Skeleton */
          <div className={
            isTabletLandscape 
              ? 'grid grid-cols-3 gap-3.5' 
              : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3'
          }>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-[#2E2119] rounded-2xl border border-slate-200 dark:border-[#3D2C20] animate-pulse flex flex-col justify-between ${
                  isTabletLandscape ? 'p-4 h-40' : 'p-3 h-36'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="w-12 h-3 bg-slate-200 dark:bg-[#3D2C20] rounded" />
                  <div className="w-6 h-3 bg-slate-200 dark:bg-[#3D2C20] rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-3/4 h-4 bg-slate-200 dark:bg-[#3D2C20] rounded" />
                  <div className="w-1/2 h-3 bg-slate-200 dark:bg-[#3D2C20] rounded" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#3D2C20]">
                  <div className="w-10 h-4 bg-slate-200 dark:bg-[#3D2C20] rounded" />
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#3D2C20]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Filtered Empty State with Instant Reset Button */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-slate-400 max-w-sm mx-auto">
            <PackageX className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-[#F5F0E6] text-sm">No items match your filter</p>
            
            {dietFilter === 'non-veg' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Pasumai Cafe is a 100% organic vegetarian kitchen. There are no non-veg items on the menu.
              </p>
            )}
            {searchQuery && (
              <p className="text-xs text-slate-400 mt-1">
                No items matching search <span className="font-mono font-bold">"{searchQuery}"</span>
              </p>
            )}
            {selectedCategory !== 'All' && (
              <p className="text-xs text-slate-400 mt-1">
                No items in category <span className="font-bold">"{selectedCategory}"</span>
              </p>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All {items.length} Items</span>
            </button>
          </div>
        ) : (
          <div className={
            isTabletLandscape 
              ? 'grid grid-cols-3 gap-3.5' 
              : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3'
          }>
            {filteredItems.map((item) => {
              const inCartQty = getItemCartQty(item.id);
              const displayName = (menuLanguage === 'Tamil' && item.nameTamil) ? item.nameTamil : item.name;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative bg-white dark:bg-[#2E2119] rounded-2xl border transition-all duration-150 flex flex-col justify-between select-none cursor-pointer active:scale-[0.98] ${
                    isTabletLandscape ? 'p-3.5 sm:p-4 min-h-[142px]' : 'p-2.5 sm:p-3'
                  } ${
                    inCartQty > 0
                      ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md hover:border-teal-700'
                      : 'border-slate-200 dark:border-[#3D2C20] hover:border-teal-500 hover:shadow-md'
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
                      <span className={`font-mono text-slate-400 dark:text-[#B8A990] font-semibold uppercase ${
                        isTabletLandscape ? 'text-[11px]' : 'text-[10px]'
                      }`}>
                        {item.code}
                      </span>
                    </div>

                    {/* In-cart badge */}
                    {inCartQty > 0 && (
                      <span className={`bg-teal-700 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-xs animate-in zoom-in-50 duration-150 ${
                        isTabletLandscape ? 'text-xs' : 'text-[10px] sm:text-[11px]'
                      }`}>
                        {inCartQty} in bill
                      </span>
                    )}
                  </div>

                  {/* Item Name & Category */}
                  <div className="mb-2 min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <h4
                        title={displayName}
                        className={`font-bold text-slate-800 dark:text-[#F5F0E6] truncate group-hover:text-teal-700 dark:group-hover:text-[#14A89B] transition ${
                          isTabletLandscape ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {displayName}
                      </h4>
                      {item.name === 'Veg Omlet' && (
                        <span className="shrink-0 text-[8px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" title="Egg substitute. Flagged for owner confirmation.">
                          Confirm
                        </span>
                      )}
                    </div>
                    <span className={`text-slate-400 dark:text-[#B8A990] font-medium truncate block ${
                      isTabletLandscape ? 'text-[11px]' : 'text-[10px]'
                    }`}>
                      {item.category}
                    </span>
                  </div>

                  {/* Bottom: Price / Stepper or Add Button */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-[#3D2C20]">
                    <div className="min-w-0 flex-1">
                      {item.price === 0 ? (
                        <span className={`inline-block font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ${
                          isTabletLandscape ? 'text-xs' : 'text-[10px] sm:text-[11px]'
                        }`}>
                          Set price
                        </span>
                      ) : (
                        <div className={`font-extrabold text-slate-900 dark:text-[#F5F0E6] font-mono tracking-tight ${
                          isTabletLandscape ? 'text-base sm:text-lg' : 'text-xs sm:text-base'
                        }`}>
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
                          className={`${
                            isTabletLandscape ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-6 h-6 sm:w-7 sm:h-7'
                          } rounded-full flex items-center justify-center text-teal-100 hover:bg-teal-800 hover:text-white active:scale-90 transition cursor-pointer`}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className={`${
                          isTabletLandscape ? 'min-w-[22px] sm:min-w-[26px] text-sm' : 'min-w-[18px] sm:min-w-[22px] text-xs'
                        } px-0.5 text-center font-extrabold font-mono text-white`}>
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
                          className={`${
                            isTabletLandscape ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-6 h-6 sm:w-7 sm:h-7'
                          } rounded-full flex items-center justify-center text-teal-100 hover:bg-teal-800 hover:text-white active:scale-90 transition cursor-pointer`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
                        className={`${
                          isTabletLandscape ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'
                        } rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-teal-700 hover:text-white dark:bg-[#271C15] dark:text-[#D4C7B5] dark:hover:bg-[#14A89B] dark:hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer`}
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
