import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Award
} from 'lucide-react';
import { db } from '../../db/schema';
import { formatCurrency } from '../../lib/formatters';

export const ReportsDashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('all');

  const bills = useLiveQuery(async () => {
    const all = await db.bills.toArray();
    const now = Date.now();
    const oneDay = 86400000;

    return all.filter((b) => {
      if (b.status === 'Cancelled') return false;
      if (timeFilter === 'today') {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        return b.timestamp >= todayStart;
      }
      if (timeFilter === 'week') {
        return b.timestamp >= now - 7 * oneDay;
      }
      return true;
    });
  }, [timeFilter]);

  // Aggregate metrics
  const stats = useMemo(() => {
    if (!bills || bills.length === 0) {
      return {
        totalRevenue: 0,
        ordersCount: 0,
        avgOrderValue: 0,
        totalTax: 0,
        totalDiscount: 0,
        paymentModes: { Cash: 0, UPI: 0, Card: 0, Credit: 0 },
        orderTypes: { 'Dine-in': 0, 'Takeaway': 0, 'Delivery': 0 },
        topItems: [] as { name: string; qty: number; revenue: number }[],
      };
    }

    let revenue = 0;
    let tax = 0;
    let discount = 0;
    const paymentModes: Record<string, number> = { Cash: 0, UPI: 0, Card: 0, Credit: 0 };
    const orderTypes: Record<string, number> = { 'Dine-in': 0, Takeaway: 0, Delivery: 0 };
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const b of bills) {
      revenue += b.total;
      tax += b.tax;
      discount += b.discount;

      paymentModes[b.paymentMode] = (paymentModes[b.paymentMode] || 0) + b.total;
      orderTypes[b.orderType] = (orderTypes[b.orderType] || 0) + 1;

      for (const line of b.lines) {
        const existing = itemMap.get(line.itemId) || { name: line.name, qty: 0, revenue: 0 };
        existing.qty += line.qty;
        existing.revenue += line.qty * line.price;
        itemMap.set(line.itemId, existing);
      }
    }

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue: revenue,
      ordersCount: bills.length,
      avgOrderValue: Math.round(revenue / bills.length),
      totalTax: tax,
      totalDiscount: discount,
      paymentModes,
      orderTypes,
      topItems,
    };
  }, [bills]);

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-5">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Sales & Performance Reports
          </h2>
          <p className="text-xs text-slate-500">
            Real-time business analytics, revenue breakdowns, and bestselling items
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-100" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight mt-2">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-[11px] text-teal-200/80 mt-1">
            Tax Collected: {formatCurrency(stats.totalTax)}
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 tracking-tight mt-2">
            {stats.ordersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Settled transactions</div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 tracking-tight mt-2">
            {formatCurrency(stats.avgOrderValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per checkout bill</div>
        </div>

        {/* Discounts Granted */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Discounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 tracking-tight mt-2">
            {formatCurrency(stats.totalDiscount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Customer loyalty savings</div>
        </div>
      </div>

      {/* Middle Grid: Payment Breakdown & Order Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Payment Modes Breakdown</h3>
            <span className="text-xs text-slate-400 font-mono">By Revenue</span>
          </div>

          <div className="space-y-3">
            {[
              { mode: 'Cash', color: 'bg-emerald-500', amount: stats.paymentModes['Cash'] || 0 },
              { mode: 'UPI', color: 'bg-sky-500', amount: stats.paymentModes['UPI'] || 0 },
              { mode: 'Card', color: 'bg-indigo-500', amount: stats.paymentModes['Card'] || 0 },
              { mode: 'Credit', color: 'bg-amber-500', amount: stats.paymentModes['Credit'] || 0 },
            ].map((item) => {
              const pct = stats.totalRevenue > 0 ? (item.amount / stats.totalRevenue) * 100 : 0;
              return (
                <div key={item.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.mode}</span>
                    <span className="font-mono text-slate-900">
                      {formatCurrency(item.amount)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Types Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">Order Channels</h3>
            <span className="text-xs text-slate-400 font-mono">By Volume</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(stats.orderTypes).map(([type, count]) => (
              <div
                key={type}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center"
              >
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  {type}
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900 block">
                  {count}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800">Top Selling Products</h3>

        {stats.topItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.topItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-800 font-extrabold font-mono flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[11px] text-slate-400">{item.qty} units sold</span>
                  </div>
                </div>
                <div className="text-right font-mono font-extrabold text-slate-900 text-sm">
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">
            No sales data recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
