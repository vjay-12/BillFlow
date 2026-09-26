import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Printer, 
  Ban, 
  FileText, 
  Banknote, 
  QrCode, 
  CreditCard, 
  BookUser,
  CheckCircle,
  XCircle,
  X,
  ChevronRight,
  Share2,
  Clock,
  User
} from 'lucide-react';
import { db } from '../../db/schema';
import { billsRepo } from '../../db/billsRepo';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDateTime, formatShortDateTime } from '../../lib/formatters';
import type { Bill, PaymentMode } from '../../types';

export const BillList: React.FC = () => {
  const { setActiveBillForReceipt, setIsReceiptModalOpen } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | PaymentMode>('All');
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);

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

  const handleShareWhatsApp = (bill: Bill) => {
    const itemsList = bill.lines
      .map((l) => `• ${l.name} x${l.qty} - ${formatCurrency(l.qty * l.price)}`)
      .join('\n');
    const message = `*Pasumai Cafe - Bill #${bill.billNo}*\nDate: ${formatDateTime(bill.timestamp)}\nType: ${bill.orderType}${bill.table ? ` (${bill.table})` : ''}\n------------------\n${itemsList}\n------------------\nTotal: ${formatCurrency(bill.total)}\nStatus: ${bill.status}\n\nThank you for visiting!`;

    const rawPhone = bill.customerPhone ? bill.customerPhone.replace(/[^0-9]/g, '') : '';
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCancel = async (bill: Bill) => {
    if (bill.status === 'Cancelled') {
      alert('This bill is already cancelled.');
      return;
    }
    const reason = prompt('Please enter cancellation reason:', 'Customer changed mind');
    if (!reason) return;

    try {
      await billsRepo.cancelBill(bill.id, reason);
      alert(`Bill #${bill.billNo} cancelled.`);
      const updated = await billsRepo.getById(bill.id);
      if (updated) {
        setSelectedBillForDetail(updated);
      } else {
        setSelectedBillForDetail(null);
      }
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      await billsRepo.markAsPaid(bill.id);
      alert(`Bill #${bill.billNo} marked as Paid.`);
      const updated = await billsRepo.getById(bill.id);
      if (updated) {
        setSelectedBillForDetail(updated);
      }
    } catch (err: any) {
      alert(`Failed to mark as paid: ${err.message}`);
    }
  };

  const getModeIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'UPI':
        return <QrCode className="w-3.5 h-3.5 text-sky-600" />;
      case 'Card':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Credit':
        return <BookUser className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Orders & Bills History
          </h2>
          <p className="text-xs text-slate-500">
            View settled transactions, reprint receipts, and manage order voids
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bill # or customer..."
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
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
      </div>

      {/* Mobile count / label */}
      <div className="md:hidden flex items-center justify-between px-1 text-xs text-slate-500 font-bold">
        <span>Recent Bills</span>
        <span>{bills ? `${bills.length} bills` : '0 bills'}</span>
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
                        <span>Paid</span>
                      </span>
                    )}
                    {bill.status === 'Unpaid' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Unpaid</span>
                      </span>
                    )}
                    {bill.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>Cancelled</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[10px]">
                      {getModeIcon(bill.paymentMode)}
                      <span>{bill.paymentMode}</span>
                    </span>
                  </div>

                  {/* Third line: Date & time in shortened format + Order type tag */}
                  <div className="flex items-center gap-2 text-slate-500 text-xs flex-wrap">
                    <span className="text-[11px] font-medium text-slate-500">
                      {formatShortDateTime(bill.timestamp)}
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {bill.orderType}{bill.table ? ` (${bill.table})` : ''}
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
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Order Type</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                        <span className="font-semibold text-slate-800">{bill.orderType}</span>
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
                          <span className="text-slate-400 italic">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-800 text-[11px]">
                          {getModeIcon(bill.paymentMode)}
                          {bill.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatCurrency(bill.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bill.status === 'Paid' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        )}
                        {bill.status === 'Unpaid' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                        {bill.status === 'Cancelled' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePrint(bill)}
                            title="Print / View Receipt"
                            className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {bill.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancel(bill)}
                              title="Cancel / Void Bill"
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
          <p className="font-semibold text-slate-600">No bills found</p>
          <p className="text-xs text-slate-400 mt-1">
            Complete sales in the Billing tab to generate transaction records.
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
                  Bill #{selectedBillForDetail.billNo} Details
                </h3>
                <span className="text-[11px] text-slate-500">
                  {formatDateTime(selectedBillForDetail.timestamp)}
                </span>
              </div>
              <button
                onClick={() => setSelectedBillForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Type:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBillForDetail.orderType}{' '}
                    {selectedBillForDetail.table ? `(${selectedBillForDetail.table})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBillForDetail.paymentMode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <div>
                    {selectedBillForDetail.status === 'Paid' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    )}
                    {selectedBillForDetail.status === 'Unpaid' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                        <Clock className="w-3 h-3" /> Unpaid
                      </span>
                    )}
                    {selectedBillForDetail.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </div>
                </div>
                {selectedBillForDetail.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold text-slate-800">
                      {selectedBillForDetail.customerName}{' '}
                      {selectedBillForDetail.customerPhone ? `(${selectedBillForDetail.customerPhone})` : ''}
                    </span>
                  </div>
                )}
                {selectedBillForDetail.cancelReason && (
                  <div className="flex justify-between text-rose-600 pt-1 border-t border-rose-100">
                    <span className="font-semibold">Cancel Reason:</span>
                    <span>{selectedBillForDetail.cancelReason}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Ordered Items
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
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedBillForDetail.subtotal)}</span>
                </div>
                {selectedBillForDetail.discount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Discount:</span>
                    <span className="font-mono">
                      -{formatCurrency(selectedBillForDetail.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span className="font-mono">{formatCurrency(selectedBillForDetail.tax)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Total:</span>
                  <span className="font-mono text-teal-800">
                    {formatCurrency(selectedBillForDetail.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions on Detail Modal */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Reprint button (always visible) */}
                <button
                  onClick={() => handlePrint(selectedBillForDetail)}
                  className="py-2.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reprint</span>
                </button>

                {/* Share / WhatsApp button (always visible) */}
                <button
                  onClick={() => handleShareWhatsApp(selectedBillForDetail)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share / WhatsApp</span>
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedBillForDetail.status === 'Unpaid' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedBillForDetail)}
                    className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark as Paid</span>
                  </button>
                )}

                {selectedBillForDetail.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancel(selectedBillForDetail)}
                    className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Bill</span>
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
