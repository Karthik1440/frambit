import React, { useState } from 'react';
import { Home, Calendar, Heart, User, LayoutDashboard, FileText, Image as ImageIcon, Settings, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activeTab, onTabChange, unreadChatCount = 0 }) {
  const { userRole, currentUser, userData } = useAuth();
  const [imgError, setImgError] = useState(false);

  const userAvatar = userData?.avatar || userData?.photoURL || currentUser?.photoURL;
  const userName = userData?.name || currentUser?.displayName || currentUser?.email;
  const isLoggedIn = Boolean(currentUser || userData);

  // Helper component to render round profile avatar or default icon
  const renderProfileIcon = (isActive) => {
    if (isLoggedIn) {
      return (
        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center transition-all ${
          isActive ? 'ring-2 ring-indigo-600 border border-white shadow-xs' : 'border border-slate-300'
        }`}>
          {userAvatar && !imgError ? (
            <img
              src={userAvatar}
              alt={userName || "Profile"}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-[10px] uppercase">
              {userName ? userName.charAt(0) : <User className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>
      );
    }
    return <User className={`w-5 h-5 ${isActive ? 'text-indigo-600 stroke-[2.5]' : ''}`} />;
  };

  // Creator Role Tabs
  if (userRole === 'creator') {
    const isDashboardActive = activeTab === 'dashboard';
    const isRequestsActive = activeTab === 'booking_requests';
    const isChatActive = activeTab === 'chat_list' || activeTab === 'chat_conversation';
    const isBookingsActive = activeTab === 'my_bookings' || activeTab === 'booking_status';
    const isProfileActive = activeTab === 'profile_edit' || activeTab === 'client_profile';

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-slate-900/95 text-white backdrop-blur-md border-t border-slate-800 py-2.5 px-3 flex items-center justify-around z-50 shadow-2xl select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
    >
        {/* 1. Creator Dashboard Tab */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            isDashboardActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? 'text-indigo-400 stroke-[2.5]' : ''}`} />
          <span>Dashboard</span>
        </button>

        {/* 2. Requests Tab */}
        <button
          type="button"
          onClick={() => onTabChange('booking_requests')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative ${
            isRequestsActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className={`w-5 h-5 ${isRequestsActive ? 'text-indigo-400 stroke-[2.5]' : ''}`} />
          <span>Requests</span>
          <span className="absolute -top-0.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
        </button>

        {/* 3. Chat Tab */}
        <button
          type="button"
          onClick={() => onTabChange('chat_list')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative ${
            isChatActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${isChatActive ? 'text-indigo-400 stroke-[2.5]' : ''}`} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span>Chat</span>
        </button>

        {/* 4. Bookings Tab */}
        <button
          type="button"
          onClick={() => onTabChange('my_bookings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            isBookingsActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className={`w-5 h-5 ${isBookingsActive ? 'text-indigo-400 stroke-[2.5]' : ''}`} />
          <span>Bookings</span>
        </button>

        {/* 5. Profile Tab */}
        <button
          type="button"
          onClick={() => onTabChange('profile_edit')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            isProfileActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {renderProfileIcon(isProfileActive)}
          <span>Profile</span>
        </button>
      </nav>
    );
  }

  // Client Role Tabs matching design mockup: Home, Bookings, Chat, Saved, Profile
  const isHomeActive = activeTab === 'home' || activeTab === 'splash';
  const isBookingsActive = activeTab === 'my_bookings' || activeTab === 'book_slot' || activeTab === 'booking_status' || activeTab === 'booking_summary';
  const isChatActive = activeTab === 'chat_list' || activeTab === 'chat_conversation';
  const isSavedActive = activeTab === 'saved';
  const isProfileActive = activeTab === 'client_profile';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-2 flex items-center justify-around z-50 shadow-lg select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
    >
      {/* 1. Home Tab */}
      <button
        type="button"
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          isHomeActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className={`w-5 h-5 ${isHomeActive ? 'fill-indigo-600 text-indigo-600' : ''}`} />
        <span>Home</span>
      </button>

      {/* 2. Bookings Tab */}
      <button
        type="button"
        onClick={() => onTabChange('my_bookings')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          isBookingsActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Calendar className={`w-5 h-5 ${isBookingsActive ? 'text-indigo-600 stroke-[2.5]' : ''}`} />
        <span>Bookings</span>
      </button>

      {/* 3. Chat Tab */}
      <button
        type="button"
        onClick={() => onTabChange('chat_list')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative ${
          isChatActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 ${isChatActive ? 'fill-indigo-600 text-indigo-600' : ''}`} />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </div>
        <span>Chat</span>
      </button>

      {/* 4. Saved Tab */}
      <button
        type="button"
        onClick={() => onTabChange('saved')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          isSavedActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Heart className={`w-5 h-5 ${isSavedActive ? 'fill-indigo-600 text-indigo-600' : ''}`} />
        <span>Saved</span>
      </button>

      {/* 5. Profile Tab */}
      <button
        type="button"
        onClick={() => onTabChange('client_profile')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          isProfileActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {renderProfileIcon(isProfileActive)}
        <span>Profile</span>
      </button>
    </nav>
  );
}
