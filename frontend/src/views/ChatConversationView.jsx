import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Paperclip, Send, Image as ImageIcon, CheckCheck, Loader2, Sparkles, X, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendChatMessage, markChatAsRead, clearChatMessages, deleteConversation, getChatPartner } from '../services/chatService';
import { api } from '../api';

const QUICK_PROMPTS = [
  "Hi! Are you available this week?",
  "Let's discuss shoot location & moodboards.",
  "Can you shoot in 4K 60fps vertical?",
  "What lighting and audio gear do you bring?",
];

export default function ChatConversationView({ chat, onNavigate, onOpenBookingDetails }) {
  const { currentUser, userData, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isLoggedIn = Boolean(
    currentUser ||
    (userData && userData.email && !['guest@frambit.com', 'Not signed in', ''].includes(userData.email))
  );

  const currentUserId = currentUser?.uid || currentUser?.email || (userData?.id ? String(userData.id) : '');
  const currentUserName = currentUser?.displayName || userData?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const currentUserRole = userRole || 'client';

  const chatId = chat?.id || 'chat_general';
  const partner = getChatPartner(chat, currentUser, userData, userRole);
  const partnerName = partner.name;
  const partnerAvatar = partner.avatar;

  // Subscribe to real-time Firebase messages & mark as read
  useEffect(() => {
    if (!isLoggedIn || !chatId) return;

    markChatAsRead(chatId);
    const unsubscribe = subscribeToMessages(chatId, (newMsgs) => {
      setMessages(newMsgs || []);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, isLoggedIn]);

  // Scroll to top on mount so header is immediately visible
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } catch (e) {}
  }, [chatId]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isSending) return;

    const textToSend = inputText.trim();
    const imageToSend = attachedImage;

    setInputText('');
    setAttachedImage(null);
    setIsSending(true);

    try {
      await sendChatMessage(chatId, {
        text: textToSend,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        senderAvatar: userData?.avatar || currentUser?.photoURL || localStorage.getItem('frambit_active_avatar') || null,
        images: imageToSend ? [imageToSend] : [],
      });
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearChatMessages(chatId);
      setMessages([]);
      setShowClearConfirm(false);
      setMenuOpen(false);
    } catch (err) {
      console.warn('Clear chat error:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsClearing(true);
    try {
      await deleteConversation(chatId);
      setShowDeleteConfirm(false);
      setMenuOpen(false);
      if (onNavigate) onNavigate('chat_list');
    } catch (err) {
      console.warn('Delete conversation error:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleQuickPromptClick = async (prompt) => {
    setInputText(prompt);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_name', `chat_att_${Date.now()}_${file.name}`);
      formData.append('folder', '/chat_attachments');

      const res = await api.post('/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.url || res.data?.file_url;
      if (uploadedUrl) {
        setAttachedImage(uploadedUrl);
      } else {
        // Local FileReader preview fallback
        const reader = new FileReader();
        reader.onload = (event) => setAttachedImage(event.target.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (event) => setAttachedImage(event.target.result);
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
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
              You must be logged in to participate in chat conversations.
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

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 text-slate-800 animate-fade-in flex flex-col justify-between font-sans">
      <div className="max-w-md mx-auto sm:max-w-3xl w-full px-3 sm:px-4 py-3 space-y-3 flex-1 flex flex-col min-h-[calc(100vh-80px)]">

        {/* Top Header Bar (Sticky) */}
        <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('chat_list')}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Back to messages"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 shrink-0 border border-slate-100 flex items-center justify-center font-black text-white text-sm shadow-2xs select-none">
              {partnerAvatar && !headerImgError ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  onError={() => setHeaderImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(partnerName || 'U').charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  {partnerName}
                </h2>
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
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 relative">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
              title="Clear chat messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30 animate-fade-in text-xs font-bold text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowClearConfirm(true);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                    <span>Clear Messages</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 cursor-pointer border-t border-slate-100"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Conversation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Booking Details Card if attached */}
        {chat?.booking_id && (
          <div className="bg-indigo-50/90 rounded-3xl p-3.5 border border-indigo-100/90 shadow-2xs space-y-2 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  🎬
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{chat.booking_title || 'Reel Shoot'}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{chat.booking_date || 'Upcoming Shoot'}</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                Active Booking
              </span>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenBookingDetails && onOpenBookingDetails()}
                className="px-3 py-1 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                View Booking Details
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 space-y-3 py-2 px-1 overflow-y-auto rounded-3xl">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xs font-black text-slate-700">Start the conversation</h3>
              <p className="text-[11px] max-w-xs text-slate-400 leading-relaxed">
                Coordinate shoot times, moodboards, references, and location details directly with {partnerName}.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = String(msg.sender_id) === String(currentUserId) ||
                (currentUser?.email && String(msg.sender_id) === String(currentUser.email)) ||
                (msg.sender_name && currentUserName && msg.sender_name === currentUserName && msg.sender_role === currentUserRole);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs font-medium'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Attached Images */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-2 pt-1">
                        {msg.images.map((imgUrl, idx) => (
                          <div key={idx} className="max-h-52 rounded-2xl overflow-hidden border border-white/20">
                            <img
                              src={imgUrl}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 font-semibold ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      <span>{msg.time || 'Just now'}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length < 4 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar select-none">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPromptClick(prompt)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Pending Attachment Preview */}
        {attachedImage && (
          <div className="relative inline-block w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md">
            <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white rounded-3xl p-2 sm:p-2.5 border border-slate-200 shadow-md flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
            title="Attach image"
          >
            {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partnerName}...`}
            className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-slate-800 focus:outline-none px-2"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedImage) || isSending}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              inputText.trim() || attachedImage
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 translate-x-0.5" />
            )}
          </button>
        </form>

        {/* Clear Chat Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200/90 shadow-2xl space-y-4 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900">Clear Chat Messages?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  All messages in this conversation with <strong className="text-slate-800">{partnerName}</strong> will be permanently removed. The conversation contact will remain in your list.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  disabled={isClearing}
                  className="flex-1 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Conversation Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200/90 shadow-2xl space-y-4 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900">Delete Conversation?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This entire conversation with <strong className="text-slate-800">{partnerName}</strong> and all message history will be deleted from your messages.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isClearing}
                  className="flex-1 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
