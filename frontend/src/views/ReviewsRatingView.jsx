import React from 'react';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react';
import { deduplicateReviews } from '../api';

export default function ReviewsRatingView({ onNavigate, reviews = [], shooter = null }) {
  const cleanReviews = deduplicateReviews(reviews);
  const totalReviews = cleanReviews.length;
  const averageRating = totalReviews > 0
    ? (cleanReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / totalReviews).toFixed(1)
    : (shooter?.rating ? Number(shooter.rating).toFixed(1) : '5.0');

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = cleanReviews.filter((r) => Math.round(Number(r.rating || 5)) === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : (stars === 5 ? 100 : 0);
    return { stars, count, percentage };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Reviews & Rating</h1>
            <p className="text-xs text-slate-500 font-medium">Feedback from clients on completed shoot projects</p>
          </div>
        </div>

        {/* Aggregated Score Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="text-center sm:text-left sm:border-r border-slate-100 sm:pr-6">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">{averageRating}</div>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-400">{totalReviews} Client Ratings</p>
          </div>

          <div className="sm:col-span-2 space-y-2">
            {distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="w-3 shrink-0 text-slate-700">{item.stars}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-400 text-[11px]">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900">Client Feedback ({totalReviews})</h2>
            {totalReviews > 0 && (
              <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{averageRating} Average</span>
              </span>
            )}
          </div>
          {cleanReviews.length > 0 ? (
            cleanReviews.map((rev) => {
              const name = rev.customer_name || rev.client_name || 'Client';
              const avatar = rev.customer_avatar || rev.client_avatar || null;
              const date = rev.created_at
                ? (rev.created_at.includes('T') ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : rev.created_at)
                : rev.date || 'Recent';

              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{name}</h4>
                        <span className="text-[11px] text-slate-400">{date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(rev.rating || 5).toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400 font-semibold pt-1">
                    <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 text-center space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Reviews Received Yet</h3>
              <p className="text-xs text-slate-400">Feedback submitted by clients on completed shoots will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
