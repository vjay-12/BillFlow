import { 
  ReceiptText, 
  History, 
  UtensilsCrossed, 
  Users, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { ActiveTab } from '../../types';
import { useCartStore } from '../../stores/cartStore';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const totalCartCount = useCartStore((s) => s.getTotalItemsCount());

  const navItems: { id: ActiveTab; label: string; mobileLabel: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'billing', label: 'Billing POS', mobileLabel: 'Billing', icon: ReceiptText, badge: totalCartCount > 0 ? totalCartCount : undefined },
    { id: 'history', label: 'History', mobileLabel: 'History', icon: History },
    { id: 'items', label: 'Menu & Items', mobileLabel: 'Menu', icon: UtensilsCrossed },
    { id: 'customers', label: 'Customers', mobileLabel: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', mobileLabel: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Bar Nav — HIDDEN on mobile (max-width: 768px / hidden md:flex) */}
      <nav className="hidden md:flex bg-white border-b border-slate-200 px-4 items-center justify-between overflow-x-auto select-none no-scrollbar">
        <div className="flex items-center gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-amber-400 text-amber-950' : 'bg-teal-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Bar — Single Source of Navigation on Mobile (fixed bottom, 6 evenly spaced tabs) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-1 py-1 grid grid-cols-6 items-center select-none"
        style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.mobileLabel}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors ${
                isActive 
                  ? 'text-teal-700 font-extrabold' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5] scale-105 text-teal-700' : 'stroke-[1.8] text-slate-400'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9.5px] sm:text-[10px] mt-0.5 leading-tight tracking-tight truncate max-w-full ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 font-medium'
              }`}>
                {item.mobileLabel}
              </span>
              {isActive && (
                <span className="w-3 h-0.5 bg-teal-700 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
