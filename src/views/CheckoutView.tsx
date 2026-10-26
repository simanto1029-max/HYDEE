import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { CartItem, DeliveryZone, Order } from '../types';

interface CheckoutViewProps {
  items: CartItem[];
  directBuyItem?: CartItem | null;
  onNavigate: (path: string) => void;
  onOrderConfirmed: (order: Order) => void;
  onClearCart: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  directBuyItem,
  onNavigate,
  onOrderConfirmed,
  onClearCart,
}) => {
  // If user clicked Buy Now directly, use that item; otherwise use items in cart
  const checkoutItems = directBuyItem ? [directBuyItem] : items;

  const zones = store.getDeliveryZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'zone-dhaka');
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Customer form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Flow states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  // Advance Payment Modal states
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card' | 'manual_deposit'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Calculations
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const advanceDeliveryFee = selectedZone ? selectedZone.advanceFee : 80;
  const totalAmount = Math.max(0, subtotal + advanceDeliveryFee - discountAmount);
  const remainingCodAmount = totalAmount - advanceDeliveryFee;

  // Track InitiateCheckout
  useEffect(() => {
    if (checkoutItems.length > 0) {
      metaPixel.track('InitiateCheckout', {
        num_items: checkoutItems.reduce((acc, i) => acc + i.quantity, 0),
        value: subtotal,
        currency: 'BDT',
      });
    }
  }, []);

  const handleApplyPromo = () => {
    setError(null);
    const code = discountCode.trim().toUpperCase();
    if (code === 'HYDEE1000') {
      if (subtotal >= 5000) {
        setAppliedDiscount('HYDEE1000');
        setDiscountAmount(1000);
      } else {
        setError('Code HYDEE1000 requires a minimum order value of ৳5,000.');
      }
    } else if (code === 'PRIVILEGE10') {
      setAppliedDiscount('PRIVILEGE10');
      setDiscountAmount(Math.round(subtotal * 0.1));
    } else {
      setError('Invalid or expired discount code.');
    }
  };

  // Step 1: Customer submits order details to create PENDING order
  const handleInitiateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone.match(/^01[3-9]\d{8}$/)) {
      setError('Please provide a valid 11-digit Bangladesh phone number (01xxxxxxxxx).');
      return;
    }
    if (!address.trim()) {
      setError('Please provide your detailed delivery address.');
      return;
    }

    setIsSubmitting(true);

    const result = store.createOrder({
      customerName: name.trim(),
      customerPhone: cleanPhone,
      customerEmail: email.trim() || undefined,
      deliveryAddress: address.trim(),
      district: district.trim(),
      zoneId: selectedZone.id,
      notes: notes.trim() || undefined,
      items: checkoutItems,
      discountCode: appliedDiscount || undefined,
      isTestOrder: false,
    });

    setIsSubmitting(false);

    if (!result.success || !result.order) {
      setError(result.error || 'Failed to initialize booking.');
      return;
    }

    setPendingOrder(result.order);
  };

  // Escape key handler for advance payment modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pendingOrder) {
        setPendingOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingOrder]);

  // Step 2: Customer pays advance delivery fee
  const handleVerifyAdvancePayment = () => {
    if (!pendingOrder) return;
    setPaymentError(null);

    const cleanTrx = transactionId.trim().toUpperCase();
    if (!cleanTrx || cleanTrx.length < 6) {
      setPaymentError('Please enter a valid Transaction ID (at least 6 characters).');
      return;
    }

    setIsVerifyingPayment(true);

    setTimeout(() => {
      const verifyResult = store.verifyAdvancePayment(
        pendingOrder.orderNumber,
        paymentMethod,
        cleanTrx,
        `${paymentMethod.toUpperCase()} Gateway Callback (Verified)`
      );

      setIsVerifyingPayment(false);

      if (!verifyResult.success || !verifyResult.order) {
        setPaymentError(verifyResult.error || 'Payment verification failed.');
        return;
      }

      // Clear cart
      if (!directBuyItem) {
        onClearCart();
      }

      onOrderConfirmed(verifyResult.order);
      onNavigate(`/thank-you?order=${verifyResult.order.orderNumber}`);
    }, 1200);
  };

  // Test sandbox autofill helper
  const handleSimulateSandboxSuccess = () => {
    setTransactionId(`TRX-TEST-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  if (checkoutItems.length === 0 && !pendingOrder) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Bag Is Empty</h2>
        <p className="text-xs text-neutral-500 mt-2">
          Please select a couture piece before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-6 py-3 rounded-full cursor-pointer"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="mb-8">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block mb-1">
            Secure Atelier Dispatch
          </span>
          <h1 className="font-serif text-3xl font-bold text-neutral-950">
            Cash On Delivery Booking
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Pay advance delivery charge now to book · Remaining ৳{remainingCodAmount.toLocaleString()} paid in cash at delivery.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Form: Delivery Information */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleInitiateOrder} className="space-y-6">
              
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950 pb-2 border-b border-neutral-100">
                  Recipient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Bangladesh Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Must be 11 digits starting with 01
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Email Address (For Order Tracking & Invoice)
                  </label>
                  <input
                    type="email"
                    placeholder="tanvir@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950 pb-2 border-b border-neutral-100">
                  Delivery Destination
                </h3>

                {/* Delivery Zone Selector */}
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Select Delivery Zone & Advance Charge *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {zones.map((zone) => {
                      const isSelected = selectedZoneId === zone.id;
                      return (
                        <div
                          key={zone.id}
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            if (zone.name.includes('Inside')) setDistrict('Dhaka');
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#800000] bg-rose-50/30 ring-1 ring-[#800000]'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-900">{zone.name}</span>
                          </div>
                          <p className="text-xs font-bold text-[#800000] mt-1">
                            ৳{zone.advanceFee} Advance
                          </p>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            {zone.estimatedDays}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhaka / Chittagong / Sylhet"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      House / Flat / Road / Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House 42, Road 11, Banani"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Special Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Call before delivery, ring second floor bell"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Advance Delivery Explanation */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-[#800000]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How HYDEE Cash On Delivery Works</span>
                </div>
                <p className="leading-relaxed">
                  1. You pay only the delivery courier charge (<strong>৳{advanceDeliveryFee}</strong>) in advance via bKash / Nagad / Card to guarantee parcel dispatch.
                  <br />
                  2. We dispatch your bespoke package via Pathao / Steadfast verified courier.
                  <br />
                  3. When the courier arrives, open the package, inspect your garment, and pay the remaining balance of <strong>৳{remainingCodAmount.toLocaleString()}</strong> in cash!
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] disabled:bg-neutral-300 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order & Pay ৳{advanceDeliveryFee} Advance Fee</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Review */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-neutral-950 pb-2 border-b border-neutral-100">
                Order Review ({checkoutItems.length} {checkoutItems.length === 1 ? 'Piece' : 'Pieces'})
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar">
                {checkoutItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex space-x-3 pb-3 border-b border-neutral-100 last:border-0"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded-lg bg-neutral-100 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between text-xs">
                      <div>
                        <h4 className="font-serif font-semibold text-neutral-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-neutral-500 mt-0.5">
                          Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-neutral-950">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code input */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount Code (e.g. HYDEE1000)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 text-xs p-3 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 rounded-xl cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedDiscount && (
                  <span className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Code {appliedDiscount} Applied Successfully (-৳{discountAmount.toLocaleString()})
                  </span>
                )}
              </div>

              {/* Financial Breakdown Table */}
              <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Garment Subtotal</span>
                  <span className="font-semibold text-neutral-950">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    Advance Delivery Fee ({selectedZone.name})
                  </span>
                  <span className="font-bold text-[#800000]">৳{advanceDeliveryFee}</span>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-between text-sm font-bold text-neutral-950">
                  <span>Total Order Value</span>
                  <span>৳{totalAmount.toLocaleString()}</span>
                </div>

                {/* Important Distinction */}
                <div className="pt-3 p-3 bg-neutral-50 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#800000]">
                    <span>1. Payable Now (Advance)</span>
                    <span>৳{advanceDeliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-neutral-800">
                    <span>2. Payable On Doorstep Delivery</span>
                    <span>৳{remainingCodAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advance Delivery Payment Gateway Modal */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingOrder(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            {/* Sticky Header with prominent, easy-to-click close button */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#800000] uppercase block">
                  Step 2 of 2: Verified Advance Payment
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mt-0.5">
                  Complete ৳{pendingOrder.advanceDeliveryFee} Advance Payment
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-neutral-100 px-2.5 py-1 rounded-md text-neutral-700">
                  {pendingOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingOrder(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close and edit details"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 touch-scroll">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <p className="text-xs text-neutral-600 leading-relaxed">
                As per HYDEE policy, an advance payment of <strong>৳{pendingOrder.advanceDeliveryFee}</strong> is required to confirm order #{pendingOrder.orderNumber}. The remaining <strong>৳{pendingOrder.remainingCodAmount.toLocaleString()}</strong> is collected as cash on delivery.
              </p>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-2">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'bkash'
                        ? 'border-[#E2136E] bg-[#E2136E]/10 text-[#E2136E]'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'nagad'
                        ? 'border-[#F7931E] bg-[#F7931E]/10 text-[#F7931E]'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    Nagad
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    Debit / Card
                  </button>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5 text-neutral-700">
                <p className="font-semibold text-neutral-900">
                  {paymentMethod === 'bkash' && 'bKash Merchant / Payment Instructions:'}
                  {paymentMethod === 'nagad' && 'Nagad Merchant Instructions:'}
                  {paymentMethod === 'card' && 'Card / Online Banking Instructions:'}
                </p>
                <p>
                  1. Send exactly <strong>৳{pendingOrder.advanceDeliveryFee}</strong> to HYDEE official account:{' '}
                  <span className="font-mono font-bold text-neutral-950">01711-002233</span>
                </p>
                <p>
                  2. Reference: <span className="font-mono font-bold">{pendingOrder.orderNumber}</span>
                </p>
                <p>3. Enter the 8–10 character Transaction ID (TrxID) below to verify.</p>
              </div>

              {/* TrxID Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    Transaction ID (TrxID) *
                  </label>
                  {/* Sandbox helper */}
                  <button
                    type="button"
                    onClick={handleSimulateSandboxSuccess}
                    className="text-[11px] text-[#800000] font-medium hover:underline cursor-pointer"
                  >
                    [Sandbox Auto-Fill TrxID]
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 9J18KD39A"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full text-xs font-mono p-3.5 border border-neutral-200 rounded-xl uppercase focus:border-[#800000] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingOrder(null)}
                  className="w-full sm:w-auto px-5 py-3.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer text-center"
                >
                  Cancel / Edit Info
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAdvancePayment}
                  disabled={isVerifyingPayment}
                  className="flex-1 w-full bg-[#800000] hover:bg-[#5c0000] text-white text-xs font-semibold tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-neutral-300 cursor-pointer"
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Gateway Callback...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-center text-neutral-400">
                Encrypted with SSL and automated verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
