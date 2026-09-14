import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, FileText, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BookSlotView({ shooter, onNavigate, onConfirmSlot, selectedPackage }) {
  const { currentUser, userData } = useAuth();
  const isLoggedIn = Boolean(
    currentUser ||
    (userData && userData.email && !['guest@frambit.com', 'Not signed in'].includes(userData.email))
  );

  const [service, setService] = useState(selectedPackage?.title || 'Reel Shoot');
  const [date, setDate] = useState('20 Sep 2026');
  const [time, setTime] = useState('4:00 PM - 6:00 PM');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [requirements, setRequirements] = useState(
    selectedPackage
      ? `Booking shoot package: ${selectedPackage.title}\nReference style: modern & cinematic`
      : '3 Instagram reels (product + lifestyle)\nReference style: modern & cinematic'
  );

  React.useEffect(() => {
    if (selectedPackage && selectedPackage.title) {
      setService(selectedPackage.title);
      setRequirements(`Booking shoot package: ${selectedPackage.title}\nReference style: modern & cinematic`);
    }
  }, [selectedPackage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onNavigate('auth_login');
      return;
    }
    if (onConfirmSlot) {
      onConfirmSlot({
        service: selectedPackage ? selectedPackage.title : service,
        package: selectedPackage,
        amount: selectedPackage ? `₹${Number(selectedPackage.price).toLocaleString('en-IN')}` : null,
        date,
        time,
        location,
        requirements,
      });
    }
  };

  return (
    <div className="min-h-screen bg-frambit-light pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-md mx-auto sm:max-w-2xl px-4 py-4 space-y-4">
        
        {/* Top Header Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('shooter_profile')}
            className="p-2 text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black text-slate-900">
            {selectedPackage ? 'Book Shoot Package' : 'Request Booking'}
          </h1>
        </div>

        {/* Creator Summary Banner (Screen #5) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-frambit-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
              <img src={shooter?.avatar || shooter?.profile_image || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg'} alt={shooter?.display_name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-black text-slate-900">{shooter?.display_name || shooter?.name || 'Creator'}</h3>
                <CheckCircle className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-semibold">{shooter?.title || 'Reel Shooter & Videographer'}</p>
            </div>
          </div>
          <div className="text-right font-black text-xs text-slate-900">
            {selectedPackage ? (
              <div>
                <span className="text-indigo-600 text-sm font-black block">₹{Number(selectedPackage.price).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Fixed Package</span>
              </div>
            ) : (
              shooter?.price_display || `₹${shooter?.hourly_price || 799}/hr`
            )}
          </div>
        </div>

        {/* Selected Package Highlight Badge */}
        {selectedPackage && (
          <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider block">Package Selected</span>
              <h4 className="text-xs font-black text-slate-900">{selectedPackage.title}</h4>
            </div>
            <span className="text-xs font-black text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-100 shadow-2xs">
              ₹{Number(selectedPackage.price).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Request Form (Screen #5) */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-frambit-card space-y-4">

          {/* 1. Service Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Service</label>
            <div className="relative">
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="Reel Shoot">Reel Shoot</option>
                <option value="Event Coverage">Event Coverage</option>
                <option value="Product Photography">Product Photography</option>
                <option value="Video Editing">Video Editing</option>
              </select>
              <span className="absolute right-3.5 top-3.5 text-slate-400 text-xs pointer-events-none">▾</span>
            </div>
          </div>

          {/* 2. Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Date</label>
            <div className="relative">
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* 3. Time Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Time</label>
            <div className="relative">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* 4. Location Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Location</label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* 5. Requirements Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Requirements</label>
            <div className="relative">
              <textarea
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sign-in requirement banner if not logged in */}
          {!isLoggedIn && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold">Only logged-in users can book a shoot.</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('auth_login')}
                className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Sign in</span>
                <LogIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Submit Action Button (Screen #5) */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-md transition-all text-xs tracking-wide uppercase cursor-pointer ${
                isLoggedIn
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isLoggedIn ? 'Send Booking Request' : 'Sign in to Send Request'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

