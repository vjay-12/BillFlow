import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useUIStore();
  const totalCartCount = useCartStore((s) => s.getTotalItemsCount());

  const navItems: { id: ActiveTab; label: string; mobileLabel: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'billing', label: t('nav.billing'), mobileLabel: t('nav.billingShort'), icon: ReceiptText, badge: totalCartCount > 0 ? totalCartCount : undefined },
    { id: 'history', label: t('nav.history'), mobileLabel: t('nav.history'), icon: History },
    { id: 'items', label: t('nav.items'), mobileLabel: t('nav.itemsShort'), icon: UtensilsCrossed },
    { id: 'customers', label: t('nav.customers'), mobileLabel: t('nav.customers'), icon: Users },
    { id: 'reports', label: t('nav.reports'), mobileLabel: t('nav.reports'), icon: BarChart3 },
    { id: 'settings', label: t('nav.settings'), mobileLabel: t('nav.settings'), icon: Settings },
  ];

  return (
    /* Bottom Navigation Bar — used in Tablet Portrait and Phone (any orientation).
       Hidden on Tablet Landscape (which uses the collapsible TabletSidebar). */
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#2E2119]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#3D2C20] shadow-lg px-1 py-1 grid grid-cols-6 items-center select-none"
      style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}
      aria-label="Bottom Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.mobileLabel}
            className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
              isActive 
                ? 'text-teal-700 dark:text-[#14A89B] font-extrabold' 
                : 'text-slate-400 dark:text-[#B8A990] hover:text-slate-600 dark:hover:text-[#F5F0E6] font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className={`w-5 h-5 transition-transform ${
                isActive 
                  ? 'stroke-[2.5] scale-105 text-teal-700 dark:text-[#14A89B]' 
                  : 'stroke-[1.8] text-slate-400 dark:text-[#B8A990]'
              }`} />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[9.5px] sm:text-[10px] mt-0.5 leading-tight tracking-tight truncate max-w-full ${
              isActive ? 'text-teal-700 dark:text-[#14A89B] font-bold' : 'text-slate-500 dark:text-[#D4C7B5] font-medium'
            }`}>
              {item.mobileLabel}
            </span>
            {isActive && (
              <span className="w-3 h-0.5 bg-teal-700 dark:bg-[#14A89B] rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
};
