'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  CheckCircle, 
  GraduationCap, 
  Briefcase, 
  Languages, 
  Flame, 
  Activity, 
  BookOpen, 
  Plus, 
  Trash, 
  Clock, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  FileText 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { setActiveWorkspaceId } = useStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 2: Focus Tracks
  const [tracks, setTracks] = useState<string[]>(['college', 'software']);

  // Step 3: Template Selector
  const [selectedTemplate, setSelectedTemplate] = useState<string>('software');

  // Step 4: Custom Goals
  const [customGoals, setCustomGoals] = useState<{ title: string; targetDate: string }[]>([
    { title: 'Launch SaaS Startup', targetDate: '2026-10-01' }
  ]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('2026-12-31');

  // Step 5: Custom Subjects
  const [customSubjects, setCustomSubjects] = useState<string[]>(['Next.js & React', 'System Architecture']);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Step 6: Study Planner Config
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [dailyHours, setDailyHours] = useState(6);
  const [prepDays, setPrepDays] = useState(211);
  const [targetDate, setTargetDate] = useState('2026-08-01');

  // Step 7: Widgets Preferences
  const [enabledWidgets, setEnabledWidgets] = useState<Record<string, boolean>>({
    planner: true,
    goals: true,
    countdowns: true,
    analytics: true,
    calendar: true,
    notes: true,
    ai: true,
    habits: true,
    resources: true
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleToggleTrack = (trackId: string) => {
    if (tracks.includes(trackId)) {
      setTracks(prev => prev.filter(t => t !== trackId));
    } else {
      setTracks(prev => [...prev, trackId]);
    }
  };

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      setCustomGoals(prev => [...prev, { title: newGoalTitle.trim(), targetDate: newGoalDate }]);
      setNewGoalTitle('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setCustomGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSubject = () => {
    if (newSubjectName.trim() && !customSubjects.includes(newSubjectName.trim())) {
      setCustomSubjects(prev => [...prev, newSubjectName.trim()]);
      setNewSubjectName('');
    }
  };

  const handleRemoveSubject = (name: string) => {
    setCustomSubjects(prev => prev.filter(s => s !== name));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      const user = localStorage.getItem('aetheros_current_user') || 'default';
      
      // Save onboarding config
      localStorage.setItem(`aetheros_onboarded_${user}`, 'true');
      localStorage.setItem(`aetheros_prep_days_${user}`, prepDays.toString());
      localStorage.setItem(`aetheros_target_date_${user}`, targetDate);
      localStorage.setItem(`aetheros_daily_hours_${user}`, dailyHours.toString());
      localStorage.setItem(`aetheros_wake_time_${user}`, wakeTime);
      localStorage.setItem(`aetheros_sleep_time_${user}`, sleepTime);

      // Save Dashboard Widget Preferences
      localStorage.setItem(`aetheros_dashboard_widgets_${user}`, JSON.stringify(enabledWidgets));

      // Create Workspace Profile
      const workspaceName = selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1) + ' Workspace';
      const workspaceId = await db.workspaces.add({
        name: workspaceName,
        icon: selectedTemplate === 'fitness' ? 'Flame' : selectedTemplate === 'placement' ? 'Briefcase' : 'GraduationCap',
        color: selectedTemplate === 'fitness' ? 'red' : selectedTemplate === 'placement' ? 'blue' : 'purple',
        description: 'Auto-seeded from template.',
        createdAt: new Date().toISOString()
      });

      // Seed Template data dynamically
      if (selectedTemplate !== 'blank') {
        if (selectedTemplate === 'college') {
          const s1 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'Advanced Calculus', color: 'blue', completionPercent: 0 });
          const s2 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'Computer Architecture', color: 'purple', completionPercent: 0 });
          await db.topics.bulkAdd([
            { subjectId: s1 as number, moduleName: 'Calculus', chapterName: 'Limits', name: 'Derivatives & Integrals', isCompleted: false, revisionCount: 0, confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 },
            { subjectId: s2 as number, moduleName: 'Hardware', chapterName: 'Logic Gates', name: 'Boolean Minimization Maps', isCompleted: false, revisionCount: 0, confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 }
          ]);
          await db.goals.add({ workspaceId: workspaceId as number, title: 'Achieve GPA > 8.5', description: 'Maintain high academic grades.', icon: 'GraduationCap', color: 'blue', targetDate: '2026-12-15', priority: 'high', progress: 0 });
          await db.habits.bulkAdd([
            { workspaceId: workspaceId as number, name: 'Review Lecture Notes', icon: 'BookOpen', color: 'blue', frequency: 'daily', isArchived: false }
          ]);
        } else if (selectedTemplate === 'placement') {
          const s1 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'DSA & Algorithms', color: 'purple', completionPercent: 0 });
          const s2 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'System Design', color: 'blue', completionPercent: 0 });
          await db.topics.bulkAdd([
            { subjectId: s1 as number, moduleName: 'Structures', chapterName: 'Linked Lists', name: 'Cycle Detection (Floyd\'s)', isCompleted: false, revisionCount: 0, confidence: 1, notes: '', mistakes: '', resources: '', questionsSolved: 0 }
          ]);
          await db.goals.add({ workspaceId: workspaceId as number, title: 'Land Software Developer Offer', description: 'Secure SDE role at top tier firm.', icon: 'Briefcase', color: 'purple', targetDate: '2026-11-30', priority: 'high', progress: 0 });
          await db.habits.bulkAdd([
            { workspaceId: workspaceId as number, name: 'Solve 1 Leetcode Problem', icon: 'Code', color: 'purple', frequency: 'daily', isArchived: false }
          ]);
        } else if (selectedTemplate === 'gate') {
          const s1 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'Network Theory', color: 'purple', completionPercent: 0 });
          await db.goals.add({ workspaceId: workspaceId as number, title: 'Score AIR < 100', description: 'Clear GATE ECE core targets.', icon: 'GraduationCap', color: 'purple', targetDate: '2027-02-06', priority: 'high', progress: 0 });
          await db.habits.add({ workspaceId: workspaceId as number, name: 'Solve GATE PYQs', icon: 'BookOpen', color: 'purple', frequency: 'daily', isArchived: false });
        } else if (selectedTemplate === 'software') {
          const s1 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'Next.js & React', color: 'blue', completionPercent: 0 });
          await db.goals.add({ workspaceId: workspaceId as number, title: 'Launch SaaS App', description: 'Deploy a live side project.', icon: 'Rocket', color: 'blue', targetDate: '2026-10-01', priority: 'high', progress: 0 });
          await db.habits.add({ workspaceId: workspaceId as number, name: 'Git Commit Code', icon: 'Activity', color: 'blue', frequency: 'daily', isArchived: false });
        } else if (selectedTemplate === 'fitness') {
          const s1 = await db.subjects.add({ workspaceId: workspaceId as number, name: 'Strength Training', color: 'red', completionPercent: 0 });
          await db.goals.add({ workspaceId: workspaceId as number, title: 'Reach Stamina Targets', description: 'General fitness indexing.', icon: 'Flame', color: 'red', targetDate: '2026-12-31', priority: 'medium', progress: 0 });
          await db.habits.bulkAdd([
            { workspaceId: workspaceId as number, name: 'Drink 3L Water', icon: 'Droplet', color: 'blue', frequency: 'daily', isArchived: false },
            { workspaceId, name: 'Workout Session', icon: 'Activity', color: 'red', frequency: 'daily', isArchived: false }
          ]);
        }
      }

      // Add Custom Goals
      for (const cg of customGoals) {
        await db.goals.add({
          workspaceId: workspaceId as number,
          title: cg.title,
          description: 'Custom learning target.',
          icon: 'Compass',
          color: 'purple',
          targetDate: cg.targetDate,
          priority: 'medium',
          progress: 0
        });
      }

      // Add Custom Subjects
      for (const subName of customSubjects) {
        await db.subjects.add({
          workspaceId: workspaceId as number,
          name: subName,
          color: 'purple',
          completionPercent: 0
        });
      }

      // Save badges
      const savedBadges = localStorage.getItem(`aetheros_badges_${user}`);
      let badgesList = savedBadges ? JSON.parse(savedBadges) : [];
      if (!badgesList.includes('Onboarding Champion')) {
        badgesList.push('Onboarding Champion');
        localStorage.setItem(`aetheros_badges_${user}`, JSON.stringify(badgesList));
      }

      // Set Active Workspace State in store
      setActiveWorkspaceId(workspaceId as number);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const trackPresets = [
    { id: 'college', label: 'College / School', desc: 'Syllabus, GPA tracking & classes.', icon: GraduationCap, color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
    { id: 'placements', label: 'Placements Prep', desc: 'DSA, Resume, Coding interview rounds.', icon: Briefcase, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
    { id: 'competitive', label: 'Competitive Exams', desc: 'UPSC, GATE, CAT, GRE, JEE/NEET.', icon: Trophy, color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
    { id: 'development', label: 'Personal Development', desc: 'Fitness, languages, and habit loops.', icon: Activity, color: 'text-rose-400 border-rose-500/30 bg-rose-500/5' }
  ];

  const templatePresets = [
    { id: 'college', label: '🎓 College Student', desc: 'Preloads general Calculus, DSA labs, and GPA goals.' },
    { id: 'placement', label: '💼 Placement Prep', desc: 'Preloads DSA worksheets, System Design, and mock interviews.' },
    { id: 'gate', label: '📘 GATE ECE', desc: 'Preloads Network Theory, formula checks, and AIR goals.' },
    { id: 'software', label: '💻 Software Engineer', desc: 'Preloads Next.js/React, node backend notes, and Git commit tracker.' },
    { id: 'fitness', label: '🏋 Fitness & Health', desc: 'Preloads workout logs, diet trackers, and sleep habits.' },
    { id: 'blank', label: '✨ Blank Workspace', desc: 'Starts with a clean, fully empty workspace.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 bg-grid-pattern">
      <div className="glass-panel w-full max-w-xl p-8 border border-white/10 bg-zinc-900/90 shadow-2xl flex flex-col min-h-[500px] justify-between relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Step Header */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 mb-6 select-none">
          <span>AETHEROS ONBOARDING WIZARD</span>
          <span>STEP {step} OF 7</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Welcome to AetherOS</h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans font-normal">
                AetherOS is a premium **Universal AI Learning Operating System** designed to track, schedule, plan, and optimize your study pathways. Let&apos;s run a quick 7-step builder to setup your custom workspace.
              </p>
            </div>
          )}

          {/* STEP 2: Preparing For */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">What are you preparing for?</h2>
              <p className="text-xs text-zinc-400 mb-4">Toggle all preparation tracks that apply to your lifestyle.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {trackPresets.map(t => {
                  const Icon = t.icon;
                  const active = tracks.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTrack(t.id)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        active 
                          ? t.color 
                          : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <Icon className="shrink-0 mt-0.5" size={18} />
                      <div>
                        <h3 className="text-xs font-semibold text-white">{t.label}</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Template Selector */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Template Marketplace</h2>
              <p className="text-xs text-zinc-400 mb-3">Pre-seed your dashboard layout, goals, and habits instantly.</p>
              
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {templatePresets.map(tp => (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedTemplate(tp.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTemplate === tp.id 
                        ? 'bg-purple-500/10 border-purple-500/30 text-white' 
                        : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <h3 className="text-xs font-bold">{tp.label}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{tp.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Goals Builder */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Establish Workspace Goals</h2>
              <p className="text-xs text-zinc-400 mb-3">Add target goals and dates to visualize in your analytics.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Pass exam with distinction"
                  className="flex-1 p-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
                <input 
                  type="date" 
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="p-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {customGoals.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-white/5 bg-zinc-950/20 text-xs text-zinc-300">
                    <span className="font-medium truncate max-w-[280px]">{g.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 font-mono">Due: {g.targetDate}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Custom Syllabus Subjects */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Define Subjects</h2>
              <p className="text-xs text-zinc-400 mb-3">Add subjects or tracks you wish to schedule lectures and revisions for.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. UI Design Patterns"
                  className="flex-1 p-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 mt-2">
                {customSubjects.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/10 bg-purple-500/5 text-xs text-purple-300">
                    <span>{s}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSubject(s)}
                      className="text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Planner Configurations */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Study Schedule</h2>
              <p className="text-xs text-zinc-400 mb-3">Provide daily availability bounds to generate a personalized planner.</p>
              
              <div className="grid grid-cols-2 gap-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Wake Up Time</label>
                  <input 
                    type="time" 
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Sleep Time</label>
                  <input 
                    type="time" 
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target Study Hours / Day</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="font-bold font-mono text-purple-400 shrink-0 w-12">{dailyHours}h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Exam Target Countdown (Days)</label>
                  <input 
                    type="number" 
                    value={prepDays}
                    onChange={(e) => {
                      const d = parseInt(e.target.value) || 30;
                      setPrepDays(d);
                      const dateObj = new Date();
                      dateObj.setDate(dateObj.getDate() + d);
                      setTargetDate(dateObj.toISOString().split('T')[0]);
                    }}
                    className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-white focus:outline-none focus:border-purple-500 font-mono mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Dashboard Widget Preferences */}
          {step === 7 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Configure Dashboard Layout</h2>
              <p className="text-xs text-zinc-400 mb-3">Choose widgets to render on your initial Workspace Overview screen.</p>
              
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {Object.keys(enabledWidgets).map(widgetKey => {
                  const enabled = enabledWidgets[widgetKey];
                  return (
                    <button
                      key={widgetKey}
                      onClick={() => setEnabledWidgets(prev => ({ ...prev, [widgetKey]: !prev[widgetKey] }))}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        enabled 
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-md' 
                          : 'border-white/5 bg-white/[0.01] text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold capitalize font-sans">{widgetKey}</span>
                      <span className="text-[9px] text-zinc-500">
                        {enabled ? 'Active' : 'Hidden'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5 font-sans">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Initialize Workspace</span>
              <CheckCircle size={14} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
