import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, Camera, CheckCircle2, Phone, Mail, Loader2, MapPin, Navigation, Plus, Trash2, Tag, Package, Film, Pencil, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_VIDEOGRAPHER_PACKAGES, api, fetchCategories, syncCreatorProfile } from '../api';
import { detectCurrentLocationDetails } from '../utils/location';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function EditProfileView({ onNavigate, shooter = {}, onUpdatePackages, onUpdateShooter }) {
  const { currentUser, userData, setUserData } = useAuth();

  const [displayName, setDisplayName] = useState(userData?.display_name || userData?.name || shooter?.display_name || currentUser?.displayName || 'Karthik');

  // Sync displayName when userData changes externally
  useEffect(() => {
    if (userData && (userData.display_name || userData.name)) {
      setDisplayName(userData.display_name || userData.name);
    }
  }, [userData]);

  const syncProfileRealtime = (overrides = {}) => {
    const nextCategory = overrides.category !== undefined ? overrides.category : category;
    const nextPrice = overrides.hourlyPrice !== undefined ? overrides.hourlyPrice : hourlyPrice;
    const updated = {
      ...shooter,
      ...userData,
      id: shooter?.id || 1,
      name: overrides.displayName !== undefined ? overrides.displayName : displayName,
      display_name: overrides.displayName !== undefined ? overrides.displayName : displayName,
      email: overrides.email !== undefined ? overrides.email : email,
      phone: overrides.phone !== undefined ? overrides.phone : phone,
      instagram_handle: overrides.instagramHandle !== undefined ? overrides.instagramHandle : instagramHandle,
      category: nextCategory,
      title: (categories.find(c => c.slug === nextCategory)?.name) || nextCategory || 'Reel Shooter',
      avatar: overrides.avatar !== undefined ? overrides.avatar : avatar,
      cover_image: overrides.avatar !== undefined ? overrides.avatar : avatar,
      bio: overrides.bio !== undefined ? overrides.bio : bio,
      city: overrides.city !== undefined ? overrides.city : city,
      area: overrides.area !== undefined ? overrides.area : area,
      experience: overrides.experience !== undefined ? overrides.experience : experience,
      languages: overrides.languages !== undefined ? overrides.languages : languages,
      availability_summary: overrides.availabilitySummary !== undefined ? overrides.availabilitySummary : availabilitySummary,
      hourly_price: Number(nextPrice),
      price_display: `₹${Number(nextPrice).toLocaleString('en-IN')}/hr`,
      equipment: typeof (overrides.equipment !== undefined ? overrides.equipment : equipment) === 'string'
        ? (overrides.equipment !== undefined ? overrides.equipment : equipment).split(',').map(s => s.trim())
        : (overrides.equipment !== undefined ? overrides.equipment : equipment),
      shooting_styles: typeof (overrides.shootingStyles !== undefined ? overrides.shootingStyles : shootingStyles) === 'string'
        ? (overrides.shootingStyles !== undefined ? overrides.shootingStyles : shootingStyles).split(',').map(s => s.trim())
        : (overrides.shootingStyles !== undefined ? overrides.shootingStyles : shootingStyles),
      services: overrides.services !== undefined ? overrides.services : services,
      packages: shooter?.packages,
      portfolio: shooter?.portfolio,
      ...overrides,
    };
    setUserData(updated);
    if (onUpdateShooter) {
      onUpdateShooter(updated);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setDisplayName(val);
    syncProfileRealtime({ displayName: val });
  };

  const [email, setEmail] = useState(userData?.email || currentUser?.email || shooter?.email || '');
  const [phone, setPhone] = useState(userData?.phone || currentUser?.phoneNumber || shooter?.phone || '');
  const [instagramHandle, setInstagramHandle] = useState(shooter?.instagram_handle || userData?.instagram_handle || '');
  const [category, setCategory] = useState(userData?.category || shooter?.category || 'reel_shooter');
  const [categories, setCategories] = useState([]);

  // Load admin-managed categories from backend
  useEffect(() => {
    fetchCategories().then((data) => {
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    });
  }, []);
  const [bio, setBio] = useState(shooter?.bio || 'Passionate reel shooter & videographer.');
  const [city, setCity] = useState(shooter?.city || 'Bengaluru');
  const [area, setArea] = useState(shooter?.area || 'Indiranagar');
  const [hourlyPrice, setHourlyPrice] = useState(shooter?.hourly_price || 799);
  const [equipment, setEquipment] = useState(
    Array.isArray(shooter?.equipment)
      ? shooter.equipment.join(', ')
      : shooter?.equipment || 'Sony A7IV, 24-70mm f/2.8, DJI RS3 Gimbal, Wireless Mic'
  );
  const [shootingStyles, setShootingStyles] = useState(
    Array.isArray(shooter?.shooting_styles)
      ? shooter.shooting_styles.join(', ')
      : 'Fashion, Travel, Lifestyle, Fitness'
  );
  const [experience, setExperience] = useState(shooter?.experience || userData?.experience || '5+ Years');
  const [languages, setLanguages] = useState(shooter?.languages || userData?.languages || 'English, Hindi');
  const [availabilitySummary, setAvailabilitySummary] = useState(shooter?.availability_summary || userData?.availability_summary || 'Mon - Sun');
  const [avatar, setAvatar] = useState(() => {
    const activeAv = userData?.avatar || userData?.photoURL || shooter?.avatar;
    if (activeAv && !activeAv.includes('photo-1500648767791')) return activeAv;
    return 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg';
  });

  // Editable Services List State
  const [services, setServices] = useState(
    shooter?.services_list || [
      { id: 1, name: 'Reel Shoot', price: 3000 },
      { id: 2, name: 'Video Shoot', price: 5000 },
      { id: 3, name: 'Editing', price: 1500 },
      { id: 4, name: 'Social Media', price: 2000 },
    ]
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Section edit mode tracking state (only show input bar when pencil icon clicked)
  const [editingSections, setEditingSections] = useState({
    personal: false,
    profession: false,
    location: false,
    gear: false,
    specs: false,
    services: false,
  });

  const toggleSectionEdit = (sectionKey) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleServiceChange = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddService = () => {
    setServices([
      ...services,
      { id: Date.now(), name: 'New Custom Service', price: 2500 }
    ]);
  };

  const handleRemoveService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Auto-detect City & Area/Locality on mount if not already filled
  useEffect(() => {
    handleAutoDetectLocation();
  }, []);

  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const details = await detectCurrentLocationDetails();
      if (details.city) setCity(details.city);
      if (details.area) setArea(details.area);
      syncProfileRealtime({ city: details.city, area: details.area });
    } catch (err) {
      console.warn('Location detection error:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const fileInputRef = useRef(null);

  const resizeImageForProfile = (file, maxWidth = 500, maxHeight = 500) => {
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
            0.75
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

  const handleAvatarUpload = async (e) => {
    let file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploading(true);
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
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('file_name', uniqueFileName);
          formData.append('folder', '/profile_pictures');

          const response = await api.post('/media/upload/', formData);
          ikUrl = response.data?.url || response.data?.file_url;
        } catch (serverErr) {}
      }

      const applyNewAvatar = (newUrl) => {
        setAvatar(newUrl);
        try { localStorage.setItem('frambit_active_avatar', newUrl); } catch (err) {}
        syncProfileRealtime({ avatar: newUrl });
      };

      if (ikUrl) {
        applyNewAvatar(ikUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) applyNewAvatar(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Avatar upload fallback to FileReader:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatar(reader.result);
          try { localStorage.setItem('frambit_active_avatar', reader.result); } catch (e) {}
          syncProfileRealtime({ avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    // 0.1s fast loading feedback
    setTimeout(() => {
      const updatedShooter = {
        ...shooter,
        id: shooter?.id || 1,
        name: displayName,
        display_name: displayName,
        email,
        phone,
        instagram_handle: instagramHandle,
        category,
        title: (categories.find(c => c.slug === category)?.name) || category || 'Reel Shooter',
        avatar,
        cover_image: avatar,
        bio,
        city,
        area,
        experience,
        languages,
        availability_summary: availabilitySummary,
        hourly_price: Number(hourlyPrice),
        price_display: `₹${hourlyPrice} / hour`,
        equipment: typeof equipment === 'string' ? equipment.split(',').map(s => s.trim()) : equipment,
        shooting_styles: typeof shootingStyles === 'string' ? shootingStyles.split(',').map(s => s.trim()) : shootingStyles,
        services,
        packages: shooter?.packages,
        portfolio: shooter?.portfolio,
      };

      setUserData(updatedShooter);
      if (onUpdateShooter) {
        onUpdateShooter(updatedShooter);
      }

      // Sync to Django backend DB — makes creator visible to ALL clients
      syncCreatorProfile(updatedShooter);

      setIsSaving(false);
      setIsSaved(true);
      setEditingSections({
        personal: false,
        profession: false,
        location: false,
        gear: false,
        specs: false,
        services: false,
      });

      // Keep success state written on screen for 1.2s before navigating
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1200);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative font-sans">
      {/* Top Floating Toast Notification */}
      {isSaved && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-extrabold text-xs sm:text-sm animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Successfully updated profile</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('dashboard')} className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-slate-900">Edit Creator Profile</h1>
            </div>
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Successfully updated profile
              </span>
            )}
          </div>

          {/* Avatar Upload Preview */}
          <div className="text-center">
            <div className="relative inline-block cursor-pointer group" onClick={() => !isUploading && fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 shadow-md bg-indigo-600 flex items-center justify-center font-black text-white text-3xl mx-auto">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-all border-2 border-white cursor-pointer"
                title="Change profile picture"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              {isUploading ? 'Uploading to ImageKit...' : 'Click to upload photo to ImageKit'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Master Edit Mode Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-extrabold text-slate-700">
                Click any <span className="inline-flex items-center text-indigo-600 font-black"><Pencil className="w-3 h-3 inline mx-0.5" /> Edit icon</span> to change details
              </span>
              <button
                type="button"
                onClick={() => {
                  const allActive = Object.values(editingSections).every(Boolean);
                  setEditingSections({
                    personal: !allActive,
                    profession: !allActive,
                    location: !allActive,
                    gear: !allActive,
                    specs: !allActive,
                    services: !allActive,
                  });
                }}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{Object.values(editingSections).some(Boolean) ? 'View Saved Card' : 'Edit All Fields'}</span>
              </button>
            </div>

            {/* 1. Personal Information Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Personal Details</span>
                </h3>
                <button
                  type="button"
                  onClick={() => toggleSectionEdit('personal')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    editingSections.personal
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Edit Personal Info"
                >
                  {editingSections.personal ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {editingSections.personal ? (
                <div className="space-y-3 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={handleNameChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Full Name</div>
                    <div className="text-xs font-black text-slate-900 truncate mt-0.5">{displayName}</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Email Address</div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{email}</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{phone || 'Not provided'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Category, Instagram & Bio Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Profession, Instagram & Bio
                </h3>
                <button
                  type="button"
                  onClick={() => toggleSectionEdit('profession')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    editingSections.profession
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Edit Category & Bio"
                >
                  {editingSections.profession ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {editingSections.profession ? (
                <div className="space-y-3 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Category</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        syncProfileRealtime({ category: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      {categories.length > 0
                        ? categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>
                              {cat.icon_emoji} {cat.name}
                            </option>
                          ))
                        : (
                            // Fallback while loading
                            <option value={category}>{category}</option>
                          )
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Instagram Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-xs font-extrabold text-slate-400">@</span>
                      <input
                        type="text"
                        value={instagramHandle.replace(/^@/, '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^@/, '');
                          setInstagramHandle(val);
                          syncProfileRealtime({ instagramHandle: val });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        syncProfileRealtime({ bio: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 resize-none font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                      {(categories.find(c => c.slug === category)?.name) || category || 'Reel Shooter'}
                    </span>
                    <a
                      href={`https://instagram.com/${instagramHandle.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-full border border-pink-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>@{instagramHandle.replace(/^@/, '')}</span>
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                    {bio}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Location & Rates Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Location & Hourly Pricing
                </h3>
                <button
                  type="button"
                  onClick={() => toggleSectionEdit('location')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    editingSections.location
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Edit Location & Rates"
                >
                  {editingSections.location ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {editingSections.location ? (
                <div className="space-y-3 pt-1 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">City & Area</span>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Navigation className={`w-3.5 h-3.5 text-indigo-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                      <span>{isDetectingLocation ? 'Detecting...' : 'Auto-Detect (GPS)'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        syncProfileRealtime({ city: e.target.value });
                      }}
                      placeholder="City"
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        syncProfileRealtime({ area: e.target.value });
                      }}
                      placeholder="Locality / Area"
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Base Hourly Price (₹)</label>
                    <input
                      type="number"
                      value={hourlyPrice}
                      onChange={(e) => {
                        setHourlyPrice(e.target.value);
                        syncProfileRealtime({ hourlyPrice: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Location</div>
                      <div className="text-xs font-black text-slate-900 truncate">
                        {area ? `${area}, ${city}` : city}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Base Hourly Rate</div>
                    <div className="text-sm font-black text-indigo-600">
                      ₹{hourlyPrice} <span className="text-[10px] font-semibold text-slate-400">/ hour</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Equipment & Shooting Styles Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Equipment Kit & Shooting Styles
                </h3>
                <button
                  type="button"
                  onClick={() => toggleSectionEdit('gear')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    editingSections.gear
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Edit Equipment & Styles"
                >
                  {editingSections.gear ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {editingSections.gear ? (
                <div className="space-y-3 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Equipment Kit (comma separated)</label>
                    <input
                      type="text"
                      value={typeof equipment === 'string' ? equipment : (Array.isArray(equipment) ? equipment.join(', ') : '')}
                      onChange={(e) => {
                        setEquipment(e.target.value);
                        syncProfileRealtime({ equipment: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Shooting Styles (comma separated)</label>
                    <input
                      type="text"
                      value={typeof shootingStyles === 'string' ? shootingStyles : (Array.isArray(shootingStyles) ? shootingStyles.join(', ') : '')}
                      onChange={(e) => {
                        setShootingStyles(e.target.value);
                        syncProfileRealtime({ shootingStyles: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Camera Kit</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(typeof equipment === 'string' ? equipment.split(',') : (Array.isArray(equipment) ? equipment : [])).map((item, idx) => (
                        <span key={idx} className="bg-white text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                          📷 {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Styles Covered</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(typeof shootingStyles === 'string' ? shootingStyles.split(',') : (Array.isArray(shootingStyles) ? shootingStyles : [])).map((style, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-100">
                          {style.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Experience, Languages & Availability Specs Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Experience & Availability
                </h3>
                <button
                  type="button"
                  onClick={() => toggleSectionEdit('specs')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    editingSections.specs
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Edit Specs"
                >
                  {editingSections.specs ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {editingSections.specs ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Experience</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Languages</label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Availability</label>
                    <input
                      type="text"
                      value={availabilitySummary}
                      onChange={(e) => setAvailabilitySummary(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Experience</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{experience}</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Languages</div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{languages}</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Availability</div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{availabilitySummary}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Editable Services & Rates Section */}
            <div className="p-4 bg-slate-50/70 rounded-3xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Services Offered & Starting Rates
                </h3>
                <div className="flex items-center gap-2">
                  {editingSections.services && (
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSectionEdit('services')}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      editingSections.services
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                    title="Edit Services"
                  >
                    {editingSections.services ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {editingSections.services ? (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  {services.map((srv) => (
                    <div key={srv.id} className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={srv.name}
                          onChange={(e) => handleServiceChange(srv.id, 'name', e.target.value)}
                          placeholder="Service Name"
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={srv.price}
                            onChange={(e) => handleServiceChange(srv.id, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(srv.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                        title="Remove service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {services.map((srv) => (
                    <div key={srv.id} className="p-3 bg-white rounded-2xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">{srv.name}</span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        ₹{Number(srv.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Save & Finish Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving || isSaved}
                className={`w-full py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : isSaving
                    ? 'bg-indigo-500 text-white opacity-80 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating profile...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Successfully updated profile</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
