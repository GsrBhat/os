'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/lib/db';
import { Search, Plus, BookOpen, Trash2, Edit, Eye, Code, Save, Sparkles, Network } from 'lucide-react';
import { useStore } from '@/lib/store';

// Light Markdown to HTML parser
function parseMarkdown(md: string): string {
  if (!md) return '';
  let html = md;
  
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h5 class="text-xs font-extrabold text-white mt-4 mb-1.5 uppercase tracking-wider">$1</h5>');
  html = html.replace(/^## (.*?)$/gm, '<h4 class="text-sm font-bold text-purple-400 mt-5 mb-2 border-b border-white/5 pb-1">$1</h4>');
  html = html.replace(/^# (.*?)$/gm, '<h3 class="text-base font-extrabold text-white mt-6 mb-3">$1</h3>');

  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-950 p-3 rounded-xl border border-white/5 font-mono text-[10px] text-purple-300 overflow-x-auto my-3">$1</pre>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px] text-pink-400">$1</code>');

  // Lists
  html = html.replace(/^\- (.*?)$/gm, '<li class="list-disc pl-1 ml-4 text-zinc-300">$1</li>');

  // Newlines
  html = html.replace(/\n/g, '<br />');

  return html;
}

export default function NotesView() {
  const { activeWorkspaceId, addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries scoped to workspace
  const notes = useLiveQuery(() => 
    db.notes.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const subjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  // Note editor states
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  // Set active note on mount / select
  useEffect(() => {
    if (activeNoteId) {
      db.notes.get(activeNoteId).then((note) => {
        if (note) {
          setNoteTitle(note.title);
          setNoteContent(note.content);
          setNoteSubject(note.subjectId ? note.subjectId.toString() : '');
        }
      });
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteSubject('');
    }
  }, [activeNoteId]);

  const handleCreateNote = async () => {
    const defaultSubject = subjects?.[0]?.id || undefined;
    const newNote: Omit<Note, 'id'> = {
      workspaceId: activeWorkspaceId || 1,
      subjectId: defaultSubject,
      title: 'Untitled Note',
      content: '# Untitled Note\n\nWrite your markdown notes here...',
      lastEdited: todayStr
    };

    const id = await db.notes.add(newNote as Note);
    setActiveNoteId(id as number);
    addXP(5);
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await db.notes.delete(id);
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    }
  };

  const handleContentChange = async (val: string) => {
    setNoteContent(val);
    if (activeNoteId) {
      await db.notes.update(activeNoteId, { content: val });
    }
  };

  const handleTitleChange = async (val: string) => {
    setNoteTitle(val);
    if (activeNoteId) {
      await db.notes.update(activeNoteId, { title: val });
    }
  };

  const handleSubjectChange = async (val: string) => {
    setNoteSubject(val);
    if (activeNoteId) {
      await db.notes.update(activeNoteId, { subjectId: val ? Number(val) : undefined });
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate coordinates for Obsidian-like Knowledge Graph SVG Nodes
  const renderObsidianGraph = () => {
    const radius = 180;
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    // Subjects nodes
    const subjectNodes = subjects.map((sub, index) => {
      const angle = (index / (subjects.length || 1)) * 2 * Math.PI;
      return {
        id: sub.id,
        name: sub.name,
        type: 'subject',
        x: centerX + Math.cos(angle) * (radius * 0.5),
        y: centerY + Math.sin(angle) * (radius * 0.5),
        color: sub.color === 'blue' ? '#3b82f6' : sub.color === 'emerald' ? '#10b981' : '#a855f7'
      };
    });

    // Notes nodes
    const noteNodes = notes.map((note, index) => {
      const parentSub = subjectNodes.find(s => s.id === note.subjectId);
      const px = parentSub ? parentSub.x : centerX;
      const py = parentSub ? parentSub.y : centerY;
      
      const angle = (index / (notes.length || 1)) * 2 * Math.PI;
      return {
        id: note.id,
        name: note.title,
        type: 'note',
        x: px + Math.cos(angle) * 70,
        y: py + Math.sin(angle) * 70,
        parentX: px,
        parentY: py
      };
    });

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Interactive Knowledge Graph Network</h4>
          <p className="text-[10px] text-zinc-500 mt-1">Shows connections between Subject outlines and Markdown Note cards.</p>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xl bg-zinc-950/40 rounded-2xl border border-white/5">
          {/* Render connection lines */}
          {noteNodes.map((n, idx) => (
            <line
              key={`line-${idx}`}
              x1={n.x}
              y1={n.y}
              x2={n.parentX}
              y2={n.parentY}
              stroke="#ffffff"
              strokeOpacity="0.1"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="animate-[dash_10s_linear_infinite]"
            />
          ))}

          {/* Render subject nodes */}
          {subjectNodes.map((s, idx) => (
            <g key={`sub-node-${idx}`}>
              <circle
                cx={s.x}
                cy={s.y}
                r="18"
                fill={s.color}
                fillOpacity="0.15"
                stroke={s.color}
                strokeWidth="2"
              />
              <text
                x={s.x}
                y={s.y + 30}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontWeight="bold"
                className="select-none"
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Render note nodes */}
          {noteNodes.map((n, idx) => (
            <g 
              key={`note-node-${idx}`} 
              className="cursor-pointer group"
              onClick={() => {
                if (n.id) {
                  setActiveNoteId(n.id);
                  setShowGraph(false);
                }
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r="8"
                fill="#a855f7"
                fillOpacity="0.3"
                stroke="#a855f7"
                strokeWidth="1.5"
                className="hover:scale-125 transition-transform"
              />
              <text
                x={n.x}
                y={n.y - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="7"
                className="opacity-60 group-hover:opacity-100 select-none font-semibold transition-opacity"
              >
                {n.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh] items-stretch animate-in fade-in duration-300">
      
      {/* Sidebar - Note files list */}
      <div className="glass-panel p-4 flex flex-col gap-4 border border-white/5 bg-white/[0.01] lg:col-span-1 h-full overflow-hidden">
        
        {/* Search & Plus buttons */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-xl px-3 py-1.5 flex-grow">
            <Search size={14} className="text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent border-0 text-xs text-white focus:outline-none w-full placeholder-zinc-600 font-sans"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
            title="Create Note"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* View togglers */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-950/40 border border-white/5 text-xs font-semibold select-none">
          <button
            onClick={() => setShowGraph(false)}
            className={`py-1 rounded-lg cursor-pointer ${!showGraph ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
          >
            List
          </button>
          <button
            onClick={() => setShowGraph(true)}
            className={`py-1 rounded-lg cursor-pointer flex items-center justify-center gap-1 ${showGraph ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
          >
            <Network size={12} />
            <span>Graph</span>
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-sans">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div 
                key={note.id}
                onClick={() => {
                  if (note.id) {
                    setActiveNoteId(note.id);
                    setShowGraph(false);
                  }
                }}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  activeNoteId === note.id 
                    ? 'bg-purple-500/10 border-purple-500/20 text-white' 
                    : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/[0.01] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <BookOpen size={14} className={activeNoteId === note.id ? 'text-purple-400' : 'text-zinc-500'} />
                  <span className="text-xs font-semibold truncate">{note.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (note.id) handleDeleteNote(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-0.5 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-600 text-xs select-none">No notes created.</div>
          )}
        </div>
      </div>

      {/* Editor / Graph Viewport */}
      <div className="glass-panel border border-white/5 bg-white/[0.01] lg:col-span-3 h-full overflow-hidden flex flex-col p-4 md:p-6 justify-between relative">
        {showGraph ? (
          renderObsidianGraph()
        ) : activeNoteId ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header toolbar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent border-0 text-base font-bold text-white focus:outline-none border-b border-transparent focus:border-purple-500/50 pb-0.5"
                />
                
                <select
                  value={noteSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="p-1 rounded-lg border border-white/5 bg-zinc-950 text-[10px] text-zinc-400 cursor-pointer focus:outline-none"
                >
                  <option value="">General Track</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1 bg-white/5 border border-white/5 rounded-xl p-0.5 text-[10px] font-bold select-none">
                <button
                  onClick={() => setIsPreview(false)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${!isPreview ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                >
                  <Code size={12} />
                  <span>Write</span>
                </button>
                <button
                  onClick={() => setIsPreview(true)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${isPreview ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Split panels editor */}
            <div className="flex-1 overflow-hidden">
              {isPreview ? (
                <div 
                  className="h-full overflow-y-auto p-4 rounded-xl border border-white/5 bg-zinc-950/20 text-xs text-zinc-300 font-sans leading-relaxed select-text"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(noteContent) }}
                />
              ) : (
                <textarea
                  value={noteContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Markdown editor supports # Header, ## Subheaders, **Bold text**, `inline code`..."
                  className="w-full h-full p-4 rounded-xl border border-white/5 bg-zinc-950/20 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono resize-none leading-relaxed"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3 select-none">
            <BookOpen className="text-zinc-700 animate-pulse" size={32} />
            <h4 className="text-sm font-semibold text-zinc-400 font-sans">No note selected</h4>
            <p className="text-xs text-zinc-600 max-w-xs leading-relaxed font-sans">Create a new markdown note or click an existing title from the list to start editing formulas, reference sheets, or codes.</p>
          </div>
        )}
      </div>

    </div>
  );
}
