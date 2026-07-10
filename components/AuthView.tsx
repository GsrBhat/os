'use client';

import React, { useState } from 'react';
import { Lock, User, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (username: string) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (trimmedPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    // Get current users from localStorage
    const usersStr = localStorage.getItem('saios_users') || '[]';
    const users = JSON.parse(usersStr) as { username: string; password: string }[];

    if (isSignUp) {
      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }

      // Check if user already exists
      const userExists = users.some(u => u.username === trimmedUsername);
      if (userExists) {
        setError('Username already taken.');
        return;
      }

      // Create new user account
      users.push({ username: trimmedUsername, password: trimmedPassword });
      localStorage.setItem('saios_users', JSON.stringify(users));

      // Trigger login success
      onLoginSuccess(trimmedUsername);
    } else {
      // Find matching user
      const user = users.find(u => u.username === trimmedUsername && u.password === trimmedPassword);
      if (!user) {
        // Fallback convenience account for sai/sai
        if (trimmedUsername === 'sai' && trimmedPassword === 'sai') {
          users.push({ username: 'sai', password: 'sai' });
          localStorage.setItem('saios_users', JSON.stringify(users));
          onLoginSuccess('sai');
          return;
        }
        setError('Invalid username or password.');
        return;
      }

      // Trigger login success
      onLoginSuccess(trimmedUsername);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 bg-grid-pattern p-4 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating System Brand Card */}
      <div className="mb-6 flex flex-col items-center select-none text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-extrabold text-white text-xl shadow-xl shadow-purple-500/10 animate-bounce">
          S
        </div>
        <h1 className="text-2xl font-black tracking-widest text-white mt-4 font-mono">
          SAI<span className="text-purple-400">OS</span>
        </h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans mt-1">
          Personal AI Study Operating System
        </p>
      </div>

      {/* Glassmorphic Credentials Login Portal */}
      <div className="w-full max-w-sm glass-panel p-6 border border-white/5 bg-zinc-900/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-10">
        
        {/* Sign In / Sign Up Selector tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-white/5 mb-6 font-sans">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isSignUp 
                ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white border border-purple-500/20 shadow-md' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isSignUp 
                ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white border border-purple-500/20 shadow-md' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserPlus size={13} />
            <span>Register</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sai"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Confirm Password Input (only for Sign Up) */}
          {isSignUp && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer hover:shadow-purple-500/20 active:scale-95"
          >
            {isSignUp ? <UserPlus size={14} /> : <LogIn size={14} />}
            <span>{isSignUp ? 'Create Workspace' : 'Unlock Workspace'}</span>
          </button>

        </form>

        {/* Informative info banner */}
        <div className="mt-5 text-[10px] text-zinc-600 text-center leading-relaxed font-sans border-t border-white/5 pt-4">
          <Sparkles className="inline text-purple-400 mr-1" size={10} />
          {isSignUp 
            ? 'Creating an account instantiates a separate local study database for you.' 
            : 'Enter credentials to open your private local IndexedDB environment.'}
        </div>
      </div>
      
    </div>
  );
}
