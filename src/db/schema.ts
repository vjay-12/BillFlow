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
  showNonVeg: true,
  menuLanguage: 'English',
  paperWidth: '80mm',
  upiId: 'pasumaicafe@oksbi',
  upiQrCodeUrl: '',
  printerBluetoothName: 'Pasumai Thermal 80mm',
};

export const INITIAL_ITEMS: Item[] = [
  // --- TIFFIN ---
  { id: 'tif-1', name: 'Medhu Vadai (1)', nameTamil: 'மெதுவடை (1)', code: 'TIF01', category: 'Tiffin', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-2', name: 'Millet Idli (2)', nameTamil: 'சிறுதானிய இட்லி (2)', code: 'TIF02', category: 'Tiffin', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-3', name: 'Sambar Vadai (1)', nameTamil: 'சாம்பார் வடை (1)', code: 'TIF03', category: 'Tiffin', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-4', name: 'Millet Podi Idli', nameTamil: 'சிறுதானிய பொடி இட்லி', code: 'TIF04', category: 'Tiffin', price: 50, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-5', name: 'Beetroot Poori', nameTamil: 'பீட்ரூட் பூரி', code: 'TIF05', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-6', name: 'Millet Plain Dosa', nameTamil: 'சிறுதானிய சாதா தோசை', code: 'TIF06', category: 'Tiffin', price: 50, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-7', name: 'Millet Sambar Idli', nameTamil: 'சிறுதானிய சாம்பார் இட்லி', code: 'TIF07', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-8', name: 'Millet Idiyappam', nameTamil: 'சிறுதானிய இடியாப்பம்', code: 'TIF08', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-9', name: 'Millet Masala Dosa', nameTamil: 'சிறுதானிய மசாலா தோசை', code: 'TIF09', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-10', name: 'Millet Podi Dosa', nameTamil: 'சிறுதானிய பொடி தோசை', code: 'TIF10', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-11', name: 'Millet Uthappam', nameTamil: 'சிறுதானிய உத்தப்பம்', code: 'TIF11', category: 'Tiffin', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-12', name: 'Wheat Pongal', nameTamil: 'கோதுமை பொங்கல்', code: 'TIF12', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-13', name: 'Millet Pongal', nameTamil: 'சிறுதானிய பொங்கல்', code: 'TIF13', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-14', name: 'Millet Onion Dosa', nameTamil: 'சிறுதானிய வெங்காய தோசை', code: 'TIF14', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-15', name: 'Millet Garlic Dosa', nameTamil: 'சிறுதானிய பூண்டு தோசை', code: 'TIF15', category: 'Tiffin', price: 70, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-16', name: 'Millet Rava Dosa', nameTamil: 'சிறுதானிய ரவா தோசை', code: 'TIF16', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-17', name: 'Millet Ghee Dosa', nameTamil: 'சிறுதானிய நெய் தோசை', code: 'TIF17', category: 'Tiffin', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-18', name: 'Millet Paneer Dosa', nameTamil: 'சிறுதானிய பன்னீர் தோசை', code: 'TIF18', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },
  { id: 'tif-19', name: 'Millet Mushroom Dosa', nameTamil: 'சிறுதானிய காளான் தோசை', code: 'TIF19', category: 'Tiffin', price: 90, taxPercent: 5, isVeg: true, active: true },

  // --- LUNCH ---
  { id: 'lun-1', name: 'Gobi 65', nameTamil: 'கோபி 65', code: 'LUN01', category: 'Lunch', price: 40, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-2', name: 'Millet Sambar Rice', nameTamil: 'சிறுதானிய சாம்பார் சாதம்', code: 'LUN02', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-3', name: 'Millet Curd Rice', nameTamil: 'சிறுதானிய தயிர் சாதம்', code: 'LUN03', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-4', name: 'Mushroom 65', nameTamil: 'காளான் 65', code: 'LUN04', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-5', name: 'Ragi Kali', nameTamil: 'ராகி களி', code: 'LUN05', category: 'Lunch', price: 60, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-6', name: 'Normal Meals', nameTamil: 'சாதாரண சாப்பாடு', code: 'LUN06', category: 'Lunch', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-7', name: 'Mushroom Briyani', nameTamil: 'காளான் பிரியாணி', code: 'LUN07', category: 'Lunch', price: 80, taxPercent: 5, isVeg: true, active: true },
  { id: 'lun-8', name: 'Millet Meals', nameTamil: 'சிறுதானிய சாப்பாடு', code: 'LUN08', category: 'Lunch', price: 110, taxPercent: 5, isVeg: true, active: true },

  // --- SNACKS ---
  { id: 'snk-1', name: 'Keerai Bonda', nameTamil: 'கீரை போண்டா', code: 'SNK01', category: 'Snacks', price: 10, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-2', name: 'Medhu Vadai', nameTamil: 'மெதுவடை', code: 'SNK02', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-3', name: 'Vazhaipoo Vadai', nameTamil: 'வாழைப்பூ வடை', code: 'SNK03', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-4', name: 'Samai Kozhukattai', nameTamil: 'சாமை கொழுக்கட்டை', code: 'SNK04', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-5', name: 'Baji', nameTamil: 'பஜி', code: 'SNK05', category: 'Snacks', price: 15, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-6', name: 'Redrice Puttu', nameTamil: 'சிவப்பரிசி புட்டு', code: 'SNK06', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-7', name: 'Navadhaniya Sundal', nameTamil: 'நவதானிய சுண்டல்', code: 'SNK07', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-8', name: 'Thinai Sweet Poli', nameTamil: 'தினை இனிப்பு போளி', code: 'SNK08', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-9', name: 'Thinai Veg Poli', nameTamil: 'தினை காய்கறி போளி', code: 'SNK09', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-10', name: 'Ragi Adai', nameTamil: 'ராகி அடை', code: 'SNK10', category: 'Snacks', price: 20, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-11', name: 'Sambar Vadai', nameTamil: 'சாம்பார் வடை', code: 'SNK11', category: 'Snacks', price: 30, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-12', name: 'Millet Paniyaram', nameTamil: 'சிறுதானிய பணியாரம்', code: 'SNK12', category: 'Snacks', price: 40, taxPercent: 5, isVeg: true, active: true },
  { id: 'snk-13', name: 'Curd Vadai', nameTamil: 'தயிர் வடை', code: 'SNK13', category: 'Snacks', price: 50, taxPercent: 5, isVeg: true, active: true },

  // --- PASUMAI SPECIAL ---
  { id: 'spc-1', name: 'Veg Omlet', nameTamil: 'காய்கறி ஆம்லெட்', code: 'SPC01', category: 'Special', price: 0, taxPercent: 5, isVeg: false, active: true },
  { id: 'spc-2', name: 'Millet Kichidi', nameTamil: 'சிறுதானிய கிச்சடி', code: 'SPC02', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-3', name: 'Millet Noodles', nameTamil: 'சிறுதானிய நூடுல்ஸ்', code: 'SPC03', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-4', name: 'Millet Pasta', nameTamil: 'சிறுதானிய பாஸ்தா', code: 'SPC04', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-5', name: 'Millet Mini Idli', nameTamil: 'சிறுதானிய மினி இட்லி', code: 'SPC05', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-6', name: 'Millet Paneer Dosa', nameTamil: 'சிறுதானிய பன்னீர் தோசை', code: 'SPC06', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-7', name: 'Millet Garlic Dosa', nameTamil: 'சிறுதானிய பூண்டு தோசை', code: 'SPC07', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-8', name: 'Millet Keerai Dosa', nameTamil: 'சிறுதானிய கீரை தோசை', code: 'SPC08', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-9', name: 'Chapathi', nameTamil: 'சப்பாத்தி', code: 'SPC09', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-10', name: 'Wheat Parotta', nameTamil: 'கோதுமை பரோட்டா', code: 'SPC10', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-11', name: 'Millet Onion Podi Dosa', nameTamil: 'சிறுதானிய வெங்காய பொடி தோசை', code: 'SPC11', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-12', name: 'Millet Butter Podi Dosa', nameTamil: 'சிறுதானிய வெண்ணெய் பொடி தோசை', code: 'SPC12', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-13', name: 'Millet Beetroot Dosa', nameTamil: 'சிறுதானிய பீட்ரூட் தோசை', code: 'SPC13', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'spc-14', name: 'Millet Onion Rava Dosa', nameTamil: 'சிறுதானிய வெங்காய ரவா தோசை', code: 'SPC14', category: 'Special', price: 0, taxPercent: 5, isVeg: true, active: true },

  // --- SWEETS ---
  { id: 'swt-1', name: 'Basundi', nameTamil: 'பாசுந்தி', code: 'SWT01', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-2', name: 'Rasmalai', nameTamil: 'ராஸ்மலை', code: 'SWT02', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-3', name: 'Carrot Halwa', nameTamil: 'கேரட் அல்வா', code: 'SWT03', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-4', name: 'Beetroot Halwa', nameTamil: 'பீட்ரூட் அல்வா', code: 'SWT04', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
  { id: 'swt-5', name: 'Millet Payasam', nameTamil: 'சிறுதானிய பாயசம்', code: 'SWT05', category: 'Sweets', price: 0, taxPercent: 5, isVeg: true, active: true },
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
      localStorage.setItem('billflow_setup_complete', 'true');
      return;
    }

    const itemsCount = await db.items.count();
    if (itemsCount === 0) {
      if (localStorage.getItem('billflow_setup_complete') === 'true') {
        console.warn(
          '⚠️ [BillFlow SafetyNet] Menu items storage was unexpectedly empty! Auto-restoring 59 canonical items transparently...'
        );
      }
      await db.items.bulkPut(INITIAL_ITEMS);
      localStorage.setItem('billflow_setup_complete', 'true');
    }

    const custCount = await db.customers.count();
    if (custCount === 0) {
      await db.customers.bulkPut(INITIAL_CUSTOMERS);
    }

    const billsCount = await db.bills.count();
    if (billsCount === 0) {
      await db.bills.bulkPut(SAMPLE_BILLS);
    }

    // Auto-migrate: populate Tamil names & flag Veg Omlet as non-veg on existing databases
    const currentItems = await db.items.toArray();
    const needsTamilMigration = currentItems.some((i) => !i.nameTamil);
    const vegOmletNeedsUpdate = currentItems.some((i) => i.name === 'Veg Omlet' && i.isVeg !== false);
    if (needsTamilMigration || vegOmletNeedsUpdate) {
      const canonicalMap = new Map(INITIAL_ITEMS.map((ci) => [ci.name, ci]));
      const updatedItems = currentItems.map((item) => {
        const canonical = canonicalMap.get(item.name);
        return {
          ...item,
          nameTamil: item.nameTamil || canonical?.nameTamil,
          isVeg: item.name === 'Veg Omlet' ? false : (canonical?.isVeg ?? item.isVeg),
        };
      });
      await db.items.bulkPut(updatedItems);
    }

    // Auto-migrate: ensure profile has showNonVeg & menuLanguage defaults
    if (profile) {
      let needsProfileSave = false;
      const updatedProfile = { ...profile };
      if (updatedProfile.showNonVeg === undefined) {
        updatedProfile.showNonVeg = true;
        needsProfileSave = true;
      }
      if (updatedProfile.menuLanguage === undefined) {
        updatedProfile.menuLanguage = 'English';
        needsProfileSave = true;
      }
      if (needsProfileSave) {
        await db.businessProfile.put({ ...updatedProfile, id: 'main' } as any);
      }
    }

    localStorage.setItem('billflow_setup_complete', 'true');
  } finally {
    isSeeding = false;
  }
}
