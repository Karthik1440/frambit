import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { getCleanPersonName } from '../api';


export default function BookingRequestsView({ onNavigate, initialBookings = [], onUpdateStatus, onStartChat }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [bookingsList, setBookingsList] = useState(initialBookings);

  React.useEffect(() => {
    setBookingsList(initialBookings);
  }, [initialBookings]);

  const handleStatusChange = (id, newStatus) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    if (onUpdateStatus) {
      onUpdateStatus(id, newStatus);
    }
  };

  const filteredBookings = bookingsList.filter((b) => {
    const s = (b.status || 'pending').toLowerCase();
    if (activeTab === 'pending') return s === 'pending';
    if (activeTab === 'confirmed') return s === 'confirmed' || s === 'accepted';
    if (activeTab === 'completed') return s === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Top Bar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Booking Requests</h1>
            <p className="text-xs text-slate-500 font-medium">Accept, decline, or complete client shoot requests</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-6 text-xs font-bold">
          {['pending', 'confirmed', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs">
            <Calendar className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No {activeTab} requests</h3>
            <p className="text-xs text-slate-400 mt-1">You currently have no shoot requests under this status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((item) => {
              const itemStatus = (item.status || 'pending').toLowerCase();
              const itemTitle = item.title || item.service || 'Shoot Package';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase text-indigo-600 tracking-wider block">
                        {item.id}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900">{itemTitle}</h3>
                      <span className="text-[11px] font-semibold text-slate-500">
                        From: {getCleanPersonName(item.client_name, item.client_email, 'Client')}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                      {item.amount}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{item.time}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {/* Actions (Screen Diagram: Requests -> Accept/Decline -> Chat) */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                    {itemStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleStatusChange(item.id, 'confirmed');
                            if (onStartChat) {
                              const target = {
                                id: item.client_id || item.user_id || 'client',
                                name: getCleanPersonName(item.client_name, item.client_email, 'Client'),
                                avatar: item.client_avatar
                              };
                              onStartChat(target, item);
                            } else {
                              onNavigate('chat_conversation');
                            }
                          }}
                          className="flex-1 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept & Open Chat</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'declined')}
                          className="w-full sm:w-auto py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-rose-100 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {(itemStatus === 'confirmed' || itemStatus === 'accepted') && (
                      <>
                        <button
                          onClick={() => {
                            if (onStartChat) {
                              const target = {
                                id: item.client_id || item.user_id || 'client',
                                name: getCleanPersonName(item.client_name, item.client_email, 'Client'),
                                avatar: item.client_avatar
                              };
                              onStartChat(target, item);
                            } else {
                              onNavigate('chat_conversation');
                            }
                          }}
                          className="flex-1 w-full py-2.5 bg-frambit-gradient text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Open Chat with Client</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'completed')}
                          className="w-full sm:w-auto py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Complete Shoot
                        </button>
                      </>
                    )}

                    {item.status === 'completed' && (
                      <div className="w-full flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">Shoot Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
