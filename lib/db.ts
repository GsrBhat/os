import Dexie, { type Table } from 'dexie';

export interface Task {
  id?: number;
  date: string; // YYYY-MM-DD
  subject: string;
  description: string;
  timeSlot: string; // e.g. "09:00 - 10:30"
  estimatedDuration: number; // in minutes
  actualDuration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  notes: string;
  tags: string[];
  revisionCount: number;
  isPinned: boolean;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'none';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD (Primary Key)
  studyHours: number;
  mood: string; // 😊, 😄, 😐, 😞, 😴, 😎
  energy: number; // 1-10
  sleepHours: number;
  waterIntake: number; // ml
  proteinIntake: number; // grams
  workout: boolean;
  focusRating: number; // 1-10
  stressLevel: number; // 1-10
  notes: string;
  wins: string;
  mistakes: string;
  reflection: string;
  tomorrowGoals: string;
  productivityScore: number; // 0-100
  skippedTasksCount: number;
  completedTasksCount: number;
}

export interface Subject {
  id: string; // e.g. "placement-dsa", "gate-networks"
  name: string;
  category: 'placement' | 'gate' | 'language';
  completionPercent: number;
  topicsDone: number;
  topicsRemaining: number;
  revisionCount: number;
  confidence: number; // 1-5
  difficulty: 'easy' | 'medium' | 'hard';
  lastStudied?: string;
  nextRevision?: string;
  totalHours: number;
}

export interface Topic {
  id?: number;
  subjectId: string;
  moduleName: string;
  chapterName: string;
  name: string;
  isCompleted: boolean;
  revisionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 1-5
  notes: string;
  mistakes: string;
  resources: string;
  questionsSolved: number;
}

export interface Mistake {
  id?: number;
  title: string;
  type: 'wrong-question' | 'conceptual' | 'interview' | 'coding' | 'circuit';
  subjectId: string;
  description: string;
  solution: string;
  screenshot?: string; // base64 data URL
  revisionDates: string[]; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface Note {
  id?: number;
  title: string;
  content: string; // Markdown text
  subjectId: string;
  topicId?: number;
  lastEdited: string;
}

export interface Habit {
  id?: number;
  date: string; // YYYY-MM-DD
  wakeUp: boolean;
  sleepEarly: boolean;
  workout: boolean;
  meditation: boolean;
  reading: boolean;
  coding: boolean;
  revision: boolean;
  waterIntake: number; // ml
  proteinIntake: number; // grams
  hairCare: boolean;
  walking: boolean;
  stretching: boolean;
  screenTime: number; // minutes
}

export interface PomodoroLog {
  id?: number;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  category: string; // e.g. "DSA", "GATE Math"
  completed: boolean;
}

export interface Goal {
  id?: number;
  title: string;
  category: 'placement' | 'gate' | 'language' | 'personal';
  deadline: string;
  progress: number; // 0-100
  milestones: { name: string; completed: boolean }[];
  estimatedCompletion?: string;
}

class SaiOSDatabase extends Dexie {
  tasks!: Table<Task>;
  dailyLogs!: Table<DailyLog>;
  subjects!: Table<Subject>;
  topics!: Table<Topic>;
  mistakes!: Table<Mistake>;
  notes!: Table<Note>;
  habits!: Table<Habit>;
  pomodoroLogs!: Table<PomodoroLog>;
  goals!: Table<Goal>;

  constructor() {
    super('SaiOSDatabase');
    this.version(1).stores({
      tasks: '++id, date, subject, status, isPinned',
      dailyLogs: 'date',
      subjects: 'id, category',
      topics: '++id, subjectId, isCompleted',
      mistakes: '++id, type, subjectId, nextReviewDate',
      notes: '++id, subjectId, topicId',
      habits: '++id, date',
      pomodoroLogs: '++id, date',
      goals: '++id, category'
    });
  }
}

export const db = new SaiOSDatabase();
