import React from 'react';

export default function SplashView({ onNavigate }) {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-frambit-dark text-white overflow-hidden sm:rounded-3xl shadow-2xl border border-slate-800">
      {/* Background Subtle Curved Wave Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
        <svg className="w-full h-full object-cover" viewBox="0 0 400 700" fill="none">
          <path d="M-50 150 C 150 250, 250 50, 450 150 V 700 H -50 Z" fill="url(#grad)" opacity="0.15" />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#885CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Bar Status */}
      <div className="relative z-10 pt-2 flex justify-between items-center text-xs opacity-75 font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>5G</span>
          <div className="w-5 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-white rounded-xs" />
          </div>
        </div>
      </div>

      {/* Logo & Headline */}
      <div className="relative z-10 my-auto text-center flex flex-col items-center pt-8">
        {/* Frambit Graphic Logo Icon */}
        <img
          src="/logo.png"
          alt="Frambit"
          className="w-20 h-20 object-contain drop-shadow-2xl mb-6"
        />

        <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-sans">
          Frambit
        </h1>
        <p className="text-base font-extrabold text-indigo-300 tracking-wide mb-3">
          Find. Book. Create.
        </p>
        <p className="text-xs text-slate-300 font-medium max-w-[260px] leading-relaxed">
          Connect with the best creators for your next project.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 space-y-3.5 pb-6">
        <button
          onClick={() => onNavigate('home')}
          className="w-full py-4 px-6 bg-frambit-gradient hover:opacity-95 text-white font-extrabold rounded-2xl shadow-frambit transition-all active:scale-[0.98] text-sm tracking-wide"
        >
          Get Started
        </button>

        <button
          onClick={() => onNavigate('creator_login')}
          className="w-full py-3.5 px-6 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold rounded-2xl transition-all active:scale-[0.98] text-xs"
        >
          Log In
        </button>
      </div>
    </div>
  );
}


