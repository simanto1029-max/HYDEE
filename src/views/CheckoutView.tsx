import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Tag,
  X,
  Banknote,
  Copy,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { store } from '../services/store';
import { metaPixel } from '../services/metaPixel';
import { CartItem, Order } from '../types';

interface CheckoutViewProps {
  items: CartItem[];
  directBuyItem?: CartItem | null;
  onNavigate: (path: string) => void;
  onOrderConfirmed: (order: Order) => void;
  onClearCart: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items: initialItems,
  directBuyItem,
  onNavigate,
  onOrderConfirmed,
  onClearCart,
}) => {
  // Local checkout items state for real-time quantity adjustments
  const [localDirectItem, setLocalDirectItem] = useState<CartItem | null>(directBuyItem || null);
  const [cartItemsState, setCartItemsState] = useState<CartItem[]>(
    directBuyItem ? [directBuyItem] : initialItems.length > 0 ? initialItems : store.getCart()
  );

  const checkoutItems = localDirectItem ? [localDirectItem] : cartItemsState;

  // Delivery Zones
  const zones = store.getDeliveryZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'zone-dhaka');
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Recipient form inputs (Email address box removed per user request)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Exactly 2 Payment Options:
  // 1. 'advance_cod' -> Cash On Delivery (Advance courier delivery fee required)
  // 2. 'full_prepaid' -> Full Payment (Product price + delivery fee paid 100% in advance)
  const [paymentType, setPaymentType] = useState<'advance_cod' | 'full_prepaid'>('advance_cod');
  const [subPaymentChannel, setSubPaymentChannel] = useState<'bkash' | 'nagad'>('bkash');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Promo code states
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Submission & verification modal states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [modalTrxId, setModalTrxId] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Remember people who typed their phone number but did not finish the order (shown to the admin as "Abandoned Checkouts")
  useEffect(() => {
    const cleanLeadPhone = phone.trim();
    if (!/^01[3-9]\d{8}$/.test(cleanLeadPhone) || checkoutItems.length === 0 || pendingOrder) return;
    const timer = setTimeout(() => {
      store.saveCheckoutLead({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: cleanLeadPhone,
        address: deliveryAddress,
        items: checkoutItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          color: i.color,
        })),
        total: checkoutItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        zone: selectedZone?.name,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [phone, firstName, lastName, deliveryAddress, checkoutItems.length, selectedZoneId, pendingOrder]);

  // Calculations
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasFreeShippingOffer = checkoutItems.some((item) => item.freeShipping);
  const standardFee = selectedZone ? selectedZone.advanceFee : 80;
  const advanceDeliveryFee = hasFreeShippingOffer ? 0 : standardFee;
  const totalAmount = Math.max(0, subtotal + advanceDeliveryFee - discountAmount);

  // Payable values based on selected payment option:
  const payableNow = paymentType === 'full_prepaid' ? totalAmount : 0;
  const doorstepCodDue = paymentType === 'full_prepaid' ? 0 : totalAmount;

  const siteSettings = store.getSettings();
  const bkashWalletNumber = siteSettings.bkashNumber || '01601705804';
  const nagadWalletNumber = siteSettings.nagadNumber || '01601705804';
  const activeChannelNumber = subPaymentChannel === 'bkash' ? bkashWalletNumber : nagadWalletNumber;
  const formattedActiveNumber = activeChannelNumber.length === 11
    ? `${activeChannelNumber.slice(0, 5)}-${activeChannelNumber.slice(5)}`
    : activeChannelNumber;

  // Track InitiateCheckout on mount
  useEffect(() => {
    if (checkoutItems.length > 0) {
      metaPixel.track('InitiateCheckout', {
        num_items: totalItemCount,
        value: subtotal,
        currency: 'BDT',
      });
    }
  }, []);

  // Sync cart items when prop changes
  useEffect(() => {
    if (!directBuyItem) {
      setCartItemsState(initialItems.length > 0 ? initialItems : store.getCart());
    }
  }, [initialItems, directBuyItem]);

  // Escape key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pendingOrder) {
        setPendingOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingOrder]);

  // Adjust item quantity directly in checkout
  const handleUpdateItemQuantity = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) return;

    if (localDirectItem) {
      setLocalDirectItem({
        ...localDirectItem,
        quantity: Math.min(newQty, localDirectItem.maxStock || 10),
      });
    } else {
      store.updateCartQuantity(item.productId, item.variantId, newQty);
      setCartItemsState(store.getCart());
    }
  };

  // Copy Merchant / Personal number helper
  const handleCopyNumber = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(label);
    setTimeout(() => setCopiedNumber(null), 2200);
  };

  // Recalculate discount if applied coupon exists and subtotal changes
  useEffect(() => {
    if (appliedDiscount) {
      const result = store.validateCoupon(appliedDiscount, subtotal);
      if (result.valid) {
        setDiscountAmount(result.discountAmount);
      } else {
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setError(result.error || 'Coupon removed as order no longer satisfies requirements.');
      }
    }
  }, [subtotal, appliedDiscount]);

  // Promo code apply
  const handleApplyPromo = () => {
    setError(null);
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter a coupon code.');
      return;
    }
    const result = store.validateCoupon(code, subtotal);
    if (result.valid && result.coupon) {
      setAppliedDiscount(result.coupon.code);
      setDiscountAmount(result.discountAmount);
    } else {
      setError(result.error || 'Invalid or expired discount code.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode('');
  };

  // Form submission: Validate inputs, create pending order and OPEN the payment modal
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError('Please provide your full name.');
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone.match(/^01[3-9]\d{8}$/)) {
      setError('Please provide a valid 11-digit Bangladesh mobile number (e.g. 017xxxxxxxx).');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please provide your delivery address (House / Road / Area).');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Same mobile number cannot place another order within 10 minutes (stops fake and accidental duplicate orders)
    const cooldown = await store.checkOrderCooldown(cleanPhone);
    if (cooldown.blocked) {
      setIsSubmitting(false);
      setError(
        `এই মোবাইল নম্বর থেকে একটু আগেই অর্ডার করা হয়েছে। অনুগ্রহ করে ${cooldown.minutesLeft} মিনিট পর আবার চেষ্টা করুন, অথবা আমাদের কল করে জানান। (An order was just placed with this number. Please try again in ${cooldown.minutesLeft} min.)`
      );
      return;
    }

    const result = store.createOrder({
      customerName: fullName,
      customerPhone: cleanPhone,
      deliveryAddress: deliveryAddress.trim(),
      district: district.trim() || (selectedZone.name.includes('Inside') ? 'Dhaka' : 'Outside Dhaka'),
      zoneId: selectedZone.id,
      notes: deliveryNotes.trim() || undefined,
      items: checkoutItems,
      discountCode: appliedDiscount || undefined,
      paymentType,
      isTestOrder: false,
    });

    setIsSubmitting(false);

    if (!result.success || !result.order) {
      setError(result.error || 'Failed to place booking.');
      return;
    }

    const createdOrder = result.order;
    store.removeCheckoutLeadForPhone(cleanPhone); // now it is a real order, not just an abandoned checkout

    // For Cash on Delivery: Order is placed and confirmed immediately! Zero advance payment popup!
    if (paymentType === 'advance_cod') {
      if (!directBuyItem) {
        onClearCart();
      }
      onOrderConfirmed(createdOrder);
      onNavigate(`/thank-you?order=${createdOrder.orderNumber}`);
      return;
    }

    // For 100% Full Prepayment: Open payment modal to complete bKash / Nagad transfer
    setPendingOrder(createdOrder);
    setModalTrxId('');
    setPaymentError(null);
  };

  // Customer submits the TrxID. The order is only CONFIRMED after the admin verifies the money in the bKash/Nagad app.
  const handleVerifyModalPayment = () => {
    if (!pendingOrder) return;
    setPaymentError(null);

    const cleanTrx = modalTrxId.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,14}$/.test(cleanTrx)) {
      setPaymentError('Please enter the exact Transaction ID from your bKash/Nagad SMS (8-14 letters and numbers, no spaces or dashes).');
      return;
    }

    setIsVerifyingPayment(true);

    setTimeout(() => {
      const result = store.submitPaymentReference(pendingOrder.orderNumber, subPaymentChannel, cleanTrx);

      setIsVerifyingPayment(false);

      if (!result.success || !result.order) {
        setPaymentError(result.error || 'Could not submit your payment reference. Please try again.');
        return;
      }

      if (!directBuyItem) {
        onClearCart();
      }

      onOrderConfirmed(result.order);
      onNavigate(`/thank-you?order=${result.order.orderNumber}`);
    }, 600);
  };

  if (checkoutItems.length === 0 && !pendingOrder) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-black mb-4">
          <Banknote className="w-8 h-8 text-black" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-black">Your Bag Is Empty</h2>
        <p className="text-xs text-neutral-600 mt-2 font-medium">
          Please explore our couture collection before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="mt-6 bg-[#800000] text-white text-xs font-semibold px-6 py-3 rounded-full cursor-pointer hover:bg-[#600000] transition-colors"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-5 sm:py-12 text-black font-sans pb-24 sm:pb-12">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb Navigation */}
        <div className="mb-5 sm:mb-6">
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-black hover:text-[#800000] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-black" />
            <span>Home / Products</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-black text-xs rounded-2xl flex items-center gap-2 shadow-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Recipient Information & 2 Payment Options */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 min-w-0">
            
            {/* Section 1: Check Out Your Items */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                Check Out Your Items
              </h1>
              <p className="text-xs text-black font-medium mt-1 mb-5">
                For a better experience, check your item and choose your shipping before ordering.
              </p>

              <div className="space-y-3.5">
                {/* First Name & Last Name Split Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* First Name */}
                  <div className="border border-neutral-300 rounded-xl p-3 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all flex items-start gap-2.5">
                    <User className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[11px] uppercase font-bold text-black tracking-wider">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-black focus:outline-hidden bg-transparent placeholder:text-neutral-500 mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="border border-neutral-300 rounded-xl p-3 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all flex items-start gap-2.5">
                    <User className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[11px] uppercase font-bold text-black tracking-wider">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-black focus:outline-hidden bg-transparent placeholder:text-neutral-500 mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Number (Email box completely removed) */}
                <div className="border border-neutral-300 rounded-xl p-3 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase font-bold text-black tracking-wider">
                      Mobile Number (11 Digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm font-mono font-bold text-black focus:outline-hidden bg-transparent placeholder:text-neutral-500 mt-0.5"
                    />
                  </div>
                </div>

                {/* Delivery Address Box */}
                <div className="border border-neutral-300 rounded-xl p-3.5 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase font-bold text-black tracking-wider">
                      Delivery Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs sm:text-sm font-semibold text-black focus:outline-hidden bg-transparent placeholder:text-neutral-500 mt-0.5 resize-none"
                    />
                  </div>
                </div>

                {/* Shipping Region & Delivery Charge */}
                <div className="pt-1">
                  <span className="block text-[11px] uppercase font-bold text-black tracking-wider mb-2">
                    Shipping Region & Delivery Charge *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              ? 'border-2 border-black bg-neutral-50 shadow-xs'
                              : 'border-neutral-300 bg-white hover:border-black'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-black">{zone.name}</span>
                            <span className="font-sans font-bold text-black tabular-nums">
                              ৳{zone.advanceFee}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Payment Method (Only 2 clean options on the main page) */}
            <div className="pt-2">
              <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight mb-4">
                Payment Method
              </h2>

              {/* Exactly 2 options */}
              <div className="space-y-3">
                
                {/* OPTION 1: Cash on Delivery (100% COD - Zero Advance Fee) */}
                <div
                  onClick={() => setPaymentType('advance_cod')}
                  className={`border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentType === 'advance_cod'
                      ? 'border-2 border-black bg-neutral-50 shadow-xs'
                      : 'border-neutral-300 bg-white hover:border-black'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-black shrink-0 mt-0.5">
                      <Banknote className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-black">Cash On Delivery</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentType === 'advance_cod'
                        ? 'border-black bg-black'
                        : 'border-neutral-400'
                    }`}
                  >
                    {paymentType === 'advance_cod' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* OPTION 2: Full Payment (100% Pre-paid) */}
                <div
                  onClick={() => setPaymentType('full_prepaid')}
                  className={`border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentType === 'full_prepaid'
                      ? 'border-2 border-black bg-neutral-50 shadow-xs'
                      : 'border-neutral-300 bg-white hover:border-black'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-black shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-black">Full Payment (bKash / Nagad)</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentType === 'full_prepaid'
                        ? 'border-black bg-black'
                        : 'border-neutral-400'
                    }`}
                  >
                    {paymentType === 'full_prepaid' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Current Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 mt-6 lg:mt-0 min-w-0">
            <div className="bg-[#F9FAFB] rounded-3xl p-5 sm:p-7 border border-neutral-300 shadow-2xs space-y-5">
              
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-black">
                  Current Order
                </h3>
                <p className="text-xs text-black font-medium mt-0.5">
                  The sum of all total payments for goods there
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                {checkoutItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="bg-white rounded-2xl p-3.5 border border-neutral-300 shadow-2xs flex items-center gap-3.5"
                  >
                    {/* Item Image */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-xl bg-neutral-100 shrink-0"
                    />

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-black line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="font-sans font-bold text-xs sm:text-sm text-black tabular-nums shrink-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-black font-medium mt-0.5">
                        {item.size ? `Size: ${item.size}` : ''} {item.color ? `· ${item.color}` : ''}
                      </p>

                      {/* Quantity Controller */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-200">
                        <span className="text-[11px] text-black font-bold">
                          Quantity : {item.quantity}
                        </span>

                        <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-300">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item, 1)}
                            className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-black" />
                          </button>
                          <span className="text-xs font-bold text-black px-1 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item, -1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 text-black" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Big Row */}
              <div className="pt-3 border-t border-neutral-300 flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-black">
                  Subtotal
                </span>
                <span className="font-sans text-base sm:text-lg font-extrabold text-black tabular-nums">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              {/* Promo Code Row */}
              <div className="pt-1">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-black font-bold">
                    <span className="flex items-center gap-1 font-bold text-black">
                      <Tag className="w-3.5 h-3.5 text-black" />
                      <span>{appliedDiscount}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold tabular-nums text-black">- ৳{discountAmount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-black hover:text-red-700 cursor-pointer"
                        title="Remove promo"
                      >
                        <X className="w-3.5 h-3.5 text-black" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Code Promo (e.g. HYDEE1000)"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 text-xs px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-black font-semibold placeholder:text-neutral-500 focus:border-black focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Detailed Breakdown Lines */}
              <div className="space-y-2 text-xs text-black pt-2 border-t border-neutral-300 font-medium">
                <div className="flex justify-between">
                  <span className="font-bold text-black">Items</span>
                  <span className="font-bold text-black font-sans tabular-nums">{totalItemCount}x</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-bold text-black">Code Promo</span>
                  <span className="font-bold text-black font-sans tabular-nums">
                    {discountAmount > 0 ? `- ৳${discountAmount.toLocaleString()}` : '৳0'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-bold text-black">Standard Delivery Fee</span>
                  <span className={`font-bold font-sans tabular-nums ${hasFreeShippingOffer ? 'text-emerald-700' : 'text-black'}`}>
                    {hasFreeShippingOffer ? 'FREE (Bundle Offer)' : `৳${advanceDeliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-bold text-black">Vat (0%)</span>
                  <span className="font-bold text-black font-sans tabular-nums">৳0</span>
                </div>

                {/* Clear Payment Breakdown */}
                <div className="p-3.5 bg-white rounded-xl border border-neutral-300 space-y-2 mt-2">
                  <div className="flex justify-between text-xs font-extrabold text-black">
                    <span>
                      {paymentType === 'full_prepaid' ? 'Total Payable Now (100% Pre-paid):' : 'Payable Now Online:'}
                    </span>
                    <span className="font-sans text-sm tabular-nums text-black">
                      {paymentType === 'full_prepaid' ? `৳${payableNow.toLocaleString()}` : '৳0 (Zero Online)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-black">
                    <span>Payable on Doorstep Delivery:</span>
                    <span className="font-sans tabular-nums text-black">
                      {paymentType === 'full_prepaid' ? '৳0 (Fully Paid)' : `৳${doorstepCodDue.toLocaleString()} (Cash On Delivery)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#800000] hover:bg-[#600000] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>
                    {paymentType === 'full_prepaid'
                      ? `Proceed To Full Prepayment · ৳${totalAmount.toLocaleString()}`
                      : `Confirm Cash On Delivery Order · ৳${totalAmount.toLocaleString()}`}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Payment Options Modal (Opens only when customer chooses 100% Full Prepayment) */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden relative text-neutral-900 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white px-5 sm:px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#800000]/10 flex items-center justify-center text-[#800000] shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#800000]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#800000] uppercase block">
                    100% Secure Prepayment
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900">
                    Payment Verification
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                  {pendingOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingOrder(null)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close and return to checkout"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs flex-1 touch-scroll">
              
              {/* Clean Payable Amount Card */}
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                    Total Payable Amount
                  </span>
                  <div className="font-sans text-2xl font-black text-[#800000] tracking-tight mt-0.5">
                    ৳{payableNow.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    <span>৳0 Due At Doorstep</span>
                  </span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Gateway Channel Selector */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setSubPaymentChannel('bkash')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      subPaymentChannel === 'bkash'
                        ? 'border-[#D12053] bg-[#D12053]/[0.05] ring-2 ring-[#D12053]/30 shadow-2xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#D12053] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          b
                        </span>
                        <span className="font-bold text-xs text-neutral-900">bKash</span>
                      </div>
                      {subPaymentChannel === 'bkash' && (
                        <div className="w-4 h-4 rounded-full bg-[#D12053] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-neutral-800 block">
                      {bkashWalletNumber.slice(0, 5)}-{bkashWalletNumber.slice(5)}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-medium block mt-0.5">Send Money (Personal)</span>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setSubPaymentChannel('nagad')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      subPaymentChannel === 'nagad'
                        ? 'border-[#F7931E] bg-[#F7931E]/[0.05] ring-2 ring-[#F7931E]/30 shadow-2xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#F7931E] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          N
                        </span>
                        <span className="font-bold text-xs text-neutral-900">Nagad</span>
                      </div>
                      {subPaymentChannel === 'nagad' && (
                        <div className="w-4 h-4 rounded-full bg-[#F7931E] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-neutral-800 block">
                      {nagadWalletNumber.slice(0, 5)}-{nagadWalletNumber.slice(5)}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-medium block mt-0.5">Send Money (Personal)</span>
                  </button>
                </div>
              </div>

              {/* Transfer Details & Copy Box */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                      {subPaymentChannel === 'bkash' ? 'bKash' : 'Nagad'} Number:
                    </span>
                    <span className="font-mono text-base font-black text-neutral-950 tracking-wider">
                      {formattedActiveNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyNumber(activeChannelNumber, `modal-${subPaymentChannel}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copiedNumber === `modal-${subPaymentChannel}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-300" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-neutral-600 space-y-1 pt-2 border-t border-neutral-200 leading-relaxed font-normal">
                  <p>১. আপনার {subPaymentChannel === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপ থেকে ওপরের নম্বরে <strong>৳{payableNow.toLocaleString()}</strong> Send Money করুন।</p>
                  <p>২. ট্রানজেকশনের পর পাওয়া TrxID টি নিচের ঘরে লিখে কনফার্ম করুন।</p>
                </div>
              </div>

              {/* TrxID Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-800 uppercase text-[11px] tracking-wider block">
                  Transaction ID / TrxID (From SMS) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9K2837L10"
                  value={modalTrxId}
                  onChange={(e) => setModalTrxId(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-neutral-300 rounded-xl font-mono text-sm font-bold text-center tracking-widest focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-hidden bg-white text-neutral-900 placeholder:text-neutral-400 uppercase shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyModalPayment}
                  disabled={isVerifyingPayment}
                  className="w-full bg-[#800000] hover:bg-[#600000] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-300 active:scale-[0.99]"
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Submit Payment (৳{payableNow.toLocaleString()})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPendingOrder(null)}
                  className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer text-center"
                >
                  Cancel / Return to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
