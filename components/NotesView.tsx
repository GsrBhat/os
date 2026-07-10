'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/lib/db';
import { Search, Plus, BookOpen, Trash2, Edit, Eye, Code, Save, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

// Light Markdown to HTML parser
function parseMarkdown(md: string): string {
  if (!md) return '';
  let html = md;
  
  // Escape HTML tags to prevent XSS
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

  // Checkboxes
  html = html.replace(/^\[ \] (.*?)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded border-white/10 bg-white/5" /> <span class="text-zinc-300 text-xs">$1</span></div>');
  html = html.replace(/^\[x\] (.*?)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded bg-purple-500 border-0" /> <span class="line-through text-zinc-500 text-xs">$1</span></div>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');

  // Newlines
  html = html.replace(/\n/g, '<br />');

  return html;
}

export default function NotesView() {
  const { addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries
  const notes = useLiveQuery(() => db.notes.toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);

  // Note editor states
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Set active note on mount / select
  useEffect(() => {
    if (activeNoteId) {
      db.notes.get(activeNoteId).then((note) => {
        if (note) {
          setNoteTitle(note.title);
          setNoteContent(note.content);
          setNoteSubject(note.subjectId);
        }
      });
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteSubject('');
    }
  }, [activeNoteId]);

  const handleCreateNote = async () => {
    const defaultSubject = subjects?.[0]?.id || 'gate-networks';
    const newNote: Note = {
      title: 'Untitled Note',
      content: '# Untitled Note\n\nWrite your markdown notes here...',
      subjectId: defaultSubject,
      lastEdited: todayStr
    };

    const id = await db.notes.add(newNote);
    setActiveNoteId(id);
    addXP(5); // +5 XP for adding a new note
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await db.notes.delete(id);
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    }
  };

  // Auto save notes as typing
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
      await db.notes.update(activeNoteId, { subjectId: val });
    }
  };

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs text-white placeholder-zinc-500 w-full"
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

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredNotes && filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id!)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 group transition-colors cursor-pointer ${
                  activeNoteId === note.id 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <BookOpen size={14} className={activeNoteId === note.id ? 'text-purple-400' : 'text-zinc-500'} />
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{note.title}</h4>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">
                      {note.subjectId.split('-')[1] || 'notes'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id!);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-zinc-500 text-xs font-sans">
              No notes found.
            </div>
          )}
        </div>

      </div>

      {/* Editor & Preview Pane */}
      <div className="lg:col-span-3 h-full overflow-hidden glass-panel border border-white/5 bg-white/[0.01] flex flex-col justify-between">
        {activeNoteId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-black/10 shrink-0">
              <div className="flex items-center gap-4 flex-grow">
                {/* Note title input */}
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter Title..."
                  className="bg-transparent border-0 outline-none text-sm font-bold text-white placeholder-zinc-500 max-w-[200px]"
                />

                {/* Subject selector */}
                <select
                  value={noteSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="p-1.5 rounded-lg bg-zinc-950 border border-white/5 text-[10px] font-semibold text-zinc-400 focus:outline-none"
                >
                  {subjects?.map((sub) => (
                    <option key={sub.id} value={sub.id} className="bg-zinc-950 text-white">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View/Edit Toggle */}
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5 text-[10px] font-semibold">
                <button
                  onClick={() => setIsPreview(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer ${
                    !isPreview ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code size={12} />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setIsPreview(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer ${
                    isPreview ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Split viewport or editor */}
            <div className="flex-1 overflow-hidden">
              {isPreview ? (
                /* Live Preview Mode */
                <div 
                  className="h-full overflow-y-auto p-6 font-sans text-xs text-zinc-300 leading-relaxed max-w-none select-text"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(noteContent) }}
                />
              ) : (
                /* Markdown editor code pane */
                <textarea
                  value={noteContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="# Enter your markdown here...&#10;&#10;Use standard markdown tags:&#10;- # Header 1&#10;- ## Header 2&#10;- **bold text**&#10;- - list item&#10;- [ ] checkbox task&#10;- `inline code`&#10;- ```code blocks```"
                  className="w-full h-full p-6 bg-transparent border-0 outline-none text-xs font-mono text-zinc-300 resize-none leading-relaxed"
                />
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 text-xs font-sans gap-3 py-16">
            <Sparkles className="text-zinc-600 animate-pulse" size={24} />
            <span>Select a note from the sidebar or click the plus button to start writing markdown summaries.</span>
          </div>
        )}
      </div>

    </div>
  );
}
