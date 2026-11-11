import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck,
  Eye,
  X,
  FileCheck,
} from 'lucide-react';
import { User, Course, PlatformAdminStats } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface AdminDashboardPageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
}

interface UserWithCourses {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  coursesCreated: number;
  courses: Array<{
    id: string;
    title: string;
    category?: string;
    createdAt?: string;
    chapterCount?: number;
    completedCount?: number;
    status?: string;
  }>;
}

interface CourseWithCreator {
  id: string;
  title: string;
  category?: string;
  createdAt?: string;
  creatorId?: string;
  creatorName?: string;
  creatorEmail?: string;
  chapterCount?: number;
  completedCount?: number;
  status?: string;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  courses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<PlatformAdminStats | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserWithCourses[]>([]);
  const [allCourses, setAllCourses] = useState<CourseWithCreator[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithCourses | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'activity'>('users');

  const fetchAdminStats = async () => {
    setLoading(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        // Unauthorized access: strictly redirect to dashboard
        navigate('/dashboard', { replace: true });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRegisteredUsers(data.users || []);
        setAllCourses(data.courses || []);
        setSystemStatus(data.systemStatus || null);
      }
    } catch (err) {
      console.warn('Failed fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user is not admin, redirect immediately
    if (!user.isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchAdminStats();
  }, [user]);

  const filteredUsers = registeredUsers.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredCourses = allCourses.filter(
    (c) =>
      (c.title && c.title.toLowerCase().includes(courseSearch.toLowerCase())) ||
      (c.creatorName && c.creatorName.toLowerCase().includes(courseSearch.toLowerCase())) ||
      (c.creatorEmail && c.creatorEmail.toLowerCase().includes(courseSearch.toLowerCase()))
  );

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#8150E8] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Developer Administrator Console (Exclusive Access)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Platform Management & System Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage registered users, inspect course activity by user, monitor platform health, and review certificates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAdminStats}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-50 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8150E8]' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gemini AI Engine</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {systemStatus?.geminiConnected ? 'Connected & Active' : 'Fallback Engine Ready'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${systemStatus?.geminiConnected ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Admin Auth Authorization</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                  ADMIN_EMAIL Verified
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Database & Storage</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                  Isolated User Data Store
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* 5 Core Required KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                {stats?.totalUsers || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Registered accounts</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Courses</span>
                <BookOpen className="w-4 h-4 text-[#8150E8]" />
              </div>
              <p className="text-2xl font-black text-[#8150E8] mt-2">
                {stats?.totalCourses || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Across all users</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Courses</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {stats?.activeCourses || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Currently in learning</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {stats?.completedCourses || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">100% finished</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Certificates</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                {stats?.totalCertificates || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Official awards issued</span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#8150E8] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              User Management ({registeredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-[#8150E8] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              All Created Courses ({allCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-[#8150E8] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              Platform Activity Feed
            </button>
          </div>

          {/* TAB 1: User Management & Individual Activity Inspection */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    User Accounts & Course Activity Inspection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select any user to inspect their courses, progress, and creation timestamps.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-3 pr-4">User</th>
                      <th className="py-3 px-3">Courses Created</th>
                      <th className="py-3 px-3">Registered Date</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No users match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#8150E8] font-bold flex items-center justify-center text-xs">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {u.courses?.length ?? u.coursesCreated ?? 0} courses
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {u.role || 'Learner'}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#8150E8] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Courses</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: All Created Courses (Global View with Creator Info) */}
          {activeTab === 'courses' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    All Courses Across Platform
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Identifies which user created each course, creation date, and learning status.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search by course title or creator..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-3 pr-4">Course Title</th>
                      <th className="py-3 px-3">Created By</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Chapters</th>
                      <th className="py-3 px-3">Created Date</th>
                      <th className="py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No courses found.
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 pr-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{c.title}</p>
                            <span className="text-[10px] text-slate-400">ID: {c.id.slice(0, 10)}...</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-200">{c.creatorName || 'Unknown User'}</p>
                            <p className="text-[11px] text-slate-400">{c.creatorEmail || 'No email'}</p>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-[#8150E8]">
                              {c.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {c.chapterCount || 0} chapters
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {c.status === 'completed' ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Platform Activity & Updates Feed */}
          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Real-Time Application Activity Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                System events, course generations, certificate issuances, and user registrations.
              </p>

              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#8150E8]" />
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {act.title}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4">
                          {act.detail}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-12 text-center">No recent activity recorded.</p>
              )}
            </div>
          )}

          {/* Selected User Course Inspection Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8150E8]/10 text-[#8150E8] font-black flex items-center justify-center text-sm">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {selectedUser.name}'s Courses
                      </h3>
                      <p className="text-xs text-slate-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 overflow-y-auto flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Total Courses Created: <strong className="text-slate-900 dark:text-slate-100">{selectedUser.courses?.length || 0}</strong></span>
                    <span>Account Created: <strong className="text-slate-900 dark:text-slate-100">{new Date(selectedUser.createdAt).toLocaleDateString()}</strong></span>
                  </div>

                  {(!selectedUser.courses || selectedUser.courses.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      This user has not created any courses yet.
                    </div>
                  ) : (
                    selectedUser.courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {course.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span>{course.category || 'General'}</span>
                            <span>•</span>
                            <span>{course.chapterCount || 0} chapters</span>
                            <span>•</span>
                            <span>Created {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Recently'}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            course.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {course.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
