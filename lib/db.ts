import Dexie, { type Table } from 'dexie';

export interface Workspace {
  id?: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface WidgetInstance {
  id?: number;
  workspaceId: number;
  widgetId: string; // e.g. "planner", "analytics", "flashcards", "obsidian-graph"
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  position: number;
  config: string; // JSON string configuration
}

export interface Goal {
  id?: number;
  workspaceId: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  parentId?: number; // Nesting subgoals/projects/milestones
  progress: number; // 0-100
}

export interface Task {
  id?: number;
  workspaceId: number;
  goalId?: number;
  subjectId?: number;
  parentId?: number; // Nesting subtasks
  date: string; // YYYY-MM-DD
  description: string;
  timeSlot?: string;
  estimatedDuration: number;
  actualDuration: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  notes: string;
  tags: string[];
  isPinned: boolean;
}

export interface StudySession {
  id?: number;
  workspaceId: number;
  taskId?: number;
  subjectId?: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in minutes
  focusScore: number; // 1-10
  mood: string;
  energyLevel: number; // 1-10
  notes: string;
}

export interface Subject {
  id?: number;
  workspaceId: number;
  name: string;
  color: string;
  completionPercent: number;
}

export interface Topic {
  id?: number;
  subjectId: number;
  moduleName: string;
  chapterName: string;
  name: string;
  isCompleted: boolean;
  revisionCount: number;
  confidence: number; // 1-5
  notes: string;
  mistakes: string;
  resources: string;
  questionsSolved: number;
  nextReviewDate?: string; // Spaced repetition reviews (YYYY-MM-DD)
  easeFactor?: number; // SM-2 parameter (default 2.5)
  interval?: number; // SM-2 parameter (days)
}

export interface Flashcard {
  id?: number;
  workspaceId: number;
  subjectId?: number;
  topicId?: number;
  front: string;
  back: string;
  easeFactor: number; // SM-2
  interval: number; // in days
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
}

export interface Habit {
  id?: number;
  workspaceId: number;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  isArchived: boolean;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped' | 'none';
}

export interface Resource {
  id?: number;
  workspaceId: number;
  subjectId?: number;
  title: string;
  type: 'pdf' | 'book' | 'video' | 'course' | 'github' | 'website' | 'article' | 'flashcard';
  url: string;
  folder: string;
  isFavorite: boolean;
  tags: string[];
  notes?: string;
}

export interface TimelineEvent {
  id?: number;
  workspaceId: number;
  type: 'task' | 'session' | 'habit' | 'goal' | 'note' | 'resource' | 'badge';
  title: string;
  timestamp: string; // ISO string
  data: string; // Contextual JSON payload
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

export interface PomodoroLog {
  id?: number;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  category: string; // subject name
  completed: boolean;
}

export interface Note {
  id?: number;
  workspaceId: number;
  subjectId?: number;
  topicId?: number;
  title: string;
  content: string; // Markdown
  lastEdited: string;
}

export interface Mistake {
  id?: number;
  workspaceId: number;
  subjectId?: number;
  topicId?: number;
  title: string;
  type: string; // custom mistakes category
  description: string;
  solution: string;
  screenshot?: string; // base64
  revisionDates: string[]; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface Countdown {
  id?: number;
  workspaceId: number;
  title: string;
  date: string; // YYYY-MM-DD
  icon: string;
  color: string;
}

class AetherOSDatabase extends Dexie {
  workspaces!: Table<Workspace>;
  widgets!: Table<WidgetInstance>;
  goals!: Table<Goal>;
  tasks!: Table<Task>;
  studySessions!: Table<StudySession>;
  subjects!: Table<Subject>;
  topics!: Table<Topic>;
  flashcards!: Table<Flashcard>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  resources!: Table<Resource>;
  timelineEvents!: Table<TimelineEvent>;
  dailyLogs!: Table<DailyLog>;
  pomodoroLogs!: Table<PomodoroLog>;
  notes!: Table<Note>;
  mistakes!: Table<Mistake>;
  countdowns!: Table<Countdown>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      workspaces: '++id, name',
      widgets: '++id, workspaceId, widgetId',
      goals: '++id, workspaceId, parentId',
      tasks: '++id, workspaceId, goalId, subjectId, parentId, date, status',
      studySessions: '++id, workspaceId, taskId, subjectId, startTime',
      subjects: '++id, workspaceId',
      topics: '++id, subjectId',
      flashcards: '++id, workspaceId, subjectId, topicId, nextReviewDate',
      habits: '++id, workspaceId',
      habitLogs: '++id, habitId, date',
      resources: '++id, workspaceId, subjectId',
      timelineEvents: '++id, workspaceId, type, timestamp',
      dailyLogs: 'date',
      pomodoroLogs: '++id, date',
      notes: '++id, workspaceId, subjectId, topicId',
      mistakes: '++id, workspaceId, subjectId, topicId, nextReviewDate',
      countdowns: '++id, workspaceId, date'
    });
  }
}

