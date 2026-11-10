import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  HeartPulse,
  Palette,
  Briefcase,
  Cpu,
  FlaskConical,
  Calculator,
  Compass,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Video,
  Clock,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  FileCheck,
  Layers,
  LayoutGrid,
  Sliders,
  Globe,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LoadingModal } from '../components/LoadingModal';
import { User, Course, PDFSource } from '../types';

interface CreateCourseWizardProps {
  user: User;
  onCourseCreated: (course: Course) => void;
}

export const CreateCourseWizard: React.FC<CreateCourseWizardProps> = ({
  user,
  onCourseCreated,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Tab: 'wizard' (Interactive Wizard) | 'pdf' (Generate from PDF Notes)
  const [activeTab, setActiveTab] = useState<'wizard' | 'pdf'>('wizard');

  // Stepper Step: 1 = Category, 2 = Topic & Desc, 3 = Course Options
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Core Generation Fields
  const [category, setCategory] = useState('Programming');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advance'>('Advance');
  const [duration, setDuration] = useState('1 hour');
  const [addVideo, setAddVideo] = useState<'Yes' | 'No'>('Yes');
  const [noOfChapters, setNoOfChapters] = useState(5);
  const [language, setLanguage] = useState('English');

  // Optional PDF State
  const [uploadedPDFs, setUploadedPDFs] = useState<PDFSource[]>([]);
  const [pdfNotesText, setPdfNotesText] = useState('');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [stageList, setStageList] = useState<string[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Generating course curriculum...');

  const categories = [
    { id: 'Programming', label: 'Programming', icon: Code2, color: '#8150E8', bg: '#F3E8FF' },
    { id: 'Health', label: 'Health', icon: HeartPulse, color: '#E11D48', bg: '#FFE4E6' },
    { id: 'Creative', label: 'Creative', icon: Palette, color: '#D97706', bg: '#FEF3C7' },
    { id: 'Business', label: 'Business', icon: Briefcase, color: '#059669', bg: '#D1FAE5' },
    { id: 'Technology', label: 'Technology', icon: Cpu, color: '#2563EB', bg: '#DBEAFE' },
    { id: 'Science', label: 'Science', icon: FlaskConical, color: '#7C3AED', bg: '#EDE9FE' },
    { id: 'Mathematics', label: 'Mathematics', icon: Calculator, color: '#EA580C', bg: '#FFEDD5' },
    { id: 'Other', label: 'Other', icon: Compass, color: '#4B5563', bg: '#F3F4F6' },
  ];

  // AI Topic Suggestions per category
  const topicSuggestions: Record<string, string[]> = {
    Programming: [
      'Java Programming & Object-Oriented Architecture',
      'Introduction to SQL for Beginners',
      'C Programming & System Memory Management',
      'Python Core, Automation & Data Structures',
      'Full-Stack Web Development with React & Node.js',
    ],
    Health: [
      'Hypertrophy, Biomechanics & Progressive Overload Training',
      'Nutrition Science, Macronutrients & Metabolism',
      'Cardiovascular Fitness, Heart Rate Zones & Endurance',
      'Kinesiology, Injury Prevention & Posture Correction',
    ],
    Creative: [
      'UI/UX Design Systems, Typography & Color Harmonies',
      'Digital Illustration, Vector Art & Visual Composition',
      'Video Editing & Motion Graphics Storyboarding',
      'Branding, Logo Design & Visual Identity',
    ],
    Business: [
      'Customer Acquisition, Unit Economics & LTV to CAC Ratios',
      'Financial Statement Modeling & Corporate Valuation',
      'Product Management & Agile Sprint Execution',
      'B2B Sales Funnels & Cold Outreach Strategy',
    ],
    Technology: [
      'Cloud Architecture & Microservices with Docker',
      'Cybersecurity Fundamentals, Network Defense & Cryptography',
      'Artificial Intelligence & Deep Learning Models',
      'DevOps Continuous Integration & Kubernetes Orchestration',
    ],
    Science: [
      'Cellular Biology & Molecular Genetics',
      'Organic Chemistry Reaction Mechanisms',
      'Classical Mechanics, Work & Energy Systems',
      'Astrophysics & Planetary Planetary Exploration',
    ],
    Mathematics: [
      'Linear Algebra, Matrices & Vector Spaces',
      'Calculus: Derivatives, Integrals & Optimization',
      'Probability, Statistics & Hypothesis Testing',
      'Discrete Mathematics & Graph Theory',
    ],
    Other: [
      'Public Speaking, Rhetoric & Presentation Mastery',
      'Cognitive Psychology & Habit Formation',
      'Speed Reading & Long-Term Memory Techniques',
    ],
  };

  const handleApplySuggestion = (sug: string) => {
    setTopic(sug);
  };

  // Real Multi-Stage PDF Upload & AI Analysis Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please upload a PDF document (under 20MB).');
      return;
    }

    setIsLoading(true);
    setStageList([
      '1. Uploading PDF document to server',
      '2. Validating PDF magic bytes & extracting text with pdf-parse',
      '3. Analyzing syllabus structure & key concepts with Gemini AI',
      '4. Finding high-relevance domain educational videos',
      '5. Ready to create your interactive course',
    ]);
    setActiveStage(0);
    setLoadingMessage(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('coursestudio_token') || user.id;

      setActiveStage(1);
      setLoadingMessage('Validating magic bytes and extracting text content...');

      const uploadRes = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload PDF');
      }

      const uploadData = await uploadRes.json();
      const doc = uploadData.document;
      setActiveDocId(doc.id);

      setActiveStage(2);
      setLoadingMessage('Analyzing curriculum, topics & learning objectives with Gemini AI...');

      const analyzeRes = await fetch(`/api/pdf/${doc.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const analyzeData = await analyzeRes.json();
      const analyzedDoc = analyzeData.document || doc;

      setActiveStage(3);
      setLoadingMessage('Matched relevant educational video lectures!');

      const cleanTopic = analyzedDoc.mainTopics?.[0] || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTopic(cleanTopic);
      if (analyzedDoc.summary) {
        setDescription(analyzedDoc.summary.slice(0, 300));
      }

      setUploadedPDFs(prev => [
        ...prev,
        {
          fileName: file.name,
          fileSize: file.size,
          summary: analyzedDoc.summary || `Extracted curriculum from ${file.name}`,
        },
      ]);

      setActiveStage(4);
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    } catch (err: any) {
      console.error('[Upload error]:', err);
      alert(err.message || 'Error processing PDF');
      setIsLoading(false);
    }
  };

  const removePDF = (index: number) => {
    setUploadedPDFs((prev) => prev.filter((_, idx) => idx !== index));
    setActiveDocId(null);
  };

  const handleGenerateCourseLayout = async () => {
    if (!topic.trim() && uploadedPDFs.length === 0) {
      alert('Please enter a course topic or upload a PDF.');
      setCurrentStep(2);
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;

    // If PDF was uploaded and analyzed, use direct PDF-to-course generator endpoint
    if (activeDocId) {
      setStageList([
        '1. Converting PDF chapters into structured lessons',
        '2. Mapping verified educational lecture videos',
        '3. Formulating 5-question chapter assessments',
        '4. Initializing progression lock (Lecture 1 unlocked)',
      ]);
      setActiveStage(0);
      setLoadingMessage('Generating interactive course from PDF analysis...');

      try {
        setActiveStage(1);
        const res = await fetch(`/api/pdf/${activeDocId}/create-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to generate course from PDF');
        }

        const data = await res.json();
        setActiveStage(3);
        onCourseCreated(data.course);
        setTimeout(() => {
          setIsLoading(false);
          navigate(`/course/${data.course.id}`);
        }, 500);
        return;
      } catch (err: any) {
        console.warn('PDF-to-course direct creation fallback to standard generate:', err.message);
      }
    }

    setStageList([
      '1. Structuring curriculum modules & chapter durations',
      '2. Querying YouTube Data API for relevant educational videos',
      '3. Generating lecture content cards & key takeaways',
      '4. Creating 5 MCQs per chapter with distributed answers',
    ]);
    setActiveStage(0);
    setLoadingMessage('AlphaWave AI is generating your structured course...');

    try {
      const allPdfSources = [...uploadedPDFs];
      if (pdfNotesText.trim()) {
        allPdfSources.push({
          fileName: 'Module_Notes.txt',
          fileSize: pdfNotesText.length,
          summary: pdfNotesText.trim(),
        });
      }

      setActiveStage(1);
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          topic: topic.trim(),
          description: description.trim(),
          difficulty,
          duration,
          addVideo,
          noOfChapters,
          language,
          pdfSources: allPdfSources,
        }),
      });

      if (!response.ok) {
        throw new Error('Course generation failed');
      }

      setActiveStage(3);
      const generatedCourse: Course = await response.json();
      onCourseCreated(generatedCourse);
      setTimeout(() => {
        setIsLoading(false);
        navigate(`/course/${generatedCourse.id}`);
      }, 500);
    } catch (error) {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Top Header Row matching Screenshots 3, 4, 5 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Create AI Course
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Generate custom educational courses with lecture notes, videos, and handwritten answer evaluations
          </p>

          {/* Mode Pill Toggle from Screenshot 3 */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 mt-6 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'wizard'
                  ? 'bg-[#8150E8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Wizard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-[#8150E8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Generate from PDF Notes</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW A: INTERACTIVE STEPPER WIZARD (Screenshots 3, 4, 5) */}
        {/* ======================================================== */}
        {activeTab === 'wizard' && (
          <div className="space-y-8">
            {/* 3-Step Stepper Header matching Screenshots 3, 4, 5 */}
            <div className="flex items-center justify-center max-w-md mx-auto">
              {/* Step 1: Category */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    currentStep === 1
                      ? 'bg-[#8150E8] text-white ring-4 ring-purple-100'
                      : currentStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
                <span
                  className={`text-xs mt-2 font-bold ${
                    currentStep === 1 ? 'text-[#8150E8]' : currentStep > 1 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  Category
                </span>
              </div>

              {/* Connecting Line 1 */}
              <div
                className={`flex-1 h-0.5 mx-3 -mt-5 transition-colors ${
                  currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />

              {/* Step 2: Topic & Desc */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    currentStep === 2
                      ? 'bg-[#8150E8] text-white ring-4 ring-purple-100'
                      : currentStep > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </button>
                <span
                  className={`text-xs mt-2 font-bold ${
                    currentStep === 2 ? 'text-[#8150E8]' : currentStep > 2 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  Topic & Desc
                </span>
              </div>

              {/* Connecting Line 2 */}
              <div
                className={`flex-1 h-0.5 mx-3 -mt-5 transition-colors ${
                  currentStep === 3 ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />

              {/* Step 3: Course Options */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (topic.trim()) setCurrentStep(3);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    currentStep === 3
                      ? 'bg-[#8150E8] text-white ring-4 ring-purple-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                </button>
                <span
                  className={`text-xs mt-2 font-bold ${
                    currentStep === 3 ? 'text-[#8150E8]' : 'text-slate-400'
                  }`}
                >
                  Course Options
                </span>
              </div>
            </div>

            {/* STEP 1 CARD: SELECT COURSE CATEGORY (Screenshot 3) */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Select Course Category
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose the academic or professional domain for your course.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#8150E8] bg-purple-50/70 shadow-sm ring-2 ring-purple-200'
                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform"
                          style={{
                            backgroundColor: isSelected ? '#8150E8' : cat.bg,
                            color: isSelected ? '#FFFFFF' : cat.color,
                          }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isSelected ? 'text-[#8150E8]' : 'text-slate-800'
                          }`}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <span>Next: Topic & Desc</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 CARD: COURSE TOPIC & DESCRIPTION (Screenshot 4) */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Course Topic & Description
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Specify what you want to learn or teach.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Topic Field */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        COURSE TOPIC *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const suggestions = topicSuggestions[category] || topicSuggestions.Programming;
                          const randomSug = suggestions[Math.floor(Math.random() * suggestions.length)];
                          setTopic(randomSug);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8150E8] hover:underline"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Topic Suggestions</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Introduction to SQL for Beginners"
                      className="w-full px-4 py-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors font-medium text-slate-900 bg-white"
                      required
                    />

                    {/* Quick suggestion pills */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {(topicSuggestions[category] || topicSuggestions.Programming).slice(0, 3).map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleApplySuggestion(sug)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-purple-50 hover:text-[#8150E8] rounded-lg transition-colors border border-slate-200/80"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      COURSE DESCRIPTION
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about concepts you want covered (e.g. database operations, filtering with WHERE, joins, and aggregates)..."
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors resize-none text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-1.5 px-6 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>← Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!topic.trim()) {
                        alert('Please enter a course topic before continuing.');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <span>Next: Course Options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 CARD: COURSE OPTIONS & VIDEO PREFERENCE (Screenshot 5) */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Course Options & Video Preference
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose difficulty, duration, and video tutorials.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Row 1: Difficulty Level & Course Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        DIFFICULTY LEVEL
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8]"
                      >
                        <option value="Advance">Advance (Professional)</option>
                        <option value="Beginner">Beginner (Foundational)</option>
                        <option value="Intermediate">Intermediate (Practical)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        COURSE DURATION
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8]"
                      >
                        <option value="1 hour">1 Hour (Fast-Track Full Tutorial)</option>
                        <option value="2 hours">2 Hours (Comprehensive Study)</option>
                        <option value="3 hours">3 Hours (Deep Dive Masterclass)</option>
                        <option value="5 hours">5 Hours (Full Certification Curriculum)</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                        Choosing a shorter duration provides a lengthy full-course tutorial video covering everything in one go.
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Number of Chapters & Include Video Tutorials? */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                        NUMBER OF CHAPTERS
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[3, 5, 8].map((count) => {
                          const isSelected = noOfChapters === count;
                          return (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setNoOfChapters(count)}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'border-[#8150E8] bg-purple-50 text-[#8150E8] ring-1 ring-[#8150E8]'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                              }`}
                            >
                              {count} Chapters
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                        INCLUDE VIDEO TUTORIALS?
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Yes', 'No'] as const).map((opt) => {
                          const isSelected = addVideo === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setAddVideo(opt)}
                              className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'border-[#8150E8] bg-purple-50 text-[#8150E8] ring-1 ring-[#8150E8]'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-1.5 px-6 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>← Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateCourseLayout}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/35 active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Course</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW B: GENERATE FROM PDF NOTES (Uploaded Syllabus Mode)  */}
        {/* ======================================================== */}
        {activeTab === 'pdf' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Upload Syllabus or Module Notes (PDF)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Attach your syllabus or module PDFs (e.g. Module 1 DBMS). AI will extract the unit outline, ignore out-of-scope topics, and build the course strictly from your notes.
              </p>
            </div>

            {/* Dropzone */}
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-200 hover:border-[#8150E8] bg-purple-50/20 hover:bg-purple-50/50 rounded-2xl cursor-pointer transition-all group text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8150E8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800 group-hover:text-[#8150E8]">
                + Upload Syllabus or Module PDF
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports .pdf, .txt, .docx files
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Uploaded Documents List */}
            {uploadedPDFs.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attached Syllabus Documents ({uploadedPDFs.length})
                </h4>
                <div className="space-y-2">
                  {uploadedPDFs.map((pdf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">
                            {pdf.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(pdf.fileSize / 1024).toFixed(1)} KB · Active Syllabus
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePDF(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Course Topic & Parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Course Topic (Auto-filled from PDF)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Relational Data Model & ER Diagrams"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Number of Chapters
                  </label>
                  <select
                    value={noOfChapters}
                    onChange={(e) => setNoOfChapters(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={3}>3 Chapters</option>
                    <option value={5}>5 Chapters</option>
                    <option value={8}>8 Chapters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Total Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="1 hour">1 hour (Fast-Track)</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="5 hours">5 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateCourseLayout}
                disabled={isLoading || (!topic.trim() && uploadedPDFs.length === 0)}
                className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/35 active:scale-95 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#8150E8' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Course from PDF Notes</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <LoadingModal
        isOpen={isLoading}
        message={
          uploadedPDFs.length > 0
            ? 'Evaluating Syllabus & Generating Course with Curated English Lectures...'
            : 'Gemini AI is generating your structured course, English video flow, and assessments...'
        }
      />
    </div>
  );
};
