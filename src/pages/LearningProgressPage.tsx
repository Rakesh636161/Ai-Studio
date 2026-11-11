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
  const [stats, setStats] = useState<{
    totalCreated: number;
    totalEnrolled: number;
    totalCompleted: number;
    totalInProgress: number;
    totalCertificates: number;
  }>({
    totalCreated: courses.length,
    totalEnrolled: courses.length,
    totalCompleted: 0,
    totalInProgress: 0,
    totalCertificates: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      try {
        const [sumRes, statsRes, enrolledRes] = await Promise.all([
          fetch('/api/progress/summary', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/courses/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/courses/enrolled', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (sumRes.ok) {
          const data = await sumRes.json();
          setSummary(data.summary);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
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

          {/* Dedicated Course Statistics Overview (Requirement 4 & 5) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalCreated}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Created by you</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalEnrolled}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Active enrollments</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalInProgress}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Currently studying</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalCompleted}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">100% finished</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalCertificates}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Earned credentials</p>
            </div>
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

              {enrolledCourses.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {enrolledCourses.map((course) => {
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

          {/* Section: Final Comprehensive Examination & Graduation Status */}
          <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Graduation & Final Comprehensive Examinations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    15-question comprehensive assessment per course (70% passing threshold required for academic certificates).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200">
                  {summary?.finalExamStats?.totalPassedExams || 0} Passed
                </span>
                <span className="text-xs text-slate-400">
                  ({summary?.finalExamStats?.totalAttempts || 0} total attempts)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {enrolledCourses.map((course) => {
                const totalChs = course.chapters?.length || 1;
                const completedChs = course.chapters?.filter((ch) => ch.completed).length || 0;
                const isChaptersDone = completedChs >= totalChs;

                return (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                          {course.category}
                        </span>
                        {isChaptersDone ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Exam Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {completedChs}/{totalChs} Lectures
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">
                        {course.title}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700 flex items-center justify-between mt-3">
                      <span className="text-[11px] text-slate-500">
                        {isChaptersDone ? 'Ready for 15-Q exam' : 'Complete all lectures to unlock'}
                      </span>
                      <button
                        onClick={() => navigate(isChaptersDone ? `/course/${course.id}/final-exam` : `/course/${course.id}/start`)}
                        className="text-xs font-bold text-[#8150E8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isChaptersDone ? 'Take Exam' : 'Resume'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Recent Learning Activity Feed */}
          {summary?.recentActivities && summary.recentActivities.length > 0 && (
            <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
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
