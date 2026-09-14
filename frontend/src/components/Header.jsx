import React, { useState } from 'react';
import { Play, Search, MapPin, Plus, User, Menu, X, Sparkles, Navigation, Loader2, Check, LayoutDashboard, FileText, Settings, Eye, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { detectCurrentCity } from '../utils/location';

export default function Header({ currentScreen, onNavigate, currentLocation = 'Bengaluru', onLocationChange, unreadChatCount = 0 }) {
  const { userRole, currentUser, userData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const isCreator = userRole === 'creator';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate(isCreator ? 'booking_requests' : 'search');
  };

  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    const city = await detectCurrentCity();
    setIsDetectingGps(false);
    if (onLocationChange && city) {
      onLocationChange(city);
    }
  };

  const [imgError, setImgError] = useState(false);
  const userAvatar = userData?.avatar || userData?.photoURL || currentUser?.photoURL;
  const userName = userData?.name || currentUser?.displayName || (currentUser?.email ? formatNameFromEmail(currentUser.email) : 'Profile');

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate(isCreator ? 'dashboard' : 'home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <img
              src="/logo.png"
              alt="Frambit"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-2xl group-hover:scale-105 transition-all drop-shadow-xs"
            />
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans leading-none block">
                Frambit
              </span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider hidden sm:block">
                {isCreator ? 'Creator Studio Hub' : 'Find. Book. Create.'}
              </span>
            </div>
          </div>

          {/* Location Badge & Search Bar (Desktop / Tablet) */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-4">
            
            {/* Auto-detected Location Display Badge */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition-all border border-slate-200/60 shadow-2xs group cursor-pointer"
                title="Auto-detected location (Click to refresh)"
              >
                <MapPin className={`w-4 h-4 text-indigo-600 fill-indigo-100 group-hover:scale-110 transition-transform ${isDetectingGps ? 'animate-bounce' : ''}`} />
                <span className="max-w-[130px] truncate">{isDetectingGps ? 'Detecting...' : currentLocation}</span>
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isCreator ? 'Search shoot requests...' : 'Search creators, services...'}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 font-medium pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </form>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            {isCreator ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'dashboard' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('services_pricing')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'services_pricing' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => onNavigate('booking_requests')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'booking_requests' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => onNavigate('my_bookings')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'my_bookings' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Bookings
                </button>
                <button
                  onClick={() => onNavigate('portfolio')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'portfolio' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => onNavigate('shooter_profile')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-extrabold transition-all border border-indigo-200/80 cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                  title="See how clients view your creator profile"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>View as Client</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'home' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Explore
                </button>
                <button
                  onClick={() => onNavigate('search')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'search' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => onNavigate('my_bookings')}
                  className={`hover:text-indigo-600 transition-colors ${
                    currentScreen === 'my_bookings' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  Bookings
                </button>
                <button
                  onClick={() => onNavigate('chat_list')}
                  className={`relative hover:text-indigo-600 transition-colors ${
                    currentScreen === 'chat_list' || currentScreen === 'chat_conversation' ? 'text-indigo-600 font-extrabold relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full' : ''
                  }`}
                >
                  <span>Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1.5 -right-3.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Action Button: Pure Round Avatar Circle Button */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate(isCreator ? 'profile_edit' : 'client_profile')}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-all transform active:scale-95 shadow-md shadow-indigo-600/30 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 border border-slate-200/80"
              title={userName || "Profile"}
            >
              {userAvatar && !imgError ? (
                <img
                  src={userAvatar}
                  alt={userName || "Profile"}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm">
                  {userName && userName !== 'Profile' && userName !== 'User Profile' ? (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
              )}
            </button>
          </div>

          {/* Mobile Location & Hamburger Menu Controls */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100/90 text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-full border border-slate-200/60 shadow-2xs">
              <MapPin className="w-3 h-3 text-indigo-600 fill-indigo-100" />
              <span className="max-w-[90px] truncate">{currentLocation}</span>
            </div>

            <button
              onClick={() => onNavigate('search')}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-3 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shooters, locations..."
              className="w-full bg-slate-100 text-xs text-slate-800 font-medium pl-9 pr-4 py-2.5 rounded-2xl focus:outline-none border border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          <div className="flex flex-col gap-1.5 pt-1 text-xs font-bold text-slate-700">
            {isCreator ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between text-indigo-600 font-extrabold"
                >
                  <span>Creator Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('booking_requests');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Shoot Requests</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('my_bookings');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Upcoming Bookings</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('portfolio');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Photo Portfolio Gallery</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('profile_edit');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between border-t border-slate-100 pt-3"
                >
                  <span>Edit Creator Profile</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Explore Market</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('search');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Find Shooters</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('my_bookings');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>My Bookings</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('chat_list');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>Messages & Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs">
                        {unreadChatCount}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => {
                    onNavigate('portfolio');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between"
                >
                  <span>Photo Portfolio</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('client_profile');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between border-t border-slate-100 pt-2"
                >
                  <span>My Account & Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

