import Dexie, { type Table } from 'dexie';
import type { Item, Bill, Customer, BusinessProfile } from '../types';

export interface SyncQueueItem {
  id: string;
  entity: 'item' | 'bill' | 'customer';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

export class BillFlowDatabase extends Dexie {
  items!: Table<Item, string>;
  bills!: Table<Bill, string>;
  customers!: Table<Customer, string>;
  businessProfile!: Table<BusinessProfile, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('BillFlowDB');
    this.version(1).stores({
      items: 'id, name, code, category, active, isVeg',
      bills: 'id, billNo, timestamp, paymentMode, status, customerId, synced',
      customers: 'id, name, phone, outstanding',
      businessProfile: 'id',
      syncQueue: 'id, entity, timestamp, status',
    });
  }
}

export const db = new BillFlowDatabase();

// Pasumai Cafe - 100% Organic Food (Millet-focused)
export const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  name: 'Pasumai Cafe',
  tagline: '100% organic food since 2012',
  address: 'No. 42, Natural Millet Hub, Green Road',
  phone: '+91 94432 10987',
  gstin: '33ABCDE1234F1Z5',
  fssai: '12423000000000',
  currencySymbol: '₹',
  defaultTaxPercent: 5,
  enableGst: true,
  paperWidth: '80mm',
  upiId: 'pasumaicafe@oksbi',
  printerBluetoothName: 'Pasumai Thermal 80mm',
};

