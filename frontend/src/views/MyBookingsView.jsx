import React, { useState } from 'react';
import { ArrowLeft, Bell, Calendar, Check, X, CheckCircle, MessageSquare, Upload, ArrowRight, Clock, Trash2, Star, FileText, Phone, MapPin, Copy, ExternalLink } from 'lucide-react';
import { matchesBookingId } from '../api';

export default function MyBookingsView({ onNavigate, bookings = [], onSelectBooking, onUpdateStatus, userRole = 'client', onDeleteBooking, onClearBookings, onStartChat }) {
  const [detailsBooking, setDetailsBooking] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (number) => {
    if (!number) return;
    try {
      navigator.clipboard.writeText(number);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (e) {}
  };
  const [bookingsList, setBookingsList] = useState(() => {
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
          setBookingsList(parsed);
          return;
        }
      }
    } catch (e) {}
    if (Array.isArray(bookings) && bookings.length > 0) {
      setBookingsList(bookings);
    }
  }, [bookings]);

  const handleAccept = (id, e) => {
    e.stopPropagation();
    setBookingsList((prev) =>
      prev.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Confirmed' } : b))
    );
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Confirmed');
    }
  };

  const handleReject = (id, e) => {
    e.stopPropagation();
    setBookingsList((prev) =>
      prev.map((b) => (matchesBookingId(b, id) ? { ...b, status: 'Declined' } : b))
    );
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Declined');
    }
  };

  const handleBookingDelete = (id, e) => {
    if (e) e.stopPropagation();
    setBookingsList((prev) => prev.filter((b) => !matchesBookingId(b, id)));
    if (onDeleteBooking) {
      onDeleteBooking(id);
    }
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    setBookingsList([]);
    if (onClearBookings) {
      onClearBookings();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pb-24 text-slate-800 animate-fade-in relative font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(userRole === 'creator' ? 'dashboard' : 'home')}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">My Bookings</h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {userRole === 'creator'
                  ? 'Manage upcoming shoots, accept client requests & track history'
                  : 'Track upcoming shoots, creator confirmation status & history'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bookingsList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-2xl border border-slate-200/60 transition-all cursor-pointer"
                title="Clear all bookings"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/60 transition-all cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {bookingsList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No bookings yet</h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
              {userRole === 'creator'
                ? 'You have no shoot requests or scheduled bookings right now.'
                : 'You have not booked any shoots yet. Explore top creators and book your slot!'}
            </p>
            {userRole !== 'creator' && (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore Creators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookingsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailsBooking(item)}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  {(() => {
                    const rawImg = (userRole === 'creator' ? item.client_avatar : item.shooter_avatar) || item.shooter_avatar;
                    const targetName = userRole === 'creator' ? (item.client_name || 'Client') : (item.shooter_name || 'Creator');
                    const cleanImg = (typeof rawImg === 'string' && rawImg.trim() && !rawImg.includes('null') && !rawImg.includes('photo-1500648767791')) ? rawImg.trim() : null;
                    return (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 shadow-2xs border border-slate-200/60 mt-0.5 sm:mt-0 bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg select-none">
                        {cleanImg ? (
                          <img
                            src={cleanImg}
                            alt={targetName}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(targetName || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {item.service || 'Reel Shoot'}
                      </h3>
                      {item.amount && (
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                          {item.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-bold truncate">
                      {userRole === 'creator' ? `Client: ${item.client_name || 'Client'}` : `Creator: ${item.shooter_name || 'Creator'}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
                      <span>{item.date} • {item.time}</span>
                      <span className="text-slate-400">📍 {item.location}</span>
                    </div>

                    {/* Quick phone preview on card */}
                    {item.phone_number && (
                      <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50/70 px-2.5 py-0.5 rounded-lg border border-emerald-100/80 w-fit">
                        <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{item.phone_number}</span>
                      </p>
                    )}

                    {/* Quick requirements preview on card */}
                    {item.requirements && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 line-clamp-1 max-w-md">
                        <span className="font-bold text-slate-700">Requirement: </span>
                        <span>{item.requirements}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsBooking(item);
                        }}
                        className="text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="View Booking Details (Number, Location, Brief)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectBooking) onSelectBooking(item);
                          onNavigate('booking_status');
                        }}
                        className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="View Status Timeline"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>View Timeline</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions (Accept / Decline / Chat) */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {item.status?.toLowerCase() === 'pending' ? (
                    userRole === 'creator' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleAccept(item.id, e)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Accept Booking Request"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleReject(item.id, e)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Decline Booking Request"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Waiting for Creator</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(item.id, e);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                          title="Cancel Request"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  ) : item.status?.toLowerCase() === 'confirmed' ? (
                    <div className="flex items-center gap-2.5">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmed</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartChat) {
                            const target = userRole === 'creator'
                              ? { id: item.client_id || item.user_id || 'client', name: item.client_name || 'Client', avatar: item.client_avatar }
                              : { id: item.shooter_id || item.shooterId || 'creator', name: item.shooter_name || 'Creator', avatar: item.shooter_avatar };
                            onStartChat(target, item);
                          } else {
                            onNavigate('chat_conversation');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                        title={userRole === 'creator' ? 'Chat with client' : 'Chat with creator'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ) : item.status?.toLowerCase() === 'completed' ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                        Completed
                      </span>
                      {item.is_reviewed ? (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-200 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectBooking) onSelectBooking(item);
                            onNavigate('rate_experience');
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Rate & Review Creator"
                        >
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Review Creator</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1.5 rounded-full border border-rose-200">
                      Declined
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleBookingDelete(item.id, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer ml-0.5"
                    title="Clear this booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shoot Details Modal (Number, Location, Requirements, Time) */}
        {detailsBooking && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setDetailsBooking(null)}
          >
            <div
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Shoot Details</h3>
                    <p className="text-[11px] font-bold text-slate-400">
                      ID: {detailsBooking.id} • <span className="capitalize text-indigo-600 font-extrabold">{detailsBooking.status || 'Confirmed'}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsBooking(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Service & Client summary */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {(() => {
                    const rawImg = (userRole === 'creator' ? detailsBooking.client_avatar : detailsBooking.shooter_avatar) || detailsBooking.shooter_avatar;
                    const targetName = userRole === 'creator' ? (detailsBooking.client_name || 'Client') : (detailsBooking.shooter_name || 'Creator');
                    const cleanImg = (typeof rawImg === 'string' && rawImg.trim() && !rawImg.includes('null') && !rawImg.includes('photo-1500648767791')) ? rawImg.trim() : null;
                    return (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm select-none">
                        {cleanImg ? (
                          <img
                            src={cleanImg}
                            alt={targetName}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(targetName || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 truncate">{detailsBooking.service || 'Reel Shoot'}</h4>
                      {detailsBooking.amount && (
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {detailsBooking.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-bold truncate mt-0.5">
                      {userRole === 'creator' ? `Client: ${detailsBooking.client_name || 'Client'}` : `Creator: ${detailsBooking.shooter_name || 'Creator'}`}
                    </p>
                  </div>
                </div>

                {/* 1. Phone Number */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Contact Phone Number
                  </span>
                  {detailsBooking.phone_number ? (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-sm font-black text-slate-900 tracking-wide font-mono">
                        {detailsBooking.phone_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(detailsBooking.phone_number)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Copy number"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`tel:${detailsBooking.phone_number}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">No contact number provided for this booking.</p>
                  )}
                </div>

                {/* 2. Location */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Shoot Location
                  </span>
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {detailsBooking.location || 'Location to be decided'}
                    </p>
                    {detailsBooking.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailsBooking.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-100 transition-all flex items-center gap-1"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 3. Requirements & Shoot Brief */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Shoot Requirements & Brief
                  </span>
                  {detailsBooking.requirements ? (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                      {detailsBooking.requirements}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">No specific shoot brief or requirements provided.</p>
                  )}
                </div>

                {/* 4. Date & Time */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Date & Time Slot
                  </span>
                  <p className="text-xs font-extrabold text-slate-800">
                    {detailsBooking.date || 'TBD'} • {detailsBooking.time || 'Flexible'}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = detailsBooking;
                    setDetailsBooking(null);
                    if (onSelectBooking) onSelectBooking(b);
                    else onNavigate('booking_status');
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Status Timeline →
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const b = detailsBooking;
                      setDetailsBooking(null);
                      if (onStartChat) {
                        const target = userRole === 'creator'
                          ? { id: b.client_id || b.user_id || 'client', name: b.client_name || 'Client', avatar: b.client_avatar }
                          : { id: b.shooter_id || b.shooterId || 'creator', name: b.shooter_name || 'Creator', avatar: b.shooter_avatar };
                        onStartChat(target, b);
                      } else {
                        onNavigate('chat_conversation');
                      }
                    }}
                    className="px-4 py-2 bg-frambit-gradient text-white font-extrabold text-xs rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsBooking(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

