import { useState, FormEvent } from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { CartItem, Profile, FoodItem } from '../types';

interface CartViewProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveOneFromCart: (itemId: string) => void;
  onClearCart: () => void;
  user: Profile | null;
  token: string | null;
  setView: (view: string) => void;
  onPlaceOrder: (
    address: string, 
    instructions: string, 
    paymentMethod: 'bKash' | 'Cash on Delivery', 
    bkashNumber?: string, 
    transactionId?: string,
    appliedCoupon?: string,
    discountAmount?: number
  ) => Promise<{ success: boolean; order?: any; error?: string }>;
}

export default function CartView({
  isOpen,
  onClose,
  cartItems,
  onAddToCart,
  onRemoveOneFromCart,
  onClearCart,
  user,
  token,
  setView,
  onPlaceOrder
}: CartViewProps) {
  const [checkoutStep, setCheckoutStep] = useState<any>('cart'); // 'cart' | 'checkout' | 'success'
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Cash on Delivery'>('Cash on Delivery');
  const [bkashNumber, setBkashNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null); // { couponCode, discountType, discountValue, discountAmount }
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = 20; // Flat delivery ৳20
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleCheckoutClick = () => {
    if (!user) {
      setErrorMsg('Please sign in to proceed to checkout.');
      setTimeout(() => {
        setView('login');
        onClose();
      }, 1500);
      return;
    }
    setCheckoutStep('checkout');
  };

  const handlePlaceOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMsg('Please provide a complete delivery address.');
      return;
    }

    if (paymentMethod === 'bKash') {
      if (!bkashNumber.trim()) {
        setErrorMsg('Please provide your bKash mobile number.');
        return;
      }
      if (!transactionId.trim()) {
        setErrorMsg('Please provide your bKash transaction ID.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await onPlaceOrder(
        address, 
        instructions, 
        paymentMethod, 
        bkashNumber, 
        transactionId,
        appliedCoupon?.couponCode,
        appliedCoupon?.discountAmount
      );
      if (res.success) {
        setPlacedOrder(res.order);
        setCheckoutStep('success');
        onClearCart();
        setAddress('');
        setInstructions('');
        setBkashNumber('');
        setTransactionId('');
        setPaymentMethod('Cash on Delivery');
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
      } else {
        setErrorMsg(res.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !token) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode, orderAmount: subtotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        setCouponError(data.error || 'Invalid coupon code.');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300" 
      />

      {/* Drawer content */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between h-full relative border-l border-stone-200">
          
          {/* Header */}
          <div className="px-5 py-5.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h2 className="text-lg font-bold text-stone-800">
                {checkoutStep === 'cart' && 'Your Gourmet Cart'}
                {checkoutStep === 'checkout' && 'Secure Checkout'}
                {checkoutStep === 'success' && 'Order Placed!'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-55/60 transition-colors cursor-pointer"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Display error banner if any */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed animate-pulse">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* STEP 1: CART LISTING */}
            {checkoutStep === 'cart' && (
              <>
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60%] text-center space-y-4">
                    <span className="text-5xl animate-bounce">🥘</span>
                    <h3 className="font-bold text-stone-700">Your cart is empty</h3>
                    <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                      Add delicious traditional Bangladeshi hill-dishes or lassis to your cart from our menu!
                    </p>
                    <button
                      onClick={() => {
                        setView('menu');
                        onClose();
                      }}
                      className="bg-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-stone-400">Items inside ({cartItems.length})</span>
                      <button 
                        onClick={onClearCart}
                        className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                      </button>
                    </div>

                    <div className="space-y-3.5 divide-y divide-stone-100">
                      {cartItems.map((item, idx) => (
                        <div key={item.id} className={`flex items-center gap-3.5 pt-3.5 ${idx === 0 ? 'pt-0' : ''}`}>
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-stone-900 truncate">{item.name}</h4>
                            <p className="text-xs text-stone-400 font-mono mt-0.5">৳{item.price} each</p>
                            
                            {/* Quantity Adjuster */}
                            <div className="flex items-center gap-2 mt-2 bg-stone-50 border border-stone-100 rounded-lg px-2 py-1 w-max">
                              <button 
                                onClick={() => onRemoveOneFromCart(item.id)}
                                className="text-stone-500 hover:text-red-600 p-0.5 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold font-mono text-stone-800 min-w-[12px] text-center">
                                {item.qty}
                              </span>
                              <button 
                                onClick={() => onAddToCart(item)}
                                className="text-stone-500 hover:text-emerald-800 p-0.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-mono text-stone-800">৳{item.price * item.qty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT DETAILS */}
            {checkoutStep === 'checkout' && user && (
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-6">
                
                {/* Pre-filled info card */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60 space-y-2.5 text-xs">
                  <h4 className="font-bold text-stone-700 uppercase tracking-wider font-mono">Recipient Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-stone-400">Name:</span> <p className="font-semibold text-stone-800 mt-0.5">{user.name}</p>
                    </div>
                    <div>
                      <span className="text-stone-400">Mobile:</span> <p className="font-semibold text-stone-800 mt-0.5">{user.mobile}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-800" /> Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="E.g. Aziz Road, Jhenaigati, Sherpur"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>

                {/* Cooking / Delivery Instructions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    📋 Special cooking or delivery instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g. Please make it very spicy, don't ring the doorbell, call before arriving..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>

                {/* Payment Method Option Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-700 block">
                    💳 Select Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Cash on Delivery');
                        setErrorMsg('');
                      }}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        paymentMethod === 'Cash on Delivery'
                          ? 'bg-emerald-50/85 border-emerald-800 text-emerald-900 shadow-xs ring-1 ring-emerald-800/10'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/2331/2331895.png" 
                          alt="Cash on Delivery" 
                          className="h-10 w-auto object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span>Cash on Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('bKash');
                        setErrorMsg('');
                      }}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        paymentMethod === 'bKash'
                          ? 'bg-pink-50/85 border-pink-600 text-pink-900 shadow-xs ring-1 ring-pink-600/10'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/e/e7/BKash_Logo_Icon.png" 
                          alt="bKash Logo" 
                          className="h-9 w-auto object-contain filter drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span>Pay with bKash</span>
                    </button>
                  </div>
                </div>

                {/* bKash Payment Details Block (Dynamic Input) */}
                {paymentMethod === 'bKash' && (
                  <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/50 space-y-3 animate-fade-in text-stone-800">
                    <div className="space-y-1 text-stone-900">
                      <p className="text-[11px] font-bold text-pink-950 flex items-center gap-1.5 font-mono">
                        🚩 bKash Personal Number: <span className="bg-pink-100 px-2 py-0.5 rounded text-xs text-pink-700 font-extrabold select-all">01876543210</span>
                      </p>
                      <p className="text-[10px] text-stone-500 leading-normal">
                        Please Send Money of <strong>৳{total}</strong> to the bKash personal number above, then enter the sender number & TrxID below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-950">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-pink-950 uppercase tracking-wider block">Your bKash Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 017XXXXXXXX"
                          value={bkashNumber}
                          onChange={(e) => setBkashNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full border border-pink-200 focus:border-pink-600 focus:ring-0 rounded-lg p-2 bg-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-pink-950 uppercase tracking-wider block">Transaction ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 9K28AL92OP"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                          className="w-full border border-pink-200 focus:border-pink-600 focus:ring-0 rounded-lg p-2 bg-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Coupon System */}
                <div className="border-t border-stone-100 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-stone-700">🎟️ Discount Coupon</h4>
                  
                  {appliedCoupon ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-800 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                          {appliedCoupon.couponCode}
                        </span>
                        <span className="text-emerald-900 font-medium">
                          Coupon Applied! (-৳{appliedCoupon.discountAmount})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-stone-400 hover:text-red-600 font-semibold cursor-pointer text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter Coupon (e.g. SAVE20)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-800 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="bg-stone-800 text-white font-bold text-xs px-4 rounded-xl cursor-pointer hover:bg-stone-900 disabled:opacity-40 transition-opacity"
                        >
                          {validatingCoupon ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-600 font-medium mt-1">⚠️ {couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Summary Breakdown inside Checkout step */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs font-mono text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>৳20</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-৳{appliedCoupon.discountAmount}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200/60 my-1" />
                  <div className="flex justify-between font-sans text-sm font-bold text-stone-900">
                    <span>Grand Total</span>
                    <span className="text-emerald-800">৳{total}</span>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono justify-center">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-800 shrink-0" />
                  <span>Secure Gateway | {paymentMethod === 'bKash' ? 'bKash Wallet Verification' : 'Cash on Delivery'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="border border-stone-200 text-stone-600 font-semibold py-3 rounded-xl hover:bg-stone-50 cursor-pointer text-xs"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-3 rounded-xl cursor-pointer text-xs shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: ORDER SUCCESS SUCCESS */}
            {checkoutStep === 'success' && placedOrder && (
              <div className="text-center py-8 space-y-6">
                <span className="text-6xl inline-block animate-bounce">🎉</span>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-stone-900 text-xl">Order Successfully Placed!</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                    We've received your order! Our kitchen is already prepping your delicious Pahari specials.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-left space-y-3 font-mono text-xs text-stone-800">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Order Receipt:</span>
                    <span>#{placedOrder.id}</span>
                  </div>
                  <div className="border-t border-emerald-200/50 my-2" />
                  <div className="space-y-1">
                    {placedOrder.items.map((i: any) => (
                      <div key={i.id} className="flex justify-between text-[11px]">
                        <span>{i.name} (x{i.qty})</span>
                        <span>৳{i.price * i.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-emerald-200/50 my-2" />
                  <div className="flex justify-between text-[11px]">
                    <span>Delivery Charge:</span>
                    <span>৳20</span>
                  </div>
                  {placedOrder.appliedCoupon && (
                    <div className="flex justify-between text-[11px] text-emerald-800 font-semibold">
                      <span>Discount ({placedOrder.appliedCoupon}):</span>
                      <span>-৳{placedOrder.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-emerald-900 text-sm">
                    <span>Grand Total:</span>
                    <span>৳{placedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="space-y-3.5 pt-4">
                  <button
                    onClick={() => {
                      setView('orders');
                      onClose();
                      setCheckoutStep('cart');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-semibold text-xs py-3 rounded-xl cursor-pointer w-full shadow-xs"
                  >
                    Track My Orders
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setCheckoutStep('cart');
                    }}
                    className="text-xs text-emerald-800 hover:underline font-semibold"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer - Only visible during Step 1 (Cart) and only if items exist */}
          {checkoutStep === 'cart' && cartItems.length > 0 && (
            <div className="border-t border-stone-100 p-5 bg-stone-50 space-y-4">
              <div className="space-y-2 text-xs font-mono text-stone-600">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span>৳{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flat Delivery Fee</span>
                  <span>৳20</span>
                </div>
                <div className="border-t border-stone-200/50 my-2" />
                <div className="flex justify-between font-sans text-base font-bold text-stone-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-800">৳{total}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-sans font-semibold text-xs py-3.5 rounded-xl cursor-pointer w-full shadow-xs flex items-center justify-center gap-2 group"
              >
                Proceed to Checkout
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
