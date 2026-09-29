import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Package
} from 'lucide-react';
import { db } from '../../db/schema';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../lib/formatters';
import { useTabletLandscape } from '../../lib/useTabletLandscape';

export const CartSidebar: React.FC = () => {
  const { t } = useTranslation();
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
            <h3 className="font-extrabold text-slate-800 text-sm">{t('cart.activeOrder')}</h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {itemsCount === 1 ? t('cart.itemCountSingular', { count: itemsCount }) : t('cart.itemCountPlural', { count: itemsCount })}
            </span>
          </div>
        </div>

        {lines.length > 0 && (
          <button
            onClick={() => {
              if (confirm(t('cart.clearConfirm'))) {
                clearCart();
              }
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
          >
            {t('cart.clear')}
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
            <span>{t('cart.dineIn')}</span>
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
            <span>{t('cart.takeaway')}</span>
          </button>
        </div>

        {/* Table selector for Dine-in */}
        {orderType === 'Dine-in' && (
          <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-600 dark:text-[#B8A990] font-semibold text-xs sm:text-sm">{t('cart.tableSeat')}</span>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="bg-slate-100 dark:bg-[#271C15] text-slate-800 dark:text-[#F5F0E6] font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#3D2C20] text-xs sm:text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none cursor-pointer shadow-2xs min-w-[125px]"
            >
              {tables.map((tbl) => (
                <option key={tbl} value={tbl}>
                  {tbl.startsWith('Table ') ? `${t('cart.tablePrefix')} ${tbl.replace('Table ', '')}` : tbl}
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
              <span className="text-[10px] font-bold text-teal-700 shrink-0 ml-1.5">{t('cart.changeCustomer')}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomerSelectModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-teal-500 hover:text-teal-700 rounded-xl py-1.5 text-xs text-slate-500 font-semibold transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('cart.attachCustomer')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Lines List - independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1.5">
        {lines.length === 0 ? (
          <div className="h-full py-6 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">{t('cart.cartEmpty')}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              {t('cart.tapAnyItemSub')}
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
                className="bg-slate-50/90 dark:bg-[#271C15]/70 rounded-xl px-3 py-2 border border-slate-200/80 dark:border-[#3D2C20] hover:border-slate-300 dark:hover:border-[#4E392A] transition"
              >
                {/* Top Row: Item name (left), Quantity control (middle-right), Total price (far-right) */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div
                    className="font-bold text-xs sm:text-sm text-slate-800 dark:text-[#F5F0E6] leading-tight truncate flex-1 min-w-0"
                    title={displayName}
                  >
                    {displayName}
                  </div>

                  {/* Quantity Stepper [ - 1 + ] */}
                  <div className="flex items-center gap-1 bg-white dark:bg-[#1E140E] border border-slate-200 dark:border-[#3D2C20] rounded-lg p-0.5 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => decrementQty(line.itemId)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-[#D4C7B5] hover:bg-slate-100 dark:hover:bg-[#38291F] transition cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      {line.qty === 1 ? (
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </button>
                    <span className="w-5 text-center font-bold font-mono text-xs text-slate-800 dark:text-[#F5F0E6]">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementQty(line.itemId)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-[#D4C7B5] hover:bg-slate-100 dark:hover:bg-[#38291F] transition cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Total Price on the far right */}
                  <div className="font-extrabold text-xs sm:text-sm font-mono text-slate-900 dark:text-[#F5F0E6] text-right shrink-0 min-w-[50px]">
                    {formatCurrency(line.price * line.qty)}
                  </div>
                </div>

                {/* Bottom Row: Unit Price underneath the item name */}
                <div className="text-[11px] font-mono text-slate-500 dark:text-[#B8A990] mt-0.5">
                  {formatCurrency(line.price)} {t('cart.each')}
                </div>
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
            <span>{discountAmount > 0 ? t('cart.discountApplied') : t('cart.addDiscount')}</span>
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
                {t('cart.flat')}
              </button>
              <button
                type="button"
                onClick={() => setDiscount('percent', discountValue)}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  discountType === 'percent' ? 'bg-white dark:bg-[#2E2119] shadow-xs text-slate-800 dark:text-[#F5F0E6]' : 'text-slate-500'
                }`}
              >
                {t('cart.percent')}
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
                {t('cart.remove')}
              </button>
            )}
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#D4C7B5] pt-1 border-t border-slate-200 dark:border-[#3D2C20]">
          <div className="flex justify-between items-center">
            <span>{t('cart.subtotal')}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-[#F5F0E6] shrink-0 ml-2">{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium">
              <span>{t('cart.discount')}</span>
              <span className="font-mono font-semibold shrink-0 ml-2">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {isGstEnabled && taxAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-[#B8A990]">{t('cart.gst')}</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-[#F5F0E6] shrink-0 ml-2">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-[#F5F0E6] pt-1.5 border-t border-slate-200 dark:border-[#3D2C20]">
            <span>{t('cart.payableTotal')}</span>
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
            <span className="truncate">{t('cart.proceedToPayment')}</span>
            <span className="text-xs bg-teal-800/80 px-2 py-0.5 rounded-full font-mono shrink-0">
              {itemsCount === 1 ? t('cart.itemCountSingular', { count: itemsCount }) : t('cart.itemCountPlural', { count: itemsCount })}
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
