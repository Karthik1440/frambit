import React from 'react';
import { ArrowLeft, CheckCircle2, MessageSquare, MoreVertical, Clock, XCircle, X, Check, Calendar, AlertCircle, Star, Upload, Phone, FileText } from 'lucide-react';

export default function BookingStatusView({
  booking,
  onNavigate,
  onOpenChat,
  onUpdateStatus,
  userRole = 'client',
}) {
  const currentBooking = booking || (() => {
    try {
      const saved = localStorage.getItem('frambit_active_booking');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  })();

  if (!currentBooking) {
    return (
      <div className="min-h-screen bg-frambit-light pb-24 text-slate-800 animate-fade-in relative flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 text-center border border-slate-200/80 shadow-frambit-card space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">No Booking Selected</h2>
          <p className="text-xs text-slate-500 font-medium">Please select a booking from My Bookings to view its details.</p>
          <button
            onClick={() => onNavigate('my_bookings')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Bookings</span>
          </button>
        </div>
      </div>
    );
  }

  const rawStatus = (currentBooking.status || 'Pending').toLowerCase();
  const isConfirmed = rawStatus === 'confirmed' || rawStatus === 'accepted';
  const isDeclined = rawStatus === 'declined' || rawStatus === 'rejected';
  const isCancelled = rawStatus === 'cancelled';
  const isInProgress = rawStatus === 'in_progress' || rawStatus === 'in progress';
  const isCompleted = rawStatus === 'completed';
  const isPending = !isConfirmed && !isDeclined && !isCancelled && !isInProgress && !isCompleted;

  const handleAcceptBooking = () => {
    if (onUpdateStatus) {
      onUpdateStatus(currentBooking.id, 'Confirmed');
    }
  };

  const handleDeclineBooking = () => {
    if (onUpdateStatus) {
      onUpdateStatus(currentBooking.id, 'Declined');
    }
  };

  const handleCancelBooking = () => {
    if (window.confirm('Are you sure you want to cancel this booking request?')) {
      if (onUpdateStatus) {
        onUpdateStatus(currentBooking.id, 'Cancelled');
      }
    }
  };

  return (
    <div className="min-h-screen bg-frambit-light pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-md mx-auto sm:max-w-xl px-4 py-4 space-y-5">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('my_bookings')}
              className="p-2 text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
              title="Back to My Bookings"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900">Booking Details</h1>
              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                {currentBooking.id}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('my_bookings')}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Card Summary */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-frambit-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
              <img
                src={(userRole === 'creator' ? (currentBooking.client_avatar || currentBooking.shooter_avatar) : currentBooking.shooter_avatar) || null}
                alt={userRole === 'creator' ? (currentBooking.client_name || 'Client') : (currentBooking.shooter_name || 'Creator')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">
                {currentBooking.service || currentBooking.title || 'Reel Shoot'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold truncate">
                {userRole === 'creator'
                  ? (currentBooking.client_name ? `Client: ${currentBooking.client_name}` : 'Client')
                  : (currentBooking.shooter_name ? `with ${currentBooking.shooter_name}` : '')}
              </p>
              <p className="text-xs text-slate-500 font-semibold">{currentBooking.date} • {currentBooking.time}</p>
              <p className="text-[11px] text-slate-400 font-medium truncate">{currentBooking.location}</p>
              {currentBooking.phone_number && (
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {currentBooking.phone_number}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">
              {currentBooking.amount || '₹799/hr'}
            </span>
            {userRole !== 'creator' ? (
              <button
                onClick={() => onNavigate('shooter_profile')}
                className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100 transition-all cursor-pointer"
              >
                View Details
              </button>
            ) : (
              <button
                onClick={() => onNavigate('my_bookings')}
                className="text-xs font-extrabold text-slate-600 hover:text-slate-800 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                All Bookings
              </button>
            )}
          </div>
        </div>

        {/* Shoot Brief / Requirements (Phone Number & Requirements first) */}
        {(currentBooking.requirements || currentBooking.phone_number) && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-frambit-card space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Shoot Brief & Requirements
            </h3>
            {currentBooking.phone_number && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs text-slate-800 font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{currentBooking.phone_number}</span>
                </div>
                <a
                  href={`tel:${currentBooking.phone_number}`}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs"
                >
                  Call
                </a>
              </div>
            )}
            {currentBooking.requirements && (
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {currentBooking.requirements}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Status Alert Banner */}
        {isPending && (
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-3xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Awaiting Creator Acceptance
              </h4>
              <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                Your request has been sent to <span className="font-bold">{currentBooking.shooter_name || 'the creator'}</span>.
                This booking will only be accepted once the creator confirms.
              </p>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-3xl p-4 flex items-start gap-3 text-emerald-900 shadow-2xs">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                Booking Accepted & Confirmed
              </h4>
              <p className="text-xs text-emerald-800/90 font-medium mt-0.5">
                <span className="font-bold">{currentBooking.shooter_name || 'The creator'}</span> has accepted your booking request. You're all set!
              </p>
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="bg-rose-50/90 border border-rose-200/80 rounded-3xl p-4 flex items-start gap-3 text-rose-900 shadow-2xs">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                Booking Request Declined
              </h4>
              <p className="text-xs text-rose-800/90 font-medium mt-0.5">
                The creator was unavailable for this time slot and declined the request. You can explore other creators or try another time.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 flex items-start gap-3 text-slate-800 shadow-2xs">
            <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
              <X className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Booking Request Cancelled
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                This booking request has been cancelled.
              </p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 text-emerald-900 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Shoot Completed!
                </h4>
                <p className="text-xs text-emerald-800/90 font-medium mt-0.5">
                  Your shoot with <span className="font-bold">{currentBooking.shooter_name || 'the creator'}</span> has been completed. Please rate your experience!
                </p>
              </div>
            </div>

            {currentBooking.is_reviewed ? (
              <div className="flex items-center gap-2 bg-emerald-100/70 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-emerald-800 border border-emerald-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>You have already submitted a review for this creator.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('rate_experience')}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Star className="w-4 h-4 fill-white text-white" />
                <span>Rate & Review Creator</span>
              </button>
            )}
          </div>
        )}

        {/* Vertical Progress Step Timeline Tracker */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-frambit-card space-y-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Status Timeline</h3>

          <div className="relative pl-6 space-y-6">
            {/* Vertical connecting line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

            {/* Step 1: Requested */}
            <div className="relative flex items-start justify-between group">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-purple-600 ring-4 ring-purple-100 text-white text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 fill-purple-600 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Requested</h4>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {currentBooking.requested_at || 'Just now'}
                </span>
              </div>
            </div>

            {/* Step 2: Creator Acceptance State */}
            {isConfirmed ? (
              <div className="relative flex items-start justify-between group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-purple-600 ring-4 ring-purple-100 text-white text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-purple-600 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Accepted</h4>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    {currentBooking.accepted_at || 'Accepted by creator'}
                  </span>
                </div>
              </div>
            ) : isDeclined ? (
              <div className="relative flex items-start justify-between group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-rose-600 ring-4 ring-rose-100 text-white text-[10px]">
                  <X className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-700">Declined</h4>
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                    {currentBooking.declined_at || 'Creator declined request'}
                  </span>
                </div>
              </div>
            ) : isCancelled ? (
              <div className="relative flex items-start justify-between group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-slate-500 ring-4 ring-slate-100 text-white text-[10px]">
                  <X className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-600">Cancelled</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    Request cancelled
                  </span>
                </div>
              </div>
            ) : (
              /* Pending State: Awaiting creator accept/reject */
              <div className="relative flex items-start justify-between group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-amber-100 border border-amber-300 ring-4 ring-amber-50 text-amber-600 text-[10px]">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-800">
                    Accepted
                  </h4>
                  <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                    Waiting for creator confirmation
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: In Progress */}
            <div className="relative flex items-start justify-between group">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                  isInProgress
                    ? 'bg-purple-600 ring-4 ring-purple-100'
                    : 'bg-slate-200 border-2 border-white'
                }`}
              >
                {isInProgress && <CheckCircle2 className="w-3.5 h-3.5 fill-purple-600 text-white" />}
              </div>
              <div>
                <h4 className={`text-xs font-black ${isInProgress ? 'text-slate-900' : 'text-slate-400'}`}>
                  In Progress
                </h4>
                {isInProgress && (
                  <span className="text-[10px] text-purple-600 font-bold block mt-0.5">
                    Shoot in progress
                  </span>
                )}
              </div>
            </div>

            {/* Step 4: Completed */}
            <div className="relative flex items-start justify-between group">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                  isCompleted
                    ? 'bg-purple-600 ring-4 ring-purple-100'
                    : 'bg-slate-200 border-2 border-white'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 fill-purple-600 text-white" />}
              </div>
              <div>
                <h4 className={`text-xs font-black ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  Completed
                </h4>
                {isCompleted && (
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    {currentBooking.completed_at || 'Shoot completed'}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Creator Control Strip: ONLY shown to Creators, never to client users */}
        {userRole === 'creator' && isPending && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span>Creator Action:</span>
              <span className="text-amber-600 font-bold">Awaiting Decision</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptBooking}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Accept Booking</span>
              </button>
              <button
                type="button"
                onClick={handleDeclineBooking}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {userRole === 'creator' && isConfirmed && (
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-3xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
              <span>Creator Action:</span>
              <span className="text-emerald-700 font-bold">Shoot Confirmed</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onUpdateStatus) {
                  onUpdateStatus(currentBooking.id, 'Completed');
                }
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mark Shoot as Completed</span>
            </button>
          </div>
        )}



        {/* Bottom Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {isDeclined || isCancelled ? (
            <>
              <button
                onClick={() => onNavigate('home')}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200 transition-all text-center"
              >
                Find Other Creators
              </button>
              <button
                onClick={() => onNavigate('my_bookings')}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-frambit transition-all text-center"
              >
                My Bookings
              </button>
            </>
          ) : isPending ? (
            <>
              <button
                onClick={handleCancelBooking}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200 transition-all text-center cursor-pointer"
              >
                Cancel Request
              </button>
              <button
                onClick={() => onOpenChat && onOpenChat()}
                className="flex-1 py-3 px-4 bg-frambit-gradient text-white font-extrabold text-xs rounded-2xl shadow-frambit hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Chat</span>
              </button>
            </>
          ) : isCompleted ? (
            <>
              <button
                onClick={() => onNavigate('my_bookings')}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200 transition-all text-center cursor-pointer"
              >
                My Bookings
              </button>
              {!currentBooking.is_reviewed && (
                <button
                  onClick={() => onNavigate('rate_experience')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Review Creator</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('my_bookings')}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200 transition-all text-center"
              >
                My Bookings
              </button>
              <button
                onClick={() => onOpenChat && onOpenChat()}
                className="flex-1 py-3 px-4 bg-frambit-gradient text-white font-extrabold text-xs rounded-2xl shadow-frambit hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>{userRole === 'creator' ? 'Chat with Client' : 'Chat with Creator'}</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
