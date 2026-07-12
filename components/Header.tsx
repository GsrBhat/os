'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, CheckCircle, Search, Sparkles, Bell, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { useStore } from '@/lib/store';
import { db, type Task } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface HeaderProps {
  currentView: string;
  setView?: (view: any) => void;
  onSearchClick: () => void;
}

export default function Header({ currentView, setView, onSearchClick }: HeaderProps) {
  const { activeTimer, pauseTaskTimer, stopTaskTimer, settings, updateSettings, activeWorkspaceId } = useStore();
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

  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch workspaces list
  const workspaces = useLiveQuery(() => db.workspaces.toArray()) || [];
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  // Resize listener for responsive layout checks
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside listener for notifications card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch active user credentials
  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user');
    if (user) {
      setUserName(user.charAt(0).toUpperCase() + user.slice(1));
      const usersStr = localStorage.getItem('aetheros_users') || '[]';
      const users = JSON.parse(usersStr) as { username: string; email?: string }[];
      const activeUserObj = users.find(u => u.username === user);
      if (activeUserObj && activeUserObj.email) {
        setUserEmail(activeUserObj.email);
      } else {
        setUserEmail(`${user}@aetheros.dev`);
      }
    }
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (userEmail) {
      setToastMsg(`Forwarded alerts to ${userEmail}`);
      console.log(
        `%c[AetherOS SMTP Simulated Mailer]%c\nTo: ${userEmail}\nSubject: Notification Alert Summary\nBody: You marked your daily alerts as read.\n---------------------------------------`,
        'color: #a855f7; font-weight: bold;',
        'color: #94a3b8;'
      );
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleMarkOneRead = (id: number) => {
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
    if (userEmail) {
      setToastMsg(`Forwarded updates to ${userEmail}`);
      console.log(
        `%c[AetherOS SMTP Simulated Mailer]%c\nTo: ${userEmail}\nSubject: Single Notification Cleared\nBody: Notification ID ${id} was marked as read.\n---------------------------------------`,
        'color: #a855f7; font-weight: bold;',
        'color: #94a3b8;'
      );
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

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
    <header className="glass-panel w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4 mb-4 md:mb-6 shadow-sm">
      {/* View Title & Greetings */}
      <div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
          <span>{viewTitles[currentView] || 'AetherOS'}</span>
          {activeWorkspace && (
            <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg font-normal font-sans">
              {activeWorkspace.name}
            </span>
          )}
        </h1>
        <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">
          {greeting}, {userName} 👋<span className="hidden sm:inline"><span className="mx-1.5 text-zinc-600">|</span>{dateStr}</span>
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
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search trigger */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white text-xs transition-all cursor-pointer font-sans"
        >
          <Search size={14} className="transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Search tasks, notes, subjects...</span>
          <span className="sm:hidden text-[10px]">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/10 px-1 font-mono text-[10px] font-medium text-zinc-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Mobile quick settings shortcut icons */}
        {isMobile && setView && (
          <>
            <button
              onClick={() => setView('settings')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                currentView === 'settings' 
                  ? 'border-purple-500 bg-purple-500/10 text-white' 
                  : 'border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="System Preferences"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to log out of your study workspace?')) {
                  localStorage.removeItem('aetheros_current_user');
                  window.location.reload();
                }
              }}
              className="p-2 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={14} />
            </button>
          </>
        )}

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
        <div className="relative" ref={notificationRef}>
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
                <span className="font-bold text-white font-sans">System Notifications</span>
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              {/* Email forwarding indicator toast */}
              {toastMsg && (
                <div className="p-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-300 text-[10px] text-center font-semibold animate-pulse font-sans">
                  {toastMsg}
                </div>
              )}
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkOneRead(n.id)}
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
