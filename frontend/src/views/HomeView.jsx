import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Video, Camera, Scissors, Sparkles, Shirt, Radio, UserCheck, Star, Grid, Heart, ChevronDown, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { POPULAR_CITIES, PLATFORM_CATEGORIES, CATEGORY_LABELS, fetchCategories, fetchBanners } from '../api';
import CreatorCard from '../components/CreatorCard';
import { FEATURED_TOP_CREATORS } from '../data/featuredCreators';

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

export default function HomeView({ shooters = [], onNavigate, onSelectShooter, currentLocation = 'Bengaluru', onLocationChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState([]);
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

  const activeBanner = banners[0] || {
    badge_text: 'Your Creative Partner',
    title: 'Create Amazing Reels',
    subtitle: 'Find the best reel shooters, photographers & creators near you.',
    tagline_text: 'Your Story Our Creators',
    button_text: 'Book Now',
    button_action: 'search',
    category_slug: 'reel_shooter',
    image_display_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1600',
  };


  // Dynamically loaded categories with gradient & icon components
  const categoriesList = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      IconComp: ICON_MAP[cat.id] || Video,
      gradient: GRADIENT_MAP[cat.id] || 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30',
    }));
  }, [categories]);

  // Blend live shooters from backend with featured creators to ensure rich 8-card showcase
  const topRatedCreators = useMemo(() => {
    const liveList = Array.isArray(shooters) ? shooters : [];
    const combined = [...liveList];
    const existingIds = new Set(liveList.map((s) => String(s.id)));
    const existingNames = new Set(liveList.map((s) => (s.display_name || s.name || '').toLowerCase()));

    for (const feat of FEATURED_TOP_CREATORS) {
      if (!existingIds.has(String(feat.id)) && !existingNames.has((feat.display_name || '').toLowerCase())) {
        combined.push(feat);
      }
    }
    return combined.slice(0, 8);
  }, [shooters]);

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
    if (savedIds.includes(shooterId)) {
      setSavedIds(savedIds.filter((id) => id !== shooterId));
    } else {
      setSavedIds([...savedIds, shooterId]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      <div className="max-w-md mx-auto sm:max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-7">

        {/* 3. Featured Hero Card Banner (Configured & Uploaded by Admin) */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-10 lg:p-12 text-white shadow-2xl border border-slate-800/80 group">
          
          {/* Background Photography Backdrop Image (Managed & Uploaded by Admin) */}
          <div className="absolute inset-0 z-0">
            <img
              src={activeBanner.image_display_url || activeBanner.image_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1600'}
              alt={activeBanner.title || 'Frambit Banner'}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-xl">
              {/* Optional Teal Pill Badge (Admin Configurable) */}
              {activeBanner.badge_text && (
                <div>
                  <span className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-[11px] sm:text-xs px-3.5 py-1 rounded-full shadow-sm tracking-wide transition-colors">
                    {activeBanner.badge_text}
                  </span>
                </div>
              )}

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight font-sans">
                {activeBanner.title || 'Create Amazing Reels'}
              </h2>
              
              <p className="text-xs sm:text-sm lg:text-base text-slate-200 font-medium leading-relaxed max-w-md">
                {activeBanner.subtitle || 'Find the best reel shooters, photographers & creators near you.'}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(activeBanner.button_action || 'search', activeBanner.category_slug || 'reel_shooter')}
                  className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm px-6 sm:px-7 py-2.5 sm:py-3 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>{activeBanner.button_text || 'Book Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right-Hand Script Tagline Accent (e.g. 'Your Story Our Creators') */}
            {activeBanner.tagline_text && (
              <div className="hidden lg:block text-right pr-6 self-center select-none pointer-events-none">
                <div className="text-2xl xl:text-3xl font-serif italic text-purple-300/80 drop-shadow-md tracking-wider leading-snug rotate-[-3deg]">
                  {activeBanner.tagline_text}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Service Categories Sliding Row (Smooth Touch Drag / Swipe & Arrow Controls) */}
        <div className="relative pt-2 group/cat">
          {/* Left slide arrow button (Desktop / Tablet) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={slideCategoriesLeft}
              className="hidden sm:flex absolute -left-3 top-[36%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white shadow-md border border-slate-200/90 text-slate-700 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Slide Left"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Smooth Sliding Row Container */}
          <div
            ref={categoryScrollRef}
            className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2 -mx-4 sm:mx-0 px-4 sm:px-1 snap-x snap-mandatory select-none"
          >
            {categoriesList.map((cat) => {
              const Icon = cat.IconComp;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onNavigate('search', cat.id)}
                  className="w-20 sm:w-24 shrink-0 flex flex-col items-center group cursor-pointer snap-start focus:outline-none"
                >
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${cat.gradient} group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 transform active:scale-95 shadow-md`}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2] text-white" />
                  </div>
                  <span className="mt-2.5 text-[11px] sm:text-xs font-bold text-slate-800 text-center tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
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
              className="hidden sm:flex absolute -right-3 top-[36%] -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white shadow-md border border-slate-200/90 text-slate-700 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Slide Right"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* 5. Top Rated Creators Section Header & Cards Grid */}
        <div className="pt-3">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Top Rated Creators
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                <span className="text-amber-500 text-sm">👑</span>
                <span>Trusted by 10K+ happy clients</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('search', 'top_rated')}
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group transition-all cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Grid Layout (Exact match to user reference: 4 cols on desktop, 2 on tablet, 1 on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topRatedCreators.map((creator) => (
              <CreatorCard
                key={creator.id}
                shooter={creator}
                isSaved={savedIds.includes(creator.id)}
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

