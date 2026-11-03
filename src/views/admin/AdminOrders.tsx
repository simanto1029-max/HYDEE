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
} from 'lucide-react';
import { store } from '../../services/store';
import { Order, OrderStatus } from '../../types';

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

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(store.getOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    return matchesSearch && matchesStatus;
  });

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
          <option value="PENDING_ADVANCE">Pending Advance Payment</option>
          <option value="CONFIRMED">Confirmed (Advance Paid)</option>
          <option value="PROCESSING">Processing (Atelier Packing)</option>
          <option value="SHIPPED">Shipped via Courier</option>
          <option value="DELIVERED">Delivered & COD Collected</option>
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
                <th className="p-4">Advance Fee (Deposit)</th>
                <th className="p-4">Doorstep COD</th>
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
                        {order.paymentStatus === 'ADVANCE_VERIFIED' ? (
                          <div>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3 h-3" />
                              ৳{order.advanceDeliveryFee} Verified
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">
                              {order.advancePaymentMethod?.toUpperCase()} · {order.transactionId}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-sans tabular-nums block w-fit">
                              Pending ৳{order.advanceDeliveryFee}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsVerifyModalOpen(true);
                              }}
                              className="text-[10px] text-[#800000] font-semibold hover:underline mt-1 block"
                            >
                              + Manual Verify TrxID
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isDelivered ? (
                          <div>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold font-sans tabular-nums inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ৳{order.remainingCodAmount.toLocaleString()} Collected
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">Paid on Delivery</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-sans font-bold text-[#800000] tabular-nums block">
                              ৳{order.remainingCodAmount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">Pending Courier Handover</span>
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
                        {!isDelivered && (
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

              {/* Advance Payment Details */}
              <div className="p-4 border border-neutral-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Advance Payment Deposit</span>
                  {selectedOrder.paymentStatus === 'ADVANCE_VERIFIED' ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-bold text-[10px]">
                      VERIFIED
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="text-xs bg-[#800000] text-white px-3 py-1 rounded-lg font-semibold cursor-pointer"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
                {selectedOrder.paymentStatus === 'ADVANCE_VERIFIED' ? (
                  <div className="text-neutral-600 space-y-1 text-[11px]">
                    <p>Method: <strong className="uppercase">{selectedOrder.advancePaymentMethod}</strong></p>
                    <p>Transaction ID: <span className="font-mono font-bold text-neutral-900">{selectedOrder.transactionId}</span></p>
                    <p>Verified at: {new Date(selectedOrder.verifiedAt || '').toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-[11px]">
                    Customer has not yet provided verified TrxID for the ৳{selectedOrder.advanceDeliveryFee} advance payment.
                  </p>
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
