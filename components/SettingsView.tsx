'use client';

import React, { useRef } from 'react';
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
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsView() {
  const { settings, updateSettings, addXP } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        tasks: await db.tasks.toArray(),
        dailyLogs: await db.dailyLogs.toArray(),
        subjects: await db.subjects.toArray(),
        topics: await db.topics.toArray(),
        mistakes: await db.mistakes.toArray(),
        notes: await db.notes.toArray(),
        habits: await db.habits.toArray(),
        pomodoroLogs: await db.pomodoroLogs.toArray(),
        goals: await db.goals.toArray()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `saios_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      addXP(10); // +10 XP for running backup maintenance
      confetti({ particleCount: 50, spread: 40 });
    } catch (err) {
      console.error('Backup failed', err);
      alert('Backup failed to compile.');
    }
  };

  // Restore database tables from JSON backup file
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          // Clear all Dexie tables
          await db.tasks.clear();
          await db.dailyLogs.clear();
          await db.subjects.clear();
          await db.topics.clear();
          await db.mistakes.clear();
          await db.notes.clear();
          await db.habits.clear();
          await db.pomodoroLogs.clear();
          await db.goals.clear();

          // Load restored data
          if (data.tasks.length) await db.tasks.bulkAdd(data.tasks);
          if (data.dailyLogs.length) await db.dailyLogs.bulkAdd(data.dailyLogs);
          if (data.subjects.length) await db.subjects.bulkAdd(data.subjects);
          if (data.topics.length) await db.topics.bulkAdd(data.topics);
          if (data.mistakes.length) await db.mistakes.bulkAdd(data.mistakes);
          if (data.notes.length) await db.notes.bulkAdd(data.notes);
          if (data.habits.length) await db.habits.bulkAdd(data.habits);
          if (data.pomodoroLogs.length) await db.pomodoroLogs.bulkAdd(data.pomodoroLogs);
          if (data.goals.length) await db.goals.bulkAdd(data.goals);

          alert('SaiOS database successfully restored from JSON file.');
          window.location.reload(); // Refresh to reload state
        }
      } catch (err) {
        alert('Failed to restore. Please ensure this is a valid SaiOS JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Clear Database completely
  const handleClearDatabase = async () => {
    if (confirm('WARNING: This will permanently wipe all local study logs, notes, subjects, and habits. Your progress will be reset and you will return to the onboarding setup. Proceed?')) {
      await db.tasks.clear();
      await db.dailyLogs.clear();
      await db.subjects.clear();
      await db.topics.clear();
      await db.mistakes.clear();
      await db.notes.clear();
      await db.habits.clear();
      await db.pomodoroLogs.clear();
      await db.goals.clear();
      
      localStorage.clear();
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
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  settings.theme === theme.id 
                    ? 'border-purple-500 bg-purple-500/10 text-white' 
                    : 'border-white/5 bg-zinc-950/20 hover:bg-white/[0.02] text-zinc-400'
                }`}
              >
                <span>{theme.label}</span>
                <div className={`w-4 h-4 rounded-full border border-white/10 ${theme.class}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Global Animation settings */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Sliders size={16} className="text-blue-400" />
            <span>UI Settings</span>
          </h3>
          
          <div className="flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-white">Animations & Transitions</div>
              <div className="text-[10px] text-zinc-500">Toggle floating effects and sliders</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={settings.animations}
                onChange={(e) => updateSettings({ animations: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

      </div>

      {/* Column 2: System Data & Cloud Sync */}
      <div className="space-y-6">
        
        {/* One Click Backup & Restore */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Database size={16} className="text-emerald-400" />
            <span>Database Management</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Export */}
            <button
              id="export-backup-btn"
              onClick={handleExportBackup}
              className="flex items-center gap-2 p-3 justify-center rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-white/[0.03] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Export Backup</span>
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 p-3 justify-center rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-white/[0.03] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Upload size={14} className="text-blue-400" />
              <span>Restore Backup</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>

          <div className="mt-4 border-t border-white/5 pt-4">
            <button
              onClick={handleClearDatabase}
              className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Reset All Progress (Start Fresh)</span>
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Key size={16} className="text-amber-400" />
            <span>API Credentials</span>
          </h3>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 mb-1">GEMINI AI API KEY</label>
            <input 
              type="password" 
              value={settings.geminiApiKey}
              onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
              placeholder="AI-assistant capability trigger"
              className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
            <span className="text-[9px] text-zinc-500 mt-1 block">Plug in key to enable chatbot answers & quizzes. Keys are saved locally.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
