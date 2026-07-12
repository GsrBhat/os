'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  Bookmark, 
  CheckSquare, 
  Square,
  Plus,
  Trash,
  HelpCircle
} from 'lucide-react';
import { db, type Subject, type Topic } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/lib/store';

export default function SubjectView() {
  const { activeWorkspaceId, addXP } = useStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Custom subject inputs
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('purple');

  // Custom topic inputs
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicModule, setNewTopicModule] = useState('General Modules');
  const [newTopicChapter, setNewTopicChapter] = useState('Introduction');

  // Database hooks
  const subjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const activeSubject = useLiveQuery(
    async () => {
      if (!selectedSubjectId) return undefined;
      return await db.subjects.get(selectedSubjectId);
    },
    [selectedSubjectId]
  );

  const topics = useLiveQuery(
    async () => {
      if (!selectedSubjectId) return [];
      return await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
    },
    [selectedSubjectId]
  ) || [];

  // Active topic edit drawer details
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicNotes, setTopicNotes] = useState('');
  const [topicMistakes, setTopicMistakes] = useState('');
  const [topicResources, setTopicResources] = useState('');
  const [topicQSolved, setTopicQSolved] = useState(0);
  const [topicConfidence, setTopicConfidence] = useState(3);

  const handleSelectSubject = (id: number) => {
    setSelectedSubjectId(id);
    setEditingTopic(null);
  };

  const handleCreateSubject = async () => {
    if (newSubName.trim()) {
      await db.subjects.add({
        workspaceId: activeWorkspaceId || 1,
        name: newSubName.trim(),
        color: newSubColor,
        completionPercent: 0
      });
      setNewSubName('');
      setShowAddSub(false);
    }
  };

  const handleDeleteSubject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this subject and all its topics?')) {
      await db.subjects.delete(id);
      await db.topics.where('subjectId').equals(id).delete();
      if (selectedSubjectId === id) {
        setSelectedSubjectId(null);
      }
    }
  };

  const handleCreateTopic = async () => {
    if (selectedSubjectId && newTopicName.trim()) {
      await db.topics.add({
        subjectId: selectedSubjectId,
        moduleName: newTopicModule.trim() || 'General Modules',
        chapterName: newTopicChapter.trim() || 'Introduction',
        name: newTopicName.trim(),
        isCompleted: false,
        revisionCount: 0,
        confidence: 1,
        notes: '',
        mistakes: '',
        resources: '',
        questionsSolved: 0
      });
      
      // Update subject count
      const allSubjectTopics = await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
      const completed = allSubjectTopics.filter(t => t.isCompleted).length;
      await db.subjects.update(selectedSubjectId, {
        completionPercent: Math.round((completed / allSubjectTopics.length) * 100)
      });

      setNewTopicName('');
      setShowAddTopic(false);
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (confirm('Are you sure you want to remove this topic?')) {
      await db.topics.delete(id);
      if (editingTopic?.id === id) setEditingTopic(null);
      
      // Recalculate stats
      if (selectedSubjectId) {
        const allSubjectTopics = await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
        const completed = allSubjectTopics.filter(t => t.isCompleted).length;
        await db.subjects.update(selectedSubjectId, {
          completionPercent: allSubjectTopics.length > 0 ? Math.round((completed / allSubjectTopics.length) * 100) : 0
        });
      }
    }
  };

  const handleToggleTopic = async (topic: Topic) => {
    if (!topic.id || !selectedSubjectId) return;
    const nextStatus = !topic.isCompleted;
    
    await db.topics.update(topic.id, { isCompleted: nextStatus });
    if (nextStatus) {
      addXP(10);
    }

    const allSubjectTopics = await db.topics.where('subjectId').equals(selectedSubjectId).toArray();
    const completed = allSubjectTopics.filter(t => t.isCompleted).length;
    await db.subjects.update(selectedSubjectId, {
      completionPercent: Math.round((completed / allSubjectTopics.length) * 100)
    });
  };

  const handleIncrementRevision = async (topic: Topic) => {
    if (!topic.id || !selectedSubjectId) return;
    const currentRevisions = topic.revisionCount || 0;
    await db.topics.update(topic.id, { revisionCount: currentRevisions + 1 });
    addXP(10);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Subjects Grid View */}
      {!selectedSubjectId && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl glass-panel">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-purple-400" size={18} />
              <span className="text-sm font-semibold text-zinc-300 font-sans">Active Subject Tracks</span>
            </div>
            <button
              onClick={() => setShowAddSub(!showAddSub)}
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Subject</span>
            </button>
          </div>

          {/* Add Subject form */}
          {showAddSub && (
            <div className="glass-panel p-4 border border-white/10 bg-zinc-900/90 max-w-sm space-y-4 animate-in slide-in-from-top-2 duration-150 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider">Configure New Subject</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Subject name"
                  className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
                />
                <select
                  value={newSubColor}
                  onChange={(e) => setNewSubColor(e.target.value)}
                  className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="purple">Purple Accent</option>
                  <option value="blue">Blue Accent</option>
                  <option value="emerald">Green Accent</option>
                  <option value="red">Red Accent</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateSubject}
                  className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer text-center"
                >
                  Save
                </button>
                <button 
                  onClick={() => setShowAddSub(false)}
                  className="px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {subjects.length > 0 ? (
              subjects.map((sub) => (
                <div 
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub.id!)}
                  className="glass-panel p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all flex flex-col justify-between min-h-[140px] cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          sub.color === 'blue' ? 'bg-blue-500' : sub.color === 'emerald' ? 'bg-emerald-500' : sub.color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                        }`} />
                        <h3 className="font-bold text-sm text-white truncate max-w-[150px]">{sub.name}</h3>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSubject(sub.id!, e)}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Completion Percentage</span>
                      <span className="font-bold text-white">{sub.completionPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.color === 'blue' ? 'bg-blue-500' : sub.color === 'emerald' ? 'bg-emerald-500' : sub.color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${sub.completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl">
                No subjects logged for this workspace. Click Create Subject to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Detailed Subject Chapters Breakdown View */}
      {selectedSubjectId && activeSubject && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <button 
              onClick={() => setSelectedSubjectId(null)}
              className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{activeSubject?.name}</h2>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Syllabus Chapters Outline</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                <span className="text-xs font-semibold text-zinc-400">Mastered Chapters</span>
                <button 
                  onClick={() => setShowAddTopic(!showAddTopic)}
                  className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Topic</span>
                </button>
              </div>

              {/* Add Topic form */}
              {showAddTopic && (
                <div className="glass-panel p-4 border border-white/10 bg-zinc-900/90 space-y-4 animate-in slide-in-from-top-2 duration-150 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider">Configure New Syllabus Topic</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="Topic name"
                      className="col-span-1 p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={newTopicModule}
                      onChange={(e) => setNewTopicModule(e.target.value)}
                      placeholder="Module name"
                      className="col-span-1 p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={newTopicChapter}
                      onChange={(e) => setNewTopicChapter(e.target.value)}
                      placeholder="Chapter name"
                      className="col-span-1 p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreateTopic}
                      className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer text-center"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setShowAddTopic(false)}
                      className="px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {topics.length > 0 ? (
                  topics.map((topic) => (
                    <div 
                      key={topic.id}
                      className={`p-4 rounded-xl border transition-all group ${
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

                          <button
                            onClick={() => handleDeleteTopic(topic.id!)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5 cursor-pointer"
                          >
                            <Trash size={12} />
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
                        className="text-zinc-500 hover:text-white text-[10px] font-bold"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Confidence Score</label>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTopicConfidence(idx + 1)}
                              className="p-0.5 hover:scale-125 transition-transform"
                            >
                              <Star size={16} className={idx < topicConfidence ? 'fill-amber-500' : 'opacity-20'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Study Questions Solved</label>
                        <input
                          type="number"
                          value={topicQSolved}
                          onChange={(e) => setTopicQSolved(parseInt(e.target.value) || 0)}
                          className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Study Notes</label>
                        <textarea
                          value={topicNotes}
                          onChange={(e) => setTopicNotes(e.target.value)}
                          placeholder="Quick summary equations or codes..."
                          className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 h-20 resize-none font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Mistakes & Hurdles Logged</label>
                        <textarea
                          value={topicMistakes}
                          onChange={(e) => setTopicMistakes(e.target.value)}
                          placeholder="Conceptual mistakes, wrong question traps..."
                          className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 h-20 resize-none font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Study References & Links</label>
                        <input
                          type="text"
                          value={topicResources}
                          onChange={(e) => setTopicResources(e.target.value)}
                          placeholder="Drive folder or video URL links..."
                          className="w-full p-2 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Save Topic Log
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-20 text-zinc-500 text-xs space-y-2 select-none">
                    <HelpCircle className="mx-auto text-zinc-700 animate-pulse" size={24} />
                    <p className="font-semibold text-zinc-400">No active logs selected</p>
                    <p className="text-[10px] text-zinc-600 max-w-[150px] mx-auto">Click &quot;Logs&quot; beside any chapter to configure summary equations, mistakes, and resources solved.</p>
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
