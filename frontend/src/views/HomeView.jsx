import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Video, Camera, Scissors, Sparkles, Shirt, Radio, UserCheck, Star, Grid, Heart, ChevronDown, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { POPULAR_CITIES, PLATFORM_CATEGORIES, CATEGORY_LABELS, fetchCategories, fetchBanners } from '../api';
import CreatorCard from '../components/CreatorCard';


const ICON_MAP = {
  reel_shooter: Video,
  photographer: Camera,
  video_editor: Scissors,
  makeup_artist: Sparkles,
  stylist: Shirt,
  drone_pilot: Radio,
  content_creator: Star,
  model: UserCheck,
  model_talent: UserCheck,
};

const GRADIENT_MAP = {
  reel_shooter: 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25',
  photographer: 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25',
  video_editor: 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25',
  makeup_artist: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25',
  stylist: 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25',
  drone_pilot: 'bg-gradient-to-tr from-purple-500 via-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25',
  content_creator: 'bg-gradient-to-tr from-yellow-500 to-amber-600 text-white shadow-lg shadow-amber-500/25',
  model: 'bg-gradient-to-tr from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25',
  model_talent: 'bg-gradient-to-tr from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25',
};

export default function HomeView({
  shooters = [],
  savedIds = [],
  onToggleSave,
  onNavigate,
  onSelectShooter,
  currentLocation = 'Bengaluru',
  onLocationChange
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(PLATFORM_CATEGORIES);
  const [openFaqId, setOpenFaqId] = useState(1);
  const [banners, setBanners] = useState([]);

  // Load active categories directly from backend REST API
  useEffect(() => {
    fetchCategories().then((apiCats) => {
      if (Array.isArray(apiCats) && apiCats.length > 0) {
        const formatted = apiCats.map((c) => ({
          id: c.slug || String(c.id),
          label: c.name,
          iconEmoji: c.icon_emoji,
          title: c.name,
          description: c.description,
        }));
        setCategories(formatted);
      }
    });

    // Load admin-configured promotional banner from backend REST API
    fetchBanners().then((apiBanners) => {
      if (Array.isArray(apiBanners) && apiBanners.length > 0) {
        setBanners(apiBanners);
      }
    });
  }, []);

  const displayBanners = useMemo(() => {
    if (Array.isArray(banners) && banners.length > 0) {
      return banners;
    }
    return [{
      id: 'default',
      badge_text: 'Your Creative Partner',
      title: 'Create Amazing Reels',
      subtitle: 'Find the best reel shooters, photographers & creators near you.',
      tagline_text: 'Your Story Our Creators',
      button_text: 'Book Now',
      button_action: 'search',
      category_slug: 'reel_shooter',
      image_display_url: null,
    }];
  }, [banners]);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const bannerTouchStartX = useRef(null);

  // Auto-advance banner every 5 seconds when multiple banners exist and not hovered
  useEffect(() => {
    if (displayBanners.length <= 1 || isBannerPaused) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length, isBannerPaused]);

  // Keep index within bounds
  useEffect(() => {
    if (currentBannerIndex >= displayBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [displayBanners.length, currentBannerIndex]);

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % displayBanners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  const handleBannerTouchStart = (e) => {
    bannerTouchStartX.current = e.touches[0].clientX;
  };

  const handleBannerTouchEnd = (e) => {
    if (bannerTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = bannerTouchStartX.current - touchEndX;
    if (diff > 45) {
      nextBanner();
    } else if (diff < -45) {
      prevBanner();
    }
    bannerTouchStartX.current = null;
  };

  const activeBanner = displayBanners[currentBannerIndex] || displayBanners[0];


  // Dynamically loaded categories with gradient & icon components
  const categoriesList = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      IconComp: ICON_MAP[cat.id] || Video,
      gradient: GRADIENT_MAP[cat.id] || 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30',
    }));
  }, [categories]);

  const [creatorFilter, setCreatorFilter] = useState('top_rated');

  const getShooterDistance = (s) => {
    if (s.distance_km !== undefined && s.distance_km !== null) {
      const d = parseFloat(s.distance_km);
      if (!isNaN(d)) return d;
    }
    if (s.distance) {
      const match = String(s.distance).match(/[\d.]+/);
      if (match) {
        const d = parseFloat(match[0]);
        if (!isNaN(d)) return d;
      }
    }
    const seed = (typeof s.id === 'number' ? s.id : (s.id ? String(s.id).charCodeAt(0) : 7)) % 10;
    return Number((1.2 + (seed * 0.7)).toFixed(1));
  };

  const topRatedCreators = useMemo(() => {
    const liveList = Array.isArray(shooters) ? [...shooters] : [];

    // Deduplicate by ID to guarantee 100% key uniqueness
    const dedupeMap = new Map();
    liveList.forEach((s, idx) => {
      const key = s && (s.id !== undefined && s.id !== null) ? String(s.id) : `idx-${idx}`;
      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, s);
      }
    });
    const uniqueList = Array.from(dedupeMap.values());

    if (creatorFilter === 'nearest') {
      uniqueList.sort((a, b) => getShooterDistance(a) - getShooterDistance(b));
    } else {
      uniqueList.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return uniqueList.slice(0, 8);
  }, [shooters, creatorFilter]);

  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    checkCategoryScroll();
    const el = categoryScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkCategoryScroll, { passive: true });
      window.addEventListener('resize', checkCategoryScroll);
      return () => {
        el.removeEventListener('scroll', checkCategoryScroll);
        window.removeEventListener('resize', checkCategoryScroll);
      };
    }
  }, [categoriesList]);

  const slideCategoriesLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const slideCategoriesRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleToggleSave = (e, shooterId) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(shooterId);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 sm:py-6 space-y-6 sm:space-y-8">

        {/* 3. Featured Hero Card Banner (Sliding Carousel, Taller hero height, seamless flush with top nav, full bleed on mobile) */}
        <div
          className="-mx-4 sm:mx-0 rounded-none sm:rounded-3xl relative overflow-hidden bg-slate-950 min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex items-stretch text-white shadow-2xl border-b border-t-0 sm:border border-slate-800/80 group select-none"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
          onTouchStart={handleBannerTouchStart}
          onTouchEnd={handleBannerTouchEnd}
        >
          {/* Sliding Track */}
          <div
            className="flex transition-transform duration-700 ease-in-out w-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {displayBanners.map((banner, idx) => {
              const bgImage = banner.image_display_url || banner.image_url || null;
              return (
                <div
                  key={banner.id || idx}
                  className="w-full shrink-0 min-w-full relative py-10 px-6 sm:py-14 sm:px-10 lg:py-16 lg:px-12 flex items-center justify-between"
                >
                  {/* Background Photography Backdrop Image (Original 100% Quality) */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={bgImage}
                      alt={banner.title || 'Frambit Banner'}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                    />
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-6 w-full">
                    <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-xl">
                      {/* Optional Teal Pill Badge (Admin Configurable) */}
                      {banner.badge_text && (
                        <div>
                          <span className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-[11px] sm:text-xs px-3.5 py-1 rounded-full shadow-sm tracking-wide transition-colors">
                            {banner.badge_text}
                          </span>
                        </div>
                      )}

                      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight font-sans">
                        {banner.title || 'Create Amazing Reels'}
                      </h2>

                      <p className="text-xs sm:text-sm lg:text-base text-slate-200 font-medium leading-relaxed max-w-md">
                        {banner.subtitle || 'Find the best reel shooters, photographers & creators near you.'}
                      </p>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onNavigate(banner.button_action || 'search', banner.category_slug || 'reel_shooter')}
                          className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm px-6 sm:px-7 py-2.5 sm:py-3 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                        >
                          <span>{banner.button_text || 'Book Now'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Right-Hand Script Tagline Accent */}
                    {banner.tagline_text && (
                      <div className="hidden lg:block text-right pr-10 self-center select-none pointer-events-none">
                        <div className="text-2xl xl:text-3xl font-serif italic text-purple-300/80 drop-shadow-md tracking-wider leading-snug rotate-[-3deg]">
                          {banner.tagline_text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls: Arrows & Indicators (Only when 2+ banners exist) */}
          {displayBanners.length > 1 && (
            <>
              {/* Previous Banner Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevBanner();
                }}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Next Banner Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextBanner();
                }}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Bottom Pagination Dots / Pills */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {displayBanners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex(i);
                    }}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentBannerIndex
                        ? 'w-6 sm:w-7 bg-white shadow-sm'
                        : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4. Service Categories (Horizontal Flex Layout) */}
        <div className="relative pt-1 group/cat">
          {/* Left slide arrow button (Desktop / Tablet) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={slideCategoriesLeft}
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-200/90 text-slate-700 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Slide Left"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Horizontal Flex Categories Container */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-2 -mx-4 sm:mx-0 px-4 sm:px-1 select-none"
          >
            {categoriesList.map((cat) => {
              const Icon = cat.IconComp;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onNavigate('search', cat.id)}
                  className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl shadow-2xs hover:shadow-md transition-all group cursor-pointer focus:outline-none active:scale-95"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.gradient} group-hover:scale-105 transition-transform duration-200 shadow-xs shrink-0`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2] text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right slide arrow button (Desktop / Tablet) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={slideCategoriesRight}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-200/90 text-slate-700 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Slide Right"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* 5. Creators Section (Top Rated / Nearest) & Cards Grid */}
        <div className="pt-3">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {creatorFilter === 'nearest' ? 'Creators Nearest to You' : 'Top Rated Creators'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                {creatorFilter === 'nearest' ? (
                  <span>Sorted by closest proximity</span>
                ) : (
                  <span>Trusted by 10K+ happy clients</span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('search', creatorFilter === 'nearest' ? 'nearest' : 'top_rated')}
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group transition-all cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Toggle Filter Tabs (Clean text, no emojis) */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-0.5 select-none">
            <button
              type="button"
              onClick={() => setCreatorFilter('top_rated')}
              className={`flex items-center text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                creatorFilter === 'top_rated'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>Top Rated</span>
            </button>
            <button
              type="button"
              onClick={() => setCreatorFilter('nearest')}
              className={`flex items-center text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                creatorFilter === 'nearest'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>Nearest</span>
            </button>
          </div>

          {/* Grid Layout (Exact match to user reference: 4 cols on desktop, 2 on tablet, 1 on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topRatedCreators.map((creator, idx) => (
              <CreatorCard
                key={creator.id ? `top-creator-${creator.id}` : `top-creator-idx-${idx}`}
                shooter={creator}
                isSaved={savedIds.some((id) => String(id) === String(creator.id))}
                onToggleSave={handleToggleSave}
                onClick={() => {
                  onSelectShooter(creator);
                  onNavigate('shooter_profile');
                }}
              />
            ))}
          </div>
        </div>

        {/* 6. Frequently Asked Questions (FAQs) Section */}
        <div id="faqs-section" className="pt-6 pb-2 scroll-mt-24">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about booking top creators, shoot workflows, secure payments, and media delivery on Frambit.
            </p>
          </div>

          {/* Interactive Accordion List */}
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              {
                id: 1,
                tag: 'Booking',
                question: 'How does booking a creator on Frambit work?',
                answer: 'Booking is simple: browse verified creators across specialties like Reel Shooters, Photographers, Drone Pilots, and Stylists. Choose your preferred package or hourly rate, select an available date and time slot, and confirm your request. Once accepted, you can collaborate directly via Frambit chat.',
              },
              {
                id: 2,
                tag: 'Delivery',
                question: 'When and how will I receive my final videos and photos?',
                answer: 'Your creator will deliver both raw footage and fully edited 4K media directly to your Frambit dashboard under "Receive Media" within 24 to 48 hours of your shoot. You can review deliverables, download full-resolution master files, and request adjustments seamlessly.',
              },
              {
                id: 3,
                tag: 'Payments',
                question: 'What is Frambit’s payment and escrow safety policy?',
                answer: 'All payments are securely protected through our escrow system. Your payment is safely held until the shoot is completed and you confirm media delivery. If a creator cancels or cannot fulfill the booking, you are immediately issued a 100% full refund.',
              },
              {
                id: 4,
                tag: 'Collaboration',
                question: 'Can I chat and share moodboards with the creator before the shoot?',
                answer: 'Yes! Once you submit a booking inquiry or request, you have access to real-time 1-on-1 direct messaging. You can discuss creative vision, references, shoot locations, outfit choices, and specific audio or editing preferences.',
              },
              {
                id: 5,
                tag: 'Equipment',
                question: 'What gear and cameras do Frambit creators bring?',
                answer: 'Frambit creators are vetted professionals who bring cinema-grade 4K/6K gear (Sony FX3, A7S III, Canon R5), 3-axis gimbals (DJI RS3/RS4 Pro), wireless lavalier microphones (Rode/DJI Mic 2), portable lighting kits, and DGCA-certified drones where requested.',
              },
              {
                id: 6,
                tag: 'Cancellations',
                question: 'What if I need to cancel or reschedule my shoot slot?',
                answer: 'You can reschedule or cancel for free up to 24 hours prior to your shoot start time. If unexpected weather or schedule changes occur within 24 hours, you and your creator can mutually reschedule the shoot directly through chat with zero cancellation penalty.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen ? 'border-indigo-300 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {faq.tag}
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-600 text-white' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help & Contact Support Callout Banner */}
          <div className="max-w-3xl mx-auto mt-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-black text-white flex items-center justify-center sm:justify-start gap-2">
                <span>Still have questions?</span>
                <span className="text-xs font-semibold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-700/50">24/7 Support</span>
              </h4>
              <p className="text-xs text-slate-300 font-medium">
                Our creator concierge team is always here to assist with your bookings and shoots.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('chat_list')}
              className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md transition-all transform active:scale-95 cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Chat with Us</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

