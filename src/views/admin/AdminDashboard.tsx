import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { store } from '../../services/store';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [includeTestOrders, setIncludeTestOrders] = useState(false);
  const allOrders = store.getOrders();
  const products = store.getProducts();

  // Filter orders
  const orders = allOrders.filter((o) => (includeTestOrders ? true : !o.isTestOrder));

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingAdvanceCount = orders.filter((o) => o.status === 'PENDING_ADVANCE').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;

  const grossSales = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const verifiedAdvancePayments = orders
    .filter((o) => o.paymentStatus === 'ADVANCE_VERIFIED')
    .reduce((sum, o) => sum + o.advanceDeliveryFee, 0);

  const pendingCodCollections = orders
    .filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED')
    .reduce((sum, o) => sum + o.remainingCodAmount, 0);

  // Estimated profit calculation
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

  // Low stock products alert (< 5 in stock)
  const lowStockProducts = products.filter((p) => !p.isArchived && p.stock <= 5);

  return (
    <div className="space-y-8">
      {/* Top Banner with Test Orders Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            ATELIER STORE PERFORMANCE
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
            Executive Commerce Dashboard
          </h2>
        </div>

        {/* Test Order Filter Switch */}
        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-neutral-200 text-xs shadow-xs">
          <Filter className="w-4 h-4 text-neutral-400 ml-1" />
          <span className="text-neutral-700 font-medium">Include Test Sandbox Orders:</span>
          <button
            onClick={() => setIncludeTestOrders(!includeTestOrders)}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
              includeTestOrders
                ? 'bg-[#800000] text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {includeTestOrders ? 'ON' : 'OFF (Production Only)'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Gross Sales */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <span className="font-bold text-sm">৳</span>
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-extrabold text-neutral-950 tabular-nums tracking-tight">
            ৳{grossSales.toLocaleString()}
          </p>
          <div className="flex items-center text-[11px] text-emerald-600 font-medium font-sans tabular-nums">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>Est. Gross Margin: ৳{estimatedProfit.toLocaleString()}</span>
          </div>
        </div>

        {/* Verified Advance Delivery Payments */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Advance Fees</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
            ৳{verifiedAdvancePayments.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 block">
            Collected via bKash / Nagad prior to dispatch
          </span>
        </div>

        {/* Pending Cash on Delivery Balance */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending COD Collections</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-extrabold text-neutral-950 tabular-nums tracking-tight">
            ৳{pendingCodCollections.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 block">
            Receivable upon courier doorstep delivery
          </span>
        </div>

        {/* Orders Count & Status */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-[#800000]/10 text-[#800000] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-extrabold text-neutral-950 tabular-nums tracking-tight">
            {confirmedCount}{' '}
            <span className="text-xs text-neutral-400 font-sans font-normal">/ {totalOrdersCount} Total</span>
          </p>
          <span className="text-[11px] text-neutral-500 block font-sans tabular-nums">
            {pendingAdvanceCount} awaiting advance verification
          </span>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-serif text-lg font-bold text-neutral-950">
              Recent Order Activity
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#800000] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No orders registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 uppercase font-semibold">
                    <th className="pb-3">Order Ref</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Advance Status</th>
                    <th className="pb-3">COD Due</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 font-mono font-bold text-neutral-900 tracking-wider tabular-nums">
                        {order.orderNumber}
                        {order.isTestOrder && (
                          <span className="ml-1.5 text-[9px] bg-neutral-200 text-neutral-600 px-1 py-0.5 rounded-sm font-sans">
                            TEST
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-neutral-800">{order.customerName}</p>
                        <p className="font-mono text-[11px] text-neutral-500 tabular-nums">{order.customerPhone}</p>
                      </td>
                      <td className="py-3">
                        {order.paymentStatus === 'ADVANCE_VERIFIED' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums">
                            ৳{order.advanceDeliveryFee} Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums">
                            Pending ৳{order.advanceDeliveryFee}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-sans font-bold text-neutral-900 tabular-nums">
                        {order.status === 'DELIVERED' || order.paymentStatus === 'COD_COLLECTED' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 font-sans tabular-nums">
                            <CheckCircle2 className="w-3 h-3" />
                            ৳{order.remainingCodAmount.toLocaleString()} Collected
                          </span>
                        ) : (
                          <span>৳{order.remainingCodAmount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => onNavigateTab('orders')}
                          className="text-[#800000] font-semibold hover:underline"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock & Best-Sellers */}
        <div className="lg:col-span-4 space-y-6">
          {/* Inventory Watch */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-serif text-base font-bold text-neutral-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Inventory Watch</span>
              </h3>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-[#800000] font-medium"
              >
                Products
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                All garments have healthy inventory levels.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-neutral-800 truncate">{p.name}</p>
                      <span className="text-[10px] text-neutral-400">SKU: {p.sku}</span>
                    </div>
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md shrink-0">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 space-y-3">
            <h3 className="font-serif text-base font-bold text-white">
              Studio Quick Actions
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Seamlessly curate hero campaign slides, manage the interactive fashion hanger, or adjust delivery advance fees.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('homepage')}
                className="bg-neutral-800 hover:bg-neutral-700 text-white p-2.5 rounded-xl text-center font-medium transition-colors"
              >
                Hero & Hanger
              </button>
              <button
                onClick={() => onNavigateTab('settings')}
                className="bg-neutral-800 hover:bg-neutral-700 text-white p-2.5 rounded-xl text-center font-medium transition-colors"
              >
                Delivery Fees
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
