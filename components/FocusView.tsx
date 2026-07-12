'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Music,
  Coffee,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { db } from '@/lib/db';
import { useStore } from '@/lib/store';
import confetti from 'canvas-confetti';

type SoundType = 'rain' | 'forest' | 'white' | 'none';

// Offline sound synthesis using Web Audio API
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private type: SoundType = 'none';

  constructor(type: SoundType) {
    this.type = type;
  }

  start() {
    if (typeof window === 'undefined') return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        
        if (this.type === 'rain') {
          // Brown/Pink noise filter approximation for rain
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Gain compensation
        } else if (this.type === 'forest') {
          // Bandpass filtered noise representing rustling leaves/wind
          data[i] = (lastOut + (0.05 * white)) / 1.05;
          lastOut = data[i];
          data[i] *= 2.0;
        } else {
          // Plain white noise
          data[i] = white;
        }
      }

      this.source = this.ctx.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      if (this.type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, this.ctx.currentTime);
      } else if (this.type === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      }

      this.gainNode = this.ctx.createGain();
      // Low volume comfort
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.source.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.source.start();
    } catch (e) {
      console.warn('AudioContext failed to start', e);
    }
  }

  stop() {
    try {
      if (this.source) {
        this.source.stop();
      }
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (e) {
      // Ignored
    }
  }
}

export default function FocusView() {
  const { addXP } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // Timer configuration options
  const presets = [
    { name: 'Pomodoro', work: 25, break: 5 },
    { name: 'Short Focus', work: 50, break: 10 },
    { name: 'Long Focus', work: 90, break: 20 },
  ];

  const [activePreset, setActivePreset] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(presets[0].work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundType>('none');
  const [soundVolume, setSoundVolume] = useState(50); // percentage

  const audioSynthRef = useRef<AudioSynthesizer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply timer configuration changes on preset switch
  useEffect(() => {
    const config = presets[activePreset];
    const duration = isBreak ? config.break : config.work;
    setSecondsLeft(duration * 60);
    setIsRunning(false);
  }, [activePreset, isBreak]);

  // Main countdown tick loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer complete!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  // Control ambient synthesizer
  useEffect(() => {
    if (audioSynthRef.current) {
      audioSynthRef.current.stop();
      audioSynthRef.current = null;
    }

    if (activeSound !== 'none') {
      const synth = new AudioSynthesizer(activeSound);
      synth.start();
      audioSynthRef.current = synth;
    }

    return () => {
      if (audioSynthRef.current) {
        audioSynthRef.current.stop();
      }
    };
  }, [activeSound]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    confetti({ particleCount: 100, spread: 60 });
    
    // Play alert sound if supported
    try {
      const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      alertAudio.volume = 0.5;
      alertAudio.play();
    } catch (e) {}

    const config = presets[activePreset];
    const durationCompleted = isBreak ? config.break : config.work;

    if (!isBreak) {
      // Study block complete! Add XP and Log Pomodoro
      addXP(25); // +25 XP for full focus session

      await db.pomodoroLogs.add({
        date: todayStr,
        duration: durationCompleted,
        category: 'Focus Mode Session',
        completed: true
      });

      // Update today's daily log studyHours
      const log = await db.dailyLogs.get(todayStr);
      if (log) {
        const currentHours = log.studyHours;
        const newHours = currentHours + (durationCompleted / 60);
        await db.dailyLogs.update(todayStr, {
          studyHours: Math.round(newHours * 10) / 10,
          completedTasksCount: log.completedTasksCount + 1
        });
      }
    }

    // Toggle break status
    setIsBreak(!isBreak);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const config = presets[activePreset];
    const duration = isBreak ? config.break : config.work;
    setSecondsLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Sync fullscreen change with ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`space-y-6 flex flex-col justify-center items-center h-full transition-all duration-500 ${
        isFullscreen ? 'bg-zinc-950 fixed inset-0 z-50 p-12' : 'animate-in fade-in duration-300'
      }`}
    >
      
      {/* Settings bar inside fullscreen focus */}
      {isFullscreen && (
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center text-zinc-500 text-xs font-mono">
          <span>AETHEROS FOCUS ENVIRONMENT</span>
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Minimize2 size={14} />
            <span>EXIT FULLSCREEN</span>
          </button>
        </div>
      )}

      {/* Mode selectors */}
      {!isFullscreen && (
        <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl w-fit">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePreset(idx);
                setIsBreak(false);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activePreset === idx && !isBreak 
                  ? 'bg-purple-600 text-white' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {preset.name} ({preset.work}m)
            </button>
          ))}
          <button
            onClick={() => setIsBreak(!isBreak)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              isBreak ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-emerald-500/5'
            }`}
          >
            <Coffee size={12} className="inline mr-1" />
            Break Mode
          </button>
        </div>
      )}

      {/* Main Timer Dial display */}
      <div className="flex flex-col items-center justify-center p-8 rounded-full border border-white/5 bg-white/[0.01] shadow-2xl relative w-80 h-80 select-none glass-panel">
        
        {/* Glow border ring */}
        <div className={`absolute inset-1 rounded-full border border-dashed animate-spin duration-[60s] pointer-events-none opacity-20 ${
          isBreak ? 'border-emerald-500' : 'border-purple-500'
        }`} />

        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">
          {isBreak ? 'Break Session' : 'Study Session'}
        </span>
        
        <h2 className="text-6xl font-extrabold font-mono text-white tracking-tighter my-3">
          {formatTime(secondsLeft)}
        </h2>

        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={toggleTimer}
            className={`p-3.5 rounded-full text-white cursor-pointer shadow-lg transition-transform hover:scale-105 ${
              isBreak ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-3 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Ambient noise soundboard controls */}
      <div className="glass-panel p-5 max-w-sm w-full flex flex-col items-center gap-4 border border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          <Music size={14} className="text-purple-400" />
          <span>Ambient soundboard</span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { id: 'rain', label: 'Rain noise' },
            { id: 'forest', label: 'Forest' },
            { id: 'white', label: 'White' },
          ].map((sound) => (
            <button
              key={sound.id}
              onClick={() => setActiveSound(activeSound === sound.id ? 'none' : sound.id as SoundType)}
              className={`py-2 px-3 rounded-xl border text-[10px] font-semibold tracking-wider font-mono cursor-pointer transition-colors ${
                activeSound === sound.id 
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
              }`}
            >
              {sound.label}
            </button>
          ))}
        </div>

        {/* Volume status helper */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          {activeSound === 'none' ? (
            <VolumeX size={12} />
          ) : (
            <Volume2 size={12} className="text-purple-400 animate-pulse" />
          )}
          <span>{activeSound === 'none' ? 'Soundboard Muted' : `${activeSound} Synthesizer active`}</span>
        </div>
      </div>

      {/* Fullscreen Button */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Maximize2 size={14} />
          <span>Fullscreen Focus</span>
        </button>
      )}

    </div>
  );
}
