import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  BookOpen,
  Search,
  Copy,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Certificate } from '../types';
import { Logo } from '../components/Logo';

export const VerifyCertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState(id || '');
  const [copied, setCopied] = useState(false);

  const verifyId = async (certId: string) => {
    if (!certId.trim()) return;
    setLoading(true);
    setError('');
    setCert(null);

    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(certId.trim())}`);
      const data = await res.json();
      if (res.ok && data.valid && data.certificate) {
        setCert(data.certificate);
      } else {
        setError(data.error || 'This certificate record could not be found or verified.');
      }
    } catch (err: any) {
      setError('Network connection error while verifying credential.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchId(id);
      verifyId(id);
    }
  }, [id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify-certificate/${encodeURIComponent(searchId.trim())}`);
      verifyId(searchId.trim());
    }
  };

  const copyCertId = () => {
    if (cert?.certificateId) {
      navigator.clipboard.writeText(cert.certificateId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-slate-950 flex flex-col justify-between p-6">
      <div className="max-w-2xl mx-auto w-full pt-6">
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" linkTo="/" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AlphaWave</span>
          </Link>
        </div>

        {/* Certificate Lookup Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Credential Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify authentic AlphaWave AI course certificates and mastery scores.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-AW-1794-XXXX or CERT-...)"
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#8150E8]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchId.trim()}
              className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#8150E8' }}
            >
              {loading ? 'Verifying...' : 'Verify Credential'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#8150E8] flex items-center justify-center mx-auto mb-3 animate-spin">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Verifying Credential Authenticity...
            </h2>
            <p className="text-xs text-slate-400 mt-1">Checking AlphaWave AI cryptographic verification ledger...</p>
          </div>
        ) : cert ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-lg space-y-6">
            {/* Status Banner */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    Verified Authentic Certificate
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Officially issued by AlphaWave AI following verified assessment completion.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 rounded-xl border border-emerald-300 transition-colors hover:bg-emerald-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>

            {/* Credential Details */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Recipient Learner</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {cert.userName}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Issue Date</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {cert.issueDate}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Curriculum Completed</span>
                </div>
                <p className="text-base font-bold text-[#8150E8]">
                  {cert.courseTitle}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Certificate Verification ID</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cert.certificateId}
                    </p>
                    <button
                      onClick={copyCertId}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Copy ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Mastery Assessment</p>
                  <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                    {cert.score}% Score
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Certificate Not Found
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {error}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 text-center shadow-xs">
            <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Enter a Certificate ID to Verify
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              AlphaWave AI issues unique cryptographically logged certificate IDs for every completed curriculum.
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-6">
        © 2026 AlphaWave AI. All rights reserved. Official cryptographic certification registry.
      </div>
    </div>
  );
};
