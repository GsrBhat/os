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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Flame, Calendar, Award, CheckCircle } from 'lucide-react';

export default function AnalyticsView() {
  // DB queries
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);

  // Format data for the past 7 days chart
  const weeklyData = allLogs
    ?.slice(-7)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => ({
      name: new Date(log.date).toLocaleDateString([], { weekday: 'short' }),
      hours: log.studyHours,
      focus: log.focusRating,
      sleep: log.sleepHours,
      energy: log.energy
    })) || [];

  // Format category breakdown data (Pie Chart)
  const categoryDataMap: Record<string, number> = {};
  subjects?.forEach(s => {
    categoryDataMap[s.category] = (categoryDataMap[s.category] || 0) + s.totalHours;
  });

  const categoryPieData = Object.entries(categoryDataMap).map(([key, val]) => ({
    name: key === 'gate' ? 'GATE ECE' : key === 'placement' ? 'Placements' : 'Languages',
    value: val
  }));

  const COLORS = ['#a855f7', '#3b82f6', '#10b981'];

  // Radar chart data: top subjects confidence
  const radarData = subjects
    ?.filter(s => s.totalHours > 0)
    .slice(0, 6)
    .map(s => ({
      subject: s.name.substring(0, 12) + (s.name.length > 12 ? '..' : ''),
      confidence: s.confidence,
      fullMark: 5
    })) || [];

  // Generate GitHub style heatmap grid (past 60 days)
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date('2026-07-10'); // Core current date
    
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Find log in database
      const log = allLogs?.find(l => l.date === dateStr);
      const studyHrs = log?.studyHours || 0;
      
      days.push({
        date: dateStr,
        hours: studyHrs,
        dayOfWeek: d.getDay()
      });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  // Get color intensity class based on study hours (GitHub style)
  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-zinc-900 border-zinc-950/20';
    if (hours < 3) return 'bg-emerald-950 border-emerald-950';
    if (hours < 5) return 'bg-emerald-800 border-emerald-900';
    if (hours < 7) return 'bg-emerald-600 border-emerald-700';
    return 'bg-emerald-400 border-emerald-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* GitHub style heatmap grid */}
      <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          <span>Study Consistency Heatmap</span>
        </h3>
        
        <div className="flex flex-col gap-2 overflow-x-auto pb-2">
          {/* Heatmap Blocks Grid */}
          <div className="flex gap-1.5 min-w-[500px]">
            {heatmapDays.map((day, i) => (
              <div 
                key={i}
                title={`${day.date}: ${day.hours} study hours`}
                className={`w-3.5 h-3.5 rounded-[3px] border transition-all ${getHeatmapColor(day.hours)} hover:scale-110 cursor-pointer`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pr-2 mt-1">
            <span>60 days ago</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-[2px]" />
              <div className="w-2.5 h-2.5 bg-emerald-950 rounded-[2px]" />
              <div className="w-2.5 h-2.5 bg-emerald-800 rounded-[2px]" />
              <div className="w-2.5 h-2.5 bg-emerald-600 rounded-[2px]" />
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-[2px]" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Trend Area Chart */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Weekly Focus Hours</h3>
          <div className="h-64">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)' }} 
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#a855f7" fillOpacity={1} fill="url(#colorHours)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading charts...</div>
            )}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Subject Categories Split</h3>
          <div className="h-64 flex items-center justify-center">
            {categoryPieData.length > 0 ? (
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
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">No subject tracking hours logged yet.</div>
            )}
          </div>
        </div>

        {/* Sleep vs Focus Rating Correlation Line Chart */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Sleep vs Focus Correlation</h3>
          <div className="h-64">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="sleep" name="Sleep (Hours)" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="focus" name="Focus Rating (1-10)" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading correlation stats...</div>
            )}
          </div>
        </div>

        {/* Radar Confidence Chart */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Subject Confidence Indices</h3>
          <div className="h-64">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={8} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#52525b" fontSize={8} />
                  <Radar name="Confidence" dataKey="confidence" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)' }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">No active subjects tracked.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
