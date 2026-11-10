import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Compass, Download, Github } from 'lucide-react';
import { Logo } from './Logo';
import { ExportModal } from './ExportModal';
import { User } from '../types';

interface NavbarProps {
  user?: User | null;
  onMenuToggle?: () => void;
  onOpenSidebar?: () => void;
  showCreateButton?: boolean;
  onEditProfile?: () => void;
  onOpenProfileModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onMenuToggle,
  onOpenSidebar,
  showCreateButton = false,
  onEditProfile,
  onOpenProfileModal,
}) => {
  const navigate = useNavigate();
  const [showExportModal, setShowExportModal] = useState(false);
  const handleToggle = onOpenSidebar || onMenuToggle;
  const handleProfile = onOpenProfileModal || onEditProfile;


  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 sm:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          {handleToggle && (
            <button
              onClick={handleToggle}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <Logo size="md" linkTo={user ? '/dashboard' : '/'} />
        </div>


        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick ZIP / GitHub Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#8150E8] bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl transition-all shadow-2xs"
            title="Download Project ZIP or Push to GitHub"
          >
            <Download className="w-3.5 h-3.5 text-[#8150E8]" />
            <span className="hidden xs:inline">Download ZIP</span>
          </button>

          {!user ? (
            <>
              <button
                onClick={() => navigate('/dashboard/explore')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#8150E8] transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Courses</span>
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95"
                style={{ backgroundColor: '#8150E8' }}
              >
                Sign In
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {showCreateButton && (
                <button
                  onClick={() => navigate('/create-course')}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: '#8150E8' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create AI Course</span>
                </button>
              )}

              <button
                onClick={() => handleProfile ? handleProfile() : navigate('/profile')}
                className="flex items-center gap-2 p-1 pl-1.5 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors group cursor-pointer"
                title="Edit Profile & Photo"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-purple-200 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                  {user.name}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* GitHub & ZIP Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};
