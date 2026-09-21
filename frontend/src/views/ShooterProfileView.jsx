import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Share2, Heart, Star, MapPin, Camera, Smartphone, Sparkles, Sliders, CheckCircle, Video, Play, Award, Globe, Calendar, ChevronLeft, ChevronRight, Package, MessageSquare, Check } from 'lucide-react';
import { CATEGORY_LABELS, fetchShooterById, fetchReviewsApi, deduplicateReviews } from '../api';
import { useAuth } from '../context/AuthContext';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function ShooterProfileView({
  shooter: shooterProp,
  onNavigate,
  onStartBooking,
  onStartChat,
  reviews: reviewsProp = [],
  savedIds = [],
  onToggleSave
}) {
  const { userRole } = useAuth();
  const [shooter, setShooter] = useState(shooterProp);
  const isFavorite = savedIds.some((id) => String(id) === String(shooter.id));
  const [activeTab, setActiveTab] = useState('about');
  const [reviews, setReviews] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateReviews(parsed);
      }
    } catch (e) {}
    return Array.isArray(reviewsProp) ? deduplicateReviews(reviewsProp) : [];
  });

  useEffect(() => {
    setShooter(shooterProp);
    if (shooterProp && shooterProp.id) {
      fetchShooterById(shooterProp.id).then((fresh) => {
        if (fresh) {
          setShooter((prev) => ({ ...prev, ...fresh }));
        }
      });
      // Also fetch reviews for this creator from backend API
      fetchReviewsApi(shooterProp.id).then((apiReviews) => {
        if (Array.isArray(apiReviews)) {
          setReviews((prev) => deduplicateReviews([...apiReviews, ...prev]));
        }
      });
    }
  }, [shooterProp?.id]);

  useEffect(() => {
    if (Array.isArray(reviewsProp) && reviewsProp.length > 0) {
      setReviews((prev) => deduplicateReviews([...reviewsProp, ...prev]));
    }
  }, [reviewsProp]);

  // Horizontal scroll handling for shoot packages
  const packagesScrollRef = useRef(null);
  const [canScrollPackagesLeft, setCanScrollPackagesLeft] = useState(false);
  const [canScrollPackagesRight, setCanScrollPackagesRight] = useState(false);
  // Creators see all packages in full grid; clients see horizontal scroll by default with 'See All' toggle
  const [showAllPackages, setShowAllPackages] = useState(userRole === 'creator');

  const checkPackagesScroll = () => {
    if (packagesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = packagesScrollRef.current;
      setCanScrollPackagesLeft(scrollLeft > 6);
      setCanScrollPackagesRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkPackagesScroll();
    const el = packagesScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkPackagesScroll, { passive: true });
      window.addEventListener('resize', checkPackagesScroll);
      return () => {
        el.removeEventListener('scroll', checkPackagesScroll);
        window.removeEventListener('resize', checkPackagesScroll);
      };
    }
  }, [shooter?.packages]);

  const slidePackagesLeft = () => {
    if (packagesScrollRef.current) {
      packagesScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const slidePackagesRight = () => {
    if (packagesScrollRef.current) {
      packagesScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  if (!shooter) return null;

  // Filter verified reviews for this specific creator and ensure deduplicated
  const currentShooterId = String(shooter.id || '');
  const creatorReviews = useMemo(() => {
    const matched = reviews.filter((r) => {
      if (!r) return false;
      const rShooterId = String(r.shooter_id || r.shooter || r.shooterId || '');
      if (rShooterId && currentShooterId) {
        return rShooterId === currentShooterId;
      }
      return false;
    });
    return deduplicateReviews(matched);
  }, [reviews, currentShooterId]);

  // Calculate live average rating and review count in real-time
  const liveReviewCount = creatorReviews.length > 0
    ? creatorReviews.length
    : (shooter.review_count !== undefined && shooter.review_count !== null ? Number(shooter.review_count) : 0);

  const liveRating = creatorReviews.length > 0
    ? (creatorReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / creatorReviews.length).toFixed(1)
    : (shooter.rating && Number(shooter.rating) > 0 ? Number(shooter.rating).toFixed(1) : '5.0');

  // Star breakdown (5 down to 1)
  const starBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = creatorReviews.filter((r) => Math.round(Number(r.rating || 5)) === star).length;
    const pct = creatorReviews.length > 0 ? Math.round((count / creatorReviews.length) * 100) : (star === 5 ? 100 : 0);
    return { star, count, pct };
  });

  const displayPackages = (Array.isArray(shooter?.packages) && shooter.packages.length > 0)
    ? shooter.packages
    : (Array.isArray(shooter?.packages_list) && shooter.packages_list.length > 0 ? shooter.packages_list : []);

  const displayPortfolio = (Array.isArray(shooter?.portfolio) && shooter.portfolio.length > 0)
    ? shooter.portfolio
    : (Array.isArray(shooter?.portfolio_photos) && shooter.portfolio_photos.length > 0 ? shooter.portfolio_photos : []);

  const rawEquipment = Array.isArray(shooter.equipment)
    ? shooter.equipment
    : (typeof shooter.equipment === 'string' && shooter.equipment.trim() ? shooter.equipment.split(',').map(s => s.trim()) : null);

  const equipmentList = (rawEquipment && rawEquipment.length > 0)
    ? rawEquipment.filter(Boolean)
    : [];

  const shootingStyles = (Array.isArray(shooter.shooting_styles)
    ? shooter.shooting_styles
    : (typeof shooter.shooting_styles === 'string' && shooter.shooting_styles.trim() ? shooter.shooting_styles.split(',').map(s => s.trim()) : [])
  ).filter(s => typeof s === 'string' && s.trim().length > 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shooter.display_name,
        text: `Check out ${shooter.display_name}'s profile on Frambit!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      
      {/* Container: Single column on Mobile, 2-Column Grid on Desktop */}
      <div className="max-w-md mx-auto sm:max-w-6xl px-0 sm:px-6 lg:px-8 sm:py-6">
        
        {/* Main Card Wrapper */}
        <div className="bg-white sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg">
          
          {/* Top Hero Cover Header Image with Action Buttons Overlay */}
          <div className="relative h-64 sm:h-80 w-full bg-slate-950 group">
            <img
              src={shooter.cover_image || shooter.avatar}
              alt={shooter.display_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-slate-950/40" />

            {/* Top Bar Floating Buttons Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              {/* Back Arrow */}
              <button
                type="button"
                onClick={() => onNavigate(userRole === 'creator' ? 'dashboard' : 'search')}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-md hover:bg-white transition-all cursor-pointer"
                title={userRole === 'creator' ? "Back to Creator Dashboard" : "Go back"}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Top Right Action Icons (Heart Bookmark + Share) */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleSave && onToggleSave(shooter.id)}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-md hover:bg-white transition-all cursor-pointer active:scale-90"
                  title={isFavorite ? "Remove from saved" : "Save shooter"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-md hover:bg-white transition-all cursor-pointer"
                  title="Share profile"
                >
                  <Share2 className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content Container */}
          <div className="p-5 sm:p-8 lg:p-10">
            
            {/* Desktop Two-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Main Info & Specs (7 cols on desktop) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Creator Name & Title */}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                      {shooter.display_name}
                    </h1>
                    {shooter.is_verified && (
                      <CheckCircle className="w-5 h-5 text-indigo-600 fill-indigo-600 text-white shrink-0" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-indigo-600 mt-0.5">
                    {shooter.title || (shooter.category ? (CATEGORY_LABELS[shooter.category] || shooter.category) : 'Reel Shooter & Videographer')}
                  </p>
                  
                  {/* Rating, Reviews & Bookings Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-2 font-semibold flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 stroke-none" />
                      <span className="font-extrabold text-slate-900">{liveRating}</span>
                      <span className="text-slate-500 font-medium">({liveReviewCount} reviews)</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">{shooter.total_bookings !== undefined ? shooter.total_bookings : 0} bookings</span>
                  </div>

                  {/* Location & Distance */}
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1.5 font-medium flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{shooter.area ? `${shooter.area}, ${shooter.city || 'Bengaluru'}` : (shooter.city || 'Bengaluru')} • {shooter.distance_km || 5} km</span>
                    </div>

                    {(() => {
                      const raw = shooter.instagram_handle || shooter.instagram || shooter.instagram_id || '';
                      const clean = String(raw)
                        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
                        .replace(/^@/, '')
                        .replace(/\/+$/, '')
                        .trim();
                      if (!clean) return null;
                      return (
                        <a
                          id="creator-instagram-link"
                          href={`https://instagram.com/${clean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white text-xs font-extrabold rounded-full shadow-xs hover:shadow-md transition-all hover:scale-105 cursor-pointer"
                          title={`View @${clean} on Instagram`}
                        >
                          <InstagramIcon className="w-3.5 h-3.5 text-white" />
                          <span>@{clean}</span>
                        </a>
                      );
                    })()}
                  </div>

                  {/* Price Rate */}
                  <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 font-sans">
                    ₹{Math.round(Number(shooter.hourly_price || 799)).toLocaleString('en-IN')} <span className="text-xs sm:text-sm font-semibold text-slate-500">/ hour</span>
                  </div>
                </div>

                {/* 2. Equipment Pills Row (Matches Screenshot Pill Badges) */}
                {/* 2. Equipment Pills Row */}
                {equipmentList.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {equipmentList.map((eq, idx) => {
                        const IconComp = typeof eq === 'object' && eq.icon ? eq.icon : Camera;
                        const labelText = typeof eq === 'object' ? eq.label : eq;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-full border border-slate-200/60 shadow-2xs"
                          >
                            <IconComp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{labelText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. About Section */}
                <div className="pt-2 space-y-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                    About
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {shooter.bio || `Hi! I'm ${shooter.display_name.split(' ')[0]}, a passionate creator based in ${shooter.city || 'Bengaluru'}.`}
                  </p>
                </div>

                {/* Creator Mode: Direct Client Messages Access Banner */}
                {userRole === 'creator' && (
                  <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 rounded-3xl p-4 sm:p-5 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">Client Inquiries & Chat Messages</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Coordinate with clients who messaged your creator profile</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('chat_list')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span>Open Messages Inbox</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 4. Shooting Styles Section */}
                {shootingStyles.length > 0 && (
                  <div className="pt-2 space-y-2.5">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                      Shooting Styles
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {shootingStyles.map((style, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-full border border-slate-200/70"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Services & Custom Rates (edited by creator) */}
                {(shooter.services_list || shooter.services) && Array.isArray(shooter.services_list || shooter.services) && (shooter.services_list || shooter.services).length > 0 && (
                  <div className="pt-2 space-y-2.5">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                      Individual Services & Rates
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(shooter.services_list || shooter.services).map((srv, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between shadow-2xs">
                          <span className="text-xs font-extrabold text-slate-800">
                            {typeof srv === 'object' ? srv.name : srv}
                          </span>
                          {typeof srv === 'object' && srv.price && (
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50/90 px-3 py-1 rounded-full border border-indigo-100/90">
                              ₹{Number(srv.price).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Shoot Packages & Bundles Section (Supports Horizontal Scroll for Users & All Packages Grid for Creators) */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                        Shoot Packages & Services
                      </h2>
                      <span className="text-xs font-bold text-indigo-600">Fixed Package Rates</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* See All / Horizontal View Toggle */}
                      {shooter?.packages && shooter.packages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllPackages((prev) => !prev)}
                          className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-100 transition-all cursor-pointer"
                        >
                          {showAllPackages ? 'Scroll View' : `See All (${shooter.packages.length})`}
                        </button>
                      )}

                      {/* Creator direct manage button */}
                      {userRole === 'creator' && (
                        <button
                          type="button"
                          onClick={() => onNavigate && onNavigate('services_pricing')}
                          className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
                        >
                          + Add / Edit
                        </button>
                      )}

                      {/* Scroll arrows when in horizontal view */}
                      {!showAllPackages && displayPackages && displayPackages.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={slidePackagesLeft}
                            disabled={!canScrollPackagesLeft}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                              canScrollPackagesLeft
                                ? 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs'
                                : 'border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                            }`}
                            aria-label="Previous Package"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={slidePackagesRight}
                            disabled={!canScrollPackagesRight}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                              canScrollPackagesRight
                                ? 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs'
                                : 'border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                            }`}
                            aria-label="Next Package"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {displayPackages && displayPackages.length > 0 ? (
                    <div
                      ref={packagesScrollRef}
                      className={
                        showAllPackages
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1"
                          : "flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
                      }
                    >
                      {displayPackages.map((pkg) => (
                        <div
                          key={pkg.id || pkg.title}
                          onClick={() => {
                            if (userRole === 'creator') {
                              if (onNavigate) onNavigate('services_pricing');
                            } else {
                              onStartBooking(shooter, pkg);
                            }
                          }}
                          className={`${
                            showAllPackages ? 'w-full' : 'w-[260px] sm:w-[280px] shrink-0 snap-start'
                          } bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col justify-between group`}
                        >
                          {/* Top Cover Image Banner with Popular Badge Overlay */}
                          <div className="relative h-32 w-full bg-slate-900 overflow-hidden shrink-0">
                            {pkg.cover_image || shooter.cover_image || shooter.avatar ? (
                              <img
                                src={pkg.cover_image || shooter.cover_image || shooter.avatar}
                                alt={pkg.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5
                                ${ {'reel_shooter':'bg-gradient-to-br from-indigo-600 to-purple-700',
                                    'photographer':'bg-gradient-to-br from-emerald-500 to-teal-700',
                                    'video_editor':'bg-gradient-to-br from-rose-500 to-pink-700',
                                    'drone_pilot':'bg-gradient-to-br from-violet-600 to-indigo-800',
                                    'makeup_artist':'bg-gradient-to-br from-amber-500 to-orange-600',
                                    'stylist':'bg-gradient-to-br from-sky-500 to-cyan-700',
                                    'content_creator':'bg-gradient-to-br from-yellow-500 to-amber-600',
                                    'model':'bg-gradient-to-br from-fuchsia-500 to-pink-700',
                                   }[shooter.category] || 'bg-gradient-to-br from-slate-700 to-slate-900'
                                }`}>
                                <span className="text-3xl leading-none select-none">{pkg.icon || '🎥'}</span>
                                <span className="text-white text-[11px] font-extrabold tracking-wide opacity-80 px-3 text-center leading-snug">{pkg.title}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/20" />
                            {pkg.popular && (
                              <span className="absolute top-3 left-3 bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Popular</span>
                              </span>
                            )}
                          </div>

                          {/* Card Body Content */}
                          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 font-sans tracking-tight leading-snug">
                                {pkg.title}
                              </h3>
                              <div className="text-lg sm:text-xl font-black text-indigo-600 mt-1">
                                ₹{typeof pkg.price === 'number' ? pkg.price.toLocaleString('en-IN') : pkg.price}
                              </div>

                              {/* Deliverables List with Clean Icons (No Emoji) */}
                              <div className="space-y-1.5 text-xs font-semibold text-slate-600 mt-3 pt-3 border-t border-slate-100">
                                {(pkg.deliverablesList || [
                                  pkg.reelsCount,
                                  pkg.photosCount,
                                  pkg.duration,
                                  pkg.editing,
                                  pkg.revisions,
                                  pkg.turnaround
                                ].filter(Boolean)).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-slate-600">
                                    <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span className="font-medium text-xs text-slate-700">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {userRole === 'creator' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNavigate) onNavigate('services_pricing');
                                }}
                                className="w-full py-2.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-indigo-200 text-xs font-extrabold rounded-2xl transition-all cursor-pointer text-center mt-3 shadow-2xs"
                              >
                                Manage Package
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartBooking(shooter, pkg);
                                }}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold rounded-2xl transition-all cursor-pointer text-center mt-3 shadow-md shadow-indigo-600/20"
                              >
                                Book Package
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 space-y-2">
                      <Package className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Custom Shoot Packages Added Yet</p>
                      <p className="text-xs text-slate-400">Standard hourly rate applies: ₹{shooter.hourly_price || shooter.price_per_hour || 799}/hr</p>
                    </div>
                  )}
                </div>

                {/* 6. Experience & Languages Specs Grid */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-center space-y-1">
                    <Award className="w-4 h-4 text-indigo-600 mx-auto" />
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Experience</div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {shooter.experience || (shooter.experience_years ? `${shooter.experience_years}+ Years` : '5+ Years')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-center space-y-1">
                    <Globe className="w-4 h-4 text-indigo-600 mx-auto" />
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Languages</div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">{shooter.languages || 'English, Hindi'}</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-center space-y-1">
                    <Calendar className="w-4 h-4 text-indigo-600 mx-auto" />
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Availability</div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">{shooter.availability_summary || 'Mon - Sun'}</div>
                  </div>
                </div>

                {/* 7. Client Reviews & Ratings Section (Realtime Visible) */}
                <div className="pt-6 border-t border-slate-200/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-slate-900">
                        Client Reviews & Ratings
                      </h2>
                      <span className="bg-indigo-50 text-indigo-600 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {liveReviewCount}
                      </span>
                    </div>
                    {creatorReviews.length > 0 && (
                      <div className="flex items-center gap-1 text-xs font-extrabold text-amber-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{liveRating} out of 5</span>
                      </div>
                    )}
                  </div>

                  {/* Aggregated Score Breakdown Card */}
                  <div className="bg-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-5 text-center sm:text-left sm:border-r border-slate-200/80 sm:pr-5 space-y-1.5">
                      <div className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">
                        {liveRating}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const numRating = Number(liveRating);
                          const isFull = s <= Math.floor(numRating);
                          const isHalf = !isFull && s <= Math.ceil(numRating);
                          return (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                isFull
                                  ? 'fill-amber-400 text-amber-400'
                                  : isHalf
                                  ? 'fill-amber-400/50 text-amber-400'
                                  : 'text-slate-300 fill-slate-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs font-semibold text-slate-500">
                        Based on {liveReviewCount} verified client rating{liveReviewCount === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="sm:col-span-7 space-y-1.5">
                      {starBreakdown.map((item) => (
                        <div key={item.star} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <span className="w-3 shrink-0 text-slate-700">{item.star}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-slate-400 text-[11px] font-semibold">
                            {item.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews List */}
                  {creatorReviews.length > 0 ? (
                    <div className="space-y-3.5">
                      {creatorReviews.map((rev, idx) => {
                        const clientName = rev.customer_name || rev.client_name || rev.name || 'Verified Client';
                        const clientAvatar = rev.customer_avatar || rev.client_avatar || rev.avatar;
                        const formattedDate = rev.created_at
                          ? (rev.created_at.includes('T') ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : rev.created_at)
                          : 'Recent';
                        const commentText = rev.comment || 'Great experience!';
                        const ratingNum = Number(rev.rating || 5);

                        return (
                          <div
                            key={rev.id || idx}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {clientAvatar ? (
                                  <img
                                    src={clientAvatar}
                                    alt={clientName}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm border border-indigo-200 shrink-0">
                                    {clientName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                      {clientName}
                                    </h4>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                      <CheckCircle className="w-2.5 h-2.5" />
                                      Verified
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {formattedDate}
                                  </span>
                                </div>
                              </div>

                              {/* Star badge */}
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{ratingNum.toFixed(1)}</span>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                              "{commentText}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 space-y-2">
                      <Star className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Reviews Yet</p>
                      <p className="text-[11px] text-slate-400">
                        Be the first client to book and review {shooter.display_name}!
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Portfolio Preview & Booking CTA Box (5 cols on desktop) */}
              <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
                
                {/* Pricing & Booking CTA Box (scrolls with page content) */}
                <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</div>
                      <div className="text-2xl font-black text-slate-900">
                        ₹{Math.round(Number(shooter.hourly_price || 799)).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">/ hour</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                      Available Today
                    </div>
                  </div>

                  {/* Action Buttons: Message & Book Now */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {userRole === 'creator' ? (
                      <button
                        id="profile-inquiries-btn"
                        type="button"
                        onClick={() => onNavigate && onNavigate('chat_list')}
                        className="py-3.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-2xl border border-indigo-200 transition-all text-xs tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        title="View client messages and inquiries"
                      >
                        <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Client Messages</span>
                      </button>
                    ) : (
                      <button
                        id="profile-message-btn"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onStartChat) {
                            onStartChat(shooter);
                          } else if (onNavigate) {
                            onNavigate('chat_list');
                          }
                        }}
                        className="py-3.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border border-slate-300 transition-all text-xs tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Message</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onStartBooking(shooter)}
                      className="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/30 transition-all text-xs tracking-wide cursor-pointer text-center"
                    >
                      Book Now
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center font-semibold">
                    ⚡ Instant booking confirmation • Safe & secure payment
                  </p>
                </div>

                {/* Featured Reel / Portfolio Gallery Preview */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Recent Portfolio Work</h3>
                    <button
                      type="button"
                      onClick={() => onNavigate('portfolio')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {displayPortfolio && displayPortfolio.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {displayPortfolio.slice(0, 6).map((item) => (
                        <div
                          key={item.id || item.title}
                          onClick={() => onNavigate('portfolio')}
                          className="relative aspect-[4/5] rounded-2xl overflow-hidden group border border-slate-200/60 shadow-2xs cursor-pointer"
                        >
                          <img
                            src={item.image_url || item.thumbnail || item.url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                            <span className="truncate max-w-[110px]">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-5 text-center border border-slate-200/80 space-y-1">
                      <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Portfolio Photos Added Yet</p>
                      <p className="text-[11px] text-slate-400">This creator hasn't uploaded portfolio photos yet.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


    </div>
  );
}
