import React from 'react';
import { User, Camera, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export default function RoleSelectionView({ onSelectRole, onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 animate-fade-in relative">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 text-center space-y-6">
        
        {/* Logo Badge */}
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
          <Play className="w-7 h-7 text-white fill-white translate-x-0.5" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span className="text-indigo-600">Reel Shooter</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Choose your role to get started with our creator marketplace.
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 pt-2">
          {/* Client Option */}
          <button
            onClick={() => {
              if (onSelectRole) onSelectRole('client');
              onNavigate('home');
            }}
            className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-indigo-100 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50 transition-all group relative overflow-hidden shadow-2xs"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    I'm a Client
                  </h3>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Find and book top creative professionals for reels, events & videos.
                </p>
              </div>
            </div>
          </button>

          {/* Creator Option */}
          <button
            onClick={() => {
              if (onSelectRole) onSelectRole('creator');
              onNavigate('dashboard');
            }}
            className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 transition-all group relative overflow-hidden shadow-2xs"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    I'm a Creator
                  </h3>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showcase your reel portfolio, set your rates & get paid bookings.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Trust Guarantee */}
        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          <span>Verified Profiles • Secure Bookings</span>
        </div>
      </div>
    </div>
  );
}
