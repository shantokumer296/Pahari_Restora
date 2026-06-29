import { useState } from 'react';
import { Menu, X, ShoppingBag, User, LogOut, ShieldCheck, PhoneCall, HelpCircle } from 'lucide-react';
import { Profile } from '../types';
import PahariLogo from './PahariLogo';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  cartCount: number;
  user: Profile | null;
  adminLoggedIn: boolean;
  onLogout: () => void;
  onAdminLogout: () => void;
  toggleCart: () => void;
}

export default function Navbar({
  currentView,
  setView,
  cartCount,
  user,
  adminLoggedIn,
  onLogout,
  onAdminLogout,
  toggleCart
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <PahariLogo size={42} className="group-hover:scale-105 transition-transform duration-200" />
            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-emerald-800 group-hover:text-amber-500 transition-colors duration-200">
                Pahari Restora
              </span>
              <span className="text-[10px] font-mono text-amber-600 tracking-wider font-semibold uppercase">
                Taste of the Hills
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`font-sans text-sm font-medium transition-colors relative py-1.5 ${
                  currentView === item.id
                    ? 'text-emerald-800'
                    : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                {item.label}
                {currentView === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            ))}

            {user && (
              <button
                onClick={() => handleNavClick('orders')}
                className={`font-sans text-sm font-medium transition-colors relative py-1.5 ${
                  currentView === 'orders' ? 'text-emerald-800' : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                My Orders
              </button>
            )}
          </nav>

          {/* Controls & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2.5 rounded-full text-stone-700 hover:bg-stone-100/80 transition-colors cursor-pointer group"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5.5 h-5.5 text-stone-700 group-hover:text-emerald-800 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Badging */}
            {adminLoggedIn && (
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className="hidden lg:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Admin Panel
              </button>
            )}

            {/* User Login/Logout Info */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3 border-l border-stone-200 pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-mono text-stone-500">Welcome,</span>
                  <span className="text-sm font-medium text-stone-800 max-w-[120px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : adminLoggedIn ? (
              <div className="hidden sm:flex items-center gap-3 border-l border-stone-200 pl-4">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">ADMIN MODE</span>
                <button
                  onClick={onAdminLogout}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  title="Logout Admin"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 border-l border-stone-200 pl-4">
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-stone-700 hover:text-emerald-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium px-4 py-1.5 rounded-lg shadow-xs hover:shadow-md transition-all duration-200"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200/80 px-4 py-3 space-y-2 shadow-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-emerald-550/10 text-emerald-800 font-semibold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-emerald-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          {user && (
            <button
              onClick={() => handleNavClick('orders')}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'orders'
                  ? 'bg-emerald-555/10 text-emerald-800 font-semibold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-emerald-800'
              }`}
            >
              My Orders
            </button>
          )}

          {adminLoggedIn && (
            <button
              onClick={() => handleNavClick('admin-dashboard')}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors`}
            >
              🛡️ Admin Panel Dashboard
            </button>
          )}

          <div className="pt-3 border-t border-stone-200">
            {user ? (
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-stone-400">Signed in as</span>
                  <span className="text-sm font-medium text-stone-800">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : adminLoggedIn ? (
              <div className="flex items-center justify-between px-4 py-2 bg-amber-50 rounded-lg">
                <span className="text-xs font-bold text-amber-700">👑 Admin Active</span>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-red-600"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Admin Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 px-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-stone-700 hover:text-emerald-800 text-sm font-medium py-2 text-center rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="bg-emerald-800 text-white text-sm font-medium py-2 text-center rounded-lg hover:bg-emerald-900 transition-colors shadow-xs"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
