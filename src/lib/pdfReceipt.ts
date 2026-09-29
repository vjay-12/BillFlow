import { jsPDF } from 'jspdf';
import type { Bill, BusinessProfile } from '../types';
import { formatDateTime } from './formatters';

/**
 * Generate an authentic thermal-receipt styled PDF document.
 * Adheres strictly to POS thermal receipt dimensions (80mm width)
 * and formats all business, line-item, tax, and payment information cleanly.
 */
export function generateReceiptPdf(
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): jsPDF {
  // Pre-calculate receipt height to keep it on a single continuous thermal slip
  let calculatedHeight = 120; // baseline height
  calculatedHeight += bill.lines.length * 7;
  if (profile.tagline) calculatedHeight += 5;
  if (profile.address) calculatedHeight += 8;
  if (profile.phone) calculatedHeight += 5;
  if (isGstEnabled && profile.gstin) calculatedHeight += 5;
  if (profile.fssai) calculatedHeight += 5;
  if (bill.table && bill.orderType === 'Dine-in') calculatedHeight += 5;
  if (bill.customerName) calculatedHeight += 5;
  if (bill.discount > 0) calculatedHeight += 5;
  if (isGstEnabled && bill.tax > 0) calculatedHeight += 5;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(120, calculatedHeight)],
  });

  const leftX = 6;
  const rightX = 74;
  const centerX = 40;
  let y = 8;

  const divider = (char: string = '-') => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    // Draw clean horizontal dashed/dotted line
    doc.text(char.repeat(42), centerX, y, { align: 'center' });
    doc.setTextColor(20, 20, 20);
    y += 4;
  };

  // 1. Business Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((profile.name || 'PASUMAI CAFE').toUpperCase(), centerX, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600

  if (profile.tagline) {
    doc.text(profile.tagline, centerX, y, { align: 'center' });
    y += 3.8;
  }

  if (profile.address) {
    const addressLines = doc.splitTextToSize(profile.address, 68);
    for (const line of addressLines) {
      doc.text(line, centerX, y, { align: 'center' });
      y += 3.5;
    }
  }

  if (profile.phone) {
    doc.text(`Tel: ${profile.phone}`, centerX, y, { align: 'center' });
    y += 3.8;
  }

  // Only display GSTIN if GST is enabled in settings
  if (isGstEnabled && profile.gstin) {
    doc.text(`GSTIN: ${profile.gstin}`, centerX, y, { align: 'center' });
    y += 3.8;
  }

  if (profile.fssai) {
    doc.text(`FSSAI: ${profile.fssai}`, centerX, y, { align: 'center' });
    y += 3.8;
  }

  y += 1;
  divider('-');

  // 2. Bill & Order Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Bill #${bill.billNo}`, leftX, y);
  doc.text((bill.orderType || 'ORDER').toUpperCase(), rightX, y, { align: 'right' });
  y += 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(formatDateTime(bill.timestamp), leftX, y);
  if (bill.cashierId) {
    doc.text(bill.cashierId, rightX, y, { align: 'right' });
  }
  y += 3.8;

  if (bill.table && bill.orderType === 'Dine-in') {
    doc.text(`Table / Location: ${bill.table}`, leftX, y);
    y += 3.8;
  }

  if (bill.customerName) {
    const custInfo = `Cust: ${bill.customerName}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}`;
    doc.text(custInfo, leftX, y);
    y += 3.8;
  }

  y += 1;
  divider('-');

  // 3. Line Items Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('ITEM', leftX, y);
  doc.text('QTY x RATE', 46, y);
  doc.text('AMT', rightX, y, { align: 'right' });
  y += 3.5;
  divider('.');

  // 4. Line Items Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  for (const line of bill.lines) {
    const lineTotal = (line.qty * line.price).toFixed(2);
    const itemName = line.name.length > 20 ? line.name.substring(0, 19) + '…' : line.name;

    doc.text(itemName, leftX, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${line.qty} x ${line.price}`, 46, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(lineTotal, rightX, y, { align: 'right' });
    y += 4.2;

    if (line.note) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`* ${line.note}`, leftX + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      y += 3.5;
    }
  }

  y += 1;
  divider('-');

  // 5. Pricing Totals Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text('Subtotal:', leftX, y);
  doc.text(`Rs. ${bill.subtotal.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 4;

  if (bill.discount > 0) {
    doc.text('Discount:', leftX, y);
    doc.text(`-Rs. ${bill.discount.toFixed(2)}`, rightX, y, { align: 'right' });
    y += 4;
  }

  // Only display GST if GST is enabled and tax > 0
  if (isGstEnabled && bill.tax > 0) {
    doc.text('GST:', leftX, y);
    doc.text(`Rs. ${bill.tax.toFixed(2)}`, rightX, y, { align: 'right' });
    y += 4;
  }

  divider('=');

  // NET TOTAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NET TOTAL:', leftX, y);
  doc.text(`Rs. ${bill.total.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 5.5;

  divider('-');

  // 6. Payment & Status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Mode: ${(bill.paymentMode || 'Cash').toUpperCase()}`, leftX, y);
  y += 3.8;
  doc.text(`Status: ${(bill.status || 'Paid').toUpperCase()}`, leftX, y);
  y += 4.5;

  divider('-');

  // 7. Footer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Thank You! Visit Again', centerX, y, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Printed with BillFlow POS', centerX, y, { align: 'center' });

  return doc;
}

/**
 * Share receipt PDF file via native Web Share API (with files array)
 * Falls back to direct PDF download if file sharing is unsupported.
 */
export async function shareReceiptPdf(
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): Promise<{ success: boolean; method: 'share' | 'download' | 'cancelled'; message?: string }> {
  try {
    const doc = generateReceiptPdf(bill, profile, isGstEnabled);
    const pdfBlob = doc.output('blob');
    const safeStoreName = (profile.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Bill_${bill.billNo}_${safeStoreName}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Check if navigator.share and file sharing are supported by device
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] });

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Receipt #${bill.billNo} - ${profile.name}`,
          text: `Receipt #${bill.billNo} from ${profile.name} (Total: Rs. ${bill.total.toFixed(2)})`,
        });
        return { success: true, method: 'share' };
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: false, method: 'cancelled', message: 'Share sheet dismissed.' };
        }
        // If native share threw an unexpected error, download file as fallback
        doc.save(fileName);
        return {
          success: true,
          method: 'download',
          message: 'PDF downloaded! You can attach it directly in WhatsApp.',
        };
      }
    } else {
      // Fallback: download directly so staff can attach to customer in WhatsApp
      doc.save(fileName);
      return {
        success: true,
        method: 'download',
        message: 'PDF downloaded! You can attach it directly in WhatsApp.',
      };
    }
  } catch (err: any) {
    console.error('Error generating/sharing PDF receipt:', err);
    return { success: false, method: 'download', message: err.message || 'Failed to generate PDF.' };
  }
}

/**
 * Directly download receipt PDF file to user's device Downloads folder.
 */
export function downloadReceiptPdf(
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): { success: boolean; fileName: string } {
  const doc = generateReceiptPdf(bill, profile, isGstEnabled);
  const safeStoreName = (profile.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bill_${bill.billNo}_${safeStoreName}.pdf`;
  doc.save(fileName);
  return { success: true, fileName };
}

