import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  AlertTriangle,
  Banknote,
  PackageCheck,
} from 'lucide-react';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';

interface ThankYouViewProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const ThankYouView: React.FC<ThankYouViewProps> = ({ orderNumber, onNavigate }) => {
  const order = store.getOrderByNumber(orderNumber);
  const settings = store.getSettings();
  const hasFiredPixel = useRef(false);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Meta Pixel Purchase Event (Only fire once per confirmed session)
    if (order && !hasFiredPixel.current) {
      const isConfirmed =
        order.status === 'CONFIRMED' ||
        order.paymentStatus === 'ADVANCE_VERIFIED' ||
        order.paymentStatus === 'FULLY_PAID' ||
        !order.isFullPayment;

      if (isConfirmed) {
        metaPixel.track('Purchase', {
          content_ids: order.items.map((i) => i.productId),
          content_type: 'product',
          value: order.totalAmount,
          currency: 'BDT',
          num_items: order.items.reduce((s, i) => s + i.quantity, 0),
        });
        hasFiredPixel.current = true;
      }
    }
  }, [order]);

  if (!order) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6 font-sans">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mt-2">
          We could not locate an order matching reference "{orderNumber}".
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-6 py-3 rounded-full uppercase cursor-pointer"
        >
          Return to HYDEE
        </button>
      </div>
    );
  }

  // Only block if it was a Full Prepayment order that was not completed
  if (order.isFullPayment && order.paymentStatus === 'UNPAID') {
    return (
      <div className="py-20 max-w-lg mx-auto px-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-950">
          Payment Verification Pending
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Order <strong>#{order.orderNumber}</strong> was initiated for 100% prepayment of <strong>৳{order.totalAmount.toLocaleString()}</strong>, but payment confirmation is pending.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => onNavigate('/checkout')}
            className="bg-[#800000] text-white text-xs font-semibold px-6 py-3.5 rounded-full uppercase cursor-pointer"
          >
            Complete Payment
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="border border-neutral-300 text-neutral-800 text-xs font-semibold px-6 py-3.5 rounded-full uppercase cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isFullPrepaid = Boolean(order.isFullPayment || order.paymentStatus === 'FULLY_PAID');

  const handlePrint = () => {
    window.print();
  };

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello HYDEE Concierge! I have a question regarding my confirmed order #${order.orderNumber}.`
    );
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="py-12 sm:py-16 bg-[#fcfcfc] font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        
        {/* Main Confirmation Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none">
          
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b border-neutral-100">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
              {isFullPrepaid ? '100% PREPAID · OFFICIALLY CONFIRMED' : 'CASH ON DELIVERY · OFFICIALLY CONFIRMED'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
              Thank You, {order.customerName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              {isFullPrepaid
                ? 'Your payment has been verified and your order is reserved for priority courier dispatch.'
                : 'Your Cash on Delivery booking has been confirmed! Please keep cash ready when the courier rider arrives at your doorstep.'}
            </p>
          </div>

          {/* Key Reference Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Order Reference</span>
              <span className="font-mono font-bold text-neutral-900 text-sm mt-0.5 block tracking-wider tabular-nums">
                {order.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Paid Online</span>
              <span className="font-sans font-bold text-emerald-600 text-sm mt-0.5 block tabular-nums">
                {isFullPrepaid ? `৳${order.totalAmount.toLocaleString()} (Paid)` : '৳0 (Zero Advance)'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Cash Due at Doorstep</span>
              <span className="font-sans font-bold text-[#800000] text-sm mt-0.5 block tabular-nums">
                {isFullPrepaid ? '৳0 (Fully Paid)' : `৳${order.totalAmount.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Delivery Courier</span>
              <span className="font-sans font-semibold text-neutral-800 text-xs mt-0.5 block">
                {order.courierName || 'Steadfast'} · {order.zoneName.includes('Inside') ? 'Dhaka' : 'Nationwide'}
              </span>
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <h3 className="font-serif text-base font-bold text-neutral-950 mb-4 pb-2 border-b border-neutral-100">
              Reserved Garments
            </h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-3 border-b border-neutral-50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <img src={item.imageUrl} alt={item.productName} className="w-14 h-16 object-cover rounded-lg bg-neutral-100 shrink-0" />
                    <div>
                      <h4 className="font-serif font-semibold text-neutral-900">{item.productName}</h4>
                      <p className="text-neutral-500 text-[11px] mt-0.5">Variant: {item.variantName} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-950">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-100 text-xs">
            <div className="space-y-1.5 text-neutral-600">
              <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider mb-2">Delivery Address</span>
              <p className="font-medium text-neutral-900">{order.customerName}</p>
              <p>{order.deliveryAddress}</p>
              <p>{order.district}, Bangladesh</p>
              <p>Mobile: {order.customerPhone}</p>
            </div>

            <div className="space-y-1.5 text-neutral-600">
              <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider mb-2">Payment Details</span>
              {isFullPrepaid ? (
                <>
                  <p>Method: <strong className="text-neutral-900 uppercase">{order.advancePaymentMethod || 'bKash / Nagad'}</strong></p>
                  {order.transactionId && <p>TrxID: <span className="font-mono font-bold text-neutral-900">{order.transactionId}</span></p>}
                  <p className="text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Prepayment Confirmed
                  </p>
                </>
              ) : (
                <>
                  <p>Method: <strong className="text-neutral-900">Cash On Delivery (COD)</strong></p>
                  <p>Payable at Doorstep: <strong className="text-[#800000]">৳{order.totalAmount.toLocaleString()}</strong></p>
                  <p className="text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <PackageCheck className="w-3.5 h-3.5" />
                    Booking Confirmed · Zero Advance Fee
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <button
                onClick={handleContactWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Concierge Update</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto bg-neutral-950 hover:bg-[#800000] text-white text-xs font-semibold py-3.5 px-6 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
