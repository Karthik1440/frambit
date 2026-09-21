import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowRight, ChevronLeft, Eye, EyeOff, AlertCircle, Loader2, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModalView({ onNavigate, initialMode = 'signup', initialRole = 'user' }) {
  const { signup, login, setUserRole } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [role, setRole] = useState(initialRole || 'user'); // 'user' or 'creator'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSocialLogin = (socialProvider) => {
    setError('');
    setEmail(socialProvider === 'apple' ? 'user.apple@frambit.com' : 'user.google@frambit.com');
    setPassword('password123');
    if (isSignUp) {
      setName('Frambit Member');
      setPhone('+91 98765 43210');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !agreedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalRole = role;
      if (isSignUp) {
        if (!email || !password || !phone) {
          setError('Please fill in all required fields to register.');
          setIsSubmitting(false);
          return;
        }
        const displayName = name || (role === 'creator' ? 'Frambit Creator' : 'Frambit User');
        const res = await signup(email, password, displayName, phone, role);
        finalRole = res?.detectedRole || role;
      } else {
        if (!email || !password) {
          setError('Please enter your email address and password.');
          setIsSubmitting(false);
          return;
        }
        const res = await login(email, password);
        // Prioritize backend detected role (e.g. database has yy@gmail.com as creator)
        finalRole = res?.detectedRole || (role === 'creator' ? 'creator' : 'user');
      }

      setUserRole(finalRole);
      if (finalRole === 'creator') {
        onNavigate('dashboard');
      } else {
        onNavigate('home');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Aesthetic Soft Gradient Waves */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none opacity-80 z-0">
        <svg viewBox="0 0 500 500" className="w-full h-full text-indigo-200/60 fill-current">
          <path d="M0,100 C150,200 350,0 500,100 L500,0 L0,0 Z" />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] pointer-events-none opacity-80 z-0">
        <svg viewBox="0 0 500 500" className="w-full h-full text-purple-300/50 fill-current">
          <path d="M0,350 C200,250 300,500 500,300 L500,500 L0,500 Z" />
        </svg>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-indigo-500/10 space-y-4 relative z-10">

        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Logo & Header Titles */}
        <div className="space-y-2 text-center">
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Frambit"
                className="w-11 h-11 object-contain rounded-2xl drop-shadow-sm shrink-0"
              />
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                Frambit
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 tracking-wide">
              Find. Book. Create.
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans text-center mt-1">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-500 font-medium text-center">
              {isSignUp
                ? 'Select your account type to get started'
                : 'Select your account type to sign in'}
            </p>
          </div>
        </div>

        {/* Account Role Selector Switch: User / Client vs Creator / Shooter */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'user'
                ? 'bg-white text-indigo-600 shadow-md border border-slate-200/60 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isSignUp ? 'Book Creators (User)' : 'User / Client'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              role === 'creator'
                ? 'bg-white text-indigo-600 shadow-md border border-slate-200/60 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{isSignUp ? "I'm a Creator / Shooter" : 'Creator Studio'}</span>
          </button>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-medium flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Inputs Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Full Name Input (Sign Up Only) */}
          {isSignUp && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex items-center gap-3">
              <User className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-medium text-slate-500 leading-tight">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none p-0 border-none"
                />
              </div>
            </div>
          )}

          {/* Email Address Input */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-medium text-slate-500 leading-tight">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none p-0 border-none"
              />
            </div>
          </div>

          {/* Phone Number Input (Sign Up Mode Only) */}
          {isSignUp && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-medium text-slate-500 leading-tight">
                  Phone number
                </label>
                <input
                  type="tel"
                  required={isSignUp}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none p-0 border-none"
                />
              </div>
            </div>
          )}

          {/* Password Input with Visibility Toggle */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex items-center gap-3 relative">
            <Lock className="w-5 h-5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-500 leading-tight">
                  Password
                </label>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'Create a strong password' : '••••••••'}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none p-0 border-none"
              />
            </div>

            {/* Password Visibility Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Terms & Conditions Checkbox (Sign Up Only) */}
          {isSignUp ? (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 font-medium leading-snug cursor-pointer select-none">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => alert('Frambit Terms of Service: Safe, verified bookings & high-quality content standard.')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => alert('Frambit Privacy Policy: Your data and contact information is 256-bit encrypted and safe.')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          ) : (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Enter your email and click Log In to request a reset link.')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>{isSignUp ? 'Creating Account...' : 'Logging in...'}</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </form>

        {/* Or Social Divider */}
        <div className="relative flex items-center justify-center pt-2 pb-1">
          <div className="border-t border-slate-200/90 w-full" />
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 absolute">
            or
          </span>
        </div>

        {/* Circular Social Login Options */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition-transform transform active:scale-95"
            title="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('apple')}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition-transform transform active:scale-95 text-slate-900"
            title="Continue with Apple"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.85.96-2.94-.93.04-2.07.62-2.74 1.41-.6.69-1.12 1.79-.98 2.86 1.05.08 2.12-.54 2.76-1.33z" />
            </svg>
          </button>

          {/* Phone */}
          <button
            type="button"
            onClick={() => handleSocialLogin('phone')}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition-transform transform active:scale-95 text-slate-800"
            title="Continue with Phone OTP"
          >
            <Phone className="w-5 h-5 text-slate-800" />
          </button>
        </div>

        {/* Footer Toggle between Log In and Sign Up */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}
