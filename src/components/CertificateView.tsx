import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Award, ShieldCheck, Printer, ExternalLink, Sparkles } from 'lucide-react';
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
        width: 150,
        margin: 1,
        color: {
          dark: '#0A192F', // Deep Navy Blue
          light: '#FFFFFF',
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

  const exactCourseTitle = certificate.courseTitle?.trim() || 'Course';

  // Format student name in elegant title case for script font
  const studentDisplayName = certificate.userName
    ? certificate.userName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Honored Student';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer Certificate Frame - Landscape A4 Proportion (1.414 : 1) */}
      <div
        ref={certRef}
        id="printable-certificate"
        className="w-full max-w-[1000px] aspect-[1.414/1] bg-white text-slate-900 rounded-none shadow-2xl relative overflow-hidden select-none border-[12px] border-[#0A192F] p-4 sm:p-5 flex flex-col justify-between print:m-0 print:border-[8px] print:shadow-none print:w-full print:h-screen print:max-w-none"
        style={{
          boxShadow: '0 25px 60px -15px rgba(10, 25, 47, 0.35)',
        }}
      >
        {/* Inner Ornate Double Border with Corner Brackets */}
        <div className="w-full h-full border-2 border-[#1E3A8A]/30 relative flex flex-col justify-between p-5 sm:p-8 bg-white overflow-hidden">
          
          {/* Subtle Security Guilloche Watermark Pattern */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern id="cert-guilloche" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="28" fill="none" stroke="#2563EB" strokeWidth="0.8" />
                <circle cx="30" cy="30" r="20" fill="none" stroke="#38BDF8" strokeWidth="0.6" />
                <circle cx="30" cy="30" r="12" fill="none" stroke="#0A192F" strokeWidth="0.5" />
                <path d="M 0 30 Q 30 0 60 30 Q 30 60 0 30" fill="none" stroke="#1E3A8A" strokeWidth="0.5" />
                <path d="M 30 0 Q 60 30 30 60 Q 0 30 30 0" fill="none" stroke="#1E3A8A" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-guilloche)" />
          </svg>

          {/* Top-Left Elegant Curved Wave Ribbons (Navy, Royal Blue, Light Blue & Amber) */}
          <div className="absolute -top-14 -left-14 w-60 h-60 pointer-events-none opacity-95">
            <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Deep Navy Layer */}
              <path d="M0 0 L210 0 C140 45 90 95 45 210 L0 210 Z" fill="#0A192F" />
              {/* Royal Blue Layer */}
              <path d="M0 0 L175 0 C115 40 75 80 35 175 L0 175 Z" fill="#1D4ED8" />
              {/* Light Sky Blue Wave Layer */}
              <path d="M0 0 L140 0 C90 32 60 62 25 140 L0 140 Z" fill="#38BDF8" />
              {/* Warm Golden Ribbon Accent */}
              <path d="M0 0 L105 0 C70 25 45 45 18 105 L0 105 Z" fill="#D97706" />
            </svg>
          </div>

          {/* Bottom-Right Matching Curved Wave Ribbons */}
          <div className="absolute -bottom-14 -right-14 w-60 h-60 pointer-events-none opacity-95 rotate-180">
            <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0 0 L210 0 C140 45 90 95 45 210 L0 210 Z" fill="#0A192F" />
              <path d="M0 0 L175 0 C115 40 75 80 35 175 L0 175 Z" fill="#1D4ED8" />
              <path d="M0 0 L140 0 C90 32 60 62 25 140 L0 140 Z" fill="#38BDF8" />
              <path d="M0 0 L105 0 C70 25 45 45 18 105 L0 105 Z" fill="#D97706" />
            </svg>
          </div>

          {/* Corner Structural Accents */}
          <div className="absolute top-2 right-2 pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M40 0 L40 28 C28 28 18 18 18 0 Z" fill="#1D4ED8" opacity="0.3" />
              <path d="M40 0 L10 0 C10 10 20 20 40 20 Z" fill="#38BDF8" opacity="0.4" />
            </svg>
          </div>
          <div className="absolute bottom-2 left-2 pointer-events-none rotate-180">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M40 0 L40 28 C28 28 18 18 18 0 Z" fill="#1D4ED8" opacity="0.3" />
              <path d="M40 0 L10 0 C10 10 20 20 40 20 Z" fill="#38BDF8" opacity="0.4" />
            </svg>
          </div>

          {/* 1. Header Section: Brand, Institutional Board & Title */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Top AlphaWave AI Brand & Logo */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#0A192F] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0A192F] font-sans">
                AlphaWave <span className="text-[#2563EB]">AI</span>
              </span>
            </div>
            
            {/* Professional Institutional Heading */}
            <p className="text-[9px] sm:text-[10px] tracking-[0.28em] font-extrabold uppercase text-[#1E3A8A] mb-1.5">
              National Artificial Intelligence & Emerging Technologies Certification
            </p>

            {/* Large Elegant Title: CERTIFICATE OF COMPLETION */}
            <div className="relative my-0.5">
              <h1
                className="text-2xl sm:text-4xl lg:text-[38px] font-black uppercase tracking-[0.16em] text-[#0A192F]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
              >
                Certificate of Completion
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D97706] to-[#D97706]" />
                <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-l from-transparent via-[#D97706] to-[#D97706]" />
              </div>
            </div>

            {/* Exact Subtitle Phrasing Required */}
            <p className="text-[11px] sm:text-xs font-medium tracking-wider text-slate-500 mt-2 font-sans italic">
              This certificate is proudly presented to
            </p>
          </div>

          {/* 2. Central Student Name & Prominent Exact Course Title */}
          <div className="relative z-10 text-center my-auto py-1 sm:py-2">
            {/* Student's Actual Registered Name in Elegant Calligraphic Script Font */}
            <div className="inline-block relative mb-1">
              <h2
                className="text-4xl sm:text-6xl lg:text-[58px] text-[#0A192F] font-normal px-6 py-0.5 tracking-normal"
                style={{
                  fontFamily: "'Great Vibes', 'Alex Brush', cursive",
                  textShadow: '0 1px 2px rgba(10, 25, 47, 0.08)',
                }}
              >
                {studentDisplayName}
              </h2>
              <div className="w-48 sm:w-80 h-[1.5px] bg-gradient-to-r from-transparent via-[#1D4ED8] to-transparent mx-auto mt-0.5" />
            </div>

            {/* Course Completion Statement with Exact Dynamic Course Title */}
            <div className="mt-2.5 max-w-2xl mx-auto px-4">
              <p className="text-[12px] sm:text-[14px] text-slate-700 font-sans leading-relaxed">
                For successfully completing the course
              </p>
              <h3
                className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#0A192F] mt-1.5 tracking-tight"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
              >
                {exactCourseTitle}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans mt-1.5">
                Demonstrating comprehensive mastery of core concepts, rigorous practical chapter assessments, and final examination evaluation. Completed on {certificate.issueDate}.
              </p>
            </div>
          </div>

          {/* 3. Bottom Section: Signatures, Golden Rosette Seal, QR Code & Verifiable Credentials */}
          <div className="relative z-10 pt-3 border-t border-slate-200">
            <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
              
              {/* Left Column: Academic Signatures & Issue Date */}
              <div className="text-left space-y-2.5">
                <div>
                  <div className="font-serif italic text-base sm:text-xl text-[#0A192F] tracking-wide select-none font-bold">
                    Dr. Eric V. Thorne
                  </div>
                  <div className="w-32 sm:w-40 h-px bg-slate-400 mt-0.5" />
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Director of Academic Affairs
                  </p>
                </div>

                <div className="text-[10px] sm:text-xs text-slate-600">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Issue Date</span>
                  <span className="font-semibold text-slate-900">{certificate.issueDate}</span>
                </div>
              </div>

              {/* Center Column: Golden Academic Rosette Medal with Ribbons */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  {/* Rosette Medal Outer & Inner Rings */}
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <circle cx="50" cy="50" r="46" fill="#0A192F" stroke="#D97706" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="41" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="50" cy="50" r="35" fill="#1E3A8A" />
                    
                    {/* Laurel Wreath */}
                    <path
                      d="M26 50 C26 36 36 26 50 26 C64 26 74 36 74 50"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M28 50 C28 62 38 72 50 72 C62 72 72 62 72 50"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Ribbon Hanging from Seal */}
                  <div className="absolute -bottom-3 flex gap-1">
                    <div className="w-3.5 h-6 bg-[#D97706] rounded-b-xs transform -rotate-12 shadow-sm" />
                    <div className="w-3.5 h-6 bg-[#2563EB] rounded-b-xs transform rotate-12 shadow-sm" />
                  </div>

                  {/* Centered Star & Score */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white pb-1">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 mt-0.5">
                      {certificate.score}%
                    </span>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#0A192F] uppercase block">
                    Verified Academic Credential
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-300 inline-block mt-0.5">
                    Grade: Distinction ({certificate.score}%)
                  </span>
                </div>
              </div>

              {/* Right Column: Verification QR Code & Certificate ID */}
              <div className="flex flex-col items-end text-right space-y-1.5">
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
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-[#0A192F] bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-block">
                    {certificate.certificateId}
                  </span>
                </div>

                <p className="text-[8px] sm:text-[9px] text-slate-400 max-w-[150px]">
                  Scan QR code or visit URL to verify authentic record.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Only visible on screen, hidden in print mode) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[1000px] mt-6 px-2 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public Verification URL:</span>
            <a
              href={fullVerificationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#2563EB] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>{certificate.certificateId}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: '#0A192F' }}
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
