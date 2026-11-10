import React from 'react';
import { Loader2, Sparkles, Cpu } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
  stages?: string[];
  activeStageIndex?: number;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = 'Please wait... AI Working on your course',
  subMessage = 'Generating structured curriculum & chapters',
  stages,
  activeStageIndex = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center px-8 py-8 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full text-center">
        {/* Animated AI Gear Icon matching the video illustration */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full opacity-20 animate-ping"
            style={{ backgroundColor: '#8150E8' }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 transition-transform"
            style={{ backgroundColor: '#F3E8FF', border: '2px solid #8150E8' }}
          >
            <Cpu className="w-8 h-8 text-[#8150E8] animate-pulse" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>

        <h4 className="text-base font-bold text-slate-800 mb-1">
          {message}
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          {subMessage}
        </p>

        {stages && stages.length > 0 && (
          <div className="w-full text-left space-y-2 mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {stages.map((stg, sIdx) => {
              const isPast = sIdx < activeStageIndex;
              const isCurrent = sIdx === activeStageIndex;
              return (
                <div key={sIdx} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isPast
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-[#8150E8] text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isPast ? '✓' : sIdx + 1}
                  </div>
                  <span className={`${
                    isPast ? 'text-slate-600 line-through' : isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}>
                    {stg}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-[#8150E8] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#8150E8] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#8150E8] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
