import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  RotateCcw,
  BookOpen,
  Check,
  ChevronRight,
  ShieldCheck,
  Eye,
  ListOrdered,
  HelpCircle,
  BarChart3,
  Flame,
  Info,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import {
  User,
  FinalExamQuestion,
  FinalExamAttempt,
  FinalExamStatus,
} from '../types';

interface FinalExamPageProps {
  user: User | null;
  onRefreshCourses?: () => void;
}

const EXAM_DURATION_SECONDS = 20 * 60; // 20 minutes

export const FinalExamPage: React.FC<FinalExamPageProps> = ({ user, onRefreshCourses }) => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Loading & Exam Status
  const [loading, setLoading] = useState(true);
  const [examStatus, setExamStatus] = useState<FinalExamStatus | null>(null);
  const [questions, setQuestions] = useState<FinalExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student Answers (map of questionId -> selectedOptionIndex)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // Timer State
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [examStarted, setExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Completed Attempt / Results
  const [latestAttempt, setLatestAttempt] = useState<FinalExamAttempt | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  // Timer ref to avoid multiple intervals
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial exam status and questions
  const loadExamData = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('coursestudio_token') || user?.id || 'user_default_1';
      const res = await fetch(`/api/courses/${courseId}/final-exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setExamStatus(data.status);
        setQuestions(data.questions || []);

        // If user already had a passed attempt or recent attempt, check attempts
        if (data.status?.latestAttempt) {
          setLatestAttempt(data.status.latestAttempt);
        }
      }
    } catch (err) {
      console.error('Failed to load final exam status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamData();
  }, [courseId, user?.id]);

  // Countdown Timer handling
  useEffect(() => {
    if (examStarted && !latestAttempt) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, latestAttempt]);

  const handleTimeExpired = () => {
    alert('Time has expired! Submitting your answers automatically...');
    handleSubmitExam();
  };

  const handleStartExam = () => {
    setSelectedAnswers({});
    setTimeLeft(EXAM_DURATION_SECONDS);
    setCurrentQuestionIndex(0);
    setLatestAttempt(null);
    setReviewMode(false);
    setExamStarted(true);
  };

  const handleOptionSelect = (qId: string, optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optIndex,
    }));
  };

  const handleSubmitExam = async () => {
    if (!courseId) return;
    setShowSubmitModal(false);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('coursestudio_token') || user?.id || 'user_default_1';
      const durationUsed = EXAM_DURATION_SECONDS - timeLeft;

      const res = await fetch(`/api/courses/${courseId}/final-exam/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          durationSeconds: Math.max(10, durationUsed),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLatestAttempt(data.attempt);
        setExamStatus(data.status);
        setExamStarted(false);

        if (data.attempt?.passed) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
        if (onRefreshCourses) {
          onRefreshCourses();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit exam.');
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert('Network error while submitting exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper formatters
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length;
  const currentQ = questions[currentQuestionIndex];

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full border-3 border-purple-200 border-t-[#8150E8] animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Preparing Comprehensive Examination...</h2>
          <p className="text-xs text-slate-500 mt-1">Verifying chapter completion and assembling 15-question test.</p>
        </div>
      </div>
    );
  }

  // 2. Locked State (Chapters Not Yet Completed)
  if (!examStatus?.isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course Layout</span>
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Examination Locked
            </span>

            <h1 className="text-2xl font-black text-slate-900 mt-3 mb-2">
              Final Comprehensive Assessment (15 Questions)
            </h1>

            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
              {examStatus?.lockReason ||
                `You must complete all ${examStatus?.totalChaptersCount || 0} chapters and pass each chapter-wise assessment (≥75%) to unlock the final examination.`}
            </p>

            <div className="bg-slate-50 rounded-xl p-4 max-w-md mx-auto mb-8 text-left border border-slate-200 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 mb-2">
                <span>Lecture Completion Status:</span>
                <span className="text-[#8150E8]">
                  {examStatus?.completedChaptersCount || 0} / {examStatus?.totalChaptersCount || 0} Completed
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8150E8] transition-all"
                  style={{
                    width: `${Math.round(
                      ((examStatus?.completedChaptersCount || 0) / Math.max(1, examStatus?.totalChaptersCount || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate(`/course/${courseId}/start`)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: '#8150E8' }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Resume Incomplete Lectures</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 3. Results Dashboard (Latest Attempt completed or just submitted)
  if (latestAttempt && !examStarted) {
    const isPassed = latestAttempt.passed;
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <Navbar user={user} />

        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
          {/* Header breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Layout</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Attempt #{latestAttempt.attemptNumber}
              </span>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  isPassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {isPassed ? 'PASSED (≥70%)' : 'NEEDS REVISION (<70%)'}
              </span>
            </div>
          </div>

          {/* Hero Banner: Pass vs Needs Revision */}
          <div
            className={`rounded-2xl border-2 p-8 mb-8 text-center shadow-xs transition-all ${
              isPassed
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isPassed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isPassed ? <Award className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isPassed ? 'Final Examination Passed!' : 'Examination Incomplete'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto mt-2 leading-relaxed">
              {isPassed
                ? `Outstanding achievement! You scored ${latestAttempt.scorePercentage}% on the 15-question Final Comprehensive Examination. Your official academic certificate of completion has been granted.`
                : `You scored ${latestAttempt.scorePercentage}%. The passing threshold is 70% (11 of 15 questions). Review the chapter breakdown and recommended revision topics below before attempting a retake.`}
            </p>

            {/* Score Highlight Box */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your Score
                </span>
                <span
                  className={`text-2xl font-black ${
                    isPassed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {latestAttempt.scorePercentage}%
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Passing Mark
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {latestAttempt.passingThreshold}%
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Correct Answers
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {latestAttempt.correctAnswers} / {latestAttempt.totalQuestions}
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Time Spent
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {Math.round(latestAttempt.durationSeconds / 60)}m {latestAttempt.durationSeconds % 60}s
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {isPassed ? (
                <button
                  onClick={() => navigate('/certificates')}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <Award className="w-4 h-4" />
                  <span>Claim & View Official Certificate</span>
                </button>
              ) : (
                <button
                  onClick={handleStartExam}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Final Examination (15 Questions)</span>
                </button>
              )}

              <button
                onClick={() => setReviewMode(!reviewMode)}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#8150E8]" />
                <span>{reviewMode ? 'Hide Detailed Review' : 'Review All 15 Questions'}</span>
              </button>
            </div>
          </div>

          {/* Chapter-Wise Performance Breakdown */}
          {latestAttempt.chapterBreakdown && latestAttempt.chapterBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <BarChart3 className="w-5 h-5 text-[#8150E8]" />
                <h3 className="text-base font-bold text-slate-900">
                  Chapter-Wise Performance Breakdown
                </h3>
              </div>

              <div className="space-y-4">
                {latestAttempt.chapterBreakdown.map((ch) => (
                  <div
                    key={ch.chapterNumber}
                    className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Day {ch.chapterNumber}: {ch.chapterTitle}
                        </span>
                        {ch.needsRevision && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            ⚠️ Needs Revision
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>
                          {ch.correctQuestions} of {ch.totalQuestions} questions correct
                        </span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">{ch.scorePercentage}%</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-36 h-2.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ch.scorePercentage >= 70 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${ch.scorePercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Revision Topics */}
          {latestAttempt.recommendedRevisionTopics && latestAttempt.recommendedRevisionTopics.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Recommended Revision Topics
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Based on incorrect answers, these specific technical topics should be revisited to master the curriculum:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {latestAttempt.recommendedRevisionTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-slate-800"
                  >
                    <span className="font-bold text-amber-600 mt-0.5">•</span>
                    <span className="leading-relaxed">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review Mode */}
          {reviewMode && latestAttempt.questionResults && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#8150E8]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Detailed Review of All 15 Exam Questions
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {latestAttempt.correctAnswers} Correct · {latestAttempt.incorrectAnswers} Incorrect · {latestAttempt.unanswered} Blank
                </span>
              </div>

              <div className="space-y-6">
                {latestAttempt.questionResults.map((q, idx) => (
                  <div
                    key={q.questionId || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      q.isCorrect ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block mb-1 w-fit">
                          Day {q.chapterNumber}: {q.chapterTitle}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          {idx + 1}. {q.questionText}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          q.isCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {q.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = q.selectedOptionIndex === optIdx;
                        const isCorrect = q.correctOptionIndex === optIdx;

                        let style = 'bg-white border-slate-200 text-slate-700';
                        if (isCorrect) {
                          style = 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400';
                        } else if (isSelected && !q.isCorrect) {
                          style = 'bg-rose-100/70 border-rose-400 text-rose-950 font-bold ring-1 ring-rose-400';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                                ✓ Correct Answer
                              </span>
                            )}
                            {isSelected && !q.isCorrect && (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                                ✗ Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <Info className="w-4 h-4 text-[#8150E8] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Academic Rationale:</strong>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 4. Pre-Exam Start Screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <Navbar user={user} />

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course Layout</span>
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#8150E8] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Academic Graduation Assessment
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Final Comprehensive Examination
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              You have completed all {examStatus?.totalChaptersCount} curriculum lectures! To verify your mastery and qualify for your official AlphaWave AI Certificate of Completion, complete this comprehensive 15-question examination.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Question Count
                </span>
                <span className="text-xl font-black text-purple-950 mt-1 block">
                  15 Questions
                </span>
                <span className="text-[11px] text-slate-500">Evenly from all chapters</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Time Limit
                </span>
                <span className="text-xl font-black text-purple-950 mt-1 block">
                  20 Minutes
                </span>
                <span className="text-[11px] text-slate-500">Countdown timer enforced</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Passing Score
                </span>
                <span className="text-xl font-black text-purple-950 mt-1 block">
                  70% or Higher
                </span>
                <span className="text-[11px] text-slate-500">11 of 15 correct to pass</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-8 space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8150E8]" />
                <span>Examination Integrity Rules</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Questions test core principles, algorithms, syntax, and problem-solving.</li>
                <li>You can jump between questions at any time using the 1–15 navigation grid.</li>
                <li>Your answers will be evaluated server-side upon submission or when the 20-minute timer expires.</li>
                <li>If you do not pass on the first attempt, you may review your weak chapters and retake the test.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleStartExam}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <span>Start Final Examination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 5. Active Exam Screen (20-min countdown, 15 Questions, Navigation Grid)
  const isTimeCritical = timeLeft < 180; // less than 3 minutes

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
      {/* Fixed Sticky Header with Progress & 20-min Timer */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            Final Comprehensive Examination (15 Questions)
          </h2>
        </div>

        {/* 20-min Countdown Timer Badge */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold transition-colors ${
              isTimeCritical
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-bounce'
                : 'bg-purple-50 text-[#8150E8] border-purple-200'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: '#8150E8' }}
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Question Navigation Grid (1–15) */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs sticky top-24">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Questions (15)</span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {answeredCount} / {totalCount} Answered
              </span>
            </div>

            {/* 15 Number Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;

                let btnClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                if (isCurrent) {
                  btnClass = 'bg-[#8150E8] text-white border-[#8150E8] ring-2 ring-purple-300 shadow-xs font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#8150E8]" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Active Question Card */}
        <main className="flex-1">
          {currentQ && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col justify-between min-h-[460px]">
              <div>
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Question {currentQuestionIndex + 1} of {totalCount}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Day {currentQ.chapterNumber}: {currentQ.chapterTitle}
                    </span>
                  </div>

                  {currentQ.difficulty && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-6">
                  {currentQ.question}
                </h2>

                {/* 4 MCQ Radio Options */}
                <div className="space-y-3 mb-8">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleOptionSelect(currentQ.id, optIdx)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-xs sm:text-sm text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#8150E8] bg-purple-50/70 text-purple-950 font-bold ring-1 ring-[#8150E8]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#8150E8] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span>{opt}</span>
                        </div>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#8150E8]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentQuestionIndex < totalCount - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: '#8150E8' }}
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: '#8150E8' }}
                    >
                      <Check className="w-4 h-4" />
                      <span>Review & Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submit Final Examination?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your test will be evaluated against the 70% passing requirement.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-5 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">15</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <span className={`font-bold ${totalCount - answeredCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {totalCount - answeredCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Time Remaining:</span>
                <span className="font-bold text-purple-700">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {totalCount - answeredCount > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-4">
                ⚠️ You have {totalCount - answeredCount} unanswered question(s). Unanswered questions receive 0 points.
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Keep Testing
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
