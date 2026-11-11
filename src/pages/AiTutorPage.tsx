import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  User as UserIcon,
  Terminal,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { Course, User, TutorMessage } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { MarkdownView } from '../components/MarkdownView';

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
  const [selectedCourseId, setSelectedCourseId] = useState<string>('general');
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>('');
  const [explanationMode, setExplanationMode] = useState<'simple' | 'detailed' | 'practical'>('simple');
  const [questionInput, setQuestionInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialGreeting: TutorMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `Hello ${user.name}! I am your **AlphaWave AI Tutor**.\n\nYou can ask me anything naturally — whether it's programming problems (e.g., *Write a program to reverse a string in Java*), concepts like *What is Artificial Intelligence?* or *Explain DBMS*, general knowledge (e.g., *Capital of India* or *Chief Minister of Karnataka*), or doubts from your course lectures.\n\nType your question below to begin!`,
    explanationMode: 'simple',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<TutorMessage[]>([initialGreeting]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          } else {
            setMessages([initialGreeting]);
          }
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    };
    fetchHistory();
  }, [selectedCourseId]);

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      await fetch(`/api/tutor/conversations/${selectedCourseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `New chat started! What would you like to explore or ask today?`,
          explanationMode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setQuestionInput('');
      setCodeInput('');
      setShowCodeInput(false);
      textareaRef.current?.focus();
    } catch (e) {
      console.error('Error starting new chat:', e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        content: data.response || data.reply,
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
          content: `I encountered an issue processing your query: ${err.message}. Please try again!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

        <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-6 max-w-4xl mx-auto w-full">
          {/* Top Control Bar: Context and New Chat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs mb-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  AlphaWave AI Tutor
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Natural conversation, doubt solving, coding assistance & general knowledge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Optional Course Context */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedChapterTitle('');
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="general">All Topics & General</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Selector */}
              <select
                value={explanationMode}
                onChange={(e) => setExplanationMode(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="simple">Simple & Intuitive</option>
                <option value="detailed">In-Depth Academic</option>
                <option value="practical">Practical Code</option>
              </select>

              {/* New Chat Button */}
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Start a new chat conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Container */}
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

                  <div className={`space-y-1 min-w-0 max-w-full ${isUser ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-left ${
                        isUser
                          ? 'bg-[#8150E8] text-white rounded-tr-none'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <MarkdownView content={msg.content} />
                      )}

                      {/* Code Snippet attachment */}
                      {msg.codeSnippet && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                            <span>Code Snippet</span>
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
                  <span>AlphaWave AI Tutor is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Clean ChatGPT-Style Input Container */}
          <form onSubmit={handleSendMessage} className="mt-3 shrink-0 space-y-2">
            {showCodeInput && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#8150E8]" />
                    <span>Attach Code or Snippet</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
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

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs focus-within:border-[#8150E8] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
              <button
                type="button"
                onClick={() => setShowCodeInput((prev) => !prev)}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  showCodeInput
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-[#8150E8]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Attach Code"
              >
                <Terminal className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything... (e.g. Capital of India, Prime Minister of Karnataka, reverse string in Java, explain DBMS)"
                rows={1}
                className="flex-1 text-xs sm:text-sm bg-transparent border-none text-slate-800 dark:text-slate-100 focus:outline-none resize-none py-1.5 px-2"
              />

              <button
                type="submit"
                disabled={!questionInput.trim() || isLoading}
                className="p-2.5 rounded-xl bg-[#8150E8] text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
