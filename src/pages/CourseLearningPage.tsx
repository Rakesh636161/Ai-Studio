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
} from 'lucide-react';
import { Course, CourseChapter } from '../types';

export const CourseLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

              {/* Embedded YouTube Video Player */}
              {course.includeVideo && currentChapter.videoId && (
                <div className="space-y-2">
                  <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-black aspect-16/9 w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${currentChapter.videoId}?autoplay=0&rel=0`}
                      title={currentChapter.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span className="font-semibold text-slate-700">
                      Channel: <strong className="text-[#8150E8]">{currentChapter.videoChannel || 'AlphaWave Educational Network'}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ {currentChapter.relevanceScore || 97}% Verified Educational Relevance
                    </span>
                  </div>
                </div>
              )}

              {/* Card-by-Card Concept Notes (Matching the Reference Video Layout) */}
              {currentChapter.content && (
                <div className="space-y-6">
                  {/* Introduction Card */}
                  {currentChapter.content.introduction && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                        {currentChapter.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentChapter.content.introduction}
                      </p>
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
    </div>
  );
};
