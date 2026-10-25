import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Truck,
  Printer,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
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
    if (order && order.paymentStatus === 'ADVANCE_VERIFIED' && !hasFiredPixel.current) {
      hasFiredPixel.current = true;
      // Confetti burst
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#800000', '#D4AF37', '#111827'],
        });
      } catch (e) {
        // ignore in non-browser
      }

      // Fire official Meta Pixel Purchase event with deduplication
      metaPixel.trackPurchase(
        order.orderNumber,
        order.totalAmount,
        'BDT',
        order.items.reduce((acc, i) => acc + i.quantity, 0)
      );
    }
  }, [order]);

  if (!order) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mt-2">
          We could not locate an order matching reference "{orderNumber}".
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-6 py-3 rounded-full uppercase"
        >
          Return to Atelier
        </button>
      </div>
    );
  }

  // Requirement: An unverified or pending-payment order must NOT be displayed as confirmed
  if (order.paymentStatus !== 'ADVANCE_VERIFIED') {
    return (
      <div className="py-20 max-w-lg mx-auto px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-950">
          Advance Payment Pending Verification
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Order <strong>#{order.orderNumber}</strong> was created, but the required advance delivery charge of <strong>৳{order.advanceDeliveryFee}</strong> has not been verified yet.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => onNavigate('/checkout')}
            className="bg-[#800000] text-white text-xs font-semibold px-6 py-3.5 rounded-full uppercase"
          >
            Complete Advance Payment
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="border border-neutral-300 text-neutral-800 text-xs font-semibold px-6 py-3.5 rounded-full uppercase"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

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
    <div className="py-12 sm:py-16 bg-[#fcfcfc]">
      <div className="max-w-3xl mx-auto px-6 sm:px-10">
        
        {/* Main Confirmation Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none">
          
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b border-neutral-100">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#800000] uppercase block">
              OFFICIALLY CONFIRMED & RESERVED
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
              Thank You, {order.customerName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              Your bespoke atelier order has been reserved in our Dhaka dispatch registry. We will inspect and package your garments in the signature presentation box.
            </p>
          </div>

          {/* Key Reference Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Order Reference</span>
              <span className="font-mono font-bold text-neutral-900 text-sm mt-0.5 block">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Advance Paid</span>
              <span className="font-bold text-emerald-600 text-sm mt-0.5 block">৳{order.advanceDeliveryFee} (Verified)</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Doorstep COD Due</span>
              <span className="font-bold text-[#800000] text-sm mt-0.5 block">৳{order.remainingCodAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Assigned Courier</span>
              <span className="font-semibold text-neutral-800 text-sm mt-0.5 block">{order.courierName} ({order.courierTrackingCode})</span>
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
              <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider mb-2">Payment Verification</span>
              <p>Method: <strong className="text-neutral-900 uppercase">{order.advancePaymentMethod}</strong></p>
              <p>TrxID: <span className="font-mono font-bold text-neutral-900">{order.transactionId}</span></p>
              <p>Verified at: {order.verifiedAt ? new Date(order.verifiedAt).toLocaleString() : 'Just now'}</p>
              <p className="text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Delivery Advance Verified
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold py-3 px-5 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <button
                onClick={handleContactWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold py-3 px-5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Concierge Update</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto bg-neutral-950 hover:bg-[#800000] text-white text-xs font-semibold py-3.5 px-6 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
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
