import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layout, Sliders, ShieldCheck, Headphones, Sparkles, FileText, Lock, BookOpen } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { User } from '../types';

interface LandingPageProps {
  user: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col relative overflow-hidden">
      {/* Aesthetic Ambient Glow Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-purple-200/35 via-purple-100/15 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -right-48 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <Navbar user={user} />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center relative z-10">
        {/* Next-Generation Badge from Screenshot 1 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50/90 border border-purple-200/80 text-[#8150E8] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#8150E8]" />
          <span>Next-Generation Course Studio</span>
        </div>

        {/* Clean Hero Heading from Screenshot 1 */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 max-w-4xl leading-[1.08] mb-5">
          Course <span style={{ color: '#8150E8' }}>Studio</span>
        </h1>

        {/* Subtitle from Screenshot 1 */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Revolutionize your learning with AI-generated notes, video lessons, and handwritten answer evaluations from topics or uploaded PDF notes.
        </p>

        {/* Primary CTA Button - Get Started -> */}
        <div className="flex items-center justify-center mb-16 sm:mb-24">
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            style={{ backgroundColor: '#8150E8' }}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Feature Cards Grid Matching Screenshot 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full text-left">
          {/* Card 1: Pristine Lecture Notes */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8150E8] border border-purple-100 flex items-center justify-center mb-4">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Pristine Lecture Notes
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Structured notes with clear section headings, practical explanations, and dark syntax code blocks.
            </p>
          </div>

          {/* Card 2: Curated Video Lessons */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8150E8] border border-purple-100 flex items-center justify-center mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Curated Video Lessons
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lengthy complete tutorial masterclasses or modular video lectures matched to your chosen duration.
            </p>
          </div>

          {/* Card 3: PDF High-Yield Exam Notes */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8150E8] border border-purple-100 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              PDF High-Yield Exam Notes
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload university notes (e.g. DBMS Module 1) to extract top exam questions with step-by-step model solutions.
            </p>
          </div>

          {/* Card 4: Handwritten AI Evaluation */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8150E8] border border-purple-100 flex items-center justify-center mb-4">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Handwritten AI Evaluation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Write solutions in your physical notebook, snap a photo, and get instant multimodal AI grading and feedback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Course Studio. AI Course Generation Platform.</p>
      </footer>
    </div>
  );
};
