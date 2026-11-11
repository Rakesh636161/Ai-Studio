import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, MoreVertical, Play, Eye, Trash2, Edit3, Sparkles, Code2, HeartPulse, Palette, Briefcase, Cpu, Lock, Camera, FileText, CheckCircle2, ExternalLink, X, Video, Award } from 'lucide-react';
import { Course, User, PDFDocument } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditProfileModal } from '../components/EditProfileModal';

interface DashboardPageProps {
  user: User;
  courses: Course[];
  onRefreshCourses: () => void;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  courses,
  onRefreshCourses,
  onLogout,
  onUserUpdated,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 5 Distinct database-backed stats
  const [dashboardStats, setDashboardStats] = useState<{
    totalCreated: number;
    totalEnrolled: number;
    totalCompleted: number;
    totalInProgress: number;
    totalCertificates: number;
  }>({
    totalCreated: courses.length,
    totalEnrolled: courses.length,
    totalCompleted: 0,
    totalInProgress: courses.length > 0 ? 1 : 0,
    totalCertificates: 0,
  });

  // Tab: 'courses' | 'pdfs'
  const [activeTab, setActiveTab] = useState<'courses' | 'pdfs'>('courses');
  const [pdfDocuments, setPdfDocuments] = useState<PDFDocument[]>([]);
  const [selectedPdfModal, setSelectedPdfModal] = useState<PDFDocument | null>(null);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);

  const fetchStats = async () => {
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch('/api/courses/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.warn('Could not fetch dashboard stats:', err);
    }
  };

  const fetchPdfDocuments = async () => {
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch('/api/pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPdfDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn('Could not fetch PDFs:', err);
    }
  };

  // Fetch courses, stats, and PDFs on mount
  useEffect(() => {
    onRefreshCourses();
    fetchStats();
    fetchPdfDocuments();
  }, []);

  const handleConvertPdfToCourse = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConvertingPdf(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch(`/api/pdf/${docId}/create-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to convert PDF to course');
      const data = await res.json();
      onRefreshCourses();
      navigate(`/course/${data.course.id}`);
    } catch (err: any) {
      alert(err.message || 'Error converting PDF');
    } finally {
      setIsConvertingPdf(false);
    }
  };

  const handleDeletePdf = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this PDF document?')) return;
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      await fetch(`/api/pdf/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPdfDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-500" />;
      case 'creative':
        return <Palette className="w-3.5 h-3.5 text-amber-500" />;
      case 'business':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-500" />;
      case 'technology':
        return <Cpu className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Code2 className="w-3.5 h-3.5 text-[#8150E8]" />;
    }
  };

  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const promptDeleteCourse = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setCourseToDelete(course);
  };

  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeletingCourse(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onRefreshCourses();
        fetchStats();
        setCourseToDelete(null);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to delete course');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handleEditCourse = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setEditingCourse(course);
  };

  const handleSaveCourseEdits = async (title: string, description: string) => {
    if (editingCourse) {
      const token = localStorage.getItem('coursestudio_token') || user.id;
      try {
        await fetch(`/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description }),
        });
        onRefreshCourses();
        setEditingCourse(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <Sidebar
        courses={courses}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Navbar
          user={user}
          onMenuToggle={() => setSidebarOpen(true)}
          showCreateButton={false}
          onEditProfile={() => setIsProfileModalOpen(true)}
        />

        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">
          {/* Header Row: Greeting with Photo & + Create AI Course button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => setIsProfileModalOpen(true)}
                title="Click to Change Photo"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-sm transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Hello, <span style={{ color: '#8150E8' }}>{user.name}</span>
                  </h1>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="text-xs text-[#8150E8] hover:text-[#6a3ec9] underline font-semibold transition-colors"
                  >
                    Change Photo
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Create new courses from topics or syllabus PDFs with locked lecture progression.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/video-analysis')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#8150E8] bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Video className="w-4 h-4 text-[#8150E8]" />
                <span>Video Analyzer</span>
              </button>

              <button
                onClick={() => navigate('/create-course')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all hover:opacity-95 active:scale-95 shrink-0 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Create AI Course</span>
              </button>
            </div>
          </div>

          {/* Dashboard Tab Selector */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-[#8150E8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My AI Courses ({courses.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pdfs');
                fetchPdfDocuments();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdfs'
                  ? 'bg-[#8150E8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Learning & Syllabus ({pdfDocuments.length})</span>
            </button>

            <button
              onClick={() => navigate('/video-analysis')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60 ml-auto transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-[#8150E8]" />
              <span className="hidden sm:inline">Analyze Video Lecture</span>
              <span className="sm:hidden">Analyze</span>
            </button>
          </div>

          {activeTab === 'courses' && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                My AI Courses
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} in studio
              </span>
            </div>
          )}

          {/* Courses Grid */}
          {activeTab === 'courses' && (
            <>
              {courses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#8150E8] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No AI courses created yet
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Generate your first course with custom video lessons, notebook written assessments, and locked sequential chapters.
              </p>
              <button
                onClick={() => navigate('/create-course')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Your First Course</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const completedCount = course.chapters?.filter(c => c.completed)?.length || 0;
                const totalChapters = course.chapters?.length || course.noOfChapters || 5;

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer relative"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={course.thumbnailUrl || '/src/assets/images/banner_sql_course_1794057965712.jpg'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* PDF badge if generated from PDF */}
                      {course.pdfSources && course.pdfSources.length > 0 && (
                        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/80 text-white backdrop-blur-xs border border-purple-400/40">
                          PDF Syllabus Evaluated
                        </span>
                      )}

                      {/* Three-dot menu button */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === course.id ? null : course.id);
                          }}
                          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
                          aria-label="Course Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === course.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95"
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/course/${course.id}`);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#8150E8] transition-colors text-left"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Course Layout</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/course/${course.id}/start`);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#8150E8] transition-colors text-left"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Learning</span>
                            </button>

                            <button
                              onClick={(e) => handleEditCourse(course, e)}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={(e) => promptDeleteCourse(course, e)}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Course</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#8150E8] transition-colors line-clamp-1 mb-2">
                          {course.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          {getCategoryIcon(course.category)}
                          <span className="font-medium">{course.category}</span>
                        </div>
                      </div>

                      <div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                          <div
                            className="bg-[#8150E8] h-full rounded-full transition-all duration-300"
                            style={{ width: `${(completedCount / totalChapters) * 100}%` }}
                          />
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span>{completedCount}/{totalChapters} Lectures</span>
                          </div>

                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            {course.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: PDF DOCUMENTS & SYLLABUS GRID (Modules 3, 4, 6) */}
      {activeTab === 'pdfs' && (
        <>
          {pdfDocuments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#8150E8] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No PDF Documents Uploaded
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Upload syllabus, exam study notes, or module PDFs. Gemini AI extracts concepts, objectives, and matches verified educational video lectures.
              </p>
              <button
                onClick={() => navigate('/create-course')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Upload Syllabus PDF</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-[#8150E8]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-sm text-slate-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {(doc.fileSize / 1024).toFixed(1)} KB · {doc.pageCount || 1} Pages {doc.isScanned && '· Scanned'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeletePdf(doc.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Delete PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {doc.summary || 'PDF document parsed and ready for structured AI learning.'}
                    </p>

                    {/* Main topics tags */}
                    {doc.mainTopics && doc.mainTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {doc.mainTopics.slice(0, 3).map((topic, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md font-medium truncate max-w-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPdfModal(doc)}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      View Breakdown
                    </button>

                    <button
                      type="button"
                      disabled={isConvertingPdf}
                      onClick={(e) => handleConvertPdfToCourse(doc.id, e)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: '#8150E8' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Course</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>

    {/* PDF Analysis Modal */}
    {selectedPdfModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#8150E8] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPdfModal.fileName}</h3>
                <p className="text-xs text-slate-500">
                  Difficulty: <span className="font-semibold text-purple-700">{selectedPdfModal.difficultyLevel || 'Intermediate'}</span> · {selectedPdfModal.pageCount || 1} Pages
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPdfModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {/* Executive Summary */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">Executive Summary</h4>
              <p className="leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedPdfModal.summary || 'Summary generated for this document.'}
              </p>
            </div>

            {/* Learning Objectives */}
            {selectedPdfModal.learningObjectives && selectedPdfModal.learningObjectives.length > 0 && (
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Learning Objectives</h4>
                <div className="space-y-1.5">
                  {selectedPdfModal.learningObjectives.map((obj, oIdx) => (
                    <div key={oIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Concepts */}
            {selectedPdfModal.importantConcepts && selectedPdfModal.importantConcepts.length > 0 && (
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Key Important Concepts</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {selectedPdfModal.importantConcepts.map((c, cIdx) => (
                    <div key={cIdx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{c.concept}</span>
                        {c.page && <span className="text-[10px] text-purple-700 font-semibold">Page {c.page}</span>}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Educational Videos */}
            {selectedPdfModal.recommendedVideos && selectedPdfModal.recommendedVideos.length > 0 && (
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Matched Educational Video Lectures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPdfModal.recommendedVideos.map((v, vIdx) => (
                    <div key={vIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-purple-700">{v.channel}</span>
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                            {v.relevanceScore}% match
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 line-clamp-2">{v.title}</p>
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-[11px] font-bold text-[#8150E8] hover:underline flex items-center gap-1"
                      >
                        <span>Watch on YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedPdfModal(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Close
            </button>

            <button
              type="button"
              onClick={(e) => {
                const id = selectedPdfModal.id;
                setSelectedPdfModal(null);
                handleConvertPdfToCourse(id, e);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95"
              style={{ backgroundColor: '#8150E8' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Interactive Course Now</span>
            </button>
          </div>
        </div>
      </div>
    )}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditCourseModal
          isOpen={true}
          initialTitle={editingCourse.title}
          initialDescription={editingCourse.description}
          onClose={() => setEditingCourse(null)}
          onSave={handleSaveCourseEdits}
        />
      )}

      {/* Edit Profile & Photo Modal */}
      {isProfileModalOpen && (
        <EditProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUserUpdated={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      )}

      {/* Delete Course Confirmation Dialog */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Delete Course?
            </h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-slate-800">"{courseToDelete.title}"</strong>? All associated chapter progress, video selections, study notes, and quizzes will be removed. This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeletingCourse}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isDeletingCourse ? 'Deleting...' : 'Yes, Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
