import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Flame,
  Calendar,
  BarChart3,
  Play,
  ArrowRight,
} from 'lucide-react';
import { Course, User, UserProgressSummary } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface LearningProgressPageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
}

export const LearningProgressPage: React.FC<LearningProgressPageProps> = ({
  user,
  courses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<UserProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      try {
        const res = await fetch('/api/progress/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
        }
      } catch (err) {
        console.warn('Failed loading progress summary:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const totalLearningHours = summary
    ? Math.floor(summary.totalLearningMinutes / 60)
    : 0;
  const remainingMins = summary ? summary.totalLearningMinutes % 60 : 0;

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

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Learning Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personalized analytics tracking your curriculum progression, quiz mastery, and daily study consistency.
            </p>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Stat 1: Completed Courses */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Courses</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {summary ? `${summary.completedCourses} / ${summary.totalCourses}` : '0 / 0'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary?.inProgressCourses || 0} currently in progress
              </p>
            </div>

            {/* Stat 2: Chapters Finished */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Lectures Passed</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {summary ? `${summary.completedChapters} / ${summary.totalChapters}` : '0 / 0'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary && summary.totalChapters > 0
                  ? `${Math.round((summary.completedChapters / summary.totalChapters) * 100)}% overall completion`
                  : '0% completed'}
              </p>
            </div>

            {/* Stat 3: Total Learning Time */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Study Time</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {totalLearningHours > 0 ? `${totalLearningHours}h ${remainingMins}m` : `${remainingMins} mins`}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Based on completed lecture sessions
              </p>
            </div>

            {/* Stat 4: Quiz Mastery & Streak */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Quiz Score</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {summary?.overallScoreAverage || 85}%
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>{summary?.currentStreakDays || 1}-day active streak!</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Weekly Study Activity & Streaks */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Weekly Study Activity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Minutes spent studying per day over the last 7 days
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>This Week</span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                {(summary?.weeklyActivity || [
                  { day: 'Mon', minutes: 25 },
                  { day: 'Tue', minutes: 50 },
                  { day: 'Wed', minutes: 25 },
                  { day: 'Thu', minutes: 0 },
                  { day: 'Fri', minutes: 75 },
                  { day: 'Sat', minutes: 50 },
                  { day: 'Sun', minutes: 25 },
                ]).map((item, idx) => {
                  const maxMins = 80;
                  const heightPct = Math.min(100, Math.max(10, (item.minutes / maxMins) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.minutes}m
                      </div>
                      <div
                        className="w-full rounded-t-xl transition-all duration-300 group-hover:opacity-90 cursor-pointer"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: item.minutes > 0 ? '#8150E8' : '#E2E8F0',
                        }}
                      />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-4">
                <span>Total Weekly Commitment</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {summary ? `${Math.round(summary.totalLearningMinutes / 60)} hours completed` : '3 hours completed'}
                </span>
              </div>
            </div>

            {/* Right 5 Cols: Course-by-Course Progress Breakdown */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Curriculum Progression
              </h3>

              {courses.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {courses.map((course) => {
                    const totalChs = course.chapters?.length || 1;
                    const completedChs = course.chapters?.filter((ch) => ch.completed).length || 0;
                    const pct = course.progress !== undefined ? course.progress : Math.round((completedChs / totalChs) * 100);

                    return (
                      <div
                        key={course.id}
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/40 bg-slate-50/50 dark:bg-slate-800/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                            {course.title}
                          </h4>
                          <span className="text-xs font-extrabold text-[#8150E8] shrink-0">
                            {pct}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: '#8150E8' }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{completedChs} of {totalChs} lectures completed</span>
                          <span className="text-[#8150E8] font-semibold flex items-center gap-0.5">
                            Resume <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No courses enrolled yet. Generate a course to begin tracking.
                </p>
              )}

              <button
                onClick={() => navigate('/certificates')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#8150E8] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200/80 dark:border-purple-800/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>View Course Certificates Eligibility</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
