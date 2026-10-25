import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, ArrowRight } from 'lucide-react';
import { store } from '../services/store';
import { Order } from '../types';

interface TrackOrderViewProps {
  onNavigate: (path: string) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const cleaned = query.trim().toUpperCase();

    // Search by order number first
    let found = store.getOrderByNumber(cleaned);

    // If not found, search by phone number
    if (!found) {
      const orders = store.getOrders();
      found = orders.find((o) => o.customerPhone.includes(cleaned.replace(/[^0-9]/g, '')));
    }

    setSearchedOrder(found || null);
  };

  return (
    <div className="py-16 sm:py-24 bg-[#fcfcfc] min-h-[70vh]">
      <div className="max-w-2xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block mb-1">
            Concierge Courier Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950">
            Track Your Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Enter your HYDEE order reference (e.g. HYD-2026-8910) or customer phone number to trace parcel progress.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="flex gap-2 p-1.5 bg-white border border-neutral-200 rounded-2xl shadow-sm focus-within:border-[#800000]">
            <input
              type="text"
              required
              placeholder="Enter Order Reference Or Phone (e.g. HYD-2026-1029)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-xs sm:text-sm px-4 py-3 bg-transparent focus:outline-hidden"
            />
            <button
              type="submit"
              className="bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold px-6 py-3 rounded-xl tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </div>
        </form>

        {/* Search Result */}
        {hasSearched && !searchedOrder && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-xs text-neutral-500 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-semibold text-neutral-900 text-sm">No Matching Order Found</p>
            <p>
              Please verify your order reference number or reach out directly to our Dhaka atelier concierge.
            </p>
          </div>
        )}

        {searchedOrder && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold text-[#800000] block">
                  HYDEE Atelier Order
                </span>
                <h3 className="font-mono text-xl font-bold text-neutral-900">
                  {searchedOrder.orderNumber}
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-neutral-100 rounded-full text-neutral-800">
                {searchedOrder.status.replace('_', ' ')}
              </span>
            </div>

            {/* Courier Tracking Info if dispatched */}
            {searchedOrder.courierTrackingCode && (
              <div className="p-4 bg-rose-50/50 border border-rose-200/60 rounded-2xl text-xs space-y-1">
                <span className="font-semibold text-[#800000] flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  {searchedOrder.courierName} Express Dispatch
                </span>
                <p className="text-neutral-700">
                  Consignment ID:{' '}
                  <span className="font-mono font-bold">{searchedOrder.courierTrackingCode}</span>
                </p>
              </div>
            )}

            {/* Items Summary */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-neutral-900">
                Order Items ({searchedOrder.items.length})
              </h4>
              {searchedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-neutral-50">
                  <span>{item.productName} ({item.variantName}) × {item.quantity}</span>
                  <span className="font-bold">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Advance Delivery Charge</span>
                <span className="text-emerald-700 font-bold">
                  {searchedOrder.paymentStatus === 'ADVANCE_VERIFIED' ? 'Verified & Paid' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-900 font-bold pt-1 border-t border-neutral-200">
                <span>Remaining Cash On Delivery</span>
                <span>৳{searchedOrder.remainingCodAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate('/')}
                className="text-xs text-[#800000] hover:underline font-semibold cursor-pointer"
              >
                Return To Atelier Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
