'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, CheckCircle, Search, Sparkles, Bell, Sun, Moon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { db, type Task } from '@/lib/db';

interface HeaderProps {
  currentView: string;
  onSearchClick: () => void;
}

export default function Header({ currentView, onSearchClick }: HeaderProps) {
  const { activeTimer, pauseTaskTimer, stopTaskTimer, settings, updateSettings } = useStore();
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Hello');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timerDisplay, setTimerDisplay] = useState<string>('00:00');
  
  // Quick notifications list
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: '📅 Target due: Transient response of RC circuits (GATE ECE)', read: false },
    { id: 2, text: '🔥 Consistency Check: You are on a 7-day study streak!', read: false },
    { id: 3, text: '🎓 Revision alert: Python core decorators scheduled today', read: false },
  ]);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'midnight' : 'light';
    updateSettings({ theme: nextTheme });
  };

  // Live Clock & Greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      setDateStr(now.toLocaleDateString('en-US', options));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active task details when activeTimer changes
  useEffect(() => {
    let timerInt: NodeJS.Timeout;
    if (activeTimer) {
      db.tasks.get(activeTimer.taskId).then((task) => {
        if (task) setActiveTask(task);
      });

      const tick = () => {
        const totalSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000) + activeTimer.accumulatedSeconds;
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        setTimerDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };

      tick();
      timerInt = setInterval(tick, 1000);
    } else {
      setActiveTask(null);
    }

    return () => {
      if (timerInt) clearInterval(timerInt);
    };
  }, [activeTimer]);

  const viewTitles: Record<string, string> = {
    dashboard: 'Workspace Overview',
    planner: 'Daily Schedule Planner',
    subjects: 'GATE & Placement Syllabus',
    focus: 'Pomodoro Focus Deck',
    mistakes: 'Mistake Repository & Logs',
    analytics: 'Preparation Analytics & Heatmaps',
    habits: 'Habit Matrix Tracker',
    notes: 'Smart Markdown Editor',
    ai: 'AI Study Assistant',
    settings: 'System Preferences',
  };

  return (
    <header className="glass-panel w-full px-6 py-4 flex items-center justify-between gap-4 mb-6 shadow-sm">
      {/* View Title & Greetings */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{viewTitles[currentView] || 'SaiOS'}</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          {greeting}, Sai 👋 <span className="mx-1.5 text-zinc-600">|</span> {dateStr}
        </p>
      </div>

      {/* Floating Active Study Timer */}
      {activeTask && (
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-xs text-purple-300 font-medium max-w-[150px] truncate">
              Studying: {activeTask.description}
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-white tracking-wider">{timerDisplay}</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={pauseTaskTimer}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Pause Timer"
            >
              <Pause size={14} />
            </button>
            <button
              onClick={stopTaskTimer}
              className="p-1 rounded bg-emerald-500 hover:bg-emerald-400 text-white transition-colors cursor-pointer"
              title="Complete Task"
            >
              <CheckCircle size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Search, Time & Notifications */}
      <div className="flex items-center gap-4">
        {/* Search trigger */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white text-xs transition-all cursor-pointer font-sans"
        >
          <Search size={14} className="transition-transform group-hover:scale-110" />
          <span>Search tasks, notes, subjects...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/10 px-1 font-mono text-[10px] font-medium text-zinc-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Dark/Light Quick Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Light / Dark Mode"
        >
          {settings.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Live clock view */}
        <div className="hidden md:flex items-center gap-2 text-zinc-300 font-mono text-sm px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]">
          <Clock size={14} className="text-purple-400" />
          <span>{time}</span>
        </div>

        {/* Notifications interactive icon & dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
            title="System Alerts"
          >
            <Bell size={16} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl rounded-2xl p-4 z-50 text-xs text-[var(--text-primary)] space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-bold text-white">System Notifications</span>
                <button 
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                      }}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        n.read 
                          ? 'border-white/5 bg-transparent opacity-60' 
                          : 'border-purple-500/10 bg-purple-500/[0.02] hover:bg-purple-500/5'
                      }`}
                    >
                      <p className="leading-relaxed font-sans">{n.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-500">No new notifications.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
