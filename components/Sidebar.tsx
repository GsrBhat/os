'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Calendar,
  GraduationCap, 
  Timer, 
  AlertTriangle, 
  BarChart3, 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Coins,
  LogOut
} from 'lucide-react';
import { useStore } from '@/lib/store';

export type ViewType = 
  | 'dashboard' 
  | 'planner' 
  | 'calendar'
  | 'subjects' 
  | 'focus' 
  | 'mistakes' 
  | 'analytics' 
  | 'habits' 
  | 'notes' 
  | 'ai' 
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ currentView, setView, collapsed, setCollapsed }: SidebarProps) {
  const { xp, level, coins } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Daily Planner', icon: CalendarRange },
    { id: 'calendar', label: 'History Calendar', icon: Calendar },
    { id: 'subjects', label: 'Subject Tracker', icon: GraduationCap },
    { id: 'focus', label: 'Focus Mode', icon: Timer },
    { id: 'mistakes', label: 'Mistake Repo', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'habits', label: 'Habit Tracker', icon: CheckSquare },
    { id: 'notes', label: 'Smart Notes', icon: BookOpen },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside 
      className={`glass-panel fixed top-4 bottom-4 left-4 z-40 flex flex-col justify-between py-6 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo & Collapse */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-8">
          {!collapsed && (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
                A
              </div>
              <span className="text-xl font-bold tracking-wider gradient-text font-sans">AetherOS</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg mx-auto">
              A
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Gamified Level Indicator */}
        <div className={`mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-xs font-bold font-mono">Lvl {level}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy size={16} className="text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-300">Level {level}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins size={14} className="text-yellow-400" />
                  <span className="text-xs font-mono font-bold text-yellow-400">{coins}</span>
                </div>
              </div>
              {/* XP Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${xp % 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>{xp % 100} XP</span>
                <span>100 XP</span>
              </div>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 select-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white border-l-2 border-purple-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-purple-400' : 'text-zinc-400'} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Log Out & System Status */}
      <div className="px-4 space-y-3">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to log out of your study workspace?')) {
              localStorage.removeItem('aetheros_current_user');
              window.location.reload();
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut size={14} />
          {!collapsed && <span>Log Out</span>}
        </button>

        {!collapsed ? (
          <div className="text-[10px] text-zinc-500 font-mono space-y-0.5 text-center">
            <p>System Version: 1.0.0</p>
            <p>IndexedDB: Scoped</p>
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto animate-pulse" title="System Scoped" />
        )}
      </div>
    </aside>
  );
}
