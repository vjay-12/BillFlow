import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Banknote, 
  QrCode, 
  X, 
  Check, 
  ArrowRight,
  Copy
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { billsRepo } from '../../db/billsRepo';
import { formatCurrency } from '../../lib/formatters';
import type { PaymentMode, Bill } from '../../types';
import { db, INITIAL_BUSINESS_PROFILE } from '../../db/schema';

const generateBillId = () => `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
const getCurrentTimestamp = () => Date.now();

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    setIsReceiptModalOpen,
    setActiveBillForReceipt,
  } = useUIStore();

  const {
    lines,
    orderType,
    table,
    customer,
    cashierName,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    clearCart,
  } = useCartStore();

  const profileRecord = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  const profile = profileRecord || INITIAL_BUSINESS_PROFILE;
  const total = getTotal();
  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const tax = getTaxAmount();

  // Purely for record-keeping: default to UPI (most common), cashier can toggle to Cash with 1 tap
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  if (!isPaymentModalOpen) return null;

  const handleCompleteSale = async () => {
    if (lines.length === 0) return;

    try {
      setIsProcessing(true);
      const nextBillNo = await billsRepo.getNextBillNo();

      const newBill: Bill = {
        id: generateBillId(),
        billNo: nextBillNo,
        timestamp: getCurrentTimestamp(),
        lines: [...lines],
        subtotal,
        discount,
        tax,
        total,
        paymentMode,
        status: 'Paid',
        orderType,
        table: orderType === 'Dine-in' ? table : undefined,
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        cashierId: cashierName,
        synced: false,
      };

      await billsRepo.create(newBill);

      // Celebrate success
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      } catch {
        // quiet ignore
      }

      clearCart();
      setIsPaymentModalOpen(false);
      setActiveBillForReceipt(newBill);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(`Error settling bill: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentUpiId = profile.upiId || 'pasumaicafe@oksbi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2E2119] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-[#3D2C20] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#3D2C20] flex items-center justify-between bg-slate-50/70 dark:bg-[#271C15]">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-[#F5F0E6] text-base sm:text-lg">
              Payment & Checkout
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#B8A990]">
              Scan UPI QR code or accept cash
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            aria-label="Close payment modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] hover:bg-slate-200 dark:hover:bg-[#38291F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to Pay Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 dark:from-[#14A89B] dark:to-[#0D655E] text-white p-4 sm:p-5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-xs font-semibold text-teal-200 dark:text-teal-100 tracking-wide uppercase">
              Total Amount Due
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-0.5">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-teal-100/90 dark:text-teal-100/80 mt-1">
              {lines.length} {lines.length === 1 ? 'item' : 'items'} • {orderType} {orderType === 'Dine-in' && table ? `(${table})` : ''}
            </div>
          </div>

          {customer && (
            <div className="text-right bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
              <span className="text-[10px] text-teal-200 dark:text-teal-100 block uppercase font-bold">
                Customer
              </span>
              <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                {customer.name}
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">
                {customer.phone}
              </span>
            </div>
          )}
        </div>

        {/* Unified Payment Window Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 flex flex-col items-center justify-center text-center">
          {/* Mode Selector Toggle: Purely for record-keeping which mode was used for this sale */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#271C15] p-1 rounded-xl w-full max-w-xs">
            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                paymentMode === 'UPI'
                  ? 'bg-teal-700 text-white shadow-xs dark:bg-[#14A89B] dark:text-white'
                  : 'text-slate-600 dark:text-[#D4C7B5] hover:text-slate-800 dark:hover:text-[#F5F0E6]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('Cash')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                paymentMode === 'Cash'
                  ? 'bg-teal-700 text-white shadow-xs dark:bg-[#14A89B] dark:text-white'
                  : 'text-slate-600 dark:text-[#D4C7B5] hover:text-slate-800 dark:hover:text-[#F5F0E6]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash</span>
            </button>
          </div>

          {/* Primary Visual: QR Code */}
          <div className="w-full flex flex-col items-center">
            <div className="p-3 bg-white rounded-2xl border-2 border-teal-600/30 shadow-md inline-block">
              {profile.upiQrCodeUrl ? (
                <img
                  src={profile.upiQrCodeUrl}
                  alt="Store UPI QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                />
              ) : (
                /* Crisp SVG UPI QR with scan corners and data markers */
                <svg
                  className="w-44 h-44 sm:w-48 sm:h-48 text-slate-800"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  aria-label="UPI QR Code"
                >
                  {/* Top-left corner finder */}
                  <rect x="6" y="6" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="12" width="12" height="12" rx="1.5" />

                  {/* Top-right corner finder */}
                  <rect x="70" y="6" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="76" y="12" width="12" height="12" rx="1.5" />

                  {/* Bottom-left corner finder */}
                  <rect x="6" y="70" width="24" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="76" width="12" height="12" rx="1.5" />

                  {/* Center Brand Badge (UPI Logo) */}
                  <rect x="38" y="38" width="24" height="24" rx="5" fill="#0F766E" />
                  <text
                    x="50"
                    y="54"
                    fill="white"
                    fontSize="9"
                    fontWeight="900"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    UPI
                  </text>

                  {/* QR Data modules */}
                  <rect x="36" y="8" width="7" height="18" />
                  <rect x="47" y="8" width="14" height="6" />
                  <rect x="54" y="18" width="8" height="12" />

                  <rect x="8" y="36" width="16" height="6" />
                  <rect x="27" y="44" width="7" height="16" />

                  <rect x="66" y="36" width="14" height="7" />
                  <rect x="84" y="40" width="8" height="18" />

                  <rect x="36" y="66" width="8" height="26" />
                  <rect x="48" y="72" width="16" height="7" />
                  <rect x="70" y="68" width="24" height="6" />
                  <rect x="74" y="80" width="18" height="12" />
                </svg>
              )}
            </div>

            {/* UPI ID and reference details below QR */}
            <div className="mt-3 space-y-1">
              <div className="text-xs font-bold text-slate-800 dark:text-[#F5F0E6]">
                Scan & Pay {formatCurrency(total)}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-[#B8A990] font-mono">
                <span>
                  UPI ID: <strong className="text-slate-700 dark:text-[#F5F0E6]">{currentUpiId}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(currentUpiId);
                    setCopiedUPI(true);
                    setTimeout(() => setCopiedUPI(false), 2000);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-[#38291F] rounded text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] transition cursor-pointer"
                  title="Copy UPI ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copiedUPI && (
                <span className="text-[11px] text-teal-600 dark:text-[#14A89B] font-bold block animate-in fade-in">
                  ✓ UPI ID copied to clipboard!
                </span>
              )}
              <p className="text-[10px] text-slate-400 dark:text-[#8C7B65]">
                Supports Google Pay, PhonePe, Paytm, BHIM & all UPI apps
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Single Confirm Payment Action */}
        <div className="p-4 bg-slate-50 dark:bg-[#271C15] border-t border-slate-100 dark:border-[#3D2C20] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-[#3D2C20] text-slate-600 dark:text-[#D4C7B5] hover:bg-slate-100 dark:hover:bg-[#38291F] font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCompleteSale}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-[#14A89B] dark:hover:bg-[#17BEAF] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/25 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isProcessing
                ? 'Processing Sale...'
                : `Confirm Payment • ${formatCurrency(total)} (${paymentMode})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
