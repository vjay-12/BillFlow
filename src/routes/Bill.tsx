import { ItemGrid } from '../components/billing/ItemGrid';
import { CartSidebar } from '../components/billing/CartSidebar';
import { StickyCartBar } from '../components/billing/StickyCartBar';

export const BillRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full lg:h-[calc(100vh-100px)] overflow-y-auto lg:overflow-hidden relative">
      {/* Left side (Desktop) / Top section (Mobile): Item Catalog Grid */}
      <div className="w-full lg:flex-1 lg:h-full lg:overflow-hidden flex flex-col bg-slate-50 shrink-0 lg:shrink">
        <ItemGrid />
      </div>

      {/* Right side (Desktop) / Bottom section (Mobile): Active Cart & Checkout */}
      <div id="cart-checkout-section" className="w-full lg:w-auto h-auto lg:h-full border-t lg:border-t-0 shrink-0 lg:shrink">
        <CartSidebar />
      </div>

      {/* Mobile Floating Sticky Cart Bar */}
      <StickyCartBar />
    </div>
  );
};
