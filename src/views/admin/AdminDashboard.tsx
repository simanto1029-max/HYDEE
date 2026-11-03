import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowRight,
  Filter,
  DollarSign,
  PackageCheck,
  CreditCard,
  Truck,
  Plus,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { store } from '../../services/store';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [includeTestOrders, setIncludeTestOrders] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');

  const allOrders = store.getOrders();
  const products = store.getProducts();

  // Filter orders based on sandbox setting
  const orders = allOrders.filter((o) => (includeTestOrders ? true : !o.isTestOrder));

  // Core metrics
  const totalOrdersCount = orders.length;
  const pendingAdvanceCount = orders.filter((o) => o.status === 'PENDING_ADVANCE').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const confirmedCount = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED'
  ).length;

  const grossSales = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const verifiedAdvancePayments = orders
    .filter((o) => o.paymentStatus === 'ADVANCE_VERIFIED' || o.paymentStatus === 'FULLY_PAID' || o.paymentStatus === 'COD_COLLECTED')
    .reduce((sum, o) => sum + o.advanceDeliveryFee, 0);

  const pendingCodCollections = orders
    .filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED')
    .reduce((sum, o) => sum + o.remainingCodAmount, 0);

  // Profit estimation
  let estimatedCost = 0;
  orders.forEach((o) => {
    if (o.status !== 'CANCELLED') {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const unitCost = prod?.costPrice || Math.round(item.price * 0.45);
        estimatedCost += unitCost * item.quantity;
      });
    }
  });
  const estimatedProfit = Math.max(0, grossSales - estimatedCost);

  // Top Selling Products calculation
  const productSalesMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'CANCELLED') {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { count: 0, revenue: 0 };
        }
        productSalesMap[item.productId].count += item.quantity;
        productSalesMap[item.productId].revenue += item.price * item.quantity;
      });
    }
  });

  const topProducts = products
    .map((p) => ({
      ...p,
      soldUnits: productSalesMap[p.id]?.count || 0,
      soldRevenue: productSalesMap[p.id]?.revenue || 0,
    }))
    .sort((a, b) => b.soldUnits - a.soldUnits)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 font-sans text-neutral-900">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            ATELIER STORE PERFORMANCE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-1">
            Store Performance & Orders Dashboard
          </h1>
        </div>

        {/* Filters: Timeframe & Sandbox Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe pill switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
            {(['today', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Sandbox toggle */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-600 font-medium">Test Orders:</span>
            <button
              onClick={() => setIncludeTestOrders(!includeTestOrders)}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] cursor-pointer transition-colors ${
                includeTestOrders ? 'bg-[#800000] text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {includeTestOrders ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* CORE BUSINESS METRICS 4-CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Gross Sales</span>
            <span className="font-bold text-xs bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-800">৳ BDT</span>
          </div>
          <p className="font-sans text-2xl font-extrabold text-neutral-950 tabular-nums">
            ৳{grossSales.toLocaleString()}
          </p>
          <div className="flex items-center text-[11px] text-emerald-600 font-semibold gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Est. Gross Margin: ৳{estimatedProfit.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Verified Advance Delivery Fees */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Advance Fees Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-sans text-2xl font-extrabold text-emerald-700 tabular-nums">
            ৳{verifiedAdvancePayments.toLocaleString()}
          </p>
          <div className="text-[11px] text-neutral-500 font-medium">
            <span>Collected via bKash / Nagad prior to dispatch</span>
          </div>
        </div>

        {/* 3. Pending COD Collections */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Pending Doorstep COD</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-sans text-2xl font-extrabold text-amber-700 tabular-nums">
            ৳{pendingCodCollections.toLocaleString()}
          </p>
          <div className="text-[11px] text-neutral-500 font-medium">
            <span>Receivable upon courier doorstep delivery</span>
          </div>
        </div>

        {/* 4. Total Orders & Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Total Bookings</span>
            <ShoppingBag className="w-4 h-4 text-[#800000]" />
          </div>
          <p className="font-sans text-2xl font-extrabold text-neutral-950 tabular-nums">
            {totalOrdersCount}
          </p>
          <div className="text-[11px] text-neutral-500 font-medium">
            <span>{confirmedCount} confirmed · {pendingAdvanceCount} awaiting advance</span>
          </div>
        </div>
      </div>

      {/* PIPELINE STATUS BREAKDOWN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-4 rounded-xl border border-neutral-200 cursor-pointer hover:border-[#800000] transition-colors"
        >
          <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">1. Pending Advance</span>
          <span className="text-xl font-extrabold text-neutral-900 mt-1 block">{pendingAdvanceCount}</span>
          <span className="text-[11px] text-amber-600 font-medium">Requires TrxID verification</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-4 rounded-xl border border-neutral-200 cursor-pointer hover:border-[#800000] transition-colors"
        >
          <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">2. In Processing</span>
          <span className="text-xl font-extrabold text-neutral-900 mt-1 block">{processingCount}</span>
          <span className="text-[11px] text-blue-600 font-medium">Packaging & atelier prep</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-4 rounded-xl border border-neutral-200 cursor-pointer hover:border-[#800000] transition-colors"
        >
          <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">3. In Courier Transit</span>
          <span className="text-xl font-extrabold text-neutral-900 mt-1 block">{shippedCount}</span>
          <span className="text-[11px] text-purple-600 font-medium">Out with Steadfast / Pathao</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-4 rounded-xl border border-neutral-200 cursor-pointer hover:border-[#800000] transition-colors"
        >
          <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">4. Delivered & Settled</span>
          <span className="text-xl font-extrabold text-neutral-900 mt-1 block">{deliveredCount}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Cash collected & complete</span>
        </div>
      </div>

      {/* RECENT ORDERS ACTIVITY */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base text-neutral-950">Recent Order Activity</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Latest bookings placed by clients</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 uppercase font-bold text-[10px]">
                  <th className="pb-3">Order Ref & Time</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Advance Status</th>
                  <th className="pb-3">COD Due</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.map((o) => {
                  const formattedTime = (() => {
                    try {
                      return new Date(o.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                    } catch {
                      return 'Recent';
                    }
                  })();

                  return (
                    <tr key={o.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3">
                        <div className="font-mono font-bold text-neutral-900">{o.orderNumber}</div>
                        <div className="text-[10px] text-neutral-500 font-sans font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#800000]" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-neutral-900">{o.customerName}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">{o.customerPhone}</p>
                      </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {o.paymentStatus === 'ADVANCE_VERIFIED' || o.paymentStatus === 'FULLY_PAID' || o.paymentStatus === 'COD_COLLECTED' ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          ৳{o.advanceDeliveryFee} Verified
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          Pending ৳{o.advanceDeliveryFee}
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-bold text-neutral-900 tabular-nums">
                      ৳{o.remainingCodAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateTab('orders')}
                        className="text-[#800000] font-bold hover:underline cursor-pointer"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS & QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP SELLING PRODUCTS TABLE (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-base text-neutral-950">Top Selling Products</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Most in-demand garments ranked by sales</p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 uppercase font-bold text-[10px]">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Inventory</th>
                  <th className="pb-3 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 flex items-center gap-3">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg bg-neutral-100 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-neutral-950 line-clamp-1">{p.name}</p>
                        <p className="font-mono text-neutral-400 text-[10px]">{p.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 text-neutral-600 font-medium">{p.categoryName}</td>
                    <td className="py-3 font-bold text-neutral-900 tabular-nums">৳{p.price.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock < 5 ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-neutral-900 tabular-nums">
                      {p.soldUnits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK ATELIER ACTIONS (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-base text-neutral-950 pb-2 border-b border-neutral-100">
            Studio Quick Actions
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-between text-xs font-bold transition-all text-neutral-900 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-[#800000]" />
                <span>Add New Garment Piece</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => onNavigateTab('categories')}
              className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-between text-xs font-bold transition-all text-neutral-900 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#800000]" />
                <span>Manage Categories & Catalog</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => onNavigateTab('orders')}
              className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-between text-xs font-bold transition-all text-neutral-900 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#800000]" />
                <span>Verify & Dispatch Courier Orders</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
