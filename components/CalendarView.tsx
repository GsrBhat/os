'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyLog } from '@/lib/db';
import { ChevronLeft, ChevronRight, Edit3, CheckCircle, Smile, Hourglass, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function CalendarView() {
  const { addXP } = useStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // Form states for historical editor modal
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [studyHours, setStudyHours] = useState(0);
  const [mood, setMood] = useState('😊');
  const [energy, setEnergy] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(2000);
  const [proteinIntake, setProteinIntake] = useState(50);
  const [focusRating, setFocusRating] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [wins, setWins] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [reflection, setReflection] = useState('');
  const [tomorrowGoals, setTomorrowGoals] = useState('');

  // DB queries
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray(), []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get days in the active month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Pad columns for days of previous month
  const padDays = Array.from({ length: firstDayIndex });
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayClick = async (dayNum: number) => {
    const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    
    // Fetch day log from IndexedDB
    let log = await db.dailyLogs.get(formattedDate);
    if (!log) {
      // Create a blank log placeholder so the user can edit it
      log = {
        date: formattedDate,
        studyHours: 0,
        mood: '😊',
        energy: 5,
        sleepHours: 7,
        waterIntake: 2000,
        proteinIntake: 50,
        workout: false,
        focusRating: 5,
        stressLevel: 5,
        notes: '',
        wins: '',
        mistakes: '',
        reflection: '',
        tomorrowGoals: '',
        productivityScore: 0,
        skippedTasksCount: 0,
        completedTasksCount: 0
      };
    }

    setSelectedLog(log);
    setStudyHours(log.studyHours);
    setMood(log.mood);
    setEnergy(log.energy);
    setSleepHours(log.sleepHours);
    setWaterIntake(log.waterIntake);
    setProteinIntake(log.proteinIntake);
    setFocusRating(log.focusRating);
    setStressLevel(log.stressLevel);
    setNotes(log.notes);
    setWins(log.wins);
    setMistakes(log.mistakes);
    setReflection(log.reflection);
    setTomorrowGoals(log.tomorrowGoals);
    setShowEditor(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    // Calculate productivity score: (focusRating * 4) + (studyHours/dailyTarget * 60)
    const prodScore = Math.min(100, Math.round((focusRating * 4) + (Math.min(1, studyHours / 6) * 60)));

    const updatedLog: DailyLog = {
      ...selectedLog,
      studyHours,
      mood,
      energy,
      sleepHours,
      waterIntake,
      proteinIntake,
      focusRating,
      stressLevel,
      notes,
      wins,
      mistakes,
      reflection,
      tomorrowGoals,
      productivityScore: prodScore
    };

    await db.dailyLogs.put(updatedLog);
    addXP(10); // +10 XP for updating history logs
    setShowEditor(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Calendar Header with Navigation */}
      <div className="glass-panel p-4 flex justify-between items-center border border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-purple-400" size={18} />
          <span className="text-sm font-bold text-white tracking-wide">
            {monthNames[currentMonth]} {currentYear}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
        
        {/* Days of Week header */}
        <div className="grid grid-cols-7 gap-3 mb-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-3">
          
          {/* Pad leading days */}
          {padDays.map((_, idx) => (
            <div key={`pad-${idx}`} className="h-20 rounded-xl bg-transparent" />
          ))}

          {/* Actual Month Days */}
          {calendarDays.map((dayNum) => {
            const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const log = allLogs?.find((l) => l.date === formattedDate);
            const isToday = formattedDate === '2026-07-10'; // Core today's date

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.03] cursor-pointer group ${
                  isToday 
                    ? 'bg-purple-500/10 border-purple-500 shadow-md' 
                    : log && log.studyHours > 0 
                    ? 'bg-emerald-500/[0.02] border-emerald-500/20 hover:border-emerald-500/40' 
                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold font-mono ${isToday ? 'text-purple-400' : 'text-zinc-300'}`}>
                    {dayNum}
                  </span>
                  {log && log.mood && (
                    <span className="text-xs" title={`Mood: ${log.mood}`}>{log.mood}</span>
                  )}
                </div>

                {log && log.studyHours > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono">
                      <Hourglass size={8} className="text-emerald-400" />
                      <span>{log.studyHours} hrs</span>
                    </div>
                    {/* Tiny mini-progress bar */}
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (log.studyHours / 6) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-[8px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    No log
                  </span>
                )}
              </div>
            );
          })}

        </div>

      </div>

      {/* Daily History Editor Modal */}
      {showEditor && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 border border-white/10 bg-zinc-950 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">
                Edit Historical Log: {selectedLog.date}
              </h3>
              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
                SaiOS History Engine
              </span>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 font-sans text-xs">
              
              {/* Row 1: Study hours, Sleep hours, Mood */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">STUDY HOURS</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="24"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">SLEEP HOURS</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">DAILY MOOD</label>
                  <select 
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-zinc-300 font-sans cursor-pointer"
                  >
                    <option value="😊">😊 Productive</option>
                    <option value="😄">😄 Energetic</option>
                    <option value="😐">😐 Neutral</option>
                    <option value="😞">😞 Sluggish</option>
                    <option value="😴">😴 Tired</option>
                    <option value="😎">😎 Motivated</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Water, Protein, Focus rating */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">WATER (ML)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="100"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">PROTEIN (GRAMS)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={proteinIntake}
                    onChange={(e) => setProteinIntake(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">FOCUS QUALITY (1-10)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    value={focusRating}
                    onChange={(e) => setFocusRating(parseInt(e.target.value) || 5)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Text areas for reflection, wins, mistakes */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">WINS OF THE DAY</label>
                <textarea 
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="What went well today?"
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">MISTAKES & CONCEPTUAL SLIPS</label>
                <textarea 
                  value={mistakes}
                  onChange={(e) => setMistakes(e.target.value)}
                  placeholder="Any math errors, focus drops, or distractions?"
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">REFLECTION & REVIEW</label>
                <textarea 
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Summary of today's study block..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Save Log changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
