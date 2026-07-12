'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Hourglass, 
  Trophy, 
  Flame, 
  Target, 
  Activity, 
  Clock, 
  Zap, 
  Plus, 
  BrainCircuit, 
  CheckCircle2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Settings,
  BookOpen,
  Trash,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { db, type Task, type DailyLog, type Goal, type Countdown } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

interface DashboardViewProps {
  setView: (view: any) => void;
  onAddTaskClick: () => void;
}

export default function DashboardView({ setView, onAddTaskClick }: DashboardViewProps) {
  const { activeWorkspaceId, addXP } = useStore();
  const todayStr = '2026-07-10'; // Local system date anchor

  // Scoped queries
  const todayTasks = useLiveQuery(() => 
    db.tasks.where('date').equals(todayStr).and(t => t.workspaceId === activeWorkspaceId).toArray(),
    [activeWorkspaceId]
  ) || [];

  const todayLog = useLiveQuery(() => db.dailyLogs.get(todayStr)) || null;
  
  const allLogs = useLiveQuery(() => 
    db.dailyLogs.toArray() // Logs are historical, we show overall stats in analytics
  ) || [];

  const subjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const dbGoals = useLiveQuery(() => 
    db.goals.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const dbCountdowns = useLiveQuery(() => 
    db.countdowns.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const dbHabits = useLiveQuery(() => 
    db.habits.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  // Local settings & states
  const [userName, setUserName] = useState('User');
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState<Record<string, boolean>>({
    planner: true,
    goals: true,
    countdowns: true,
    analytics: true,
    habits: true,
    ai: true
  });

  // Countdown creations
  const [showAddCountdown, setShowAddCountdown] = useState(false);
  const [newCdTitle, setNewCdTitle] = useState('');
  const [newCdDate, setNewCdDate] = useState('2026-12-31');

  // Goal creations
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('2026-12-31');
  const [newGoalPriority, setNewGoalPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newGoalParentId, setNewGoalParentId] = useState<number | undefined>(undefined);

  // Load configuration
  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    setUserName(user.charAt(0).toUpperCase() + user.slice(1));

    const savedWidgets = localStorage.getItem(`aetheros_dashboard_widgets_${user}`);
    if (savedWidgets) {
      setEnabledWidgets(JSON.parse(savedWidgets));
    }
  }, [activeWorkspaceId]);

  // Save layout configurations
  const handleToggleWidget = (widgetKey: string) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    const updated = { ...enabledWidgets, [widgetKey]: !enabledWidgets[widgetKey] };
    setEnabledWidgets(updated);
    localStorage.setItem(`aetheros_dashboard_widgets_${user}`, JSON.stringify(updated));
  };

  // Streaks computations
  useEffect(() => {
    if (!allLogs || allLogs.length === 0) return;
    const sortedLogs = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
    
    let tempStreak = 0;
    let maxStreak = 0;
    sortedLogs.forEach(log => {
      if (log.studyHours > 0) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    setStreak({ current: tempStreak, longest: maxStreak });
  }, [allLogs]);

  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter(t => t.status === 'completed').length;
  const remainingTasks = totalTasks - completedTasks;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const studyHours = todayLog?.studyHours || 0;
  const overallPrepScore = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, s) => sum + s.completionPercent, 0) / subjects.length)
    : 0;

  const calculateDaysLeft = (targetDateStr: string) => {
    const today = new Date(todayStr);
    const target = new Date(targetDateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleCreateCountdown = async () => {
    if (newCdTitle.trim()) {
      await db.countdowns.add({
        workspaceId: activeWorkspaceId || 1,
        title: newCdTitle.trim(),
        date: newCdDate,
        icon: 'Hourglass',
        color: 'purple'
      });
      setNewCdTitle('');
      setShowAddCountdown(false);
    }
  };

  const handleDeleteCountdown = async (id: number) => {
    await db.countdowns.delete(id);
  };

  const handleCreateGoal = async () => {
    if (newGoalTitle.trim()) {
      await db.goals.add({
        workspaceId: activeWorkspaceId || 1,
        title: newGoalTitle.trim(),
        description: 'Dynamic learning goal target.',
        icon: 'Target',
        color: 'purple',
        targetDate: newGoalDate,
        priority: newGoalPriority,
        parentId: newGoalParentId,
        progress: 0
      });
      setNewGoalTitle('');
      setNewGoalParentId(undefined);
      setShowAddGoal(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    await db.goals.delete(id);
  };

  // Build Hierarchical Goals Tree
  const renderGoalNode = (goal: Goal, level = 0) => {
    const subGoals = dbGoals.filter(g => g.parentId === goal.id);
    return (
      <div key={goal.id} className="space-y-2" style={{ paddingLeft: `${level * 16}px` }}>
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-white/[0.01] transition-all group">
          <div className="flex items-center gap-2 truncate">
            <Target size={14} className="text-purple-400 shrink-0" />
            <span className="font-semibold text-xs text-white truncate">{goal.title}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
              goal.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              {goal.priority}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold font-mono text-purple-300">{goal.progress}%</span>
            <button 
              onClick={() => handleDeleteGoal(goal.id!)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5 cursor-pointer"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>
        {subGoals.map(sub => renderGoalNode(sub, level + 1))}
      </div>
    );
  };

  const rootGoals = dbGoals.filter(g => !g.parentId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Quick Controls */}
      <div className="glass-panel p-5 border border-purple-500/10 bg-gradient-to-r from-purple-500/[0.02] to-blue-500/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Good Evening, {userName} 👋</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-sans">
            <span className="flex items-center gap-1 text-orange-400">
              <Flame size={14} className="fill-orange-400/20" />
              <strong>{streak.current} Day Streak</strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span>Planner Target: <strong>{totalTasks} tasks</strong></span>
            <span className="text-zinc-700">|</span>
            <span>{remainingTasks > 0 ? `${remainingTasks} pending` : 'Schedules completed!'}</span>
          </div>
        </div>

        {/* Layout Preferences Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors cursor-pointer"
          >
            <Settings size={14} />
            <span>Customize Dashboard</span>
          </button>
        </div>
      </div>

      {/* Widget Customization Tray */}
      {showConfig && (
        <div className="glass-panel p-4 border border-white/5 bg-zinc-950/40 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Toggle Active Dashboard Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(enabledWidgets).map(key => (
              <button
                key={key}
                onClick={() => handleToggleWidget(key)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  enabledWidgets[key]
                    ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                    : 'border-white/5 bg-zinc-950/20 text-zinc-500 hover:border-white/10'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Dynamic Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">

        {/* 1. Today's Progress Card */}
        {enabledWidgets.planner && (
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[220px]">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-400" />
                <span>Today&apos;s Progress</span>
              </h3>
              
              <div className="flex items-center gap-6 my-2">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="40" className="stroke-purple-500" strokeWidth="6" fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - taskProgressPercent / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold font-mono text-white">{taskProgressPercent}%</span>
                </div>
                <div className="text-xs space-y-1 text-zinc-400">
                  <p>Completed: <strong className="text-white font-mono">{completedTasks} done</strong></p>
                  <p>Pending: <strong className="text-zinc-500 font-mono">{remainingTasks} left</strong></p>
                  <p>Study duration: <strong className="text-purple-400 font-mono">{studyHours}h focus</strong></p>
                </div>
              </div>

              {/* Quick Daily Tracker Checklist (Tick/Untick Progress) */}
              {todayTasks.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <button
                          onClick={async () => {
                            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                            await db.tasks.update(task.id!, { status: newStatus });
                            if (newStatus === 'completed') addXP(15);
                          }}
                          className="text-zinc-500 hover:text-purple-400 transition-colors shrink-0"
                        >
                          <span className="w-4 h-4 rounded border border-white/10 flex items-center justify-center bg-zinc-900 text-white cursor-pointer">
                            {task.status === 'completed' && <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" />}
                          </span>
                        </button>
                        <span className={`text-[11px] truncate ${
                          task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-300'
                        }`}>
                          {task.description}
                        </span>
                      </div>
                      <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-bold font-mono ${
                        task.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setView('planner')}
              className="w-full mt-4 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <span>Open Planner Checklist</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* 2. Countdowns Widget */}
        {enabledWidgets.countdowns && (
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hourglass size={14} className="text-blue-400" />
                  <span>Countdown Clocks</span>
                </h3>
                <button 
                  onClick={() => setShowAddCountdown(!showAddCountdown)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>

              {/* Add Countdown Form */}
              {showAddCountdown && (
                <div className="p-3 rounded-xl border border-white/5 bg-zinc-950 space-y-2 mb-3 animate-in slide-in-from-top-2 duration-150">
                  <input
                    type="text"
                    value={newCdTitle}
                    onChange={(e) => setNewCdTitle(e.target.value)}
                    placeholder="Deadline name"
                    className="w-full p-2 rounded-lg border border-white/5 bg-zinc-900 text-[11px] text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newCdDate}
                      onChange={(e) => setNewCdDate(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-white/5 bg-zinc-900 text-[11px] text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button 
                      onClick={handleCreateCountdown}
                      className="px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {dbCountdowns.length > 0 ? (
                  dbCountdowns.map(cd => (
                    <div key={cd.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-zinc-950/20 group">
                      <div>
                        <p className="font-semibold text-xs text-white">{cd.title}</p>
                        <span className="text-[9px] text-zinc-500 font-mono">Target: {cd.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-blue-400">{calculateDaysLeft(cd.date)} days</span>
                        <button 
                          onClick={() => handleDeleteCountdown(cd.id!)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-0.5 cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-[11px]">No custom countdowns configured.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Goals Widget */}
        {enabledWidgets.goals && (
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-purple-400" />
                  <span>Goals Hierarchy</span>
                </h3>
                <button 
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Goal</span>
                </button>
              </div>

              {/* Add Goal Form */}
              {showAddGoal && (
                <div className="p-3 rounded-xl border border-white/5 bg-zinc-950 space-y-2 mb-3 animate-in slide-in-from-top-2 duration-150">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Goal Title"
                    className="w-full p-2 rounded-lg border border-white/5 bg-zinc-900 text-[11px] text-white focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newGoalParentId || ''}
                      onChange={(e) => setNewGoalParentId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="flex-1 p-2 rounded-lg border border-white/5 bg-zinc-900 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      <option value="">No Parent (Root)</option>
                      {dbGoals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleCreateGoal}
                      className="px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {rootGoals.length > 0 ? (
                  rootGoals.map(g => renderGoalNode(g))
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-[11px]">No workspace goals logged.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Summary/Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        
        {/* Habit Widget */}
        {enabledWidgets.habits && (
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01]">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              <span>Workspace Habits Tracker</span>
            </h3>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {dbHabits.length > 0 ? (
                dbHabits.map(h => (
                  <div key={h.id} className="flex justify-between items-center p-2.5 rounded-xl border border-white/5 bg-zinc-950/20">
                    <span className="text-xs font-semibold text-white">{h.name}</span>
                    <div className="flex gap-1.5">
                      {/* Standard 5 Day tracker indicators */}
                      {[1, 2, 3, 4, 5].map(day => (
                        <div key={day} className={`w-3.5 h-3.5 rounded-full border border-white/5 bg-zinc-900 cursor-pointer hover:bg-emerald-500/30`} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">No habits configured. Create habits in the Habits tab!</div>
              )}
            </div>
          </div>
        )}

        {/* AI Tickers Advice Widget */}
        {enabledWidgets.ai && (
          <div className="glass-panel p-5 border border-purple-500/10 bg-purple-500/[0.01] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
                <BrainCircuit size={14} />
                <span>AI Productivity Coach Insights</span>
              </h3>
              
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 font-sans leading-relaxed select-none">
                💡 <strong>Dynamic Recommendation</strong>: Based on your current workspace targets, you should study React modules for 45 minutes today to balance your weekly study hour pacing. Revisions for Calculus are due in 2 days.
              </div>
            </div>
            <button
              onClick={() => setView('ai')}
              className="w-full mt-4 flex items-center justify-center gap-1 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-xs font-bold text-purple-300 transition-colors cursor-pointer"
            >
              <span>Ask AI Coach</span>
              <Sparkles size={14} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
