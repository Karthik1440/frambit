import React, { useState } from 'react';
import { Play, Sparkles, User, Camera, ShieldCheck, CheckCircle2, Star, Calendar, Heart, Award, ArrowRight, ExternalLink } from 'lucide-react';
import SplashView from './SplashView';
import RoleSelectionView from './RoleSelectionView';
import HomeView from './HomeView';
import SearchResultsView from './SearchResultsView';
import ShooterProfileView from './ShooterProfileView';
import BookSlotView from './BookSlotView';
import BookingStatusView from './BookingStatusView';
import MyBookingsView from './MyBookingsView';
import PortfolioVideosView from './PortfolioVideosView';
import SavedCreatorsView from './SavedCreatorsView';
import RateExperienceView from './RateExperienceView';
import ClientProfileView from './ClientProfileView';
import AuthModalView from './AuthModalView';
import ShooterDashboardView from './ShooterDashboardView';
import EditProfileView from './EditProfileView';
import AvailabilityView from './AvailabilityView';
import BookingRequestsView from './BookingRequestsView';
import ReviewsRatingView from './ReviewsRatingView';

// Blueprint-only empty placeholders (no mock data)
const MOCK_SHOOTERS = [];
const MOCK_PORTFOLIO_VIDEOS = [];

export default function BlueprintCanvasView({ onNavigate, onSelectShooter }) {
  const [activeModalScreen, setActiveModalScreen] = useState(null);

  const clientScreens = [
    { id: 'splash', number: 1, title: 'Splash / Welcome', component: <SplashView onNavigate={onNavigate} /> },
    { id: 'role_selection', number: 2, title: 'Role Selection', component: <RoleSelectionView onNavigate={onNavigate} /> },
    { id: 'home', number: 3, title: 'Home', component: <HomeView shooters={MOCK_SHOOTERS} onNavigate={onNavigate} onSelectShooter={onSelectShooter} /> },
    { id: 'search', number: 4, title: 'Search & Filters', component: <SearchResultsView shooters={MOCK_SHOOTERS} onNavigate={onNavigate} onSelectShooter={onSelectShooter} /> },
    { id: 'shooter_profile', number: 5, title: 'Creator Profile', component: <ShooterProfileView shooter={MOCK_SHOOTERS[0]} onNavigate={onNavigate} /> },
    { id: 'book_slot', number: 6, title: 'Book a Shoot', component: <BookSlotView shooter={MOCK_SHOOTERS[0]} onNavigate={onNavigate} /> },
    { id: 'confirmation', number: 7, title: 'Booking Confirmed', component: <BookingStatusView booking={null} onNavigate={onNavigate} /> },
    { id: 'my_bookings', number: 8, title: 'My Bookings', component: <MyBookingsView onNavigate={onNavigate} /> },
    { id: 'portfolio', number: 9, title: 'Portfolio', component: <PortfolioVideosView videos={MOCK_PORTFOLIO_VIDEOS} onNavigate={onNavigate} /> },
    { id: 'saved', number: 10, title: 'Saved Creators', component: <SavedCreatorsView onNavigate={onNavigate} /> },
    { id: 'review_rating', number: 11, title: 'Review & Rating', component: <RateExperienceView onNavigate={onNavigate} /> },
    { id: 'client_profile', number: 12, title: 'Profile', component: <ClientProfileView onNavigate={onNavigate} /> },
  ];

  const creatorScreens = [
    { id: 'creator_login', number: 1, title: 'Login / Signup', component: <AuthModalView initialMode="login" onNavigate={onNavigate} /> },
    { id: 'dashboard', number: 2, title: 'Creator Dashboard', component: <ShooterDashboardView onNavigate={onNavigate} /> },
    { id: 'profile_edit', number: 3, title: 'Profile Setup / Edit', component: <EditProfileView onNavigate={onNavigate} /> },
    { id: 'portfolio', number: 4, title: 'Portfolio', component: <PortfolioVideosView videos={MOCK_PORTFOLIO_VIDEOS} onNavigate={onNavigate} /> },
    { id: 'availability', number: 5, title: 'Availability', component: <AvailabilityView onNavigate={onNavigate} /> },
    { id: 'booking_requests', number: 6, title: 'Booking Requests', component: <BookingRequestsView onNavigate={onNavigate} /> },
    { id: 'reviews_rating', number: 7, title: 'Reviews & Rating', component: <ReviewsRatingView onNavigate={onNavigate} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-2 sm:px-6 lg:px-12 text-slate-900 font-sans">
      
      {/* Top Banner (Exact match to diagram header) */}
      <header className="max-w-7xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/90 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Reel Shooter</h1>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                Official UI Design Specification Blueprint
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Professional Creators for Your Special Moments
            </p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Photographers</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
            <Play className="w-4 h-4 text-indigo-600" />
            <span>Videographers</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Editors</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Designers</span>
          </div>
        </div>

        <div className="hidden xl:block text-right">
          <span className="text-sm font-black text-slate-800 tracking-tight italic block">Your Story Our Creators</span>
          <span className="text-[11px] text-slate-400 font-semibold">Dual Role Responsive Web Application</span>
        </div>
      </header>


      {/* Section 1: CLIENT FLOW */}
      <section className="max-w-7xl mx-auto mb-16 space-y-6">
        <div className="flex items-center justify-between bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Client Flow</h2>
              <p className="text-xs font-semibold text-sky-700">Find the right creator. Book with confidence.</p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-sky-600 text-white px-3 py-1.5 rounded-full shadow-xs">
            Client Experience
          </span>
        </div>

        {/* Horizontal Responsive Scroll Container of 12 Phone Mockups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clientScreens.map((screen) => (
            <div key={screen.id} className="flex flex-col items-center group">
              {/* Phone Mockup Frame */}
              <div className="w-full max-w-[300px] h-[580px] bg-white rounded-[2.8rem] border-[7px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col transition-transform group-hover:-translate-y-1">
                {/* iPhone Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40" />

                {/* Viewport content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 text-[11px] scrollbar-thin">
                  {screen.component}
                </div>

                {/* Overlay Button to Launch Full Screen */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 pointer-events-none">
                  <button
                    onClick={() => onNavigate(screen.id)}
                    className="pointer-events-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-full shadow-xl flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-all"
                  >
                    <span>Launch Screen {screen.number}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-center mt-3">
                <span className="text-xs font-extrabold text-slate-800 block">
                  {screen.number}. {screen.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Middle Banner: Create. Capture. Share. */}
      <section className="max-w-7xl mx-auto my-16 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">Create. Capture. Share.</h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            From weddings to travel, fashion to business — find the perfect creator for every moment.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-bold">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Trusted Creators</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure Bookings</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Verified Profiles</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Flexible Pricing</span>
            </div>
          </div>
        </div>
      </section>


      {/* Section 2: CREATOR FLOW */}
      <section className="max-w-7xl mx-auto mb-16 space-y-6">
        <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Creator Flow</h2>
              <p className="text-xs font-semibold text-emerald-700">Showcase your work. Get bookings. Grow your brand.</p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1.5 rounded-full shadow-xs">
            Creator Experience
          </span>
        </div>

        {/* Grid of 8 Creator Flow Phone Mockups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creatorScreens.map((screen) => (
            <div key={screen.id} className="flex flex-col items-center group">
              {/* Phone Mockup Frame */}
              <div className="w-full max-w-[300px] h-[580px] bg-white rounded-[2.8rem] border-[7px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col transition-transform group-hover:-translate-y-1">
                {/* iPhone Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40" />

                {/* Viewport content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 text-[11px] scrollbar-thin">
                  {screen.component}
                </div>

                {/* Overlay Button to Launch Full Screen */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 pointer-events-none">
                  <button
                    onClick={() => onNavigate(screen.id)}
                    className="pointer-events-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow-xl flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-all"
                  >
                    <span>Launch Screen {screen.number}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-center mt-3">
                <span className="text-xs font-extrabold text-slate-800 block">
                  {screen.number}. {screen.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Bottom Footer Banner (Exact match to diagram footer) */}
      <footer className="max-w-7xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Play className="w-5 h-5 fill-white translate-x-0.5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Reel Shooter</h3>
            <p className="text-xs text-slate-400 font-medium">One Platform • Two Roles • Endless Creative Possibilities</p>
          </div>
        </div>

        <div className="text-xs font-extrabold tracking-wider uppercase text-indigo-400 italic">
          Create More. Earn More.
        </div>
      </footer>

    </div>
  );
}
