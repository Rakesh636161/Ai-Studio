import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Share2,
} from 'lucide-react';
import { Certificate, Course, User } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface CertificatesPageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({
  user,
  courses,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedCertModal, setSelectedCertModal] = useState<Certificate | null>(null);
  const [generateError, setGenerateError] = useState('');

  const fetchCertificates = async () => {
    const token = localStorage.getItem('coursestudio_token') || user.id;
    try {
      const res = await fetch('/api/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.warn('Could not fetch certificates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleClaimCertificate = async (courseId: string) => {
    setGenerateError('');
    setIsGenerating(courseId);
    const token = localStorage.getItem('coursestudio_token') || user.id;

    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate certificate.');
      }

      setCertificates((prev) => [data.certificate, ...prev.filter((c) => c.id !== data.certificate.id)]);
      setSelectedCertModal(data.certificate);
    } catch (err: any) {
      setGenerateError(err.message || 'Eligibility criteria not met.');
    } finally {
      setIsGenerating(null);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
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
              Official Course Certificates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verify your achievements, claim credentials upon 100% curriculum completion, and share verifiable diplomas.
            </p>
          </div>

          {generateError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generateError}</span>
            </div>
          )}

          {/* Section 1: Earned Certificates */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#8150E8]" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Earned Credentials ({certificates.length})
              </h2>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-mono text-[11px] font-semibold text-[#8150E8]">
                          {cert.certificateId}
                        </span>
                        <span>{cert.issueDate}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {cert.courseTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Issued to <strong className="text-slate-700 dark:text-slate-200">{cert.userName}</strong> · Score: {cert.score}%
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedCertModal(cert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                        style={{ backgroundColor: '#8150E8' }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Diploma</span>
                      </button>

                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-md">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Certificates Earned Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete all lectures and score 75% or higher on assessments to unlock your certificate below.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Course Eligibility Tracker */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Course Certificate Eligibility Tracker
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
                const totalChs = course.chapters?.length || 1;
                const completedChs = course.chapters?.filter((c) => c.completed).length || 0;
                const isComplete = completedChs >= totalChs || (course.progress || 0) >= 100;
                const hasCert = certificates.some((c) => c.courseId === course.id);

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {completedChs} of {totalChs} chapters completed · {course.progress || 0}% progress
                      </p>
                    </div>

                    <div className="shrink-0">
                      {hasCert ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Earned</span>
                        </span>
                      ) : isComplete ? (
                        <button
                          onClick={() => handleClaimCertificate(course.id)}
                          disabled={isGenerating === course.id}
                          className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                          style={{ backgroundColor: '#8150E8' }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isGenerating === course.id ? 'Issuing...' : 'Claim Certificate'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/course/${course.id}/start`)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Complete {totalChs - completedChs} Left
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Printable / Downloadable Certificate Modal */}
      {selectedCertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedCertModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Template */}
            <div
              id="printable-certificate"
              className="border-8 border-double border-[#8150E8]/30 p-8 sm:p-12 rounded-2xl text-center bg-radial from-white via-[#FAF7FF] to-white relative"
            >
              {/* Official Seal Watermark */}
              <div className="mb-4">
                <span className="text-2xl font-black tracking-tight text-[#8150E8]">
                  AlphaWave AI
                </span>
                <p className="text-[10px] tracking-widest text-slate-400 uppercase mt-0.5 font-bold">
                  Certificate of Academic Mastery
                </p>
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-widest my-4">
                This is proudly presented to
              </p>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight underline decoration-[#8150E8] decoration-2 underline-offset-8">
                {selectedCertModal.userName}
              </h2>

              <p className="text-xs text-slate-600 max-w-lg mx-auto mt-6 leading-relaxed">
                For successfully fulfilling all educational requirements, mastering core concepts, and passing the comprehensive lecture assessments for:
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-[#8150E8] mt-2 mb-6">
                {selectedCertModal.courseTitle}
              </h3>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-lg mx-auto text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Issued Date</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCertModal.issueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Score Achieved</p>
                  <p className="font-semibold text-emerald-600 mt-0.5">{selectedCertModal.score}% Passed</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Certificate ID</p>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5 text-[11px] truncate">
                    {selectedCertModal.certificateId}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <a
                href={selectedCertModal.verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8150E8] hover:underline"
              >
                <span>Public Verification URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
