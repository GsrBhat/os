'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Languages, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  Bookmark, 
  CheckSquare, 
  Square,
  HelpCircle
} from 'lucide-react';
import { db, type Subject, type Topic } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

export default function SubjectView() {
  const { addXP } = useStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'gate' | 'placement' | 'language'>('all');

  // Database hooks
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const activeSubject = useLiveQuery(
    () => (selectedSubjectId ? db.subjects.get(selectedSubjectId) : db.subjects.get('')),
    [selectedSubjectId]
  );
  const topics = useLiveQuery(
    () => (selectedSubjectId ? db.topics.where('subjectId').equals(selectedSubjectId).toArray() : Promise.resolve([] as Topic[])),
    [selectedSubjectId]
  );

  // Active topic edit drawer details
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicNotes, setTopicNotes] = useState('');
  const [topicMistakes, setTopicMistakes] = useState('');
  const [topicResources, setTopicResources] = useState('');
  const [topicQSolved, setTopicQSolved] = useState(0);
  const [topicConfidence, setTopicConfidence] = useState(3);

  const filteredSubjects = subjects?.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  const handleSelectSubject = (id: string) => {
    setSelectedSubjectId(id);
    setEditingTopic(null);
  };

  const handleToggleTopic = async (topic: Topic) => {
    if (!topic.id || !selectedSubjectId) return;
    const nextStatus = !topic.isCompleted;
    
    // Update topic completion
    await db.topics.update(topic.id, { isCompleted: nextStatus });
    
    if (nextStatus) {
      addXP(10); // +10 XP for mastering a syllabus topic
    }

    // Recalculate subject stats
    const allSubjectTopics = await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
    const completed = allSubjectTopics.filter(t => t.isCompleted).length;
    const total = allSubjectTopics.length;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db.subjects.update(selectedSubjectId, {
      topicsDone: completed,
      topicsRemaining: total - completed,
      completionPercent: completionPercent
    });
  };

  const handleOpenEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicNotes(topic.notes || '');
    setTopicMistakes(topic.mistakes || '');
    setTopicResources(topic.resources || '');
    setTopicQSolved(topic.questionsSolved || 0);
    setTopicConfidence(topic.confidence || 3);
  };

  const handleSaveTopicDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editingTopic.id) return;

    await db.topics.update(editingTopic.id, {
      notes: topicNotes,
      mistakes: topicMistakes,
      resources: topicResources,
      questionsSolved: topicQSolved,
      confidence: topicConfidence
    });

    setEditingTopic(null);
  };

  const handleIncrementRevision = async (topic: Topic) => {
    if (!topic.id) return;
    const nextRev = (topic.revisionCount || 0) + 1;
    await db.topics.update(topic.id, { revisionCount: nextRev });
    addXP(5); // +5 XP for completing revision on a topic

    // Recalculate subject total revisions
    if (selectedSubjectId) {
      const allSubjectTopics = await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
      const sumRevs = allSubjectTopics.reduce((sum, t) => sum + (t.revisionCount || 0), 0);
      await db.subjects.update(selectedSubjectId, { revisionCount: sumRevs });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Category Tabs (Rendered if NO subject selected) */}
      {!selectedSubjectId && (
        <div className="flex flex-wrap gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl w-fit max-w-full">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeCategory === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setActiveCategory('gate')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeCategory === 'gate' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GATE ECE
          </button>
          <button
            onClick={() => setActiveCategory('placement')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeCategory === 'placement' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Placements
          </button>
          <button
            onClick={() => setActiveCategory('language')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeCategory === 'language' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Languages
          </button>
        </div>
      )}

      {/* Grid of Subject Cards */}
      {!selectedSubjectId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects?.map((sub) => {
            const Icon = sub.category === 'gate' 
              ? GraduationCap 
              : sub.category === 'placement' 
              ? Briefcase 
              : Languages;

            return (
              <div
                key={sub.id}
                onClick={() => handleSelectSubject(sub.id)}
                className="glass-panel p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-[180px] glow-border group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-300">
                      <Icon size={16} />
                    </div>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold font-mono ${
                      sub.difficulty === 'hard' 
                        ? 'bg-red-500/10 text-red-400' 
                        : sub.difficulty === 'medium' 
                        ? 'bg-yellow-500/10 text-yellow-400' 
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {sub.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                    {sub.name}
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-1">
                      <span>Completion</span>
                      <span>{sub.completionPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${sub.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono border-t border-white/5 pt-2">
                    <span>Hours: {sub.totalHours}h</span>
                    <span>Revisions: {sub.revisionCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill-down Detail View */}
      {selectedSubjectId && activeSubject && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          {/* Detail Header / Back button */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Syllabus</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
                {activeSubject.category} track
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{activeSubject.name}</h2>
            </div>
          </div>

          {/* Main Grid: Syllabus Chapters Left, Topic detail editor Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chapters list checklist */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Mastery Checklist</h3>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {topics && topics.length > 0 ? (
                  topics.map((topic) => (
                    <div 
                      key={topic.id}
                      className={`p-4 rounded-xl border transition-all ${
                        topic.isCompleted 
                          ? 'bg-emerald-500/[0.01] border-emerald-500/10' 
                          : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTopic(topic)}
                            className="text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
                          >
                            {topic.isCompleted ? (
                              <CheckSquare size={18} className="text-emerald-500" />
                            ) : (
                              <Square size={18} className="text-zinc-600" />
                            )}
                          </button>
                          <div>
                            <div className={`text-xs font-semibold ${topic.isCompleted ? 'line-through text-zinc-500' : 'text-white'}`}>
                              {topic.name}
                            </div>
                            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                              {topic.moduleName} • {topic.chapterName}
                            </div>
                          </div>
                        </div>

                        {/* Control badges */}
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <button
                            onClick={() => handleIncrementRevision(topic)}
                            className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all font-bold cursor-pointer"
                            title="Complete a Spaced Repetition revision block"
                          >
                            Revise ({topic.revisionCount || 0})
                          </button>
                          
                          {/* Confidence rating */}
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                className={i < (topic.confidence || 0) ? 'fill-amber-500' : 'opacity-25'} 
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => handleOpenEditTopic(topic)}
                            className="px-2 py-0.5 rounded border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-zinc-500 font-sans border border-dashed border-white/5 rounded-xl">
                    No chapters defined for this subject.
                  </div>
                )}
              </div>
            </div>

            {/* Topic details drawer */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-5 bg-white/[0.01] border border-white/5 sticky top-24">
                {editingTopic ? (
                  <form onSubmit={handleSaveTopicDetails} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[200px]">
                        Logs: {editingTopic.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingTopic(null)}
                        className="text-zinc-500 hover:text-white text-[10px] font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">CONFIDENCE MASTERY</label>
                      <div className="flex items-center gap-1.5 text-amber-500 cursor-pointer">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            onClick={() => setTopicConfidence(i + 1)}
                            className={i < topicConfidence ? 'fill-amber-500' : 'opacity-25'}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">QUESTIONS SOLVED</label>
                      <input 
                        type="number" 
                        value={topicQSolved}
                        onChange={(e) => setTopicQSolved(parseInt(e.target.value))}
                        className="w-full p-2 rounded bg-zinc-950 border border-white/5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">TOPIC NOTES</label>
                      <textarea
                        value={topicNotes}
                        onChange={(e) => setTopicNotes(e.target.value)}
                        placeholder="Key formulas or summaries..."
                        rows={3}
                        className="w-full p-2 rounded bg-zinc-950 border border-white/5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">MISTAKES / CONCEPT SLIPS</label>
                      <textarea
                        value={topicMistakes}
                        onChange={(e) => setTopicMistakes(e.target.value)}
                        placeholder="Log any tricky questions or traps..."
                        rows={2}
                        className="w-full p-2 rounded bg-zinc-950 border border-white/5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">RESOURCES USED</label>
                      <input 
                        type="text" 
                        value={topicResources}
                        onChange={(e) => setTopicResources(e.target.value)}
                        placeholder="Books, lectures, sheets..."
                        className="w-full p-2 rounded bg-zinc-950 border border-white/5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Save Topic Log
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-16 text-zinc-500 text-xs font-sans">
                    <HelpCircle className="mx-auto mb-2 text-zinc-600" size={20} />
                    <span>Select &quot;Logs&quot; on any subtopic to read and write detail study summaries.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
