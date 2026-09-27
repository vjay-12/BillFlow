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
 * Builds a beautifully formatted WhatsApp text receipt message.
 * - Uses Unicode box-drawing characters (┌─┐│└─┘ and ─) for the store header.
 * - Bold with asterisks on business name, NET TOTAL, and PAID/UNPAID status.
 * - Monospace fixed-width table (```) with dynamic space-padding for line items.
 * - Strictly respects the GST visibility setting (omits tax line entirely when disabled).
 * - Closes with warm thank you note and italicized Powered by BillFlow POS.
 */
export function buildWhatsAppReceiptMessage(
  bill: Bill,
  profile: BusinessProfile,
  isGstEnabled: boolean = true
): string {
  const lines = bill.lines;

  // Compute dynamic column widths based on the longest item name in this bill
  const maxItemLen = lines.length > 0 ? Math.max(...lines.map((l) => l.name.length), 4) : 4;
  const nameColWidth = Math.min(Math.max(maxItemLen, 12), 20);
  const qtyColWidth = 11; // e.g. "QTY x PRICE" (11 chars) or "     2 x 85"
  const amtColWidth = 7;  // e.g. " AMOUNT" (6 chars) or " 170.00" (7 chars)
  const totalMonospaceWidth = nameColWidth + 1 + qtyColWidth + 1 + amtColWidth;

  // Box-drawing bordered header block
  const storeName = (profile.name || 'PASUMAI CAFE').toUpperCase();
  const tagline = profile.tagline || 'Pure Organic Vegetarian Kitchen';
  const boxInnerWidth = Math.max(storeName.length + 8, tagline.length + 4, totalMonospaceWidth - 2, 34);

  const padCenter = (str: string, targetLen: number) => {
    const padTotal = Math.max(0, targetLen - str.length);
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;
    return ' '.repeat(padLeft) + str + ' '.repeat(padRight);
  };

  const topBorder = '┌' + '─'.repeat(boxInnerWidth) + '┐';
  const bottomBorder = '└' + '─'.repeat(boxInnerWidth) + '┘';
  const nameLine = '│' + padCenter(`*${storeName}*`, boxInnerWidth) + '│';
  const taglineLine = tagline ? '│' + padCenter(tagline, boxInnerWidth) + '│' : '';

  const dividerWidth = Math.max(boxInnerWidth + 2, totalMonospaceWidth);
  const divider = '─'.repeat(dividerWidth);

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

  // Monospace itemized section wrapped in triple backticks
  let itemized = '```\n';
  itemized +=
    'ITEM'.padEnd(nameColWidth) +
    ' ' +
    'QTY x PRICE'.padStart(qtyColWidth) +
    ' ' +
    'AMOUNT'.padStart(amtColWidth) +
    '\n';
  itemized += '─'.repeat(totalMonospaceWidth) + '\n';

  for (const item of lines) {
    let name = item.name;
    if (name.length > nameColWidth) {
      name = name.slice(0, nameColWidth - 1) + '…';
    }
    const namePadded = name.padEnd(nameColWidth);
    const qtyRate = `${item.qty} x ${item.price}`.padStart(qtyColWidth);
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

  return [
    topBorder,
    nameLine,
    ...(taglineLine ? [taglineLine] : []),
    bottomBorder,
    '',
    meta.trimEnd(),
    divider,
    itemized,
    divider,
    totals,
    divider,
    paymentSection,
    '',
    footer,
  ].join('\n');
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
