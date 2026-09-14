import React from 'react';
import { Globe, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer({ onNavigate }) {
  const handleNav = (screenId, catId, targetElementId) => {
    if (onNavigate) {
      onNavigate(screenId, catId);
      if (targetElementId) {
        setTimeout(() => {
          document.getElementById(targetElementId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#0b0f19] text-slate-400 border-t border-slate-800/80 font-sans relative z-10 select-none">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        
        {/* Top 4-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-slate-800/80">
          
          {/* Col 1 & 2: Brand & About (Spans 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Logo + Tagline */}
            <div
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 cursor-pointer group inline-flex"
            >
              <img
                src="/logo.png"
                alt="Frambit"
                className="w-10 h-10 object-contain rounded-2xl group-hover:scale-105 transition-all drop-shadow-xs"
              />
              <div>
                <span className="text-xl font-black tracking-tight text-white font-sans leading-none block">
                  Frambit
                </span>
                <span className="text-[11px] font-bold text-indigo-400 tracking-wider">
                  Find. Book. Create.
                </span>
              </div>
            </div>

            {/* Mission Statement */}
            <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
              The leading marketplace for creators, photographers, videographers, editors and more. Turn your vision into amazing content.
            </p>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs border border-slate-700/50"
                title="Follow us on Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs border border-slate-700/50"
                title="Subscribe on YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-900 hover:text-sky-400 text-slate-300 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs border border-slate-700/50"
                title="Follow us on X"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs border border-slate-700/50"
                title="Connect on LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href="https://frambit.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs border border-slate-700/50"
                title="Global Network"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Explore
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('search')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Search
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('my_bookings')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Bookings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('chat_list')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Chat
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home', null, 'faqs-section')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  FAQs & Help
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('role_selection')}
                  className="hover:text-indigo-400 text-indigo-400 font-bold transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  Become a Creator
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: For Creators */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              For Creators
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('role_selection')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('blueprint')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Creator Guidelines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('services_pricing')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Commission & Payouts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home', null, 'faqs-section')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: For Clients */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              For Clients
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home', null, 'faqs-section')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  How It Works & FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('search')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Safety & Trust
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('chat_list')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Support
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Extra Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Frambit. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <button type="button" onClick={() => handleNav('home')} className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </button>
            <button type="button" onClick={() => handleNav('home')} className="hover:text-slate-300 transition-colors">
              Terms of Service
            </button>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
