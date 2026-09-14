import React, { useState } from 'react';
import { ArrowLeft, Save, Clock, CheckCircle2 } from 'lucide-react';

export default function AvailabilityView({ onNavigate }) {
  const [schedule, setSchedule] = useState([
    { day: 'Monday', active: true, start: '09:00 AM', end: '06:00 PM' },
    { day: 'Tuesday', active: true, start: '09:00 AM', end: '06:00 PM' },
    { day: 'Wednesday', active: true, start: '09:00 AM', end: '06:00 PM' },
    { day: 'Thursday', active: true, start: '09:00 AM', end: '06:00 PM' },
    { day: 'Friday', active: true, start: '09:00 AM', end: '06:00 PM' },
    { day: 'Saturday', active: true, start: '10:00 AM', end: '04:00 PM' },
    { day: 'Sunday', active: false, start: '10:00 AM', end: '04:00 PM' },
  ]);

  const [isSaved, setIsSaved] = useState(false);

  const toggleDay = (index) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, active: !item.active } : item))
    );
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 animate-fade-in relative">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('dashboard')} className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900">Set Availability</h1>
                <p className="text-xs text-slate-500 font-medium">Manage weekly shooting slots for client booking</p>
              </div>
            </div>
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          {/* Schedule Days List */}
          <div className="space-y-3">
            {schedule.map((item, idx) => (
              <div
                key={item.day}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.active ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <button
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`w-12 h-6.5 rounded-full transition-colors p-1 flex items-center shrink-0 ${
                      item.active ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                  </button>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 w-24">{item.day}</span>
                </div>

                {item.active ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{item.start}</span>
                    <span>to</span>
                    <span>{item.end}</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">Not Available</span>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleSave}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
