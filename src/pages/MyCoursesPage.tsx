import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  Play,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Course, User } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { EditCourseModal } from '../components/EditCourseModal';

interface MyCoursesPageProps {
  user: User;
  courses: Course[];
  onRefreshCourses: () => void;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
}

export const MyCoursesPage: React.FC<MyCoursesPageProps> = ({
  user,
  courses,
  onRefreshCourses,
  onLogout,
  onUserUpdated,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const categories = ['All', 'Programming', 'Database', 'Computer Science', 'Health & Fitness', 'Technology'];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' ||
      (c.category && c.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesDifficulty =
      selectedDifficulty === 'All' ||
      (c.difficulty && c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onRefreshCourses();
      }
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleSaveCourseEdits = async (title: string, description: string) => {
    if (!editingCourse) return;
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        onRefreshCourses();
        setEditingCourse(null);
      }
    } catch (err) {
      console.error('Error updating course:', err);
    }
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

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                My Learning Courses
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your personalized AI-generated curricula, track progress, and continue learning.
              </p>
            </div>
            <button
              onClick={() => navigate('/create-course')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer shrink-0"
              style={{ backgroundColor: '#8150E8' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-8 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your courses by title or topic..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0 ml-2">Level:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advance">Advanced</option>
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const totalChs = course.chapters?.length || 1;
                const completedChs = course.chapters?.filter((ch) => ch.completed).length || 0;
                const progressPct = course.progress !== undefined ? course.progress : Math.round((completedChs / totalChs) * 100);

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img
                        src={course.thumbnailUrl || '/src/assets/images/banner_sql_course_1794057965712.jpg'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/10">
                          {course.category || 'Course'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8150E8] text-white">
                          {course.difficulty || 'Beginner'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{totalChs} Chapters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{course.duration || '1 hour'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-[#8150E8] transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {course.description || 'Comprehensive step-by-step lecture sessions with targeted videos and assessments.'}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {completedChs} of {totalChs} completed
                          </span>
                          <span className="font-bold text-[#8150E8]">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: '#8150E8',
                            }}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCourse(course);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Course"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteCourse(course.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/course/${course.id}/start`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                            style={{ backgroundColor: '#8150E8' }}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Continue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {searchQuery ? 'No matching courses found' : 'No courses created yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms or filter criteria.'
                  : 'Generate your first personalized AI course from a topic or an uploaded PDF document.'}
              </p>
              <button
                onClick={() => navigate('/create-course')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Your First Course</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSave={handleSaveCourseEdits}
        />
      )}
    </div>
  );
};
