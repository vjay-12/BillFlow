import type { Bill, BusinessProfile } from '../types';

/**
 * Normalizes an Indian phone number to 91XXXXXXXXXX format.
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Builds a clean, reliable WhatsApp text receipt message.
 * - Bold business header using *asterisks* (no unreliable box-drawing characters).
 * - Standard hyphen section dividers (----------------------------) that render cleanly on all devices.
 * - Monospace fixed-width table (```) sized strictly to 28 characters to prevent mid-row line wrapping on mobile.
 * - Bold NET TOTAL and PAID/UNPAID status.
 * - Strictly respects the GST visibility setting (omits tax line entirely when disabled).
 * - Closing thank you and italicized Powered by BillFlow POS.
 */
export function buildWhatsAppReceiptMessage(
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): string {
  const lines = bill.lines;
  const DIVIDER = '----------------------------';

  // Store Header (bold name + tagline, no box drawing)
  const storeName = (profile.name || 'PASUMAI CAFE').toUpperCase();
  const tagline = profile.tagline || '';

  // Date and Time formatting
  const dateStr =
    new Date(bill.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    new Date(bill.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  // Bill metadata section
  let meta = `🧾 *Bill #${bill.billNo}* • ${(bill.orderType || 'ORDER').toUpperCase()}\n`;
  meta += `📅 ${dateStr}\n`;
  if (bill.table && bill.orderType === 'Dine-in') {
    meta += `📍 Table: ${bill.table}\n`;
  }
  if (bill.customerName) {
    meta += `👤 Customer: ${bill.customerName}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}\n`;
  }

  // Monospace itemized section strictly sized to 28 characters to fit mobile WhatsApp bubbles without wrapping
  // Column allocation: Item Name (14) + Space (1) + Qty/Rate (6) + Space (1) + Amount (6) = 28 chars
  const nameColWidth = 14;
  const qtyColWidth = 6;
  const amtColWidth = 6;

  let itemized = '```\n';
  itemized +=
    'ITEM'.padEnd(nameColWidth) +
    ' ' +
    'QTY'.padStart(qtyColWidth) +
    ' ' +
    'AMT'.padStart(amtColWidth) +
    '\n';
  itemized += DIVIDER + '\n';

  for (const item of lines) {
    let name = item.name;
    if (name.length > nameColWidth) {
      name = name.slice(0, nameColWidth - 1) + '…';
    }
    const namePadded = name.padEnd(nameColWidth);
    const qtyRate = `${item.qty}x${item.price}`.padStart(qtyColWidth);
    const amt = (item.qty * item.price).toFixed(2).padStart(amtColWidth);
    itemized += `${namePadded} ${qtyRate} ${amt}\n`;

    if (item.note) {
      itemized += ` * ${item.note}\n`;
    }
  }
  itemized += '```';

  // Subtotal, Discount, and GST totals breakdown
  let totals = `Subtotal: ₹${bill.subtotal.toFixed(2)}\n`;
  if (bill.discount > 0) {
    totals += `Discount: -₹${bill.discount.toFixed(2)}\n`;
  }
  // Strictly omit GST line if GST calculation is disabled or tax is 0
  if (isGstEnabled && bill.tax > 0) {
    totals += `GST: ₹${bill.tax.toFixed(2)}\n`;
  }
  totals += `*NET TOTAL: ₹${bill.total.toFixed(2)}*`;

  // Payment mode and bold status with emoji
  const isPaid = (bill.status || '').toLowerCase() === 'paid';
  const statusEmoji = isPaid ? '✅ ' : '⏳ ';
  const statusText = isPaid ? '*PAID*' : '*UNPAID*';
  const paymentSection =
    `💳 Mode: ${(bill.paymentMode || 'Cash').toUpperCase()}\n` +
    `${statusEmoji}Status: ${statusText}`;

  // Footer thank you note and powered by signature in italics
  const footer = '🌿 Thank you, visit again! 🙏\n_Powered by BillFlow POS_';

  const parts = [
    `*${storeName}*`,
    tagline,
    '',
    meta.trimEnd(),
    DIVIDER,
    itemized,
    DIVIDER,
    totals,
    DIVIDER,
    paymentSection,
    '',
    footer,
  ];

  return parts.filter((p, i) => i === 2 || i === parts.length - 2 || Boolean(p)).join('\n');
}

/**
 * Builds the direct wa.me link with URL-encoded text.
 */
export function buildWhatsAppReceiptUrl(
  phone: string,
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const message = buildWhatsAppReceiptMessage(bill, profile, isGstEnabled);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
