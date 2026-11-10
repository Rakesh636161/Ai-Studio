import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit3,
  Clock,
  BookOpen,
  Video,
  Gauge,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Sparkles,
  ArrowLeft,
  Lock,
  FileText,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditChapterModal } from '../components/EditChapterModal';
import { User, Course, CourseChapter } from '../types';

interface CourseLayoutPageProps {
  user: User | null;
  onRefreshCourses: () => void;
}

export const CourseLayoutPage: React.FC<CourseLayoutPageProps> = ({
  user,
  onRefreshCourses,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingChapter, setEditingChapter] = useState<CourseChapter | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCourse = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Loading Course Layout...</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs"
            style={{ backgroundColor: '#8150E8' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const shareableUrl = `${window.location.origin}/course/${course.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCourse = async (title: string, description: string) => {
    const token = localStorage.getItem('coursestudio_token') || 'user_default_1';
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourse(updated);
        onRefreshCourses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChapter = async (chapterNumber: number, title: string, description: string) => {
    const token = localStorage.getItem('coursestudio_token') || 'user_default_1';
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters/${chapterNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        fetchCourse();
        onRefreshCourses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Back navigation & Page title */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Course Layout Ready
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-8">
          Course Layout
        </h1>

        {/* Top Course Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {course.title}
                </h2>
                <button
                  onClick={() => setIsEditingCourse(true)}
                  className="p-1.5 text-slate-400 hover:text-[#8150E8] rounded-lg hover:bg-purple-50 transition-colors shrink-0"
                  title="Edit title & description"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {course.description}
              </p>

              {/* PDF Banner notice if applicable */}
              {course.pdfSources && course.pdfSources.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900">
                  <FileText className="w-4 h-4 text-[#8150E8] shrink-0" />
                  <span>
                    Evaluated from {course.pdfSources.length} syllabus PDF(s). Focused strictly on uploaded module topics.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{course.category}</span>
                </span>

                <button
                  onClick={() => navigate(`/course/${course.id}/start`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all hover:opacity-95 active:scale-95"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Learning</span>
                </button>
              </div>
            </div>

            <div className="w-full lg:w-72 shrink-0 aspect-16/9 rounded-xl overflow-hidden shadow-xs border border-slate-200 relative group bg-slate-900">
              <img
                src={course.thumbnailUrl || '/src/assets/images/banner_sql_course_1794057965712.jpg'}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>
          </div>
        </div>

        {/* 4 Stat Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8150E8] flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Skill Level
              </span>
              <span className="text-sm font-bold text-slate-900">{course.difficulty}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Duration
              </span>
              <span className="text-sm font-bold text-slate-900">{course.duration}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                No Of Chapters
              </span>
              <span className="text-sm font-bold text-slate-900">{course.chapters.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Video Included?
              </span>
              <span className="text-sm font-bold text-slate-900">{course.includeVideo ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Chapters Section with Lecture Progression & Lock Status */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lectures</h3>
              <p className="text-xs text-slate-500">
                Lectures must be completed sequentially with a 75% score on the 5-question assessment.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {course.chapters.map((chapter) => (
              <div
                key={chapter.chapterNumber}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${
                  !chapter.isUnlocked
                    ? 'bg-slate-50 border-dashed border-slate-200 opacity-75'
                    : 'border-slate-200/80 hover:border-purple-200 hover:bg-purple-50/20'
                }`}
              >
                {/* Purple circular badge or Lock icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                    !chapter.isUnlocked
                      ? 'bg-slate-200 text-slate-600'
                      : 'text-white'
                  }`}
                  style={chapter.isUnlocked ? { backgroundColor: '#8150E8' } : {}}
                >
                  {!chapter.isUnlocked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : (
                    chapter.chapterNumber
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {chapter.title}
                    </h4>
                    {chapter.isUnlocked && (
                      <button
                        onClick={() => setEditingChapter(chapter)}
                        className="p-1 text-slate-400 hover:text-[#8150E8] transition-colors"
                        title="Edit Chapter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                    {chapter.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{chapter.duration}</span>
                    </div>

                    {!chapter.isUnlocked ? (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Locked (Pass previous lecture with 75%)
                      </span>
                    ) : chapter.completed ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Completed ({chapter.assessmentScore || 85}%)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        Unlocked & Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      chapter.completed
                        ? 'bg-emerald-500 text-white'
                        : !chapter.isUnlocked
                        ? 'bg-slate-200 text-slate-400'
                        : 'border-2 border-slate-200 text-slate-300'
                    }`}
                  >
                    {!chapter.isUnlocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate(`/course/${course.id}/start`)}
              className="inline-flex items-center gap-2 px-8 py-3 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95"
              style={{ backgroundColor: '#8150E8' }}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Learning</span>
            </button>
          </div>
        </div>

        {/* Shareable Course URL Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Course URL:
            </span>
            <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 break-all select-all">
              {shareableUrl}
            </div>
          </div>

          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl border transition-colors shrink-0 shadow-2xs"
            style={{
              borderColor: copied ? '#10B981' : '#8150E8',
              color: copied ? '#10B981' : '#8150E8',
              backgroundColor: copied ? '#ECFDF5' : '#FAF7FF',
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
          </button>
        </div>
      </main>

      <EditCourseModal
        isOpen={isEditingCourse}
        initialTitle={course.title}
        initialDescription={course.description}
        onClose={() => setIsEditingCourse(false)}
        onSave={handleSaveCourse}
      />

      <EditChapterModal
        isOpen={!!editingChapter}
        chapter={editingChapter}
        onClose={() => setEditingChapter(null)}
        onSave={handleSaveChapter}
      />
    </div>
  );
};
