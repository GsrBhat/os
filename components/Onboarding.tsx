'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, CheckCircle, GraduationCap, Briefcase, Languages, Heart } from 'lucide-react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { addXP } = useStore();
  const [step, setStep] = useState(1);
  const [tracks, setTracks] = useState({
    placements: true,
    gate: true,
    ielts: true,
    health: true
  });
  const [dailyHours, setDailyHours] = useState(6);
  const [wakeTime, setWakeTime] = useState('06:00');
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleToggleTrack = (track: keyof typeof tracks) => {
    setTracks(prev => ({ ...prev, [track]: !prev[track] }));
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

      // Save onboarding config
      localStorage.setItem('saios_onboarded', 'true');
      
      // Award XP
      addXP(50);
      
      // Fetch current badges and add 'Onboarding Champion'
      const savedBadges = localStorage.getItem('saios_badges');
      let badgesList = savedBadges ? JSON.parse(savedBadges) : [];
      if (!badgesList.includes('Onboarding Champion')) {
        badgesList.push('Onboarding Champion');
        localStorage.setItem('saios_badges', JSON.stringify(badgesList));
      }

      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 bg-grid-pattern">
      <div className="glass-panel w-full max-w-xl p-8 border border-white/10 bg-zinc-900/90 shadow-2xl flex flex-col min-h-[450px] justify-between relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Step Header */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500 mb-6">
          <span>SAIOS ONBOARDING WIZARD</span>
          <span>STEP {step} OF 4</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to your Study Operating System</h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                SaiOS is custom tailored to power your dual track prep for <strong className="text-purple-400">GATE ECE 2027</strong> and <strong className="text-blue-400">Placements</strong>, alongside language proficiency and personal habits. Let&apos;s run a quick initial setup.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">Select Your Focus Tracks</h2>
              <p className="text-xs text-zinc-400 mb-4">Toggle the tracks you want to enable in your system.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleToggleTrack('gate')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    tracks.gate 
                      ? 'bg-purple-500/10 border-purple-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <GraduationCap className={tracks.gate ? 'text-purple-400' : 'text-zinc-500'} size={20} />
                  <div>
                    <h3 className="text-sm font-semibold">GATE ECE 2027</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Core ECE syllabus & analytics.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleTrack('placements')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    tracks.placements 
                      ? 'bg-blue-500/10 border-blue-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <Briefcase className={tracks.placements ? 'text-blue-400' : 'text-zinc-500'} size={20} />
                  <div>
                    <h3 className="text-sm font-semibold">Placements</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Python, DSA, Aptitude.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleTrack('ielts')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    tracks.ielts 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <Languages className={tracks.ielts ? 'text-emerald-400' : 'text-zinc-500'} size={20} />
                  <div>
                    <h3 className="text-sm font-semibold">Languages</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">IELTS & TOEFL practice.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleTrack('health')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    tracks.health 
                      ? 'bg-rose-500/10 border-rose-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <Heart className={tracks.health ? 'text-rose-400' : 'text-zinc-500'} size={20} />
                  <div>
                    <h3 className="text-sm font-semibold">Habits & Health</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Water, sleep, workouts.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">Configure Target Routine</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">DAILY TARGET STUDY HOURS</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold font-mono text-purple-400 shrink-0 w-12">{dailyHours} hours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">IDEAL WAKE UP TIME</label>
                  <input 
                    type="time" 
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Setup Ready!</h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans max-w-sm mx-auto">
                All systems initialized. You will start with the first set of tasks, default topics synced, and a booster reward:
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono max-w-xs mx-auto justify-center">
                <Trophy size={16} />
                <span>+50 XP & &quot;Onboarding Champion&quot; Badge</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
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

          {step < 4 ? (
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
              <span>Initialize SaiOS</span>
              <Sparkles size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
