import React, { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, variantId: string, qty: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const estimatedAdvanceDeliveryFee = 80; // Standard Dhaka advance fee

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                Your Shopping Bag
              </span>
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-serif text-lg text-neutral-800">Your Bag Is Empty</p>
                <p className="text-xs text-neutral-500 mt-2">
                  Explore our bespoke collections and discover timeless craftsmanship.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 inline-block bg-[#800000] text-white text-xs font-semibold tracking-wider px-6 py-3 rounded-full cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex space-x-4 pb-6 border-b border-neutral-100 last:border-0"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-lg bg-neutral-100 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-neutral-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="text-sm font-bold text-neutral-950 mt-1">
                        ৳{item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-neutral-200 rounded-md">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-1 hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.productId, item.variantId)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Advance Payment Notice & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-100 bg-neutral-50/70 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-neutral-950">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    Advance Delivery Payment
                    <span className="text-[10px] text-neutral-400">(Dhaka Est.)</span>
                  </span>
                  <span className="font-semibold text-[#800000]">
                    ৳{estimatedAdvanceDeliveryFee}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Remaining Cash On Delivery</span>
                  <span className="font-semibold text-neutral-800">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Explanatory Policy Card */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#800000] shrink-0 mt-0.5" />
                <p className="leading-tight">
                  <strong className="font-semibold">Cash On Delivery With Advance Fee:</strong> Pay only the delivery charge now to confirm booking. Pay remaining ৳{subtotal.toLocaleString()} in cash after inspecting at your doorstep.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-[#800000] hover:bg-[#5c0000] active:scale-[0.99] text-white text-xs font-semibold tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Proceed To Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
