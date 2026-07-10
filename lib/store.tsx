'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, type Task, type DailyLog, type Subject, type Topic, type Mistake, type Habit, type PomodoroLog, type Goal } from './db';
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
  seedCompleted: boolean;
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
  const [seedCompleted, setSeedCompleted] = useState<boolean>(false);
  const [activeTimer, setActiveTimer] = useState<StoreContextProps['activeTimer']>(null);
  const [settings, setSettings] = useState<StoreContextProps['settings']>({
    theme: 'midnight',
    animations: true,
    accentColor: 'blue',
    geminiApiKey: '',
  });

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

  // Seed Data Initializer (Syllabus outline with 0% progress)
  useEffect(() => {
    const seedDatabase = async () => {
      const subjectCount = await db.subjects.count();
      if (subjectCount === 0) {
        // Seed Subjects with 0% Initial Progress
        const initialSubjects: Subject[] = [
          // Placements
          { id: 'placement-python', name: 'Python Core', category: 'placement', completionPercent: 0, topicsDone: 0, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'placement-dsa', name: 'Data Structures & Algorithms', category: 'placement', completionPercent: 0, topicsDone: 0, topicsRemaining: 4, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },
          { id: 'placement-aptitude', name: 'Aptitude & Logical Reasoning', category: 'placement', completionPercent: 0, topicsDone: 0, topicsRemaining: 0, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'placement-resume', name: 'Resume & Portfolio Building', category: 'placement', completionPercent: 0, topicsDone: 0, topicsRemaining: 1, revisionCount: 0, confidence: 1, difficulty: 'easy', totalHours: 0 },
          { id: 'placement-interview', name: 'Mock Interviews & Behavioural', category: 'placement', completionPercent: 0, topicsDone: 0, topicsRemaining: 4, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },

          // GATE ECE
          { id: 'gate-networks', name: 'Network Theory', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'easy', totalHours: 0 },
          { id: 'gate-signals', name: 'Signals & Systems', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 5, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'gate-digital', name: 'Digital Electronics', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 5, revisionCount: 0, confidence: 1, difficulty: 'easy', totalHours: 0 },
          { id: 'gate-analog', name: 'Analog Electronics', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 7, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },
          { id: 'gate-edc', name: 'Electronic Devices (EDC)', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 7, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },
          { id: 'gate-control', name: 'Control Systems', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'gate-communications', name: 'Communication Systems', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },
          { id: 'gate-emtl', name: 'Electromagnetics (EMTL)', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 7, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 0 },
          { id: 'gate-maths', name: 'Engineering Mathematics', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 7, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'gate-aptitude', name: 'General Aptitude', category: 'gate', completionPercent: 0, topicsDone: 0, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'easy', totalHours: 0 },

          // Language
          { id: 'lang-ielts', name: 'IELTS Academic Prep', category: 'language', completionPercent: 0, topicsDone: 0, topicsRemaining: 4, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 },
          { id: 'lang-toefl', name: 'TOEFL Prep', category: 'language', completionPercent: 0, topicsDone: 0, topicsRemaining: 4, revisionCount: 0, confidence: 1, difficulty: 'medium', totalHours: 0 }
        ];
        await db.subjects.bulkAdd(initialSubjects);

        // Seed Topics
        const initialTopics: Topic[] = [
          // Network Theory
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Basic Laws', name: 'Ohm\'s Law & Kirchhoff\'s Laws', isCompleted: false, revisionCount: 0, difficulty: 'easy', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Nodal & Mesh Analysis', name: 'Nodal Analysis with Dependent Sources', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Nodal & Mesh Analysis', name: 'Mesh Analysis with Supermesh', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'gate-networks', moduleName: 'Theorems', chapterName: 'Network Theorems', name: 'Thevenin\'s & Norton\'s Theorems', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'gate-networks', moduleName: 'Theorems', chapterName: 'Network Theorems', name: 'Maximum Power Transfer Theorem', isCompleted: false, revisionCount: 0, difficulty: 'easy', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'gate-networks', moduleName: 'Transients', chapterName: 'Transient Analysis', name: 'First-order RC and RL transient response', isCompleted: false, revisionCount: 0, difficulty: 'hard', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },

          // DSA
          { subjectId: 'placement-dsa', moduleName: 'Data Structures', chapterName: 'Arrays', name: 'Two-Pointer Technique', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'placement-dsa', moduleName: 'Data Structures', chapterName: 'Linked Lists', name: 'Reverse a Linked List', isCompleted: false, revisionCount: 0, difficulty: 'easy', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'placement-dsa', moduleName: 'Algorithms', chapterName: 'Sorting', name: 'Quick Sort & Merge Sort', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'placement-dsa', moduleName: 'Algorithms', chapterName: 'Dynamic Programming', name: '0/1 Knapsack Problem', isCompleted: false, revisionCount: 0, difficulty: 'hard', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },

          // IELTS
          { subjectId: 'lang-ielts', moduleName: 'Writing', chapterName: 'Task 2', name: 'Essay Structure & Argumentation', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
          { subjectId: 'lang-ielts', moduleName: 'Speaking', chapterName: 'Part 2', name: 'Cue Card Speeches (2 Minutes)', isCompleted: false, revisionCount: 0, difficulty: 'medium', confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 }
        ];
        await db.topics.bulkAdd(initialTopics);

        // Seed Goals with 0% progress
        const initialGoals: Goal[] = [
          { title: 'GATE 2027 ECE - Under AIR 100', category: 'gate', deadline: '2027-02-05', progress: 0, milestones: [{ name: 'Syllabus Coverage 100%', completed: false }, { name: 'Previous Year Questions (30 Yrs)', completed: false }, { name: 'Full Test Series (>75/100)', completed: false }] },
          { title: 'Placement Offer at Product Company (>20 LPA)', category: 'placement', deadline: '2027-01-15', progress: 0, milestones: [{ name: 'Striver SDE Sheet Completion', completed: false }, { name: '3 Core Full-stack Projects', completed: false }, { name: 'Mock Interviews (10)', completed: false }] },
          { title: 'IELTS Band 8.0 Overall', category: 'language', deadline: '2026-10-20', progress: 0, milestones: [{ name: 'Practice 20 mock exams', completed: false }, { name: 'Score >=8 in Listening/Reading consistently', completed: false }] }
        ];
        await db.goals.bulkAdd(initialGoals);
      }
      setSeedCompleted(true);
    };

    seedDatabase();
  }, []);

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
        seedCompleted,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
