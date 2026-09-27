import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Printer, 
  Bluetooth, 
  X, 
  Share2, 
  Plus, 
  Smartphone
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { bluetoothPrinter } from '../../printing/bluetoothPrinter';
import { db, INITIAL_BUSINESS_PROFILE } from '../../db/schema';
import { shareReceiptPdf } from '../../lib/pdfReceipt';
import type { BusinessProfile } from '../../types';

export const ReceiptModal: React.FC = () => {
  const { isReceiptModalOpen, setIsReceiptModalOpen, activeBillForReceipt } = useUIStore();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const dbProfile = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  const isCartGstEnabled = useCartStore((s) => s.isGstEnabled);
  const isGstEnabled = isCartGstEnabled && dbProfile?.enableGst !== false;

  if (!isReceiptModalOpen || !activeBillForReceipt) return null;

  const bill = activeBillForReceipt;
  const profile: BusinessProfile = {
    ...INITIAL_BUSINESS_PROFILE,
    ...dbProfile,
    paperWidth,
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleBluetoothPrint = async () => {
    try {
      setIsPrintingBt(true);
      await bluetoothPrinter.printReceipt(bill, profile);
      alert('Receipt sent to Bluetooth thermal printer successfully!');
    } catch (err: any) {
      alert(`Bluetooth print error: ${err.message}. You can use "Browser Print" as fallback.`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const handleShareWhatsAppPdf = async () => {
    try {
      setIsSharingPdf(true);
      const res = await shareReceiptPdf(bill, profile, isGstEnabled);
      if (res.method === 'download' && res.message) {
        setShareStatus(res.message);
        setTimeout(() => setShareStatus(null), 4000);
      }
    } finally {
      setIsSharingPdf(false);
    }
  };

  const handleCopyText = () => {
    const text = 
      `--- ${profile.name} ---\n` +
      `Bill #${bill.billNo} | Total: ${formatCurrency(bill.total)} (${bill.paymentMode})\n` +
      `Items: ${bill.lines.map(l => `${l.name} x${l.qty}`).join(', ')}`;
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar */}
        <div className="no-print px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Receipt Preview</span>
            {/* Paper width toggle */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded ${
                  paperWidth === '58mm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded ${
                  paperWidth === '80mm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                80mm
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsReceiptModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          {/* Authentic Thermal Paper Card */}
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white shadow-md border border-slate-200 p-5 font-receipt text-xs leading-relaxed text-slate-900 select-text transition-all duration-200"
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-950 font-sans">
                {profile.name}
              </h2>
              {profile.tagline && <p className="text-[10px] text-slate-600">{profile.tagline}</p>}
              {profile.address && <p className="text-[10px] text-slate-500 leading-tight">{profile.address}</p>}
              {profile.phone && <p className="text-[10px] font-semibold text-slate-700">Tel: {profile.phone}</p>}
              {isGstEnabled && profile.gstin && <p className="text-[9px] text-slate-500">GSTIN: {profile.gstin}</p>}
              {profile.fssai && <p className="text-[9px] text-slate-500">FSSAI: {profile.fssai}</p>}
            </div>

            {/* Bill Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Bill #{bill.billNo}</span>
                <span className="uppercase">{bill.orderType}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>{formatDateTime(bill.timestamp)}</span>
                {bill.cashierId && <span>{bill.cashierId}</span>}
              </div>
              {bill.table && bill.orderType === 'Dine-in' && (
                <div className="font-semibold text-slate-800">
                  Location: {bill.table}
                </div>
              )}
              {bill.customerName && (
                <div className="text-slate-700">
                  Cust: {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1.5">
                <span>Item</span>
                <span className="text-right">Qty x Price</span>
                <span className="text-right">Amt</span>
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
                <span>Subtotal</span>
                <span className="font-mono">{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-mono">-{bill.discount.toFixed(2)}</span>
                </div>
              )}
              {isGstEnabled && bill.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST</span>
                  <span className="font-mono">{bill.tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1.5 border-t border-dashed border-slate-300">
                <span>NET TOTAL</span>
                <span className="font-mono">{formatCurrency(bill.total)}</span>
              </div>
            </div>

            {/* Payment & Status */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{bill.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold uppercase text-emerald-700">{bill.status}</span>
              </div>
            </div>

            {/* Footer Thank You */}
            <div className="text-center pt-4 pb-2 space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                Thank You! Visit Again
              </p>
              <p className="text-[9px] text-slate-400">Printed with BillFlow POS</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="no-print p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBrowserPrint}
              className="py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Browser Print</span>
            </button>

            <button
              onClick={handleBluetoothPrint}
              disabled={isPrintingBt}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span>{isPrintingBt ? 'Sending...' : 'BT Thermal Print'}</span>
            </button>
          </div>

          {/* Recipient Context Notice */}
          {(bill.customerName || bill.customerPhone) && (
            <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <span className="truncate">
                Sending to: <strong className="font-bold">{bill.customerName || 'Customer'}</strong> {bill.customerPhone ? `(${bill.customerPhone})` : ''}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-2">PDF File</span>
            </div>
          )}

          {/* Fallback download / share status message */}
          {shareStatus && (
            <div className="text-center text-xs font-semibold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200 animate-in fade-in">
              {shareStatus}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleShareWhatsAppPdf}
              disabled={isSharingPdf}
              className="py-2 px-1.5 sm:px-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 font-bold text-xs flex items-center justify-center gap-1 transition min-w-0 cursor-pointer"
              title="Share receipt as PDF via WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">{isSharingPdf ? 'Preparing...' : 'WhatsApp PDF'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2 px-1.5 sm:px-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1 transition min-w-0"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{copiedSummary ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="py-2 px-1.5 sm:px-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center justify-center gap-1 transition min-w-0"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="whitespace-nowrap font-bold">New Sale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
