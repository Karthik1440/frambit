import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Plus, Edit2, Trash2, Save,
  Eye, MapPin, X, Check, Sparkles, Camera, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { api, fetchPortfolioPhotos } from '../api';

const CATEGORIES = [
  'Fashion', 'Portrait', 'Travel', 'Food & Lifestyle',
  'Fitness', 'Product', 'Wedding', 'Commercial', 'Other',
];


export default function PortfolioPhotosView({ videos = [], shooter, isReadOnly = false, onNavigate, onUpdateVideos }) {
  const [items, setItems] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Load portfolio photos from API on mount / when shooter changes
  useEffect(() => {
    if (shooter?.id) {
      setLoadingPhotos(true);
      fetchPortfolioPhotos(shooter.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
          } else if (Array.isArray(videos) && videos.length > 0) {
            // Fallback to the prop if API returns empty (legacy JSON portfolio)
            setItems(videos.filter((v) => v.image_url && !v.image_url.startsWith('data:')));
          }
        })
        .catch(() => {
          if (Array.isArray(videos)) setItems(videos);
        })
        .finally(() => setLoadingPhotos(false));
    } else if (Array.isArray(videos)) {
      setItems(videos);
    }
  }, [shooter?.id]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [location, setLocation] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');  // preview URL (object URL)
  const [imageFile, setImageFile] = useState(null);      // raw File for upload

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setCategory('Fashion');
    setLocation('');
    setImageDataUrl('');
    setImageFile(null);
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
    // Store the raw File object — will be uploaded to ImageKit on save
    setImageFile(file);
    // Show a local object URL as preview (not base64, not stored)
    const preview = URL.createObjectURL(file);
    setImageDataUrl(preview);
    e.target.value = '';
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!title.trim()) return;
    if (!imageDataUrl && !editingId) {
      alert('Please upload a photo first.');
      return;
    }
    if (!editingId && items.length >= 6) {
      alert('Maximum 6 portfolio photos allowed.');
      return;
    }

    setUploading(true);
    try {
      if (editingId) {
        // Update metadata only (title, category, location) via PATCH
        const res = await api.patch(`/portfolio-photos/${editingId}/`, {
          title: title.trim(),
          category: category.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_'),
          location,
        });
        setItems((prev) => prev.map((item) => item.id === editingId ? res.data : item));
        if (onUpdateVideos) onUpdateVideos(items.map((item) => item.id === editingId ? res.data : item));
        resetForm();
      } else {
        // 1. Upload file to ImageKit via Django proxy
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('file_name', `portfolio_${Date.now()}_${imageFile.name}`);
        formData.append('folder', '/portfolio');
        formData.append('use_unique_file_name', 'true');
        const uploadRes = await api.post('/media/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imageUrl = uploadRes.data?.url;
        if (!imageUrl) throw new Error('ImageKit did not return a URL.');

        // 2. Save PortfolioPhoto record in DB
        const catSlug = category.toLowerCase().replace(/[\s&]/g, '_').replace(/_+/g, '_');
        const photoRes = await api.post('/portfolio-photos/', {
          title: title.trim(),
          category: catSlug,
          image_url: imageUrl,
          location,
          is_public: true,
        });
        const newItem = photoRes.data;
        const updated = [newItem, ...items];
        setItems(updated);
        if (onUpdateVideos) onUpdateVideos(updated);
        resetForm();
      }
    } catch (err) {
      console.error('Portfolio save error:', err);
      alert(`Save failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (isReadOnly) return;
    try {
      await api.delete(`/portfolio-photos/${id}/`);
    } catch (err) {
      console.warn('Delete portfolio photo API error (removing from UI anyway):', err.message);
    }
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
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Uploading to ImageKit…</span>
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
