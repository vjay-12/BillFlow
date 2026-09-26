import type { Bill, BusinessProfile } from '../types';

export class EscPosBuilder {
  private buffer: number[] = [];
  private charsPerLine: number;

  constructor(paperWidth: '58mm' | '80mm' = '80mm') {
    this.charsPerLine = paperWidth === '58mm' ? 32 : 48;
    this.init();
  }

  init() {
    this.buffer.push(0x1b, 0x40); // ESC @ Initialize
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean) {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean) {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str = '') {
    this.text(str);
    this.buffer.push(0x0a);
    return this;
  }

  divider(char = '-') {
    this.line(char.repeat(this.charsPerLine));
    return this;
  }

  twoColumnRow(left: string, right: string) {
    const space = this.charsPerLine - left.length - right.length;
    if (space > 0) {
      this.line(left + ' '.repeat(space) + right);
    } else {
      this.line(left);
      this.line(' '.repeat(Math.max(0, this.charsPerLine - right.length)) + right);
    }
    return this;
  }

  threeColumnRow(col1: string, col2: string, col3: string) {
    // e.g., Name (col1), Qty x Price (col2), Total (col3)
    const col3Width = 10;
    const col2Width = 12;
    const col1Width = this.charsPerLine - col2Width - col3Width;

    const c1 = col1.padEnd(col1Width).slice(0, col1Width);
    const c2 = col2.padStart(col2Width).slice(0, col2Width);
    const c3 = col3.padStart(col3Width).slice(0, col3Width);

    this.line(c1 + c2 + c3);
    return this;
  }

  feed(lines = 3) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x03);
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export function buildEscPosReceipt(bill: Bill, profile: BusinessProfile): Uint8Array {
  const builder = new EscPosBuilder(profile.paperWidth);
  const cur = profile.currencySymbol || 'Rs.';

  builder
    .alignCenter()
    .doubleSize(true)
    .bold(true)
    .line(profile.name.toUpperCase())
    .doubleSize(false)
    .bold(false);

  if (profile.tagline) {
    builder.line(profile.tagline);
  }
  if (profile.address) {
    builder.line(profile.address);
  }
  if (profile.phone) {
    builder.line(`Tel: ${profile.phone}`);
  }
  if (profile.gstin) {
    builder.line(`GSTIN: ${profile.gstin}`);
  }
  if (profile.fssai) {
    builder.line(`FSSAI: ${profile.fssai}`);
  }

  builder.divider('=');
  builder.alignLeft();
  builder.twoColumnRow(`Bill No: #${bill.billNo}`, `${bill.orderType}`);
  builder.twoColumnRow(`Date: ${new Date(bill.timestamp).toLocaleDateString('en-IN')}`, `${new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  if (bill.table && bill.orderType === 'Dine-in') {
    builder.line(`Table / Location: ${bill.table}`);
  }
  if (bill.customerName) {
    builder.line(`Customer: ${bill.customerName} (${bill.customerPhone || ''})`);
  }
  builder.divider('-');

  // Header
  builder.bold(true);
  builder.threeColumnRow('ITEM', 'QTY x RATE', 'AMOUNT');
  builder.bold(false);
  builder.divider('-');

  // Lines
  for (const item of bill.lines) {
    builder.threeColumnRow(
      item.name,
      `${item.qty} x ${item.price}`,
      `${(item.qty * item.price).toFixed(2)}`
    );
    if (item.note) {
      builder.line(`  * ${item.note}`);
    }
  }

  builder.divider('-');
  builder.alignRight();
  builder.twoColumnRow('Subtotal:', `${cur} ${bill.subtotal.toFixed(2)}`);
  if (bill.discount > 0) {
    builder.twoColumnRow('Discount:', `-${cur} ${bill.discount.toFixed(2)}`);
  }
  if (bill.tax > 0) {
    builder.twoColumnRow('Tax (GST):', `${cur} ${bill.tax.toFixed(2)}`);
  }
  builder.divider('=');

  builder.bold(true).doubleSize(true);
  builder.twoColumnRow('TOTAL:', `${cur} ${bill.total.toFixed(2)}`);
  builder.doubleSize(false).bold(false);
  builder.divider('=');

  builder.alignLeft();
  builder.twoColumnRow(`Payment Mode:`, bill.paymentMode.toUpperCase());
  builder.twoColumnRow(`Status:`, bill.status.toUpperCase());

  builder.alignCenter().feed(1);
  builder.line('*** THANK YOU! VISIT AGAIN ***');
  builder.line('Powered by BillFlow');
  builder.feed(3);
  builder.cut();

  return builder.getBytes();
}
