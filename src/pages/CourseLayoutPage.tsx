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
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditChapterModal } from '../components/EditChapterModal';
import { User, Course, CourseChapter, VideoRecommendation, FinalExamStatus } from '../types';

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

  // Chapter management states
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');
  const [newChapterDuration, setNewChapterDuration] = useState('25 mins');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Video switcher modal
  const [videoModalChapter, setVideoModalChapter] = useState<CourseChapter | null>(null);

  // Final Comprehensive Assessment status
  const [examStatus, setExamStatus] = useState<FinalExamStatus | null>(null);

  const fetchExamStatus = async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem('coursestudio_token') || user?.id || 'user_default_1';
      const res = await fetch(`/api/courses/${id}/final-exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExamStatus(data.status);
      }
    } catch (e) {
      console.error('Failed fetching final exam status:', e);
    }
  };

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
    fetchExamStatus();
  }, [id, user?.id]);

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

  const handleAddChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    setActionLoadingId('adding-chapter');
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChapterTitle.trim(),
          description: newChapterDesc.trim() || `Comprehensive lecture on ${newChapterTitle.trim()}.`,
          duration: newChapterDuration.trim() || '25 mins',
        }),
      });

      if (res.ok) {
        const updatedCourse = await res.json();
        setCourse(updatedCourse);
        onRefreshCourses();
        setIsAddingChapter(false);
        setNewChapterTitle('');
        setNewChapterDesc('');
      }
    } catch (err) {
      console.error('Error adding chapter:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
    if (course.chapters.length <= 1) {
      alert('A course must contain at least one lecture.');
      return;
    }
    if (!confirm(`Are you sure you want to remove "${chapterTitle}" from this course?`)) {
      return;
    }

    setActionLoadingId(chapterId);
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters/${chapterId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedCourse = await res.json();
        setCourse(updatedCourse);
        onRefreshCourses();
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRegenerateChapter = async (chapterId: string) => {
    setActionLoadingId(chapterId);
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters/${chapterId}/regenerate`, {
        method: 'POST',
      });
      if (res.ok) {
        const updatedCourse = await res.json();
        setCourse(updatedCourse);
        onRefreshCourses();
      }
    } catch (err) {
      console.error('Error regenerating chapter:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectAlternativeVideo = async (chapterId: string, video: VideoRecommendation) => {
    setActionLoadingId(`video-${chapterId}`);
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters/${chapterId}/select-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id || video.videoId,
          videoTitle: video.title,
          title: video.title,
          videoChannel: video.channel || video.channelTitle,
          channel: video.channel || video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          relevanceScore: video.relevanceScore,
          score: video.relevanceScore,
          matchReason: video.matchReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedCourse = data.course || data;
        setCourse(updatedCourse);
        onRefreshCourses();
        setVideoModalChapter(null);
      }
    } catch (err) {
      console.error('Error selecting video:', err);
    } finally {
      setActionLoadingId(null);
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lectures</h3>
              <p className="text-xs text-slate-500">
                Lectures must be completed sequentially with a 75% score on the 5-question assessment.
              </p>
            </div>

            <button
              onClick={() => setIsAddingChapter(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>

          <div className="space-y-4">
            {course.chapters.map((chapter) => (
              <div
                key={chapter.id || chapter.chapterNumber}
                className={`p-5 rounded-2xl border transition-colors ${
                  !chapter.isUnlocked
                    ? 'bg-slate-50 border-dashed border-slate-200 opacity-75'
                    : 'border-slate-200/80 hover:border-purple-200 hover:bg-purple-50/20'
                }`}
              >
                <div className="flex items-start gap-4">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
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

                      {/* Action buttons: Regenerate & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRegenerateChapter(chapter.id || String(chapter.chapterNumber))}
                          disabled={actionLoadingId === (chapter.id || String(chapter.chapterNumber))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#8150E8] bg-slate-100 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Regenerate this chapter's lecture notes and assessment"
                        >
                          <RefreshCw className={`w-3 h-3 ${actionLoadingId === (chapter.id || String(chapter.chapterNumber)) ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>

                        {course.chapters.length > 1 && (
                          <button
                            onClick={() => handleDeleteChapter(chapter.id || String(chapter.chapterNumber), chapter.title)}
                            disabled={actionLoadingId === (chapter.id || String(chapter.chapterNumber))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                      {chapter.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
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

                      {/* Video recommendation tag with Switch button */}
                      {chapter.videoId && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8150E8] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            <Video className="w-3 h-3" />
                            <span>{chapter.relevanceScore || 95}% Match</span>
                          </span>

                          <button
                            onClick={() => setVideoModalChapter(chapter)}
                            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                          >
                            Switch Video
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Educational Match Rationale */}
                    {chapter.videoMatchReason && (
                      <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[11px] text-slate-600 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#8150E8] shrink-0 mt-0.5" />
                        <span>
                          <strong>Recommendation Match Factor:</strong> {chapter.videoMatchReason}
                        </span>
                      </div>
                    )}
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
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate(`/course/${course.id}/start`)}
              className="inline-flex items-center gap-2 px-8 py-3 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ backgroundColor: '#8150E8' }}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Learning</span>
            </button>
          </div>
        </div>

        {/* Final Comprehensive Assessment Card (Requirement 4) */}
        <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  examStatus?.isPassed
                    ? 'bg-emerald-500 text-white'
                    : examStatus?.isUnlocked
                    ? 'bg-[#8150E8] text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                    Graduation Requirement
                  </span>

                  {examStatus?.isPassed ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                      Passed ({examStatus.bestScore}%)
                    </span>
                  ) : examStatus?.isUnlocked ? (
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                      Unlocked & Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked (Complete all lectures first)
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-slate-900">
                  Final Comprehensive Examination (15 Questions)
                </h3>

                <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
                  {examStatus?.isPassed
                    ? `You scored ${examStatus.bestScore}% on the final examination. Your official AlphaWave AI Certificate of Completion has been unlocked.`
                    : examStatus?.isUnlocked
                    ? 'All lectures are complete! Take the timed 15-question comprehensive assessment (70% passing threshold) to earn your verified certificate.'
                    : `Complete all ${course.chapters.length} lectures and pass each 5-question lecture assessment (≥75%) to unlock the final examination.`}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    20 Minutes
                  </span>
                  <span>·</span>
                  <span>15 Questions (All Chapters)</span>
                  <span>·</span>
                  <span>Passing Score: 70%</span>
                  {examStatus?.attemptsCount ? (
                    <>
                      <span>·</span>
                      <span className="text-purple-700 font-bold">Attempts: {examStatus.attemptsCount}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {examStatus?.isPassed ? (
                <>
                  <button
                    onClick={() => navigate('/certificates')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <Award className="w-4 h-4" />
                    <span>View Certificate</span>
                  </button>

                  <button
                    onClick={() => navigate(`/course/${course.id}/final-exam`)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Review Exam</span>
                  </button>
                </>
              ) : examStatus?.isUnlocked ? (
                <button
                  onClick={() => navigate(`/course/${course.id}/final-exam`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs sm:text-sm font-black text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 cursor-pointer animate-pulse"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <Award className="w-4 h-4" />
                  <span>Take Final Examination</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/course/${course.id}/start`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>Resume Lectures</span>
                </button>
              )}
            </div>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl border transition-colors shrink-0 shadow-2xs cursor-pointer"
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

      {/* Add Chapter Modal */}
      {isAddingChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Lecture to Course</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new curriculum topic. AlphaWave will attach concept-specific notes and educational video.
            </p>

            <form onSubmit={handleAddChapterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lecture Title</label>
                <input
                  type="text"
                  required
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. Memory Layout & Pointer Arithmetic in C"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8150E8]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Learning Description</label>
                <textarea
                  rows={3}
                  value={newChapterDesc}
                  onChange={(e) => setNewChapterDesc(e.target.value)}
                  placeholder="What key definitions and coding techniques are covered?"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8150E8]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={newChapterDuration}
                  onChange={(e) => setNewChapterDuration(e.target.value)}
                  placeholder="e.g. 25 mins"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8150E8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingChapter(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'adding-chapter'}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  {actionLoadingId === 'adding-chapter' ? 'Creating...' : 'Add Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Video Modal */}
      {videoModalChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Educational Video
                </h3>
                <p className="text-xs text-slate-500">
                  Switch video for: {videoModalChapter.title}
                </p>
              </div>
              <button
                onClick={() => setVideoModalChapter(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {/* Currently Selected Video */}
              <div className="p-3.5 rounded-xl border-2 border-[#8150E8] bg-purple-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Current Video
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {videoModalChapter.relevanceScore || 96}% Score
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  {videoModalChapter.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Channel: {videoModalChapter.videoChannel || 'Verified Educational Network'}
                </p>
              </div>

              {/* Alternative Videos */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  Alternative Recommended Videos (Different Instructors & Explanations)
                </h4>

                {videoModalChapter.alternativeVideos && videoModalChapter.alternativeVideos.length > 0 ? (
                  <div className="space-y-2.5">
                    {videoModalChapter.alternativeVideos.map((alt) => (
                      <div
                        key={alt.id || alt.videoId}
                        className="p-3 rounded-xl border border-slate-200 hover:border-purple-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {alt.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{alt.channel || alt.channelTitle}</span>
                            <span>·</span>
                            <span className="font-semibold text-emerald-600">
                              {alt.relevanceScore}% Match
                            </span>
                          </div>
                          {alt.matchReason && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                              {alt.matchReason}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleSelectAlternativeVideo(videoModalChapter.id || String(videoModalChapter.chapterNumber), alt)}
                          disabled={actionLoadingId === `video-${videoModalChapter.id || videoModalChapter.chapterNumber}`}
                          className="px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                          style={{ backgroundColor: '#8150E8' }}
                        >
                          Use Video
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 text-center">
                    No alternative videos cached for this lecture yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

