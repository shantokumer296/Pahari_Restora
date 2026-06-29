import { useState, FormEvent } from 'react';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, Phone, User, Key, KeyRound } from 'lucide-react';
import { Profile } from '../types';
import PahariLogo from './PahariLogo';

interface AuthViewProps {
  type: 'login' | 'register';
  setView: (view: string) => void;
  onAuthSuccess: (token: string, profile: Profile) => void;
  onAdminLoginSuccess?: (token: string) => void;
}

export default function AuthView({ type, setView, onAuthSuccess, onAdminLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(type === 'login');
  const [step, setStep] = useState<'form' | 'verify'>('form'); // 'form' | 'verify'

  // Input Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');

  // Demo helper to display mock OTP
  const [demoOtp, setDemoOtp] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  // UI Utilities
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLogin) {
      // --- LOGIN FLOW ---
      if (!email || !password) {
        setErrorMsg('Email and password are required.');
        return;
      }

      setSubmitting(true);

      // Check if it's the admin credentials to sign in directly
      const isAdminEmail = email.trim().toLowerCase() === 'paharirestoraandfastfood@gmail.com';
      if (isAdminEmail) {
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (onAdminLoginSuccess) {
              onAdminLoginSuccess(data.token);
            } else {
              setErrorMsg('Admin portal not available. Please use staff portal.');
            }
            return;
          } else {
            setErrorMsg(data.error || 'Failed to sign in. Please check credentials.');
            return;
          }
        } catch (err) {
          setErrorMsg('Network error. Please try again.');
          return;
        } finally {
          setSubmitting(false);
        }
      }

      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          onAuthSuccess(data.token, data.profile);
          setView('home');
        } else {
          setErrorMsg(data.error || 'Failed to sign in. Please check credentials.');
        }
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // --- SIGN UP FLOW ---
      if (!name || !email || !mobile || !password) {
        setErrorMsg('All fields are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, mobile, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSmtpConfigured(!!data.smtpConfigured);
          if (data.otpCode) {
            setDemoOtp(data.otpCode);
          } else {
            setDemoOtp('');
          }
          setStep('verify');
        } else {
          setErrorMsg(data.error || 'Registration failed. Try again.');
        }
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCodeInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAuthSuccess(data.token, data.profile);
        setView('home');
      } else {
        setErrorMsg(data.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {step === 'form' ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-md space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <PahariLogo size={72} />
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {isLogin ? 'Sign In to Pahari' : 'Create an Account'}
            </h1>
            <p className="text-stone-500 text-xs">
              {isLogin 
                ? 'Access your saved address, order history, and active tracking.' 
                : 'Join us to get food delivered in 30 minutes with cash-on-delivery!'
              }
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form Input fields */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-stone-400" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Shantokumer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" /> Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="E.g. 017XXXXXXXX (Bangladesh format)"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" /> Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="E.g. shantokumer296@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-stone-400" /> Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl pl-3 pr-10 py-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only on signup) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-stone-400" /> Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold py-3.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              {submitting 
                ? (isLogin ? 'Authenticating...' : 'Sending OTP...') 
                : (isLogin ? 'Sign In Now' : 'Create Account & Verify')
              }
            </button>
          </form>

          {/* Toggle Block */}
          <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button 
                  onClick={() => { setIsLogin(false); setErrorMsg(''); }} 
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => { setIsLogin(true); setErrorMsg(''); }} 
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
          
          {/* Quick Info/Demo Login helper */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-[10px] text-stone-400 leading-relaxed font-mono">
            💡 **Developer Note:** If real SMTP is not configured in the environment settings, the system automatically falls back to simulation mode and displays the OTP directly on screen for testing!
          </div>

          {/* Admin access button */}
          <div className="pt-2 text-center border-t border-stone-100/60 flex justify-center">
            <button
              type="button"
              onClick={() => setView('admin-dashboard')}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/50"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Staff/Admin Entrance Portal
            </button>
          </div>
        </div>
      ) : (
        /* OTP VERIFICATION STEP */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl animate-bounce inline-block">📨</span>
            <h1 className="text-xl font-serif font-bold text-stone-900">Email OTP Verification</h1>
            <p className="text-stone-500 text-xs">
              {smtpConfigured ? (
                <>We have sent a real 6-digit OTP code to your inbox at <br /><span className="font-semibold text-stone-700">{email}</span>. Please check your inbox and spam folder.</>
              ) : (
                <>We've simulated sending a 6-digit OTP code to <br /><span className="font-semibold text-stone-700">{email}</span>.</>
              )}
            </p>
          </div>

          {/* Simulated Demo OTP code indicator banner */}
          {demoOtp && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-amber-700">
                <KeyRound className="w-4 h-4" /> [DEMO MODE CODE INJECTOR]
              </span>
              <p className="font-sans font-medium text-amber-800 mt-0.5">
                We've intercepted the server-side mail log for you. Your 6-digit code is:
              </p>
              <span className="block font-mono text-xl font-extrabold tracking-widest text-center py-1.5 text-stone-900 bg-white border border-amber-200/55 rounded-lg mt-1">
                {demoOtp}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Key className="w-4 h-4 text-stone-400" /> Enter 6-Digit Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="E.g. 123456"
                value={otpCodeInput}
                onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-lg font-mono font-bold tracking-widest border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-800 placeholder-stone-300"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold py-3.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Verifying OTP...' : 'Verify Email & Log In'}
            </button>
          </form>

          <button
            onClick={() => setStep('form')}
            className="w-full text-center text-xs font-semibold text-stone-400 hover:text-stone-700 py-1 cursor-pointer"
          >
            ← Back to Sign Up Details
          </button>
        </div>
      )}
    </div>
  );
}
