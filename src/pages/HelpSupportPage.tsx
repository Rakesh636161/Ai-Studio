import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Key,
  Mail,
  Send,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { User, Course } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface HelpSupportPageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
}

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({
  user,
  courses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How does AlphaWave AI generate courses?',
      a: 'When you submit a topic or course title, Google Gemini analyzes the subject and constructs a progressive, modular curriculum with ordered chapters, study notes, key definitions, and practice questions. Programming courses (like C) strictly adhere to standard language syntax without mixing in object-oriented concepts from other languages.',
    },
    {
      q: 'How does the chapter-wise video recommendation engine work?',
      a: 'AlphaWave AI operates on a strict rule: One Chapter = One Specific Concept. Rather than searching using just the broad course title, each chapter generates independent search queries tailored to its distinct learning objective (e.g. Day 1: Introduction, Day 2: Variables & Types, Day 3: Data Handling, Day 4: Functions & Logic, Day 5: Capstone). Videos are scored based on educational quality, duration suitability, and concept relevance.',
    },
    {
      q: 'How does the locked progression and assessment system work?',
      a: 'To encourage true mastery, lecture sessions remain locked until you pass the preceding chapter\'s 5-question assessment with a score of 75% or higher. Once passed, the next lecture unlocks automatically, and explanations for all questions are revealed.',
    },
    {
      q: 'How does PDF to Course conversion work?',
      a: 'When you upload a PDF document (up to 20MB), AlphaWave extracts multi-page text, identifies key topics and concepts, generates study notes, and queries YouTube for specific video lessons mapped directly to the extracted content.',
    },
    {
      q: 'How do I earn an official course certificate?',
      a: 'Once you finish all chapters in a course and achieve passing scores on all assessments, you become eligible for an official AlphaWave AI Course Certificate. You can claim it instantly in the Certificates tab, print/download it as a PDF, or verify it using its unique ID.',
    },
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setFeedbackSubject('');
      setFeedbackMessage('');
    }, 1000);
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

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Navbar
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfileModal={() => navigate('/profile')}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Help & Support Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find answers to frequently asked questions, learn about API credentials, or contact the academic support team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Frequently Asked Questions
              </h2>

              {faqs.map((faq, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors"
                  >
                    <button
                      onClick={() => setExpandedIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-3 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#8150E8] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* API Configuration Guide Box */}
              <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40 rounded-2xl p-5 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8150E8] mb-2">
                  <Key className="w-4 h-4" />
                  <span>Configuring Environment Variables</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  AlphaWave AI includes server-side proxies and resilient domain fallbacks. To connect your personal live production API keys, configure these environment variables in your server environment:
                </p>
                <div className="mt-3 bg-white dark:bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-purple-200/50 space-y-1">
                  <p>GEMINI_API_KEY=your_gemini_api_key</p>
                  <p>YOUTUBE_API_KEY=your_youtube_data_v3_key</p>
                  <p>RESEND_API_KEY=your_resend_api_key</p>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Support Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Contact Academic Support
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Encountering an issue or have a feature suggestion? Send a message to our engineering team.
              </p>

              {submitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Message Dispatched!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Thank you for your feedback. Our support team will review your ticket promptly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs font-bold text-[#8150E8] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      required
                      placeholder="e.g. Course video recommendation query"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Message Details
                    </label>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Describe your inquiry, suggestion, or error in detail..."
                      className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Support Ticket</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
