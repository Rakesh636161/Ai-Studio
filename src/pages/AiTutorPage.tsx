import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Code2,
  Copy,
  Check,
  RotateCcw,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
  Layers,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { Course, User, TutorMessage } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface AiTutorPageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
}

export const AiTutorPage: React.FC<AiTutorPageProps> = ({
  user,
  courses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => courses[0]?.id || 'general');
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>('');
  const [explanationMode, setExplanationMode] = useState<'simple' | 'detailed' | 'practical'>('simple');
  const [questionInput, setQuestionInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user.name}! I am your AlphaWave AI Personal Tutor. Choose a course and session from the controls above, select your desired explanation mode, and ask me any question or paste code you want to debug.`,
      explanationMode: 'simple',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load past conversation when course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchHistory = async () => {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      try {
        const res = await fetch(`/api/tutor/conversations/${selectedCourseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.conversation?.messages && data.conversation.messages.length > 0) {
            setMessages(data.conversation.messages);
          }
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    };
    fetchHistory();
  }, [selectedCourseId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isLoading) return;

    const currentQuestion = questionInput.trim();
    const currentCode = codeInput.trim();
    setQuestionInput('');
    setCodeInput('');
    setShowCodeInput(false);

    // Optimistic user message
    const userMsg: TutorMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: currentQuestion,
      codeSnippet: currentCode || undefined,
      explanationMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const token = localStorage.getItem('coursestudio_token') || user.id;

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          chapterTitle: selectedChapterTitle || selectedCourse?.chapters[0]?.title || '',
          question: currentQuestion,
          explanationMode,
          codeContext: currentCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from AI Tutor.');
      }

      const botMsg: TutorMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        explanationMode: data.explanationMode || explanationMode,
        codeSnippet: data.codeSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `I ran into an issue connecting to the AI Tutor service: ${err.message}. Please try asking your question again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100">
      <Sidebar
        courses={courses}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 h-screen">
        <Navbar
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfileModal={() => navigate('/profile')}
        />

        <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 max-w-5xl mx-auto w-full">
          {/* Header & Context Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs mb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    AlphaWave AI Tutor – Doubt Solver
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Context-aware learning assistant for your courses and lecture materials.
                  </p>
                </div>
              </div>

              {/* Course Context Picker */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedChapterTitle('');
                  }}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="general">General Knowledge</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                {selectedCourse && selectedCourse.chapters?.length > 0 && (
                  <select
                    value={selectedChapterTitle}
                    onChange={(e) => setSelectedChapterTitle(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none max-w-44 truncate"
                  >
                    <option value="">All Chapters</option>
                    {selectedCourse.chapters.map((ch) => (
                      <option key={ch.chapterNumber} value={ch.title}>
                        Ch {ch.chapterNumber}: {ch.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 3 Explanation Modes */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Mode:</span>
              <button
                type="button"
                onClick={() => setExplanationMode('simple')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  explanationMode === 'simple'
                    ? 'bg-[#8150E8] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Simple Explanation
              </button>
              <button
                type="button"
                onClick={() => setExplanationMode('detailed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  explanationMode === 'detailed'
                    ? 'bg-[#8150E8] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Detailed Explanation
              </button>
              <button
                type="button"
                onClick={() => setExplanationMode('practical')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  explanationMode === 'practical'
                    ? 'bg-[#8150E8] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Practical Example (Code)
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                      isUser ? 'bg-slate-700' : 'bg-[#8150E8]'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-2 min-w-0 ${isUser ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-left ${
                        isUser
                          ? 'bg-[#8150E8] text-white rounded-tr-none'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Code Snippet attachment */}
                      {msg.codeSnippet && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                            <span>Code Block</span>
                            <button
                              type="button"
                              onClick={() => copyCode(msg.codeSnippet!, msg.id)}
                              className="inline-flex items-center gap-1 hover:text-[#8150E8] cursor-pointer"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono text-[11px] leading-normal">
                            <code>{msg.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 px-1">
                      <span>{msg.timestamp}</span>
                      {msg.explanationMode && (
                        <span className="ml-2 font-medium capitalize">· {msg.explanationMode} mode</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#8150E8] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8150E8] animate-spin" />
                  <span>AlphaWave AI Tutor is analyzing your question...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Form */}
          <form onSubmit={handleSendMessage} className="mt-3 shrink-0 space-y-2">
            {showCodeInput && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#8150E8]" />
                    <span>Paste Code to Debug or Analyze</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Hide
                  </button>
                </div>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="// Paste your code here..."
                  rows={3}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCodeInput((prev) => !prev)}
                className={`p-3 rounded-2xl border transition-colors cursor-pointer shrink-0 ${
                  showCodeInput
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-[#8150E8] text-[#8150E8]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800'
                }`}
                title="Attach Code"
              >
                <Code2 className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={`Ask a question about ${selectedCourse?.title || 'this topic'}...`}
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isLoading}
                  className="absolute right-2 top-2 p-2 rounded-xl text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
