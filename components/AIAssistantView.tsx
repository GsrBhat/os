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
  const { addXP, settings } = useStore();
  const todayStr = '2026-07-10'; // Core current date

  // DB queries for contextual local rule engine
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray(), []);
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []);
  const allSubjects = useLiveQuery(() => db.subjects.toArray(), []);
  const allMistakes = useLiveQuery(() => db.mistakes.toArray(), []);

  // State
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello Sai! I am your SaiOS AI Study Assistant. I have analyzed your dual-track preparation database. Ask me anything about your progress, study recommendations, or request a quick quiz!' }
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
    
    if (text.includes('gate') || text.includes('readiness') || text.includes('score')) {
      const gateCount = allSubjects?.filter(s => s.category === 'gate').length || 0;
      const completedGate = allSubjects?.filter(s => s.category === 'gate' && s.completionPercent >= 70).length || 0;
      return `### GATE ECE 2027 Readiness Analysis
Based on your syllabus trackers, you have initialized ${gateCount} core ECE subjects. 
* Subjects completed (&gt;70%): ${completedGate} / ${gateCount}
* Current top confidence: Network Theory (Mastered) and Digital Electronics (75%).
* Recommended focus area: Analog Electronics and EDC are currently under 45% completion. 
* Action item: Solve at least 30 transient response questions on first-order RC circuits to resolve recent nodal slips.`;
    }

    if (text.includes('placement') || text.includes('dsa') || text.includes('python')) {
      const dsaTasks = allTasks?.filter(t => t.subject === 'placement-dsa' && t.status === 'completed').length || 0;
      return `### Placement Readiness Report
* DSA Practice logs: You have solved dynamic programming (0/1 Knapsack) and reverse linked list.
* Current Python core mastery is estimated at 65%.
* Recommendations: Brush up on binary search tree traversals (today's high priority task). Implement the iterative logic to avoid recursion stack overflows in coding assessments.`;
    }

    if (text.includes('schedule') || text.includes('tomorrow') || text.includes('plan')) {
      return `### Tomorrow's Optimized Study Schedule
Based on your focus ratings and energy levels, early morning is your peak efficiency zone.
1. **08:30 - 10:00 (GATE)**: Transient response of RL circuits (High focus required).
2. **10:30 - 12:00 (Placements)**: LeetCode binary search tree logic (Medium priority).
3. **14:00 - 15:30 (IELTS)**: Writing task 2 essay structure (Vocabulary drill).
4. **16:00 - 17:00 (Revision)**: Active recall of K-Maps and Boolean minimization.`;
    }

    if (text.includes('mistake') || text.includes('error')) {
      const slipCount = allMistakes?.length || 0;
      return `### Mistake Repository Review
You currently have ${slipCount} logged conceptual/coding errors. 
* High priority slip: "KCL Loop Direction Sign Mistake" (Network Theory).
* Spaced Repetition notice: Review the passive sign convention immediately. You made a sign error on July 4th. Next review is scheduled for tomorrow.`;
    }

    return `I am analyzing your metrics. You have completed ${allLogs?.length || 0} days of study logs. Your average focus rating is high. Ask me to "optimize my schedule", "analyze gate readiness", or "review mistakes" for tailored guidance!`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMessage: Message = { sender: 'user', text: inputMsg };
    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setChatLoading(true);

    // Simulated delay
    setTimeout(() => {
      // Direct call to local rule engine OR mock LLM call
      const aiResponseText = generateLocalResponse(userMessage.text);
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
      setChatLoading(false);
    }, 800);
  };

  // Pre-configured GATE / DSA study quizzes
  const quizBank = [
    {
      q: 'For a first-order RC transient circuit, what is the value of the voltage across the capacitor at t = tau (time constant) if charged from 0 to V_s?',
      options: ['0.368 V_s', '0.500 V_s', '0.632 V_s', '0.900 V_s'],
      ans: 2,
      explanation: 'The capacitor charges according to v_c(t) = V_s(1 - e^(-t/tau)). At t = tau, v_c(tau) = V_s(1 - e^-1) = V_s(1 - 0.368) = 0.632 V_s.'
    },
    {
      q: 'Which data structure is best suited for implementing a Breadth-First Search (BFS) algorithm on a graph?',
      options: ['Stack', 'Queue', 'Min-Heap', 'Binary Search Tree'],
      ans: 1,
      explanation: 'BFS uses a Queue (First-In, First-Out) to visit nodes level-by-level, whereas Depth-First Search (DFS) relies on a Stack.'
    },
    {
      q: 'In Python, what is the output of the expression: [x**2 for x in range(3)]?',
      options: ['[0, 1, 4]', '[1, 4, 9]', '[0, 1, 2]', '[1, 2, 3]'],
      ans: 0,
      explanation: 'The list comprehension squares each number generated by range(3), which returns [0, 1, 2]. Hence, [0**2, 1**2, 2**2] = [0, 1, 4].'
    }
  ];

  const handleTriggerQuiz = () => {
    const idx = Math.floor(Math.random() * quizBank.length);
    setQuizQuestion(quizBank[idx]);
    setSelectedOption(null);
    setQuizFeedback(null);
  };

  const handleSelectOption = (idx: number) => {
    if (quizFeedback !== null) return; // already answered
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (!quizQuestion || selectedOption === null) return;
    
    if (selectedOption === quizQuestion.ans) {
      setQuizFeedback('CORRECT! Excellent logic.');
      addXP(15); // +15 XP for answering study quiz correctly
    } else {
      setQuizFeedback(`INCORRECT. The correct answer was: ${quizQuestion.options[quizQuestion.ans]}.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[72vh] items-stretch animate-in fade-in duration-300">
      
      {/* Column 1 & 2: Chat Assistant & Quiz Deck */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Chat Widget */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex-1 flex flex-col overflow-hidden justify-between">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-4 shrink-0">
            <Brain className="text-purple-400" size={18} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">SaiOS Interactive Brain</h3>
          </div>

          {/* Conversation history viewport */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map((msg, i) => (
              <div 
                key={i}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-white/5 text-purple-400'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={12} />}
                </div>
                
                <div 
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-100 rounded-tr-none' 
                      : 'bg-white/[0.02] border border-white/5 text-zinc-300 rounded-tl-none font-sans whitespace-pre-line'
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 items-center text-xs text-zinc-500 font-mono">
                <Sparkles className="animate-spin text-purple-400" size={12} />
                <span>AI is compiling metrics...</span>
              </div>
            )}
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
            <input 
              type="text"
              placeholder="Ask about 'gate readiness', 'dsa report', or 'optimize my schedule'..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-grow p-3 rounded-xl border border-white/5 bg-zinc-950 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
            />
            <button 
              type="submit"
              className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

      {/* Column 3: Quiz Deck & Productivity Engine */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto">
        
        {/* Interactive Quiz Deck */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between shrink-0">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
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
                <div className="space-y-2">
                  <div className={`p-2.5 rounded-lg border font-semibold ${
                    quizFeedback.startsWith('CORRECT') 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {quizFeedback}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                    <strong>Explanation: </strong>{quizQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs font-sans">
              <HelpCircle className="mx-auto mb-2 text-zinc-600 animate-bounce" size={20} />
              <span>Click &quot;Draw Card&quot; to test your GATE or DSA knowledge. Correct answers award +15 XP!</span>
            </div>
          )}
        </div>

        {/* AI Productivity Engine stats */}
        <div className="glass-panel p-5 border border-white/5 bg-white/[0.01] flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              Productivity Audit
            </h3>
            
            <div className="space-y-4 text-xs font-sans">
              <div className="flex justify-between border-b border-white/[0.02] pb-2">
                <span className="text-zinc-500">Today&apos;s Wins:</span>
                <span className="text-emerald-400 font-semibold">Mesh Analysis mastery</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-2">
                <span className="text-zinc-500">Skipped Blocks:</span>
                <span className="text-red-400">1 Analog Op-amp task</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-2">
                <span className="text-zinc-500">Rescheduled Target:</span>
                <span className="text-blue-400 font-mono">2026-07-11</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-2">
                <span className="text-zinc-500">Tomorrow Completion Prob:</span>
                <span className="text-purple-400 font-bold">92% (High Energy)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10px] text-purple-300 leading-relaxed font-mono">
            <strong>Engine Advice:</strong> Sleep by 10 PM. You study 24% more effectively when sleep duration is above 7.5 hours.
          </div>
        </div>

      </div>

    </div>
  );
}
