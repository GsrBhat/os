'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  Trophy,
  Coins,
  LogOut
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

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
  const { xp, level, coins, activeWorkspaceId, changeWorkspace } = useStore();
  
  // Workspace UI states
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  // Fetch workspaces list
  const workspaces = useLiveQuery(() => db.workspaces.toArray()) || [];
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

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
      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto px-4 select-none scrollbar-thin">
        <div className="flex items-center justify-between mb-6">
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

        {/* Dynamic Workspace Selector Dropdown */}
        {!collapsed && activeWorkspace && (
          <div className="relative px-2 mb-6">
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-zinc-950/30 hover:bg-white/[0.02] transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                  {activeWorkspace.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-zinc-200 truncate">{activeWorkspace.name}</span>
              </div>
              <ChevronDown size={14} className="text-zinc-500 shrink-0" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-2 right-2 mt-1.5 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      changeWorkspace(ws.id!);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                      ws.id === activeWorkspaceId 
                        ? 'bg-purple-600 text-white font-bold' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded bg-purple-500/10 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {ws.name.charAt(0)}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
                
                <div className="border-t border-white/5 pt-1.5 mt-1">
                  <button
                    onClick={() => {
                      setShowWorkspaceDropdown(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                  >
                    + Create Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${xp % 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>{xp % 100} XP</span>
                <span>100 XP</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-purple-500/10 border border-purple-500/20 text-white font-bold shadow-md shadow-purple-500/5' 
                    : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={item.label}
              >
                <Icon size={16} className={isActive ? 'text-purple-400' : 'text-zinc-400'} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Log Out & System Status */}
      <div className="px-4 mt-4 shrink-0 space-y-3">
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
            <p>System Version: 2.0.0</p>
            <p>IndexedDB: Scoped</p>
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto animate-pulse" title="System Scoped" />
        )}
      </div>

      {/* Workspace Creation Modal popup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-5 border border-white/10 bg-zinc-900/90 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Workspace</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. UPSC Preparation"
                  className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Workspace goals and topics..."
                  className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 h-16 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={async () => {
                  if (newWsName.trim()) {
                    const newId = await db.workspaces.add({
                      name: newWsName.trim(),
                      icon: 'GraduationCap',
                      color: 'purple',
                      description: newWsDesc.trim(),
                      createdAt: new Date().toISOString()
                    });
                    changeWorkspace(newId as number);
                    setNewWsName('');
                    setNewWsDesc('');
                    setShowCreateModal(false);
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer text-center"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
