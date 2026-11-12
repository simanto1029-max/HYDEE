import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  ShieldCheck,
  Printer,
  Clock,
  X,
  Plus,
  Send,
  Check,
  Copy,
  DollarSign,
  Package,
  Trash2,
  AlertTriangle,
  Calendar,
  Banknote,
} from 'lucide-react';
import { store } from '../../services/store';
import { Order, OrderStatus, CheckoutLead } from '../../types';

export const formatOrderDateTime = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

type OrderTab = 'confirmed' | 'review' | 'leads' | 'abandoned' | 'all';

// Prepayment order where the customer typed a TrxID and the shop must check the bKash/Nagad app
const isPaymentReview = (o: Order) => o.status === 'PENDING_ADVANCE' && o.paymentStatus === 'MANUAL_REVIEW';

// Prepayment order where the customer left before paying (no TrxID): a sales lead, NOT a real order
const isIncompleteLead = (o: Order) =>
  o.status === 'PENDING_ADVANCE' &&
  o.paymentType === 'full_prepaid' &&
  o.paymentStatus !== 'MANUAL_REVIEW' &&
  o.paymentStatus !== 'FULLY_PAID' &&
  o.paymentStatus !== 'ADVANCE_VERIFIED';

const leadWhatsAppLink = (o: Order) => {
  const phone = (o.customerPhone || '').replace(/\D/g, '');
  const intl = phone.startsWith('880') ? phone : `88${phone.replace(/^0*/, '0')}`;
  const msg =
    `আসসালামু আলাইকুম ${o.customerName}, HYDEE থেকে বলছি। আপনার ৳${o.totalAmount.toLocaleString()} টাকার অর্ডারটি (${o.orderNumber}) চেকআউটে অসম্পূর্ণ অবস্থায় আছে। ` +
    `আপনি কি এটি ক্যাশ অন ডেলিভারিতে (ডেলিভারির সময় টাকা দিয়ে) নিতে চান?`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};

