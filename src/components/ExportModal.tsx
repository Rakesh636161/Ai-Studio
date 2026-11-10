import React, { useState } from 'react';
import {
  X,
  Download,
  Github,
  Copy,
  Check,
  FolderArchive,
  Info,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const gitPushCommand = `git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main --force`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-[#8150E8] rounded-xl">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export Code & Push to GitHub</h2>
              <p className="text-xs text-slate-500">Download clean project ZIP or push cleanly to your GitHub repository</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: One-Click ZIP Download */}
          <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Download Complete Project ZIP</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                    ~8.7 MB Clean
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Contains all source code, React components, server, assets, and config. Excludes bloated video files and node_modules so it downloads instantly.
                </p>
              </div>

              <a
                href="/api/download-zip"
                download="course-studio.zip"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#8150E8] hover:bg-[#703cdb] rounded-xl shadow-xs transition-transform active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download ZIP</span>
              </a>
            </div>
          </div>

          {/* Section 2: GitHub Push Instructions & Why it failed before */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Github className="w-4 h-4 text-slate-800" />
              <span>How to Push to GitHub</span>
            </div>

            {/* Why it was failing explanation */}
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex gap-3 text-xs text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Why your earlier push failed:</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  GitHub strictly rejects pushes containing any file larger than <strong>100 MB</strong> (<code>GH001: Large files detected</code>). Previously, an uploaded screen recording in <code>public/assets</code> was 113 MB. We have purged all large video files from Git history, added <code>*.mp4</code> to <code>.gitignore</code>, and compacted Git storage down to only <strong>8 MB</strong>.
                </p>
              </div>
            </div>

            {/* Step-by-step terminal commands */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-700">
                Run these commands in your project terminal to link and push to your GitHub repo:
              </div>

              <div className="relative group">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {gitPushCommand}
                </pre>
                <button
                  onClick={() => handleCopy(gitPushCommand, 'cmd')}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                >
                  {copiedStep === 'cmd' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* GitHub Auth Tips */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Terminal className="w-3.5 h-3.5 text-[#8150E8]" />
                  <span>If GitHub asks for Password:</span>
                </div>
                <p className="leading-relaxed">
                  GitHub no longer accepts account passwords in the terminal. Use a <strong>Personal Access Token (classic)</strong> with <code>repo</code> permissions:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
                  <li>Go to GitHub → <strong>Settings</strong> → <strong>Developer Settings</strong> → <strong>Personal access tokens</strong>.</li>
                  <li>Click <strong>Generate new token (classic)</strong>, check the <strong>repo</strong> scope, and copy the token.</li>
                  <li>When <code>git push</code> prompts for your Password, paste your generated token!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
