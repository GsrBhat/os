'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Sparkles, Send, Brain, Trophy, AlertCircle, ArrowRight, User, HelpCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export default function AIAssistantView() {
  const { activeWorkspaceId, addXP, settings } = useStore();
  const todayStr = '2026-07-10'; // Core system date

  // DB queries scoped to workspace
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray(), []) || [];
  
  const allTasks = useLiveQuery(() => 
    db.tasks.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const allSubjects = useLiveQuery(() => 
    db.subjects.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  const allMistakes = useLiveQuery(() => 
    db.mistakes.where('workspaceId').equals(activeWorkspaceId || 0).toArray(),
    [activeWorkspaceId]
  ) || [];

  // State
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! I am your AetherOS AI Study Assistant. I have analyzed your active workspace data. Ask me anything about your progress, study recommendations, or request a quick quiz!' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Quiz deck state
  const [quizQuestion, setQuizQuestion] = useState<{ q: string; options: string[]; ans: number; explanation: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // Local Rule Engine responses based on prompt keywords
  const generateLocalResponse = (prompt: string): string => {
    const text = prompt.toLowerCase();
    
    if (text.includes('readiness') || text.includes('score') || text.includes('report') || text.includes('subjects')) {
      const subCount = allSubjects.length;
      const completed = allSubjects.filter(s => s.completionPercent >= 70).length;
      return `### Workspace Readiness Report
Based on your current subjects in this active workspace, you have logged **${subCount} tracks**.
* Completed subjects (&gt;70% progress): **${completed} / ${subCount}**
* Recommended focus area: Review your Mistake Repository periodically to avoid recurring conceptual bugs in subjects with lower completion percentages.`;
    }

    if (text.includes('recommend') || text.includes('study plan') || text.includes('next')) {
      const pendingTasksCount = allTasks.filter(t => t.status !== 'completed').length;
      return `### Daily Workspace Recommendation
* You currently have **${pendingTasksCount} pending tasks** on your checklist for today.
* I recommend tackling the highest priority tasks first during your peak focus hours.
* Keep study sessions timed at 25-50 minutes and log any wrong questions immediately to build a spaced repetition queue.`;
    }

    if (text.includes('mistake') || text.includes('slip') || text.includes('wrong')) {
      return `### Spaced Repetition Mistakes Review
You have **${allMistakes.length} mistakes** logged in this workspace's mistake repository.
* Regularly test yourself on these conceptual traps.
* Use the SM-2 review rating selectors inside the Mistakes tab to dynamically reschedule revision dates based on your recall strength.`;
    }

    return `I've analyzed your AetherOS workspace logs. Your statistics show a consistent habit flow! You have logged ${allSubjects.length} subjects and ${allTasks.length} tasks. Let me know if you would like to run a study quiz card or review your goals timeline.`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    setTimeout(() => {
      const aiResponse = generateLocalResponse(userText);
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setChatLoading(false);
    }, 800);
  };

  // Static quiz cards
  const handleTriggerQuiz = () => {
    const quizPool = [
      {
        q: 'Which database isolation level prevents dirty reads but allows non-repeatable reads?',
        options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
        ans: 1,
        explanation: 'Read Committed prevents dirty reads by ensuring that any data read is committed at the moment it is read. However, it still allows non-repeatable reads.'
      },
      {
        q: 'In reactive programming, which design pattern is primarily used to listen for data stream emissions?',
        options: ['Decorator Pattern', 'Observer Pattern', 'Factory Pattern', 'Singleton Pattern'],
        ans: 1,
        explanation: 'The Observer Pattern is the foundation of reactive streams, where Observers subscribe and react to emissions from Observables.'
      }
    ];

    const randomQuiz = quizPool[Math.floor(Math.random() * quizPool.length)];
    setQuizQuestion(randomQuiz);
    setSelectedOption(null);
    setQuizFeedback(null);
  };

  const handleSelectOption = (idx: number) => {
    if (quizFeedback === null) {
      setSelectedOption(idx);
    }
  };

  const handleCheckAnswer = () => {
    if (quizQuestion === null || selectedOption === null) return;

    if (selectedOption === quizQuestion.ans) {
      setQuizFeedback('CORRECT! +20 XP awarded! 🎉');
      addXP(20);
    } else {
      setQuizFeedback(`INCORRECT. The correct answer is: ${quizQuestion.options[quizQuestion.ans]}.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[72vh] items-stretch animate-in fade-in duration-300 font-sans">
      
      {/* Chat Bot panel */}
      <div className="lg:col-span-2 glass-panel border border-white/5 bg-white/[0.01] flex flex-col justify-between h-full overflow-hidden p-4 md:p-6">
        
        {/* Messages stream */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 text-xs max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                msg.sender === 'user' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}>
                {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-3 rounded-2xl leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/5 text-zinc-300 rounded-tl-none whitespace-pre-wrap select-text'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-3 text-xs max-w-[80%] animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 rounded-tl-none font-mono">
                AI Coach is analyzing...
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask AI Coach for a schedule review, weak subjects..."
            className="flex-grow p-3 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
          />
          <button 
            type="submit"
            className="px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Column 3: Quiz Deck */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto">
        
        {/* Interactive Quiz Deck */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between shrink-0">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3 select-none">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Trophy size={14} className="text-amber-400" />
              <span>Micro-Quiz Deck</span>
            </div>
            <button 
              onClick={handleTriggerQuiz}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              Draw Card
            </button>
          </div>

          {quizQuestion ? (
            <div className="space-y-4 text-xs">
              <p className="font-semibold text-white leading-relaxed font-sans">{quizQuestion.q}</p>
              
              <div className="space-y-2">
                {quizQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      selectedOption === idx 
                        ? 'bg-purple-500/15 border-purple-500/40 text-white' 
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizFeedback === null ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer"
                >
                  Verify Answer
                </button>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    quizFeedback.includes('CORRECT') 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {quizFeedback}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{quizQuestion.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 text-xs select-none">
              <Brain className="mx-auto text-zinc-700 animate-pulse mb-2" size={24} />
              <p className="font-semibold">Ready for a Quiz?</p>
              <p className="text-[10px] text-zinc-600 max-w-[150px] mx-auto mt-1">Click &quot;Draw Card&quot; to test your technical engineering or coding recall!</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
