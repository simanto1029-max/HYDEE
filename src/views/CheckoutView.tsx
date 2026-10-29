import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  X,
  Banknote,
  CreditCard,
  Copy,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  Sparkles,
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

  // Recipient form inputs (matching reference design split fields)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Selected Payment Method
  // 'cod' | 'card' | 'bkash' | 'nagad'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'card' | 'bkash' | 'nagad'>('cod');
  const [inlineTrxId, setInlineTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

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

  // Calculations
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const advanceDeliveryFee = selectedZone ? selectedZone.advanceFee : 80;
  const totalAmount = Math.max(0, subtotal + advanceDeliveryFee - discountAmount);
  const remainingCodAmount = totalAmount - advanceDeliveryFee;

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

  // Copy Merchant / Personal bKash number
  const handleCopyMerchantNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Promo code apply
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

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode('');
  };

  // Form submission: Create order & proceed to verification
  const handleSubmitCheckout = (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    const result = store.createOrder({
      customerName: fullName,
      customerPhone: cleanPhone,
      customerEmail: email.trim() || undefined,
      deliveryAddress: deliveryAddress.trim(),
      district: district.trim() || (selectedZone.name.includes('Inside') ? 'Dhaka' : 'Outside Dhaka'),
      zoneId: selectedZone.id,
      notes: deliveryNotes.trim() || undefined,
      items: checkoutItems,
      discountCode: appliedDiscount || undefined,
      isTestOrder: false,
    });

    setIsSubmitting(false);

    if (!result.success || !result.order) {
      setError(result.error || 'Failed to place booking.');
      return;
    }

    const createdOrder = result.order;

    // If user already typed TrxID inline in the checkout page
    if (inlineTrxId.trim() && inlineTrxId.trim().length >= 6) {
      const mappedMethod =
        selectedPaymentMethod === 'bkash'
          ? 'bkash'
          : selectedPaymentMethod === 'nagad'
          ? 'nagad'
          : selectedPaymentMethod === 'card'
          ? 'card'
          : 'bkash';

      const verifyResult = store.verifyAdvancePayment(
        createdOrder.orderNumber,
        mappedMethod,
        inlineTrxId.trim().toUpperCase(),
        `${mappedMethod.toUpperCase()} Direct Checkout Verification`
      );

      if (verifyResult.success && verifyResult.order) {
        if (!directBuyItem) onClearCart();
        onOrderConfirmed(verifyResult.order);
        onNavigate(`/thank-you?order=${verifyResult.order.orderNumber}`);
        return;
      }
    }

    // Otherwise, open the verification modal with pre-selected method
    setPendingOrder(createdOrder);
    setModalTrxId(inlineTrxId.trim());
  };

  // Verify advance payment inside modal
  const handleVerifyModalPayment = () => {
    if (!pendingOrder) return;
    setPaymentError(null);

    const cleanTrx = modalTrxId.trim().toUpperCase();
    if (!cleanTrx || cleanTrx.length < 6) {
      setPaymentError('Please enter a valid Transaction ID (at least 6 characters).');
      return;
    }

    setIsVerifyingPayment(true);

    setTimeout(() => {
      const mappedMethod =
        selectedPaymentMethod === 'bkash'
          ? 'bkash'
          : selectedPaymentMethod === 'nagad'
          ? 'nagad'
          : selectedPaymentMethod === 'card'
          ? 'card'
          : 'bkash';

      const verifyResult = store.verifyAdvancePayment(
        pendingOrder.orderNumber,
        mappedMethod,
        cleanTrx,
        `${mappedMethod.toUpperCase()} Gateway Callback (Verified)`
      );

      setIsVerifyingPayment(false);

      if (!verifyResult.success || !verifyResult.order) {
        setPaymentError(verifyResult.error || 'Payment verification failed.');
        return;
      }

      if (!directBuyItem) {
        onClearCart();
      }

      onOrderConfirmed(verifyResult.order);
      onNavigate(`/thank-you?order=${verifyResult.order.orderNumber}`);
    }, 900);
  };

  // Test sandbox TRX fill
  const handleSimulateSandboxSuccess = () => {
    const randomTrx = `TRX-QA-${Math.floor(100000 + Math.random() * 900000)}`;
    setModalTrxId(randomTrx);
    setInlineTrxId(randomTrx);
  };

  if (checkoutItems.length === 0 && !pendingOrder) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <Banknote className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Bag Is Empty</h2>
        <p className="text-xs text-neutral-500 mt-2">
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
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-neutral-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Back Navigation Breadcrumb (Matching Image 2) */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-800 hover:text-[#800000] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-600" />
            <span>Home / Products</span>
          </button>
        </div>

        {/* Stepper Tabs (Matching Image 2) */}
        <div className="border-b border-neutral-200 mb-8 sm:mb-10">
          <div className="flex items-center gap-8 text-xs sm:text-sm font-semibold">
            {/* Step 1: Customer Information */}
            <div className="flex items-center gap-2 pb-3 border-b-2 border-neutral-900 text-neutral-900 cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-neutral-500 text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>Customer Information</span>
            </div>

            {/* Step 2: Payment Details */}
            <div className="flex items-center gap-2 pb-3 text-neutral-400 border-b-2 border-transparent">
              <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>Payment Details</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Grid (Matching Image 2) */}
        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Customer Information & Payment Method */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Section 1: Check Out Your Items */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
                Check Out Your Items
              </h2>
              <p className="text-xs text-neutral-500 mt-1 mb-5">
                For a better experience, check your item and choose your shipping before ordering.
              </p>

              <div className="space-y-3.5">
                {/* First Name & Last Name Split Row (Matching Image 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* First Name */}
                  <div className="border border-neutral-250 rounded-xl p-3 bg-white focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all flex items-start gap-2.5">
                    <User className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mohammad"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-hidden bg-transparent placeholder:text-neutral-300 mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="border border-neutral-250 rounded-xl p-3 bg-white focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all flex items-start gap-2.5">
                    <User className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Abdullah"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-hidden bg-transparent placeholder:text-neutral-300 mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Number & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Mobile Number */}
                  <div className="border border-neutral-250 rounded-xl p-3 bg-white focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                        Mobile Number (11 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="017xxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs sm:text-sm font-mono font-semibold text-neutral-900 focus:outline-hidden bg-transparent placeholder:text-neutral-300 mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="border border-neutral-250 rounded-xl p-3 bg-white focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-hidden bg-transparent placeholder:text-neutral-300 mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Box (Matching Image 2) */}
                <div className="border border-neutral-250 rounded-xl p-3.5 bg-white focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                      Delivery Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Al, Helal 36, Noyasark, Sylhet -3100 (House / Road / Area)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium text-neutral-900 focus:outline-hidden bg-transparent placeholder:text-neutral-300 mt-0.5 resize-none"
                    />
                  </div>
                </div>

                {/* Shipping Zone Selector Cards */}
                <div className="pt-1">
                  <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-2">
                    Shipping Region & Advance Delivery Charge *
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
                              ? 'border-2 border-neutral-900 bg-neutral-50/60 shadow-xs'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-900">{zone.name}</span>
                            <span className="font-sans font-bold text-neutral-950 tabular-nums">
                              ৳{zone.advanceFee}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-500 block mt-1">
                            {zone.estimatedDays} · Advance Deposit
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Payment Method (Matching Image 2) */}
            <div className="pt-2">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
                Payment Method
              </h2>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                Select the bank or gateway for payment of your order.
              </p>

              <div className="space-y-3">
                
                {/* 1. Cash on Delivery (Advance Paid) */}
                <div
                  onClick={() => setSelectedPaymentMethod('cod')}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-2 border-neutral-900 bg-neutral-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                        Cash on Delivery
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        Pay advance delivery fee (৳{advanceDeliveryFee}) now · Remaining ৳{remainingCodAmount.toLocaleString()} upon delivery
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'cod'
                        ? 'border-neutral-900 bg-neutral-900'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'cod' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* 2. Online Payment (Credit/Debit Card) */}
                <div
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPaymentMethod === 'card'
                      ? 'border-2 border-neutral-900 bg-neutral-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">
                      VISA
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                        Online Payment (Credit/Debit Card)
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        Visa, Mastercard, Amex via SSLCommerz Gateway
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'card'
                        ? 'border-neutral-900 bg-neutral-900'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'card' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* 3. bKash Payment */}
                <div
                  onClick={() => setSelectedPaymentMethod('bkash')}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPaymentMethod === 'bkash'
                      ? 'border-2 border-neutral-900 bg-neutral-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e2136e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      b
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                        Bkash Payment
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        bKash Merchant / Personal Instant Deposit
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'bkash'
                        ? 'border-neutral-900 bg-neutral-900'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'bkash' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* 4. Nagad Payment */}
                <div
                  onClick={() => setSelectedPaymentMethod('nagad')}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    selectedPaymentMethod === 'nagad'
                      ? 'border-2 border-neutral-900 bg-neutral-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f7941d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      N
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                        Nagad Payment
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        Nagad Merchant / Wallet Instant Transfer
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'nagad'
                        ? 'border-neutral-900 bg-neutral-900'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'nagad' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Inline Payment Details for bKash / Nagad / COD */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900">
                    <Sparkles className="w-4 h-4 text-[#800000]" />
                    <span>Advance Booking Deposit: ৳{advanceDeliveryFee}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyMerchantNumber('01700000000')}
                    className="text-[11px] text-[#800000] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedNumber ? 'Number Copied' : 'Copy 01700-000000'}</span>
                  </button>
                </div>

                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  Send advance delivery charge <strong>৳{advanceDeliveryFee}</strong> to our verified {selectedPaymentMethod.toUpperCase()} number, then enter the Transaction ID below (or verify upon clicking Pay).
                </p>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Transaction ID / TrxID (e.g. 9K2837L10) - Optional here"
                    value={inlineTrxId}
                    onChange={(e) => setInlineTrxId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono font-bold uppercase tracking-wider focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Current Order (Matching Image 2 exactly) */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="bg-[#F9FAFB] rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-2xs space-y-5">
              
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-neutral-950">
                  Current Order
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  The sum of all total payments for goods there
                </p>
              </div>

              {/* Items List (White rounded cards with + 1 - buttons matching Image 2) */}
              <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                {checkoutItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="bg-white rounded-2xl p-3.5 border border-neutral-200/70 shadow-2xs flex items-center gap-3.5"
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
                        <h4 className="font-semibold text-xs text-neutral-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="font-sans font-bold text-xs sm:text-sm text-neutral-900 tabular-nums shrink-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {item.size ? `Size: ${item.size}` : ''} {item.color ? `· ${item.color}` : ''}
                      </p>

                      {/* Quantity Controller (+ 1 - buttons matching Image 2) */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100/60">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Quantity : {item.quantity}
                        </span>

                        <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item, 1)}
                            className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-neutral-900 px-1 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item, -1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 rounded-md bg-white hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Big Row (Matching Image 2) */}
              <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-neutral-950">
                  Subtotal
                </span>
                <span className="font-sans text-base sm:text-lg font-extrabold text-neutral-950 tabular-nums">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              {/* Promo Code Row (Matching Image 2) */}
              <div className="pt-1">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedDiscount}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums">- ৳{discountAmount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-neutral-400 hover:text-red-600 cursor-pointer"
                        title="Remove promo"
                      >
                        <X className="w-3.5 h-3.5" />
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
                      className="flex-1 text-xs px-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Detailed Breakdown Lines (Matching Image 2) */}
              <div className="space-y-2 text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">{totalItemCount}x</span>
                </div>

                <div className="flex justify-between">
                  <span>Code Promo</span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">
                    {discountAmount > 0 ? `- ৳${discountAmount.toLocaleString()}` : '$0.00'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Service</span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">
                    ৳{advanceDeliveryFee}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Vat (0%)</span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">৳0</span>
                </div>

                {/* Important Advance vs Doorstep COD Split */}
                <div className="p-3 bg-white rounded-xl border border-neutral-200/80 space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs font-bold text-[#800000]">
                    <span>Advance Payable Now (Deposit)</span>
                    <span className="font-sans tabular-nums">৳{advanceDeliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-neutral-800">
                    <span>Payable on Doorstep Delivery</span>
                    <span className="font-sans tabular-nums">৳{remainingCodAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Button (Matching Image 2) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-neutral-950 hover:bg-[#800000] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>
                    Pay ৳{selectedPaymentMethod === 'cod' ? advanceDeliveryFee : totalAmount.toLocaleString()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Advance Delivery Payment Gateway Modal (If not paid inline) */}
      {pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingOrder(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#800000] uppercase block">
                  Step 2: Verified Advance Payment
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 mt-0.5">
                  Confirm ৳{pendingOrder.advanceDeliveryFee} Advance Payment
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs flex-1 touch-scroll">
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-700">Order Reference:</span>
                  <span className="font-mono font-bold text-neutral-900">{pendingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-700">Advance Delivery Fee:</span>
                  <span className="font-bold text-[#800000]">৳{pendingOrder.advanceDeliveryFee}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-700">Doorstep COD Balance:</span>
                  <span className="font-bold text-neutral-900">৳{pendingOrder.remainingCodAmount.toLocaleString()}</span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="space-y-3">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 uppercase">
                      {selectedPaymentMethod} Number
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyMerchantNumber('01700000000')}
                      className="text-[#800000] font-semibold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-sm font-bold text-neutral-900 tracking-wider">
                    01700-000000
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Send <strong>৳{pendingOrder.advanceDeliveryFee}</strong> and enter the Transaction ID below.
                  </p>
                </div>

                {/* TrxID Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-800">
                      Transaction ID (TrxID) *
                    </label>
                    <button
                      type="button"
                      onClick={handleSimulateSandboxSuccess}
                      className="text-[10px] text-[#800000] hover:underline font-semibold cursor-pointer"
                    >
                      + Autofill Test TrxID
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9K2837L10"
                    value={modalTrxId}
                    onChange={(e) => setModalTrxId(e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-xl font-mono text-sm font-bold uppercase tracking-wider focus:border-neutral-900 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleVerifyModalPayment}
                  disabled={isVerifyingPayment}
                  className="w-full bg-[#800000] hover:bg-[#600000] text-white py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-300"
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <span>Verify & Confirm Booking</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPendingOrder(null)}
                  className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-800 font-semibold cursor-pointer"
                >
                  Cancel / Edit Booking Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
