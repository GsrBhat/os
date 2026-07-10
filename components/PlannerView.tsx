'use client';

import React, { useState } from 'react';
import { 
  Calendar,
  Play, 
  Pause, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Tag, 
  Pin, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { db, type Task } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

interface PlannerViewProps {
  showAddTaskModal: boolean;
  setShowAddTaskModal: (open: boolean) => void;
}

export default function PlannerView({ showAddTaskModal, setShowAddTaskModal }: PlannerViewProps) {
  const todayStr = '2026-07-10'; // Core current date
  const { activeTimer, startTaskTimer, pauseTaskTimer, stopTaskTimer, addXP } = useStore();

  // Load database tasks for today
  const tasks = useLiveQuery(() => db.tasks.where('date').equals(todayStr).toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);

  // Form state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [timeSlot, setTimeSlot] = useState('09:00 - 10:00');
  const [estDuration, setEstDuration] = useState(60);
  const [isPinned, setIsPinned] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // Expander per task
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setDescription('');
    setSelectedSubject(subjects?.[0]?.id || 'placement-dsa');
    setPriority('medium');
    setTimeSlot('09:00 - 10:00');
    setEstDuration(60);
    setIsPinned(false);
    setIsRecurring(false);
    setShowAddTaskModal(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setDescription(task.description);
    setSelectedSubject(task.subject);
    setPriority(task.priority);
    setTimeSlot(task.timeSlot);
    setEstDuration(task.estimatedDuration);
    setIsPinned(task.isPinned);
    setIsRecurring(task.isRecurring);
    setShowAddTaskModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: Omit<Task, 'id'> = {
      date: todayStr,
      description,
      subject: selectedSubject,
      priority,
      timeSlot,
      estimatedDuration: estDuration,
      actualDuration: editingTask?.actualDuration || 0,
      status: editingTask?.status || 'pending',
      notes: editingTask?.notes || '',
      tags: editingTask?.tags || [selectedSubject.split('-')[1] || 'study'],
      revisionCount: editingTask?.revisionCount || 0,
      isPinned,
      isRecurring
    };

    if (editingTask && editingTask.id) {
      await db.tasks.update(editingTask.id, taskData);
    } else {
      await db.tasks.add(taskData as Task);
      addXP(5); // 5 XP for logging a task
    }

    setShowAddTaskModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await db.tasks.delete(id);
    }
  };

  const toggleComplete = async (task: Task) => {
    if (!task.id) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await db.tasks.update(task.id, { status: newStatus });
    if (newStatus === 'completed') {
      addXP(15); // +15 XP for completing a study task
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-2">
          <Calendar className="text-purple-400" size={18} />
          <span className="text-sm font-semibold text-zinc-300">Tasks Checklist for {todayStr}</span>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Create Task</span>
        </button>
      </div>

      {/* Task List Grid */}
      <div className="space-y-3">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const subjectObj = subjects?.find(s => s.id === task.subject);
            const isTaskTimerActive = activeTimer?.taskId === task.id;

            return (
              <div 
                key={task.id}
                className={`glass-panel border transition-all overflow-hidden ${
                  task.status === 'completed' 
                    ? 'border-emerald-500/10 bg-emerald-500/[0.01] opacity-75' 
                    : isTaskTimerActive 
                    ? 'border-purple-500/30 bg-purple-500/[0.02]' 
                    : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Completion Checkbox */}
                    <button 
                      onClick={() => toggleComplete(task)}
                      className="text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckSquare size={20} className="text-emerald-500" />
                      ) : (
                        <Square size={20} className="text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      {/* Description & Pinned */}
                      <div className="flex items-center gap-2">
                        <span 
                          className={`text-sm font-semibold truncate ${
                            task.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.description}
                        </span>
                        {task.isPinned && <Pin size={12} className="text-purple-400 fill-purple-400" />}
                      </div>

                      {/* Time slot and durations */}
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono mt-1 flex-wrap">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                          {task.timeSlot}
                        </span>
                        <span>Est: {task.estimatedDuration}m</span>
                        {task.actualDuration > 0 && (
                          <span className="text-purple-400 font-bold">Act: {task.actualDuration}m</span>
                        )}
                        {subjectObj && (
                          <span className="text-zinc-400 uppercase tracking-widest text-[8px]">
                            {subjectObj.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Timers */}
                  <div className="flex items-center gap-3 shrink-0">
                    
                    {/* Status badge / Play controller */}
                    {task.status !== 'completed' && (
                      <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-xl">
                        {isTaskTimerActive ? (
                          <button
                            onClick={pauseTaskTimer}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer px-1"
                          >
                            <Pause size={12} />
                            <span>PAUSE</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => task.id && startTaskTimer(task.id)}
                            disabled={!!activeTimer}
                            className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-1"
                          >
                            <Play size={12} />
                            <span>STUDY</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Priority badge */}
                    <span className={`text-[9px] uppercase px-2.5 py-0.5 rounded-full font-bold font-mono ${
                      task.priority === 'high' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : task.priority === 'medium' 
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>

                    {/* Expand Detail */}
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id || null)}
                      className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <FileText size={14} />
                    </button>

                    {/* Edit Task */}
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete Task */}
                    <button
                      onClick={() => task.id && handleDelete(task.id)}
                      className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>

                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="px-10 pb-4 pt-1 border-t border-white/[0.03] bg-black/10 text-xs text-zinc-400 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <span className="font-semibold text-zinc-300">Notes / Resources:</span>
                      <textarea
                        defaultValue={task.notes}
                        placeholder="Add revision links, formulas, book chapters studied, or questions solved..."
                        onBlur={async (e) => {
                          if (task.id) {
                            await db.tasks.update(task.id, { notes: e.target.value });
                          }
                        }}
                        className="w-full mt-1.5 p-2 rounded-lg border border-white/5 bg-zinc-950/50 text-white focus:outline-none focus:border-purple-500 font-sans"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-4 flex-wrap font-mono text-[10px]">
                      <div>
                        <span className="text-zinc-500">Tags: </span>
                        {task.tags.map((tag, i) => (
                          <span key={i} className="bg-white/5 px-2 py-0.5 rounded text-zinc-300 mr-1.5">#{tag}</span>
                        ))}
                      </div>
                      <div>
                        <span className="text-zinc-500">Revision Count: </span>
                        <span className="text-purple-400 font-bold">{task.revisionCount} times</span>
                      </div>
                      {task.isRecurring && (
                        <div>
                          <span className="text-zinc-500">Recurrence: </span>
                          <span className="text-blue-400">Weekly</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="glass-panel text-center py-12 border border-dashed border-white/5">
            <AlertCircle className="text-zinc-600 mx-auto mb-2" size={24} />
            <p className="text-sm font-medium text-zinc-400">No study tasks logged for today.</p>
            <p className="text-xs text-zinc-500 mt-1">Generate a fresh checklist or click &quot;Create Task&quot; above.</p>
          </div>
        )}
      </div>

      {/* Task Modal Overlay */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 border border-white/10 bg-zinc-950 shadow-2xl flex flex-col">
            <h3 className="text-base font-bold text-white mb-4">
              {editingTask ? 'Edit Task Details' : 'Create Custom Study Task'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">TASK DESCRIPTION</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Solve 30 questions on Node equations"
                  required
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">TRACK SUBJECT</label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {subjects?.map((sub) => (
                      <option key={sub.id} value={sub.id} className="bg-zinc-950 text-white">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">PRIORITY</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 font-sans"
                  >
                    <option value="high" className="bg-zinc-950 text-white">High Priority</option>
                    <option value="medium" className="bg-zinc-950 text-white">Medium Priority</option>
                    <option value="low" className="bg-zinc-950 text-white">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">TIME SLOT</label>
                  <input 
                    type="text" 
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="e.g. 09:00 - 10:30"
                    required
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">EST. MINUTES</label>
                  <input 
                    type="number" 
                    value={estDuration}
                    onChange={(e) => setEstDuration(parseInt(e.target.value))}
                    required
                    min="5"
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-2 text-xs font-sans text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span>Pin to top</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span>Recurring Task</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
