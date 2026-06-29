import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle } from 'lucide-react';
import PahariLogo from './PahariLogo';

export default function ContactView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setErrorMsg('Please fill in name, email, and message fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, mobile, message })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setMobile('');
        setMessage('');
      } else {
        setErrorMsg(data.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          Get in Touch with Us
        </h1>
        <p className="text-stone-500 text-sm">
          Have queries about catering packages, custom recipes, bookings, or online delivery tracking? Message our team directly.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Contact info details */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-emerald-850 bg-emerald-800 text-white p-6 sm:p-8 rounded-2xl border border-emerald-900 shadow-md space-y-6">
            <div className="flex items-center gap-3">
              <PahariLogo size={48} className="bg-white rounded-full p-1 border border-emerald-700 shrink-0 shadow-sm" />
              <h2 className="text-xl font-serif font-bold">Pahari Restora Headquarters</h2>
            </div>
            <p className="text-emerald-100 text-xs leading-relaxed font-light">
              We look forward to hearing from you. Come dine with us to experience cozy, traditional settings right in Jhenaigati, Sherpur!
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-emerald-300 font-bold uppercase tracking-widest text-[9px] block">Address</span>
                  <p className="mt-0.5 text-stone-100 font-medium leading-relaxed">
                    Pahari Restora, 2nd Floor, Aziz Super Market, Moshjid Road, Jhenaigati, Sherpur
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-emerald-300 font-bold uppercase tracking-widest text-[9px] block">Hotlines</span>
                  <p className="mt-0.5 text-stone-100 font-semibold leading-relaxed">
                    +880 1700-000000 <br />
                    +880 1800-000000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-emerald-300 font-bold uppercase tracking-widest text-[9px] block">Email support</span>
                  <p className="mt-0.5 text-stone-100 font-medium break-all">
                    paharirestoraandfastfood@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-emerald-800" /> Frequently Asked Questions
            </h3>
            <div className="space-y-3.5 text-xs text-stone-600 divide-y divide-stone-100">
              <div className="pt-3.5 first:pt-0">
                <p className="font-bold text-stone-800">Do you offer catering?</p>
                <p className="mt-1 leading-relaxed">Yes! We provide tailored traditional catering for corporate dinners, birthdays, and weddings.</p>
              </div>
              <div className="pt-3.5">
                <p className="font-bold text-stone-800">What is your delivery radius?</p>
                <p className="mt-1 leading-relaxed">We deliver to your home in Jhenaigati Upazila only.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs">
          {success ? (
            <div className="text-center py-10 space-y-5">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-800">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-stone-900 text-xl">Thank You for Contacting Us!</h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  Your message has been received securely. Our guest support desk will review your message and reply via email or phone call shortly.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-bold text-emerald-800 underline hover:text-amber-500 cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <h2 className="text-lg font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
                Send a Quick Message
              </h2>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Shantokumer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="E.g. guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="E.g. +880 17XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Message / Inquiry *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you'd like to talk about..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-emerald-800"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-sans font-semibold text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
