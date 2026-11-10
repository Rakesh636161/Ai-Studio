import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Trash2,
  Layers,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { PDFDocument, User, Course } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface PdfToCoursePageProps {
  user: User;
  courses: Course[];
  onRefreshCourses: () => void;
  onLogout: () => void;
}

export const PdfToCoursePage: React.FC<PdfToCoursePageProps> = ({
  user,
  courses,
  onRefreshCourses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conversion options
  const [targetLevel, setTargetLevel] = useState<'Beginner' | 'Intermediate' | 'Advance'>('Beginner');
  const [targetChapters, setTargetChapters] = useState(5);

  const fetchPdfDocuments = async () => {
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch('/api/pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.documents && data.documents.length > 0 && !selectedDoc) {
          setSelectedDoc(data.documents[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load PDFs:', err);
    }
  };

  useEffect(() => {
    fetchPdfDocuments();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Please select a valid PDF document.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit. Please upload a smaller document.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(15);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTitle', file.name.replace(/\.pdf$/i, ''));

    const token = localStorage.getItem('coursestudio_token') || user.id;

    try {
      setUploadProgress(45);
      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text and analyze PDF document.');
      }

      setUploadProgress(100);
      setDocuments(prev => [data.document, ...prev.filter(d => d.id !== data.document.id)]);
      setSelectedDoc(data.document);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading document.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!selectedDoc) return;
    setIsConverting(true);
    const token = localStorage.getItem('coursestudio_token') || user.id;

    try {
      const res = await fetch(`/api/pdf/${selectedDoc.id}/create-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          difficulty: targetLevel,
          chaptersCount: targetChapters,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate course from document.');
      }

      onRefreshCourses();
      navigate(`/course/${data.course.id}`);
    } catch (err: any) {
      alert(err.message || 'Error converting PDF to course');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this PDF document?')) return;
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      await fetch(`/api/pdf/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error(err);
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              PDF to Course Converter
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload textbook chapters, university lecture notes, or research papers. AlphaWave AI extracts concepts and generates an interactive course with targeted videos and quizzes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Upload Dropzone & Document Library */}
            <div className="lg:col-span-5 space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="bg-white dark:bg-slate-900 border-2 border-dashed border-purple-200 dark:border-purple-900/50 hover:border-[#8150E8] rounded-3xl p-8 text-center transition-all shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upload PDF Document
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Drag and drop your file here, or click to browse (up to 20MB)
                </p>

                {uploadError && (
                  <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Extracting and analyzing text...</span>
                      <span className="font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#8150E8] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  {isUploading ? 'Processing Document...' : 'Select PDF File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Uploaded Documents ({documents.length})
                  </h3>
                </div>

                {documents.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {documents.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-50/70 dark:bg-purple-950/30 border-[#8150E8] text-purple-900 dark:text-purple-200'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-purple-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#8150E8]' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB · {doc.mainTopics?.length || 0} topics
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No documents uploaded yet. Upload a PDF above to begin.
                  </p>
                )}
              </div>
            </div>

            {/* Right 7 Cols: Document Analysis Preview & Course Generation Controls */}
            <div className="lg:col-span-7">
              {selectedDoc ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Document Header */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#8150E8] mb-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Extracted & Analyzed Document</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {selectedDoc.fileName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {selectedDoc.summary || 'Document analyzed successfully with extracted learning objectives.'}
                    </p>
                  </div>

                  {/* Main Topics & Important Concepts */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                      Extracted Core Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.mainTopics && selectedDoc.mainTopics.length > 0 ? (
                        selectedDoc.mainTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50"
                          >
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">General Curriculum Content</span>
                      )}
                    </div>
                  </div>

                  {/* Document Text Sample Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Text Extraction Preview
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono max-h-36 overflow-y-auto leading-relaxed border border-slate-200/60 dark:border-slate-700/60">
                      {selectedDoc.extractedText
                        ? selectedDoc.extractedText.slice(0, 700) + '...'
                        : 'No text extracted.'}
                    </div>
                  </div>

                  {/* Course Generation Configuration */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
                      Course Generation Settings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                          Target Difficulty Level
                        </label>
                        <select
                          value={targetLevel}
                          onChange={(e) => setTargetLevel(e.target.value as any)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="Beginner">Beginner (Foundational)</option>
                          <option value="Intermediate">Intermediate (Applied)</option>
                          <option value="Advance">Advanced (Deep Dive)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                          Lecture Chapters to Generate
                        </label>
                        <select
                          value={targetChapters}
                          onChange={(e) => setTargetChapters(parseInt(e.target.value, 10))}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value={3}>3 Chapters (Fast Summary)</option>
                          <option value={5}>5 Chapters (Standard Curriculum)</option>
                          <option value={7}>7 Chapters (Comprehensive Masterclass)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={isConverting}
                      className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: '#8150E8' }}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating AI Course from Document...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Interactive Course from this PDF</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No Document Selected
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Upload a new PDF on the left or select an existing document to view extracted topics and generate your course.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
