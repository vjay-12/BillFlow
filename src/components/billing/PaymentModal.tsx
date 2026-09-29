import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Banknote, 
  QrCode, 
  X, 
  Check, 
  ArrowRight,
  Copy,
  AlertCircle
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
  const { t } = useTranslation();
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

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [tenderedCashInput, setTenderedCashInput] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  if (!isPaymentModalOpen) return null;

  const tenderedCash = tenderedCashInput !== null ? tenderedCashInput : total;
  const changeDue = Math.max(0, (tenderedCash || 0) - total);
  const isCashInsufficient = paymentMode === 'Cash' && (tenderedCash || 0) < total;

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
      alert(t('payment.errorSettling', { message: err.message }));
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
              {t('payment.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#B8A990]">
              {t('payment.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            aria-label={t('common.cancel')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] hover:bg-slate-200 dark:hover:bg-[#38291F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to Pay Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 dark:from-[#14A89B] dark:to-[#0D655E] text-white p-4 sm:p-5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-xs font-semibold text-teal-200 dark:text-teal-100 tracking-wide uppercase">
              {t('payment.totalPayableAmount')}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-0.5">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-teal-100/90 dark:text-teal-100/80 mt-1">
              {lines.length === 1 ? t('cart.itemCountSingular', { count: lines.length }) : t('cart.itemCountPlural', { count: lines.length })} • {orderType === 'Dine-in' ? t('common.dineIn') : t('common.takeaway')} {orderType === 'Dine-in' && table ? `(${table.startsWith('Table ') ? `${t('cart.tablePrefix')} ${table.replace('Table ', '')}` : table})` : ''}
            </div>
          </div>

          {customer && (
            <div className="text-right bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
              <span className="text-[10px] text-teal-200 dark:text-teal-100 block uppercase font-bold">
                {t('payment.customer')}
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
          {/* Mode Selector Toggle: Quick switch between UPI and Cash */}
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
              <span>{t('payment.upiQr')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('Cash');
                if (tenderedCashInput === null) setTenderedCashInput(total);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                paymentMode === 'Cash'
                  ? 'bg-teal-700 text-white shadow-xs dark:bg-[#14A89B] dark:text-white'
                  : 'text-slate-600 dark:text-[#D4C7B5] hover:text-slate-800 dark:hover:text-[#F5F0E6]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{t('payment.cash')}</span>
            </button>
          </div>

          {/* Cash Payment Mode: Cash Received + Quick Denomination Presets + Change Return Logic */}
          {paymentMode === 'Cash' && (
            <div className="w-full space-y-3.5 text-left animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">
                  {t('payment.cashReceived')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-slate-400 dark:text-[#8C7B65]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={tenderedCashInput !== null ? tenderedCashInput : total}
                    onChange={(e) => setTenderedCashInput(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3D2C20] bg-white dark:bg-[#271C15] text-slate-900 dark:text-[#F5F0E6] font-mono text-xl font-extrabold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-[#8C7B65] block">
                    {t('payment.quickPresets')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTenderedCashInput(total)}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 rounded-lg text-xs font-bold border border-teal-200 transition cursor-pointer"
                  >
                    {t('payment.exactAmount', { amount: formatCurrency(total) })}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amt) => {
                    const isSelected = tenderedCash === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTenderedCashInput(amt)}
                        className={`py-2 rounded-xl text-xs font-extrabold font-mono transition border cursor-pointer text-center ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs dark:bg-[#14A89B] dark:border-[#14A89B]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-[#271C15] dark:text-[#F5F0E6] dark:border-[#3D2C20] dark:hover:bg-[#38291F]'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Change / Insufficient Return Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCashInsufficient ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {isCashInsufficient ? t('payment.insufficientAmount') : t('payment.changeToReturn')}
                    </span>
                    <span className="text-[11px] opacity-75">
                      {isCashInsufficient
                        ? t('payment.shortBy', { amount: formatCurrency(total - tenderedCash) })
                        : t('payment.handBack')}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-extrabold font-mono">
                  {isCashInsufficient ? '₹0.00' : formatCurrency(changeDue)}
                </div>
              </div>
            </div>
          )}

          {/* UPI Mode: QR Code + Scan & Pay */}
          {paymentMode === 'UPI' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-150">
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
                  {t('payment.scanAndPay', { amount: formatCurrency(total) })}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-[#B8A990] font-mono">
                  <span>
                    {t('payment.upiId')} <strong className="text-slate-700 dark:text-[#F5F0E6]">{currentUpiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(currentUpiId);
                      setCopiedUPI(true);
                      setTimeout(() => setCopiedUPI(false), 2000);
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-[#38291F] rounded text-slate-400 hover:text-slate-600 dark:text-[#B8A990] dark:hover:text-[#F5F0E6] transition cursor-pointer"
                    title={t('payment.copyUpiId')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedUPI && (
                  <span className="text-[11px] text-teal-600 dark:text-[#14A89B] font-bold block animate-in fade-in">
                    {t('payment.copiedUpi')}
                  </span>
                )}
                <p className="text-[10px] text-slate-400 dark:text-[#8C7B65]">
                  {t('payment.supportsApps')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Single Confirm Payment Action */}
        <div className="p-4 bg-slate-50 dark:bg-[#271C15] border-t border-slate-100 dark:border-[#3D2C20] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-[#3D2C20] text-slate-600 dark:text-[#D4C7B5] hover:bg-slate-100 dark:hover:bg-[#38291F] font-bold text-xs transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            disabled={isProcessing || isCashInsufficient}
            onClick={handleCompleteSale}
            className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
              isProcessing || isCashInsufficient
                ? 'bg-slate-200 dark:bg-[#38291F] text-slate-400 dark:text-[#8C7B65] cursor-not-allowed shadow-none'
                : 'bg-teal-700 hover:bg-teal-800 text-white dark:bg-[#14A89B] dark:hover:bg-[#17BEAF] shadow-teal-700/25 active:scale-[0.99]'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isProcessing
                ? t('payment.processingSale')
                : t('payment.confirmPaymentDetails', { 
                    amount: formatCurrency(total), 
                    mode: paymentMode === 'Cash' ? t('common.cash') : t('common.upi') 
                  })}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

