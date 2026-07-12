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
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, Sparkles } from 'lucide-react';

export default function Home() {
  const { seedCompleted } = useStore();
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Auth states
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check mobile viewport on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!isAuthChecked || isOnboarded === null) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
        Loading study workspace...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

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

  const mobileTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen text-white bg-zinc-950/20 antialiased relative">
      
      {/* Sidebar Nav Drawer - Hidden on Mobile */}
      {!isMobile && (
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />
      )}

      {/* Main Workspace Frame */}
      <div 
        className={`transition-all duration-300 min-h-screen py-4 flex flex-col ${isMobile ? 'px-4 pb-24' : 'pr-4'}`}
        style={{ marginLeft: isMobile ? '0px' : (sidebarCollapsed ? '104px' : '280px') }}
      >
        
        {/* Workspace top header */}
        <Header 
          currentView={currentView} 
          setView={setView}
          onSearchClick={() => setCommandPaletteOpen(true)} 
        />

        {/* Workspace Central Viewport */}
        <main className="flex-1 w-full bg-transparent">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-lg border-t border-white/5 z-40 flex items-center justify-around px-2 pb-safe">
          {mobileTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                  isActive ? 'text-purple-400 font-bold scale-110' : 'text-zinc-400'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-purple-400' : 'text-zinc-400'} />
                <span className="text-[10px] mt-1 font-sans tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

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
