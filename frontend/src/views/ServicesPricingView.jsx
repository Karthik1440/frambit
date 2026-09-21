import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, Save, Sparkles, AlertCircle, Check, Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchPackages, createPackage, updatePackage, deletePackageApi, api } from '../api';

export default function ServicesPricingView({ shooter, onNavigate, onUpdatePackages }) {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load packages from API on mount
  useEffect(() => {
    if (shooter?.id) {
      setLoadingPackages(true);
      fetchPackages(shooter.id)
        .then((data) => {
          if (data.length > 0) setPackages(data);
          // Fallback: use legacy JSON blob if DB has no packages yet
          else if (shooter.packages && shooter.packages.length > 0) setPackages(shooter.packages);
        })
        .finally(() => setLoadingPackages(false));
    } else if (shooter?.packages?.length > 0) {
      setPackages(shooter.packages);
    }
  }, [shooter?.id]);

  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formIcon, setFormIcon] = useState('🎥');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formDeliverables, setFormDeliverables] = useState('');
  const [formTurnaround, setFormTurnaround] = useState('');
  const [formPopular, setFormPopular] = useState(false);
  const [formCoverImage, setFormCoverImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  const PRESET_COVER_IMAGES = [
    { label: '🎥 Reel Shoot', url: 'https://ik.imagekit.io/reelshooter/packages/reel_shoot_package.jpg' },
    { label: '📸 Studio Shoot', url: 'https://ik.imagekit.io/reelshooter/packages/portrait_session_package.jpg' },
    { label: '🛸 Drone Aerial', url: 'https://ik.imagekit.io/reelshooter/packages/drone_aerial_package.jpg' },
    { label: '👗 Fashion Reel', url: 'https://ik.imagekit.io/reelshooter/packages/brand_starter_package.jpg' },
    { label: '✂️ Video Edit', url: 'https://ik.imagekit.io/reelshooter/packages/video_editor_package.jpg' },
    { label: '🔥 Commercial Shoot', url: 'https://ik.imagekit.io/reelshooter/packages/commercial_brand_package.jpg' },
  ];

  const handleStartAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormIcon('✨');
    setFormPrice('');
    setFormDuration('');
    setFormDeliverables('');
    setFormTurnaround('');
    setFormPopular(false);
    setFormCoverImage(PRESET_COVER_IMAGES[0].url);
    setShowAddForm(true);
  };

  const handleStartEdit = (pkg) => {
    setShowAddForm(false);
    setEditingId(pkg.id);
    setFormTitle(pkg.title || '');
    setFormIcon(pkg.icon || '🎥');
    setFormPrice(pkg.price || '');
    setFormDuration(pkg.duration || '');
    const delivs = pkg.deliverablesList
      ? pkg.deliverablesList.join(', ')
      : [pkg.reelsCount, pkg.photosCount, pkg.editing, pkg.revisions].filter(Boolean).join(', ');
    setFormDeliverables(delivs);
    setFormTurnaround(pkg.turnaround?.replace('Delivery: ', '') || '3 days');
    setFormPopular(!!pkg.popular);
    setFormCoverImage(pkg.cover_image || PRESET_COVER_IMAGES[0].url);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const sanitizedName = `pkg_${Date.now()}_${(file.name || 'cover.jpg').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', '/packages');
      formData.append('file_name', sanitizedName);
      formData.append('use_unique_file_name', 'true');

      const res = await api.post('/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url || res.data?.file_url;
      if (url) {
        setFormCoverImage(url);
      } else {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (re.target?.result) setFormCoverImage(re.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Package image upload server fallback to local preview:', err);
      const reader = new FileReader();
      reader.onload = (re) => {
        if (re.target?.result) setFormCoverImage(re.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!formTitle || !formTitle.trim()) {
      alert('Please enter a package title.');
      return;
    }

    const cleanPriceStr = String(formPrice).replace(/[^\d.]/g, '');
    const numericPrice = Number(cleanPriceStr);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Please enter a valid price for this package (e.g. 2999).');
      return;
    }

    const deliverables = formDeliverables
      ? formDeliverables.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Custom Deliverable'];

    const formattedTurnaround = formTurnaround
      ? (formTurnaround.toLowerCase().startsWith('delivery:')
          ? formTurnaround
          : `Delivery: ${formTurnaround}`)
      : 'Delivery: 3 days';

    const coverUrl = formCoverImage || PRESET_COVER_IMAGES[0].url;
    setSaving(true);
    try {
      const isRealDbId = editingId && (typeof editingId === 'number' || /^\d+$/.test(String(editingId)));

      if (isRealDbId) {
        const updated = await updatePackage(editingId, {
          title: formTitle.trim(),
          icon: formIcon || '🎥',
          price: numericPrice,
          duration: formDuration || '2 hours',
          deliverables,
          turnaround: formattedTurnaround,
          popular: formPopular,
          cover_image: coverUrl,
        });
        setPackages((prev) => prev.map((p) => p.id === editingId ? updated : p));
        if (onUpdatePackages) onUpdatePackages(packages.map((p) => p.id === editingId ? updated : p));
        setEditingId(null);
      } else {
        const newPkg = await createPackage({
          title: formTitle.trim(),
          icon: formIcon || '🎥',
          price: numericPrice,
          duration: formDuration || '2 hours',
          deliverables,
          turnaround: formattedTurnaround,
          popular: formPopular,
          cover_image: coverUrl,
        });
        const updated = editingId
          ? packages.map((p) => (p.id === editingId ? newPkg : p))
          : [...packages, newPkg];
        setPackages(updated);
        if (onUpdatePackages) onUpdatePackages(updated);
        setShowAddForm(false);
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to save package:', err);
      let errorMsg = 'An error occurred while saving the package.';
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (typeof data === 'object') {
          errorMsg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      alert(`Failed to save package: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id) => {
    const confirmed = window.confirm('Delete this package?');
    if (!confirmed) return;
    const isRealDbId = id && (typeof id === 'number' || /^\d+$/.test(String(id)));
    if (isRealDbId) {
      await deletePackageApi(id);
    }
    const updated = packages.filter((p) => p.id !== id);
    setPackages(updated);
    if (onUpdatePackages) onUpdatePackages(updated);
    if (editingId === id) setEditingId(null);
  };

  const handleSaveAllChanges = () => {
    if (onUpdatePackages) onUpdatePackages(packages);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative font-sans">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Top Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-sans">
                Services & Packages
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage, edit, and create custom service packages for your clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Package</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllChanges}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-fade-in shadow-2xs">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-bold">
              Your packages have been updated successfully! Changes are live on your profile and dashboard.
            </div>
          </div>
        )}

        {/* Add / Edit Form Modal Card */}
        {(showAddForm || editingId) && (
          <form
            onSubmit={handleSavePackage}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-indigo-200 shadow-md space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 font-sans">
                {editingId ? '✏️ Edit Package' : '✨ Add New Service Package'}
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Fill details below</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Icon / Emoji</label>
                <select
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="✨">✨ Custom Service / Package</option>
                  <option value="📸">📸 Photography / Shoot</option>
                  <option value="🎥">🎥 Reel / Video</option>
                  <option value="💄">💄 Makeup & Beauty</option>
                  <option value="👗">👗 Styling & Wardrobe</option>
                  <option value="✂️">✂️ Editing & Post-Production</option>
                  <option value="🛸">🛸 Drone & Aerial</option>
                  <option value="🌟">🌟 Model / Talent</option>
                  <option value="⭐">⭐ Starter Package</option>
                  <option value="🔥">🔥 Popular / Premium</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Package Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bridal HD Makeup / Portrait Shoot / Custom Service"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Package Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-extrabold text-indigo-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Service / Event Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 2 hours / Full Day / Per Session"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Delivery / Completion Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2 days / Same day"
                  value={formTurnaround}
                  onChange={(e) => setFormTurnaround(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Hidden File Input for Package Cover Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Package Cover Image with Presets and Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700">Package Cover Image</label>
                <span className="text-[10px] text-slate-400 font-medium">Choose a preset or upload your own</span>
              </div>

              {/* Preset selector pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COVER_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setFormCoverImage(preset.url)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      formCoverImage === preset.url
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Image Preview & Upload Box */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-indigo-200 hover:border-indigo-500 transition-all cursor-pointer group flex items-center justify-center"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center text-indigo-600 space-y-1">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-extrabold">Uploading to ImageKit…</span>
                  </div>
                ) : formCoverImage ? (
                  <>
                    <img
                      src={formCoverImage}
                      alt="Package Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-black">
                      <Camera className="w-4 h-4 text-white" />
                      <span>Upload / Replace Custom Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-indigo-600 space-y-1">
                    <Upload className="w-6 h-6 text-indigo-600" />
                    <span className="text-xs font-extrabold text-indigo-600">Upload Package Image</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Deliverables & Features (Comma separated list)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Service inclusions, deliverables, trial session, touchups, revisions (comma separated list)"
                value={formDeliverables}
                onChange={(e) => setFormDeliverables(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formPopular}
                  onChange={(e) => setFormPopular(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Mark as Popular Package (Highlighted with badge)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingId(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  {editingId ? 'Update Package' : 'Save New Package'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Shoot Packages Grid */}
        {loadingPackages ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-bold">Loading packages…</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          {packages.map((pkg) => (
            <div
              key={pkg.id || pkg.title}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group relative"
            >
              {/* Top Cover Image Banner with Popular Badge & Action Buttons Overlay */}
              <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                <img
                  src={pkg.cover_image || shooter?.cover_image || null}
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20" />
                
                {pkg.popular && (
                  <span className="absolute top-3 left-3 bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                    ⭐ Popular
                  </span>
                )}

                {/* Top Right Action Bar (Edit & Delete) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(pkg)}
                    className="px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 font-extrabold text-[11px] rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    title="Edit package"
                  >
                    <Edit2 className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="px-2.5 py-1 bg-rose-600/90 backdrop-blur-md hover:bg-rose-600 text-white font-extrabold text-[11px] rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    title="Delete package"
                  >
                    <Trash2 className="w-3 h-3 shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 font-sans tracking-tight leading-snug">
                    {pkg.title}
                  </h3>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                    ₹{typeof pkg.price === 'number' ? pkg.price.toLocaleString('en-IN') : pkg.price}
                  </div>

                  {/* Deliverables List with Icons */}
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    {(pkg.deliverablesList || [
                      pkg.reelsCount,
                      pkg.photosCount,
                      pkg.duration,
                      pkg.editing,
                      pkg.revisions,
                      pkg.turnaround
                    ].filter(Boolean)).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {item.toLowerCase().includes('reel') ? '😊' : item.toLowerCase().includes('delivery') || item.toLowerCase().includes('hour') || item.toLowerCase().includes('shoot') ? '🕒' : '✓'}
                        </div>
                        <span className="font-medium text-xs text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Ready for Direct Booking</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
