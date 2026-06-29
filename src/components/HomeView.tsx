import { useState, useEffect } from 'react';
import { Clock, ArrowRight, Shield, Award, Heart, Sparkles, MessageSquare, Star, MapPin, Phone, MessageCircle } from 'lucide-react';
import { FoodItem } from '../types';
import PahariLogo from './PahariLogo';

interface HomeViewProps {
  setView: (view: string) => void;
  setCategoryFilter: (category: string) => void;
  onAddToCart: (item: FoodItem) => void;
}

export default function HomeView({ setView, setCategoryFilter, onAddToCart }: HomeViewProps) {
  const [popularItems, setPopularItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Determine restaurant open status
  useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
      const hour = now.getHours();
      const minute = now.getMinutes();
      const minutesTotal = hour * 60 + minute;

      const opens = 10 * 60;  // 10:00 AM
      const closes = 23 * 60; // 11:00 PM

      const daysOfWeek = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ];

      setCurrentDay(daysOfWeek[day]);
      
      const padZero = (n: number) => n.toString().padStart(2, '0');
      const hour12 = hour % 12 || 12;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      setCurrentTimeStr(`${padZero(hour12)}:${padZero(minute)} ${ampm}`);

      const isOpenDay = true; // Open 7 days a week
      const isOpenHour = minutesTotal >= opens && minutesTotal < closes;

      setIsOpen(isOpenDay && isOpenHour);
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch menu to show popular items
  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          // Show first 3-4 items as featured/popular
          setPopularItems(data.items.slice(0, 4));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching popular items:', err);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    setCategoryFilter(categoryName);
    setView('menu');
  };

  const categories = [
    { name: 'Rice & Curry', icon: '🍚', bg: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
    { name: 'Main Course', icon: '🍛', bg: 'bg-amber-50 text-amber-800 border-amber-100' },
    { name: 'Grilled', icon: '🍗', bg: 'bg-orange-50 text-orange-800 border-orange-100' },
    { name: 'Bangladeshi Specials', icon: '🇧🇩', bg: 'bg-red-50 text-red-800 border-red-100' },
    { name: 'Drinks', icon: '🥤', bg: 'bg-blue-50 text-blue-800 border-blue-100' },
    { name: 'Snacks', icon: '🥟', bg: 'bg-purple-50 text-purple-800 border-purple-100' }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative bg-stone-900 text-white overflow-hidden py-24 sm:py-32 rounded-b-[40px] shadow-lg">
        {/* Decorative background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200"
            alt="Pahari Restora Banner"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to Bangladesh's Authentic Hilltop Kitchen
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight leading-tight max-w-4xl mx-auto">
            Authentic Hill-Country Flavors, <br />
            <span className="text-amber-400 font-sans tracking-wide">Delivered Fresh & Hot</span>
          </h1>

          <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Natural taste-purity-cleanliness is our commitment. Order any of our food on our website to get home delivery from your home in Jhenaigati Upazila only.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setCategoryFilter('All');
                setView('menu');
              }}
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-sans font-semibold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              Order Food Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCategoryFilter('All');
                setView('menu');
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-sans font-semibold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-amber-600/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer border border-amber-500/20"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </section>

      {/* 2. OPENING STATUS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${isOpen ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold uppercase text-stone-500 tracking-wider">Restaurant Hours</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse' : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {isOpen ? '🟢 OPEN NOW' : '🔴 CLOSED NOW'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-800 mt-1">
                Open Every Day: <span className="text-emerald-800">10:00 AM – 11:00 PM</span>
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Current local time: <span className="font-semibold text-stone-700">{currentDay}, {currentTimeStr}</span> (Open 7 days a week)
              </p>
            </div>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-stone-100 w-full md:w-auto pt-4 md:pt-0 md:pl-8 flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest block">Instant Hotline</span>
              <a href="tel:+8801700000000" className="text-lg font-bold text-emerald-800 hover:text-amber-500 transition-colors flex items-center gap-1 justify-center md:justify-start mt-0.5">
                <Phone className="w-4.5 h-4.5" /> +880 1700-000000
              </a>
            </div>
          </div>
        </div>
      </section>



      {/* 4. POPULAR DISHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Most Loved Pahari Dishes</h2>
            <p className="text-stone-500 text-sm">Customer favorites prepared meticulously to perfection.</p>
          </div>
          <button
            onClick={() => {
              setCategoryFilter('All');
              setView('menu');
            }}
            className="text-emerald-800 hover:text-amber-600 font-semibold text-sm flex items-center gap-1 group cursor-pointer"
          >
            Full Menu Ordering
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-800" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group hover:border-amber-500/40"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.category}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-stone-400 font-mono">Price</span>
                      <span className="text-xl font-bold text-amber-500 font-mono">৳{item.price}</span>
                    </div>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-sans font-medium text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs hover:shadow-sm"
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="bg-stone-50 border-y border-stone-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">The Pahari Restora Standards</h2>
            <p className="text-stone-500 text-sm max-w-md mx-auto">We prioritize culinary heritage, dynamic hygiene, and delivery accuracy.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">100% Halal & Pure</h3>
              <p className="text-stone-500 text-xs leading-relaxed max-w-xs">
                All ingredients are locally sourced, strictly halal certified, and crafted without artificial coloring.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Hillside Tribal Spices</h3>
              <p className="text-stone-500 text-xs leading-relaxed max-w-xs">
                We bring real ginger, hot peppers, and local herbs direct from Chittagong Hill Tracts for an unmatchable zest.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-red-50 text-red-800 flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Super Hygiene Kitchen</h3>
              <p className="text-stone-500 text-xs leading-relaxed max-w-xs">
                Dynamic temperature logs, filtered fresh water washing, and professional masks/aprons worn at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-amber-600 font-mono tracking-wider">
            <MessageSquare className="w-4 h-4" /> Guest Feedback
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">What Our Guests Say</h2>
          <p className="text-stone-500 text-sm max-w-md mx-auto">Real responses from our lovely diners ordering online and eating in.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <p className="text-stone-600 text-xs italic leading-relaxed">
              "The Bamboo Chicken is an absolute masterpiece! Tastes exactly like the slow fire cooked delicacies we got in Bandarban. Very prompt delivery too."
            </p>
            <div className="flex items-center gap-3 pt-6 border-t border-stone-100 mt-6">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono text-xs">
                TK
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Tanvir Kazi</h4>
                <div className="flex items-center text-amber-400 mt-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <p className="text-stone-600 text-xs italic leading-relaxed">
              "Outstanding Chicken Kacchi Biryani! The meat literally drops off the bone and the potato is so creamy. Ordering from Pahari Restora is a weekly family ritual now."
            </p>
            <div className="flex items-center gap-3 pt-6 border-t border-stone-100 mt-6">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono text-xs">
                SR
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Sonia Rahman</h4>
                <div className="flex items-center text-amber-400 mt-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <p className="text-stone-600 text-xs italic leading-relaxed">
              "Their Beef Bhuna has the perfect spice density. Paired with butter parathas, it is heaven. Service is friendly and website works great."
            </p>
            <div className="flex items-center gap-3 pt-6 border-t border-stone-100 mt-6">
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold font-mono text-xs">
                AB
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Abrar Bhuiyan</h4>
                <div className="flex items-center text-amber-400 mt-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOCATION & MAPS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-8 items-stretch">
        <div className="md:col-span-5 bg-stone-900 text-white p-8 rounded-2xl flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
              Find Our Restaurant
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Come Visit Us or Order Direct</h2>
            <p className="text-stone-400 text-xs leading-relaxed">
              We are located in the heart of the community. Experience cozy traditional tribal seating, ambient hill country design, and dine with premium customer care.
            </p>
          </div>

          <div className="space-y-4.5">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Our Address</h4>
                <p className="text-sm font-medium mt-0.5 text-stone-200">
                  Pahari Restora, 2nd Floor, Aziz Super Market, Moshjid Road, Jhenaigati, Sherpur
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Hotline & Catering</h4>
                <p className="text-sm font-semibold mt-0.5 text-stone-200">
                  +880 1700-000000 / +880 1800-000000
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <MessageCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">Social Media</h4>
                <a 
                  href="https://web.facebook.com/Paharirestora/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-semibold mt-0.5 text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  facebook.com/Paharirestora
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={() => setView('contact')}
            className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white font-sans font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer text-center block w-full"
          >
            Send Us a Message
          </button>
        </div>

        {/* 100% Reliable Interactive Map Mock */}
        <div className="md:col-span-7 bg-emerald-50/50 rounded-2xl border border-stone-200 overflow-hidden relative min-h-[350px] flex flex-col">
          {/* Beautiful styled map render using HTML elements */}
          <div className="flex-1 relative bg-emerald-50 flex items-center justify-center p-8">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1a6b3c_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            
            {/* Styled roads & river representation */}
            <div className="absolute top-1/2 left-0 w-full h-8 bg-white border-y border-stone-200 -translate-y-1/2 rotate-6" />
            <div className="absolute top-0 left-1/3 w-8 h-full bg-white border-x border-stone-200 -translate-x-1/2 -rotate-12" />
            <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-emerald-800 tracking-wider">Jhenaigati Center</span>
            </div>

            {/* Restaurant PIN representation */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-800 border-2 border-white shadow-md flex items-center justify-center text-white text-lg animate-bounce duration-1000">
                🍛
              </div>
              <div className="bg-stone-900/95 text-white p-3 rounded-lg shadow-md border border-stone-700 text-center space-y-1 mt-2.5 max-w-[180px]">
                <h4 className="text-xs font-bold font-serif">Pahari Restora</h4>
                <p className="text-[9px] font-mono text-amber-400">Aziz Super Market, Jhenaigati</p>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[9px] text-blue-400 hover:underline font-semibold block pt-0.5"
                >
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. MINI FOOTER */}
      <footer className="border-t border-stone-200/60 pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <div className="flex items-center gap-2">
              <PahariLogo size={32} />
              <span className="font-sans font-bold text-emerald-800 text-lg">Pahari Restora</span>
            </div>
            <p className="text-stone-400 text-[11px] mt-1 font-sans">© 2026 Pahari Restora. Jhenaigati, Sherpur. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('home')} className="text-xs text-stone-500 hover:text-emerald-800 transition-colors font-medium">Home</button>
            <button onClick={() => { setCategoryFilter('All'); setView('menu'); }} className="text-xs text-stone-500 hover:text-emerald-800 transition-colors font-medium">Menu</button>
            <button onClick={() => setView('contact')} className="text-xs text-stone-500 hover:text-emerald-800 transition-colors font-medium">Contact Us</button>
            <button onClick={() => setView('admin-dashboard')} className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors">Staff Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
