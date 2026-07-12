'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit, type HabitLog } from '@/lib/db';
import { useStore } from '@/lib/store';
import { 
  CheckCircle2, 
  Flame, 
  Plus, 
  Trash, 
  Activity, 
  Smile, 
  Heart,
  Droplet,
  Moon,
  Sparkles
} from 'lucide-react';

export default function HabitsView() {
  const { activeWorkspaceId, addXP } = useStore();
  const todayStr = '2026-07-10'; // Core system date

  // DB queries scoped to workspace
  const habits = useLiveQuery(() => 
    db.habits.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []) || [];

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('purple');

  // Compute past 7 days dates lists
  const getPast7Days = () => {
    const days = [];
    const today = new Date(todayStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const past7Days = getPast7Days();

  const handleCreateHabit = async () => {
    if (newHabitName.trim()) {
      await db.habits.add({
        workspaceId: activeWorkspaceId || 1,
        name: newHabitName.trim(),
        icon: 'Activity',
        color: newHabitColor,
        frequency: 'daily',
        isArchived: false
      });
      setNewHabitName('');
      setShowAddForm(false);
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (confirm('Are you sure you want to delete this habit and all its history?')) {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    }
  };

  const handleToggleLog = async (habitId: number, date: string) => {
    const existing = habitLogs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      const nextStatus = existing.status === 'completed' ? 'skipped' : 'completed';
      await db.habitLogs.update(existing.id!, { status: nextStatus });
      if (nextStatus === 'completed') {
        addXP(5);
      }
    } else {
      await db.habitLogs.add({
        habitId,
        date,
        status: 'completed'
      });
      addXP(5);
    }
  };

  const getStreak = (habitId: number) => {
    let currentStreak = 0;
    const sortedLogs = [...habitLogs]
      .filter(l => l.habitId === habitId && l.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date)); // descending
    
    // Simple count of continuous completed logs
    let checkDate = new Date(todayStr);
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
      if (log && log.status === 'completed') {
        currentStreak++;
      } else if (dateStr !== todayStr) {
        break; // break if a previous day was missed
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Header toolbar */}
      <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-purple-400" size={18} />
          <span className="text-sm font-semibold text-zinc-300">Habit Streaks Tracker</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Custom Habit</span>
        </button>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="glass-panel p-4 border border-white/10 bg-zinc-900/90 max-w-sm space-y-4 animate-in slide-in-from-top-2 duration-150 text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider">Configure New Habit</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read tech newsletter"
              className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
            />
            <select
              value={newHabitColor}
              onChange={(e) => setNewHabitColor(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="purple">Purple Dot</option>
              <option value="blue">Blue Dot</option>
              <option value="emerald">Green Dot</option>
              <option value="red">Red Dot</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCreateHabit}
              className="flex-grow py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer text-center"
            >
              Save Habit
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Habits Consistency List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const streakVal = getStreak(habit.id!);
            return (
              <div 
                key={habit.id}
                className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[150px] group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      habit.color === 'blue' ? 'bg-blue-500' : habit.color === 'emerald' ? 'bg-emerald-500' : habit.color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <h4 className="text-sm font-bold text-white truncate max-w-[150px]">{habit.name}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 font-mono">
                      <Flame size={12} className="fill-orange-400/20" />
                      <span>{streakVal} Days</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteHabit(habit.id!)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-0.5 cursor-pointer"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>

                {/* 7 Day checkoffs matrix */}
                <div className="mt-6">
                  <span className="text-[9px] text-zinc-500 font-mono block mb-2 uppercase tracking-widest">Past 7 Days Logs</span>
                  <div className="flex justify-between items-center bg-zinc-950/40 border border-white/5 p-2 rounded-xl">
                    {past7Days.map(date => {
                      const log = habitLogs.find(l => l.habitId === habit.id && l.date === date);
                      const isCompleted = log?.status === 'completed';
                      const dayLabel = new Date(date).toLocaleDateString([], { weekday: 'narrow' });
                      
                      return (
                        <button
                          key={date}
                          onClick={() => handleToggleLog(habit.id!, date)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                            isCompleted
                              ? 'bg-purple-500 border-purple-500 text-white shadow-md'
                              : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400'
                          }`}
                          title={date}
                        >
                          {dayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl">
            No habits logged in this workspace yet. Click Add Custom Habit to create your routines!
          </div>
        )}
      </div>

    </div>
  );
}
