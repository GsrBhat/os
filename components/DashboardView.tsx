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
  TrendingUp
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

  // Streaks and summary metrics state
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [totals, setTotals] = useState({ totalHours: 0, avgFocus: 0, consistency: 0 });

  // Countdowns details
  const countdowns = [
    { title: 'GATE ECE 2027', date: '2027-02-06', color: 'from-purple-600 to-indigo-600' },
    { title: 'Placement Season', date: '2026-08-01', color: 'from-blue-600 to-cyan-600' },
    { title: 'IELTS Goal', date: '2026-10-20', color: 'from-emerald-600 to-teal-600' },
    { title: 'Internship Goal', date: '2026-11-15', color: 'from-rose-600 to-pink-600' }
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

    // We check studyHours > 0 for consistency streak
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

    // Determine current streak
    const reversedLogs = [...sortedLogs].reverse();
    // Start checking from today (reversedLogs[0] might be today)
    let checkIndex = 0;
    // If today hasn't started yet but yesterday was active, streak is preserved
    if (reversedLogs.length > 0) {
      if (reversedLogs[0].date === todayStr && reversedLogs[0].studyHours === 0) {
        checkIndex = 1; // start from yesterday
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

    // Compute aggregate metrics
    const totalHrs = allLogs.reduce((sum, item) => sum + item.studyHours, 0);
    const activeFocusLogs = allLogs.filter(l => l.focusRating > 0);
    const avgFcs = activeFocusLogs.length > 0 
      ? Math.round(activeFocusLogs.reduce((sum, item) => sum + item.focusRating, 0) / activeFocusLogs.length) 
      : 0;

    // Consistency: Days with studyHours > 4
    const productiveDays = allLogs.filter(l => l.studyHours >= 4).length;
    const consistencyRate = Math.round((productiveDays / allLogs.length) * 100) || 0;

    setTotals({ totalHours: Math.round(totalHrs * 10) / 10, avgFocus: avgFcs, consistency: consistencyRate });
  }, [allLogs]);

  // Compute tasks numbers
  const totalTasks = todayTasks?.length || 0;
  const completedTasks = todayTasks?.filter(t => t.status === 'completed').length || 0;
  const remainingTasks = totalTasks - completedTasks;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Compute dynamic productivity score
  // (completion% * 0.6) + (todayStudyHours/dailyTarget * 0.4)
  const todayHoursLogged = todayTasks?.reduce((sum, t) => sum + t.actualDuration, 0) || 0;
  const studyHours = Math.round((todayHoursLogged / 60) * 10) / 10 || todayLog?.studyHours || 0;

  const productivityScore = todayLog?.productivityScore || (
    totalTasks > 0 
      ? Math.min(100, Math.round((taskProgressPercent * 0.7) + (Math.min(1, studyHours / 6) * 30))) 
      : 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 4 Countdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {countdowns.map((cd, index) => {
          const daysLeft = calculateDaysLeft(cd.date);
          return (
            <div 
              key={index}
              className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${cd.color} p-5 text-white shadow-lg glow-border cursor-pointer`}
            >
              {/* Overlay lines decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-6 -translate-y-6 pointer-events-none" />
              <div className="text-xs uppercase tracking-wider font-mono opacity-80">{cd.title}</div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight font-mono">{daysLeft}</span>
                <span className="text-xs opacity-95">days left</span>
              </div>
              <div className="mt-2 text-[10px] opacity-75 font-sans">Target: {new Date(cd.date).toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Progress Card */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center col-span-1">
          <h3 className="text-sm font-semibold text-zinc-400 mb-6 uppercase tracking-wider">Today&apos;s Progress</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-purple-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={427}
                strokeDashoffset={427 - (427 * taskProgressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono text-white">{taskProgressPercent}%</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">COMPLETED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-4 text-xs font-sans">
            <div className="text-center border-r border-white/5">
              <div className="text-zinc-500 font-medium">Done</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{completedTasks}</div>
            </div>
            <div className="text-center">
              <div className="text-zinc-500 font-medium">Remaining</div>
              <div className="text-lg font-bold text-zinc-400 font-mono mt-0.5">{remainingTasks}</div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="glass-panel p-6 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-400 mb-6 uppercase tracking-wider">Performance Engine</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            
            {/* Study Hours */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Clock size={16} className="text-blue-400" />
                <span className="text-xs font-medium">Study Hours</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{studyHours}h</div>
              <span className="text-[10px] text-zinc-500">Today&apos;s logged focus</span>
            </div>

            {/* Streak */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Flame size={16} className="text-orange-500" />
                <span className="text-xs font-medium">Active Streak</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{streak.current} days</div>
              <span className="text-[10px] text-zinc-500">Longest: {streak.longest} days</span>
            </div>

            {/* Productivity Score */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Zap size={16} className="text-purple-400" />
                <span className="text-xs font-medium">Productivity</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{productivityScore}%</div>
              <span className="text-[10px] text-zinc-500 font-sans">Performance Index</span>
            </div>

            {/* Average Focus Rating */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Activity size={16} className="text-emerald-500" />
                <span className="text-xs font-medium">Focus Rating</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{todayLog?.focusRating || totals.avgFocus}/10</div>
              <span className="text-[10px] text-zinc-500 font-sans">Avg focus quality</span>
            </div>

            {/* Consistency */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Target size={16} className="text-red-400" />
                <span className="text-xs font-medium">Consistency</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{totals.consistency}%</div>
              <span className="text-[10px] text-zinc-500">Days &gt;= 4 hrs study</span>
            </div>

            {/* Total study hours */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Award size={16} className="text-yellow-500" />
                <span className="text-xs font-medium">Total Hours</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{totals.totalHours}h</div>
              <span className="text-[10px] text-zinc-500">Cumulative study time</span>
            </div>

          </div>
        </div>

      </div>

      {/* Quick Access panel & Active Tasks list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick actions panel */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Quick Actions</h3>
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
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Schedule</h3>
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
