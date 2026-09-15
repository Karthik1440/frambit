import React, { useState } from 'react';
import { ArrowLeft, Download, Play, Video, CheckCircle2, Share2, Sparkles, FileText } from 'lucide-react';

export default function ReceiveMediaView({ onNavigate, shooter = null, deliveredFiles = [] }) {
  const [activeMedia, setActiveMedia] = useState(deliveredFiles[0] || null);

  const handleDownload = (file) => {
    alert(`Downloading ${file.title} (${file.file_size})...`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('my_bookings')} className="p-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Delivered Media Vault</h1>
              <p className="text-xs text-slate-500 font-medium">Shoot delivered by {shooter?.display_name || shooter?.name || 'Creator'}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Delivered &amp; Verified
          </span>
        </div>

        {/* Empty State */}
        {deliveredFiles.length === 0 && (
          <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Video className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-black text-slate-800">No Media Delivered Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              The creator hasn't uploaded your delivered files yet. Check back after the shoot is marked complete.
            </p>
          </div>
        )}

        {/* Video Player Preview Stage */}
        {activeMedia && (
        <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative group">
          {activeMedia.video_url ? (
            <div className="relative aspect-[9/16] sm:aspect-video w-full max-h-[420px] bg-black flex items-center justify-center">
              <video
                src={activeMedia.video_url}
                poster={activeMedia.thumbnail || undefined}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <FileText className="w-12 h-12 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">{activeMedia.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeMedia.format} • {activeMedia.file_size}</p>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">{activeMedia.category}</span>
              <h3 className="text-base font-extrabold text-white">{activeMedia.title}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Delivered on {activeMedia.delivered_at} • {activeMedia.file_size}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(activeMedia)}
                className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
              <button
                onClick={() => alert('Shareable media link copied to clipboard!')}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Delivered Media Files List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900">All Delivered Assets ({deliveredFiles.length})</h2>
            <button
              onClick={() => alert('Downloading zip bundle of all media files...')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Download All (.zip)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {deliveredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setActiveMedia(file)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center group ${
                  activeMedia?.id === file.id
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                  <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover" />
                  {file.video_url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {file.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">{file.file_size}</p>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full inline-block mt-1">
                    {file.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <h3 className="text-sm font-extrabold text-white">Satisfied with your delivered reels?</h3>
            <p className="text-xs text-slate-300 font-medium">Leave a review for {shooter?.display_name || shooter?.name || 'this creator'} to support their creator profile!</p>
          </div>
          <button
            onClick={() => onNavigate('review_rating')}
            className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-2xl shrink-0 shadow-md"
          >
            Leave Review
          </button>
        </div>

      </div>
    </div>
  );
}
