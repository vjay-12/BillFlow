import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Printer, 
  Ban, 
  FileText, 
  Banknote, 
  QrCode, 
  CheckCircle,
  XCircle,
  X,
  ChevronRight,
  Download,
  Clock,
  User
} from 'lucide-react';
import { db, INITIAL_BUSINESS_PROFILE } from '../../db/schema';
import { billsRepo } from '../../db/billsRepo';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import { downloadReceiptPdf } from '../../lib/pdfReceipt';
import { formatCurrency, formatDateTime, formatShortDateTime } from '../../lib/formatters';
import type { Bill } from '../../types';

export const BillList: React.FC = () => {
  const { t } = useTranslation();
  const { setActiveBillForReceipt, setIsReceiptModalOpen } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | 'Cash' | 'UPI'>('All');
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const profile = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  const isCartGstEnabled = useCartStore((s) => s.isGstEnabled);
  const isGstEnabled = isCartGstEnabled && profile?.enableGst !== false;

  const bills = useLiveQuery(async () => {
    const all = await db.bills.orderBy('timestamp').reverse().toArray();
    return all.filter((b) => {
      if (filterMode !== 'All' && b.paymentMode !== filterMode) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchNo = b.billNo.toString().includes(term);
      const matchCust = b.customerName?.toLowerCase().includes(term);
      const matchTable = b.table?.toLowerCase().includes(term);
      const matchMode = b.paymentMode.toLowerCase().includes(term);
      return matchNo || matchCust || matchTable || matchMode;
    });
  }, [searchTerm, filterMode]);

  const handlePrint = (bill: Bill) => {
    setActiveBillForReceipt(bill);
    setIsReceiptModalOpen(true);
  };

  const handleDownloadPdf = (bill: Bill) => {
    try {
      setIsDownloadingPdf(true);
      downloadReceiptPdf(
        bill,
        profile || INITIAL_BUSINESS_PROFILE,
        isGstEnabled
      );
      setShareStatus(t('history.pdfDownloaded'));
      setTimeout(() => setShareStatus(null), 4000);
    } catch (err: any) {
      alert(t('history.failedToDownloadPdf', { message: err.message }));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCancel = async (bill: Bill) => {
    if (bill.status === 'Cancelled') {
      alert(t('history.alreadyCancelled'));
      return;
    }
    const reason = prompt(t('history.enterCancelReason'), t('history.defaultCancelReason'));
    if (!reason) return;

    try {
      await billsRepo.cancelBill(bill.id, reason);
      alert(t('history.billCancelledAlert', { billNo: bill.billNo }));
      const updated = await billsRepo.getById(bill.id);
      if (updated) {
        setSelectedBillForDetail(updated);
      } else {
        setSelectedBillForDetail(null);
      }
    } catch (err: any) {
      alert(t('history.failedToCancel', { message: err.message }));
    }
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      await billsRepo.markAsPaid(bill.id);
      alert(t('history.billMarkedPaidAlert', { billNo: bill.billNo }));
      const updated = await billsRepo.getById(bill.id);
      if (updated) {
        setSelectedBillForDetail(updated);
      }
    } catch (err: any) {
      alert(t('history.failedToMarkPaid', { message: err.message }));
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'UPI':
        return <QrCode className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            {t('history.title')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('history.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          {/* Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 font-semibold text-slate-700"
          >
            <option value="All">{t('history.allPayments')}</option>
            <option value="Cash">{t('history.cash')}</option>
            <option value="UPI">{t('history.upi')}</option>
          </select>
        </div>
      </div>

      {/* Mobile count / label */}
      <div className="md:hidden flex items-center justify-between px-1 text-xs text-slate-500 font-bold">
        <span>{t('history.recentBills')}</span>
        <span>{bills ? t('history.billsCount', { count: bills.length }) : t('history.billsCount', { count: 0 })}</span>
      </div>

      {/* Bills Container */}
      {bills && bills.length > 0 ? (
        <>
          {/* MOBILE VIEW: Single-column stacked row layout (no horizontal scroll) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-[#3D2C20] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {bills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => setSelectedBillForDetail(bill)}
                className="p-3.5 hover:bg-slate-50 active:bg-slate-100/80 transition cursor-pointer flex items-center justify-between gap-2.5 group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Top line: Bill number on left, Total amount on right */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{bill.billNo}
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-base">
                      {formatCurrency(bill.total)}
                    </span>
                  </div>

                  {/* Second line: Status badge + Payment mode */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {bill.status === 'Paid' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t('history.paid')}</span>
                      </span>
                    )}
                    {bill.status === 'Unpaid' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>{t('history.unpaid')}</span>
                      </span>
                    )}
                    {bill.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>{t('history.cancelled')}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[10px]">
                      {getModeIcon(bill.paymentMode)}
                      <span>{bill.paymentMode === 'Cash' ? t('history.cash') : bill.paymentMode === 'UPI' ? t('history.upi') : bill.paymentMode}</span>
                    </span>
                  </div>

                  {/* Third line: Date & time in shortened format + Order type tag */}
                  <div className="flex items-center gap-2 text-slate-500 text-xs flex-wrap">
                    <span className="text-[11px] font-medium text-slate-500">
                      {formatShortDateTime(bill.timestamp)}
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {bill.orderType === 'Dine-in' ? t('cart.dineIn') : t('cart.takeaway')}{bill.table ? ` (${bill.table})` : ''}
                    </span>
                  </div>

                  {/* Fourth line (optional): Customer name and phone number */}
                  {bill.customerName && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-0.5 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{bill.customerName}</span>
                      {bill.customerPhone && (
                        <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                          ({bill.customerPhone})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Visible tap affordance: subtle chevron on the right edge */}
                <div className="shrink-0 text-slate-300 group-hover:text-slate-500 group-active:text-slate-700 transition pl-1">
                  <ChevronRight className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP/TABLET VIEW: Structured table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t('history.billNo')}</th>
                    <th className="py-3 px-4">{t('history.dateTime')}</th>
                    <th className="py-3 px-4">{t('history.orderType')}</th>
                    <th className="py-3 px-4">{t('history.customer')}</th>
                    <th className="py-3 px-4">{t('history.payment')}</th>
                    <th className="py-3 px-4 text-right">{t('history.total')}</th>
                    <th className="py-3 px-4 text-center">{t('history.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#3D2C20] font-medium text-slate-700">
                  {bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedBillForDetail(bill)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{bill.billNo}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(bill.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{bill.orderType === 'Dine-in' ? t('cart.dineIn') : t('cart.takeaway')}</span>
                        {bill.table && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {bill.table}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {bill.customerName ? (
                          <div>
                            <span className="font-bold text-slate-800">{bill.customerName}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {bill.customerPhone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('history.walkIn')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-800 text-[11px]">
                          {getModeIcon(bill.paymentMode)}
                          {bill.paymentMode === 'Cash' ? t('history.cash') : bill.paymentMode === 'UPI' ? t('history.upi') : bill.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatCurrency(bill.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bill.status === 'Paid' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> {t('history.paid')}
                          </span>
                        )}
                        {bill.status === 'Unpaid' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3" /> {t('history.unpaid')}
                          </span>
                        )}
                        {bill.status === 'Cancelled' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3" /> {t('history.cancelled')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <FileText className="w-12 h-12 stroke-[1.2] text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600">{t('history.noBillsFound')}</p>
          <p className="text-xs text-slate-400 mt-1">
            {t('history.noBillsSub')}
          </p>
        </div>
      )}

      {/* Bill Detail Drawer / Modal */}
      {selectedBillForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('history.billDetails', { billNo: selectedBillForDetail.billNo })}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {formatDateTime(selectedBillForDetail.timestamp)}
                </span>
              </div>
              <button
                onClick={() => setSelectedBillForDetail(null)}
                aria-label="Close details"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('history.orderTypeLabel')}</span>
                  <span className="font-bold text-slate-800">
                    {selectedBillForDetail.orderType === 'Dine-in' ? t('cart.dineIn') : t('cart.takeaway')}{' '}
                    {selectedBillForDetail.table ? `(${selectedBillForDetail.table})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('history.paymentModeLabel')}</span>
                  <span className="font-bold text-slate-800">
                    {selectedBillForDetail.paymentMode === 'Cash' ? t('history.cash') : selectedBillForDetail.paymentMode === 'UPI' ? t('history.upi') : selectedBillForDetail.paymentMode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('history.statusLabel')}</span>
                  <div>
                    {selectedBillForDetail.status === 'Paid' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> {t('history.paid')}
                      </span>
                    )}
                    {selectedBillForDetail.status === 'Unpaid' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3" /> {t('history.unpaid')}
                      </span>
                    )}
                    {selectedBillForDetail.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3" /> {t('history.cancelled')}
                      </span>
                    )}
                  </div>
                </div>
                {selectedBillForDetail.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('history.customerLabel')}</span>
                    <span className="font-bold text-slate-800">
                      {selectedBillForDetail.customerName}{' '}
                      {selectedBillForDetail.customerPhone ? `(${selectedBillForDetail.customerPhone})` : ''}
                    </span>
                  </div>
                )}
                {selectedBillForDetail.cancelReason && (
                  <div className="flex justify-between text-rose-600 pt-1 border-t border-rose-100">
                    <span className="font-semibold">{t('history.cancelReasonLabel')}</span>
                    <span>{selectedBillForDetail.cancelReason}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  {t('history.orderedItems')}
                </h4>
                <div className="space-y-1 divide-y divide-slate-100 dark:divide-[#3D2C20]">
                  {selectedBillForDetail.lines.map((l, i) => (
                    <div key={i} className="flex justify-between pt-1 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{l.name}</span>
                        <span className="text-slate-400 text-[10px] block">
                          {l.qty} × {formatCurrency(l.price)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(l.qty * l.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{t('history.subtotalLabel')}</span>
                  <span className="font-mono">{formatCurrency(selectedBillForDetail.subtotal)}</span>
                </div>
                {selectedBillForDetail.discount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>{t('history.discountLabel')}</span>
                    <span className="font-mono">
                      -{formatCurrency(selectedBillForDetail.discount)}
                    </span>
                  </div>
                )}
                {isGstEnabled && selectedBillForDetail.tax > 0 && (
                  <div className="flex justify-between">
                    <span>{t('history.gstLabel')}</span>
                    <span className="font-mono">{formatCurrency(selectedBillForDetail.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>{t('history.netTotalLabel')}</span>
                  <span className="font-mono text-teal-800">
                    {formatCurrency(selectedBillForDetail.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions on Detail Modal */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              {shareStatus && (
                <div className="text-center text-xs font-semibold text-emerald-800 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200 animate-in fade-in">
                  {shareStatus}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {/* Reprint button (always visible) */}
                <button
                  onClick={() => handlePrint(selectedBillForDetail)}
                  className="py-2.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('history.reprint')}</span>
                </button>

                {/* Download PDF button (always visible) */}
                <button
                  onClick={() => handleDownloadPdf(selectedBillForDetail)}
                  disabled={isDownloadingPdf}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  title={t('history.downloadPdf')}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? t('history.downloadingPdf') : t('history.downloadPdf')}</span>
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedBillForDetail.status === 'Unpaid' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedBillForDetail)}
                    className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t('history.markAsPaid')}</span>
                  </button>
                )}

                {selectedBillForDetail.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancel(selectedBillForDetail)}
                    className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{t('history.cancelBill')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
