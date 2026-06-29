import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldAlert, LayoutDashboard, ShoppingBag, Plus, Edit2, Trash2, 
  Users, LogOut, DollarSign, Clock, RefreshCw, Layers, Check, X, Lock,
  Mail, Send, Ticket
} from 'lucide-react';
import { FoodItem, Order, Profile, OrderStatus, Coupon } from '../types';

interface AdminPortalProps {
  adminToken: string | null;
  onAdminLoginSuccess: (token: string) => void;
  onAdminLogout: () => void;
}

export default function AdminPortal({
  adminToken,
  onAdminLoginSuccess,
  onAdminLogout
}: AdminPortalProps) {
  // Authentication fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'users' | 'smtp' | 'coupons'>('dashboard');

  // Coupon management states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponFormMsg, setCouponFormMsg] = useState({ type: '', text: '' });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'flat' as 'flat' | 'percentage',
    discountValue: '',
    expiryDate: '',
    minOrderAmount: '0',
    usageLimit: '0',
    isActive: true
  });

  // SMTP Configuration state
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: '587',
    user: '',
    pass: '',
    from: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [smtpStatusMsg, setSmtpStatusMsg] = useState({ type: '', text: '' });
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);

  // Stats & States
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    totalMenuItems: 0,
    totalEarnings: 0,
    recentOrders: []
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // CRUD Modals / Forms
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Rice & Curry',
    imageUrl: '',
    isAvailable: true
  });

  // Response inputs per order
  const [orderResponses, setOrderResponses] = useState<{ [orderId: string]: string }>({});

  const handleAdminAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please fill in both Email and Password.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAdminLoginSuccess(data.token);
      } else {
        setAuthError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setAuthError('Connection failure. Check backend server.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Load Dashboard Data
  const loadDashboardStats = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading admin stats:', err);
    }
  };

  // Load Orders Data
  const loadOrders = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        // Pre-populate response inputs
        const inputs: any = {};
        data.orders.forEach((o: Order) => {
          inputs[o.id] = o.adminResponse || '';
        });
        setOrderResponses(inputs);
      }
    } catch (err) {
      console.error('Error loading admin orders:', err);
    }
  };

  // Load Menu Data
  const loadMenu = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/menu', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.items) {
        setFoodItems(data.items);
      }
    } catch (err) {
      console.error('Error loading admin menu:', err);
    }
  };

  // Load Users Profiles
  const loadUsers = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error loading admin users:', err);
    }
  };

  // Load Coupons Data
  const loadCoupons = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCoupons(data);
      }
    } catch (err) {
      console.error('Error loading admin coupons:', err);
    }
  };

  const handleSaveCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setCouponFormMsg({ type: '', text: '' });

    if (!couponForm.code.trim() || !couponForm.discountValue || !couponForm.expiryDate) {
      setCouponFormMsg({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    const payload = {
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      expiryDate: couponForm.expiryDate,
      minOrderAmount: parseFloat(couponForm.minOrderAmount || '0'),
      usageLimit: parseInt(couponForm.usageLimit || '0', 10),
      isActive: couponForm.isActive
    };

    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}` 
        : '/api/admin/coupons';
      const method = editingCoupon ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setCouponModalOpen(false);
        loadCoupons();
        setEditingCoupon(null);
        setCouponForm({
          code: '',
          discountType: 'flat',
          discountValue: '',
          expiryDate: '',
          minOrderAmount: '0',
          usageLimit: '0',
          isActive: true
        });
      } else {
        setCouponFormMsg({ type: 'error', text: data.error || 'Failed to save coupon.' });
      }
    } catch (err) {
      setCouponFormMsg({ type: 'error', text: 'Connection failure.' });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!adminToken) return;
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        loadCoupons();
      } else {
        alert('Failed to delete coupon.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponFormMsg({ type: '', text: '' });
    setCouponForm({
      code: '',
      discountType: 'flat',
      discountValue: '',
      expiryDate: '',
      minOrderAmount: '0',
      usageLimit: '0',
      isActive: true
    });
    setCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponFormMsg({ type: '', text: '' });
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      expiryDate: coupon.expiryDate,
      minOrderAmount: String(coupon.minOrderAmount),
      usageLimit: String(coupon.usageLimit),
      isActive: coupon.isActive
    });
    setCouponModalOpen(true);
  };

  // Load SMTP config
  const loadSmtpConfig = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/smtp', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setSmtpForm({
          host: data.config.host || '',
          port: data.config.port || '587',
          user: data.config.user || '',
          pass: data.config.pass || '',
          from: data.config.from || ''
        });
      }
    } catch (err) {
      console.error('Error loading SMTP config:', err);
    }
  };

  // Save SMTP settings
  const handleSaveSmtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingSmtp(true);
    setSmtpStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(smtpForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpStatusMsg({ type: 'success', text: data.message || 'SMTP settings successfully saved!' });
      } else {
        setSmtpStatusMsg({ type: 'error', text: data.error || 'Failed to save SMTP settings.' });
      }
    } catch (err) {
      setSmtpStatusMsg({ type: 'error', text: 'Network connection failure while saving settings.' });
    } finally {
      setSavingSmtp(false);
    }
  };

  // Test SMTP connection and dispatch verification email
  const handleTestSmtp = async () => {
    if (!adminToken) return;
    setTestingSmtp(true);
    setSmtpStatusMsg({ type: 'info', text: 'Initiating SMTP connection test...' });
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...smtpForm,
          testEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpStatusMsg({ type: 'success', text: data.message || 'SMTP connection success! A test email has been delivered.' });
      } else {
        setSmtpStatusMsg({ type: 'error', text: data.error || 'SMTP Connection failed.' });
      }
    } catch (err) {
      setSmtpStatusMsg({ type: 'error', text: 'Network request timed out or server failed to connect.' });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Fetch whenever active tab changes
  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    
    const fetchPromises = [];
    if (activeTab === 'dashboard') fetchPromises.push(loadDashboardStats());
    if (activeTab === 'orders') fetchPromises.push(loadOrders());
    if (activeTab === 'menu') fetchPromises.push(loadMenu());
     if (activeTab === 'users') fetchPromises.push(loadUsers());
    if (activeTab === 'smtp') fetchPromises.push(loadSmtpConfig());
    if (activeTab === 'coupons') fetchPromises.push(loadCoupons());

    Promise.all(fetchPromises).finally(() => setLoading(false));
  }, [adminToken, activeTab]);

  // Handle Order Status / Response updates
  const handleUpdateOrder = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    const responseText = orderResponses[orderId] || '';
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status, adminResponse: responseText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reload locally
        loadOrders();
        // Custom short indicator
        alert(`Order #${orderId} successfully updated!`);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  // Toggle user ban
  const handleToggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isBanned: !currentBanStatus })
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to toggle ban:', err);
    }
  };

  // Delete User Profile
  const handleDeleteUserProfile = async (userId: string) => {
    if (!adminToken || !confirm('Are you absolutely sure you want to delete this user profile? This will log them out and remove their credentials.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Add / Edit Food item submits
  const handleMenuFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    const payload = {
      name: menuForm.name,
      description: menuForm.description,
      price: menuForm.price,
      category: menuForm.category,
      imageUrl: menuForm.imageUrl,
      isAvailable: menuForm.isAvailable
    };

    try {
      const url = editingItem ? `/api/admin/menu/${editingItem.id}` : '/api/admin/menu';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMenuModalOpen(false);
        setEditingItem(null);
        setMenuForm({ name: '', description: '', price: '', category: 'Rice & Curry', imageUrl: '', isAvailable: true });
        loadMenu();
      }
    } catch (err) {
      console.error('Failed to save menu item:', err);
    }
  };

  const handleEditClick = (item: FoodItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable
    });
    setMenuModalOpen(true);
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!adminToken || !confirm('Are you sure you want to delete this dish from the database?')) return;
    try {
      const res = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        loadMenu();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const openNewItemModal = () => {
    setEditingItem(null);
    setMenuForm({ name: '', description: '', price: '', category: 'Rice & Curry', imageUrl: '', isAvailable: true });
    setMenuModalOpen(true);
  };


  // --- 1. RENDER AUTHENTICATION VIEW IF NOT SIGNED IN ---
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl">🔑</span>
            <h1 className="text-xl font-serif font-bold tracking-tight">Admin Portal Gate</h1>
            <p className="text-stone-400 text-xs">
              Secure staff verification. Provide admin PIN & key to gain access.
            </p>
          </div>

          {authError && (
            <div className="bg-red-950/80 border border-red-900 text-red-200 p-3 rounded-xl text-xs font-semibold">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-stone-900">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" /> Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                🔑 Master Password
              </label>
              <input
                type="password"
                required
                placeholder="PahariRestora-xxxx"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 text-xs font-bold py-3.5 rounded-xl cursor-pointer shadow-md transition-all"
            >
              {loggingIn ? 'Verifying Admin Authority...' : 'Log In as Administrator'}
            </button>
          </form>

          {/* Quick Autofill Helper */}
          <div className="bg-amber-950/40 border border-amber-900/40 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              <span>Admin Credentials Guide</span>
              <span className="text-emerald-400">● Live Preview Helper</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              To login, use the secure credentials configured in the system:
            </p>
            <div className="bg-black/40 rounded-lg p-2 font-mono text-[10px] text-amber-200/90 space-y-1">
              <div><span className="text-stone-400">Email:</span> paharirestoraandfastfood@gmail.com</div>
              <div><span className="text-stone-400">Password:</span> PahariRestora-2120</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('paharirestoraandfastfood@gmail.com');
                setPassword('PahariRestora-2120');
              }}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg py-2 text-[11px] font-semibold transition-all cursor-pointer"
            >
              ⚡ Click to Autofill Admin Credentials
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-[10px] font-mono text-stone-500 leading-relaxed text-center">
            🔒 Protected Area | Port IP Logs Logged
          </div>
        </div>
      </div>
    );
  }

  // --- 2. RENDER MAIN ADMINISTRATOR PORTAL SYSTEM ---
  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-20 items-start">
      {/* Sidebar Navigation */}
      <aside className="lg:col-span-3 bg-white border border-stone-200/85 rounded-2xl p-4 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
          <ShieldAlert className="w-5.5 h-5.5 text-red-600 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-sm text-stone-800">Admin Control Room</span>
            <span className="text-[9px] font-mono font-semibold uppercase text-stone-400">Pahari Restora logs</span>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Admin Dashboard
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            Orders Management
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            Menu Items CRUD
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Users Management
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'smtp'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            SMTP Settings
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Ticket className="w-4 h-4 shrink-0" />
            Coupons System
          </button>


        </nav>

        <button
          onClick={onAdminLogout}
          className="w-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 font-sans font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Logout Admin Panel
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="lg:col-span-9 space-y-8 bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs min-h-[500px]">
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-800" />
            <span>Synchronizing administrative database...</span>
          </div>
        )}

        {/* --- VIEW 1: ADMIN DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-serif font-bold text-stone-900">Today's Restaurant Activity</h2>
              <p className="text-stone-500 text-xs mt-0.5">Summary of customer accounts and orders transactions.</p>
            </div>

            {/* Grid stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-stone-50 p-4 border border-stone-200/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Total Earnings</span>
                  <DollarSign className="w-4.5 h-4.5 text-emerald-800" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-stone-900">৳{stats.totalEarnings}</h3>
                <p className="text-[10px] text-stone-400">Excluding cancelled orders</p>
              </div>

              <div className="bg-stone-50 p-4 border border-stone-200/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Pending Orders</span>
                  <Clock className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-stone-900">{stats.pendingOrders}</h3>
                <p className="text-[10px] text-stone-400">Awaiting kitchen confirmation</p>
              </div>

              <div className="bg-stone-50 p-4 border border-stone-200/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Active Guests</span>
                  <Users className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-stone-900">{stats.totalUsers}</h3>
                <p className="text-[10px] text-stone-400">Registered profile accounts</p>
              </div>

              <div className="bg-stone-50 p-4 border border-stone-200/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Menu Dishes</span>
                  <Layers className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-stone-900">{stats.totalMenuItems}</h3>
                <p className="text-[10px] text-stone-400">Available food catalog sizes</p>
              </div>
            </div>

            {/* Recent Orders in Dashboard */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-stone-900 text-sm">Most Recent Orders</h3>
              <div className="border border-stone-200/70 rounded-xl overflow-hidden divide-y divide-stone-100">
                {stats.recentOrders && stats.recentOrders.length === 0 ? (
                  <p className="p-6 text-center text-xs text-stone-400 font-mono">No recent orders registered today.</p>
                ) : (
                  stats.recentOrders.map((o: Order) => (
                    <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-800">#{o.id}</span>
                          <span className="text-stone-400">|</span>
                          <span className="font-semibold text-stone-700">{o.userName}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono">Total paid: ৳{o.totalAmount} | Items count: {o.items.length}</p>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider bg-amber-50 border-amber-200 text-amber-800">
                        {o.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: ORDERS MANAGEMENT PANEL --- */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-serif font-bold text-stone-900">Orders Dispatch Board</h2>
              <p className="text-stone-500 text-xs mt-0.5">Track active transactions and communicate delivery status with customers.</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-stone-400 space-y-2">
                <span className="text-4xl">📦</span>
                <p className="text-xs font-mono">No customer food orders found in logs.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o.id} className="border border-stone-200 rounded-xl p-5 space-y-4 hover:border-emerald-800/30 transition-all">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-3">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800 font-mono text-sm">Order #{o.id}</span>
                          <span className="text-stone-300">|</span>
                          <span className="font-semibold text-stone-700">{o.userName} ({o.userMobile})</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono">Placed on: {new Date(o.createdAt).toLocaleString()}</p>
                      </div>

                      {/* Status select dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">Status:</span>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrder(o.id, e.target.value as OrderStatus)}
                          className="border border-stone-200 rounded-lg p-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-850 bg-stone-50 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="On the Way">On the Way</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Receipt breakdown */}
                    <div className="grid md:grid-cols-12 gap-5 text-xs">
                      {/* Items */}
                      <div className="md:col-span-6 space-y-2">
                        <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">Items Ordered</span>
                        <ul className="space-y-1">
                          {o.items.map((i: any) => (
                            <li key={i.id} className="flex justify-between font-mono bg-stone-50/50 px-2 py-1.5 rounded-lg text-[11px]">
                              <span>{i.name} (x{i.qty})</span>
                              <span className="font-bold">৳{i.price * i.qty}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between border-t border-stone-100 pt-2 font-bold font-mono">
                          <span>Grand Total:</span>
                          <span className="text-emerald-800 text-sm">৳{o.totalAmount}</span>
                        </div>

                        {/* Payment Method Display */}
                        <div className="pt-2 border-t border-stone-100 space-y-1.5">
                          <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">Payment Details</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              o.paymentMethod === 'bKash' 
                                ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {o.paymentMethod === 'bKash' ? '📱 bKash Wallet' : '💵 Cash on Delivery'}
                            </span>
                          </div>
                          {o.paymentMethod === 'bKash' && (
                            <div className="p-2.5 rounded-lg bg-pink-50 border border-pink-100/80 font-mono text-[10px] text-pink-900 space-y-0.5">
                              <p><strong>Sender No:</strong> {o.bkashNumber || 'N/A'}</p>
                              <p><strong>TrxID:</strong> {o.transactionId || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Detail */}
                      <div className="md:col-span-6 space-y-2 bg-stone-50 p-3 rounded-lg border border-stone-200/50">
                        <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">Delivery Address</span>
                        <p className="font-sans leading-relaxed text-stone-600">{o.deliveryAddress}</p>
                        
                        {/* Custom admin response box */}
                        <div className="space-y-1.5 pt-3 border-t border-stone-100">
                          <label className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">Admin Dispatch Note</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="E.g. Delivering in 10 mins..."
                              value={orderResponses[o.id] || ''}
                              onChange={(e) => setOrderResponses({ ...orderResponses, [o.id]: e.target.value })}
                              className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-800 bg-white"
                            />
                            <button
                              onClick={() => handleUpdateOrder(o.id, o.status)}
                              className="bg-emerald-800 hover:bg-emerald-950 text-white px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              title="Save note"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 3: MENU ITEMS CRUD MANAGER --- */}
        {activeTab === 'menu' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-xl font-serif font-bold text-stone-900">Food Catalog Management</h2>
                <p className="text-stone-500 text-xs">Create, edit, toggle availability, and remove catalog dishes.</p>
              </div>

              <button
                onClick={openNewItemModal}
                className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-sans font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add New Dish Item
              </button>
            </div>

            {/* Menu items table */}
            <div className="border border-stone-200/80 rounded-xl overflow-hidden shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-stone-200">
                <thead className="bg-stone-50 font-mono text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-5">Dish details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {foodItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-3.5 pl-5 flex items-center gap-3 min-w-[200px]">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover bg-stone-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-stone-400 truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-mono text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-amber-600 text-sm">৳{item.price}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold ${
                          item.isAvailable ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {item.isAvailable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer inline-flex"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL WINDOW FOR ADD/EDIT DISH */}
            {menuModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                <div onClick={() => setMenuModalOpen(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs" />
                
                <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 sm:p-8 max-w-lg w-full relative z-10 space-y-6">
                  <h3 className="text-lg font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
                    {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Gourmet Dish'}
                  </h3>

                  <form onSubmit={handleMenuFormSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Dish Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Spicy Grilled Chicken Platter"
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Category *</label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs bg-stone-50 focus:outline-none focus:border-emerald-850"
                      >
                        <option value="Rice & Curry">Rice & Curry</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Grilled">Grilled</option>
                        <option value="Bangladeshi Specials">Bangladeshi Specials</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Price in Taka (৳) *</label>
                      <input
                        type="number"
                        required
                        placeholder="E.g. 250"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Image URL</label>
                      <input
                        type="url"
                        placeholder="E.g. https://images.unsplash.com/photo-..."
                        value={menuForm.imageUrl}
                        onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Ingredients, spice level, serving suggestions..."
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    {/* Available toggle */}
                    <div className="flex items-center gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="isAvailableCheckbox"
                        checked={menuForm.isAvailable}
                        onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                        className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer h-4 w-4"
                      />
                      <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-stone-700 cursor-pointer">
                        Currently Available for Ordering
                      </label>
                    </div>

                    {/* Modal footer buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setMenuModalOpen(false)}
                        className="border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-xl cursor-pointer text-xs shadow-xs"
                      >
                        {editingItem ? 'Save Updates' : 'Add to Catalog'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 4: USERS PROFILES LIST MANAGER --- */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-serif font-bold text-stone-900">Registered Users Directory</h2>
              <p className="text-stone-500 text-xs mt-0.5">Audit profiles, issue suspension ban blocks, or remove user records.</p>
            </div>

            {users.length === 0 ? (
              <p className="text-center py-12 text-stone-400 text-xs font-mono">No active registered user accounts detected.</p>
            ) : (
              <div className="border border-stone-200/80 rounded-xl overflow-hidden shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-stone-200">
                  <thead className="bg-stone-50 font-mono text-stone-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Guest details</th>
                      <th className="p-3.5">Mobile</th>
                      <th className="p-3.5">Joined date</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((usr) => (
                      <tr key={usr.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-3.5 pl-5 min-w-[150px]">
                          <p className="font-bold text-stone-800">{usr.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{usr.email}</p>
                        </td>
                        <td className="p-3.5 font-mono text-stone-600">{usr.mobile}</td>
                        <td className="p-3.5 text-stone-500 font-mono text-[10px]">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold ${
                            usr.isBanned 
                              ? 'bg-red-50 text-red-800 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {usr.isBanned ? '🔴 Suspended' : '🟢 Active'}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right space-x-2 whitespace-nowrap">
                          {/* Ban Toggle Button */}
                          <button
                            onClick={() => handleToggleUserBan(usr.id, usr.isBanned)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              usr.isBanned
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {usr.isBanned ? 'Unban Block' : 'Issue Ban block'}
                          </button>

                          {/* Delete profile completely */}
                          <button
                            onClick={() => handleDeleteUserProfile(usr.id)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer inline-flex"
                            title="Delete User Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 5: SMTP SETTINGS & DIAGNOSTICS --- */}
        {activeTab === 'smtp' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-serif font-bold text-stone-900">SMTP Email Delivery Hub</h2>
              <p className="text-stone-500 text-xs mt-0.5">
                Verify and configure mail servers. Once dynamic credentials are saved, real registration verification codes will be delivered directly to customers' inboxes.
              </p>
            </div>

            {/* Status Feedback banner */}
            {smtpStatusMsg.text && (
              <div className={`p-4 rounded-xl text-xs border flex items-start gap-3 transition-all ${
                smtpStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : smtpStatusMsg.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-stone-50 border-stone-200 text-stone-700 animate-pulse'
              }`}>
                <span className="text-sm shrink-0">
                  {smtpStatusMsg.type === 'success' ? '🟢' : smtpStatusMsg.type === 'error' ? '❌' : '⚡'}
                </span>
                <div className="space-y-1">
                  <p className="font-semibold">{smtpStatusMsg.type === 'success' ? 'Success' : smtpStatusMsg.type === 'error' ? 'Configuration Alert' : 'System Diagnostic Status'}</p>
                  <p className="leading-relaxed font-mono text-[11px] whitespace-pre-wrap">{smtpStatusMsg.text}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-12 gap-8 items-start">
              {/* Left Side: Credentials input form */}
              <form onSubmit={handleSaveSmtp} className="md:col-span-7 space-y-5 text-stone-800">
                <div className="space-y-4 text-stone-950">
                  {/* Host */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">SMTP Server Hostname *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smtp.gmail.com"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-stone-50"
                    />
                  </div>

                  {/* Port & Secure protocol */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">SMTP Port *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 465 or 587"
                        value={smtpForm.port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value.replace(/\D/g, '') })}
                        className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-stone-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">Protocol Mode</label>
                      <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[10px] text-stone-500 font-mono flex items-center h-[42px]">
                        {smtpForm.port === '465' ? '🔒 SSL/TLS Secure' : '🔓 STARTTLS / Clear'}
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">SMTP Username / Account User *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. your-email@gmail.com"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-stone-50"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">SMTP Password / App Secret *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-stone-50"
                    />
                    <p className="text-[9px] text-stone-400 leading-normal font-sans">
                      💡 For Google Workspace / Gmail accounts, remember to use a 16-digit <strong>App Password</strong> instead of your normal account password.
                    </p>
                  </div>

                  {/* Sender From Header */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Sender "From" Name & Email Address</label>
                    <input
                      type="text"
                      placeholder='e.g. "Pahari Restora" <noreply@pahari-restora.com>'
                      value={smtpForm.from}
                      onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-stone-50"
                    />
                    <p className="text-[9px] text-stone-400">
                      Defaults to: <code>"Pahari Restora" &lt;noreply@pahari-restora.com&gt;</code> if left blank.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSmtp || testingSmtp}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {savingSmtp ? 'Saving Credentials...' : 'Save & Enable SMTP Settings'}
                  </button>
                </div>
              </form>

              {/* Right Side: Quick Diagnostic / Connection Test controller */}
              <div className="md:col-span-5 bg-stone-50 border border-stone-200/60 rounded-2xl p-5 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-stone-900 text-sm">System Mail Diagnostic Test</h3>
                  <p className="text-stone-500 text-[11px] leading-relaxed font-sans">
                    Test your server connection instantly. We will connect with the supplied inputs on the left, execute handshake validations, and dispatch a gorgeous visual test email to verify correct delivery.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block font-bold">Recipient Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. tester@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-white"
                    />
                    <p className="text-[9px] text-stone-400 leading-tight">
                      Defaults to your SMTP user account email address if left blank.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || savingSmtp || !smtpForm.host || !smtpForm.user || !smtpForm.pass}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-stone-950 font-sans font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 animate-pulse" />
                    {testingSmtp ? 'Testing Handshake...' : 'Trigger SMTP Diagnostic Run'}
                  </button>
                </div>

                <div className="border-t border-stone-200/80 pt-4 space-y-2 text-[10px] text-stone-500 leading-relaxed font-mono">
                  <p className="font-semibold text-stone-700">📜 Troubleshooting Steps:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[9px]">
                    <li><strong>Error 535 (Auth Failed):</strong> Verify your password. If utilizing Gmail/Yahoo, enable App Passwords.</li>
                    <li><strong>Error Connection Timed Out:</strong> Verify host and port match. Check that your hosting platform does not block outbound traffic on port 25 or 587. (Prefer SSL port 465).</li>
                    <li><strong>Port 465 SSL:</strong> Requires standard SSL handshake. Port 587 works best on STARTTLS connection upgrades.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 6: COUPON MANAGEMENT SYSTEM --- */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-fade-in text-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">Discount Coupons Management</h2>
                <p className="text-stone-500 text-xs mt-0.5">
                  Configure special marketing campaigns, seasonal coupon codes, active flat discounts, or percentage rate markdowns.
                </p>
              </div>
              <button
                onClick={handleOpenCreateCoupon}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Create New Coupon
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-stone-400 text-xs animate-pulse font-mono">
                Loading Coupons database records...
              </div>
            ) : coupons.length === 0 ? (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 py-16 text-center space-y-3">
                <Ticket className="w-12 h-12 text-stone-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-700">No active coupons found</p>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Get started by creating your first restaurant promotion coupon code to drive customer checkouts!
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateCoupon}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-sans font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create First Coupon
                </button>
              </div>
            ) : (
              <div className="bg-white border border-stone-100 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 font-mono text-[10px] uppercase font-bold">
                        <th className="p-4">Coupon Code</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Min. Order</th>
                        <th className="p-4">Usage (Limit)</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-stone-50/50">
                          <td className="p-4">
                            <span className="font-mono font-bold bg-stone-100 text-stone-800 px-2.5 py-1 rounded text-xs select-all uppercase">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="p-4 font-semibold">
                            {coupon.discountType === 'flat' ? `৳${coupon.discountValue} Off` : `${coupon.discountValue}% Off`}
                          </td>
                          <td className="p-4 text-stone-500 font-mono">
                            {coupon.expiryDate}
                          </td>
                          <td className="p-4 font-mono">
                            ৳{coupon.minOrderAmount}
                          </td>
                          <td className="p-4 font-mono font-semibold text-stone-600">
                            {coupon.usageCount} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                              coupon.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                : 'bg-red-50 text-red-700 border border-red-150'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${coupon.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                              {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCoupon(coupon)}
                                className="p-2 border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Edit Coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-2 border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- COUPON CREATE / EDIT MODAL --- */}
        {couponModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md border border-stone-150 shadow-xl overflow-hidden text-stone-950">
              <div className="bg-stone-50 border-b border-stone-150 p-4 flex justify-between items-center">
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  {editingCoupon ? '✏️ Edit Coupon Details' : '🎟️ Create New Coupon Promotion'}
                </h3>
                <button
                  onClick={() => setCouponModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="p-5 space-y-4">
                {couponFormMsg.text && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    couponFormMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {couponFormMsg.text}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    className="w-full border border-stone-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-800 uppercase"
                  />
                  <p className="text-[10px] text-stone-400 leading-tight">Alphanumeric character string. Visible to buyers at checkout.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Type *</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e: any) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-800 bg-white"
                    >
                      <option value="flat">Flat Amount (৳)</option>
                      <option value="percentage">Percentage Rate (%)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Value *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={couponForm.discountType === 'flat' ? '50' : '10'}
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-800 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Min Order (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minOrderAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl transition-all duration-200 hover:border-emerald-250 hover:bg-emerald-50/70 shadow-xs">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider block flex items-center gap-1">
                      <span>Usage Limit</span>
                      <span className="text-[10px] font-normal text-emerald-700/80 lowercase">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 0 (unlimited)"
                      value={couponForm.usageLimit}
                      onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                      className="w-full border border-emerald-200 bg-white rounded-xl p-2.5 text-xs font-mono font-medium focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
                    />
                    <p className="text-[9.5px] text-emerald-700/80 font-medium">0 indicates unlimited usage.</p>
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-center pl-2">
                    <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider block">Status Active</span>
                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                      <input 
                        type="checkbox" 
                        checked={couponForm.isActive}
                        onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800" />
                      <span className={`ml-2.5 text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
                        couponForm.isActive 
                          ? 'text-emerald-800 bg-emerald-100/70 border border-emerald-200' 
                          : 'text-stone-500 bg-stone-100 border border-stone-200'
                      }`}>
                        {couponForm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-stone-150 pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCouponModalOpen(false)}
                    className="border border-stone-200 text-stone-600 font-semibold px-4 py-2 text-xs rounded-xl hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-5 py-2 text-xs rounded-xl cursor-pointer"
                  >
                    {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}
