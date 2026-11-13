import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  Clock,
  Eye,
  Copy,
  Check,
  HelpCircle,
  Film,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { User, Course, VideoLectureAnalysis, EducationalVideo } from '../types';
import {
  validateVideoFile,
  extractVideoFrames,
  resetVideoElement,
  createProcessingId,
  formatDuration,
  SAMPLE_LECTURE_SCENARIOS,
  SampleLectureScenario,
} from '../utils/videoProcessor';

interface VideoAnalysisPageProps {
  user: User;
  courses: Course[];
  onRefreshCourses: () => void;
  onLogout: () => void;
}

export const VideoAnalysisPage: React.FC<VideoAnalysisPageProps> = ({
  user,
  courses,
  onRefreshCourses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Processing & Analysis State
  const [processingId, setProcessingId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<VideoLectureAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Quiz interactive state
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Refs for race-condition prevention and cleanup
  const activeProcessingIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  /**
   * Complete Switch Video Functionality
   * 1. Cancels any in-flight request via AbortController
   * 2. Clears previous analysis, frames, transcript, errors, and cached results
   * 3. Pauses and resets the HTML5 video element
   * 4. Updates processing ID so pending async callbacks are strictly ignored
   */
  const handleSwitchVideo = () => {
    // 1. Abort any running processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Generate a new processing session ID
    const newSessionId = createProcessingId();
    activeProcessingIdRef.current = newSessionId;
    setProcessingId(newSessionId);

    // 3. Reset video player element and revoke old blob
    resetVideoElement(videoRef.current, videoUrl);

    // 4. Clear all previous video state completely
    setVideoFile(null);
    setVideoUrl('');
    setActiveScenarioId(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setStatusMessage('');
    setExtractedFrames([]);
    setAnalysis(null);
    setAnalysisError(null);
    setUserMcqAnswers({});
    setShowExplanations({});
    setCopiedNotes(false);

    // 5. Reset file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Main Video Processing Pipeline
   */
  const startVideoAnalysisPipeline = async (
    source: File | string,
    fileName: string,
    fileSize: number,
    sampleScenario?: string,
    precomputedFrames?: string[],
    precomputedDuration?: number
  ) => {
    // Create new isolation processing ID
    const currentProcId = createProcessingId();
    activeProcessingIdRef.current = currentProcId;
    setProcessingId(currentProcId);

    // Initialize AbortController
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset previous results
    setAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setStatusMessage('1/5: Validating uploaded video format & initializing player...');
    setUserMcqAnswers({});
    setShowExplanations({});

    try {
      let frames: string[] = [];
      let durationSeconds = precomputedDuration || 1200;

      // Extract video frames if not already pre-provided
      if (precomputedFrames && precomputedFrames.length > 0) {
        frames = precomputedFrames;
        setExtractedFrames(frames);
        setAnalysisProgress(40);
        setStatusMessage('2/5: Extracted visual frames of lecture slides, equations & board...');
      } else {
        setAnalysisProgress(20);
        setStatusMessage('2/5: Extracting high-clarity keyframes across lecture timeline...');

        const extracted = await extractVideoFrames(
          source,
          currentProcId,
          5,
          (pct, msg) => {
            if (activeProcessingIdRef.current === currentProcId) {
              setAnalysisProgress(pct);
              setStatusMessage(`2/5: ${msg}`);
            }
          },
          controller.signal
        );

        // Discard if user switched videos during extraction
        if (activeProcessingIdRef.current !== currentProcId) return;

        frames = extracted.frames;
        durationSeconds = extracted.durationSeconds;
        setExtractedFrames(frames);
      }

      // Check race condition
      if (activeProcessingIdRef.current !== currentProcId) return;

      setAnalysisProgress(65);
      setStatusMessage('3/5: Detecting spoken language & verifying English compliance...');

      setAnalysisProgress(75);
      setStatusMessage('4/5: Analyzing visual evidence & identifying exact academic subject (DBMS, Networks, OS, Python)...');

      // Call Backend Multimodal Video Analysis API
      const token = localStorage.getItem('coursestudio_token') || user.id;
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          processingId: currentProcId,
          fileName,
          fileSize,
          durationSeconds,
          frames,
          sampleScenario,
        }),
        signal: controller.signal,
      });

      // Discard if user switched videos while API request was in flight
      if (activeProcessingIdRef.current !== currentProcId) return;

      const data = await res.json();

      // Guard against stale async resolution
      if (data.processingId && data.processingId !== activeProcessingIdRef.current) {
        return;
      }

      if (!res.ok || data.success === false) {
        // Handled non-English or recognition error
        setAnalysisError(
          data.error || 'Failed to analyze video lecture. Please verify the video has visible lecture material.'
        );
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        return;
      }

      setAnalysisProgress(100);
      setStatusMessage('5/5: Synthesis complete! Verified subject, notes & concept assessment generated.');
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
    } catch (err: any) {
      if (err.name === 'AbortError' || activeProcessingIdRef.current !== currentProcId) {
        // Analysis was cancelled by Switch Video - silent discard
        return;
      }
      console.error('[Video Analysis Error]:', err);
      setAnalysisError(err.message || 'An error occurred during video analysis. Please try switching video.');
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  /**
   * Handle user upload of an actual video file (.mp4, .webm, .mov)
   */
  const handleFileSelect = (file: File) => {
    const val = validateVideoFile(file);
    if (!val.valid) {
      setAnalysisError(val.error || 'Invalid video file.');
      return;
    }

    // Completely clear previous state before loading new file
    handleSwitchVideo();

    setVideoFile(file);
    const newUrl = URL.createObjectURL(file);
    setVideoUrl(newUrl);

    // Begin processing pipeline
    startVideoAnalysisPipeline(file, file.name, file.size);
  };

  /**
   * Handle Quick-Test Scenario Selection
   * Immediately loads verified lecture slides & frames to verify DBMS vs Python vs Networks vs OS vs Language rejection
   */
  const handleSelectScenario = (scenario: SampleLectureScenario) => {
    // Completely reset before switching
    handleSwitchVideo();

    setActiveScenarioId(scenario.id);
    setVideoUrl(''); // Uses frame slides

    startVideoAnalysisPipeline(
      'synthetic_lecture.mp4',
      scenario.title,
      18 * 1024 * 1024,
      scenario.id,
      scenario.mockFrames,
      scenario.durationSeconds
    );
  };

  /**
   * Create Full Course from this Analyzed Video Lecture
   */
  const handleCreateCourseFromVideo = async () => {
    if (!analysis) return;
    setIsCreatingCourse(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;

    try {
      const res = await fetch('/api/video/create-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysis }),
      });

      if (res.ok) {
        const data = await res.json();
        onRefreshCourses();
        navigate(`/course-learning/${data.courseId}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create interactive course from video.');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating course from video.');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleCopyNotes = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.structuredNotes);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        courses={courses}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Navbar Header */}
        <Navbar
          user={user}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Description & Switch Video Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#8150E8] dark:text-purple-300">
                  <Film className="w-4 h-4" />
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Video Lecture Recognition & Subject Classifier
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Upload any academic video lecture (DBMS, Networks, OS, Python, Java, etc.). The multimodal AI engine analyzes lecture slides, blackboard writing, and speech evidence to accurately identify the academic subject, generate study notes, and reject non-English video lectures.
              </p>
            </div>

            {/* Permanent Switch Video Button (Prominent on desktop & mobile) */}
            {(videoFile || activeScenarioId || analysis || isAnalyzing) && (
              <button
                type="button"
                onClick={handleSwitchVideo}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#8150E8] hover:bg-[#703ed4] rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Video</span>
              </button>
            )}
          </div>

          {/* Quick-Test Scenario Bar: Allows Instant Verification of the 5 User-Requested Scenarios */}
          <div className="bg-purple-50/60 dark:bg-slate-900/80 rounded-2xl border border-purple-150 dark:border-purple-900/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8150E8]" />
                <span>Quick-Test Academic Scenarios (Instant Verification):</span>
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hidden sm:inline">
                Click any scenario to test classification & switching
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {SAMPLE_LECTURE_SCENARIOS.map((sc) => {
                const isActive = activeScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'border-[#8150E8] bg-white dark:bg-slate-800 shadow-xs ring-2 ring-[#8150E8]/20'
                        : 'border-purple-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-850 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            sc.isEnglish
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {sc.expectedSubject}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDuration(sc.durationSeconds)}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 text-[11px] leading-tight">
                        {sc.title}
                      </p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{sc.expectedLanguage}</span>
                      <span className="text-[#8150E8] font-bold">
                        {isActive ? 'Active' : 'Test →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Upload Dropzone (When no video is active) */}
          {!videoFile && !activeScenarioId && !analysis && !isAnalyzing && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#8150E8] rounded-3xl p-8 sm:p-12 text-center bg-white dark:bg-slate-900 transition-all flex flex-col items-center justify-center space-y-4 shadow-xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-[#8150E8]">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Upload an Academic Video Lecture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Drag and drop your video file (.mp4, .webm, .mov up to 100MB) or browse your files.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="video-upload-input"
              />

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label
                  htmlFor="video-upload-input"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#8150E8] hover:bg-[#703ed4] shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Select Video File
                </label>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 max-w-lg w-full">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Accurate Subject Detection
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  English Language Only
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
                  Instant Video Switching
                </span>
              </div>
            </div>
          )}

          {/* Active Processing / Loading State */}
          {isAnalyzing && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full border-3 border-purple-200 border-t-[#8150E8] animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Analyzing Lecture Video Content...
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                  {statusMessage}
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#8150E8] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSwitchVideo}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Cancel and Switch Video
                </button>
              </div>
            </div>
          )}

          {/* Language Rejection / Analysis Error Alert */}
          {analysisError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                    Lecture Video Validation Notice
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                    {analysisError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSwitchVideo}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Switch Video Now
              </button>
            </div>
          )}

          {/* Live Video Player or Frame Preview */}
          {(videoUrl || extractedFrames.length > 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#8150E8]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {videoFile ? videoFile.name : activeScenarioId ? 'Active Test Lecture' : 'Selected Video'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchVideo}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#8150E8] bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Switch Video</span>
                  </button>
                </div>
              </div>

              {/* Native HTML5 Video Player if file uploaded */}
              {videoUrl ? (
                <div className="rounded-xl overflow-hidden bg-black aspect-16/9 w-full max-h-[420px] mx-auto shadow-inner">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : extractedFrames.length > 0 ? (
                /* Slide / Keyframe Preview */
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden bg-slate-950 aspect-16/9 w-full max-h-[380px] mx-auto shadow-inner flex items-center justify-center">
                    <img
                      src={extractedFrames[0]}
                      alt="Lecture Keyframe"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {extractedFrames.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {extractedFrames.map((f, idx) => (
                        <div
                          key={idx}
                          className="w-24 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-black cursor-pointer hover:opacity-90"
                        >
                          <img
                            src={f}
                            alt={`Frame ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Analysis Results View */}
          {analysis && (
            <div className="space-y-6">
              {/* Classification Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Identified Subject Badge */}
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-[#8150E8] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Award className="w-3.5 h-3.5" />
                        <span>Subject: {analysis.subject}</span>
                      </span>

                      {/* Language Verification Tag */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Language: {analysis.detectedLanguage} (Verified)
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        Confidence: {analysis.confidenceScore}%
                      </span>
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white pt-1">
                      {analysis.lectureTitle}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Module: {analysis.moduleName} · Topic: {analysis.specificTopic}
                    </p>
                  </div>

                  {/* Actions: Create Course & Switch Video */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSwitchVideo}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Switch Video
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateCourseFromVideo}
                      disabled={isCreatingCourse}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#8150E8] hover:bg-[#703ed4] rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isCreatingCourse ? 'Generating Course...' : 'Generate Interactive Course'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Visual Evidence Section */}
                {analysis.visualEvidence && analysis.visualEvidence.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#8150E8]" />
                      <span>Verified Visual & Conceptual Evidence Extracted from Video</span>
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {analysis.visualEvidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#8150E8] font-bold">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Summary */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8150E8]" />
                    <span>Academic Lecture Summary</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {analysis.detailedSummary}
                  </div>
                </div>

                {/* Core Concepts */}
                {analysis.keyConcepts && analysis.keyConcepts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#8150E8]" />
                      <span>Core Concepts Taught</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyConcepts.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Structured Study Notes Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8150E8]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Structured Study Notes (Extracted from Lecture)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotes ? 'Copied' : 'Copy Notes'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {analysis.structuredNotes}
                </div>
              </div>

              {/* Assessment Questions Card */}
              {analysis.practiceQuestions && analysis.practiceQuestions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <HelpCircle className="w-4 h-4 text-[#8150E8]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Lecture Concept Check ({analysis.practiceQuestions.length} Questions)
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {analysis.practiceQuestions.map((q, qIdx) => {
                      const isMcq = q.type === 'mcq' || (q.options && q.options.length > 0);
                      const selected = userMcqAnswers[q.id];
                      const isRevealed = showExplanations[q.id];

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-850"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Q{qIdx + 1}: {q.question}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                              {isMcq ? 'Multiple Choice' : 'Written Problem'}
                            </span>
                          </div>

                          {/* MCQ Options */}
                          {isMcq && q.options && (
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = selected === optIdx;
                                const isCorrect = q.correctAnswerIndex === optIdx;

                                let btnStyle = 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200';
                                if (isRevealed) {
                                  if (isCorrect) {
                                    btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                                  } else if (isSelected) {
                                    btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200';
                                  }
                                } else if (isSelected) {
                                  btnStyle = 'border-[#8150E8] bg-purple-50 dark:bg-purple-950/60 text-[#8150E8] font-bold';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => {
                                      setUserMcqAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                      setShowExplanations((prev) => ({ ...prev, [q.id]: true }));
                                    }}
                                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {isRevealed && isCorrect && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Written Question Key Points */}
                          {!isMcq && q.expectedKeyPoints && (
                            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg text-xs space-y-1.5 border border-purple-100 dark:border-purple-900/40">
                              <span className="font-bold text-purple-900 dark:text-purple-300 block">
                                Key Points to Cover:
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                                {q.expectedKeyPoints.map((kp, kIdx) => (
                                  <li key={kIdx}>{kp}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Explanation */}
                          {isRevealed && q.explanation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matched English Reference Videos */}
              {analysis.recommendedEnglishVideos && analysis.recommendedEnglishVideos.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#8150E8]" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Concept-Aligned English Reference Videos
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      English Language Exclusive
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysis.recommendedEnglishVideos.map((vid) => (
                      <div
                        key={vid.id || (vid as any).videoId}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-850 flex flex-col justify-between"
                      >
                        <div className="aspect-16/9 bg-black relative">
                          <iframe
                            src={vid.embedUrl || `https://www.youtube.com/embed/${vid.id}`}
                            title={vid.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>

                        <div className="p-3 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {vid.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {vid.channel} · <strong className="text-emerald-600">{vid.relevanceScore}% Match</strong>
                          </p>
                          {vid.matchReason && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 pt-1">
                              {vid.matchReason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900 p-5 text-xs text-amber-800 dark:text-amber-200 font-medium">
                  No relevant educational videos found for this chapter. Please try again later.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
