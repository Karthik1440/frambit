import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, Edit2, Trash2, Save,
  Eye, MapPin, X, Check, Sparkles, Camera, Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES = [
  'Fashion', 'Portrait', 'Travel', 'Food & Lifestyle',
  'Fitness', 'Product', 'Wedding', 'Commercial', 'Other',
];

// Compress & resize image to base64 (max 800px, 0.80 quality)
function compressImage(file, maxPx = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PortfolioPhotosView({ videos = [], shooter, isReadOnly = false, onNavigate, onUpdateVideos }) {
  const [items, setItems] = useState(
    Array.isArray(videos) && videos.length > 0 ? videos : []
  );

  useEffect(() => {
    if (Array.isArray(videos)) {
      setItems(videos);
    }
  }, [videos]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [location, setLocation] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setCategory('Fashion');
    setLocation('');
    setImageDataUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    if (isReadOnly) return;
    if (items.length >= 6) {
      alert('You have reached the maximum limit of 6 portfolio photos.');
      return;
    }
    resetForm();
    setShowAddForm(true);
  };

  const handleStartEdit = (item) => {
    if (isReadOnly) return;
    setShowAddForm(false);
    setEditingId(item.id);
    setTitle(item.title || '');
    setCategory(item.category || 'Fashion');
    setLocation(item.location || '');
    setImageDataUrl(item.image_url || item.thumbnail || '');
  };

  const handleFileChange = async (e) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setImageDataUrl(compressed);
    } catch (err) {
      alert('Failed to process image. Please try another file.');
    }
    setUploading(false);
    // Reset file input so same file can be re-picked
    e.target.value = '';
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!title.trim()) return;
    if (!imageDataUrl) {
      alert('Please upload a photo first.');
      return;
    }
    if (!editingId && items.length >= 6) {
      alert('Maximum 6 portfolio photos allowed.');
      return;
    }

    if (editingId) {
      const updated = items.map((item) =>
        item.id === editingId
          ? { ...item, title: title.trim(), category, location, image_url: imageDataUrl }
          : item
      );
      setItems(updated);
      if (onUpdateVideos) onUpdateVideos(updated);
      resetForm();
    } else {
      const newItem = {
        id: Date.now(),
        title: title.trim(),
        category,
        location,
        image_url: imageDataUrl,
      };
      const updated = [newItem, ...items];
      setItems(updated);
      if (onUpdateVideos) onUpdateVideos(updated);
      resetForm();
    }
  };

  const handleDeleteItem = (id) => {
    if (isReadOnly) return;
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    if (onUpdateVideos) onUpdateVideos(updated);
    if (editingId === id) resetForm();
  };

  const handleSaveAll = () => {
    if (isReadOnly) return;
    if (onUpdateVideos) onUpdateVideos(items);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(isReadOnly ? 'shooter_profile' : 'dashboard')}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {isReadOnly ? `${shooter?.display_name || 'Creator'}'s Portfolio` : 'Portfolio Photos'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isReadOnly ? 'Browse creative works and photo reels' : 'Upload your best work — photos only'}
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photo</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Portfolio</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Success Banner ── */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">Portfolio saved! Changes are live on your profile.</span>
          </div>
        )}

        {/* ── Add / Edit Form ── */}
        {!isReadOnly && (showAddForm || editingId) && (
          <form
            onSubmit={handleSaveItem}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-indigo-200 shadow-md space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {editingId ? '✏️ Edit Photo' : '📸 Add Portfolio Photo'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2">Photo *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden
                  ${imageDataUrl
                    ? 'border-indigo-300 bg-slate-50'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40'
                  }`}
                style={{ minHeight: '180px' }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Processing…</span>
                  </div>
                ) : imageDataUrl ? (
                  <>
                    <img
                      src={imageDataUrl}
                      alt="Preview"
                      className="w-full object-cover rounded-2xl"
                      style={{ maxHeight: '260px' }}
                    />
                    <div className="absolute inset-0 bg-slate-950/0 hover:bg-slate-950/30 flex items-center justify-center transition-all rounded-2xl">
                      <span className="opacity-0 hover:opacity-100 bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5">
                        <Camera className="w-4 h-4" /> Change Photo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Click to upload photo</p>
                      <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP — max 10MB</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fashion Editorial Shoot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Location (optional)</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, Indiranagar"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
              >
                {editingId ? 'Update Photo' : 'Save Photo'}
              </button>
            </div>
          </form>
        )}

        {/* ── Empty State ── */}
        {items.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center">
              <Camera className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-black text-slate-800">No portfolio photos yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {isReadOnly ? `No photos uploaded yet by ${shooter?.display_name || 'this creator'}.` : 'Upload your best work to attract clients'}
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload First Photo
              </button>
            )}
          </div>
        )}

        {/* ── Photo Grid ── */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Photo */}
                <div
                  onClick={() => setSelectedPhoto(item)}
                  className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
                >
                  <img
                    src={item.image_url || item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 transition-all flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                {/* Info & Actions */}
                <div className="p-2.5 space-y-2">
                  <p className="text-xs font-black text-slate-800 truncate">{item.title}</p>
                  {item.location && (
                    <p className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-indigo-400" />
                      {item.location}
                    </p>
                  )}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[11px] rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add More tile (Creators only) */}
            {!isReadOnly && (
              <div
                onClick={handleStartAdd}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-slate-400 hover:text-indigo-500"
              >
                <Plus className="w-7 h-7" />
                <span className="text-xs font-bold">Add Photo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4 text-white">
              <h2 className="text-sm font-black">{selectedPhoto.title}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {selectedPhoto.category}{selectedPhoto.location ? ` • ${selectedPhoto.location}` : ''}
              </p>
            </div>

            <div className="w-full bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.image_url || selectedPhoto.thumbnail}
                alt={selectedPhoto.title}
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
