import React, { useState } from 'react';
import { ArrowLeft, Star, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { MOCK_SHOOTERS, submitReviewApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function RateExperienceView({
  onNavigate,
  shooter = MOCK_SHOOTERS[0],
  booking = null,
  userRole = 'client',
  onSubmitReview,
}) {
  const { userData, currentUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Status Guard: Booking must be completed before user can review
  const bookingStatus = (booking?.status || 'completed').toLowerCase();
  const isCompleted = bookingStatus === 'completed';

  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Shoot Not Completed Yet</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            This shoot booking is currently <span className="font-extrabold capitalize text-slate-900">"{booking?.status || 'Pending'}"</span>.
            You can review the creator once the creator has finished and marked the shoot as completed.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('my_bookings')}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const creatorName = shooter?.display_name || shooter?.name || booking?.shooter_name || 'Creator';
  const creatorAvatar = shooter?.avatar || booking?.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg';
  const shootService = booking?.service || booking?.title || shooter?.service || 'Reel Shoot';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const clientName = userData?.display_name || userData?.name || booking?.client_name || 'Karthik';
    const clientAvatar = userData?.avatar || booking?.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

    const reviewData = {
      rating: Number(rating),
      comment: comment.trim() || 'Great shoot experience and high-quality reel delivery!',
      booking: booking?.rawId || booking?.id,
      booking_id: booking?.rawId || booking?.id,
      shooter: shooter?.id || booking?.shooter_id,
      shooter_id: shooter?.id || booking?.shooter_id,
      customer_name: clientName,
      customer_avatar: clientAvatar,
      client_email: userData?.email || currentUser?.email || 'karthik@frambit.com',
      created_at: new Date().toISOString(),
    };

    try {
      await submitReviewApi(reviewData);
    } catch (err) {
      console.warn('Backend review submit fallback:', err);
    }

    if (onSubmitReview) {
      onSubmitReview(booking?.id, reviewData);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      onNavigate('my_bookings');
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative flex flex-col justify-center items-center px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => onNavigate('my_bookings')}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Back to My Bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Rate Your Experience</h1>
            <p className="text-[11px] text-slate-400 font-medium">Review your creator on completed shoot</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Thank You!</h2>
            <p className="text-xs text-slate-500 font-medium">
              Your review for <span className="font-bold text-slate-800">{creatorName}</span> has been submitted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shooter Info Card */}
            <div className="flex items-center gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/70">
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Creator Review</span>
                <h3 className="text-sm font-black text-slate-900 truncate">{creatorName}</h3>
                <p className="text-xs text-slate-500 font-medium truncate">{shootService}</p>
              </div>
            </div>

            {/* Star Rating Picker */}
            <div className="text-center space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Tap to Rate
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                    title={`${star} Star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-amber-600">
                {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional!' :
                 rating === 4 ? '⭐⭐⭐⭐ Great Experience' :
                 rating === 3 ? '⭐⭐⭐ Good' :
                 rating === 2 ? '⭐⭐ Fair' : '⭐ Needs Improvement'}
              </p>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Write your review (optional)
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the shoot? Share feedback on punctuality, reel creativity, direction, and speed..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
