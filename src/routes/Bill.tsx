import React from 'react';
import { ItemGrid } from '../components/billing/ItemGrid';
import { CartSidebar } from '../components/billing/CartSidebar';
import { StickyCartBar } from '../components/billing/StickyCartBar';
import { useTabletLandscape } from '../lib/useTabletLandscape';

export const BillRoute: React.FC = () => {
  const isTabletLandscape = useTabletLandscape();

  return (
    <div 
      id="bill-route-container" 
      className={`flex-1 flex h-full relative ${
        isTabletLandscape ? 'flex-row overflow-hidden' : 'flex-col overflow-y-auto'
      }`}
    >
      {/* Left/Middle section: Item Catalog Grid */}
      <div 
        className={`w-full flex flex-col bg-slate-50 dark:bg-[#211712] ${
          isTabletLandscape ? 'flex-1 h-full overflow-hidden' : 'shrink-0'
        }`}
      >
        <ItemGrid />
      </div>

      {/* Right section: Active Cart & Checkout Panel */}
      <div 
        id="cart-checkout-section" 
        className={`${
          isTabletLandscape 
            ? 'w-[330px] md:w-[350px] lg:w-[370px] xl:w-[390px] max-w-[38%] min-w-[310px] h-full border-l border-slate-200 dark:border-[#3D2C20] shrink-0 z-10 flex flex-col overflow-hidden' 
            : 'w-full h-auto border-t border-slate-200 dark:border-[#3D2C20] shrink-0'
        }`}
      >
        <CartSidebar />
      </div>

      {/* Mobile/Portrait Floating Sticky Cart Bar (tablet landscape uses the right-side CartSidebar) */}
      {!isTabletLandscape && <StickyCartBar />}
    </div>
  );
};
