import React, { useState } from 'react';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  Copy,
  Check,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { store } from '../services/store';
import { Order } from '../types';

interface TrackOrderViewProps {
  onNavigate: (path: string) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const cleaned = query.trim().toUpperCase();

    // 1. Search by order number first
    let found = store.getOrderByNumber(cleaned);

    // 2. If not found, search by phone number or internal id
    if (!found) {
      const orders = store.getOrders();
      const phoneDigits = cleaned.replace(/[^0-9]/g, '');
      found = orders.find(
        (o) =>
          (phoneDigits && o.customerPhone.replace(/[^0-9]/g, '').includes(phoneDigits)) ||
          o.id === query.trim() ||
          (o.courierTrackingCode && o.courierTrackingCode.toUpperCase() === cleaned)
      );
    }

    setSearchedOrder(found || null);
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Determine stage progression
  // Stages: 1 = Placed, 2 = Advance Paid, 3 = Atelier Packing, 4 = Shipped, 5 = Delivered
  const getStageStatus = (order: Order) => {
    const isCancelled = order.status === 'CANCELLED';
    if (isCancelled) return { currentStage: 0, isCancelled: true };

    let currentStage = 1;
    if (order.paymentStatus === 'ADVANCE_VERIFIED' || order.status === 'CONFIRMED') {
      currentStage = 3; // Advance paid, currently in Atelier Quality Check & Packing
    }
    if (order.status === 'PROCESSING') {
      currentStage = 3;
    }
    if (order.status === 'SHIPPED') {
      currentStage = 4; // Dispatched via Courier
    }
    if (order.status === 'DELIVERED' || order.paymentStatus === 'COD_COLLECTED') {
      currentStage = 5; // Delivered & COD collected
    }

    return { currentStage, isCancelled: false };
  };

