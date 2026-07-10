'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  RotateCw, 
  Tag, 
  Calendar, 
  AlertTriangle,
  ChevronDown,
  CheckCircle
} from 'lucide-react';
import { db, type Mistake } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

export default function MistakesView() {
  const { addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);

  // Filter and search states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Mistake['type']>('conceptual');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [priority, setPriority] = useState<Mistake['priority']>('medium');
  const [tagsStr, setTagsStr] = useState('');

  // Expand detail
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleOpenAddModal = () => {
    setTitle('');
    setType('conceptual');
    setSelectedSubjectId(subjects?.[0]?.id || 'gate-networks');
    setDescription('');
    setSolution('');
    setPriority('medium');
    setTagsStr('');
    setShowAddModal(true);
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    
    const newMistake: Mistake = {
      title,
      type,
      subjectId: selectedSubjectId,
      description,
      solution,
      revisionDates: [],
      nextReviewDate: todayStr, // review today/immediately
      priority,
      tags
    };

    await db.mistakes.add(newMistake);
    addXP(10); // +10 XP for identifying and logging a mistake
    setShowAddModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this mistake?')) {
      await db.mistakes.delete(id);
    }
  };

  const handleReviseMistake = async (mistake: Mistake) => {
    if (!mistake.id) return;
    
    // Spaced repetition intervals: 1, 3, 7, 15, 30, 60, 90 days
    const currentRevCount = mistake.revisionDates.length;
    const intervals = [1, 3, 7, 15, 30, 60, 90];
    const daysToAdd = intervals[Math.min(currentRevCount, intervals.length - 1)];
    
    const nextDate = new Date(todayStr);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const nextRevisions = [...mistake.revisionDates, todayStr];

    await db.mistakes.update(mistake.id, {
      revisionDates: nextRevisions,
      nextReviewDate: nextDateStr
    });

    addXP(15); // +15 XP for correcting / revising a mistake block
    alert(`Mistake marked revised! Scheduled next review in ${daysToAdd} days (${nextDateStr})`);
  };

  // Filter mistakes logic
  const filteredMistakes = mistakes?.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.description.toLowerCase().includes(search.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesPriority = filterPriority === 'all' || m.priority === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search & Actions Bar */}
      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between border border-white/5 bg-white/[0.01]">
        
        <div className="flex items-center gap-3 bg-zinc-950 border border-white/5 rounded-xl px-3 py-1.5 w-full sm:max-w-xs">
          <Search size={14} className="text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search mistakes or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-white placeholder-zinc-500 w-full"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex gap-3 flex-wrap items-center text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 rounded-xl bg-zinc-950 border border-white/5 text-zinc-300 font-sans cursor-pointer focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="wrong-question">Wrong Questions</option>
            <option value="conceptual">Conceptual Errors</option>
            <option value="interview">Interview Mistakes</option>
            <option value="coding">Coding Mistakes</option>
            <option value="circuit">Circuit Mistakes</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="p-2 rounded-xl bg-zinc-950 border border-white/5 text-zinc-300 font-sans cursor-pointer focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Mistake</span>
          </button>
        </div>

      </div>

      {/* Mistakes grid list */}
      <div className="space-y-3">
        {filteredMistakes && filteredMistakes.length > 0 ? (
          filteredMistakes.map((mistake) => {
            const isExpanded = expandedId === mistake.id;
            const sub = subjects?.find(s => s.id === mistake.subjectId);
            
            return (
              <div 
                key={mistake.id}
                className={`glass-panel border transition-all overflow-hidden ${
                  mistake.priority === 'high' 
                    ? 'border-red-500/10 hover:border-red-500/20' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Main Header summary row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : mistake.id || null)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-red-400 shrink-0">
                      <BrainCircuit size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">{mistake.title}</h4>
                      <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono mt-0.5 flex-wrap">
                        <span className="uppercase text-zinc-400 font-bold">{mistake.type.replace('-', ' ')}</span>
                        {sub && <span className="uppercase text-purple-400">{sub.name}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          Review: {mistake.nextReviewDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Priority Indicator */}
                    <span className={`text-[8px] uppercase px-2 py-0.5 rounded font-bold font-mono ${
                      mistake.priority === 'high' 
                        ? 'bg-red-500/10 text-red-400' 
                        : mistake.priority === 'medium' 
                        ? 'bg-yellow-500/10 text-yellow-400' 
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {mistake.priority}
                    </span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded details section */}
                {isExpanded && (
                  <div className="px-14 pb-5 pt-1 border-t border-white/[0.03] bg-black/10 text-xs text-zinc-400 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <span className="font-semibold text-zinc-300 uppercase tracking-widest text-[9px] block mb-1">Error Description</span>
                      <p className="text-zinc-400 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5">{mistake.description}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-zinc-300 uppercase tracking-widest text-[9px] block mb-1">Correct Solution / Notes</span>
                      <p className="text-emerald-400 leading-relaxed bg-emerald-500/[0.02] p-2.5 rounded-lg border border-emerald-500/10 font-mono">{mistake.solution}</p>
                    </div>

                    {/* Metadata, revision logs, and spaced repetition actions */}
                    <div className="flex justify-between items-center flex-wrap gap-4 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {mistake.tags.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviseMistake(mistake)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                        >
                          <RotateCw size={12} className="animate-spin duration-[10s]" />
                          <span>Mark Revised ({mistake.revisionDates.length})</span>
                        </button>
                        <button
                          onClick={() => handleDelete(mistake.id!)}
                          className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="glass-panel text-center py-16 border border-dashed border-white/5 rounded-xl">
            <AlertTriangle className="text-zinc-600 mx-auto mb-2" size={24} />
            <p className="text-sm font-medium text-zinc-400">Mistake repo empty.</p>
            <p className="text-xs text-zinc-500 mt-1">Log conceptual slips or incorrect mock test questions to practice Spaced Repetition reviews.</p>
          </div>
        )}
      </div>

      {/* Log Mistake Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 border border-white/10 bg-zinc-950 shadow-2xl flex flex-col">
            <h3 className="text-base font-bold text-white mb-4">Log Error / Tricky Question</h3>
            
            <form onSubmit={handleAddMistake} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">MISTAKE SUMMARY / TITLE</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dependent source polarity in nodal loops"
                  required
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">MISTAKE TYPE</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 font-sans"
                  >
                    <option value="conceptual" className="bg-zinc-950">Conceptual Error</option>
                    <option value="wrong-question" className="bg-zinc-950">Wrong Mock Question</option>
                    <option value="coding" className="bg-zinc-950">Coding Bug / Logic</option>
                    <option value="circuit" className="bg-zinc-950">Circuit Sign Slip</option>
                    <option value="interview" className="bg-zinc-950">Interview Slip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">TRACK SUBJECT</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {subjects?.map((sub) => (
                      <option key={sub.id} value={sub.id} className="bg-zinc-950">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">DESCRIPTION OF THE MISTAKE</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what you did wrong (e.g. assumed mesh current flowing clockwise instead of counter...)"
                  required
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">CORRECT SOLUTION / FIX RULE</label>
                <textarea 
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="What is the correct procedure? (e.g. always define reference node at bottom...)"
                  required
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">PRIORITY</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none"
                  >
                    <option value="high" className="bg-zinc-950">High priority</option>
                    <option value="medium" className="bg-zinc-950">Medium priority</option>
                    <option value="low" className="bg-zinc-950">Low priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">TAGS (COMMA SEPARATED)</label>
                  <input 
                    type="text" 
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="e.g. Circuits, Nodal, Signs"
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Log Error
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
