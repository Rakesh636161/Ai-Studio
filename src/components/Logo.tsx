import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', linkTo = '/' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Modern Purple Course Studio Icon */}
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #8150E8 0%, #6832db 100%)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-white"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h7" />
          <circle cx="16" cy="14" r="2" fill="currentColor" />
        </svg>
      </div>

      <span className={`${textSizes[size]} font-bold text-slate-900 tracking-tight`}>
        Course <span style={{ color: '#8150E8' }}>Studio</span>
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
