import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Tag, 
  ChevronRight, 
  Utensils, 
  Package, 
  FileEdit,
  Check
} from 'lucide-react';
import { db } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../lib/formatters';
import { useTabletLandscape } from '../../lib/useTabletLandscape';

export const CartSidebar: React.FC = () => {
  const isTabletLandscape = useTabletLandscape();
  const {
    lines,
    orderType,
    table,
    customer,
    discountType,
    discountValue,
    isGstEnabled,
    incrementQty,
    decrementQty,
    updateNote,
    setOrderType,
    setTable,
    setDiscount,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getTotalItemsCount,
  } = useCartStore();

  const { setIsPaymentModalOpen, setIsCustomerSelectModalOpen } = useUIStore();
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);

  // Business profile for table count & Tamil menu display language
  const profile = useLiveQuery(() => db.businessProfile.get('main'), []);
  const menuLanguage = profile?.menuLanguage || 'English';

  // Active items lookup to ensure immediate Tamil name resolution
  const allItems = useLiveQuery(() => db.items.toArray(), []);
  const itemMap = useMemo(() => new Map(allItems?.map((i) => [i.id, i])), [allItems]);

  // Configurable table count: Only "Table 1" through "Table N" (defaults to 10)
  const tableCount = profile?.tableCount && profile.tableCount > 0 ? profile.tableCount : 10;
  const tables = useMemo(() => Array.from({ length: tableCount }, (_, i) => `Table ${i + 1}`), [tableCount]);

  // Ensure selected table stays valid if table count is reduced in Settings
  useEffect(() => {
    if (tables.length > 0 && !tables.includes(table)) {
      setTable(tables[0]);
    }
  }, [tables, table, setTable]);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();
  const total = getTotal();
  const itemsCount = getTotalItemsCount();

  return (
    <aside className="w-full h-full bg-white dark:bg-[#2E2119] flex flex-col min-w-0 overflow-hidden shadow-lg z-20">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Active Order</h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in bill
            </span>
          </div>
        </div>

        {lines.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear current order cart?')) {
                clearCart();
              }
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Order Type & Table Selection */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2">
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-[#271C15] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setOrderType('Dine-in')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              orderType === 'Dine-in'
                ? 'bg-white dark:bg-[#2E2119] text-teal-800 dark:text-[#14A89B] shadow-xs'
                : 'text-slate-600 dark:text-[#D4C7B5] hover:text-slate-800 dark:hover:text-[#F5F0E6]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine-in</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType('Takeaway')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              orderType === 'Takeaway'
                ? 'bg-white dark:bg-[#2E2119] text-teal-800 dark:text-[#14A89B] shadow-xs'
                : 'text-slate-600 dark:text-[#D4C7B5] hover:text-slate-800 dark:hover:text-[#F5F0E6]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Takeaway</span>
          </button>
        </div>

        {/* Table selector for Dine-in */}
        {orderType === 'Dine-in' && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Table / Seat:</span>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-600"
            >
              {tables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Attachment Bar */}
        <div className="pt-1 flex items-center justify-between">
          {customer ? (
            <div
              onClick={() => setIsCustomerSelectModalOpen(true)}
              className="flex-1 flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-teal-100/70 transition min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-xs font-bold text-teal-900 truncate">{customer.name}</span>
                <span className="text-[10px] text-teal-600 font-medium shrink-0">{customer.phone}</span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 shrink-0 ml-1.5">Change</span>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomerSelectModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-teal-500 hover:text-teal-700 rounded-xl py-1.5 text-xs text-slate-500 font-semibold transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Attach Customer (Loyalty)</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Lines List - independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-2">
        {lines.length === 0 ? (
          <div className="h-full py-6 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Tap any item on the left grid to add it to this bill.
            </p>
          </div>
        ) : (
          lines.map((line) => {
            const itemObj = itemMap.get(line.itemId);
            const tamilName = line.nameTamil || itemObj?.nameTamil;
            const displayName = (menuLanguage === 'Tamil' && tamilName) ? tamilName : line.name;

            return (
              <div
                key={line.itemId}
                className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-800 leading-tight truncate" title={displayName}>
                      {displayName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {formatCurrency(line.price)} each
                    </div>
                  </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-xs sm:text-sm font-mono text-slate-900">
                    {formatCurrency(line.price * line.qty)}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Note Button */}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                <button
                  onClick={() =>
                    setActiveNoteItemId(
                      activeNoteItemId === line.itemId ? null : line.itemId
                    )
                  }
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-teal-700"
                >
                  <FileEdit className="w-3 h-3" />
                  <span>{line.note ? `Note: "${line.note}"` : '+ Note'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => decrementQty(line.itemId)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                  >
                    {line.qty === 1 ? (
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>
                  <span className="w-6 text-center font-bold font-mono text-xs text-slate-800">
                    {line.qty}
                  </span>
                  <button
                    onClick={() => incrementQty(line.itemId)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Note input dropdown */}
              {activeNoteItemId === line.itemId && (
                <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Less spicy, Extra ketchup..."
                    value={line.note || ''}
                    onChange={(e) => updateNote(line.itemId, e.target.value)}
                    className="flex-1 bg-white text-xs px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                  <button
                    onClick={() => setActiveNoteItemId(null)}
                    className="p-1 bg-teal-600 text-white rounded text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>

      {/* Bill Calculation Summary & Checkout */}
      <div className={`shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-[#271C15] border-t border-slate-200 dark:border-[#3D2C20] space-y-2.5 ${
        isTabletLandscape ? 'pb-4' : 'pb-24'
      }`}>
        {/* Discount Bar */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{discountAmount > 0 ? `Discount Applied` : `+ Add Discount`}</span>
          </button>
          {discountAmount > 0 && (
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400 shrink-0 ml-2">
              -{formatCurrency(discountAmount)}
            </span>
          )}
        </div>

        {showDiscountInput && (
          <div className="p-2 bg-white dark:bg-[#2E2119] rounded-xl border border-slate-200 dark:border-[#3D2C20] flex items-center gap-2 text-xs">
            <div className="flex bg-slate-100 dark:bg-[#271C15] rounded-lg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setDiscount('fixed', discountValue)}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  discountType === 'fixed' ? 'bg-white dark:bg-[#2E2119] shadow-xs text-slate-800 dark:text-[#F5F0E6]' : 'text-slate-500'
                }`}
              >
                ₹ Flat
              </button>
              <button
                type="button"
                onClick={() => setDiscount('percent', discountValue)}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  discountType === 'percent' ? 'bg-white dark:bg-[#2E2119] shadow-xs text-slate-800 dark:text-[#F5F0E6]' : 'text-slate-500'
                }`}
              >
                %
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discountValue || ''}
              onChange={(e) => setDiscount(discountType, Number(e.target.value))}
              className="w-20 px-2 py-1 bg-slate-50 dark:bg-[#271C15] text-slate-800 dark:text-[#F5F0E6] rounded border border-slate-200 dark:border-[#3D2C20] text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            {discountValue > 0 && (
              <button
                type="button"
                onClick={() => setDiscount('fixed', 0)}
                className="text-[10px] text-rose-500 hover:underline shrink-0 cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#D4C7B5] pt-1 border-t border-slate-200 dark:border-[#3D2C20]">
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-[#F5F0E6] shrink-0 ml-2">{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium">
              <span>Discount</span>
              <span className="font-mono font-semibold shrink-0 ml-2">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {isGstEnabled && taxAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-[#B8A990]">GST</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-[#F5F0E6] shrink-0 ml-2">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-[#F5F0E6] pt-1.5 border-t border-slate-200 dark:border-[#3D2C20]">
            <span>Payable Total</span>
            <span className="font-mono text-teal-800 dark:text-[#14A89B] text-base sm:text-lg font-black shrink-0 ml-2">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Charge CTA Button */}
        <button
          type="button"
          disabled={lines.length === 0}
          onClick={() => setIsPaymentModalOpen(true)}
          className={`w-full py-3 sm:py-3.5 px-3.5 sm:px-4 rounded-xl font-extrabold text-sm flex items-center justify-between shadow-md transition-all duration-150 ${
            lines.length === 0
              ? 'bg-slate-200 dark:bg-[#38291F] text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/25 active:scale-[0.99] cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="truncate">Proceed to Payment</span>
            <span className="text-xs bg-teal-800/80 px-2 py-0.5 rounded-full font-mono shrink-0">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-base font-bold shrink-0 ml-2">
            <span>{formatCurrency(total)}</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </div>
        </button>
      </div>
    </aside>
  );
};
