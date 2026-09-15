import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Calendar, MessageSquare, Heart, Star, Settings, HelpCircle, ChevronRight, LogOut, Mail, Phone, User as UserIcon, ShieldCheck, Camera, CheckCircle2, Loader2, Film } from 'lucide-react';
import { useAuth, formatNameFromEmail } from '../context/AuthContext';
import { api } from '../api';

export default function ClientProfileView({ onNavigate }) {
  const { currentUser, userData, setUserData, userRole, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const email = userData?.email || currentUser?.email || (currentUser ? '' : 'Not signed in');
  const derivedName = currentUser?.displayName || (currentUser?.email ? formatNameFromEmail(currentUser.email) : null);
  const name = userData?.name || derivedName || (currentUser ? 'User' : 'Guest User');
  const phone = userData?.phone || (currentUser ? 'Not provided' : 'Not signed in');
  const avatar = userData?.avatar || userData?.photoURL || currentUser?.photoURL;
  const roleDisplay = userRole === 'creator' ? 'Verified Creator' : 'Client / User';

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  const resizeImageForProfile = (file, maxWidth = 1600, maxHeight = 1600) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width <= maxWidth && height <= maxHeight) {
            resolve(file);
            return;
          }
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const getCleanFileName = (originalName) => {
    if (!originalName) return `avatar_${Date.now()}.jpg`;
    const lastDotIndex = originalName.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex + 1).toLowerCase() : 'jpg';
    const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const cleanBase = baseName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return `avatar_${Date.now()}_${cleanBase || 'photo'}.${ext}`;
  };

  const handleImageUpload = async (e) => {
    let file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setImgError(false);

    try {
      file = await resizeImageForProfile(file);
      const uniqueFileName = getCleanFileName(file.name);

      let ikUrl = null;

      // 1. Primary: Direct Client Upload to ImageKit using fresh signature from backend
      try {
        const authRes = await api.get('/media/imagekit-auth/');
        if (authRes.data && authRes.data.signature) {
          const ikFormData = new FormData();
          ikFormData.append('file', file);
          ikFormData.append('fileName', uniqueFileName);
          ikFormData.append('token', authRes.data.token);
          ikFormData.append('expire', String(authRes.data.expire));
          ikFormData.append('signature', authRes.data.signature);
          ikFormData.append('publicKey', authRes.data.publicKey);
          ikFormData.append('folder', '/profile_pictures');
          ikFormData.append('useUniqueFileName', 'false');

          const ikRes = await axios.post('https://upload.imagekit.io/api/v1/files/upload', ikFormData);
          ikUrl = ikRes.data?.url;
        }
      } catch (authErr) {
        console.warn("Direct ImageKit upload warning, attempting server fallback:", authErr);
      }

      // 2. Secondary: Server-side Upload Fallback
      if (!ikUrl) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_name', uniqueFileName);
        formData.append('folder', '/profile_pictures');

        const response = await api.post('/media/upload/', formData);
        ikUrl = response.data?.url || response.data?.file_url;
      }

      if (ikUrl) {
        setUserData({ avatar: ikUrl });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setUserData({ avatar: reader.result });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("ImageKit profile upload fallback:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ avatar: reader.result });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pb-24 text-slate-800 animate-fade-in relative font-sans">
      <div className="max-w-md mx-auto sm:max-w-2xl px-4 py-6 space-y-5">

        {/* Hidden File Input for Avatar Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Premium Profile Glassmorphic Header Card */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 space-y-5 relative overflow-hidden">
          
          {/* Subtle Background Glow Spheres */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Profile Avatar Circle with ImageKit Upload */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                title="Click to upload profile picture"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-white/80 shadow-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-2xl group-hover:scale-105 transition-transform">
                  {avatar && !imgError ? (
                    <img src={avatar} alt={name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-md border-2 border-white transition-all group-hover:scale-110 cursor-pointer"
                  title="Upload profile picture"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">{name}</h1>
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold text-indigo-100 border border-white/20">
                  {roleDisplay}
                </div>
                {uploadSuccess && (
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile photo updated!
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('profile_edit')}
              className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all border border-white/15 cursor-pointer"
              title="Edit Profile"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* User Contact Info Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-white/15 text-xs relative z-10">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15 text-indigo-50">
              <Mail className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="truncate font-semibold">{email}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15 text-indigo-50">
              <Phone className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="truncate font-semibold">{phone}</span>
            </div>
          </div>
        </div>



        {/* Account Menu Items List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">

          {/* 1. My Bookings */}
          <button
            onClick={() => onNavigate('my_bookings')}
            className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">My Bookings & Orders</div>
                <div className="text-[11px] text-slate-400 font-medium">View active & past shoot requests</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2. Chat */}
          <button
            onClick={() => onNavigate('chat_list')}
            className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">Direct Messages & Chat</div>
                <div className="text-[11px] text-slate-400 font-medium">Chat directly with creators</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. Saved Creators */}
          <button
            onClick={() => onNavigate('saved')}
            className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Heart className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">Saved Creators & Shooters</div>
                <div className="text-[11px] text-slate-400 font-medium">Your bookmarked talent list</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>


          {/* 5. Help & Support */}
          <button
            onClick={() => alert('Support available 24/7 at support@frambit.com')}
            className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">Help & Support</div>
                <div className="text-[11px] text-slate-400 font-medium">24/7 dedicated customer assistance</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

        {/* Account Authentication Action Button */}
        <div className="pt-2">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs rounded-2xl border border-rose-200 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out ({email})</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth_login')}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserIcon className="w-4 h-4 text-white" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

