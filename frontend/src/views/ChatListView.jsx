import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, MessageSquare, Sparkles, User, CheckCheck, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToConversations, getOrCreateConversation, markChatAsRead, deleteConversation, getChatPartner } from '../services/chatService';


export default function ChatListView({ onNavigate, onSelectChat }) {
  const { currentUser, userData, userRole } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const isLoggedIn = Boolean(
    currentUser ||
    (userData && userData.email && !['guest@frambit.com', 'Not signed in', ''].includes(userData.email))
  );

  const userAliases = React.useMemo(() => {
    if (!isLoggedIn) return [];
    const list = new Set();
    // Firebase UID (real or fallback mock = email)
    if (currentUser?.uid) list.add(String(currentUser.uid).toLowerCase().trim());
    // Emails — most reliable cross-system identifier
    if (currentUser?.email) list.add(String(currentUser.email).toLowerCase().trim());
    if (userData?.email) list.add(String(userData.email).toLowerCase().trim());
    // Django DB id (if available from synced profile)
    if (userData?.id) {
      list.add(String(userData.id).toLowerCase().trim());
      list.add(`creator_${userData.id}`);
    }
    // Name-based aliases (used when creator id/email not stored)
    if (currentUser?.displayName) list.add(String(currentUser.displayName).toLowerCase().replace(/\s+/g, '_'));
    if (userData?.name) list.add(userData.name.toLowerCase().replace(/\s+/g, '_'));
    if (userData?.display_name) list.add(userData.display_name.toLowerCase().replace(/\s+/g, '_'));
    return Array.from(list);
  }, [currentUser, userData, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || userAliases.length === 0) {
      setChats([]);
      return;
    }
    const unsubscribe = subscribeToConversations(userAliases, (updatedChats) => {
      setChats(updatedChats || []);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userAliases, isLoggedIn]);

  const handleStartQuickChat = async (creator) => {
    if (!isLoggedIn) {
      onNavigate('auth_login');
      return;
    }
    const chat = await getOrCreateConversation(
      currentUser || userData || {},
      creator
    );
    if (onSelectChat) {
      onSelectChat(chat);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-200/80 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-slate-900">Sign In to Chat</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chat is only available to logged-in users. Sign in to chat directly with creators or view your client messages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('auth_login')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Log In or Sign Up
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = chats.filter((c) => (Number(c.unread_count) || 0) > 0).length;
  const bookingsCount = chats.filter((c) => Boolean(c.booking_id)).length;

  const filteredChats = chats.filter((chat) => {
    if (activeFilter === 'unread' && (!chat.unread_count || Number(chat.unread_count) === 0)) return false;
    if (activeFilter === 'bookings' && !chat.booking_id) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const partner = getChatPartner(chat, currentUser, userData, userRole);
      const targetName = (partner.name || '').toLowerCase();
      const lastMsg = (chat.last_message || '').toLowerCase();
      return targetName.includes(q) || lastMsg.includes(q);
    }
    return true;
  });

  const handleSelectChatRow = (chat) => {
    markChatAsRead(chat.id);
    if (onSelectChat) {
      onSelectChat(chat);
    }
  };

  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConversation(chatToDelete.id);
      setChats((prev) => prev.filter((c) => c.id !== chatToDelete.id));
      setChatToDelete(null);
    } catch (err) {
      console.warn('Delete chat error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-5">

        {/* Top Header Card */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="p-2 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 active:scale-95 text-slate-600 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Messages & Chat</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Direct conversations with creators & shoot updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              searchOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Search Drawer */}
        {searchOpen && (
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm animate-fade-in">
            <div className="flex items-center bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200/60">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by creator name or message..."
                className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Pills (All, Bookings, Unread) */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Messages', count: chats.length },
            { id: 'bookings', label: 'Bookings', count: bookingsCount },
            { id: 'unread', label: 'Unread', count: unreadCount },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              <span>{filter.label}</span>
              {filter.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilter === filter.id
                    ? 'bg-white/25 text-white'
                    : filter.id === 'unread' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Chat List Items */}
        {filteredChats.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800">No Conversations Yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Book a shoot with a creator to start chatting with them directly in real time.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Explore Creators
              </button>
            </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {filteredChats.map((chat) => {
              const partner = getChatPartner(chat, currentUser, userData, userRole);
              const displayName = partner.name;
              const displayAvatar = partner.avatar;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChatRow(chat)}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar with online status and fallback */}
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-indigo-500 to-purple-600 border border-slate-100 flex items-center justify-center font-black text-white text-base shadow-2xs select-none">
                      {displayAvatar && !imgErrors[chat.id] ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          onError={() => setImgErrors((prev) => ({ ...prev, [chat.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span>{(displayName || 'U').charAt(0).toUpperCase()}</span>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {displayName}
                          </h3>
                          {partner.role && (
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md shrink-0 ${
                              partner.role === 'Client'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80'
                                : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                            }`}>
                              {partner.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {chat.last_message_time || 'Recent'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5 leading-tight flex items-center gap-1">
                        <span className="truncate">{chat.last_message || 'Tap to chat...'}</span>
                      </p>

                      {chat.booking_title && (
                        <span className="inline-block text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mt-1">
                          🎬 {chat.booking_title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {chat.unread_count > 0 && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                        {chat.unread_count}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Chat Confirmation Modal */}
        {chatToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200/90 shadow-2xl space-y-4 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900">Delete Conversation?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Delete conversation with <strong className="text-slate-800">{getChatPartner(chatToDelete, currentUser, userData, userRole).name}</strong>? All messages in this chat will be permanently removed.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setChatToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteChat}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
