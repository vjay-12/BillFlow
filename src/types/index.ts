export interface Item {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  taxPercent?: number;
  isVeg?: boolean;
  active: boolean; // archived = false
  photoUrl?: string;
}

export interface BillLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  taxPercent?: number;
  note?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Credit';
export type BillStatus = 'Paid' | 'Unpaid' | 'Cancelled';
export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery';

export interface Bill {
  id: string;
  billNo: number;
  timestamp: number;
  lines: BillLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: PaymentMode;
  status: BillStatus;
  table?: string;
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierId?: string;
  cancelReason?: string;
  synced: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstanding: number;
  loyaltyPoints: number;
  createdAt: number;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin?: string;
  fssai?: string;
  currencySymbol: string;
  defaultTaxPercent: number;
  paperWidth: '58mm' | '80mm';
  printerBluetoothName?: string;
  upiId?: string;
}

export type ActiveTab = 'billing' | 'history' | 'items' | 'customers' | 'reports' | 'settings';
