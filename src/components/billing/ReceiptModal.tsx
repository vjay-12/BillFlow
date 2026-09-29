import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Bluetooth, 
  X, 
  Plus, 
  Receipt
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { bluetoothPrinter } from '../../printing/bluetoothPrinter';
import { db, INITIAL_BUSINESS_PROFILE } from '../../db/schema';
import type { BusinessProfile } from '../../types';

export const ReceiptModal: React.FC = () => {
  const { t } = useTranslation();
  const { isReceiptModalOpen, setIsReceiptModalOpen, activeBillForReceipt } = useUIStore();
  const [isPrintingBt, setIsPrintingBt] = useState(false);

  const dbProfile = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  const isCartGstEnabled = useCartStore((s) => s.isGstEnabled);
  const isGstEnabled = isCartGstEnabled && dbProfile?.enableGst !== false;

  if (!isReceiptModalOpen || !activeBillForReceipt) return null;

  const bill = activeBillForReceipt;
  // Automatically use the saved paperWidth preference from Settings (default 80mm)
  const paperWidth = dbProfile?.paperWidth || '80mm';

  const profile: BusinessProfile = {
    ...INITIAL_BUSINESS_PROFILE,
    ...dbProfile,
    paperWidth,
  };

  const handleBluetoothPrint = async () => {
    try {
      setIsPrintingBt(true);
      await bluetoothPrinter.printReceipt(bill, profile);
      alert(t('receipt.printSuccess'));
    } catch (err: any) {
      alert(t('receipt.printError', { message: err.message || 'Printer unavailable' }));
    } finally {
      setIsPrintingBt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2E2119] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-[#3D2C20] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar — Clean Header with Saved Preference Badge */}
        <div className="no-print px-4 py-3 border-b border-slate-100 dark:border-[#3D2C20] flex items-center justify-between bg-slate-50 dark:bg-[#271C15]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-700 dark:text-[#14A89B]" />
            <span className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">
              {t('receipt.previewTitle')}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#38291F] text-slate-600 dark:text-[#D4C7B5]">
              {paperWidth}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(false)}
            aria-label="Close receipt modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] hover:bg-slate-200 dark:hover:bg-[#38291F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-[#211712] flex justify-center">
          {/* Authentic Thermal Paper Card */}
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white shadow-md border border-slate-200 p-5 font-receipt text-xs leading-relaxed text-slate-900 select-text transition-all duration-200 rounded-sm"
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-950 font-sans">
                {profile.name}
              </h2>
              {profile.tagline && <p className="text-[10px] text-slate-600">{profile.tagline}</p>}
              {profile.address && <p className="text-[10px] text-slate-500 leading-tight">{profile.address}</p>}
              {profile.phone && <p className="text-[10px] font-semibold text-slate-700">{t('receipt.tel', { phone: profile.phone })}</p>}
              {isGstEnabled && profile.gstin && <p className="text-[9px] text-slate-500">{t('receipt.gstin', { gstin: profile.gstin })}</p>}
              {profile.fssai && <p className="text-[9px] text-slate-500">{t('receipt.fssai', { fssai: profile.fssai })}</p>}
            </div>

            {/* Bill Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>{t('receipt.billNo', { billNo: bill.billNo })}</span>
                <span className="uppercase">{bill.orderType === 'Dine-in' ? t('cart.dineIn') : t('cart.takeaway')}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>{formatDateTime(bill.timestamp)}</span>
                {bill.cashierId && <span>{bill.cashierId}</span>}
              </div>
              {bill.table && bill.orderType === 'Dine-in' && (
                <div className="font-semibold text-slate-800">
                  {t('receipt.location', { table: bill.table })}
                </div>
              )}
              {bill.customerName && (
                <div className="text-slate-700">
                  {t('receipt.customer', { name: bill.customerName })} {bill.customerPhone ? `(${bill.customerPhone})` : ''}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1.5">
                <span>{t('receipt.itemHeader')}</span>
                <span className="text-right">{t('receipt.qtyPriceHeader')}</span>
                <span className="text-right">{t('receipt.amtHeader')}</span>
              </div>

              <div className="space-y-1.5">
                {bill.lines.map((line, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-slate-900 flex-1 truncate pr-1">
                        {line.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px] whitespace-nowrap px-1">
                        {line.qty} × {line.price}
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-right whitespace-nowrap">
                        {(line.qty * line.price).toFixed(2)}
                      </span>
                    </div>
                    {line.note && (
                      <div className="text-[9px] text-slate-500 italic pl-1">
                        * {line.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Totals */}
            <div className="py-2.5 border-b-2 border-slate-900 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>{t('receipt.subtotal')}</span>
                <span className="font-mono">{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{t('receipt.discount')}</span>
                  <span className="font-mono">-{bill.discount.toFixed(2)}</span>
                </div>
              )}
              {isGstEnabled && bill.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{t('receipt.gst')}</span>
                  <span className="font-mono">{bill.tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1.5 border-t border-dashed border-slate-300">
                <span>{t('receipt.netTotal')}</span>
                <span className="font-mono">{formatCurrency(bill.total)}</span>
              </div>
            </div>

            {/* Payment & Status */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>{t('receipt.paymentMode')}</span>
                <span className="font-bold uppercase">{bill.paymentMode === 'Cash' ? t('payment.cash') : bill.paymentMode === 'UPI' ? t('common.upi') : bill.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('receipt.status')}</span>
                <span className="font-bold uppercase text-emerald-700">{bill.status === 'Paid' ? t('common.paid') : bill.status === 'Cancelled' ? t('common.cancelled') : bill.status}</span>
              </div>
            </div>

            {/* Footer Thank You */}
            <div className="text-center pt-4 pb-2 space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                {t('receipt.thankYou')}
              </p>
              <p className="text-[9px] text-slate-400">{t('receipt.printedWith')}</p>
            </div>
          </div>
        </div>

        {/* Simplified Action Buttons Footer — Only BT Thermal Print and New Sale */}
        <div className="no-print p-3.5 sm:p-4 bg-white dark:bg-[#2E2119] border-t border-slate-200 dark:border-[#3D2C20]">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isPrintingBt}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span>{isPrintingBt ? t('receipt.sending') : t('receipt.btThermalPrint')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(false)}
              className="py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-[#14A89B] dark:hover:bg-[#17BEAF] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('receipt.newSale')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
