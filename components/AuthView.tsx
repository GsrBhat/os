'use client';

import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, UserPlus, Sparkles, AlertCircle, Mail, Eye, EyeOff, MailOpen, Trash } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (username: string) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mailSentSuccess, setMailSentSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Simulated Verification Email Modal State
  const [pendingVerificationMail, setPendingVerificationMail] = useState<{
    to: string;
    username: string;
  } | null>(null);

  // Saved Profiles State
  const [savedAccounts, setSavedAccounts] = useState<{ username: string; email?: string }[]>([]);

  // Load accounts on mount
  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = () => {
    const usersStr = localStorage.getItem('aetheros_users') || '[]';
    const users = JSON.parse(usersStr) as { username: string; email?: string }[];
    
    // Seed default helper profiles if empty
    if (users.length === 0) {
      const defaultProfiles = [
        { username: 'sai', email: 'sai@aetheros.edu', password: 'sai' },
        { username: 'guest', email: 'guest@aetheros.dev', password: 'guest' }
      ];
      localStorage.setItem('aetheros_users', JSON.stringify(defaultProfiles));
      setSavedAccounts(defaultProfiles);
    } else {
      setSavedAccounts(users);
    }
  };

  const handleDeleteAccount = (usernameToDelete: string) => {
    if (confirm(`Remove saved login credentials for "${usernameToDelete}" from this browser?`)) {
      const usersStr = localStorage.getItem('aetheros_users') || '[]';
      const users = JSON.parse(usersStr) as { username: string; email?: string; password: string }[];
      const updated = users.filter(u => u.username !== usernameToDelete);
      localStorage.setItem('aetheros_users', JSON.stringify(updated));
      loadSavedAccounts();
      
      // Wipe corresponding scoped database data if desired
      const activeUser = localStorage.getItem('aetheros_current_user');
      if (activeUser === usernameToDelete) {
        localStorage.removeItem('aetheros_current_user');
      }
    }
  };

  const handleClearAllAccounts = () => {
    if (confirm('Are you sure you want to permanently clear all saved local user profiles on this browser?')) {
      localStorage.setItem('aetheros_users', '[]');
      setSavedAccounts([]);
      localStorage.removeItem('aetheros_current_user');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMailSentSuccess('');

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();
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
    const usersStr = localStorage.getItem('aetheros_users') || '[]';
    const users = JSON.parse(usersStr) as { username: string; email?: string; password: string }[];

    if (isSignUp) {
      if (!trimmedEmail) {
        setError('Email address is required to register.');
        return;
      }
      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }

      // Check if username already exists
      const userExists = users.some(u => u.username === trimmedUsername);
      if (userExists) {
        setError('Username already taken.');
        return;
      }

      // Check if email already exists
      const emailExists = users.some(u => u.email === trimmedEmail);
      if (emailExists) {
        setError('Email address already in use.');
        return;
      }

      // Create new user account
      users.push({ username: trimmedUsername, email: trimmedEmail, password: trimmedPassword });
      localStorage.setItem('aetheros_users', JSON.stringify(users));
      loadSavedAccounts();

      // Trigger Simulated Outbox Modal
      setPendingVerificationMail({
        to: trimmedEmail,
        username: trimmedUsername
      });

      // Also print details to developer console for inspection
      console.log(
        `%c[AetherOS SMTP Simulated Mailer]%c\nTo: ${trimmedEmail}\nSubject: Welcome to AetherOS - Confirm Workspace\nBody: Hello ${trimmedUsername},\nYour AetherOS workspace has been successfully created. Welcome aboard!\n---------------------------------------`,
        'color: #a855f7; font-weight: bold;',
        'color: #94a3b8;'
      );
    } else {
      // Find matching user (Login only requires Username and Password)
      const user = users.find(u => u.username === trimmedUsername && u.password === trimmedPassword);
      if (!user) {
        // Fallback convenience accounts creation if missing
        if (trimmedUsername === 'sai' && trimmedPassword === 'sai') {
          const defaultEmail = 'sai@aetheros.edu';
          users.push({ username: 'sai', email: defaultEmail, password: 'sai' });
          localStorage.setItem('aetheros_users', JSON.stringify(users));
          onLoginSuccess('sai');
          return;
        }
        if (trimmedUsername === 'guest' && trimmedPassword === 'guest') {
          const defaultEmail = 'guest@aetheros.dev';
          users.push({ username: 'guest', email: defaultEmail, password: 'guest' });
          localStorage.setItem('aetheros_users', JSON.stringify(users));
          onLoginSuccess('guest');
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
          A
        </div>
        <h1 className="text-2xl font-black tracking-widest text-white mt-4 font-mono">
          AETHER<span className="text-purple-400">OS</span>
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
            onClick={() => { setIsSignUp(false); setError(''); setMailSentSuccess(''); }}
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
            onClick={() => { setIsSignUp(true); setError(''); setMailSentSuccess(''); }}
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

          {/* Email Input (only for Sign Up) */}
          {isSignUp && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sai@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input (only for Sign Up) */}
          {isSignUp && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
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
            ? 'A confirmation email will be dispatched to verify your new database connection.' 
            : 'Enter credentials to open your private local IndexedDB environment.'}
        </div>
      </div>

      {/* Saved Profiles List Card (Answer to: where to check login details) */}
      {savedAccounts.length > 0 && (
        <div className="w-full max-w-sm glass-panel p-5 border border-white/5 bg-zinc-900/60 mt-4 text-xs z-10 shadow-lg">
          <h3 className="font-bold text-zinc-300 mb-3 flex items-center justify-between font-sans">
            <span>Local Profiles on this Device</span>
            <button 
              onClick={handleClearAllAccounts}
              className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
            >
              Clear All
            </button>
          </h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {savedAccounts.map(acc => (
              <div 
                key={acc.username}
                onClick={() => {
                  setUsername(acc.username);
                  setError('');
                }}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-purple-500/5 hover:border-purple-500/20 transition-all cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-white group-hover:text-purple-400 transition-colors font-mono">{acc.username}</span>
                  <span className="text-[10px] text-zinc-500 ml-2 font-sans">({acc.email || 'sai@aetheros.edu'})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAccount(acc.username);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-all rounded hover:bg-red-500/10 cursor-pointer"
                  title="Remove Profile"
                >
                  <Trash size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Simulated Verification Email Modal */}
      {pendingVerificationMail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 border border-purple-500/30 bg-zinc-900/90 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <MailOpen size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AetherOS SMTP Mail Delivery</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Status: Delivered (Sandbox Simulation)</p>
              </div>
            </div>

            <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-white/5 font-sans leading-relaxed text-zinc-300">
              <p><strong>From:</strong> mail-service@aetheros.edu</p>
              <p><strong>To:</strong> {pendingVerificationMail.to}</p>
              <p><strong>Subject:</strong> Verify Your AetherOS Study Workspace</p>
              <hr className="border-white/5" />
              <p>Hello <strong className="text-purple-400 font-mono">{pendingVerificationMail.username}</strong>,</p>
              <p>Your local AetherOS workspace database has been compiled and is ready for instantiation.</p>
              <p>Please click the button below to confirm your registered email address and activate your study environment.</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  const user = pendingVerificationMail.username;
                  setPendingVerificationMail(null);
                  onLoginSuccess(user);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/10 cursor-pointer text-center"
              >
                Verify & Launch Workspace
              </button>
              <button
                onClick={() => setPendingVerificationMail(null)}
                className="px-4 py-3 rounded-xl border border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
