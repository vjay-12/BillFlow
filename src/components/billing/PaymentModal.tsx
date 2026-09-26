import { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  BookUser, 
  X, 
  Check, 
  ArrowRight,
  AlertCircle,
  Copy,
  Receipt
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { billsRepo } from '../../db/billsRepo';
import { formatCurrency, generateUPIPaymentUrl } from '../../lib/formatters';
import type { PaymentMode, Bill } from '../../types';
import { INITIAL_BUSINESS_PROFILE } from '../../db/schema';

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

  const total = getTotal();
  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const tax = getTaxAmount();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [tenderedCash, setTenderedCash] = useState<number>(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  if (!isPaymentModalOpen) return null;

  const changeDue = Math.max(0, (tenderedCash || 0) - total);
  const isCashInsufficient = paymentMode === 'Cash' && (tenderedCash || 0) < total;

  const handleCompleteSale = async () => {
    if (lines.length === 0) return;
    if (paymentMode === 'Credit' && !customer) {
      alert('Credit payment requires an attached customer account to track ledger.');
      return;
    }

    try {
      setIsProcessing(true);
      const nextBillNo = await billsRepo.getNextBillNo();

      const newBill: Bill = {
        id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        billNo: nextBillNo,
        timestamp: Date.now(),
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
          particleCount: 50,
          spread: 60,
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

  const upiUrl = generateUPIPaymentUrl(
    INITIAL_BUSINESS_PROFILE.upiId || 'billflow@upi',
    INITIAL_BUSINESS_PROFILE.name,
    total,
    999
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Checkout & Payment</h3>
            <p className="text-xs text-slate-500">Select payment method to settle order</p>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to Pay Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white p-5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-xs font-semibold text-teal-200 tracking-wide uppercase">
              Total Amount Due
            </span>
            <div className="text-3xl font-extrabold font-mono tracking-tight mt-0.5">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-teal-100/80 mt-1">
              {lines.length} items • {orderType} {orderType === 'Dine-in' ? `(${table})` : ''}
            </div>
          </div>

          {customer && (
            <div className="text-right bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
              <span className="text-[10px] text-teal-200 block uppercase font-bold">Customer</span>
              <span className="text-xs font-bold text-white block">{customer.name}</span>
              <span className="text-[10px] text-amber-300 font-semibold">
                +{Math.floor(total / 50)} loyalty pts
              </span>
            </div>
          )}
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-4 border-b border-slate-100">
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
              { id: 'UPI', label: 'UPI / QR', icon: QrCode, color: 'text-sky-600' },
              { id: 'Card', label: 'Card / POS', icon: CreditCard, color: 'text-indigo-600' },
              { id: 'Credit', label: 'Due / Credit', icon: BookUser, color: 'text-amber-600' },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = paymentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setPaymentMode(mode.id as PaymentMode);
                    if (mode.id === 'Cash') setTenderedCash(total);
                  }}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all text-xs font-bold ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${mode.color}`} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Mode Specific Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {paymentMode === 'Cash' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Received from Customer
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={tenderedCash}
                    onChange={(e) => setTenderedCash(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xl font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Quick Cash Suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Quick Amount Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTenderedCash(total)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    Exact ({formatCurrency(total)})
                  </button>
                  {[100, 200, 500, 1000, 2000].map((amt) => {
                    if (amt < total && total > 500) return null;
                    return (
                      <button
                        key={amt}
                        onClick={() => setTenderedCash(amt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold font-mono text-slate-700"
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Change calculation */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCashInsufficient ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {isCashInsufficient ? 'Insufficient Amount' : 'Change to Return'}
                    </span>
                    <span className="text-[11px] opacity-75">
                      {isCashInsufficient
                        ? `Short by ₹${(total - tenderedCash).toFixed(2)}`
                        : 'Hand back to customer'}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-extrabold font-mono">
                  {formatCurrency(changeDue)}
                </div>
              </div>
            </div>
          )}

          {paymentMode === 'UPI' && (
            <div className="flex flex-col items-center justify-center p-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              {/* Dynamic SVG simulated QR Code */}
              <div className="p-3 bg-white rounded-2xl border-2 border-teal-600/30 shadow-md">
                <svg
                  className="w-44 h-44 text-slate-800"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  {/* Outer corners */}
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="11" y="11" width="13" height="13" />
                  <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="76" y="11" width="13" height="13" />
                  <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="11" y="76" width="13" height="13" />

                  {/* Pattern lines representing QR data */}
                  <rect x="36" y="8" width="6" height="18" />
                  <rect x="46" y="8" width="12" height="6" />
                  <rect x="52" y="18" width="8" height="10" />

                  <rect x="8" y="36" width="14" height="6" />
                  <rect x="26" y="44" width="8" height="14" />
                  <rect x="40" y="34" width="20" height="20" rx="4" fill="#0F766E" />
                  <rect x="46" y="40" width="8" height="8" fill="white" />

                  <rect x="66" y="36" width="12" height="8" />
                  <rect x="82" y="40" width="10" height="18" />

                  <rect x="36" y="66" width="8" height="24" />
                  <rect x="50" y="72" width="14" height="8" />
                  <rect x="70" y="70" width="22" height="6" />
                  <rect x="74" y="82" width="18" height="10" />
                </svg>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Scan to Pay: {formatCurrency(total)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {INITIAL_BUSINESS_PROFILE.upiId}
                </span>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(upiUrl);
                  setCopiedUPI(true);
                  setTimeout(() => setCopiedUPI(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUPI ? 'UPI Link Copied!' : 'Copy Intent Link'}</span>
              </button>
            </div>
          )}

          {paymentMode === 'Card' && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">POS Card Swipe / Tap</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Swipe, tap, or insert the credit/debit card on your EDC terminal for{' '}
                <strong className="text-slate-800">{formatCurrency(total)}</strong>.
              </p>
            </div>
          )}

          {paymentMode === 'Credit' && (
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <BookUser className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Customer Credit Account (Khata)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This bill will be added to the customer's outstanding balance ledger.
                  </p>
                </div>
              </div>

              {customer ? (
                <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{customer.name}</span>
                    <span className="text-slate-500">{customer.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Current Balance</span>
                    <span className="font-bold font-mono text-rose-600">
                      ₹{customer.outstanding}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No customer attached! Please close this modal and attach a customer first.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            disabled={isProcessing || isCashInsufficient || (paymentMode === 'Credit' && !customer)}
            onClick={handleCompleteSale}
            className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              isProcessing || isCashInsufficient || (paymentMode === 'Credit' && !customer)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/25 active:scale-[0.99] cursor-pointer'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Settling Order...'
                : `Complete Sale & Print (${formatCurrency(total)})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
