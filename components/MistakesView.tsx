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
  CheckCircle,
  Star
} from 'lucide-react';
import { db, type Mistake } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

export default function MistakesView() {
  const { activeWorkspaceId, addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries scoped to workspace
  const mistakes = useLiveQuery(() => 
    db.mistakes.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const subjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  // Filter and search states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('conceptual');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [tagsStr, setTagsStr] = useState('');

  // Expand detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showSM2RatingId, setShowSM2RatingId] = useState<number | null>(null);

  const handleOpenAddModal = () => {
    setTitle('');
    setType('conceptual');
    setSelectedSubjectId(subjects?.[0]?.id?.toString() || '');
    setDescription('');
    setSolution('');
    setPriority('medium');
    setTagsStr('');
    setShowAddModal(true);
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    
    const newMistake: Omit<Mistake, 'id'> = {
      workspaceId: activeWorkspaceId || 1,
      title,
      type,
      subjectId: selectedSubjectId ? Number(selectedSubjectId) : undefined,
      description,
      solution,
      revisionDates: [],
      nextReviewDate: todayStr, // review immediately
      priority,
      tags
    };

    await db.mistakes.add(newMistake as Mistake);
    addXP(10);
    setShowAddModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this mistake log?')) {
      await db.mistakes.delete(id);
    }
  };

  // SM-2 Spaced Repetition Review handler
  const handleReviseSM2 = async (mistake: Mistake, score: number) => {
    if (!mistake.id) return;
    
    let repetitions = mistake.revisionDates.length;
    let easeFactor = 2.5;
    let interval = 1;

    if (score >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round((repetitions * 1.5) * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextDate = new Date(todayStr);
    nextDate.setDate(nextDate.getDate() + interval);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    await db.mistakes.update(mistake.id, {
      revisionDates: [...mistake.revisionDates, todayStr],
      nextReviewDate: nextDateStr
    });

    addXP(15);
    setShowSM2RatingId(null);
  };

  const filteredMistakes = mistakes.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesPriority = filterPriority === 'all' || m.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search and Filters */}
      <div className="glass-panel p-4 border border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-grow">
          <div className="flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-xl px-3 py-1.5 w-full md:max-w-xs">
            <Search size={14} className="text-zinc-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mistakes..."
              className="bg-transparent border-0 text-xs text-white focus:outline-none w-full placeholder-zinc-600"
            />
          </div>

          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 rounded-xl border border-white/5 bg-zinc-950 text-zinc-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="conceptual">Conceptual Trap</option>
            <option value="coding">Coding Loop Bug</option>
            <option value="wrong-question">Wrong Interpretation</option>
          </select>

          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="p-2 rounded-xl border border-white/5 bg-zinc-950 text-zinc-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer text-xs shrink-0 self-end md:self-auto"
        >
          <Plus size={14} />
          <span>Log Mistake</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="space-y-3 font-sans">
        {filteredMistakes.length > 0 ? (
          filteredMistakes.map(mis => {
            const isExpanded = expandedId === mis.id;
            const subjectObj = subjects.find(s => s.id === mis.subjectId);
            const isRatingOpen = showSM2RatingId === mis.id;

            return (
              <div 
                key={mis.id}
                className="glass-panel border border-white/5 bg-white/[0.01] overflow-hidden transition-all"
              >
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : mis.id || null)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01]"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-400" size={16} />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{mis.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {mis.type} {subjectObj && `• ${subjectObj.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px]" onClick={e => e.stopPropagation()}>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      mis.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {mis.priority}
                    </span>
                    <button
                      onClick={() => setShowSM2RatingId(isRatingOpen ? null : mis.id || null)}
                      className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCw size={12} />
                      <span>Review ({mis.revisionDates.length})</span>
                    </button>
                    <button
                      onClick={() => handleDelete(mis.id!)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded SM-2 Rating overlay */}
                {isRatingOpen && (
                  <div className="px-6 py-3 bg-purple-950/20 border-t border-purple-500/10 flex items-center justify-between text-xs font-sans gap-4">
                    <span className="text-purple-300">Rate your recall difficulty to compute the next revision target:</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => handleReviseSM2(mis, score)}
                          className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer font-mono font-bold"
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded description and solution details */}
                {isExpanded && (
                  <div className="px-6 pb-5 pt-2 border-t border-white/[0.03] bg-black/10 text-xs text-zinc-300 space-y-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Mistake context description</span>
                        <p className="bg-zinc-950/40 p-3 rounded-lg border border-white/5 text-zinc-400 whitespace-pre-wrap">{mis.description}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Correct solution / Lesson learned</span>
                        <p className="bg-zinc-950/40 p-3 rounded-lg border border-white/5 text-zinc-400 whitespace-pre-wrap">{mis.solution}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl">
            No mistakes logged in this workspace yet. Keep a repository of conceptual traps to avoid exam traps!
          </div>
        )}
      </div>

      {/* Add Mistake Modal popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 border border-white/10 bg-zinc-900/90 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Log Conceptual Mistake</h3>
            <form onSubmit={handleAddMistake} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">MISTAKE DESCRIPTION HEADER</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Forgetting boundary condition in DC Circuits transient"
                  required
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">CATEGORY TYPE</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="conceptual">Conceptual Trap</option>
                    <option value="coding">Coding Loop Bug</option>
                    <option value="wrong-question">Wrong Interpretation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">TRACK SUBJECT</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">No Subject (General)</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">PRIORITY</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">TAGS (COMMA SEPARATED)</label>
                  <input 
                    type="text" 
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="e.g. transient, circuits"
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">DETAILED Hurdle/Trap Explanation</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the context of the conceptual mistake you made..."
                  required
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Correct Solution / Lesson Learned</label>
                <textarea 
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Describe how to correctly solve it next time..."
                  required
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/5 bg-transparent hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
