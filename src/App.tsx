import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from './db/schema';
import { Header } from './components/nav/Header';
import { Navigation } from './components/nav/Navigation';
import { BillRoute } from './routes/Bill';
import { BillList } from './routes/History/BillList';
import { ItemsList } from './routes/Items/ItemsList';
import { CustomerList } from './routes/Customers/CustomerList';
import { ReportsDashboard } from './routes/Reports/Dashboard';
import { SettingsRoute } from './routes/Settings';
import { useUIStore } from './stores/uiStore';
import { useCartStore } from './stores/cartStore';

export function App() {
  const { activeTab, setActiveTab, setIsPaymentModalOpen } = useUIStore();
  const cartLines = useCartStore((s) => s.lines);

  // Business profile name for header
  const profile = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  // Initialize seed database on app mount
  useEffect(() => {
    seedInitialDataIfNeeded().catch(console.error);
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      {/* Top Header */}
      <Header businessName={profile?.name} tagline={profile?.tagline} />

      {/* Navigation tabs */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-14 md:pb-0">
        {activeTab === 'billing' && <BillRoute />}
        {activeTab === 'history' && <BillList />}
        {activeTab === 'items' && <ItemsList />}
        {activeTab === 'customers' && <CustomerList />}
        {activeTab === 'reports' && <ReportsDashboard />}
        {activeTab === 'settings' && <SettingsRoute />}
      </main>
    </div>
  );
}

export default App;
