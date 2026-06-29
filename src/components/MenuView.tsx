import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Plus, Minus, ShoppingBag } from 'lucide-react';
import { FoodItem, CartItem } from '../types';

interface MenuViewProps {
  onAddToCart: (item: FoodItem) => void;
  onRemoveOneFromCart: (itemId: string) => void;
  cartItems: CartItem[];
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  toggleCart: () => void;
}

const CATEGORIES = ['All', 'Rice & Curry', 'Main Course', 'Grilled', 'Bangladeshi Specials', 'Drinks', 'Snacks'];

export default function MenuView({
  onAddToCart,
  onRemoveOneFromCart,
  cartItems,
  categoryFilter,
  setCategoryFilter,
  toggleCart
}: MenuViewProps) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch full menu from server
  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading menu:', err);
        setLoading(false);
      });
  }, []);

  // Filter items based on selected category and search input
  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCartQty = (itemId: string): number => {
    const found = cartItems.find((i) => i.id === itemId);
    return found ? found.qty : 0;
  };

  const totalCartItemsCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="space-y-8 pb-20">
      {/* 1. HEADER */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          The Pahari Kitchen Menu
        </h1>
        <p className="text-stone-500 text-sm">
          Fresh ingredients, authentic slow-cook techniques, and traditional tribal seasonings. Order for instant delivery to your home or office.
        </p>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Biryani, Bamboo, Paratha)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-800 text-sm font-sans placeholder-stone-400/90"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <span>Showing {filteredItems.length} delicacies</span>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-stone-100 pt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100/70 hover:text-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MENU ITEMS GRID */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800" />
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">Loading our specials...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <span className="text-4xl">🥘</span>
          <h3 className="font-bold text-stone-800 text-lg">No Dishes Found</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            We couldn't find any dishes matching "{searchQuery}" under "{categoryFilter}". Let's clear search query or select another category!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
            }}
            className="text-xs font-semibold text-emerald-800 underline hover:text-amber-500 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const qty = getCartQty(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-amber-500/45"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="h-44 overflow-hidden relative bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-stone-900/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {item.category}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-serif font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Pricing & Cart Action */}
                <div className="p-5 border-t border-stone-100 pt-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Price</span>
                      <span className="text-xl font-bold text-amber-500 font-mono">৳{item.price}</span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-3.5 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl text-emerald-950 font-bold font-mono">
                        <button
                          onClick={() => onRemoveOneFromCart(item.id)}
                          className="text-emerald-800 hover:text-red-600 transition-colors cursor-pointer"
                          title="Reduce quantity"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <span className="text-sm min-w-[12px] text-center">{qty}</span>
                        <button
                          onClick={() => onAddToCart(item)}
                          className="text-emerald-800 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Add more"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(item)}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-sans font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs hover:shadow-sm transition-all"
                      >
                        + Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. FLOATING CART SUMMARY */}
      {totalCartItemsCount > 0 && (
        <div className="fixed bottom-6 right-6 z-30 animate-bounce duration-1000">
          <button
            onClick={toggleCart}
            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 px-6 py-4 rounded-2xl shadow-xl hover:shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-3 border border-amber-400/30"
          >
            <div className="relative">
              <ShoppingBag className="w-5.5 h-5.5 text-stone-950" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-mono text-[10px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">
                {totalCartItemsCount}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-stone-900 uppercase font-mono tracking-wider">Ready Checkout</span>
              <span className="text-sm font-bold font-mono">৳{totalCartPrice}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
