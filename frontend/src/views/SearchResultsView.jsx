import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Star, ArrowLeft, MapPin, Heart, ChevronDown, Play, Check } from 'lucide-react';
import { PLATFORM_CATEGORIES, CATEGORY_LABELS } from '../api';

const CATEGORY_OPTIONS = [
  ...PLATFORM_CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.iconEmoji })),
  { id: 'more', label: 'All Creators', icon: '🌐' },
];

export default function SearchResultsView({
  shooters = [],
  selectedCategory = 'reel_shooter',
  onSelectCategory,
  onNavigate,
  onSelectShooter,
  currentLocation = 'Bengaluru'
}) {
  const [searchTerm, setSearchTerm] = useState(CATEGORY_LABELS[selectedCategory] || 'Reel shooter');
  const [savedIds, setSavedIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const dropdownRef = useRef(null);

  // Sync searchTerm when selectedCategory changes externally
  useEffect(() => {
    if (selectedCategory && CATEGORY_LABELS[selectedCategory]) {
      setSearchTerm(CATEGORY_LABELS[selectedCategory]);
    }
  }, [selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSave = (e, shooterId) => {
    e.stopPropagation();
    if (savedIds.includes(shooterId)) {
      setSavedIds(savedIds.filter((id) => id !== shooterId));
    } else {
      setSavedIds([...savedIds, shooterId]);
    }
  };

  const handleCategorySelect = (catId, label) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    setSearchTerm(CATEGORY_LABELS[catId] || label);
    setDropdownOpen(false);
  };

  // Filter Shooters logic based on selectedCategory and searchTerm
  const filteredShooters = useMemo(() => {
    let result = [...shooters];

    // 1. Filter by category
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'more') {
      if (selectedCategory === 'top_rated') {
        result = result.filter((s) => s.rating >= 4.8);
      } else {
        result = result.filter((shooter) => {
          if (shooter.category) {
            return shooter.category === selectedCategory;
          }
          const titleLower = (shooter.title || '').toLowerCase();
          if (selectedCategory === 'reel_shooter') {
            return titleLower.includes('reel') || titleLower.includes('videographer');
          }
          if (selectedCategory === 'photographer') {
            return titleLower.includes('photographer');
          }
          if (selectedCategory === 'video_editor') {
            return titleLower.includes('editor');
          }
          if (selectedCategory === 'makeup_artist') {
            return titleLower.includes('makeup');
          }
          if (selectedCategory === 'stylist') {
            return titleLower.includes('stylist');
          }
          return true;
        });
      }
    }

    // 2. Filter by text search query if user types something custom
    const query = searchTerm.trim().toLowerCase();
    const activeLabel = (CATEGORY_LABELS[selectedCategory] || '').toLowerCase();
    
    if (
      query &&
      query !== activeLabel &&
      query !== 'reel shooter' &&
      query !== 'all creators' &&
      query !== 'top rated shooters'
    ) {
      result = result.filter(
        (s) =>
          s.display_name.toLowerCase().includes(query) ||
          (s.title && s.title.toLowerCase().includes(query)) ||
          (s.city && s.city.toLowerCase().includes(query)) ||
          (s.shooting_styles && s.shooting_styles.some((st) => st.toLowerCase().includes(query)))
      );
    }

    // 3. Filter by Active Quick Filter Pills
    if (activeFilter === 'Rating ▾') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (activeFilter === 'Price ▾') {
      result.sort((a, b) => a.hourly_price - b.hourly_price);
    }

    return result;
  }, [shooters, selectedCategory, searchTerm, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24 text-slate-800 animate-fade-in font-sans">
      <div className="max-w-md mx-auto sm:max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-4">

        {/* Top Header Bar with Back Button & Search/Category Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Go back home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Interactive Search Pill with Category Dropdown */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="w-full bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-full border border-slate-200/80 flex items-center justify-between shadow-2xs transition-all">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search creators or category..."
                  className="w-full bg-transparent text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none p-0 border-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-1 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
                title="Select Category"
              >
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Category Selector Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Select Category
                </div>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id, cat.label)}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-indigo-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Scroll Filter Pills Row (Location ▾, Price ▾, Rating ▾, Style ▾) */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {['Location ▾', 'Price ▾', 'Rating ▾', 'Style ▾'].map((filterLabel, idx) => {
            const isActive = activeFilter === filterLabel;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveFilter(isActive ? null : filterLabel)}
                className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-full border shadow-2xs shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
                }`}
              >
                <span>{filterLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Results Header Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Showing {filteredShooters.length} {filteredShooters.length === 1 ? 'creator' : 'creators'} for <strong className="text-slate-900 font-bold">"{CATEGORY_LABELS[selectedCategory] || searchTerm}"</strong></span>
        </div>

        {/* Creator Cards Grid (Exact design match to screenshot) */}
        {filteredShooters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {filteredShooters.map((shooter) => {
              const isSaved = savedIds.includes(shooter.id);
              const styles = (Array.isArray(shooter.shooting_styles) ? shooter.shooting_styles : []).filter(s => typeof s === 'string' && s.trim().length > 0);

              return (
                <div
                  key={shooter.id}
                  onClick={() => {
                    onSelectShooter(shooter);
                    onNavigate('shooter_profile');
                  }}
                  className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-start relative group"
                >
                  {/* Left: Photographer Image Card with Reel Badge */}
                  <div className="w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden shrink-0 bg-slate-100 relative shadow-2xs">
                    <img
                      src={shooter.cover_image || shooter.avatar || shooter.profile_image || shooter.user_profile?.profile_image || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg'}
                      alt={shooter.display_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Subtle Reel Play Icon Overlay */}
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white">
                      <Play className="w-3 h-3 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Right: Creator Information Details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    
                    {/* Name & Bookmark Heart Icon */}
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate font-sans">
                        {shooter.display_name || shooter.name || 'Creator'}
                      </h3>

                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, shooter.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                        title={isSaved ? "Remove from saved" : "Save shooter"}
                      >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      </button>
                    </div>

                    {/* Rating & Review Count */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 stroke-none" />
                      <span className="font-extrabold text-slate-900">{shooter.rating || '4.85'}</span>
                      <span className="text-slate-400 font-medium">({shooter.review_count !== undefined ? shooter.review_count : 0} reviews)</span>
                    </div>

                    {/* Location & Distance */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{shooter.area ? `${shooter.area}, ${shooter.city || 'Bengaluru'}` : (shooter.city || 'Bengaluru')}</span>
                    </div>

                    {/* Hourly Rate */}
                    <div className="text-sm sm:text-base font-black text-slate-900 mt-2 font-sans">
                      ₹{Math.round(Number(shooter.hourly_price || 799)).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-500">/ hour</span>
                    </div>

                    {/* Style Pills Tag Row */}
                    {styles.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        {styles.slice(0, 3).map((style, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200/50"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs my-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-900">No creators found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              We couldn't find any creators matching your search or selected filter. Try selecting another category or resetting filters.
            </p>
            <button
              type="button"
              onClick={() => handleCategorySelect('more', 'All Creators')}
              className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-indigo-700 transition-all cursor-pointer inline-block"
            >
              Show All Creators
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

