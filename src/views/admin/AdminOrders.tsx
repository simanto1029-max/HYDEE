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
} from 'lucide-react';
import { store } from '../../services/store';
import { Order, OrderStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(store.getOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'manual_deposit'>('bkash');
  const [verifyTrxId, setVerifyTrxId] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Test order creation helper
  const [testSuccessNotice, setTestSuccessNotice] = useState<string | null>(null);

  const refreshOrders = () => {
    setOrders(store.getOrders());
    if (selectedOrder) {
      setSelectedOrder(store.getOrderById(selectedOrder.id) || null);
    }
  };

  const handleUpdateStatus = (orderNumber: string, newStatus: OrderStatus) => {
    store.updateOrderStatus(orderNumber, newStatus, `Staff updated order status to ${newStatus}`);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isVerifyModalOpen) {
          setIsVerifyModalOpen(false);
        } else if (selectedOrder) {
          setSelectedOrder(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerifyModalOpen, selectedOrder]);

  // Helper to place a rapid sandbox test order for QA
  const handleCreateTestOrder = () => {
    const products = store.getPublishedProducts();
    const testProd = products[0];
    const result = store.createOrder({
      customerName: 'Siam Chowdhury (Test Persona)',
      customerPhone: '01799887766',
      customerEmail: 'test@hydee.com',
      deliveryAddress: 'Banani Road 11, House 24',
      district: 'Dhaka',
      zoneId: 'zone-dhaka',
      notes: 'Test QA Order for advance fee and Meta Pixel audit',
      items: [
        {
          productId: testProd.id,
          variantId: testProd.variants[0].id,
          name: testProd.name,
          slug: testProd.slug,
          imageUrl: testProd.images[0],
          size: testProd.variants[0].size,
          color: testProd.variants[0].color,
          price: testProd.price,
          quantity: 1,
          maxStock: 20,
        },
      ],
      isTestOrder: true,
    });

    if (result.order) {
      setTestSuccessNotice(`Created sandbox test order #${result.order.orderNumber}`);
      setTimeout(() => setTestSuccessNotice(null), 4000);
      refreshOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    const query = search.toLowerCase();
    const matchSearch =
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerPhone.includes(query);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Test Order Generator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#800000] uppercase block">
            FULFILLMENT & PAYMENT AUDIT
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950 mt-0.5">
            Order Fulfillment Registry
          </h2>
        </div>

        <button
          onClick={handleCreateTestOrder}
          className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-3 rounded-xl uppercase tracking-wider inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Place Sandbox Test Order</span>
        </button>
      </div>

      {testSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{testSuccessNotice}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by order #, customer name, or phone (017...)"
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
          <option value="all">All Statuses</option>
          <option value="PENDING_ADVANCE">Pending Advance Payment</option>
          <option value="CONFIRMED">Confirmed (Advance Paid)</option>
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
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Advance Fee (Verification)</th>
                <th className="p-4">Doorstep COD</th>
                <th className="p-4">Courier & Status</th>
                <th className="p-4 text-right">Action</th>
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
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900">
                      {order.orderNumber}
                      {order.isTestOrder && (
                        <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm font-sans font-bold">
                          SANDBOX TEST
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-neutral-900">{order.customerName}</p>
                      <p className="text-[10px] text-neutral-500">{order.customerPhone}</p>
                      <p className="text-[10px] text-neutral-400 truncate max-w-xs">{order.district}</p>
                    </td>
                    <td className="p-4 font-bold text-neutral-900">
                      ৳{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {order.paymentStatus === 'ADVANCE_VERIFIED' ? (
                        <div>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            ৳{order.advanceDeliveryFee} Verified
                          </span>
                          <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">
                            {order.advancePaymentMethod?.toUpperCase()} · {order.transactionId}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold block w-fit">
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
                    <td className="p-4 font-bold text-[#800000]">
                      ৳{order.remainingCodAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.orderNumber, e.target.value as OrderStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-hidden ${
                          order.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
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
                        <option value="SHIPPED">Shipped (Courier)</option>
                        <option value="DELIVERED">Delivered (COD Paid)</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {order.courierName} ({order.courierTrackingCode || 'No Tracking'})
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-[#800000] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && !isVerifyModalOpen && (
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
                  ORDER DOSSIER
                </span>
                <h3 className="font-mono text-xl font-bold text-neutral-950">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 text-xs flex-1 touch-scroll">
              {/* Customer & Address */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl">
                <div>
                  <span className="text-neutral-400 uppercase text-[10px] font-semibold block">Customer Details</span>
                  <p className="font-bold text-neutral-900 mt-1">{selectedOrder.customerName}</p>
                  <p className="text-neutral-600">{selectedOrder.customerPhone}</p>
                  <p className="text-neutral-500">{selectedOrder.customerEmail || 'No email provided'}</p>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase text-[10px] font-semibold block">Delivery Address</span>
                  <p className="text-neutral-800 mt-1">{selectedOrder.deliveryAddress}</p>
                  <p className="text-neutral-600">{selectedOrder.district}, Bangladesh ({selectedOrder.zoneName})</p>
                  {selectedOrder.notes && <p className="text-neutral-400 italic mt-1">Note: {selectedOrder.notes}</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <span className="font-serif text-sm font-bold text-neutral-950 block mb-3">
                  Garments in Order
                </span>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center space-x-3">
                        <img src={item.imageUrl} alt={item.productName} className="w-12 h-14 object-cover rounded-md bg-neutral-100" />
                        <div>
                          <p className="font-semibold text-neutral-900">{item.productName}</p>
                          <p className="text-neutral-500">{item.variantName} × {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-neutral-950">
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
                  <span className="font-bold">৳{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#800000]">
                  <span>Advance Delivery Fee:</span>
                  <span className="font-bold">৳{selectedOrder.advanceDeliveryFee}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({selectedOrder.discountCode}):</span>
                    <span>-৳{selectedOrder.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold">
                  <span>Total Order Value:</span>
                  <span>৳{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#800000] pt-1">
                  <span>Remaining Cash on Delivery:</span>
                  <span>৳{selectedOrder.remainingCodAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Advance Payment Details */}
              <div className="p-4 border border-neutral-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Advance Payment Verification</span>
                  {selectedOrder.paymentStatus === 'ADVANCE_VERIFIED' ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-bold text-[10px]">
                      VERIFIED
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="text-xs bg-[#800000] text-white px-3 py-1 rounded-lg font-semibold"
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
                      <p className="text-[10px] text-neutral-400 mt-0.5">
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
  </div>
);
};
