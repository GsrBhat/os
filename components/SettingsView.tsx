'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/db';
import { 
  Palette, 
  Database, 
  Key, 
  Upload, 
  Download, 
  Sparkles, 
  Trash2, 
  EyeOff, 
  Eye,
  Sliders,
  CalendarRange
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsView() {
  const { settings, updateSettings, addXP } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preparation Plan Details
  const [prepDays, setPrepDays] = useState(211);
  const [targetDate, setTargetDate] = useState('2026-08-01');
  const [dailyHours, setDailyHours] = useState(6);

  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    const savedDays = localStorage.getItem(`aetheros_prep_days_${user}`);
    const savedDate = localStorage.getItem(`aetheros_target_date_${user}`);
    const savedHours = localStorage.getItem(`aetheros_daily_hours_${user}`);

    if (savedDays) setPrepDays(parseInt(savedDays, 10));
    if (savedDate) setTargetDate(savedDate);
    if (savedHours) setDailyHours(parseInt(savedHours, 10));
  }, []);

  const handleUpdatePlan = (days: number, date: string, hours: number) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    setPrepDays(days);
    setTargetDate(date);
    setDailyHours(hours);
    localStorage.setItem(`aetheros_prep_days_${user}`, days.toString());
    localStorage.setItem(`aetheros_target_date_${user}`, date);
    localStorage.setItem(`aetheros_daily_hours_${user}`, hours.toString());
  };

  // Theme presets
  const themes = [
    { id: 'midnight', label: 'Midnight Bloom', class: 'bg-[#020205] border-[#a855f7]/30 text-purple-400' },
    { id: 'dark', label: 'Zinc Dark', class: 'bg-[#09090b] border-zinc-700 text-zinc-300' },
    { id: 'blue', label: 'Ocean Blue', class: 'bg-[#030712] border-blue-500/30 text-blue-400' },
    { id: 'purple', label: 'Deep Lavender', class: 'bg-[#090514] border-pink-500/30 text-pink-400' },
    { id: 'light', label: 'Clean Light', class: 'bg-white border-zinc-200 text-zinc-800' }
  ] as const;

  // Export database tables as single JSON file
  const handleExportBackup = async () => {
    try {
      const backupData = {
        workspaces: await db.workspaces.toArray(),
        widgets: await db.widgets.toArray(),
        tasks: await db.tasks.toArray(),
        dailyLogs: await db.dailyLogs.toArray(),
        subjects: await db.subjects.toArray(),
        topics: await db.topics.toArray(),
        mistakes: await db.mistakes.toArray(),
        notes: await db.notes.toArray(),
        habits: await db.habits.toArray(),
        pomodoroLogs: await db.pomodoroLogs.toArray(),
        goals: await db.goals.toArray(),
        countdowns: await db.countdowns.toArray()
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AetherOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addXP(10); // +10 XP for backing up database
      
      // Trigger short success feedback
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.9 }
      });
    } catch (err) {
      alert('Failed to export backup: ' + err);
    }
  };

  // Restore database tables from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.subjects || !data.tasks || !data.dailyLogs) {
          throw new Error('Invalid schema format');
        }

        if (confirm('Importing this file will overwrite all existing local database data. Proceed?')) {
          await db.workspaces.clear();
          await db.widgets.clear();
          await db.tasks.clear();
          await db.dailyLogs.clear();
          await db.subjects.clear();
          await db.topics.clear();
          await db.mistakes.clear();
          await db.notes.clear();
          await db.habits.clear();
          await db.pomodoroLogs.clear();
          await db.goals.clear();
          await db.countdowns.clear();

          // Load restored data
          if (data.workspaces?.length) await db.workspaces.bulkAdd(data.workspaces);
          if (data.widgets?.length) await db.widgets.bulkAdd(data.widgets);
          if (data.tasks.length) await db.tasks.bulkAdd(data.tasks);
          if (data.dailyLogs.length) await db.dailyLogs.bulkAdd(data.dailyLogs);
          if (data.subjects.length) await db.subjects.bulkAdd(data.subjects);
          if (data.topics.length) await db.topics.bulkAdd(data.topics);
          if (data.mistakes.length) await db.mistakes.bulkAdd(data.mistakes);
          if (data.notes.length) await db.notes.bulkAdd(data.notes);
          if (data.habits.length) await db.habits.bulkAdd(data.habits);
          if (data.pomodoroLogs.length) await db.pomodoroLogs.bulkAdd(data.pomodoroLogs);
          if (data.goals.length) await db.goals.bulkAdd(data.goals);
          if (data.countdowns?.length) await db.countdowns.bulkAdd(data.countdowns);

          alert('AetherOS database successfully restored from JSON file.');
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to restore. Please ensure this is a valid AetherOS JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Clear Database completely
  const handleClearDatabase = async () => {
    if (confirm('WARNING: This will permanently wipe all local study logs, notes, subjects, and habits. Your progress will be reset and you will return to the onboarding setup. Proceed?')) {
      await db.workspaces.clear();
      await db.widgets.clear();
      await db.tasks.clear();
      await db.dailyLogs.clear();
      await db.subjects.clear();
      await db.topics.clear();
      await db.mistakes.clear();
      await db.notes.clear();
      await db.habits.clear();
      await db.pomodoroLogs.clear();
      await db.goals.clear();
      await db.countdowns.clear();
      
      const user = localStorage.getItem('aetheros_current_user') || 'default';
      localStorage.removeItem(`aetheros_onboarded_${user}`);
      localStorage.removeItem(`aetheros_xp_${user}`);
      localStorage.removeItem(`aetheros_level_${user}`);
      localStorage.removeItem(`aetheros_coins_${user}`);
      localStorage.removeItem(`aetheros_badges_${user}`);
      localStorage.removeItem(`aetheros_prep_days_${user}`);
      localStorage.removeItem(`aetheros_target_date_${user}`);
      localStorage.removeItem(`aetheros_daily_hours_${user}`);
      
      alert('All progress has been reset. Reloading workspace...');
      window.location.reload();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300 font-sans">
      
      {/* Column 1: Appearance & UI Customizations */}
      <div className="space-y-6">
        
        {/* Color Palette theme selector */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Palette size={16} className="text-purple-400" />
            <span>Theme Selection</span>
          </h3>

          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  settings.theme === theme.id 
                    ? 'border-purple-500 bg-purple-500/10 text-white' 
                    : 'border-white/5 bg-transparent text-zinc-400 hover:bg-white/[0.01] hover:text-zinc-200'
                }`}
              >
                <span>{theme.label}</span>
                <div className={`w-3.5 h-3.5 rounded-full border border-white/10 ${theme.class.split(' ')[0]}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Study Goals schedule controls */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <CalendarRange size={16} className="text-purple-400" />
            <span>Preparation Schedule</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Daily target hours</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="2" 
                  max="12" 
                  value={dailyHours}
                  onChange={(e) => handleUpdatePlan(prepDays, targetDate, parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="font-mono font-bold text-purple-400 shrink-0 w-12">{dailyHours} hours</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Days to prepare</label>
                <input 
                  type="number" 
                  min="10" 
                  max="1000"
                  value={prepDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 30;
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    const formattedDate = d.toISOString().split('T')[0];
                    handleUpdatePlan(days, formattedDate, dailyHours);
                  }}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Target Exam date</label>
                <input 
                  type="date" 
                  value={targetDate}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    const target = new Date(dateVal);
                    const today = new Date();
                    const diffTime = target.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    handleUpdatePlan(diffDays > 0 ? diffDays : 10, dateVal, dailyHours);
                  }}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Column 2: Data Portability & Settings */}
      <div className="space-y-6">
        
        {/* Backup manager */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Database size={16} className="text-purple-400" />
            <span>Database Backup & Restore</span>
          </h3>

          <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
            All study logs, notes, and task progress remain safely stored in your browser offline. You can export a JSON backup file to import on another machine.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleExportBackup}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Export JSON Backup</span>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-transparent bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>Import Backup file</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
              className="hidden" 
              accept=".json"
            />
          </div>
        </div>

        {/* Start Fresh resets */}
        <div className="glass-panel p-5 border border-red-500/10 bg-red-500/[0.01]">
          <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            <Sliders size={16} />
            <span>Start Fresh</span>
          </h3>

          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            Instantly wipe all local database records and reset onboarding configs to start from a blank workspace slate. This action is permanent and cannot be undone.
          </p>

          <button 
            onClick={handleClearDatabase}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Wipe Local Database</span>
          </button>
        </div>

      </div>

    </div>
  );
}