export const INITIAL_ITEMS: Item[] = [
  // --- TIFFIN ---
  { id: 'tif-1', name: 'Medhu Vadai (1)', code: 'TIF01', category: 'Tiffin', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-2', name: 'Millet Idli (2)', code: 'TIF02', category: 'Tiffin', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-3', name: 'Sambar Vadai (1)', code: 'TIF03', category: 'Tiffin', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-4', name: 'Millet Podi Idli', code: 'TIF04', category: 'Tiffin', price: 50, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-5', name: 'Beetroot Poori', code: 'TIF05', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-6', name: 'Millet Plain Dosa', code: 'TIF06', category: 'Tiffin', price: 50, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-7', name: 'Millet Sambar Idli', code: 'TIF07', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-8', name: 'Millet Idiyappam', code: 'TIF08', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-9', name: 'Millet Masala Dosa', code: 'TIF09', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-10', name: 'Millet Podi Dosa', code: 'TIF10', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-11', name: 'Millet Uthappam', code: 'TIF11', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-12', name: 'Wheat Pongal', code: 'TIF12', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-13', name: 'Millet Pongal', code: 'TIF13', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-14', name: 'Millet Onion Dosa', code: 'TIF14', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-15', name: 'Millet Garlic Dosa', code: 'TIF15', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-16', name: 'Millet Rava Dosa', code: 'TIF16', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-17', name: 'Millet Ghee Dosa', code: 'TIF17', category: 'Tiffin', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-18', name: 'Millet Paneer Dosa', code: 'TIF18', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-19', name: 'Millet Mushroom Dosa', code: 'TIF19', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },

  // --- LUNCH ---
  { id: 'lun-1', name: 'Gobi 65', code: 'LUN01', category: 'Lunch', price: 40, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-2', name: 'Millet Sambar Rice', code: 'LUN02', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-3', name: 'Millet Curd Rice', code: 'LUN03', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-4', name: 'Mushroom 65', code: 'LUN04', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-5', name: 'Ragi Kali', code: 'LUN05', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-6', name: 'Normal Meals', code: 'LUN06', category: 'Lunch', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-7', name: 'Mushroom Briyani', code: 'LUN07', category: 'Lunch', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-8', name: 'Millet Meals', code: 'LUN08', category: 'Lunch', price: 110, taxPercent: 5, isVeg: true, active: true },

  // --- SNACKS ---
  { id: 'snk-1', name: 'Keerai Bonda', code: 'SNK01', category: 'Snacks', price: 10, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-2', name: 'Medhu Vadai', code: 'SNK02', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-3', name: 'Vazhaipoo Vadai', code: 'SNK03', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-4', name: 'Samai Kozhukattai', code: 'SNK04', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-5', name: 'Baji', code: 'SNK05', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-6', name: 'Redrice Puttu', code: 'SNK06', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-7', name: 'Navadhaniya Sundal', code: 'SNK07', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-8', name: 'Thinai Sweet Poli', code: 'SNK08', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-9', name: 'Thinai Veg Poli', code: 'SNK09', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-10', name: 'Ragi Adai', code: 'SNK10', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-11', name: 'Sambar Vadai', code: 'SNK11', category: 'Snacks', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-12', name: 'Millet Paniyaram', code: 'SNK12', category: 'Snacks', price: 40, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-13', name: 'Curd Vadai', code: 'SNK13', category: 'Snacks', price: 50, taxPercent: 5, isVeg: true, active: true },

  // --- PASUMAI SPECIAL (Set price placeholder) ---
  { id: 'spc-1', name: 'Veg Omlet', code: 'SPC01', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-2', name: 'Millet Kichidi', code: 'SPC02', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-3', name: 'Millet Noodles', code: 'SPC03', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-4', name: 'Millet Pasta', code: 'SPC04', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-5', name: 'Millet Mini Idli', code: 'SPC05', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-6', name: 'Millet Paneer Dosa', code: 'SPC06', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-7', name: 'Millet Garlic Dosa', code: 'SPC07', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-8', name: 'Millet Keerai Dosa', code: 'SPC08', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-9', name: 'Chapathi', code: 'SPC09', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-10', name: 'Wheat Parotta', code: 'SPC10', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-11', name: 'Millet Onion Podi Dosa', code: 'SPC11', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-12', name: 'Millet Butter Podi Dosa', code: 'SPC12', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-13', name: 'Millet Beetroot Dosa', code: 'SPC13', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-14', name: 'Millet Onion Rava Dosa', code: 'SPC14', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },

  // --- SWEETS (Set price placeholder) ---
  { id: 'swt-1', name: 'Basundi', code: 'SWT01', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-2', name: 'Rasmalai', code: 'SWT02', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-3', name: 'Carrot Halwa', code: 'SWT03', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-4', name: 'Beetroot Halwa', code: 'SWT04', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-5', name: 'Millet Payasam', code: 'SWT05', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rohan Sharma',
    phone: '+91 98451 22334',
    outstanding: 0,
    loyaltyPoints: 120,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'cust-2',
    name: 'Priya Sundaram',
    phone: '+91 97312 99881',
    outstanding: 150,
    loyaltyPoints: 340,
    createdAt: Date.now() - 86400000 * 45,
  },
  {
    id: 'cust-3',
    name: 'Ananya Verma',
    phone: '+91 99160 55432',
    outstanding: 0,
    loyaltyPoints: 85,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'cust-4',
    name: 'Senthil Kumar',
    phone: '+91 98800 11223',
    outstanding: 0,
    loyaltyPoints: 210,
    createdAt: Date.now() - 86400000 * 60,
  },
];

export const SAMPLE_BILLS: Bill[] = [
  {
    id: 'bill-1001',
    billNo: 1001,
    timestamp: Date.now() - 3600000 * 3,
    lines: [
      { itemId: 'tif-2', name: 'Millet Idli (2)', price: 30, qty: 2, taxPercent: 5 },
      { itemId: 'tif-9', name: 'Millet Masala Dosa', price: 70, qty: 1, taxPercent: 5 },
      { itemId: 'snk-3', name: 'Vazhaipoo Vadai', price: 15, qty: 2, taxPercent: 5 },
    ],
    subtotal: 160,
    discount: 10,
    tax: 8,
    total: 158,
    paymentMode: 'UPI',
    status: 'Paid',
    table: 'Table 4',
    orderType: 'Dine-in',
    customerId: 'cust-1',
    customerName: 'Rohan Sharma',
    customerPhone: '+91 98451 22334',
    synced: true,
  },
  {
    id: 'bill-1002',
    billNo: 1002,
    timestamp: Date.now() - 3600000 * 2,
    lines: [
      { itemId: 'lun-8', name: 'Millet Meals', price: 110, qty: 2, taxPercent: 5 },
      { itemId: 'lun-1', name: 'Gobi 65', price: 40, qty: 1, taxPercent: 5 },
    ],
    subtotal: 260,
    discount: 0,
    tax: 13,
    total: 273,
    paymentMode: 'Cash',
    status: 'Paid',
    table: 'Table 2',
    orderType: 'Dine-in',
    customerId: 'cust-2',
    customerName: 'Priya Sundaram',
    customerPhone: '+91 97312 99881',
    synced: true,
  },
  {
    id: 'bill-1003',
    billNo: 1003,
    timestamp: Date.now() - 3600000 * 1,
    lines: [
      { itemId: 'lun-7', name: 'Mushroom Briyani', price: 80, qty: 2, taxPercent: 5 },
      { itemId: 'snk-12', name: 'Millet Paniyaram', price: 40, qty: 1, taxPercent: 5 },
    ],
    subtotal: 200,
    discount: 20,
    tax: 9,
    total: 189,
    paymentMode: 'UPI',
    status: 'Paid',
    orderType: 'Takeaway',
    customerId: 'cust-4',
    customerName: 'Senthil Kumar',
    customerPhone: '+91 98800 11223',
    synced: true,
  },
];

let isSeeding = false;

export async function seedInitialDataIfNeeded() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const profile = await db.businessProfile.get('main');
    // If not seeded yet OR existing profile is not Pasumai Cafe, perform a clean reseed
    if (!profile || profile.name !== 'Pasumai Cafe') {
      await db.items.clear();
      await db.bills.clear();
      await db.customers.clear();

      await db.items.bulkPut(INITIAL_ITEMS);
      await db.customers.bulkPut(INITIAL_CUSTOMERS);
      await db.businessProfile.put({ ...INITIAL_BUSINESS_PROFILE, id: 'main' } as any);
      await db.bills.bulkPut(SAMPLE_BILLS);
      return;
    }

    const itemsCount = await db.items.count();
    if (itemsCount === 0) {
      await db.items.bulkPut(INITIAL_ITEMS);
    }

    const custCount = await db.customers.count();
    if (custCount === 0) {
      await db.customers.bulkPut(INITIAL_CUSTOMERS);
    }

    const billsCount = await db.bills.count();
    if (billsCount === 0) {
      await db.bills.bulkPut(SAMPLE_BILLS);
    }
  } finally {
    isSeeding = false;
  }
}
