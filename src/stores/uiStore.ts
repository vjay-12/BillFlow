import { create } from 'zustand';
import type { ActiveTab, Bill, Item, Customer } from '../types';

interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;

  // Modals
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;

  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;

  activeBillForReceipt: Bill | null;
  setActiveBillForReceipt: (bill: Bill | null) => void;

  activeBillForDetail: Bill | null;
  setActiveBillForDetail: (bill: Bill | null) => void;

  isItemFormModalOpen: boolean;
  setIsItemFormModalOpen: (open: boolean) => void;
  editingItem: Item | null;
  setEditingItem: (item: Item | null) => void;

  isCustomerFormModalOpen: boolean;
  setIsCustomerFormModalOpen: (open: boolean) => void;
  editingCustomer: Customer | null;
  setEditingCustomer: (customer: Customer | null) => void;

  // Theme
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'billing',
  setActiveTab: (activeTab) => set({ activeTab }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedCategory: 'All',
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  isOnline: navigator.onLine,
  setIsOnline: (isOnline) => set({ isOnline }),

  pendingSyncCount: 0,
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),

  isPaymentModalOpen: false,
  setIsPaymentModalOpen: (isPaymentModalOpen) => set({ isPaymentModalOpen }),

  isReceiptModalOpen: false,
  setIsReceiptModalOpen: (isReceiptModalOpen) => set({ isReceiptModalOpen }),

  activeBillForReceipt: null,
  setActiveBillForReceipt: (activeBillForReceipt) => set({ activeBillForReceipt }),

  activeBillForDetail: null,
  setActiveBillForDetail: (activeBillForDetail) => set({ activeBillForDetail }),

  isItemFormModalOpen: false,
  setIsItemFormModalOpen: (isItemFormModalOpen) => set({ isItemFormModalOpen }),
  editingItem: null,
  setEditingItem: (editingItem) => set({ editingItem }),

  isCustomerFormModalOpen: false,
  setIsCustomerFormModalOpen: (isCustomerFormModalOpen) => set({ isCustomerFormModalOpen }),
  editingCustomer: null,
  setEditingCustomer: (editingCustomer) => set({ editingCustomer }),

  isDarkMode: (() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('billflow_theme');
    const isDark = stored === 'dark';
    if (isDark && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    return isDark;
  })(),
  setDarkMode: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('billflow_theme', enabled ? 'dark' : 'light');
      if (enabled) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
    set({ isDarkMode: enabled });
  },
  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('billflow_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
    set({ isDarkMode: next });
  },
}));
