'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, runDatabaseMigration } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

interface StoreContextProps {
  xp: number;
  level: number;
  coins: number;
  badges: string[];
  addXP: (amount: number) => void;
  activeTimer: { taskId: number; startTime: number; accumulatedSeconds: number } | null;
  startTaskTimer: (taskId: number) => void;
  pauseTaskTimer: () => void;
  stopTaskTimer: () => void;
  settings: {
    theme: 'dark' | 'light' | 'midnight' | 'blue' | 'purple';
    animations: boolean;
    accentColor: string;
    geminiApiKey: string;
  };
  updateSettings: (newSettings: Partial<StoreContextProps['settings']>) => void;
  activeWorkspaceId: number | null;
  setActiveWorkspaceId: (id: number | null) => void;
  changeWorkspace: (id: number) => void;
  triggerMigration: () => Promise<void>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [coins, setCoins] = useState<number>(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [activeTimer, setActiveTimer] = useState<StoreContextProps['activeTimer']>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [settings, setSettings] = useState<StoreContextProps['settings']>({
    theme: 'midnight',
    animations: true,
    accentColor: 'blue',
    geminiApiKey: '',
  });

  // Run Database Migrations on startup
  const triggerMigration = async () => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    await runDatabaseMigration(user);
    
    // Resolve active workspace after migrations
    const workspaces = await db.workspaces.toArray();
    if (workspaces.length > 0) {
      const savedActiveWs = localStorage.getItem(`aetheros_active_workspace_${user}`);
      const activeWsId = savedActiveWs ? parseInt(savedActiveWs, 10) : workspaces[0].id!;
      setActiveWorkspaceId(activeWsId);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    triggerMigration();
  }, []);

  // Load User Info & Settings from LocalStorage (Scoped per user for AetherOS)
  useEffect(() => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    const savedXP = localStorage.getItem(`aetheros_xp_${user}`);
    const savedLevel = localStorage.getItem(`aetheros_level_${user}`);
    const savedCoins = localStorage.getItem(`aetheros_coins_${user}`);
    const savedBadges = localStorage.getItem(`aetheros_badges_${user}`);
    const savedSettings = localStorage.getItem(`aetheros_settings_${user}`);

    if (savedXP) setXp(parseInt(savedXP, 10));
    else setXp(0);
    if (savedLevel) setLevel(parseInt(savedLevel, 10));
    else setLevel(1);
    if (savedCoins) setCoins(parseInt(savedCoins, 10));
    else setCoins(0);
    if (savedBadges) setBadges(JSON.parse(savedBadges));
    else setBadges([]);
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Active Timer restore
    const savedTimer = localStorage.getItem(`aetheros_active_timer_${user}`);
    if (savedTimer) {
      setActiveTimer(JSON.parse(savedTimer));
    }
  }, []);

  // Sync theme to body element
  useEffect(() => {
    document.body.className = `theme-${settings.theme} bg-grid-pattern min-h-screen`;
  }, [settings.theme]);

  const addXP = (amount: number) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    setXp((prevXP) => {
      const newXP = prevXP + amount;
      localStorage.setItem(`aetheros_xp_${user}`, newXP.toString());
      
      const newLevel = Math.floor(newXP / 100) + 1;
      setLevel((prevLevel) => {
        if (newLevel > prevLevel) {
          localStorage.setItem(`aetheros_level_${user}`, newLevel.toString());
          setCoins((prevCoins) => {
            const newCoins = prevCoins + 50;
            localStorage.setItem(`aetheros_coins_${user}`, newCoins.toString());
            return newCoins;
          });
          return newLevel;
        }
        return prevLevel;
      });

      return newXP;
    });
  };

  const startTaskTimer = (taskId: number) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    const timer = { taskId, startTime: Date.now(), accumulatedSeconds: 0 };
    setActiveTimer(timer);
    localStorage.setItem(`aetheros_active_timer_${user}`, JSON.stringify(timer));
    db.tasks.update(taskId, { status: 'in-progress' });
  };

  const pauseTaskTimer = async () => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    if (!activeTimer) return;
    const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    const totalSeconds = activeTimer.accumulatedSeconds + elapsedSeconds;

    const task = await db.tasks.get(activeTimer.taskId);
    if (task) {
      const additionalMinutes = Math.floor(totalSeconds / 60);
      await db.tasks.update(activeTimer.taskId, {
        status: 'paused',
        actualDuration: task.actualDuration + additionalMinutes,
      });
    }

    setActiveTimer(null);
    localStorage.removeItem(`aetheros_active_timer_${user}`);
  };

  const stopTaskTimer = async () => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    if (!activeTimer) return;
    const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    const totalSeconds = activeTimer.accumulatedSeconds + elapsedSeconds;

    const task = await db.tasks.get(activeTimer.taskId);
    if (task) {
      const additionalMinutes = Math.floor(totalSeconds / 60);
      await db.tasks.update(activeTimer.taskId, {
        status: 'completed',
        actualDuration: task.actualDuration + additionalMinutes,
      });
      addXP(15);
    }

    setActiveTimer(null);
    localStorage.removeItem(`aetheros_active_timer_${user}`);
  };

  const updateSettings = (newSettings: Partial<StoreContextProps['settings']>) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(`aetheros_settings_${user}`, JSON.stringify(updated));
      return updated;
    });
  };

  const changeWorkspace = (id: number) => {
    const user = localStorage.getItem('aetheros_current_user') || 'default';
    setActiveWorkspaceId(id);
    localStorage.setItem(`aetheros_active_workspace_${user}`, id.toString());
  };

  return (
    <StoreContext.Provider
      value={{
        xp,
        level,
        coins,
        badges,
        addXP,
        activeTimer,
        startTaskTimer,
        pauseTaskTimer,
        stopTaskTimer,
        settings,
        updateSettings,
        activeWorkspaceId,
        setActiveWorkspaceId,
        changeWorkspace,
        triggerMigration
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
