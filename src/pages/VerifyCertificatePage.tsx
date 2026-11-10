import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, XCircle, ArrowLeft, Calendar, User as UserIcon, BookOpen } from 'lucide-react';
import { Certificate } from '../types';
import { Logo } from '../components/Logo';

export const VerifyCertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const verify = async () => {
      try {
        const res = await fetch(`/api/certificates/${id}`);
        const data = await res.json();
        if (res.ok && data.valid && data.certificate) {
          setCert(data.certificate);
        } else {
          setError(data.error || 'This certificate record could not be verified.');
        }
      } catch (err: any) {
        setError('Network error while verifying credential.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [id]);

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
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  Verified Authentic Certificate
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  This educational credential was officially issued by AlphaWave AI following verified assessment completion.
                </p>
              </div>
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
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {cert.certificateId}
                  </p>
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
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Certificate Not Found
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {error || 'The requested certificate ID could not be located in the verification ledger.'}
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
