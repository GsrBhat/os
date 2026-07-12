'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/lib/store';
import { Flame, Calendar, Award } from 'lucide-react';

export default function AnalyticsView() {
  const { activeWorkspaceId } = useStore();

  // DB queries scoped to workspace
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray(), []) || [];
  const subjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  // Format data for the past 7 days chart
  const weeklyData = allLogs
    .slice(-7)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => ({
      name: new Date(log.date).toLocaleDateString([], { weekday: 'short' }),
      hours: log.studyHours,
      focus: log.focusRating,
      sleep: log.sleepHours,
      energy: log.energy
    }));

  // Format category breakdown data (Pie Chart) showing progress contribution
  const categoryPieData = subjects.map(s => ({
    name: s.name,
    value: s.completionPercent || 10 // default min slice size to show
  }));

  const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  // Radar chart data: subject completion percentages
  const radarData = subjects
    .slice(0, 6)
    .map(s => ({
      subject: s.name.substring(0, 12) + (s.name.length > 12 ? '..' : ''),
      completion: s.completionPercent || 0,
      fullMark: 100
    }));

  // Generate GitHub style heatmap grid (past 60 days)
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date('2026-07-10'); // Core system date
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = allLogs.find(l => l.date === dateStr);
      days.push({
        date: dateStr,
        hours: log?.studyHours || 0
      });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  // Math metrics
  const totalStudyHours = allLogs.reduce((sum, l) => sum + l.studyHours, 0);
  const avgFocusRating = allLogs.length > 0 
    ? (allLogs.reduce((sum, l) => sum + l.focusRating, 0) / allLogs.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Total Hours Logged</p>
            <h4 className="text-xl font-bold text-white font-mono mt-0.5">{totalStudyHours} hours</h4>
          </div>
        </div>

        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Daily Target Met</p>
            <h4 className="text-xl font-bold text-white font-mono mt-0.5">{allLogs.filter(l => l.studyHours >= 4).length} days</h4>
          </div>
        </div>

        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Average Focus Index</p>
            <h4 className="text-xl font-bold text-white font-mono mt-0.5">{avgFocusRating} / 10</h4>
          </div>
        </div>
      </div>

      {/* Primary Trend Area Chart */}
      <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] font-sans">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Past 7 Days Study Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="hours" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        
        {/* Pie chart progress contribution */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Subject Progress Breakdown</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {subjects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                  <Legend formatter={(value) => <span className="text-[10px] text-zinc-400 font-sans">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">No subjects defined.</div>
            )}
          </div>
        </div>

        {/* Radar chart confidence breakdown */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Subject Completion Radar</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={8} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={8} />
                  <Radar name="Completion %" dataKey="completion" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">No metrics recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub heatmaps grid */}
      <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] font-sans">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">60-Day Study Consistency Grid</h3>
        <div className="flex flex-wrap gap-1">
          {heatmapDays.map((day, idx) => {
            const h = day.hours;
            const bgClass = h === 0 
              ? 'bg-zinc-900 border border-white/5' 
              : h < 3 
              ? 'bg-purple-900/30 border border-purple-800/10' 
              : h < 6 
              ? 'bg-purple-700/60' 
              : 'bg-purple-500';
            return (
              <div 
                key={idx} 
                className={`w-3.5 h-3.5 rounded ${bgClass}`} 
                title={`${day.date}: ${h} hours`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-3">
          <span>Less active</span>
          <span>More active</span>
        </div>
      </div>

    </div>
  );
}