const getDatabaseName = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('aetheros_current_user');
    if (user) {
      return `AetherOSDatabase_${user}`;
    }
  }
  return 'AetherOSDatabase_default';
};

export const db = new AetherOSDatabase(getDatabaseName());

// Automatic Data Migration Routine
export async function runDatabaseMigration(username: string) {
  try {
    const oldDbName = `SaiOSDatabase_${username}`;
    const exists = await Dexie.exists(oldDbName);
    if (!exists) return;

    console.log(`[Migration] Found old database ${oldDbName}. Starting migration...`);
    
    const oldDb = new Dexie(oldDbName);
    oldDb.version(1).stores({
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
    
    await oldDb.open();
    
    // Create Default Workspace
    const defaultWorkspaceId = await db.workspaces.add({
      name: 'Default Workspace',
      icon: 'GraduationCap',
      color: 'purple',
      description: 'Migrated from your previous version of AetherOS.',
      createdAt: new Date().toISOString()
    });

    // Migrate Subjects
    const oldSubjects = await oldDb.table('subjects').toArray();
    const subjectIdMapping: Record<string, number> = {};
    for (const sub of oldSubjects) {
      const newSubId = await db.subjects.add({
        workspaceId: defaultWorkspaceId,
        name: sub.name,
        color: sub.category === 'gate' ? 'purple' : sub.category === 'placement' ? 'blue' : 'emerald',
        completionPercent: sub.completionPercent || 0
      });
      subjectIdMapping[sub.id] = newSubId as number;
    }

    // Migrate Topics
    const oldTopics = await oldDb.table('topics').toArray();
    for (const top of oldTopics) {
      const mappedSubjectId = subjectIdMapping[top.subjectId] || 1;
      await db.topics.add({
        subjectId: mappedSubjectId,
        moduleName: top.moduleName,
        chapterName: top.chapterName,
        name: top.name,
        isCompleted: top.isCompleted,
        revisionCount: top.revisionCount,
        confidence: top.confidence,
        notes: top.notes,
        mistakes: top.mistakes,
        resources: top.resources,
        questionsSolved: top.questionsSolved
      });
    }

    // Migrate Tasks
    const oldTasks = await oldDb.table('tasks').toArray();
    for (const task of oldTasks) {
      const mappedSubId = subjectIdMapping[task.subject] || undefined;
      await db.tasks.add({
        workspaceId: defaultWorkspaceId,
        subjectId: mappedSubId,
        date: task.date,
        description: task.description,
        timeSlot: task.timeSlot,
        estimatedDuration: task.estimatedDuration || 30,
        actualDuration: task.actualDuration || 0,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        notes: task.notes || '',
        tags: task.tags || [],
        isPinned: task.isPinned || false
      });
    }

    // Migrate Notes
    const oldNotes = await oldDb.table('notes').toArray();
    for (const note of oldNotes) {
      const mappedSubId = subjectIdMapping[note.subjectId] || undefined;
      await db.notes.add({
        workspaceId: defaultWorkspaceId,
        subjectId: mappedSubId,
        topicId: note.topicId,
        title: note.title,
        content: note.content,
        lastEdited: note.lastEdited
      });
    }

    // Migrate Mistakes
    const oldMistakes = await oldDb.table('mistakes').toArray();
    for (const mis of oldMistakes) {
      const mappedSubId = subjectIdMapping[mis.subjectId] || undefined;
      await db.mistakes.add({
        workspaceId: defaultWorkspaceId,
        subjectId: mappedSubId,
        title: mis.title,
        type: mis.type || 'wrong-question',
        description: mis.description || '',
        solution: mis.solution || '',
        revisionDates: mis.revisionDates || [],
        nextReviewDate: mis.nextReviewDate,
        priority: mis.priority || 'medium',
        tags: mis.tags || []
      });
    }

    // Migrate Goals
    const oldGoals = await oldDb.table('goals').toArray();
    for (const goal of oldGoals) {
      await db.goals.add({
        workspaceId: defaultWorkspaceId,
        title: goal.title,
        description: `Migrated goal from ${goal.category}`,
        icon: goal.category === 'gate' ? 'GraduationCap' : 'Briefcase',
        color: 'purple',
        targetDate: goal.deadline,
        priority: 'medium',
        progress: goal.progress || 0
      });
    }

    // Migrate Daily Logs
    const oldLogs = await oldDb.table('dailyLogs').toArray();
    for (const log of oldLogs) {
      await db.dailyLogs.add(log);
    }

    // Migrate Pomodoro Logs
    const oldPomo = await oldDb.table('pomodoroLogs').toArray();
    for (const pomo of oldPomo) {
      await db.pomodoroLogs.add(pomo);
    }

    // Close and clean up
    await oldDb.close();
    await Dexie.delete(oldDbName);
    console.log(`[Migration] Database migration completed. Old SaiOS database removed.`);
  } catch (err) {
    console.error('[Migration] Database migration encountered an error:', err);
  }
}
