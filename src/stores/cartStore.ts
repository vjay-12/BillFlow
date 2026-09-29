import { create } from 'zustand';
import type { BillLine, Customer, OrderType, Item } from '../types';

interface CartState {
  lines: BillLine[];
  orderType: OrderType;
  table: string;
  customer: Customer | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  cashierName: string;
  isGstEnabled: boolean;

  // Actions
  addItem: (item: Item, qty?: number) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  incrementQty: (itemId: string) => void;
  decrementQty: (itemId: string) => void;
  updateNote: (itemId: string, note: string) => void;
  setOrderType: (type: OrderType) => void;
  setTable: (table: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (type: 'percent' | 'fixed', val: number) => void;
  setCashierName: (name: string) => void;
  setGstEnabled: (enabled: boolean) => void;
  clearCart: () => void;

  // Computed values
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
  getTotalItemsCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  orderType: 'Dine-in',
  table: 'Table 1',
  customer: null,
  discountType: 'fixed',
  discountValue: 0,
  cashierName: 'Counter 1',
  isGstEnabled: typeof localStorage !== 'undefined' ? localStorage.getItem('billflow_enable_gst') !== 'false' : true,

  setGstEnabled: (isGstEnabled) => set({ isGstEnabled }),

  addItem: (item: Item, qty = 1) => {
    set((state) => {
      const existingIndex = state.lines.findIndex((line) => line.itemId === item.id);
      if (existingIndex >= 0) {
        const updated = [...state.lines];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        };
        return { lines: updated };
      }
      return {
        lines: [
          ...state.lines,
          {
            itemId: item.id,
            name: item.name,
            nameTamil: item.nameTamil,
            price: item.price,
            qty,
            taxPercent: item.taxPercent,
          },
        ],
      };
    });
  },

  removeItem: (itemId: string) => {
    set((state) => ({
      lines: state.lines.filter((l) => l.itemId !== itemId),
    }));
  },

  updateQty: (itemId: string, qty: number) => {
    if (qty <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      lines: state.lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l)),
    }));
  },

  incrementQty: (itemId: string) => {
    set((state) => ({
      lines: state.lines.map((l) =>
        l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l
      ),
    }));
  },

  decrementQty: (itemId: string) => {
    const item = get().lines.find((l) => l.itemId === itemId);
    if (!item) return;
    if (item.qty <= 1) {
      get().removeItem(itemId);
    } else {
      set((state) => ({
        lines: state.lines.map((l) =>
          l.itemId === itemId ? { ...l, qty: l.qty - 1 } : l
        ),
      }));
    }
  },

  updateNote: (itemId: string, note: string) => {
    set((state) => ({
      lines: state.lines.map((l) => (l.itemId === itemId ? { ...l, note } : l)),
    }));
  },

  setOrderType: (orderType: OrderType) => set({ orderType }),
  setTable: (table: string) => set({ table }),
  setCustomer: (customer: Customer | null) => set({ customer }),
  setDiscount: (discountType, discountValue) => set({ discountType, discountValue }),
  setCashierName: (cashierName) => set({ cashierName }),

  clearCart: () =>
    set({
      lines: [],
      customer: null,
      discountValue: 0,
      table: 'Table 1',
    }),

  getSubtotal: () => {
    return get().lines.reduce((acc, line) => acc + line.price * line.qty, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discountType, discountValue } = get();
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percent') {
      return Math.round((subtotal * Math.min(100, discountValue)) / 100);
    }
    return Math.min(subtotal, discountValue);
  },

  getTaxAmount: () => {
    if (!get().isGstEnabled) return 0;

    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const taxableAmount = Math.max(0, subtotal - discount);
    if (taxableAmount === 0 || subtotal === 0) return 0;

    // Weighted tax by items
    const effectiveTaxRate =
      get().lines.reduce((sum, line) => {
        const itemShare = (line.price * line.qty) / subtotal;
        return sum + (line.taxPercent ?? 5) * itemShare;
      }, 0) || 5;

    return Math.round((taxableAmount * effectiveTaxRate) / 100);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    return Math.max(0, subtotal - discount + tax);
  },

  getTotalItemsCount: () => {
    return get().lines.reduce((acc, l) => acc + l.qty, 0);
  },
}));
