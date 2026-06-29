import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, Clock, MapPin, MessageSquareText, FileText } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface MyOrdersViewProps {
  setView: (view: string) => void;
  token: string | null;
}

export default function MyOrdersView({ setView, token }: MyOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyOrders = async (isPoll = false) => {
    if (!token) return;
    if (!isPoll) setRefreshing(true);
    try {
      const res = await fetch('/api/orders/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error loading my orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();

    // Auto-poll every 12 seconds to show order status updates in real time!
    const interval = setInterval(() => {
      fetchMyOrders(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [token]);

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'On the Way':
        return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            My Orders History
          </h1>
          <p className="text-stone-500 text-xs">
            Track active food preparation, delivery drivers, and view historic delicacies ordered.
          </p>
        </div>
        
        <button
          onClick={() => fetchMyOrders()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-800" />
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Fetching your receipts...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-16 text-center space-y-4 shadow-xs">
          <span className="text-5xl">🥡</span>
          <h3 className="font-bold text-stone-800 text-lg">No Orders Yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            You haven't ordered any delicious traditional food from Pahari Restora yet! Let's explore our exquisite menu.
          </p>
          <button
            onClick={() => setView('menu')}
            className="bg-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            Start Ordering Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-50/50 border border-amber-500/20 rounded-xl p-3 text-[11px] text-stone-600 font-medium">
            💡 **Tip:** Your order page polls our kitchen logs automatically every 12 seconds! Leave this page open to see live preparation and delivery status updates.
          </div>

          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-stone-300 transition-colors space-y-5"
              >
                {/* ID & Date & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-400">ORDER ID:</span>
                      <span className="text-sm font-bold font-mono text-emerald-800">#{order.id}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono">
                      Placed on: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border w-max text-center uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                    ● {order.status}
                  </span>
                </div>

                {/* Items & Amount */}
                <div className="grid md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7 space-y-3">
                    <h4 className="text-xs font-bold text-stone-500 uppercase font-mono tracking-widest flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Items Ordered
                    </h4>
                    <div className="space-y-2.5 divide-y divide-stone-100/50">
                      {order.items.map((item, idx) => (
                        <div key={item.id} className={`flex justify-between items-center text-xs pt-2.5 ${idx === 0 ? 'pt-0' : ''}`}>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-stone-900">{item.name}</span>
                            <p className="text-[10px] text-stone-400 font-mono">Qty: {item.qty} x ৳{item.price}</p>
                          </div>
                          <span className="font-bold font-mono text-stone-800">৳{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-stone-50 p-4 rounded-xl border border-stone-200/60 space-y-3.5">
                    <div className="space-y-1.5 text-xs text-stone-600">
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-mono">৳20</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-500 text-[11px]">Payment Mode:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider ${
                          order.paymentMethod === 'bKash' 
                            ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {order.paymentMethod === 'bKash' ? '📱 bKash' : '💵 COD'}
                        </span>
                      </div>
                      {order.paymentMethod === 'bKash' && (
                        <div className="bg-pink-50/50 border border-pink-100/80 p-2.5 rounded-lg space-y-1 text-[10px] font-mono text-pink-900">
                          <p><span className="text-pink-600 font-bold">bKash Mobile:</span> {order.bkashNumber}</p>
                          <p><span className="text-pink-600 font-bold">Transaction ID:</span> {order.transactionId}</p>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-stone-900 pt-1.5 border-t border-stone-200/50">
                        <span>Grand Total</span>
                        <span className="font-mono text-emerald-800 text-sm">৳{order.totalAmount}</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-200/50 pt-3 flex items-start gap-2.5 text-xs text-stone-500">
                      <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold font-mono text-stone-400 uppercase tracking-widest text-[10px] block">Address</span>
                        <p className="mt-0.5">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin response block */}
                {order.adminResponse && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                    <MessageSquareText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-amber-700 block uppercase tracking-wider text-[10px]">Response from kitchen:</span>
                      <p className="mt-1 font-medium">{order.adminResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
