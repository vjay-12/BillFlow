import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ReceiptText, 
  History, 
  UtensilsCrossed, 
  Users, 
  BarChart3, 
  Settings,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import type { ActiveTab } from '../../types';

export const TabletSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const totalCartCount = useCartStore((s) => s.getTotalItemsCount());

  const navItems: { id: ActiveTab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { 
      id: 'billing', 
      label: t('nav.billing'), 
      icon: ReceiptText, 
      badge: totalCartCount > 0 ? totalCartCount : undefined 
    },
    { id: 'history', label: t('nav.history'), icon: History },
    { id: 'items', label: t('nav.items'), icon: UtensilsCrossed },
    { id: 'customers', label: t('nav.customers'), icon: Users },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside
      className={`h-full bg-white dark:bg-[#2E2119] border-r border-slate-200 dark:border-[#3D2C20] flex flex-col justify-start select-none shrink-0 transition-all duration-200 ease-in-out z-20 shadow-xs ${
        isSidebarCollapsed ? 'w-16' : 'w-[200px]'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Top Header / Toggle Collapse Area */}
      <div className="border-b border-slate-100 dark:border-[#3D2C20]">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          aria-label={isSidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          className={`w-full py-3.5 px-3 flex items-center hover:bg-slate-50 dark:hover:bg-[#38291F] transition cursor-pointer text-slate-500 hover:text-slate-800 dark:text-[#D4C7B5] dark:hover:text-[#F5F0E6] ${
            isSidebarCollapsed ? 'justify-center' : 'justify-end'
          }`}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 stroke-[2.2]" />
          )}
        </button>
      </div>

      {/* Navigation Items List */}
      <nav className="p-2 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`relative flex items-center rounded-xl transition-all duration-150 cursor-pointer ${
                isSidebarCollapsed 
                  ? 'w-12 h-12 justify-center mx-auto' 
                  : 'w-full px-3 py-2.5 gap-2.5'
              } ${
                isActive
                  ? 'bg-teal-700 text-white font-bold shadow-xs dark:bg-[#14A89B] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#D4C7B5] dark:hover:text-[#F5F0E6] hover:bg-slate-100 dark:hover:bg-[#38291F]'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center shrink-0">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.4] text-white scale-105' : 'stroke-[1.8]'
                  }`}
                />
                {/* Badge on icon when collapsed */}
                {isSidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label & Badge when expanded */}
              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 overflow-hidden">
                  <span className="text-xs font-semibold tracking-tight truncate">
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-amber-950 dark:bg-amber-400 dark:text-slate-950'
                          : 'bg-teal-600 text-white dark:bg-teal-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
