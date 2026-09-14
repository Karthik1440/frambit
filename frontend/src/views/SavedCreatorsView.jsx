import React from 'react';
import { ArrowLeft, Star, MapPin, Heart, Calendar } from 'lucide-react';
import { MOCK_SHOOTERS } from '../api';

export default function SavedCreatorsView({ onNavigate, onSelectShooter, shooters = [] }) {
  const savedShooters = shooters;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Saved Creators</h1>
              <p className="text-xs text-slate-500 font-medium">{savedShooters.length} bookmarked creators</p>
            </div>
          </div>
        </div>

        {savedShooters.length === 0 && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <Heart className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Saved Creators Yet</h3>
            <p className="text-xs text-slate-400">Explore top creators on the home page and click the heart icon to bookmark your favorites.</p>
          </div>
        )}

        {/* Creator List */}
        <div className="space-y-4">
          {savedShooters.map((shooter) => (
            <div
              key={shooter.id}
              onClick={() => {
                if (onSelectShooter) onSelectShooter(shooter);
                onNavigate('shooter_profile');
              }}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative"
            >
              <img
                src={shooter.avatar}
                alt={shooter.display_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-100"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {shooter.display_name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Removed ${shooter.display_name} from saved creators`);
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-600 transition-transform hover:scale-110 shrink-0 cursor-pointer"
                    title="Remove from saved"
                  >
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-slate-800 font-bold">{shooter.rating}</span>
                    <span className="text-slate-400">({shooter.review_count})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{shooter.city}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-indigo-600">₹{shooter.hourly_price}/hr</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectShooter) onSelectShooter(shooter);
                      onNavigate('book_slot');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Shoot</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
