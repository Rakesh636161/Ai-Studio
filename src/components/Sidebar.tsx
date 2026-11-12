import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  FileText,
  Bot,
  TrendingUp,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Moon,
  Sun,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { Logo } from './Logo';
import { Course, User } from '../types';

interface SidebarProps {
  courses?: Course[];
  user?: User | null;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  courses = [],
  user,
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const createdCount = courses.length;

  // Dark mode state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('alphawave_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('alphawave_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alphawave_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const isDeveloperAdmin = Boolean(
    user?.email && user.email.trim().toLowerCase() === 'rakiraki2529@gmail.com'
  );

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Course Generator', path: '/create-course', icon: Sparkles },
    { name: 'My Courses', path: '/my-courses', icon: BookOpen, badge: createdCount },
    { name: 'Video Analyzer', path: '/video-analysis', icon: Video },
    { name: 'PDF to Course', path: '/pdf-to-course', icon: FileText },
    { name: 'AI Tutor', path: '/ai-tutor', icon: Bot },
    { name: 'Learning Progress', path: '/progress', icon: TrendingUp },
    { name: 'Certificates', path: '/certificates', icon: Award },
    { name: 'Profile & Settings', path: '/profile', icon: Settings },
    { name: 'Help & Support', path: '/help', icon: HelpCircle },
    ...(isDeveloperAdmin ? [{ name: 'Admin Portal', path: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('coursestudio_token');
      localStorage.removeItem('coursestudio_user');
      navigate('/auth');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-slate-800">
          <Logo size="md" linkTo="/dashboard" />
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: '#8150E8' } : {}
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 dark:bg-purple-950 text-[#8150E8] dark:text-purple-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Controls: Dark Mode Toggle & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-between w-full px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {isDark ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