const timeAgo = (iso: string): string => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day ago`;
};

const abandonedWhatsAppLink = (l: CheckoutLead) => {
  const phone = l.phone.replace(/\D/g, '');
  const intl = phone.startsWith('880') ? phone : `88${phone}`;
  const what = l.items.map((i) => `${i.name} × ${i.quantity}`).join(', ');
  const msg =
    `আসসালামু আলাইকুম${l.name ? ' ' + l.name : ''}, HYDEE থেকে বলছি। আপনি আমাদের ওয়েবসাইটে ${what} অর্ডার করতে চেয়েছিলেন, কিন্তু অর্ডারটি সম্পূর্ণ হয়নি। ` +
    `কোনো সমস্যা হয়েছে কি? আমরা কি আপনাকে অর্ডার সম্পূর্ণ করতে সাহায্য করতে পারি?`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(store.getOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tab, setTab] = useState<OrderTab>('confirmed');
  const [leads, setLeads] = useState<CheckoutLead[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Manual verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'manual_deposit'>('bkash');
  const [verifyTrxId, setVerifyTrxId] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Dispatch courier modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchOrderTarget, setDispatchOrderTarget] = useState<Order | null>(null);
  const [dispatchCourier, setDispatchCourier] = useState<string>('Steadfast');
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  // Test order notification
  const [testSuccessNotice, setTestSuccessNotice] = useState<string | null>(null);

  const refreshOrders = () => {
    const updated = store.getOrders();
    setOrders(updated);
    if (selectedOrder) {
      setSelectedOrder(store.getOrderById(selectedOrder.id) || null);
    }
  };

  const handleUpdateStatus = (orderNumber: string, newStatus: OrderStatus) => {
    const target = orders.find((o) => o.orderNumber === orderNumber);
    if (!target) return;

    if (newStatus === 'SHIPPED') {
      // Open dispatch modal to set courier and consignment ID
      openDispatchModal(target);
      return;
    }

    if (newStatus === 'DELIVERED') {
      // Mark delivered and collect COD
      store.markOrderDelivered(orderNumber);
      refreshOrders();
      return;
    }

    store.updateOrderStatus(orderNumber, newStatus, `Staff updated order status to ${newStatus}`);
    refreshOrders();
  };

  const openDispatchModal = (order: Order) => {
    setDispatchOrderTarget(order);
    setDispatchCourier(order.courierName || 'Steadfast');
    setDispatchTrackingCode(order.courierTrackingCode || '');
    setDispatchNote('');
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderTarget) return;

    const code =
      dispatchTrackingCode.trim() ||
      `${dispatchCourier.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    store.dispatchOrder(
      dispatchOrderTarget.orderNumber,
      dispatchCourier,
      code,
      dispatchNote.trim() || undefined
    );

    setIsDispatchModalOpen(false);
    setDispatchTrackingCode('');
    setDispatchNote('');
    refreshOrders();
  };

  const handleQuickMarkDelivered = (orderNumber: string) => {
    store.markOrderDelivered(orderNumber);
    refreshOrders();
  };

  const handleManualVerifyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setVerifyError(null);

    const result = store.verifyAdvancePayment(
      selectedOrder.orderNumber,
      verifyMethod,
      verifyTrxId,
      'Admin Staff Manual Verification'
    );

    if (!result.success) {
      setVerifyError(result.error || 'Failed to verify payment.');
      return;
    }

    setIsVerifyModalOpen(false);
    setVerifyTrxId('');
    refreshOrders();
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    const result = await store.fetchCheckoutLeads();
    setLeads(result.leads);
    setLeadsError(result.error || null);
    setLeadsLoading(false);
  };

  useEffect(() => {
    loadLeads();
    const timer = setInterval(loadLeads, 60000);
    return () => clearInterval(timer);
  }, []);

  // Hide leads whose phone number has since placed a real order
  const realOrderTimeByPhone = new Map<string, number>();
  orders.forEach((o) => {
    if (o.isTestOrder || o.status === 'CANCELLED') return;
    if (o.status === 'PENDING_ADVANCE' && o.paymentStatus !== 'MANUAL_REVIEW') return;
    const phone = (o.customerPhone || '').replace(/\D/g, '').replace(/^880/, '0');
    realOrderTimeByPhone.set(phone, Math.max(realOrderTimeByPhone.get(phone) || 0, new Date(o.createdAt).getTime()));
  });
  const visibleLeads = leads.filter((l) => {
    const orderedAt = realOrderTimeByPhone.get(l.phone);
    return !(orderedAt && orderedAt >= new Date(l.createdAt).getTime());
  });

  const handleApprovePayment = (order: Order) => {
    const method = (order.advancePaymentMethod as any) || 'bkash';
    const ok = window.confirm(
      `bKash/Nagad অ্যাপ বা SMS-এ কি TrxID ${order.transactionId} দিয়ে ৳${order.totalAmount.toLocaleString()} টাকা এসেছে?\n\nনিশ্চিত হলে OK চাপুন। অর্ডার কনফার্ম হবে ও স্টক কমবে।`
    );
    if (!ok) return;
    const result = store.verifyAdvancePayment(order.orderNumber, method, order.transactionId || '', 'Admin verified payment in app');
    setActionNotice(
      result.success
        ? { type: 'ok', text: `Order ${order.orderNumber} confirmed.` }
        : { type: 'error', text: result.error || 'Could not confirm payment.' }
    );
    refreshOrders();
  };

  const handleRejectPayment = (order: Order) => {
    const ok = window.confirm(`TrxID ${order.transactionId} এর টাকা আসেনি বা ভুল? অর্ডারটি "অসম্পূর্ণ লিড" ট্যাবে চলে যাবে।`);
    if (!ok) return;
    const result = store.rejectSubmittedPayment(order.orderNumber);
    setActionNotice(
      result.success
        ? { type: 'ok', text: `Payment for ${order.orderNumber} rejected. It is now an incomplete lead.` }
        : { type: 'error', text: result.error || 'Could not reject payment.' }
    );
    refreshOrders();
  };

  const handleConvertLeadToCod = (order: Order) => {
    const ok = window.confirm(`${order.customerName} কি ক্যাশ অন ডেলিভারিতে নিতে রাজি? OK দিলে অর্ডার কনফার্ম হবে ও স্টক কমবে।`);
    if (!ok) return;
    const result = store.convertLeadToCod(order.orderNumber);
    setActionNotice(
      result.success
        ? { type: 'ok', text: `Order ${order.orderNumber} is now a confirmed Cash on Delivery order.` }
        : { type: 'error', text: result.error || 'Could not convert this lead.' }
    );
    refreshOrders();
  };

  const handleDeleteOrder = (order: Order) => {
    store.deleteOrder(order.id);
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder(null);
    }
    setOrderToDelete(null);
    refreshOrders();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (orderToDelete) {
          setOrderToDelete(null);
        } else if (isDispatchModalOpen) {
          setIsDispatchModalOpen(false);
        } else if (isVerifyModalOpen) {
          setIsVerifyModalOpen(false);
        } else if (selectedOrder) {
          setSelectedOrder(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orderToDelete, isDispatchModalOpen, isVerifyModalOpen, selectedOrder]);

  // Helper to place a rapid sandbox test order for QA
  const handlePlaceTestOrder = () => {
    const prods = store.getProducts().filter((p) => !p.isArchived);
    if (prods.length === 0) return;
    const testProd = prods[0];
    const testVariant = testProd.variants[0];

    const result = store.createOrder({
      customerName: 'Test Customer (QA)',
      customerPhone: '01711000000',
      customerEmail: 'test@hydee.com',
      deliveryAddress: 'House 14, Road 7, Banani',
      district: 'Dhaka',
      zoneId: 'zone-dhaka',
      items: [
        {
          productId: testProd.id,
          variantId: testVariant.id,
          name: testProd.name,
          slug: testProd.slug,
          imageUrl: testProd.images[0] || '',
          size: testVariant.size,
          color: testVariant.color,
          price: testVariant.price || testProd.price,
          quantity: 1,
          maxStock: testVariant.stock ?? 10,
        },
      ],
      isTestOrder: true,
      notes: 'Automated test sandbox order',
    });

    if (result.success && result.order) {
      setTestSuccessNotice(`Sandbox test order ${result.order.orderNumber} created!`);
      setTimeout(() => setTestSuccessNotice(null), 4000);
      refreshOrders();
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search) ||
      (order.courierTrackingCode && order.courierTrackingCode.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTab =
      tab === 'all' ||
      (tab === 'review' && isPaymentReview(order)) ||
      (tab === 'leads' && isIncompleteLead(order)) ||
      (tab === 'confirmed' && !isPaymentReview(order) && !isIncompleteLead(order));
    return matchesSearch && matchesStatus && matchesTab;
  });

  const reviewCount = orders.filter(isPaymentReview).length;
  const leadsCount = orders.filter(isIncompleteLead).length;
  const confirmedCount = orders.filter((o) => !isPaymentReview(o) && !isIncompleteLead(o)).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            ATELIER REGISTRY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
            Orders & Cash on Delivery (COD)
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlaceTestOrder}
            className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Create a sample test order to verify checkout flow"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Sandbox Test Order</span>
          </button>
        </div>
      </div>

      {testSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{testSuccessNotice}</span>
        </div>
      )}

      {actionNotice && (
        <div
          className={`p-3 border text-xs rounded-xl flex items-center justify-between gap-2 ${
            actionNotice.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Order tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          ['confirmed', `📦 Confirmed Orders (${confirmedCount})`],
          ['review', `🔎 Verify Payment (${reviewCount})`],
          ['leads', `⚡ Incomplete Leads (${leadsCount})`],
          ['abandoned', `🛒 Abandoned Checkouts (${visibleLeads.length})`],
          ['all', `📋 All Records (${orders.length})`],
        ] as [OrderTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-colors cursor-pointer ${
              tab === key
                ? 'bg-[#800000] text-white border-[#800000]'
                : key === 'review' && reviewCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'abandoned' ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
              এরা checkout পাতায় মোবাইল নম্বর লিখেছে কিন্তু অর্ডার সম্পূর্ণ করেনি। ফোন বা WhatsApp করে অর্ডার নিশ্চিত করতে পারেন। অর্ডার হয়ে গেলে নাম নিজে থেকে তালিকা থেকে চলে যাবে।
            </p>
            <button
              onClick={loadLeads}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
            >
              {leadsLoading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>

          {leadsError && (
            <div className="m-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl">
              তালিকা আনা যায়নি: {leadsError}. যদি এটা প্রথমবার হয়, Supabase SQL Editor-এ <strong>supabase/HYDEE_ADD_CHECKOUT_LEADS.sql</strong> একবার চালান।
            </div>
          )}

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Wanted to buy</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visibleLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      এখন কোনো অসম্পূর্ণ checkout নেই।
                    </td>
                  </tr>
                ) : (
                  visibleLeads.map((l) => (
                    <tr key={l.id} className="align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                        {timeAgo(l.updatedAt)}
                        {l.status === 'contacted' && (
                          <span className="block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 w-fit">
                            Contacted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-900">{l.name || '(name not typed)'}</div>
                        <div className="font-mono text-neutral-700">{l.phone}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] text-neutral-700">{l.address || '—'}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {l.items.map((i, idx) => (
                          <div key={idx}>
                            {i.name} × {i.quantity}
                            {i.size ? ` · ${i.size}` : ''}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">৳{l.total.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <a href={abandonedWhatsAppLink(l)} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">
                            💬 WhatsApp
                          </a>
                          <a href={`tel:${l.phone}`} className="text-[#800000] font-semibold hover:underline">
                            📞 Call
                          </a>
                          <button
                            onClick={async () => {
                              await store.setCheckoutLeadStatus(l.id, l.status === 'contacted' ? 'open' : 'contacted');
                              loadLeads();
                            }}
                            className="text-neutral-600 font-semibold hover:underline cursor-pointer"
                          >
                            {l.status === 'contacted' ? '↺ Mark not contacted' : '✓ Mark contacted'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('এই এন্ট্রি মুছে ফেলবেন?')) return;
                              await store.deleteCheckoutLead(l.id);
                              loadLeads();
                            }}
                            className="text-red-600 font-semibold hover:underline cursor-pointer"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order Ref (e.g. HYD-2026-9723), Customer Name, Phone, or Consignment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
        >
          <option value="all">All Statuses ({orders.length})</option>
          <option value="PENDING_ADVANCE">Pending Full Prepayment</option>
          <option value="CONFIRMED">Confirmed Order</option>
          <option value="PROCESSING">Processing (Atelier Packing)</option>
          <option value="SHIPPED">Shipped via Courier</option>
          <option value="DELIVERED">Delivered & Collected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Order Ref & Time</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Doorstep Collection</th>
                <th className="p-4">Order Status & Courier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isDelivered =
                    order.status === 'DELIVERED' || order.paymentStatus === 'COD_COLLECTED';
                  const isShipped = order.status === 'SHIPPED';

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-neutral-900 tracking-wider tabular-nums flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {order.isTestOrder && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm font-sans font-bold">
                              SANDBOX
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-sans mt-1 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#800000]" />
                          <span>{formatOrderDateTime(order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-neutral-900">{order.customerName}</p>
                        <p className="font-mono text-[11px] text-neutral-500 tabular-nums">
                          {order.customerPhone}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate max-w-xs">{order.district}</p>
                      </td>
                      <td className="p-4 font-sans font-bold text-neutral-900 tabular-nums">
                        ৳{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {order.paymentType === 'advance_cod' ? (
                          <div>
                            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans flex items-center gap-1 w-fit">
                              <Banknote className="w-3 h-3 text-blue-600" />
                              Cash On Delivery
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5">
                              0% Advance Required
                            </span>
                          </div>
                        ) : order.paymentStatus === 'ADVANCE_VERIFIED' || order.paymentStatus === 'FULLY_PAID' ? (
                          <div>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3 h-3" />
                              ৳{order.totalAmount.toLocaleString()} Pre-paid
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">
                              {order.advancePaymentMethod?.toUpperCase()} · {order.transactionId}
                            </span>
                          </div>
                        ) : isPaymentReview(order) ? (
                          <div>
                            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans block w-fit">
                              Awaiting your check
                            </span>
                            <span className="text-[10px] text-neutral-700 block mt-0.5 font-mono">
                              {order.advancePaymentMethod?.toUpperCase()} · {order.transactionId}
                            </span>
                            <div className="flex gap-3 mt-1">
                              <button
                                onClick={() => handleApprovePayment(order)}
                                className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                              >
                                ✓ Money received
                              </button>
                              <button
                                onClick={() => handleRejectPayment(order)}
                                className="text-[10px] text-red-700 font-bold hover:underline cursor-pointer"
                              >
                                ✗ Not received
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums block w-fit">
                              Incomplete · no payment yet
                            </span>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <a
                                href={leadWhatsAppLink(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-700 font-semibold hover:underline"
                              >
                                💬 WhatsApp follow-up
                              </a>
                              <button
                                onClick={() => handleConvertLeadToCod(order)}
                                className="text-[10px] text-[#800000] font-semibold hover:underline text-left cursor-pointer"
                              >
                                ⚡ Convert to COD
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsVerifyModalOpen(true);
                                }}
                                className="text-[10px] text-neutral-600 font-semibold hover:underline text-left cursor-pointer"
                              >
                                + Manual Verify TrxID
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {order.paymentType === 'full_prepaid' && (order.paymentStatus === 'FULLY_PAID' || order.paymentStatus === 'ADVANCE_VERIFIED') ? (
                          <div>
                            <span className="text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              ৳0 (100% Pre-paid)
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">No Doorstep Due</span>
                          </div>
                        ) : isDelivered ? (
                          <div>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold font-sans tabular-nums inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ৳{order.remainingCodAmount.toLocaleString()} Collected
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">Paid on Delivery</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-sans font-bold text-[#800000] tabular-nums block text-xs">
                              ৳{order.remainingCodAmount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-500 block">Due on Delivery</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.orderNumber, e.target.value as OrderStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden ${
                            order.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : order.status === 'PROCESSING'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : order.status === 'DELIVERED'
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="PENDING_ADVANCE">Pending Advance</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Atelier Packing</option>
                          <option value="SHIPPED">Shipped (Courier)</option>
                          <option value="DELIVERED">Delivered (COD Paid)</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Courier Details Line */}
                        <div className="mt-1 text-[10px]">
                          {order.courierTrackingCode ? (
                            <span className="text-neutral-700 font-medium flex items-center gap-1">
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>{order.courierName}: </span>
                              <span className="font-mono font-bold text-neutral-900">{order.courierTrackingCode}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">
                              {order.courierName} · Not Dispatched
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {/* Quick Action Button */}
                        {!isDelivered && order.status !== 'PENDING_ADVANCE' && order.status !== 'CANCELLED' && (
                          <>
                            {!isShipped ? (
                              <button
                                onClick={() => openDispatchModal(order)}
                                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Dispatch parcel via courier with consignment ID"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Dispatch</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickMarkDelivered(order.orderNumber)}
                                className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Mark order as delivered and COD collected"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Collect COD</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs text-[#800000] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          title="View order details and items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="text-xs text-neutral-400 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Delete Order Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

        </>
      )}

      {/* Order Details & Dispatch Modal */}
      {selectedOrder && !isVerifyModalOpen && !isDispatchModalOpen && !orderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#800000] tracking-widest uppercase block">
                  ORDER DETAILS & COD DISPATCH
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="font-mono text-xl font-bold text-neutral-950 tracking-wider tabular-nums">
                    {selectedOrder.orderNumber}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full font-sans font-medium">
                    <Clock className="w-3 h-3 text-[#800000]" />
                    <span>{formatOrderDateTime(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this order permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 text-xs flex-1 touch-scroll">
              {/* Customer & Address */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl">
                <div>
                  <span className="text-neutral-400 uppercase text-[10px] font-semibold block">Customer Details</span>
                  <p className="font-bold text-neutral-900 mt-1">{selectedOrder.customerName}</p>
                  <p className="font-mono text-neutral-600 tabular-nums">{selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail && <p className="text-neutral-500">{selectedOrder.customerEmail}</p>}
                </div>
                <div>
                  <span className="text-neutral-400 uppercase text-[10px] font-semibold block">Delivery Destination</span>
                  <p className="text-neutral-800 mt-1">{selectedOrder.deliveryAddress}</p>
                  <p className="text-neutral-600 font-semibold">{selectedOrder.district} ({selectedOrder.zoneName})</p>
                </div>
              </div>

              {/* Courier Dispatching Status Box */}
              <div className="p-4 border border-neutral-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#800000]" />
                    <span className="font-bold text-neutral-900">Courier Handover & Consignment</span>
                  </div>
                  <button
                    onClick={() => openDispatchModal(selectedOrder)}
                    className="text-xs bg-[#800000] hover:bg-[#600000] text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{selectedOrder.courierTrackingCode ? 'Update Consignment' : 'Dispatch via Courier'}</span>
                  </button>
                </div>

                {selectedOrder.courierTrackingCode ? (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] space-y-1">
                    <p className="font-semibold text-blue-900">
                      Dispatched via {selectedOrder.courierName}
                    </p>
                    <p className="text-neutral-700">
                      Official Consignment ID:{' '}
                      <span className="font-mono font-bold bg-white px-2 py-0.5 border border-blue-200 rounded text-neutral-950">
                        {selectedOrder.courierTrackingCode}
                      </span>
                    </p>
                    {selectedOrder.dispatchedAt && (
                      <p className="text-neutral-500 text-[10px]">
                        Handed over on: {new Date(selectedOrder.dispatchedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-[11px]">
                    Parcel is currently in Atelier Packaging. No consignment tracking code has been issued yet. Click &ldquo;Dispatch via Courier&rdquo; once handed to courier.
                  </p>
                )}
              </div>

              {/* Doorstep COD Settlement Box */}
              <div className="p-4 border border-neutral-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#800000]" />
                    <span className="font-bold text-neutral-900">Doorstep Cash on Delivery (COD)</span>
                  </div>
                  {selectedOrder.status !== 'DELIVERED' && selectedOrder.paymentStatus !== 'COD_COLLECTED' && (
                    <button
                      onClick={() => handleQuickMarkDelivered(selectedOrder.orderNumber)}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered & Collect COD</span>
                    </button>
                  )}
                </div>

                {selectedOrder.status === 'DELIVERED' || selectedOrder.paymentStatus === 'COD_COLLECTED' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-sans tabular-nums text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Cash on Delivery collected in full: ৳{selectedOrder.remainingCodAmount.toLocaleString()} Paid upon delivery.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                    <p className="font-semibold">
                      Pending Collection: <span className="font-sans font-bold tabular-nums">৳{selectedOrder.remainingCodAmount.toLocaleString()}</span>
                    </p>
                    <p className="text-neutral-600 text-[10px]">
                      This amount will be collected by courier rider upon doorstep delivery. Once the courier marks it delivered, click &ldquo;Mark Delivered & Collect COD&rdquo; above.
                    </p>
                  </div>
                )}
              </div>

              {/* Garments in Order */}
              <div>
                <span className="font-serif text-sm font-bold text-neutral-950 block mb-3">
                  Garments in Order ({selectedOrder.items.length})
                </span>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-14 object-cover rounded-md bg-neutral-100"
                        />
                        <div>
                          <p className="font-semibold text-neutral-900">{item.productName}</p>
                          <p className="text-neutral-500 font-sans tabular-nums">
                            {item.variantName} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-sans font-bold text-neutral-950 tabular-nums">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-neutral-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-sans font-bold tabular-nums">
                    ৳{selectedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#800000]">
                  <span>Advance Delivery Fee:</span>
                  <span className="font-sans font-bold tabular-nums">
                    ৳{selectedOrder.advanceDeliveryFee}
                  </span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({selectedOrder.discountCode}):</span>
                    <span className="font-sans font-bold tabular-nums">
                      -৳{selectedOrder.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold">
                  <span>Total Order Value:</span>
                  <span className="font-sans tabular-nums">৳{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#800000] pt-1">
                  <span>Doorstep COD Balance:</span>
                  <span className="font-sans tabular-nums">
                    ৳{selectedOrder.remainingCodAmount.toLocaleString()}{' '}
                    {selectedOrder.status === 'DELIVERED' ? '(Collected)' : '(Due)'}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 border border-neutral-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Payment & Settlement</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm font-bold text-[10px] border border-blue-200">
                    {selectedOrder.paymentType === 'advance_cod' ? 'CASH ON DELIVERY' : '100% PRE-PAID'}
                  </span>
                </div>
                {selectedOrder.paymentType === 'advance_cod' ? (
                  <div className="text-neutral-600 space-y-1 text-[11px]">
                    <p>Terms: <strong className="text-neutral-900">100% Cash On Delivery at Doorstep</strong></p>
                    <p>Advance Deposit: <span className="font-semibold text-emerald-700">৳0 (None required)</span></p>
                    <p>Doorstep Collection Amount: <span className="font-sans font-bold text-[#800000]">৳{selectedOrder.totalAmount.toLocaleString()}</span></p>
                  </div>
                ) : selectedOrder.paymentStatus === 'ADVANCE_VERIFIED' || selectedOrder.paymentStatus === 'FULLY_PAID' ? (
                  <div className="text-neutral-600 space-y-1 text-[11px]">
                    <p>Method: <strong className="uppercase">{selectedOrder.advancePaymentMethod}</strong></p>
                    <p>Transaction ID: <span className="font-mono font-bold text-neutral-900">{selectedOrder.transactionId}</span></p>
                    <p>Amount Verified: <span className="font-bold text-emerald-700">৳{selectedOrder.totalAmount.toLocaleString()} (100% Paid)</span></p>
                    <p>Verified at: {new Date(selectedOrder.verifiedAt || '').toLocaleString()}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-neutral-500 text-[11px] mb-2">
                      Customer selected Full Prepayment but has not yet submitted TrxID.
                    </p>
                    <button
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="text-xs bg-[#800000] text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                    >
                      Verify Payment Now
                    </button>
                  </div>
                )}
              </div>

              {/* Status Audit Log */}
              <div>
                <span className="font-serif text-sm font-bold text-neutral-950 block mb-2">Audit History</span>
                <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                  {selectedOrder.timeline.map((t, idx) => (
                    <div key={idx} className="p-2 bg-neutral-50 rounded-lg text-[11px]">
                      <span className="font-semibold text-neutral-800">{t.note}</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-sans tabular-nums">
                        {new Date(t.timestamp).toLocaleString()} · {t.actor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Courier Modal */}
      {isDispatchModalOpen && dispatchOrderTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDispatchModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#800000] tracking-widest uppercase block">
                  COURIER HANDOVER
                </span>
                <h3 className="font-mono text-lg font-bold text-neutral-950">
                  Dispatch: {dispatchOrderTarget.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <p className="text-neutral-600">
                Specify the genuine courier partner and consignment code. This will update the status to <strong>Shipped</strong> and appear on the customer&rsquo;s live tracking screen.
              </p>

              <div>
                <label className="block font-semibold mb-1 text-neutral-900">Courier Partner</label>
                <select
                  value={dispatchCourier}
                  onChange={(e) => setDispatchCourier(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl bg-white font-medium"
                >
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Express</option>
                  <option value="Paperfly">Paperfly</option>
                  <option value="RedX">RedX Logistics</option>
                  <option value="eCourier">eCourier</option>
                  <option value="Hand Delivery">Internal Atelier Concierge</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-900">Consignment ID / Tracking Number</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchTrackingCode(
                        `${dispatchCourier.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`
                      );
                    }}
                    className="text-[10px] text-[#800000] hover:underline font-semibold cursor-pointer"
                  >
                    + Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. STDF-849201 or 9283749"
                  value={dispatchTrackingCode}
                  onChange={(e) => setDispatchTrackingCode(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl uppercase font-mono tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-900">Dispatch Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Handed over to rider at Banani hub"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  className="w-full p-3 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Verify Modal */}
      {isVerifyModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVerifyModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                Verify Advance: {selectedOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 text-xs flex-1 touch-scroll">
              <p className="text-xs text-neutral-500">
                Verify customer deposit of ৳{selectedOrder.advanceDeliveryFee} to confirm booking and deduct inventory.
              </p>

              {verifyError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl">
                  {verifyError}
                </div>
              )}

              <form onSubmit={handleManualVerifyPayment} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1">Payment Method</label>
                  <select
                    value={verifyMethod}
                    onChange={(e) => setVerifyMethod(e.target.value as any)}
                    className="w-full p-3 border border-neutral-200 rounded-xl"
                  >
                    <option value="bkash">bKash Merchant / Personal</option>
                    <option value="nagad">Nagad Merchant</option>
                    <option value="rocket">Rocket</option>
                    <option value="manual_deposit">Manual Bank / Counter Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Transaction ID / Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9K2837L10"
                    value={verifyTrxId}
                    onChange={(e) => setVerifyTrxId(e.target.value)}
                    className="w-full p-3 border border-neutral-200 rounded-xl uppercase font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(false)}
                    className="px-4 py-2.5 border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#800000] text-white rounded-xl font-semibold uppercase"
                  >
                    Confirm & Deduct Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrderToDelete(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden relative p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Delete Order {orderToDelete.orderNumber}?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to permanently delete this order? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-neutral-100">
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-bold text-neutral-900">{orderToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone:</span>
                <span className="font-mono text-neutral-800">{orderToDelete.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Value:</span>
                <span className="font-bold text-neutral-900">৳{orderToDelete.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Placed At:</span>
                <span className="text-neutral-700">{formatOrderDateTime(orderToDelete.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-semibold text-neutral-800">{orderToDelete.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(orderToDelete)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
