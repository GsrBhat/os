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

  // Load User Info & Settings from LocalStorage
  useEffect(() => {
    const savedXP = localStorage.getItem('saios_xp');
    const savedLevel = localStorage.getItem('saios_level');
    const savedCoins = localStorage.getItem('saios_coins');
    const savedBadges = localStorage.getItem('saios_badges');
    const savedSettings = localStorage.getItem('saios_settings');

    if (savedXP) setXp(parseInt(savedXP, 10));
    if (savedLevel) setLevel(parseInt(savedLevel, 10));
    if (savedCoins) setCoins(parseInt(savedCoins, 10));
    if (savedBadges) setBadges(JSON.parse(savedBadges));
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Active Timer restore
    const savedTimer = localStorage.getItem('saios_active_timer');
    if (savedTimer) {
      setActiveTimer(JSON.parse(savedTimer));
    }
  }, []);

  // Sync theme to body element
  useEffect(() => {
    document.body.className = `theme-${settings.theme} bg-grid-pattern min-h-screen`;
  }, [settings.theme]);

  const addXP = (amount: number) => {
    setXp((prevXP) => {
      const newXP = prevXP + amount;
      localStorage.setItem('saios_xp', newXP.toString());
      
      // Calculate level-up (every 100 XP is a level)
      const newLevel = Math.floor(newXP / 100) + 1;
      setLevel((prevLevel) => {
        if (newLevel > prevLevel) {
          localStorage.setItem('saios_level', newLevel.toString());
          // Award coins on level up
          setCoins((prevCoins) => {
            const newCoins = prevCoins + 50;
            localStorage.setItem('saios_coins', newCoins.toString());
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
    const timer = { taskId, startTime: Date.now(), accumulatedSeconds: 0 };
    setActiveTimer(timer);
    localStorage.setItem('saios_active_timer', JSON.stringify(timer));
    // Update task status to in-progress
    db.tasks.update(taskId, { status: 'in-progress' });
  };

  const pauseTaskTimer = async () => {
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
    localStorage.removeItem('saios_active_timer');
  };

  const stopTaskTimer = async () => {
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
      // Award XP for completing task
      addXP(15);
    }

    setActiveTimer(null);
    localStorage.removeItem('saios_active_timer');
  };

  const updateSettings = (newSettings: Partial<StoreContextProps['settings']>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('saios_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Seed Data Initializer
  useEffect(() => {
    const seedDatabase = async () => {
      const subjectCount = await db.subjects.count();
      if (subjectCount === 0) {
        // Seed Subjects
        const initialSubjects: Subject[] = [
          // Placements
          { id: 'placement-python', name: 'Python Core', category: 'placement', completionPercent: 65, topicsDone: 4, topicsRemaining: 2, revisionCount: 3, confidence: 4, difficulty: 'medium', totalHours: 12 },
          { id: 'placement-dsa', name: 'Data Structures & Algorithms', category: 'placement', completionPercent: 40, topicsDone: 3, topicsRemaining: 5, revisionCount: 4, confidence: 3, difficulty: 'hard', totalHours: 25 },
          { id: 'placement-aptitude', name: 'Aptitude & Logical Reasoning', category: 'placement', completionPercent: 50, topicsDone: 2, topicsRemaining: 2, revisionCount: 1, confidence: 3, difficulty: 'medium', totalHours: 8 },
          { id: 'placement-resume', name: 'Resume & Portfolio Building', category: 'placement', completionPercent: 80, topicsDone: 2, topicsRemaining: 1, revisionCount: 0, confidence: 4, difficulty: 'easy', totalHours: 6 },
          { id: 'placement-interview', name: 'Mock Interviews & Behavioural', category: 'placement', completionPercent: 20, topicsDone: 1, topicsRemaining: 4, revisionCount: 1, confidence: 2, difficulty: 'hard', totalHours: 4 },

          // GATE ECE
          { id: 'gate-networks', name: 'Network Theory', category: 'gate', completionPercent: 90, topicsDone: 5, topicsRemaining: 1, revisionCount: 6, confidence: 5, difficulty: 'easy', totalHours: 20 },
          { id: 'gate-signals', name: 'Signals & Systems', category: 'gate', completionPercent: 60, topicsDone: 3, topicsRemaining: 2, revisionCount: 3, confidence: 3, difficulty: 'medium', totalHours: 15 },
          { id: 'gate-digital', name: 'Digital Electronics', category: 'gate', completionPercent: 75, topicsDone: 4, topicsRemaining: 1, revisionCount: 4, confidence: 4, difficulty: 'easy', totalHours: 14 },
          { id: 'gate-analog', name: 'Analog Electronics', category: 'gate', completionPercent: 30, topicsDone: 2, topicsRemaining: 5, revisionCount: 1, confidence: 2, difficulty: 'hard', totalHours: 18 },
          { id: 'gate-edc', name: 'Electronic Devices (EDC)', category: 'gate', completionPercent: 45, topicsDone: 3, topicsRemaining: 4, revisionCount: 2, confidence: 3, difficulty: 'hard', totalHours: 16 },
          { id: 'gate-control', name: 'Control Systems', category: 'gate', completionPercent: 50, topicsDone: 3, topicsRemaining: 3, revisionCount: 2, confidence: 3, difficulty: 'medium', totalHours: 12 },
          { id: 'gate-communications', name: 'Communication Systems', category: 'gate', completionPercent: 20, topicsDone: 1, topicsRemaining: 5, revisionCount: 1, confidence: 2, difficulty: 'hard', totalHours: 8 },
          { id: 'gate-emtl', name: 'Electromagnetics (EMTL)', category: 'gate', completionPercent: 10, topicsDone: 1, topicsRemaining: 6, revisionCount: 0, confidence: 1, difficulty: 'hard', totalHours: 5 },
          { id: 'gate-maths', name: 'Engineering Mathematics', category: 'gate', completionPercent: 55, topicsDone: 4, topicsRemaining: 3, revisionCount: 3, confidence: 4, difficulty: 'medium', totalHours: 14 },
          { id: 'gate-aptitude', name: 'General Aptitude', category: 'gate', completionPercent: 70, topicsDone: 4, topicsRemaining: 2, revisionCount: 2, confidence: 4, difficulty: 'easy', totalHours: 9 },

          // Language
          { id: 'lang-ielts', name: 'IELTS Academic Prep', category: 'language', completionPercent: 70, topicsDone: 3, topicsRemaining: 1, revisionCount: 2, confidence: 4, difficulty: 'medium', totalHours: 10 },
          { id: 'lang-toefl', name: 'TOEFL Prep', category: 'language', completionPercent: 20, topicsDone: 1, topicsRemaining: 3, revisionCount: 0, confidence: 3, difficulty: 'medium', totalHours: 3 }
        ];
        await db.subjects.bulkAdd(initialSubjects);

        // Seed Topics
        const initialTopics: Topic[] = [
          // Network Theory
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Basic Laws', name: 'Ohm\'s Law & Kirchhoff\'s Laws', isCompleted: true, revisionCount: 4, difficulty: 'easy', confidence: 5, notes: 'V=IR and Sum of currents/voltages = 0', mistakes: 'Watch signs in KVL loops!', resources: 'NPTEL Lectures', questionsSolved: 45 },
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Nodal & Mesh Analysis', name: 'Nodal Analysis with Dependent Sources', isCompleted: true, revisionCount: 3, difficulty: 'medium', confidence: 4, notes: 'Write nodal equations using KCL.', mistakes: 'Dependent source node voltages must be defined correctly.', resources: 'Hayt & Kemmerly', questionsSolved: 30 },
          { subjectId: 'gate-networks', moduleName: 'DC Circuits', chapterName: 'Nodal & Mesh Analysis', name: 'Mesh Analysis with Supermesh', isCompleted: true, revisionCount: 2, difficulty: 'medium', confidence: 4, notes: 'Avoid current sources inside meshes.', mistakes: 'Combine mesh currents in supermesh.', resources: 'Hayt & Kemmerly', questionsSolved: 25 },
          { subjectId: 'gate-networks', moduleName: 'Theorems', chapterName: 'Network Theorems', name: 'Thevenin\'s & Norton\'s Theorems', isCompleted: true, revisionCount: 3, difficulty: 'medium', confidence: 5, notes: 'Finding equivalent impedance and open-circuit voltage.', mistakes: 'Careful when calculating R_th with dependent sources (use V_oc/I_sc).', resources: 'GATE Academy book', questionsSolved: 50 },
          { subjectId: 'gate-networks', moduleName: 'Theorems', chapterName: 'Network Theorems', name: 'Maximum Power Transfer Theorem', isCompleted: true, revisionCount: 2, difficulty: 'easy', confidence: 5, notes: 'Z_L = Z_S* for AC, R_L = R_S for DC.', mistakes: 'Must conjugate for AC maximum power.', resources: 'Class Notes', questionsSolved: 20 },
          { subjectId: 'gate-networks', moduleName: 'Transients', chapterName: 'Transient Analysis', name: 'First-order RC and RL transient response', isCompleted: false, revisionCount: 0, difficulty: 'hard', confidence: 2, notes: 'Time constant tau = RC or L/R.', mistakes: 'Initial state and steady state evaluation.', resources: 'Alexander & Sadiku', questionsSolved: 12 },

          // DSA
          { subjectId: 'placement-dsa', moduleName: 'Data Structures', chapterName: 'Arrays', name: 'Two-Pointer Technique', isCompleted: true, revisionCount: 3, difficulty: 'medium', confidence: 4, notes: 'Optimal for sorted arrays.', mistakes: 'Out of bounds errors during pointer shifts.', resources: 'LeetCode / Striver\'s SDE Sheet', questionsSolved: 20 },
          { subjectId: 'placement-dsa', moduleName: 'Data Structures', chapterName: 'Linked Lists', name: 'Reverse a Linked List', isCompleted: true, revisionCount: 4, difficulty: 'easy', confidence: 5, notes: 'Iterative and recursive approaches.', mistakes: 'Losing the reference to head/next node.', resources: 'GeeksforGeeks', questionsSolved: 15 },
          { subjectId: 'placement-dsa', moduleName: 'Algorithms', chapterName: 'Sorting', name: 'Quick Sort & Merge Sort', isCompleted: true, revisionCount: 2, difficulty: 'medium', confidence: 4, notes: 'Divide and conquer strategy.', mistakes: 'Partitioning boundary cases in Quick Sort.', resources: 'CLRS Book', questionsSolved: 18 },
          { subjectId: 'placement-dsa', moduleName: 'Algorithms', chapterName: 'Dynamic Programming', name: '0/1 Knapsack Problem', isCompleted: false, revisionCount: 1, difficulty: 'hard', confidence: 2, notes: 'State is dp[i][w].', mistakes: 'Index errors when calculating remaining capacity.', resources: 'Striver DP Playlist', questionsSolved: 8 },

          // IELTS
          { subjectId: 'lang-ielts', moduleName: 'Writing', chapterName: 'Task 2', name: 'Essay Structure & Argumentation', isCompleted: true, revisionCount: 2, difficulty: 'medium', confidence: 4, notes: 'Intro, 2 Body paragraphs, Conclusion.', mistakes: 'Lack of clear topic sentences.', resources: 'IELTS Liz', questionsSolved: 10 },
          { subjectId: 'lang-ielts', moduleName: 'Speaking', chapterName: 'Part 2', name: 'Cue Card Speeches (2 Minutes)', isCompleted: true, revisionCount: 3, difficulty: 'medium', confidence: 4, notes: 'Speak fluently and use transitional phrases.', mistakes: 'Running out of things to say at 1.5 mins.', resources: 'IELTS Advantage', questionsSolved: 12 }
        ];
        await db.topics.bulkAdd(initialTopics);

        // Seed Goals
        const initialGoals: Goal[] = [
          { title: 'GATE 2027 ECE - Under AIR 100', category: 'gate', deadline: '2027-02-05', progress: 35, milestones: [{ name: 'Syllabus Coverage 100%', completed: false }, { name: 'Previous Year Questions (30 Yrs)', completed: false }, { name: 'Full Test Series (>75/100)', completed: false }] },
          { title: 'Placement Offer at Product Company (>20 LPA)', category: 'placement', deadline: '2027-01-15', progress: 55, milestones: [{ name: 'Striver SDE Sheet Completion', completed: true }, { name: '3 Core Full-stack Projects', completed: true }, { name: 'Mock Interviews (10)', completed: false }] },
          { title: 'IELTS Band 8.0 Overall', category: 'language', deadline: '2026-10-20', progress: 75, milestones: [{ name: 'Practice 20 mock exams', completed: true }, { name: 'Score >=8 in Listening/Reading consistently', completed: false }] }
        ];
        await db.goals.bulkAdd(initialGoals);

        // Seed Mistake Repository
        const initialMistakes: Mistake[] = [
          { title: 'KCL Loop Direction Sign Mistake', type: 'wrong-question', subjectId: 'gate-networks', description: 'Assumed positive current leaving the positive terminal of a dependent voltage source when calculating nodal voltages.', solution: 'Always follow passive sign convention. Label voltage drops in elements correctly and consistently.', revisionDates: ['2026-07-04'], nextReviewDate: '2026-07-11', priority: 'high', tags: ['Circuit Analysis', 'Nodal Analysis'] },
          { title: 'Dynamic Programming Subproblem State Logic', type: 'coding', subjectId: 'placement-dsa', description: 'In the knapsack problem, memoized using 1D array incorrectly without traversing backwards, causing duplication of items.', solution: 'When using 1D array, loop from capacity down to weight: dp[w] = max(dp[w], dp[w-wt[i]] + val[i]).', revisionDates: ['2026-07-06'], nextReviewDate: '2026-07-13', priority: 'medium', tags: ['DP', 'Knapsack', 'Optimization'] },
          { title: 'IELTS Essay Coherence Slip', type: 'conceptual', subjectId: 'lang-ielts', description: 'Used informal linking words like "anyway" or "besides" in IELTS Academic Writing Task 2 essay.', solution: 'Use academic cohesive devices: "furthermore", "consequently", "nevertheless", "in contrast".', revisionDates: ['2026-07-08'], nextReviewDate: '2026-07-12', priority: 'low', tags: ['Writing', 'Coherence'] }
        ];
        await db.mistakes.bulkAdd(initialMistakes);

        // Seed 7 days of logs (2026-07-03 to 2026-07-09)
        const pastLogs: DailyLog[] = [
          { date: '2026-07-03', studyHours: 5.5, mood: '😊', energy: 8, sleepHours: 7, waterIntake: 2500, proteinIntake: 60, workout: true, focusRating: 7, stressLevel: 3, notes: 'Solid start to the month. Studied Network Theory.', wins: 'Finished mesh analysis problems.', mistakes: 'Felt distracted in the afternoon.', reflection: 'Avoid using phone during study blocks.', tomorrowGoals: 'Finish Network Theorems.', productivityScore: 78, skippedTasksCount: 1, completedTasksCount: 4 },
          { date: '2026-07-04', studyHours: 6.0, mood: '😄', energy: 9, sleepHours: 8, waterIntake: 3000, proteinIntake: 65, workout: false, focusRating: 8, stressLevel: 2, notes: 'Great energy today. Solved 15 Leetcode questions.', wins: 'Solved dynamic programming question on knapsack.', mistakes: 'None, everything went as planned.', reflection: 'Morning sessions are highly efficient.', tomorrowGoals: 'Revise Python OOP.', productivityScore: 88, skippedTasksCount: 0, completedTasksCount: 5 },
          { date: '2026-07-05', studyHours: 4.0, mood: '😐', energy: 6, sleepHours: 6.5, waterIntake: 2000, proteinIntake: 50, workout: true, focusRating: 6, stressLevel: 5, notes: 'Slightly tired today. Concentrated on IELTS writing practice.', wins: 'Completed 2 essay drills.', mistakes: 'Forgot to drink enough water.', reflection: 'Need to sleep early.', tomorrowGoals: 'Focus on signals and systems.', productivityScore: 62, skippedTasksCount: 2, completedTasksCount: 3 },
          { date: '2026-07-06', studyHours: 6.5, mood: '😎', energy: 9, sleepHours: 7.5, waterIntake: 2800, proteinIntake: 70, workout: true, focusRating: 9, stressLevel: 3, notes: 'High focus session on Signals Fourier series.', wins: 'Understood Dirichlet conditions clearly.', mistakes: 'None.', reflection: 'Consistent workout keeps brain active.', tomorrowGoals: 'Practice Fourier transforms.', productivityScore: 92, skippedTasksCount: 0, completedTasksCount: 6 },
          { date: '2026-07-07', studyHours: 5.0, mood: '😴', energy: 5, sleepHours: 5.5, waterIntake: 2200, proteinIntake: 55, workout: false, focusRating: 5, stressLevel: 4, notes: 'Struggled with focus due to poor sleep.', wins: 'Still managed to study 5 hours.', mistakes: 'Stayed up late watching YT.', reflection: 'Turn off screens by 10 PM.', tomorrowGoals: 'Aptitude tests practice.', productivityScore: 58, skippedTasksCount: 3, completedTasksCount: 2 },
          { date: '2026-07-08', studyHours: 7.2, mood: '😄', energy: 8.5, sleepHours: 8, waterIntake: 3100, proteinIntake: 75, workout: true, focusRating: 8.5, stressLevel: 2, notes: 'Back on track. Longest study block so far.', wins: 'Completed 3 DSA chapters.', mistakes: 'Minor errors in binary search logic.', reflection: 'Sleeping early is the key.', tomorrowGoals: 'Finish digital logic maps.', productivityScore: 90, skippedTasksCount: 0, completedTasksCount: 6 },
          { date: '2026-07-09', studyHours: 5.8, mood: '😊', energy: 8, sleepHours: 7, waterIntake: 2600, proteinIntake: 62, workout: true, focusRating: 8, stressLevel: 3, notes: 'Studied digital logic gates & K-Maps.', wins: 'Solved 25 K-map problems.', mistakes: 'Spent too much time on a single problem.', reflection: 'Timebox complex topics to 30 mins.', tomorrowGoals: 'Prepare Mock interview prep.', productivityScore: 82, skippedTasksCount: 1, completedTasksCount: 4 }
        ];
        await db.dailyLogs.bulkAdd(pastLogs);

        // Seed past habits
        const pastHabits: Habit[] = [
          { date: '2026-07-03', wakeUp: true, sleepEarly: false, workout: true, meditation: false, reading: true, coding: true, revision: true, waterIntake: 2500, proteinIntake: 60, hairCare: false, walking: true, stretching: true, screenTime: 180 },
          { date: '2026-07-04', wakeUp: true, sleepEarly: true, workout: false, meditation: true, reading: true, coding: true, revision: true, waterIntake: 3000, proteinIntake: 65, hairCare: true, walking: true, stretching: false, screenTime: 120 },
          { date: '2026-07-05', wakeUp: false, sleepEarly: false, workout: true, meditation: false, reading: false, coding: false, revision: true, waterIntake: 2000, proteinIntake: 50, hairCare: false, walking: false, stretching: true, screenTime: 240 },
          { date: '2026-07-06', wakeUp: true, sleepEarly: true, workout: true, meditation: true, reading: true, coding: true, revision: true, waterIntake: 2800, proteinIntake: 70, hairCare: false, walking: true, stretching: true, screenTime: 110 },
          { date: '2026-07-07', wakeUp: false, sleepEarly: false, workout: false, meditation: false, reading: true, coding: true, revision: false, waterIntake: 2200, proteinIntake: 55, hairCare: false, walking: true, stretching: false, screenTime: 310 },
          { date: '2026-07-08', wakeUp: true, sleepEarly: true, workout: true, meditation: true, reading: true, coding: true, revision: true, waterIntake: 3100, proteinIntake: 75, hairCare: true, walking: true, stretching: true, screenTime: 95 },
          { date: '2026-07-09', wakeUp: true, sleepEarly: true, workout: true, meditation: false, reading: true, coding: true, revision: true, waterIntake: 2600, proteinIntake: 62, hairCare: false, walking: true, stretching: true, screenTime: 140 }
        ];
        await db.habits.bulkAdd(pastHabits);

        // Seed past pomodoros
        const pastPomodoros: PomodoroLog[] = [
          { date: '2026-07-03', duration: 25, category: 'Networks', completed: true },
          { date: '2026-07-03', duration: 25, category: 'Networks', completed: true },
          { date: '2026-07-04', duration: 50, category: 'DSA', completed: true },
          { date: '2026-07-04', duration: 50, category: 'DSA', completed: true },
          { date: '2026-07-06', duration: 50, category: 'Signals', completed: true },
          { date: '2026-07-06', duration: 25, category: 'Signals', completed: true },
          { date: '2026-07-08', duration: 90, category: 'DSA', completed: true },
          { date: '2026-07-08', duration: 90, category: 'DSA', completed: true },
          { date: '2026-07-09', duration: 50, category: 'Digital', completed: true }
        ];
        await db.pomodoroLogs.bulkAdd(pastPomodoros);

        // Seed tasks for past days to fill historical planner
        const pastTasks: Task[] = [
          { date: '2026-07-09', subject: 'gate-digital', description: 'Revise Boolean minimization and K-Maps', timeSlot: '09:00 - 10:30', estimatedDuration: 90, actualDuration: 100, priority: 'high', status: 'completed', notes: 'Solved 25 problems.', tags: ['K-Maps', 'Digital Logic'], revisionCount: 1, isPinned: false, isRecurring: false },
          { date: '2026-07-09', subject: 'placement-dsa', description: 'Solve 3 questions on Stacks & Queues', timeSlot: '11:00 - 12:30', estimatedDuration: 90, actualDuration: 85, priority: 'medium', status: 'completed', notes: 'Linked list implementation of stack done.', tags: ['DSA', 'Stacks'], revisionCount: 0, isPinned: false, isRecurring: false },
          { date: '2026-07-09', subject: 'lang-ielts', description: 'IELTS Listening mock drill', timeSlot: '14:00 - 15:00', estimatedDuration: 60, actualDuration: 60, priority: 'medium', status: 'completed', notes: 'Scored 36/40 in mock.', tags: ['IELTS', 'Listening'], revisionCount: 0, isPinned: false, isRecurring: false },
          { date: '2026-07-09', subject: 'placement-python', description: 'Review decorator and generators syntax', timeSlot: '16:00 - 17:00', estimatedDuration: 60, actualDuration: 55, priority: 'low', status: 'completed', notes: 'Good revision of scopes.', tags: ['Python', 'Advanced'], revisionCount: 1, isPinned: false, isRecurring: false },
          { date: '2026-07-09', subject: 'gate-analog', description: 'Read operational amplifier basics', timeSlot: '18:00 - 19:30', estimatedDuration: 90, actualDuration: 0, priority: 'high', status: 'paused', notes: 'Skipped to study more digital.', tags: ['Analog', 'Op-Amp'], revisionCount: 0, isPinned: false, isRecurring: false }
        ];
        await db.tasks.bulkAdd(pastTasks);

        // Seed tasks for today (2026-07-10) to make planner active immediately
        const todayTasks: Task[] = [
          { date: '2026-07-10', subject: 'placement-dsa', description: 'Binary Search Tree traversals and implementation', timeSlot: '09:00 - 10:30', estimatedDuration: 90, actualDuration: 0, priority: 'high', status: 'pending', notes: '', tags: ['DSA', 'BST', 'Trees'], revisionCount: 0, isPinned: true, isRecurring: false },
          { date: '2026-07-10', subject: 'gate-networks', description: 'Transient response of RC circuits (first-order)', timeSlot: '11:00 - 12:30', estimatedDuration: 90, actualDuration: 0, priority: 'high', status: 'pending', notes: '', tags: ['Networks', 'Transients'], revisionCount: 0, isPinned: false, isRecurring: false },
          { date: '2026-07-10', subject: 'lang-ielts', description: 'Practice Speaking Part 2 cards', timeSlot: '14:00 - 15:00', estimatedDuration: 60, actualDuration: 0, priority: 'medium', status: 'pending', notes: '', tags: ['IELTS', 'Speaking'], revisionCount: 0, isPinned: false, isRecurring: false },
          { subject: 'placement-aptitude', description: 'Solve Ratio & Proportions questions', date: '2026-07-10', timeSlot: '16:00 - 17:00', estimatedDuration: 60, actualDuration: 0, priority: 'medium', status: 'pending', notes: '', tags: ['Aptitude'], revisionCount: 0, isPinned: false, isRecurring: false },
          { date: '2026-07-10', subject: 'gate-signals', description: 'Fourier transform equations sheet revision', timeSlot: '18:00 - 19:00', estimatedDuration: 60, actualDuration: 0, priority: 'low', status: 'pending', notes: '', tags: ['Signals', 'Fourier'], revisionCount: 2, isPinned: false, isRecurring: true, recurrencePattern: 'weekly' }
        ];
        await db.tasks.bulkAdd(todayTasks);

        // Initial daily log for today (2026-07-10)
        const todayLog: DailyLog = {
          date: '2026-07-10',
          studyHours: 0,
          mood: '😊',
          energy: 8,
          sleepHours: 7.5,
          waterIntake: 500,
          proteinIntake: 0,
          workout: false,
          focusRating: 0,
          stressLevel: 2,
          notes: '',
          wins: '',
          mistakes: '',
          reflection: '',
          tomorrowGoals: '',
          productivityScore: 0,
          skippedTasksCount: 0,
          completedTasksCount: 0
        };
        await db.dailyLogs.add(todayLog);

        // Initial habit log for today (2026-07-10)
        const todayHabit: Habit = {
          date: '2026-07-10',
          wakeUp: true,
          sleepEarly: false,
          workout: false,
          meditation: false,
          reading: false,
          coding: false,
          revision: false,
          waterIntake: 500,
          proteinIntake: 0,
          hairCare: false,
          walking: false,
          stretching: false,
          screenTime: 0
        };
        await db.habits.add(todayHabit);

        // Award first badges
        const initialBadges = ['Early Bird', 'First Step'];
        setBadges(initialBadges);
        localStorage.setItem('saios_badges', JSON.stringify(initialBadges));
        setXp(30);
        localStorage.setItem('saios_xp', '30');
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
