'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { type ViewType } from '@/components/Sidebar';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';
import Onboarding from '@/components/Onboarding';
import DashboardView from '@/components/DashboardView';
import PlannerView from '@/components/PlannerView';
import SubjectView from '@/components/SubjectView';
import FocusView from '@/components/FocusView';
import MistakesView from '@/components/MistakesView';
import AnalyticsView from '@/components/AnalyticsView';
import HabitsView from '@/components/HabitsView';
import NotesView from '@/components/NotesView';
import CalendarView from '@/components/CalendarView';
import AIAssistantView from '@/components/AIAssistantView';
import AuthView from '@/components/AuthView';
import SettingsView from '@/components/SettingsView';
import { useStore } from '@/lib/store';

export default function Home() {
  const { seedCompleted } = useStore();
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  
  // Auth states
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check onboarding status and auth from LocalStorage on mount
  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user');
    setCurrentUser(user);

    const onboardedKey = user ? `aetheros_onboarded_${user}` : 'aetheros_onboarded';
    const onboarded = localStorage.getItem(onboardedKey);
    setIsOnboarded(onboarded === 'true');
    setIsAuthChecked(true);
  }, []);

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('aetheros_current_user', username);
    window.location.reload(); // Reload triggers new scoped Dexie DB connection
  };

  const handleOnboardingComplete = () => {
    if (currentUser) {
      localStorage.setItem(`aetheros_onboarded_${currentUser}`, 'true');
    } else {
      localStorage.setItem('aetheros_onboarded', 'true');
    }
    setIsOnboarded(true);
  };

  const handleOpenAddTask = () => {
    setView('planner');
    setAddTaskModalOpen(true);
  };

  // Wait until auth status is checked
  if (!isAuthChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 font-mono text-xs text-zinc-500 gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
        <span>Verifying login state...</span>
      </div>
    );
  }

  // Show Auth view if no active session
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Wait until onboarding check and DB seed is evaluated
  if (isOnboarded === null || !seedCompleted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 font-mono text-xs text-zinc-500 gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
        <span>Initializing SaiOS Workspace...</span>
      </div>
    );
  }

  // Show onboarding wizard if not onboarded
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Render correct view panel
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView setView={setView} onAddTaskClick={handleOpenAddTask} />;
      case 'planner':
        return <PlannerView showAddTaskModal={addTaskModalOpen} setShowAddTaskModal={setAddTaskModalOpen} />;
      case 'calendar':
        return <CalendarView />;
      case 'subjects':
        return <SubjectView />;
      case 'focus':
        return <FocusView />;
      case 'mistakes':
        return <MistakesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'habits':
        return <HabitsView />;
      case 'notes':
        return <NotesView />;
      case 'ai':
        return <AIAssistantView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView setView={setView} onAddTaskClick={handleOpenAddTask} />;
    }
  };

  return (
    <div className="min-h-screen text-white bg-zinc-950/20 antialiased relative">
      
      {/* Sidebar Nav Drawer */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />

      {/* Main Workspace Frame */}
      <div 
        className="transition-all duration-300 min-h-screen py-4 pr-4 flex flex-col"
        style={{ marginLeft: sidebarCollapsed ? '104px' : '280px' }}
      >
        
        {/* Workspace top header */}
        <Header 
          currentView={currentView} 
          onSearchClick={() => setCommandPaletteOpen(true)} 
        />

        {/* Workspace Central Viewport */}
        <main className="flex-1 w-full bg-transparent">
          {renderView()}
        </main>
      </div>

      {/* Command Launcher Modal overlay */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        setIsOpen={setCommandPaletteOpen} 
        setView={setView} 
        onAddTaskClick={handleOpenAddTask}
      />
    </div>
  );
}
