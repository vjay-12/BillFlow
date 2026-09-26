import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/formatters';

export const StickyCartBar: React.FC = () => {
  const itemsCount = useCartStore((s) => s.getTotalItemsCount());
  const total = useCartStore((s) => s.getTotal());

  if (itemsCount === 0) return null;

  const handleScrollToCart = () => {
    const cartSection = document.getElementById('cart-checkout-section');
    if (cartSection) {
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="md:hidden fixed left-3 right-3 z-30 transition-all duration-200 ease-out animate-in slide-in-from-bottom-5"
      style={{ bottom: 'calc(56px + max(8px, env(safe-area-inset-bottom)))' }}
    >
      <button
        type="button"
        onClick={handleScrollToCart}
        aria-label={`View bill with ${itemsCount} items totaling ${formatCurrency(total)}`}
        className="w-full bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-teal-950/25 flex items-center justify-between border border-teal-600/50 transition-all select-none cursor-pointer"
      >
        {/* Left: Item count & Running total */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-700/80 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingBag className="w-4 h-4 stroke-[2.2] text-teal-100" />
          </div>
          <div className="text-left truncate">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-bold text-teal-100">
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-teal-400 font-bold">·</span>
              <span className="text-base font-extrabold font-mono text-white tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="text-[10.5px] text-teal-200/90 font-medium mt-0.5 truncate">
              Tap to view order & checkout
            </div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-1 font-extrabold text-xs sm:text-sm bg-white/15 hover:bg-white/25 active:bg-white/30 text-white px-3 py-1.5 rounded-xl border border-white/10 transition shadow-2xs shrink-0 ml-2">
          <span>View Bill</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </div>
      </button>
    </div>
  );
};
