import React from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import { CATEGORY_LABELS } from '../api';

const CATEGORY_COLOR_MAP = {
  reel_shooter: 'bg-indigo-600',
  photographer: 'bg-emerald-600',
  video_editor: 'bg-rose-600',
  makeup_artist: 'bg-orange-500',
  drone_pilot: 'bg-violet-600',
  stylist: 'bg-sky-500',
  content_creator: 'bg-amber-500',
  model: 'bg-pink-600',
  model_talent: 'bg-pink-600',
};

const CATEGORY_BADGE_LABELS = {
  reel_shooter: 'REEL SHOOTER',
  photographer: 'PHOTOGRAPHER',
  video_editor: 'VIDEO EDITOR',
  makeup_artist: 'MAKEUP ARTIST',
  drone_pilot: 'DRONE PILOT',
  stylist: 'STYLIST',
  content_creator: 'CONTENT CREATOR',
  model: 'MODEL',
  model_talent: 'TALENT',
};

// Official Twitter/Instagram-style scalloped verified badge
export function VerifiedBadge({ className = "w-4 h-4 text-blue-500 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.6 2.25A2.25 2.25 0 0 0 6.66 3.6l-.77 1.87a2.25 2.25 0 0 1-1.22 1.22l-1.87.77a2.25 2.25 0 0 0-1.35 1.94v2.03a2.25 2.25 0 0 0 .54 1.45l1.37 1.54a2.25 2.25 0 0 1 .47 1.66l-.3 2a2.25 2.25 0 0 0 1.05 2.06l1.78 1a2.25 2.25 0 0 1 1.08 1.34l.58 1.95a2.25 2.25 0 0 0 1.83 1.57h2.04a2.25 2.25 0 0 0 1.83-1.57l.58-1.95a2.25 2.25 0 0 1 1.08-1.34l1.78-1a2.25 2.25 0 0 0 1.05-2.06l-.3-2a2.25 2.25 0 0 1 .47-1.66l1.37-1.54a2.25 2.25 0 0 0 .54-1.45v-2.03a2.25 2.25 0 0 0-1.35-1.94l-1.87-.77a2.25 2.25 0 0 1-1.22-1.22l-.77-1.87a2.25 2.25 0 0 0-1.94-1.35H8.6zm5.82 7.03a.75.75 0 0 0-1.06-1.06L9.75 11.83l-1.61-1.61a.75.75 0 0 0-1.06 1.06l2.14 2.14a.75.75 0 0 0 1.06 0l4.14-4.14z"
      />
    </svg>
  );
}

export default function CreatorCard({ shooter, isSaved = false, onToggleSave, onClick }) {
  if (!shooter) return null;

  const categoryKey = (shooter.category || 'reel_shooter').toLowerCase().replace(/\s+/g, '_');
  const badgeColor = shooter.category_color || CATEGORY_COLOR_MAP[categoryKey] || 'bg-indigo-600';
  const badgeText = shooter.category_label || CATEGORY_BADGE_LABELS[categoryKey] || CATEGORY_LABELS[categoryKey] || 'CREATOR';
  
  const ratingNum = Number(shooter.rating || 0);
  const reviewCount = (shooter.review_count !== undefined && shooter.review_count !== null)
    ? Number(shooter.review_count)
    : 0;
  const ratingValue = ratingNum > 0 ? ratingNum.toFixed(1) : (reviewCount > 0 ? '5.0' : '5.0');
  
  const priceDisplay = shooter.price_formatted || (shooter.hourly_price ? `₹${Math.round(Number(shooter.hourly_price)).toLocaleString('en-IN')}+` : '₹2,500+');
  const priceUnit = shooter.price_unit || (shooter.category === 'video_editor' ? 'per project' : 'per shoot');

  const locationDisplay = shooter.distance 
    ? `${shooter.city || 'Bengaluru'} • ${shooter.distance}`
    : (shooter.area ? `${shooter.area}, ${shooter.city || 'Bengaluru'}` : `${shooter.city || 'Bengaluru'} • 3.5 km`);

  const imageUrl = shooter.cover_image || shooter.avatar || shooter.profile_image || shooter.user_profile?.profile_image || null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group select-none"
    >
      {/* Top Image Box */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 mb-3">
        <img
          src={imageUrl}
          alt={shooter.display_name || shooter.name || 'Creator'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top-Left Category Pill Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`${badgeColor} text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md inline-block leading-none`}>
            {badgeText}
          </span>
        </div>

        {/* Top-Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSave) onToggleSave(e, shooter.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-xs flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
          title={isSaved ? "Remove from saved" : "Save creator"}
        >
          <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-white stroke-[2.2]'}`} />
        </button>

        {/* Bottom-Left Rating Overlay Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/65 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400 stroke-none" />
          <span>{ratingValue}</span>
          <span className="text-slate-300 font-normal">({reviewCount})</span>
        </div>
      </div>

      {/* Card Details Below Image */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Name & Blue Verified Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate leading-snug">
              {shooter.display_name || shooter.name || 'Creator'}
            </h3>
            <VerifiedBadge className="w-4 h-4 text-blue-500 shrink-0" />
          </div>

          {/* Specialty / Subtitle */}
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5 leading-snug">
            {shooter.title || (shooter.category && CATEGORY_LABELS[shooter.category]) || 'Reel Shooter & Videographer'}
          </p>
        </div>

        {/* Bottom Metadata: Location & Price */}
        <div className="flex items-end justify-between text-xs mt-3 pt-2.5 border-t border-slate-100/90 gap-2">
          {/* Location & Distance */}
          <div className="flex items-center gap-1 text-slate-500 min-w-0 flex-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 stroke-[2.2]" />
            <span className="truncate text-[11px] sm:text-xs font-medium text-slate-500">
              {locationDisplay}
            </span>
          </div>

          {/* Pricing & Unit */}
          <div className="text-right shrink-0">
            <span className="block text-sm sm:text-base font-black text-slate-900 leading-none">
              {priceDisplay}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
              {priceUnit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
