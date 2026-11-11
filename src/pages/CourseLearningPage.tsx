import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
  Lock,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  XCircle,
  Copy,
  Download,
  MessageSquare,
  Send,
  Video as VideoIcon,
  HelpCircle,
  Layers,
  AlertOctagon,
  Info,
  BookOpen,
} from 'lucide-react';
import { Course, CourseChapter, VideoRecommendation } from '../types';

export const CourseLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video switcher & Study notes state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [switchingVideo, setSwitchingVideo] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Embedded AI Tutor state
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorStyle, setTutorStyle] = useState<'simple' | 'detailed' | 'practical'>('simple');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorChat, setTutorChat] = useState<Array<{ sender: 'user' | 'tutor'; text: string; style?: string }>>([]);

  // Assessment State (Strictly 5 MCQs)
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

  // Result state
  const [assessmentResult, setAssessmentResult] = useState<{
    passed: boolean;
    totalScore: number;
    message: string;
    mcqResults?: any[];
  } | null>(null);

  // Fetch course from backend
  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data: Course = await res.json();
        setCourse(data);

        // Auto-select the first unlocked and uncompleted chapter
        const firstActiveIdx = data.chapters.findIndex(ch => ch.isUnlocked && !ch.completed);
        if (firstActiveIdx !== -1) {
          setSelectedChapterIndex(firstActiveIdx);
        }
      }
    } catch (e) {
      console.error('Error fetching course:', e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const currentChapter: CourseChapter | undefined = course?.chapters[selectedChapterIndex];

  // Sync assessment result if chapter was previously evaluated
  useEffect(() => {
    if (currentChapter?.assessmentSubmission) {
      setAssessmentResult({
        passed: currentChapter.assessmentSubmission.passed,
        totalScore: currentChapter.assessmentSubmission.totalScore,
        message: currentChapter.assessmentSubmission.passed
          ? `Congratulations! You scored ${currentChapter.assessmentSubmission.totalScore}%. Next lecture is UNLOCKED!`
          : `You scored ${currentChapter.assessmentSubmission.totalScore}%. A minimum score of 75% is required. Review the feedback and explanations below to retry.`,
        mcqResults: currentChapter.assessmentSubmission.mcqResults,
      });
      if (currentChapter.assessmentSubmission.mcqAnswers) {
        setMcqAnswers(currentChapter.assessmentSubmission.mcqAnswers);
      }
    } else {
      setAssessmentResult(null);
    }
  }, [selectedChapterIndex, currentChapter?.id]);

  const handleSelectVideo = async (video: VideoRecommendation) => {
    if (!course || !currentChapter) return;
    setSwitchingVideo(true);
    const chId = currentChapter.id || String(currentChapter.chapterNumber);
    try {
      const res = await fetch(`/api/courses/${course.id}/chapters/${chId}/select-video`, {
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
        setShowVideoModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingVideo(false);
    }
  };

  const handleCopyNotes = () => {
    if (!currentChapter) return;
    let text = `# ${course?.title || ''}\n## Day ${currentChapter.chapterNumber}: ${currentChapter.title}\n\n`;
    text += `${currentChapter.description}\n\n`;
    if (currentChapter.content?.introduction) {
      text += `### Overview\n${currentChapter.content.introduction}\n\n`;
    }
    if (currentChapter.content?.definitions && currentChapter.content.definitions.length > 0) {
      text += `### Key Definitions\n`;
      currentChapter.content.definitions.forEach((d) => {
        text += `- **${d.term}**: ${d.explanation || d.definition}\n`;
      });
      text += `\n`;
    }
    if (currentChapter.content?.sections) {
      currentChapter.content.sections.forEach((s) => {
        text += `### ${s.title}\n${s.content}\n\n`;
        if (s.codeSnippet) {
          text += `\`\`\`\n${s.codeSnippet}\n\`\`\`\n\n`;
        }
      });
    }
    if (currentChapter.content?.diagram) {
      text += `### Architecture / Concept Diagram\n\`\`\`\n${currentChapter.content.diagram}\n\`\`\`\n\n`;
    }
    if (currentChapter.content?.realWorldApplications && currentChapter.content.realWorldApplications.length > 0) {
      text += `### Real-World Applications\n`;
      currentChapter.content.realWorldApplications.forEach((a) => {
        text += `- ${a}\n`;
      });
      text += `\n`;
    }
    if (currentChapter.content?.commonMistakes && currentChapter.content.commonMistakes.length > 0) {
      text += `### Common Mistakes & Pitfalls\n`;
      currentChapter.content.commonMistakes.forEach((m) => {
        text += `- ⚠️ ${m}\n`;
      });
      text += `\n`;
    }
    if (currentChapter.content?.keyTakeaways) {
      text += `### Key Takeaways\n`;
      currentChapter.content.keyTakeaways.forEach((k) => {
        text += `- ✓ ${k}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleDownloadNotes = () => {
    if (!currentChapter) return;
    let markdown = `# ${course?.title || ''}\n## Day ${currentChapter.chapterNumber}: ${currentChapter.title}\n\n`;
    markdown += `${currentChapter.description}\n\n`;
    if (currentChapter.content?.introduction) {
      markdown += `### Overview\n${currentChapter.content.introduction}\n\n`;
    }
    if (currentChapter.content?.definitions && currentChapter.content.definitions.length > 0) {
      markdown += `### Key Definitions\n`;
      currentChapter.content.definitions.forEach((d) => {
        markdown += `- **${d.term}**: ${d.explanation || d.definition}\n`;
      });
      markdown += `\n`;
    }
    if (currentChapter.content?.sections) {
      currentChapter.content.sections.forEach((s) => {
        markdown += `### ${s.title}\n${s.content}\n\n`;
        if (s.codeSnippet) {
          markdown += `\`\`\`\n${s.codeSnippet}\n\`\`\`\n\n`;
        }
      });
    }
    if (currentChapter.content?.diagram) {
      markdown += `### Architecture / Concept Diagram\n\`\`\`\n${currentChapter.content.diagram}\n\`\`\`\n\n`;
    }
    if (currentChapter.content?.realWorldApplications && currentChapter.content.realWorldApplications.length > 0) {
      markdown += `### Real-World Applications\n`;
      currentChapter.content.realWorldApplications.forEach((a) => {
        markdown += `- ${a}\n`;
      });
      markdown += `\n`;
    }
    if (currentChapter.content?.commonMistakes && currentChapter.content.commonMistakes.length > 0) {
      markdown += `### Common Mistakes & Pitfalls\n`;
      currentChapter.content.commonMistakes.forEach((m) => {
        markdown += `- ⚠️ ${m}\n`;
      });
      markdown += `\n`;
    }
    if (currentChapter.content?.keyTakeaways) {
      markdown += `### Key Takeaways\n`;
      currentChapter.content.keyTakeaways.forEach((k) => {
        markdown += `- ✓ ${k}\n`;
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${course?.title || 'course'}_Day${currentChapter.chapterNumber}_Notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuestion.trim() || !course || !currentChapter) return;

    const q = tutorQuestion.trim();
    const style = tutorStyle;
    setTutorQuestion('');
    setTutorChat((prev) => [...prev, { sender: 'user', text: q, style }]);
    setTutorLoading(true);

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          courseTitle: course.title,
          chapterTitle: `Day ${currentChapter.chapterNumber}: ${currentChapter.title}`,
          conceptContext: currentChapter.description,
          explanationStyle: style,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setTutorChat((prev) => [...prev, { sender: 'tutor', text: data.reply }]);
      } else {
        setTutorChat((prev) => [
          ...prev,
          { sender: 'tutor', text: data.error || 'I had trouble answering that. Please try rephrasing.' },
        ]);
      }
    } catch (err) {
      setTutorChat((prev) => [
        ...prev,
        { sender: 'tutor', text: 'Network connection error. Please try again.' },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Submit 5-question assessment
  const handleSubmitAssessment = async () => {
    if (!course || !currentChapter) return;

    const assessment = currentChapter.assessment;
    if (!assessment) return;

    // Check if student selected answers
    const answeredCount = Object.keys(mcqAnswers).length;
    if (answeredCount === 0) {
      alert('Please select your answers for the assessment questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    setAssessmentResult(null);

    try {
      const token = localStorage.getItem('coursestudio_token') || 'user_default_1';

      const res = await fetch(`/api/courses/${course.id}/chapters/${currentChapter.chapterNumber}/submit-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mcqAnswers,
        }),
      });

      const data = await res.json();

      setAssessmentResult({
        passed: data.passed,
        totalScore: data.totalScore,
        message: data.message || (data.passed ? `Great job! You scored ${data.totalScore}% and passed this lecture class.` : `You scored ${data.totalScore}%. A passing score of 75% (4 of 5 correct) is required. Review the explanations below and revise your answers.`),
        mcqResults: data.mcqResults,
      });

      if (data.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        // Refetch course to get unlocked next chapters
        await fetchCourse();
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting assessment. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course || !currentChapter) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Loading Course Lecture...</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs mt-4"
          style={{ backgroundColor: '#8150E8' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const completedCount = course.chapters.filter((c) => c.completed).length;
  const progressPercent = Math.round((completedCount / course.chapters.length) * 100);
  const assessment = currentChapter.assessment;

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Toggle chapters sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate(`/course/${course.id}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Course Layout</span>
          </button>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            {course.title}
          </h2>
        </div>

        {/* Progress & Dashboard link */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-semibold text-slate-500">
              {progressPercent}% Complete
            </span>
            <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: '#8150E8' }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-3.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar: Chapters List with Locked / Unlocked States */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:sticky top-16 bottom-0 left-0 z-50 lg:z-10 w-72 lg:w-80 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Lecture Progression
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {course.chapters.length} Lectures (75% to Unlock)
              </h3>
            </div>
            {mobileDrawerOpen && (
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-3 space-y-2">
            {course.chapters.map((chapter, idx) => {
              const isActive = idx === selectedChapterIndex;
              const isLocked = !chapter.isUnlocked;

              return (
                <button
                  key={chapter.chapterNumber}
                  disabled={isLocked}
                  onClick={() => {
                    setSelectedChapterIndex(idx);
                    setAssessmentResult(null);
                    setMobileDrawerOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                    isLocked
                      ? 'opacity-60 bg-slate-50 cursor-not-allowed border border-dashed border-slate-200'
                      : isActive
                      ? 'text-white shadow-xs cursor-pointer'
                      : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                  }`}
                  style={isActive && !isLocked ? { backgroundColor: '#8150E8' } : {}}
                >
                  {/* Status Indicator / Lock icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isLocked
                        ? 'bg-slate-200 text-slate-500'
                        : isActive
                        ? 'bg-white text-[#8150E8]'
                        : chapter.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : chapter.completed && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      chapter.chapterNumber
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isActive && !isLocked ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Day {chapter.chapterNumber}: {chapter.title}
                      </h4>
                      {isLocked && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                          Locked
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 mt-1 text-[11px] ${
                        isActive && !isLocked ? 'text-purple-100' : 'text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {chapter.duration}
                      </span>
                      {chapter.assessmentScore !== undefined && (
                        <span className="text-emerald-600 font-semibold">
                          Score: {chapter.assessmentScore}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 sm:py-10">
          {/* CHECK IF CURRENT CHAPTER IS LOCKED */}
          {!currentChapter.isUnlocked ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Lecture {currentChapter.chapterNumber} is Locked
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                You must complete Lecture {currentChapter.chapterNumber - 1} and score at least <strong>75%</strong> on its 5-question assessment to unlock this lecture.
              </p>
              <button
                onClick={() => {
                  setSelectedChapterIndex(currentChapter.chapterNumber - 2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs"
                style={{ backgroundColor: '#8150E8' }}
              >
                Go to Lecture {currentChapter.chapterNumber - 1}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Lecture Title & Intro */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8150E8] mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200/80 font-bold">
                    Day {currentChapter.chapterNumber} of {course.chapters.length}
                  </span>
                  <span>·</span>
                  <span className="text-slate-500">{currentChapter.duration}</span>
                  {currentChapter.completed && (
                    <span className="ml-2 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      ✓ Completed ({currentChapter.assessmentScore}%)
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                  Day {currentChapter.chapterNumber}: {currentChapter.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentChapter.description}
                </p>
              </div>

              {/* Embedded YouTube Video Player & Recommendation Details */}
              {course.includeVideo && currentChapter.videoId && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Educational Video Lecture</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        ✓ {currentChapter.relevanceScore || 96}% Concept Score
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowVideoModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span>Switch Video / Instructor</span>
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-black aspect-16/9 w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${currentChapter.videoId}?autoplay=0&rel=0`}
                      title={currentChapter.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                    <span className="font-semibold text-slate-700">
                      Channel: <strong className="text-[#8150E8]">{currentChapter.videoChannel || 'AlphaWave Educational Network'}</strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Concept-targeted recommendation (No whole-course duplicates)
                    </span>
                  </div>

                  {currentChapter.videoMatchReason && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-600 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#8150E8] shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-slate-900 block mb-0.5">Transparent 6-Factor Recommendation Match:</strong>
                        <span>{currentChapter.videoMatchReason}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Study Notes & Lecture Guide */}
              {currentChapter.content && (
                <div className="space-y-6">
                  {/* Notes Header Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#8150E8]" />
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Structured Lecture Study Notes
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleCopyNotes}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNotes ? 'Copied!' : 'Copy Notes'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadNotes}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download (.md)</span>
                      </button>
                    </div>
                  </div>

                  {/* Introduction Card */}
                  {currentChapter.content.introduction && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                        {currentChapter.title} – Overview
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentChapter.content.introduction}
                      </p>
                    </div>
                  )}

                  {/* Key Definitions Card */}
                  {currentChapter.content.definitions && currentChapter.content.definitions.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#8150E8]" />
                        <span>Key Definitions & Technical Vocabulary</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentChapter.content.definitions.map((def, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-700"
                          >
                            <span className="font-bold text-[#8150E8] block mb-1">{def.term}</span>
                            <span className="leading-relaxed">{def.explanation || def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Concept Cards */}
                  {currentChapter.content.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">
                        {sec.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {sec.content}
                      </p>
                      {sec.codeSnippet && (
                        <div className="mt-4 p-4 bg-[#18181b] rounded-xl text-xs font-mono text-white overflow-x-auto shadow-inner">
                          <pre className="whitespace-pre">
                            <code>{sec.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Architecture / Concept Diagram Card */}
                  {currentChapter.content.diagram && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#8150E8]" />
                        <span>System Architecture & Concept Diagram</span>
                      </h3>
                      <div className="p-4 bg-slate-900 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto shadow-inner leading-relaxed">
                        <pre className="whitespace-pre font-mono">
                          {currentChapter.content.diagram}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Real-World Applications */}
                  {currentChapter.content.realWorldApplications && currentChapter.content.realWorldApplications.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Real-World Production Applications</span>
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                        {currentChapter.content.realWorldApplications.map((app, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-150">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Common Pitfalls & Mistakes */}
                  {currentChapter.content.commonMistakes && currentChapter.content.commonMistakes.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-amber-600" />
                        <span>Common Mistakes & Debugging Pitfalls</span>
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                        {currentChapter.content.commonMistakes.map((mis, mIdx) => (
                          <li key={mIdx} className="flex items-start gap-2.5 p-3 bg-amber-50/50 rounded-xl border border-amber-150">
                            <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                            <span>{mis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Takeaways Card */}
                  {currentChapter.content.keyTakeaways && currentChapter.content.keyTakeaways.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
                        Key Takeaways & Core Concepts
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentChapter.content.keyTakeaways.map((takeaway, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-700"
                          >
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{takeaway}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LECTURE ASSESSMENT: STRICTLY 5 MULTIPLE-CHOICE QUESTIONS (75% TO PASS) */}
              {assessment && assessment.mcqs && assessment.mcqs.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm p-6 sm:p-8 mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-100">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Lecture {currentChapter.chapterNumber} Assessment (Pass: ≥ 75%)
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                        5 Assessment Questions (Multiple Choice)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Answer all 5 questions based strictly on this {currentChapter.duration || '25-minute'} class lesson. Each question is worth 20 points.
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-purple-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                      <span className="text-xs font-bold text-slate-700">Passing Score:</span>
                      <span className="text-sm font-extrabold text-[#8150E8] ml-1">75%</span>
                      <span className="text-[11px] text-slate-500 block sm:inline sm:ml-1 font-medium">
                        (4 of 5 correct)
                      </span>
                    </div>
                  </div>

                  {/* Assessment Result Alert Banner */}
                  {assessmentResult && (
                    <div
                      className={`p-4 rounded-xl mb-6 text-xs leading-relaxed border ${
                        assessmentResult.passed
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        {assessmentResult.passed ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Passed! Score: {assessmentResult.totalScore}%</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>Score: {assessmentResult.totalScore}% (Passing Score: 75%)</span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5">{assessmentResult.message}</p>
                    </div>
                  )}

                  {/* 5 Multiple Choice Questions List */}
                  <div className="space-y-6 mb-8">
                    {assessment.mcqs.map((mcq, mIdx) => {
                      const mcqEval = assessmentResult?.mcqResults?.find(
                        (r: any) => r.questionId === mcq.id || r.questionId === `mcq_${currentChapter.chapterNumber}_${mIdx + 1}`
                      );
                      const userSelected = mcqAnswers[mcq.id];
                      const isEvaluated = !!assessmentResult && mcqEval !== undefined;

                      return (
                        <div
                          key={mcq.id || mIdx}
                          className={`p-5 rounded-2xl border transition-all ${
                            isEvaluated
                              ? mcqEval.isCorrect
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-rose-50/40 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              Question {mIdx + 1}: {mcq.question}
                            </p>
                            {isEvaluated && (
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                                  mcqEval.isCorrect
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {mcqEval.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {mcqEval.isCorrect ? 'Correct (+20 pts)' : 'Wrong (0 pts)'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {mcq.options.map((opt, oIdx) => {
                              const isSelected = userSelected === oIdx;
                              const isThisCorrect = isEvaluated && oIdx === mcqEval.correctOptionIndex;
                              const isThisWrongSelection = isEvaluated && isSelected && !mcqEval.isCorrect;

                              let btnStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-700';
                              if (isEvaluated) {
                                if (isThisCorrect) {
                                  btnStyle = 'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold ring-2 ring-emerald-400';
                                } else if (isThisWrongSelection) {
                                  btnStyle = 'border-rose-400 bg-rose-50/90 text-rose-950 font-bold ring-2 ring-rose-400';
                                } else {
                                  btnStyle = 'border-slate-200 bg-slate-50/60 text-slate-400';
                                }
                              } else if (isSelected) {
                                btnStyle = 'border-[#8150E8] bg-purple-50/80 text-purple-950 font-semibold ring-1 ring-[#8150E8]';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() =>
                                    setMcqAnswers((prev) => ({
                                      ...prev,
                                      [mcq.id]: oIdx,
                                    }))
                                  }
                                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs text-left transition-colors cursor-pointer ${btnStyle}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isEvaluated && isThisCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : isEvaluated && isThisWrongSelection
                                          ? 'bg-rose-600 text-white'
                                          : isSelected
                                          ? 'bg-[#8150E8] text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span>{opt}</span>
                                  </div>

                                  {isEvaluated && isThisCorrect && (
                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                      ✓ Correct Answer
                                    </span>
                                  )}
                                  {isEvaluated && isThisWrongSelection && (
                                    <span className="text-[10px] font-extrabold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                      ✗ Your Answer (Incorrect)
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Concept Explanation Box */}
                          {isEvaluated && (
                            <div className="mt-3.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-[11px]">
                                <Sparkles className="w-3.5 h-3.5 text-[#8150E8]" /> Concept Explanation:
                              </p>
                              <p className="text-slate-600 leading-relaxed">{mcqEval.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-600 block font-semibold">
                        Passing Threshold: <strong>75% or higher</strong> to unlock Lecture {currentChapter.chapterNumber + 1}.
                      </span>
                      {assessmentResult && !assessmentResult.passed && (
                        <span className="text-[11px] text-rose-600 font-bold block mt-0.5">
                          Current Score: {assessmentResult.totalScore}%. Review explanations and revise your answers.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {assessmentResult && !assessmentResult.passed && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssessmentResult(null);
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revise Answers</span>
                        </button>
                      )}

                      {assessmentResult && assessmentResult.passed && selectedChapterIndex < course.chapters.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterIndex(selectedChapterIndex + 1);
                            setAssessmentResult(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                          style={{ backgroundColor: '#8150E8' }}
                        >
                          <span>Proceed to Next Lecture</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitAssessment}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
                          style={{ backgroundColor: '#8150E8' }}
                        >
                          {isSubmitting ? (
                            <span>Submitting Assessment...</span>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{assessmentResult ? 'Re-Submit Answers' : 'Submit Assessment & Check Score'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Toolbar */}
              <div className="sticky bottom-4 z-20 mt-12 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    if (selectedChapterIndex > 0) {
                      setSelectedChapterIndex(selectedChapterIndex - 1);
                      setAssessmentResult(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={selectedChapterIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous Lecture</span>
                </button>

                <div className="text-xs text-slate-500 font-semibold text-center">
                  Lecture {currentChapter.chapterNumber} of {course.chapters.length}
                </div>

                <button
                  onClick={() => {
                    if (selectedChapterIndex < course.chapters.length - 1) {
                      const nextCh = course.chapters[selectedChapterIndex + 1];
                      if (!nextCh.isUnlocked) {
                        alert('Lecture ' + nextCh.chapterNumber + ' is locked! Score at least 75% on the assessment to unlock it.');
                        return;
                      }
                      setSelectedChapterIndex(selectedChapterIndex + 1);
                      setAssessmentResult(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate(`/course/${course.id}`);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <span className="hidden sm:inline">
                    {selectedChapterIndex < course.chapters.length - 1 ? 'Next Lecture' : 'Finish Course'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Ask AI Tutor Button */}
      <button
        onClick={() => setShowTutorModal(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 bg-[#8150E8] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold cursor-pointer"
      >
        <MessageSquare className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">Ask AI Doubt Tutor</span>
      </button>

      {/* Alternative Video Switcher Modal */}
      {showVideoModal && currentChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Switch Lecture Video
                </h3>
                <p className="text-xs text-slate-500">
                  Select an alternate instructor or explanation style for Lecture {currentChapter.chapterNumber}
                </p>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Current video */}
              <div className="p-3.5 rounded-xl border-2 border-[#8150E8] bg-purple-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Currently Selected Video
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {currentChapter.relevanceScore || 96}% Score
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{currentChapter.title}</h4>
                <p className="text-[11px] text-slate-500">
                  Channel: {currentChapter.videoChannel || 'AlphaWave Educational Network'}
                </p>
              </div>

              {/* Alternatives */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  Alternative Recommended Videos
                </h4>

                {currentChapter.alternativeVideos && currentChapter.alternativeVideos.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentChapter.alternativeVideos.map((alt) => (
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
                          onClick={() => handleSelectVideo(alt)}
                          disabled={switchingVideo}
                          className="px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                          style={{ backgroundColor: '#8150E8' }}
                        >
                          {switchingVideo ? 'Switching...' : 'Use This Video'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 text-center">
                    No alternative videos currently cached for this lecture.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Context-Aware AI Doubt Solver Tutor Modal */}
      {showTutorModal && currentChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#8150E8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Doubt Solver Tutor
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Context: Day {currentChapter.chapterNumber} – {currentChapter.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTutorModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Mode Selector */}
            <div className="pt-3 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Explanation Style:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTutorStyle('simple')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tutorStyle === 'simple'
                      ? 'bg-[#8150E8] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Simple (ELI5)
                </button>
                <button
                  type="button"
                  onClick={() => setTutorStyle('detailed')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tutorStyle === 'detailed'
                      ? 'bg-[#8150E8] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Detailed / Deep Dive
                </button>
                <button
                  type="button"
                  onClick={() => setTutorStyle('practical')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tutorStyle === 'practical'
                      ? 'bg-[#8150E8] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Code Example
                </button>
              </div>
            </div>

            {/* Messages Pane */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[200px]">
              {tutorChat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <HelpCircle className="w-8 h-8 text-purple-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Ask any doubt about Lecture {currentChapter.chapterNumber}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    The tutor is trained on this exact lesson and will clarify any concept or code snippet.
                  </p>
                </div>
              ) : (
                tutorChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-[#8150E8] text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {tutorLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded-xl animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tutor is thinking...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleAskTutor} className="flex gap-2 pt-3 border-t border-slate-100">
              <input
                type="text"
                value={tutorQuestion}
                onChange={(e) => setTutorQuestion(e.target.value)}
                placeholder="e.g. Can you explain pointers with a real-life analogy?"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8150E8]"
              />
              <button
                type="submit"
                disabled={tutorLoading || !tutorQuestion.trim()}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
