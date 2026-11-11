import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Award, ShieldCheck, CheckCircle2, Download, Printer, ExternalLink, Sparkles } from 'lucide-react';
import { Certificate } from '../types';

interface CertificateViewProps {
  certificate: Certificate;
  onPrint?: () => void;
  showActions?: boolean;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  certificate,
  onPrint,
  showActions = true,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const certRef = useRef<HTMLDivElement>(null);

  const fullVerificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify-certificate/${encodeURIComponent(certificate.certificateId)}`
    : certificate.verificationUrl;

  useEffect(() => {
    QRCode.toDataURL(
      fullVerificationUrl,
      {
        width: 140,
        margin: 1,
        color: {
          dark: '#1e1b4b', // deep indigo
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [fullVerificationUrl]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer Certificate Frame - Landscape A4 Proportion (1.414 : 1) */}
      <div
        ref={certRef}
        id="printable-certificate"
        className="w-full max-w-[980px] aspect-[1.414/1] bg-white text-slate-900 rounded-none shadow-2xl relative overflow-hidden select-none border-[12px] border-[#0f172a] p-3 sm:p-5 flex flex-col justify-between print:m-0 print:border-[8px] print:shadow-none print:w-full print:h-screen print:max-w-none"
        style={{
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Ornate Inner Double Border with Corner Accents */}
        <div className="w-full h-full border-2 border-indigo-200/90 relative flex flex-col justify-between p-6 sm:p-10 bg-radial from-slate-50/50 via-white to-purple-50/30 overflow-hidden">
          
          {/* Subtle Guilloche / Geometric Background Watermark Pattern */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern id="cert-guilloche" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="28" fill="none" stroke="#4f46e5" strokeWidth="0.75" />
                <circle cx="30" cy="30" r="20" fill="none" stroke="#8150e8" strokeWidth="0.5" />
                <path d="M 0 30 Q 30 0 60 30 Q 30 60 0 30" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                <path d="M 30 0 Q 60 30 30 60 Q 0 30 30 0" fill="none" stroke="#6366f1" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-guilloche)" />
          </svg>

          {/* Elegant Top-Left & Top-Right Curved Ribbon Elements (Inspired by Reference Design) */}
          <div className="absolute -top-16 -left-16 w-48 h-48 pointer-events-none opacity-90">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0 0 L180 0 C120 40 80 80 40 180 L0 180 Z" fill="#1e1b4b" />
              <path d="M0 0 L150 0 C100 35 70 70 35 150 L0 150 Z" fill="#4f46e5" />
              <path d="M0 0 L120 0 C80 30 55 55 25 120 L0 120 Z" fill="#8150e8" />
              <path d="M0 0 L90 0 C60 25 40 40 20 90 L0 90 Z" fill="#d97706" />
            </svg>
          </div>

          <div className="absolute -bottom-16 -right-16 w-48 h-48 pointer-events-none opacity-90 rotate-180">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0 0 L180 0 C120 40 80 80 40 180 L0 180 Z" fill="#1e1b4b" />
              <path d="M0 0 L150 0 C100 35 70 70 35 150 L0 150 Z" fill="#4f46e5" />
              <path d="M0 0 L120 0 C80 30 55 55 25 120 L0 120 Z" fill="#8150e8" />
              <path d="M0 0 L90 0 C60 25 40 40 20 90 L0 90 Z" fill="#d97706" />
            </svg>
          </div>

          {/* Decorative Corner Filigree Stamps */}
          <div className="absolute top-2 right-2 text-indigo-300 pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M40 0 L40 30 C30 30 20 20 20 0 Z" fill="#4f46e5" opacity="0.4" />
              <path d="M40 0 L10 0 C10 10 20 20 40 20 Z" fill="#8150e8" opacity="0.3" />
            </svg>
          </div>
          <div className="absolute bottom-2 left-2 text-indigo-300 pointer-events-none rotate-180">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M40 0 L40 30 C30 30 20 20 20 0 Z" fill="#4f46e5" opacity="0.4" />
              <path d="M40 0 L10 0 C10 10 20 20 40 20 Z" fill="#8150e8" opacity="0.3" />
            </svg>
          </div>

          {/* Header Section: Brand, Seal & Title */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Top Brand Tag */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1e1b4b] to-[#8150e8] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                AlphaWave <span className="text-[#8150E8]">AI</span>
              </span>
            </div>
            
            <p className="text-[9px] sm:text-[10px] tracking-[0.28em] font-bold uppercase text-slate-500 mb-3">
              Official Academic Board of Credentialing & Examination
            </p>

            {/* Certificate Big Heading */}
            <div className="relative my-1">
              <h1
                className="text-2xl sm:text-4xl lg:text-[42px] font-black uppercase tracking-[0.16em] text-[#1e1b4b]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Certificate of Mastery
              </h1>
              <div className="w-36 sm:w-56 h-1 bg-gradient-to-r from-transparent via-[#8150E8] to-transparent mx-auto mt-2" />
            </div>

            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-slate-500 mt-2 font-sans">
              This credential is professionally awarded to
            </p>
          </div>

          {/* Central Recipient & Course Section */}
          <div className="relative z-10 text-center my-auto py-1 sm:py-2">
            {/* Recipient Name */}
            <div className="inline-block relative mb-1.5">
              <h2
                className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-[#0f172a] uppercase px-6 py-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {certificate.userName || 'STUDENT'}
              </h2>
              <div className="w-full h-0.5 bg-gradient-to-r from-indigo-300 via-indigo-600 to-indigo-300 mx-auto mt-1" />
            </div>

            <p className="text-[10px] sm:text-xs text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed uppercase tracking-wider font-sans font-semibold">
              For successfully completing the comprehensive learning requirements, practical assessments, and final examination in:
            </p>

            {/* Prominent High-Contrast Course Title Banner */}
            <div className="mt-3 inline-block max-w-full px-6 sm:px-10 py-2 sm:py-2.5 bg-gradient-to-r from-purple-50/80 via-indigo-50/90 to-purple-50/80 border-y-2 border-[#4f46e5] rounded-none shadow-2xs">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#8150E8] block mb-0.5">
                Official Certified Course Curriculum
              </span>
              <h3
                className="text-xl sm:text-3xl lg:text-[32px] font-black uppercase text-[#1e1b4b] tracking-wide"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {certificate.courseTitle || 'DATABASE MANAGEMENT SYSTEMS (DBMS)'}
              </h3>
            </div>
          </div>

          {/* Bottom Section: Signatures, Emblem Seal, QR Code & Credentials */}
          <div className="relative z-10 pt-4 border-t border-slate-200/80">
            <div className="grid grid-cols-3 items-end gap-4">
              
              {/* Left Column: Academic Signatures & Issue Date */}
              <div className="text-left space-y-3">
                <div>
                  <div className="font-serif italic text-lg sm:text-xl text-slate-800 tracking-wide select-none">
                    Dr. Eric V. Thorne
                  </div>
                  <div className="w-36 h-px bg-slate-400 mt-0.5" />
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Director of Academic Affairs
                  </p>
                </div>

                <div className="text-[10px] sm:text-xs text-slate-600">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Issue Date</span>
                  <span className="font-semibold text-slate-900">{certificate.issueDate}</span>
                </div>
              </div>

              {/* Center Column: Golden Academic Rosette Emblem Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  {/* Rosette SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <circle cx="50" cy="50" r="46" fill="#1e1b4b" stroke="#d97706" strokeWidth="2" />
                    <circle cx="50" cy="50" r="41" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="50" cy="50" r="36" fill="#4338ca" />
                    
                    {/* Laurel Wreath */}
                    <path
                      d="M26 50 C26 36 36 26 50 26 C64 26 74 36 74 50"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M28 50 C28 62 38 72 50 72 C62 72 72 62 72 50"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Ribbon Hanging from Seal */}
                  <div className="absolute -bottom-3 flex gap-1">
                    <div className="w-3 h-5 bg-[#d97706] rounded-b-xs transform -rotate-12 shadow-xs" />
                    <div className="w-3 h-5 bg-[#8150e8] rounded-b-xs transform rotate-12 shadow-xs" />
                  </div>

                  {/* Centered Star & Score */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-200 mt-0.5">
                      {certificate.score}%
                    </span>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#1e1b4b] uppercase block">
                    Verified Academic Credential
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                    Grade: Distinction ({certificate.score}%)
                  </span>
                </div>
              </div>

              {/* Right Column: Verification QR Code & Certificate ID */}
              <div className="flex flex-col items-end text-right space-y-2">
                {qrCodeDataUrl ? (
                  <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <img
                      src={qrCodeDataUrl}
                      alt="Verification QR Code"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] text-slate-400">
                    QR Code
                  </div>
                )}

                <div className="space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                    Certificate ID
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-[#1e1b4b] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {certificate.certificateId}
                  </span>
                </div>

                <p className="text-[8px] sm:text-[9px] text-slate-400">
                  Scan to verify on blockchain-ready cryptographic registry.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Only visible on screen, hidden in print mode) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[980px] mt-6 px-2 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public Verification URL:</span>
            <a
              href={fullVerificationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#8150E8] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>{certificate.certificateId}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: '#8150E8' }}
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
