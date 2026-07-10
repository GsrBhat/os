'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Hourglass, 
  Trophy, 
  Flame, 
  Target, 
  Award, 
  Activity, 
  Clock, 
  Zap, 
  PlusCircle, 
  BrainCircuit, 
  CheckCircle2,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { db, type Task, type DailyLog } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface DashboardViewProps {
  setView: (view: any) => void;
  onAddTaskClick: () => void;
}

export default function DashboardView({ setView, onAddTaskClick }: DashboardViewProps) {
  const todayStr = '2026-07-10'; // Set to local current date

  // DB queries
  const todayTasks = useLiveQuery(() => db.tasks.where('date').equals(todayStr).toArray());
  const todayLog = useLiveQuery(() => db.dailyLogs.get(todayStr));
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray());
  const subjects = useLiveQuery(() => db.subjects.toArray());

  // Streaks and summary metrics state
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [totals, setTotals] = useState({ totalHours: 0, avgFocus: 0, consistency: 0 });
  const [prepScore, setPrepScore] = useState(0);

  const [customTargetDate, setCustomTargetDate] = useState('2026-08-01');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    const savedDate = localStorage.getItem(`aetheros_target_date_${user}`);
    if (savedDate) {
      setCustomTargetDate(savedDate);
    }
    setUserName(user.charAt(0).toUpperCase() + user.slice(1));
  }, []);

  // Countdowns details (Toned down gradients to match muted aesthetic)
  const countdowns = [
    { title: 'My Target Plan', date: customTargetDate, color: 'from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-300' },
    { title: 'Placement Season', date: '2026-08-01', color: 'from-blue-500/10 to-cyan-500/5 border-blue-500/20 text-blue-300' },
    { title: 'IELTS Goal', date: '2026-10-20', color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-300' },
    { title: 'GATE ECE 2027', date: '2027-02-06', color: 'from-rose-500/10 to-pink-500/5 border-rose-500/20 text-rose-300' }
  ];

  const calculateDaysLeft = (targetDateStr: string) => {
    const today = new Date(todayStr);
    const target = new Date(targetDateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Compute Streaks and Analytics
  useEffect(() => {
    if (!allLogs || allLogs.length === 0) return;

    // Sort logs by date ascending
    const sortedLogs = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    sortedLogs.forEach((log) => {
      if (log.studyHours > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    const reversedLogs = [...sortedLogs].reverse();
    let checkIndex = 0;
    if (reversedLogs.length > 0) {
      if (reversedLogs[0].date === todayStr && reversedLogs[0].studyHours === 0) {
        checkIndex = 1;
      }
      for (let i = checkIndex; i < reversedLogs.length; i++) {
        if (reversedLogs[i].studyHours > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreak({ current: currentStreak, longest: longestStreak });

    const totalHrs = allLogs.reduce((sum, item) => sum + item.studyHours, 0);
    const activeFocusLogs = allLogs.filter(l => l.focusRating > 0);
    const avgFcs = activeFocusLogs.length > 0 
      ? Math.round(activeFocusLogs.reduce((sum, item) => sum + item.focusRating, 0) / activeFocusLogs.length) 
      : 0;

    const productiveDays = allLogs.filter(l => l.studyHours >= 4).length;
    const consistencyRate = Math.round((productiveDays / allLogs.length) * 100) || 0;

    setTotals({ totalHours: Math.round(totalHrs * 10) / 10, avgFocus: avgFcs, consistency: consistencyRate });
  }, [allLogs]);

  // Compute overall prep score from subject progress averages
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const sumProgress = subjects.reduce((sum, s) => sum + s.completionPercent, 0);
      setPrepScore(Math.round(sumProgress / subjects.length));
    }
  }, [subjects]);

  // Compute tasks numbers
  const totalTasks = todayTasks?.length || 0;
  const completedTasks = todayTasks?.filter(t => t.status === 'completed').length || 0;
  const remainingTasks = totalTasks - completedTasks;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayHoursLogged = todayTasks?.reduce((sum, t) => sum + t.actualDuration, 0) || 0;
  const studyHours = Math.round((todayHoursLogged / 60) * 10) / 10 || todayLog?.studyHours || 0;

  const productivityScore = todayLog?.productivityScore || (
    totalTasks > 0 
      ? Math.min(100, Math.round((taskProgressPercent * 0.7) + (Math.min(1, studyHours / 6) * 30))) 
      : 0
  );

  // Gamified XP Gain Calculation
  const todayXPGain = (completedTasks * 15) + Math.round(studyHours * 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Dashboard Greeting Tickers */}
      <div className="glass-panel p-5 border border-purple-500/10 bg-gradient-to-r from-purple-500/[0.02] to-blue-500/[0.01]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Good Evening, {userName} 👋</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-sans">
              <span className="flex items-center gap-1 text-orange-400">
                <Flame size={14} className="fill-orange-400/20" />
                <strong>{streak.current} Day Streak</strong>
              </span>
              <span className="text-zinc-700">|</span>
              <span>Today&apos;s Target: <strong>{totalTasks} tasks</strong></span>
              <span className="text-zinc-700">|</span>
              <span>{remainingTasks > 0 ? `${remainingTasks} tasks pending` : 'All tasks completed!'}</span>
            </div>
          </div>
          
          {/* Hero Statistic: Overall Prep Score */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.05)] shrink-0 select-none">
            <TrendingUp className="text-purple-400" size={20} />
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Overall Preparation Score</div>
              <div className="text-xl font-extrabold font-mono text-white flex items-center gap-1.5 mt-0.5">
                <span>{prepScore}%</span>
                <span className="text-[9px] text-emerald-400 px-1 rounded bg-emerald-500/10 font-bold font-sans">Stable</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stand-out AI Insight Card */}
        <div className="mt-4 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 leading-relaxed font-sans flex items-start gap-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
          <Sparkles className="text-purple-400 shrink-0 mt-0.5" size={14} />
          <div>
            <strong>AI Insight:</strong> You are behind in Network Theory by two revisions. Consider studying it before Python core tonight.
          </div>
        </div>
      </div>

      {/* 4 Countdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {countdowns.map((cd, index) => {
          const daysLeft = calculateDaysLeft(cd.date);
          return (
            <div 
              key={index}
              className={`relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br ${cd.color} shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.02] rounded-full translate-x-6 -translate-y-6 pointer-events-none" />
              <div className="text-[10px] uppercase tracking-wider font-mono opacity-70">{cd.title}</div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight font-mono">{daysLeft}</span>
                <span className="text-xs opacity-85">days left</span>
              </div>
              <div className="mt-1.5 text-[9px] opacity-60 font-sans">Deadline: {new Date(cd.date).toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Progress Card (Optimized layout to reduce empty space) */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] col-span-1 flex flex-col justify-between hover:border-white/10 transition-colors">
          <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Today&apos;s Progress</h3>
          
          <div className="flex items-center gap-6 my-2">
            {/* SVG Progress Circle (smaller and compact) */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-zinc-900"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-purple-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={301}
                  strokeDashoffset={301 - (301 * taskProgressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-extrabold font-mono text-white">{taskProgressPercent}%</span>
            </div>

            {/* Leftover empty space now filled with useful stats */}
            <div className="flex-1 space-y-2.5 text-xs font-sans">
              <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.03]">
                <span className="text-zinc-500 font-medium">Completed:</span>
                <span className="font-bold text-white font-mono">{completedTasks} done</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.03]">
                <span className="text-zinc-500 font-medium">Pending:</span>
                <span className="font-bold text-zinc-400 font-mono">{remainingTasks} left</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.03]">
                <span className="text-zinc-500 font-medium">Study Time:</span>
                <span className="font-bold text-blue-400 font-mono">{studyHours}h focus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Today&apos;s XP:</span>
                <span className="font-bold text-amber-400 font-mono">+{todayXPGain} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel with Tiny Sparklines */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] col-span-1 lg:col-span-2 hover:border-white/10 transition-colors">
          <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Performance Engine</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            {/* Study Hours */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-blue-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Study Hours</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{studyHours}h</div>
                  <span className="text-[9px] text-zinc-500">Today&apos;s focus</span>
                </div>
                {/* Tiny Sparkline */}
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,15 L10,12 L20,17 L30,5 L40,10 L50,14 L60,2" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-orange-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Flame size={14} className="text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Streak</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{streak.current}d</div>
                  <span className="text-[9px] text-zinc-500">Max: {streak.longest}d</span>
                </div>
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,18 L10,18 L20,15 L30,12 L40,8 L50,4 L60,2" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Productivity Score */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-purple-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Zap size={14} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Productivity</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{productivityScore}%</div>
                  <span className="text-[9px] text-zinc-500">Target index</span>
                </div>
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,16 L10,12 L20,14 L30,6 L40,8 L50,3 L60,2" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Focus Rating */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-emerald-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Focus Rating</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{todayLog?.focusRating || totals.avgFocus}/10</div>
                  <span className="text-[9px] text-zinc-500">Quality score</span>
                </div>
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,10 L10,8 L20,10 L30,12 L40,8 L50,7 L60,8" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Consistency */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-rose-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Target size={14} className="text-rose-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Consistency</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{totals.consistency}%</div>
                  <span className="text-[9px] text-zinc-500">Study patterns</span>
                </div>
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,18 L10,16 L20,16 L30,12 L40,12 L50,8 L60,6" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total study hours */}
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-yellow-500/20 hover:shadow-lg transition-all group flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Award size={14} className="text-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Study</span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-xl font-extrabold font-mono text-white">{totals.totalHours}h</div>
                  <span className="text-[9px] text-zinc-500">Combined prep</span>
                </div>
                <div className="w-12 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 60 20">
                    <path d="M0,19 L10,16 L20,14 L30,11 L40,8 L50,5 L60,2" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Quick Access panel & Active Tasks list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick actions panel */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 transition-colors">
          <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddTaskClick}
              className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-purple-500/5 hover:border-purple-500/20 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <PlusCircle size={24} className="text-purple-400 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-medium">Add New Task</span>
            </button>
            <button
              onClick={() => setView('focus')}
              className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-blue-500/5 hover:border-blue-500/20 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <Clock size={24} className="text-blue-400 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-medium">Start Focus Mode</span>
            </button>
            <button
              onClick={() => setView('mistakes')}
              className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-red-500/5 hover:border-red-500/20 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <BrainCircuit size={24} className="text-red-400 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-medium">Log Mistake</span>
            </button>
            <button
              onClick={() => setView('ai')}
              className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-emerald-500/5 hover:border-emerald-500/20 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <Zap size={24} className="text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-medium">AI Insights</span>
            </button>
          </div>
        </div>

        {/* Dynamic task list mini view */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today&apos;s Schedule</h3>
            <button 
              onClick={() => setView('planner')} 
              className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
            >
              Go to Planner
            </button>
          </div>
          
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {todayTasks && todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 
                      size={18} 
                      className={task.status === 'completed' ? 'text-emerald-500' : 'text-zinc-600'} 
                    />
                    <div>
                      <div className={`text-xs font-medium ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'}`}>
                        {task.description}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {task.timeSlot} • {task.estimatedDuration} mins
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold font-mono ${
                    task.priority === 'high' 
                      ? 'bg-red-500/10 text-red-400' 
                      : task.priority === 'medium' 
                      ? 'bg-yellow-500/10 text-yellow-400' 
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-zinc-500 font-sans">
                No tasks logged for today yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
