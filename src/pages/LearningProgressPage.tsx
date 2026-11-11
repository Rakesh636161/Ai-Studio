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
  Play,
  ArrowRight,
  Activity,
  ShieldCheck,
  Video,
  Sparkles,
  BookMarked,
} from 'lucide-react';
import { Course, User, UserProgressSummary, LearningActivityRecord } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface ExtendedUserProgressSummary extends UserProgressSummary {
  recentActivities?: LearningActivityRecord[];
  finalExamStats?: {
    totalPassedExams: number;
    totalAttempts: number;
  };
}

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
  const [summary, setSummary] = useState<ExtendedUserProgressSummary | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(courses);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      try {
        const [sumRes, enrolledRes] = await Promise.all([
          fetch('/api/progress/summary', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/courses/enrolled', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (sumRes.ok) {
          const data = await sumRes.json();
          setSummary(data.summary);
        }
        if (enrolledRes.ok) {
          const enrolledData = await enrolledRes.json();
          if (Array.isArray(enrolledData)) {
            setEnrolledCourses(enrolledData);
          }
        }
      } catch (err) {
        console.warn('Failed loading progress data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Sync with courses prop if enrolled courses is empty but prop has courses
  const displayCourses = enrolledCourses.length > 0 ? enrolledCourses : courses;

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
            <div className="flex items-center gap-2 text-xs font-bold text-[#8150E8] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Personal Learning Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Learning Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track course completion, chapter mastery, quiz performance, and study time across all your courses.
            </p>
          </div>

          {/* Unified, Non-Duplicated Clean Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Stat 1: Total Courses */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">My Courses</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {displayCourses.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary?.completedCourses || 0} completed · {summary?.inProgressCourses || displayCourses.length} active
              </p>
            </div>

            {/* Stat 2: Chapters & Lectures Passed */}
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
                Time spent studying course content
              </p>
            </div>

            {/* Stat 4: Quiz Mastery & Active Streak */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Quiz Mastery</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {summary?.overallScoreAverage || 85}%
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>{summary?.currentStreakDays || 1}-day active study streak</span>
              </p>
            </div>
          </div>

          {/* Individual Course-by-Course Learning Progress Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Course Learning Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed progress metrics, remaining chapters, and quiz results for each course.
                </p>
              </div>

              <button
                onClick={() => navigate('/create-course')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8150E8] hover:bg-[#7040D6] shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New AI Course</span>
              </button>
            </div>

            {displayCourses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-[#8150E8] flex items-center justify-center mx-auto mb-4">
                  <BookMarked className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  No courses enrolled or created yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                  Generate your first personalized AI course or explore our curriculum catalog to start learning.
                </p>
                <button
                  onClick={() => navigate('/create-course')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8150E8] hover:bg-[#7040D6] shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Your First Course</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayCourses.map((course) => {
                  const totalChs = course.chapters?.length || 1;
                  const completedChs = course.chapters?.filter((ch) => ch.completed).length || 0;
                  const remainingChs = Math.max(0, totalChs - completedChs);
                  const pct = course.progress !== undefined ? course.progress : Math.round((completedChs / totalChs) * 100);
                  const isDone = pct === 100 || completedChs >= totalChs;

                  return (
                    <div
                      key={course.id}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#FAFAFC] dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8150E8] bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-md">
                              {course.category || 'General'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              Level: {course.difficulty || 'All Levels'}
                            </span>
                            {isDone ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200">
                                Completed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200">
                                In Progress
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                            {course.title}
                          </h3>

                          {course.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>

                        {/* Progress Bar & Stats */}
                        <div className="lg:w-80 shrink-0">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {completedChs} of {totalChs} chapters ({remainingChs} remaining)
                            </span>
                            <span className="font-extrabold text-[#8150E8]">
                              {pct}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: '#8150E8' }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                            <span>Quiz Mastery: <strong className="text-slate-700 dark:text-slate-300">85%+</strong></span>
                            <button
                              onClick={() => navigate(isDone ? `/course/${course.id}/final-exam` : `/course/${course.id}/start`)}
                              className="font-bold text-[#8150E8] hover:text-[#7040D6] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isDone ? 'Take Final Exam' : 'Continue Course'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            {/* Left 7 Cols: Weekly Study Activity Bar Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Weekly Study Activity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Minutes dedicated to active lectures over the last 7 days
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

            {/* Right 5 Cols: Final Exam & Certificate Readiness */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Certificate Readiness
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Academic graduation certificates issued upon passing final exams
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-purple-900 dark:text-purple-200">Final Exams Passed</span>
                    <span className="font-black text-[#8150E8]">{summary?.finalExamStats?.totalPassedExams || 0}</span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Pass the 15-question comprehensive assessment (70% score) to unlock your verified credential.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/certificates')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#8150E8] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200/80 dark:border-purple-800/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>View My Earned Certificates</span>
              </button>
            </div>
          </div>

          {/* Section: Recent Learning Activity Feed */}
          {summary?.recentActivities && summary.recentActivities.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Activity className="w-5 h-5 text-[#8150E8]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Recent Verified Learning Activity
                </h3>
              </div>

              <div className="space-y-3">
                {summary.recentActivities.slice(0, 8).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center shrink-0">
                        {act.type === 'video_watched' ? (
                          <Video className="w-4 h-4" />
                        ) : act.type === 'final_exam_passed' ? (
                          <Award className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {act.detail} {act.score ? `· Score: ${act.score}%` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
