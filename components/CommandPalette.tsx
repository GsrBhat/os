'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Layout, Play, Plus, Moon, Download, Sparkles, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { type ViewType } from '@/components/Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setView: (view: ViewType) => void;
  onAddTaskClick: () => void;
}

export default function CommandPalette({ isOpen, setIsOpen, setView, onAddTaskClick }: CommandPaletteProps) {
  const { settings, updateSettings } = useStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', category: 'Navigation', icon: Layout, action: () => setView('dashboard') },
    { id: 'nav-planner', title: 'Go to Daily Planner', category: 'Navigation', icon: Layout, action: () => setView('planner') },
    { id: 'nav-subjects', title: 'Go to Subject Tracker', category: 'Navigation', icon: Layout, action: () => setView('subjects') },
    { id: 'nav-focus', title: 'Go to Focus Mode', category: 'Navigation', icon: Play, action: () => setView('focus') },
    { id: 'nav-mistakes', title: 'Go to Mistake Repo', category: 'Navigation', icon: Layout, action: () => setView('mistakes') },
    { id: 'nav-analytics', title: 'Go to Analytics', category: 'Navigation', icon: Layout, action: () => setView('analytics') },
    { id: 'nav-habits', title: 'Go to Habit Tracker', category: 'Navigation', icon: Layout, action: () => setView('habits') },
    { id: 'nav-notes', title: 'Go to Smart Notes', category: 'Navigation', icon: Layout, action: () => setView('notes') },
    { id: 'nav-ai', title: 'Go to AI Assistant', category: 'Navigation', icon: Sparkles, action: () => setView('ai') },
    { id: 'nav-settings', title: 'Go to Settings', category: 'Navigation', icon: Layout, action: () => setView('settings') },

    // Quick Actions
    { id: 'act-add-task', title: 'Create a New Task', category: 'Actions', icon: Plus, action: () => { onAddTaskClick(); } },
    { id: 'act-theme-midnight', title: 'Switch to Midnight Theme', category: 'Theme', icon: Moon, action: () => updateSettings({ theme: 'midnight' }) },
    { id: 'act-theme-dark', title: 'Switch to Dark Theme', category: 'Theme', icon: Moon, action: () => updateSettings({ theme: 'dark' }) },
    { id: 'act-theme-blue', title: 'Switch to Electric Blue Theme', category: 'Theme', icon: Moon, action: () => updateSettings({ theme: 'blue' }) },
    { id: 'act-theme-purple', title: 'Switch to Purple Theme', category: 'Theme', icon: Moon, action: () => updateSettings({ theme: 'purple' }) },
    { id: 'act-backup', title: 'Export Backup Data (JSON)', category: 'System', icon: Download, action: () => document.getElementById('export-backup-btn')?.click() }
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, filteredItems, selectedIndex, setIsOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="glass-panel w-full max-w-lg overflow-hidden border border-white/10 bg-zinc-950/95 shadow-2xl flex flex-col max-h-[50vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
          <Search className="text-zinc-400 shrink-0" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-0 outline-none text-sm text-white placeholder-zinc-500 font-sans"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto py-2 divide-y divide-white/[0.02]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={14} className={isSelected ? 'text-purple-400' : 'text-zinc-500'} />
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 font-sans">
              No results found for &quot;{search}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.01] border-t border-white/5 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
