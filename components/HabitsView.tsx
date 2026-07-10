'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '@/lib/db';
import { useStore } from '@/lib/store';
import { 
  CheckCircle2, 
  Flame, 
  Droplet, 
  Apple, 
  Tv, 
  Smile, 
  Zap, 
  Circle,
  Activity,
  Heart
} from 'lucide-react';

export default function HabitsView() {
  const { addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries
  const todayHabit = useLiveQuery(() => db.habits.where('date').equals(todayStr).first(), []);
  const allHabits = useLiveQuery(() => db.habits.toArray(), []);

  // List of habits to track
  const habitItems = [
    { id: 'wakeUp', label: 'Wake up early', icon: Zap, color: 'text-amber-400' },
    { id: 'sleepEarly', label: 'Sleep before 10 PM', icon: Zap, color: 'text-blue-400' },
    { id: 'workout', label: 'Workout Session', icon: Activity, color: 'text-rose-400' },
    { id: 'meditation', label: 'Mindful Meditation', icon: Heart, color: 'text-purple-400' },
    { id: 'reading', label: 'Read Technical Book', icon: Heart, color: 'text-emerald-400' },
    { id: 'coding', label: 'Leetcode / Coding Drill', icon: Activity, color: 'text-indigo-400' },
    { id: 'revision', label: 'Spaced Revision Done', icon: Heart, color: 'text-pink-400' },
    { id: 'hairCare', label: 'Hair Care / Shampoo', icon: Smile, color: 'text-teal-400' },
    { id: 'walking', label: 'Evening Walking (45m)', icon: Activity, color: 'text-cyan-400' },
    { id: 'stretching', label: 'Body Stretching', icon: Activity, color: 'text-orange-400' }
  ] as const;

  const handleToggleHabit = async (habitKey: keyof Omit<Habit, 'id' | 'date' | 'waterIntake' | 'proteinIntake' | 'screenTime'>) => {
    if (!todayHabit || !todayHabit.id) return;
    const nextStatus = !todayHabit[habitKey];
    
    await db.habits.update(todayHabit.id, { [habitKey]: nextStatus });
    if (nextStatus) {
      addXP(5); // +5 XP for checking off a healthy habit
    }
  };

  const handleUpdateNumericHabit = async (habitKey: 'waterIntake' | 'proteinIntake' | 'screenTime', val: number) => {
    if (!todayHabit || !todayHabit.id) return;
    await db.habits.update(todayHabit.id, { [habitKey]: val });
  };

  // Calculate habit statistics (streaks and monthly consistency)
  const getHabitStats = (habitKey: keyof Omit<Habit, 'id' | 'date'>) => {
    if (!allHabits || allHabits.length === 0) return { streak: 0, consistency: 0 };
    
    // Sort ascending
    const sorted = [...allHabits].sort((a, b) => a.date.localeCompare(b.date));
    
    let currentStreak = 0;
    let totalCompleted = 0;

    // Streaks calculation (reversed traversal)
    const reversed = [...sorted].reverse();
    let countStreak = true;
    
    reversed.forEach(h => {
      const isDone = typeof h[habitKey] === 'boolean' ? h[habitKey] : (h[habitKey] as number) > 0;
      if (isDone) {
        totalCompleted++;
        if (countStreak) currentStreak++;
      } else {
        countStreak = false;
      }
    });

    const consistency = Math.round((totalCompleted / allHabits.length) * 100) || 0;
    return { streak: currentStreak, consistency };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Metrics Row: Water, Protein, Screen time */}
      {todayHabit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Water Intake */}
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Droplet className="text-blue-400" size={16} />
                <span>Water Intake</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{todayHabit.waterIntake} ml</div>
              <span className="text-[10px] text-zinc-500">Target: 3000 ml</span>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleUpdateNumericHabit('waterIntake', Math.max(0, todayHabit.waterIntake - 250))}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                -
              </button>
              <button 
                onClick={() => handleUpdateNumericHabit('waterIntake', todayHabit.waterIntake + 250)}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Protein Intake */}
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Apple className="text-emerald-400" size={16} />
                <span>Protein Intake</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{todayHabit.proteinIntake} g</div>
              <span className="text-[10px] text-zinc-500">Target: 65 g</span>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleUpdateNumericHabit('proteinIntake', Math.max(0, todayHabit.proteinIntake - 5))}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                -
              </button>
              <button 
                onClick={() => handleUpdateNumericHabit('proteinIntake', todayHabit.proteinIntake + 5)}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Screen Time */}
          <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Tv className="text-purple-400" size={16} />
                <span>Screen Time</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{todayHabit.screenTime} min</div>
              <span className="text-[10px] text-zinc-500">Limit: 120 min</span>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleUpdateNumericHabit('screenTime', Math.max(0, todayHabit.screenTime - 15))}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                -
              </button>
              <button 
                onClick={() => handleUpdateNumericHabit('screenTime', todayHabit.screenTime + 15)}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 hover:bg-white/5 text-zinc-400 font-mono text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Main checklists and Streaks matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's checklists */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Today&apos;s Checklist</h3>
          
          <div className="space-y-3">
            {todayHabit && habitItems.map((item) => {
              const isChecked = todayHabit[item.id as keyof Habit] as boolean;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleHabit(item.id as any)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={item.color} />
                    <span className={`text-xs font-semibold ${isChecked ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {item.label}
                    </span>
                  </div>
                  {isChecked ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} className="text-zinc-700" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Streaks matrix panel */}
        <div className="glass-panel p-6 border border-white/5 bg-white/[0.01] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Consistency Matrix</h3>
            
            <div className="space-y-4">
              {habitItems.map((item) => {
                const stats = getHabitStats(item.id as any);
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-2">
                      <item.icon size={14} className={item.color} />
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                      {/* Streak */}
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame size={12} className="fill-orange-400/20" />
                        <span>{stats.streak}d streak</span>
                      </div>
                      {/* Completion rate bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${stats.consistency}%` }}
                          />
                        </div>
                        <span className="text-zinc-400 w-8 text-right">{stats.consistency}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