  return (
    <div className="py-12 sm:py-20 bg-[#FAF9F7] min-h-[75vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block mb-1">
            CONCIERGE DISPATCH TRACKING
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-950">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-lg mx-auto">
            Enter your HYDEE order reference (e.g. <span className="font-mono font-semibold">HYD-2026-9723</span>) or mobile number to view genuine live dispatch & delivery progress.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 p-1.5 bg-white border border-neutral-200/90 rounded-2xl shadow-xs focus-within:border-[#800000] focus-within:ring-2 focus-within:ring-[#800000]/10 transition-all">
            <input
              type="text"
              required
              placeholder="Enter Order Reference (e.g. HYD-2026-9723) or Phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-xs sm:text-sm px-4 py-3 bg-transparent focus:outline-hidden font-sans placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="bg-[#800000] hover:bg-[#600000] text-white text-xs font-semibold px-6 py-3 rounded-xl tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Track Status</span>
            </button>
          </div>
        </form>

        {/* Search Result - Not Found */}
        {hasSearched && !searchedOrder && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-10 text-center text-xs text-neutral-500 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="font-serif text-lg font-bold text-neutral-900">
              No Matching Order Found
            </p>
            <p className="max-w-md mx-auto text-neutral-600 leading-relaxed">
              We could not locate an order matching &ldquo;<span className="font-mono font-semibold">{query}</span>&rdquo;. Please verify your order reference number or Bangladesh contact number.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-[#800000] font-semibold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Search Result - Order Found */}
        {searchedOrder && (() => {
          const { currentStage, isCancelled } = getStageStatus(searchedOrder);
          const isShipped = searchedOrder.status === 'SHIPPED' || Boolean(searchedOrder.courierTrackingCode);
          const isDelivered = searchedOrder.status === 'DELIVERED' || searchedOrder.paymentStatus === 'COD_COLLECTED';

          return (
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Order Reference & Live Status Tag */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#800000] tracking-widest uppercase">
                      HYDEE ATELIER DISPATCH
                    </span>
                    {searchedOrder.isTestOrder && (
                      <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-sm font-semibold">
                        SANDBOX
                      </span>
                    )}
                  </div>
                  <h3 className="font-mono text-2xl font-bold text-neutral-950 tracking-wider tabular-nums mt-0.5">
                    {searchedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : isShipped
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : isCancelled
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : searchedOrder.paymentStatus === 'ADVANCE_VERIFIED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {isDelivered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Delivered & COD Collected</span>
                      </>
                    ) : isShipped ? (
                      <>
                        <Truck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Dispatched via Courier</span>
                      </>
                    ) : isCancelled ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                        <span>Order Cancelled</span>
                      </>
                    ) : searchedOrder.paymentStatus === 'ADVANCE_VERIFIED' || searchedOrder.paymentStatus === 'FULLY_PAID' || searchedOrder.status === 'CONFIRMED' || searchedOrder.status === 'PROCESSING' ? (
                      <>
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        <span>Confirmed · Atelier Packaging</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Awaiting Payment Confirmation</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Realistic Visual Progress Stepper */}
              <div className="py-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-4">
                  Dispatch Lifecycle Progress
                </span>

                <div className="relative border-l-2 border-neutral-200 ml-4 sm:ml-5 pl-6 sm:pl-8 space-y-6">
                  
                  {/* Step 1: Order Placement */}
                  <div className="relative">
                    <span className="absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-900">
                        Order Initiated & Confirmed
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Booking received for customer <strong className="text-neutral-700">{searchedOrder.customerName}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Payment & Booking Confirmation */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                        searchedOrder.status === 'CONFIRMED' || searchedOrder.paymentStatus === 'ADVANCE_VERIFIED' || searchedOrder.paymentStatus === 'FULLY_PAID' || currentStage >= 3
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {searchedOrder.status === 'CONFIRMED' || searchedOrder.paymentStatus === 'ADVANCE_VERIFIED' || searchedOrder.paymentStatus === 'FULLY_PAID' || currentStage >= 3 ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-900">
                        {searchedOrder.paymentType === 'advance_cod' ? 'Cash On Delivery Confirmed' : 'Full Prepayment Verification'}
                      </h4>
                      {searchedOrder.paymentType === 'advance_cod' || searchedOrder.status === 'CONFIRMED' || searchedOrder.paymentStatus === 'ADVANCE_VERIFIED' || searchedOrder.paymentStatus === 'FULLY_PAID' || currentStage >= 3 ? (
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          {searchedOrder.paymentType === 'advance_cod'
                            ? `✓ 100% Cash On Delivery confirmed. Full amount of ৳${searchedOrder.totalAmount.toLocaleString()} payable at doorstep.`
                            : `✓ Full prepayment verified via ${searchedOrder.advancePaymentMethod ? searchedOrder.advancePaymentMethod.toUpperCase() : 'bKash/Nagad'}${searchedOrder.transactionId ? ` (TrxID: ${searchedOrder.transactionId})` : ''}. 0% COD due.`}
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Waiting for prepayment verification to release parcel from hold.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Atelier Inspection & Packaging */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                        currentStage > 3
                          ? 'bg-emerald-600 text-white'
                          : currentStage === 3
                          ? 'bg-[#800000] text-white animate-pulse'
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      {currentStage > 3 ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-900">
                        Atelier Inspection & Luxury Packaging
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {currentStage > 3
                          ? 'Completed. Garments inspected, hand-pressed, and packaged in signature HYDEE bespoke box.'
                          : currentStage === 3
                          ? 'In progress. Garments are currently undergoing inspection and packaging in our Dhaka atelier.'
                          : 'Scheduled upon advance payment confirmation.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Courier Handover & Dispatch */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                        isDelivered
                          ? 'bg-emerald-600 text-white'
                          : isShipped
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      {isDelivered ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Truck className="w-3 h-3" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-900">
                        Courier Handover & Consignment Dispatch
                      </h4>
                      {isShipped ? (
                        <div className="mt-1 p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                          <p className="text-xs text-neutral-800 font-semibold flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#800000]" />
                            <span>Courier Partner: {searchedOrder.courierName || 'Steadfast / Pathao'}</span>
                          </p>
                          <p className="text-xs text-neutral-700 flex items-center gap-2">
                            <span>Consignment ID:</span>
                            <span className="font-mono font-bold bg-white px-2 py-0.5 border border-neutral-200 rounded-md text-neutral-900">
                              {searchedOrder.courierTrackingCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(searchedOrder.courierTrackingCode || '')}
                              className="text-[10px] text-[#800000] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedTracking ? 'Copied' : 'Copy'}</span>
                            </button>
                          </p>
                          {searchedOrder.dispatchedAt && (
                            <p className="text-[10px] text-neutral-400">
                              Dispatched on {new Date(searchedOrder.dispatchedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Awaiting Atelier Dispatch — Parcel has not yet been handed over to courier. Your official courier consignment ID will appear here once dispatched.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 5: Doorstep Delivery & COD */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                        isDelivered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-neutral-900">
                        Doorstep Delivery & Cash on Delivery (COD)
                      </h4>
                      {isDelivered ? (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          ✓ Delivered to customer doorstep. Full Cash on Delivery (৳{searchedOrder.remainingCodAmount.toLocaleString()}) collected in full.
                        </p>
                      ) : (
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Pending courier arrival. Remaining COD balance of{' '}
                          <strong className="text-neutral-900 font-sans tabular-nums">৳{searchedOrder.remainingCodAmount.toLocaleString()}</strong>{' '}
                          will be payable in cash to courier rider upon parcel handover.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Destination */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-start gap-3 text-xs">
                <MapPin className="w-4 h-4 text-[#800000] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-neutral-900 block">
                    Delivery Destination ({searchedOrder.zoneName})
                  </span>
                  <p className="text-neutral-600">
                    {searchedOrder.deliveryAddress}, {searchedOrder.district}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-mono tabular-nums">
                    Contact: {searchedOrder.customerPhone}
                  </p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Bespoke Garments ({searchedOrder.items.length})
                </h4>
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl p-3 bg-white">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-10 h-12 object-cover rounded-md bg-neutral-100 shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{item.productName}</p>
                          <p className="text-neutral-500 text-[11px]">
                            {item.variantName} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-sans font-bold text-neutral-900 tabular-nums">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span className="font-sans font-bold text-neutral-900 tabular-nums">
                    ৳{searchedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Delivery Fee:</span>
                  <span className="font-sans font-bold text-neutral-900 tabular-nums">
                    ৳{searchedOrder.advanceDeliveryFee}
                  </span>
                </div>
                {searchedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({searchedOrder.discountCode}):</span>
                    <span className="font-sans font-bold tabular-nums">
                      -৳{searchedOrder.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
                  <span>Total Order Value:</span>
                  <span className="font-sans tabular-nums">৳{searchedOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-200/60 text-xs">
                  <span className="font-semibold text-neutral-700">Payable on Doorstep Delivery:</span>
                  <span className="font-sans font-bold text-[#800000] tabular-nums">
                    {searchedOrder.paymentType === 'full_prepaid' ? (
                      <span className="text-emerald-700 font-bold">৳0 (100% Pre-paid)</span>
                    ) : isDelivered ? (
                      <span className="text-emerald-700">
                        ৳{searchedOrder.remainingCodAmount.toLocaleString()} (Paid in Full)
                      </span>
                    ) : (
                      <span>৳{searchedOrder.remainingCodAmount.toLocaleString()} (Cash On Delivery)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="text-xs text-[#800000] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Return To HYDEE Storefront</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
