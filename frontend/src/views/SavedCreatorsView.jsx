import React from 'react';
import { ArrowLeft, Star, MapPin, Heart, Calendar, MessageSquare, Search, Sparkles } from 'lucide-react';

import { CATEGORY_LABELS } from '../api';

export default function SavedCreatorsView({
  savedIds = [],
  allShooters = [],
  onToggleSave,
  onNavigate,
  onSelectShooter,
  onStartChat
}) {
  // Combine live shooters with featured creators to ensure any saved creator can be displayed
  const combinedShooters = React.useMemo(() => {
    return Array.isArray(allShooters) ? allShooters : [];
  }, [allShooters]);

  // Filter only the saved creators
  const savedShooters = React.useMemo(() => {
    const idSet = new Set((savedIds || []).map((id) => String(id)));
    return combinedShooters.filter((s) => idSet.has(String(s.id)));
  }, [combinedShooters, savedIds]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Saved Creators
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {savedShooters.length} bookmarked {savedShooters.length === 1 ? 'creator' : 'creators'}
              </p>
            </div>
          </div>

          {savedShooters.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer hidden sm:block"
            >
              Explore More
            </button>
          )}
        </div>

        {/* Empty State */}
        {savedShooters.length === 0 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center space-y-4 shadow-2xs max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-xs">
              <Heart className="w-8 h-8 fill-rose-500/20 stroke-[2]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">No Saved Creators Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Click the heart icon on any creator's card across the platform to bookmark your favorite videographers and reel shooters here.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Explore Creators</span>
              </button>
            </div>
          </div>
        )}

        {/* Saved Creator Cards Grid */}
        {savedShooters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedShooters.map((shooter) => {
              const photoUrl = shooter.avatar || shooter.cover_image || shooter.profile_image || null;
              const price = Math.round(Number(shooter.hourly_price || 799)).toLocaleString('en-IN');
              const categoryLabel = CATEGORY_LABELS[shooter.category] || shooter.category || 'Reel Shooter';

              return (
                <div
                  key={shooter.id}
                  onClick={() => {
                    if (onSelectShooter) onSelectShooter(shooter);
                    onNavigate('shooter_profile');
                  }}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group relative"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={photoUrl}
                      alt={shooter.display_name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-100 group-hover:scale-102 transition-transform"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {shooter.display_name}
                          </h3>
                          <p className="text-[11px] font-bold text-indigo-600 truncate mt-0.5">
                            {shooter.title || categoryLabel}
                          </p>
                        </div>

                        {/* Unsave Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleSave) onToggleSave(shooter.id);
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-600 transition-transform hover:scale-115 active:scale-90 shrink-0 cursor-pointer"
                          title="Remove from saved"
                        >
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                        </button>
                      </div>

                      {/* Rating & Location Info */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="text-slate-800 font-extrabold">{shooter.rating || '4.9'}</span>
                          <span className="text-slate-400">({shooter.review_count || 12})</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{shooter.city || 'Bengaluru'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Direct Booking Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Rate</div>
                      <div className="text-sm font-black text-slate-900">
                        ₹{price} <span className="text-[10px] text-slate-500 font-medium">/ hr</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartChat) onStartChat(shooter);
                          else onNavigate('chat_list');
                        }}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                        title="Message Creator"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectShooter) onSelectShooter(shooter);
                          onNavigate('book_slot');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Shoot</span>
                      </button>
                    </div>
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
