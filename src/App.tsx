import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from './db/schema';
import { checkAndAutoRestore } from './db/dataSafety';
import { Header } from './components/nav/Header';
import { Navigation } from './components/nav/Navigation';
import { TabletSidebar } from './components/nav/TabletSidebar';
import { useTabletLandscape } from './lib/useTabletLandscape';
import { BillRoute } from './routes/Bill';
import { BillList } from './routes/History/BillList';
import { ItemsList } from './routes/Items/ItemsList';
import { CustomerList } from './routes/Customers/CustomerList';
import { ReportsDashboard } from './routes/Reports/Dashboard';
import { SettingsRoute } from './routes/Settings';
import { useUIStore } from './stores/uiStore';
import { useCartStore } from './stores/cartStore';
import { PaymentModal } from './components/billing/PaymentModal';
import { ReceiptModal } from './components/billing/ReceiptModal';
import { ItemFormModal } from './components/items/ItemFormModal';
import { CustomerFormModal } from './components/customers/CustomerFormModal';

export function App() {
  const { activeTab, setActiveTab, setIsPaymentModalOpen } = useUIStore();
  const cartLines = useCartStore((s) => s.lines);

  // Business profile name for header & global settings
  const profile = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  // Sync GST setting from profile to cartStore and localStorage
  useEffect(() => {
    if (profile?.enableGst !== undefined) {
      useCartStore.getState().setGstEnabled(profile.enableGst);
      localStorage.setItem('billflow_enable_gst', String(profile.enableGst));
    }
  }, [profile?.enableGst]);

  // Initialize seed database & check auto-restore safety net on app mount
  useEffect(() => {
    checkAndAutoRestore()
      .then(() => seedInitialDataIfNeeded())
      .catch(console.error);
  }, []);

  // Global POS Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      // 'F2' -> Trigger Checkout if items in cart
      if (e.key === 'F2') {
        e.preventDefault();
        if (cartLines.length > 0) {
          setIsPaymentModalOpen(true);
        }
      }

      // '/' -> Focus search bar
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // F1 -> Switch to Billing
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('billing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartLines, setIsPaymentModalOpen, setActiveTab]);

  const isTabletLandscape = useTabletLandscape();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#211712] text-slate-800 dark:text-[#F5F0E6]">
      {/* Top Header */}
      <Header businessName={profile?.name} tagline={profile?.tagline} />

      {/* Main Body: In tablet landscape, Left Collapsible Sidebar + Middle Content. In portrait/phone: full width content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Collapsible Sidebar (Tablet Landscape only) */}
        {isTabletLandscape && <TabletSidebar />}

        {/* Middle/Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-hidden relative ${!isTabletLandscape ? 'pb-14' : 'pb-0'}`}>
          {activeTab === 'billing' && <BillRoute />}
          {activeTab === 'history' && <BillList />}
          {activeTab === 'items' && <ItemsList />}
          {activeTab === 'customers' && <CustomerList />}
          {activeTab === 'reports' && <ReportsDashboard />}
          {activeTab === 'settings' && <SettingsRoute />}
        </main>
      </div>

      {/* Bottom Navigation tabs (Tablet Portrait and Phone only) */}
      {!isTabletLandscape && <Navigation />}

      {/* Global Modals (accessible across any active screen) */}
      <PaymentModal />
      <ReceiptModal />
      <ItemFormModal />
      <CustomerFormModal />
    </div>
  );
}

export default App;
