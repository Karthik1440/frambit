import React, { useState } from 'react';
import { 
  Home, Calendar, User, DollarSign, MessageSquare, Settings, Bell, ChevronDown, 
  TrendingUp, ArrowRight, Eye, Star, CheckCircle, MapPin, Camera, Video, Edit3, 
  Share2, Sparkles, Clock, Check, X, LogOut, ChevronRight, Package, Trash2, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_VIDEOGRAPHER_PACKAGES, matchesBookingId } from '../api';

export default function ShooterDashboardView({ shooter, onNavigate, onUpdatePackages, onUpdatePortfolio, bookings = [], onUpdateStatus, onDeleteBooking, onClearBookings, unreadChatCount = 0 }) {
  const { currentUser, userData, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('home');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 22) return 'Good Evening,';
    return 'Welcome,';
  };

  const [dashboardBookings, setDashboardBookings] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    if (Array.isArray(bookings) && bookings.length > 0) return bookings;
    return [];
  });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDashboardBookings(parsed);
          return;
        }
      }
    } catch (e) {}
    if (Array.isArray(bookings) && bookings.length > 0) {
      setDashboardBookings(bookings);
    }
  }, [bookings]);

  const handleBookingAccept = (id) => {
    setDashboardBookings((prev) =>
      prev.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Confirmed' } : b))
    );
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Confirmed' } : b));
          localStorage.setItem('frambit_bookings', JSON.stringify(updated));
        }
      }
    } catch (err) {}
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Confirmed');
    }
  };

  const handleBookingReject = (id) => {
    setDashboardBookings((prev) =>
      prev.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Declined' } : b))
    );
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Declined' } : b));
          localStorage.setItem('frambit_bookings', JSON.stringify(updated));
        }
      }
    } catch (err) {}
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Declined');
    }
  };

  const handleBookingComplete = (id, e) => {
    if (e) e.stopPropagation();
    setDashboardBookings((prev) =>
      prev.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Completed' } : b))
    );
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Completed' } : b));
          localStorage.setItem('frambit_bookings', JSON.stringify(updated));
        }
      }
    } catch (err) {}
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Completed');
    }
  };

  const handleBookingDelete = (id, e) => {
    if (e) e.stopPropagation();
    setDashboardBookings((prev) => prev.filter((b) => !matchesBookingId(b, id)));
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((b) => !matchesBookingId(b, id));
          localStorage.setItem('frambit_bookings', JSON.stringify(filtered));
        }
      }
    } catch (err) {}
    if (onDeleteBooking) {
      onDeleteBooking(id);
    }
  };

  const handleClearAllBookings = (e) => {
    if (e) e.stopPropagation();
    setDashboardBookings([]);
    try {
      localStorage.setItem('frambit_bookings', JSON.stringify([]));
    } catch (err) {}
    if (onClearBookings) {
      onClearBookings();
    }
  };

  const [dismissedActivityIds, setDismissedActivityIds] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_dismissed_activities');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const handleClearRecentActivity = (e) => {
    if (e) e.stopPropagation();
    const allIds = dashboardBookings.map((b) => b.id);
    const updated = Array.from(new Set([...dismissedActivityIds, ...allIds]));
    setDismissedActivityIds(updated);
    try {
      localStorage.setItem('frambit_dismissed_activities', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleDismissActivity = (id, e) => {
    if (e) e.stopPropagation();
    const updated = Array.from(new Set([...dismissedActivityIds, id]));
    setDismissedActivityIds(updated);
    try {
      localStorage.setItem('frambit_dismissed_activities', JSON.stringify(updated));
    } catch (err) {}
  };

  const recentActivities = dashboardBookings.filter(
    (b) => !dismissedActivityIds.some((dismissedId) => matchesBookingId(b, dismissedId))
  );

  const name = userData?.display_name || userData?.name || shooter?.display_name || shooter?.name || currentUser?.displayName || 'Karthik';
  const roleTitle = 'Videographer';
  const avatar = userData?.avatar || shooter?.avatar || currentUser?.photoURL || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg';

  const handleLogout = async () => {
    await logout();
    onNavigate('auth_login');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 animate-fade-in font-sans pb-24 lg:pb-8">
      
      {/* Main Page Layout Container (Sidebar + Center Content + Right Panel) */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ========================================================================= */}
          {/* LEFT SIDEBAR NAVIGATION (Desktop: 2 cols, Mobile: Hidden - Uses BottomNav) */}
          {/* ========================================================================= */}
          <aside className="hidden lg:block lg:col-span-2 space-y-6 lg:sticky lg:top-6">
            <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-2xs space-y-1">
              
              {/* Frambit Creator Brand Header */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 pb-3 mb-1 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <img
                  src="/logo.png"
                  alt="Frambit"
                  className="w-9 h-9 object-contain rounded-xl shrink-0 drop-shadow-xs"
                />
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight font-sans">Frambit</span>
                  <span className="text-[10px] font-extrabold text-indigo-600 tracking-wide block">Creator Studio</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => { setActiveNav('home'); onNavigate('dashboard'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeNav === 'home'
                    ? 'bg-indigo-50 text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4.5 h-4.5" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('packages'); onNavigate('services_pricing'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === 'packages'
                    ? 'bg-indigo-50 text-indigo-600 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4.5 h-4.5" />
                <span>Packages</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('profile_edit'); onNavigate('profile_edit'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === 'profile_edit' || activeNav === 'profile'
                    ? 'bg-indigo-50 text-indigo-600 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <User className="w-4.5 h-4.5" />
                <span>Profile & Image</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('preview'); onNavigate('shooter_profile'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === 'preview'
                    ? 'bg-indigo-50 text-indigo-600 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
                title="See how clients view your creator profile"
              >
                <Eye className="w-4.5 h-4.5 text-indigo-600" />
                <span>View as Client</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('messages'); onNavigate('chat_list'); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === 'messages'
                    ? 'bg-indigo-50 text-indigo-600 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>Messages</span>
                </div>
                {unreadChatCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold text-rose-600 hover:bg-rose-100/70 bg-rose-50/50 border border-rose-100 transition-all cursor-pointer mt-2"
                title="Logout of Creator Studio"
              >
                <LogOut className="w-4.5 h-4.5 text-rose-600" />
                <span>Logout</span>
              </button>

            </div>

            {/* Bottom Promo Card: Grow Your Audience */}
            <div className="bg-indigo-50/80 rounded-3xl p-5 border border-indigo-100 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 font-sans">Grow Your Audience</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Complete your profile and get more bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('profile_edit')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Complete Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* CENTER MAIN CONTENT (Desktop: 7 cols) */}
          {/* ========================================================================= */}
          <main className="lg:col-span-7 space-y-6">
            
            {/* 1. Welcome Banner Card with Vector Photographer Illustration */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 z-10 max-w-sm">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{getGreeting()}</span>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                  {name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold pt-0.5 pb-1">
                  Create. Collaborate. Get Paid.
                </p>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onNavigate('shooter_profile')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-indigo-600/25 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
                    title="See how clients view your public profile"
                  >
                    <Eye className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>Preview Profile as Client</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold rounded-2xl border border-rose-200/80 shadow-2xs transition-all hover:scale-102 active:scale-95 cursor-pointer group"
                    title="Logout of Creator Studio"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* Vector Photographer Illustration Backdrop */}
              <div className="shrink-0 z-10 relative">
                <div className="w-40 h-28 sm:w-48 sm:h-32 bg-indigo-100/70 rounded-full flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full bg-indigo-200/60 absolute -top-2 -right-2" />
                  <img
                    src="https://ik.imagekit.io/demo/tr:w-400,h-400,fo-face/default-image.jpg"
                    alt="Photographer Vector Illustration"
                    className="w-28 h-28 object-cover rounded-2xl shadow-md border-2 border-white transform -rotate-3"
                  />
                </div>
              </div>
            </div>



            {/* 3. Shoot Requests & Upcoming Shoots Section */}
            {(() => {
              const pendingRequests = dashboardBookings.filter((b) => (b.status || 'pending').toLowerCase() === 'pending');
              const confirmedShoots = dashboardBookings.filter((b) => {
                const s = (b.status || '').toLowerCase();
                return s === 'confirmed' || s === 'accepted';
              });
              const completedShoots = dashboardBookings.filter((b) => (b.status || '').toLowerCase() === 'completed');

              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                  {/* Section Title Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-black text-slate-900 font-sans">
                        Shoot Requests & Upcoming Shoots
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">Accept client booking requests & track your shoots</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {dashboardBookings.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllBookings}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200/60 transition-all cursor-pointer shadow-2xs"
                          title="Clear all bookings"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigate('my_bookings')}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                      >
                        <span>View All Bookings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ⚡ A. NEW SHOOT REQUESTS (Awaiting Creator Decision) */}
                  {pendingRequests.length > 0 && (
                    <div className="space-y-3 bg-amber-50/70 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                            New Shoot Requests ({pendingRequests.length})
                          </h3>
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                          Awaiting your acceptance
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {pendingRequests.map((b) => (
                          <div
                            key={b.id}
                            className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition-all"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={b.image || b.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg'}
                                alt={b.title || b.service}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 truncate">
                                    {b.title || b.service || 'Shoot Package'}
                                  </h4>
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {b.amount}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold truncate">
                                  Client: <span className="font-extrabold text-slate-900">{b.client_name || b.client_type || 'Client'}</span> • {b.date} • {b.time}
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                  📍 {b.location}
                                </p>
                              </div>
                            </div>

                            {/* Accept / Decline / Clear Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleBookingAccept(b.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Accept Booking Request"
                              >
                                <Check className="w-4 h-4" />
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingReject(b.id)}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                                title="Decline Booking Request"
                              >
                                <X className="w-4 h-4" />
                                <span>Decline</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleBookingDelete(b.id, e)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Clear this request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 📅 B. UPCOMING CONFIRMED SHOOTS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Upcoming Confirmed Shoots ({confirmedShoots.length})
                      </h3>
                    </div>

                    {confirmedShoots.length === 0 ? (
                      <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-center space-y-1">
                        <p className="text-xs font-bold text-slate-700">No confirmed shoots yet</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {pendingRequests.length > 0
                            ? 'Accept the client requests above to confirm shoots and add them to your schedule.'
                            : 'When clients book and you accept, your confirmed shoots will appear here.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {confirmedShoots.map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={b.image || b.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg'}
                                alt={b.title}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                                    {b.title || b.service}
                                  </h4>
                                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Confirmed</span>
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold truncate">
                                  {b.client_name || 'Client'} • {b.date} • {b.time}
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                  📍 {b.location}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={(e) => handleBookingComplete(b.id, e)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Mark Shoot as Completed"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigate('chat_conversation')}
                                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                                title="Chat with client"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleBookingDelete(b.id, e)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Clear this shoot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 🎬 C. COMPLETED SHOOTS */}
                  {completedShoots.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                            Completed Shoots ({completedShoots.length})
                          </h3>
                        </div>
                        <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          Awaiting client review
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {completedShoots.map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={b.image || b.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg'}
                                alt={b.title || b.service}
                                className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 truncate">
                                    {b.title || b.service}
                                  </h4>
                                  <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                    Completed
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold truncate">
                                  Client: <span className="font-extrabold text-slate-900">{b.client_name || 'Client'}</span> • {b.date} • {b.time}
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                  📍 {b.location}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={(e) => handleBookingDelete(b.id, e)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Clear this shoot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* 4. Your Services & Packages Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-sans">
                    Creator Services & Packages
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Your active shoot packages offered to clients</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('services_pricing')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                >
                  <span>Manage Packages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Videographer Packages Grid */}
              {(() => {
                const activePackages = shooter?.packages || [];
                return activePackages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activePackages.map((pkg) => (
                    <div
                      key={pkg.id || pkg.title}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group relative"
                    >
                      <div className="relative h-32 sm:h-36 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={pkg.cover_image || shooter?.cover_image || 'https://ik.imagekit.io/demo/tr:w-600,h-400/img/plant.jpeg'}
                          alt={pkg.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-950/20" />
                        
                        {pkg.popular && (
                          <span className="absolute top-3 left-3 bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                            ⭐ Popular
                          </span>
                        )}

                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                          <button
                            type="button"
                            onClick={() => onNavigate('services_pricing')}
                            className="px-2 py-0.5 bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 font-extrabold text-[10px] rounded-lg shadow-xs transition-all"
                            title="Edit package"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const currentPkgs = shooter?.packages || [];
                              const updated = currentPkgs.filter((p) => (p.id || p.title) !== (pkg.id || pkg.title));
                              if (onUpdatePackages) onUpdatePackages(updated);
                            }}
                            className="px-2 py-0.5 bg-rose-600/90 backdrop-blur-md hover:bg-rose-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-all"
                            title="Delete package"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 font-sans tracking-tight leading-snug">
                            {pkg.title}
                          </h3>
                          <div className="text-lg sm:text-xl font-black text-indigo-600 mt-0.5">
                            ₹{typeof pkg.price === 'number' ? pkg.price.toLocaleString('en-IN') : pkg.price}
                          </div>

                          <div className="space-y-1 text-[11px] font-semibold text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                            {(pkg.deliverablesList || [
                              pkg.reelsCount,
                              pkg.photosCount,
                              pkg.duration,
                              pkg.editing,
                              pkg.revisions,
                              pkg.turnaround
                            ].filter(Boolean)).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-[9px] font-bold">
                                  {item.toLowerCase().includes('reel') ? '😊' : item.toLowerCase().includes('delivery') || item.toLowerCase().includes('hour') || item.toLowerCase().includes('shoot') ? '🕒' : '✓'}
                                </div>
                                <span className="font-medium text-[11px] text-slate-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 space-y-2">
                  <Package className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Custom Shoot Packages Added</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('services_pricing')}
                    className="text-xs font-bold text-indigo-600 hover:underline inline-block"
                  >
                    + Click here to create your first Shoot Package
                  </button>
                </div>
              );
            })()}
          </div>

            {/* 5. Portfolio Photos Showcase Section (Max 6 Photos) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-sans">
                    Portfolio Photos Showcase
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Your featured shoot photos & commercial work (Max 6 photos)</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('portfolio')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                >
                  <span>Manage Portfolio Photos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {shooter?.portfolio && shooter.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {shooter.portfolio.slice(0, 6).map((item) => (
                    <div key={item.id || item.title} className="relative aspect-[4/5] rounded-2xl overflow-hidden group border border-slate-200/60 shadow-2xs">
                      <img
                        src={item.image_url || item.thumbnail || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => onNavigate('portfolio')}
                          className="px-2 py-0.5 bg-white/90 text-slate-800 text-[10px] font-bold rounded-lg shadow-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentPortfolio = shooter?.portfolio || [];
                            const updated = currentPortfolio.filter((p) => (p.id || p.title) !== (item.id || item.title));
                            if (onUpdatePortfolio) onUpdatePortfolio(updated);
                          }}
                          className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg shadow-xs"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-bold truncate">
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 space-y-2">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Portfolio Photos Uploaded</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('portfolio')}
                    className="text-xs font-bold text-indigo-600 hover:underline inline-block"
                  >
                    + Click here to add your first Portfolio Photo (Up to 6 max)
                  </button>
                </div>
              )}
            </div>

          </main>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR PANEL (Desktop: 3 cols) */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-3 space-y-6">
            


            {/* 2. Profile Completeness 80% Donut Ring Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              
              {/* Circular Progress Ring */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600 stroke-current"
                    strokeDasharray="80, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-slate-900">80%</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 font-sans">Profile Complete</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Add more details to get more bookings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('profile_edit')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            </div>

            {/* 3. Recent Activity Feed */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 font-sans">
                  Recent Activity
                </h3>
                {recentActivities.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRecentActivity}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Clear recent activity feed"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((b) => (
                    <div key={b.id} className="group flex items-start justify-between gap-3 text-xs p-1 -mx-1 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                          b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {b.status === 'Confirmed' ? '✓' : b.status === 'Completed' ? '★' : '📅'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">
                            {b.service || b.title || 'Shoot Booking'} <span className="font-semibold text-slate-500">({b.status})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">{b.date || 'Upcoming'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-indigo-600 font-bold">{b.amount}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDismissActivity(b.id, e)}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 space-y-1">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No Recent Activity</p>
                  <p className="text-[11px] text-slate-400">Updates will appear here as client bookings and requests come in.</p>
                </div>
              )}
            </div>

          </aside>

        </div>
      </div>

    </div>
  );
}
