import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, PhoneCall } from 'lucide-react';
import { FoodItem, CartItem, Profile } from './types';

// Import Views & Components
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import MenuView from './components/MenuView';
import CartView from './components/CartView';
import MyOrdersView from './components/MyOrdersView';
import ContactView from './components/ContactView';
import AuthView from './components/AuthView';
import AdminPortal from './components/AdminPortal';

const CART_STORAGE_KEY = 'pahari_cart_v1';
const USER_TOKEN_KEY = 'pahari_user_token_v1';
const ADMIN_TOKEN_KEY = 'pahari_admin_token_v1';

export default function App() {
  const [currentView, setView] = useState<string>('home');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Authenticated states
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Init - Restore sessions and cart from localStorage
  useEffect(() => {
    // Restore Cart
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart storage:', e);
      }
    }

    // Restore User Token
    const savedToken = localStorage.getItem(USER_TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      // Fetch user profile
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session invalid');
        })
        .then((data) => {
          if (data.profile) {
            setUser(data.profile);
          }
        })
        .catch(() => {
          // Clear invalid token
          localStorage.removeItem(USER_TOKEN_KEY);
          setToken(null);
        });
    }

    // Restore Admin Token
    const savedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedAdminToken) {
      setAdminToken(savedAdminToken);
      // Verify admin token
      fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${savedAdminToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setAdminLoggedIn(!!data.loggedIn);
          if (!data.loggedIn) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            setAdminToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken(null);
          setAdminLoggedIn(false);
        });
    }
  }, []);

  // Save Cart state to localStorage on modification
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  };

  // Cart operations
  const handleAddToCart = (item: FoodItem) => {
    const updated = [...cartItems];
    const found = updated.find((i) => i.id === item.id);
    if (found) {
      found.qty += 1;
    } else {
      updated.push({ ...item, qty: 1 });
    }
    saveCartToStorage(updated);
  };

  const handleRemoveOneFromCart = (itemId: string) => {
    let updated = [...cartItems];
    const found = updated.find((i) => i.id === itemId);
    if (found) {
      found.qty -= 1;
      if (found.qty <= 0) {
        updated = updated.filter((i) => i.id !== itemId);
      }
      saveCartToStorage(updated);
    }
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  // Auth operations
  const handleAuthSuccess = (newToken: string, profile: Profile) => {
    setToken(newToken);
    setUser(profile);
    localStorage.setItem(USER_TOKEN_KEY, newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(USER_TOKEN_KEY);
    setView('home');
  };

  // Admin operations
  const handleAdminLoginSuccess = (newAdminToken: string) => {
    setAdminToken(newAdminToken);
    setAdminLoggedIn(true);
    localStorage.setItem(ADMIN_TOKEN_KEY, newAdminToken);
    setView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    }
    setAdminToken(null);
    setAdminLoggedIn(false);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setView('home');
  };

  // Place order
  const handlePlaceOrder = async (
    address: string, 
    instructions: string, 
    paymentMethod?: 'bKash' | 'Cash on Delivery', 
    bkashNumber?: string, 
    transactionId?: string,
    appliedCoupon?: string,
    discountAmount?: number
  ) => {
    if (!token) return { success: false, error: 'User is not logged in.' };
    try {
      const itemsTotal = cartItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
      const deliveryFee = 20;
      const finalAmount = itemsTotal + deliveryFee - (discountAmount || 0);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          totalAmount: finalAmount >= 0 ? finalAmount : 0,
          deliveryAddress: address,
          specialInstructions: instructions,
          paymentMethod,
          bkashNumber,
          transactionId,
          appliedCoupon,
          discountAmount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, order: data.order };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'A network error occurred.' };
    }
  };

  const totalCartItemsCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-stone-50/40 text-stone-900 font-sans flex flex-col justify-between">
      
      {/* 1. STICKY TOP HEADER */}
      <Navbar
        currentView={currentView}
        setView={setView}
        cartCount={totalCartItemsCount}
        user={user}
        adminLoggedIn={adminLoggedIn}
        onLogout={handleLogout}
        onAdminLogout={handleAdminLogout}
        toggleCart={() => setCartOpen(!cartOpen)}
      />



      {/* 2. MAIN SCROLLABLE WRAPPER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {currentView === 'home' && (
              <HomeView
                setView={setView}
                setCategoryFilter={setCategoryFilter}
                onAddToCart={handleAddToCart}
              />
            )}

            {currentView === 'menu' && (
              <MenuView
                onAddToCart={handleAddToCart}
                onRemoveOneFromCart={handleRemoveOneFromCart}
                cartItems={cartItems}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                toggleCart={() => setCartOpen(true)}
              />
            )}

            {currentView === 'contact' && (
              <ContactView />
            )}

            {currentView === 'orders' && (
              <MyOrdersView
                setView={setView}
                token={token}
              />
            )}

            {currentView === 'login' && (
              <AuthView
                type="login"
                setView={setView}
                onAuthSuccess={handleAuthSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
              />
            )}

            {currentView === 'register' && (
              <AuthView
                type="register"
                setView={setView}
                onAuthSuccess={handleAuthSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
              />
            )}

            {currentView === 'admin-dashboard' && (
              <AdminPortal
                adminToken={adminToken}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onAdminLogout={handleAdminLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. SLIDING RIGHT SIDE CART SIDE-PANEL */}
      <CartView
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onAddToCart={handleAddToCart}
        onRemoveOneFromCart={handleRemoveOneFromCart}
        onClearCart={handleClearCart}
        user={user}
        token={token}
        setView={setView}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}
