import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Check, ArrowLeft, ArrowRight, Sparkles, AlertCircle, Camera, Upload, Trash2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const SIGNUP_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  // Mode: 'signin' | 'signup' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forgot Password / Recreate Fields (Direct Password Recreation - No OTP Needed)
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status & Error
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validator
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Sign In or Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload = authMode === 'signup' 
        ? { name: fullName, email, password, avatarUrl: avatarUrl || undefined } 
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Store token and user
      localStorage.setItem('coursestudio_token', data.token);
      localStorage.setItem('coursestudio_user', JSON.stringify(data.user));

      onLogin(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Direct Password Recreation (No OTP)
  const handleRecreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/recreate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to recreate password.');
      }

      setSuccessMsg('Password recreated successfully! You can now sign in with your new password.');
      setEmail(forgotEmail.trim());
      setPassword('');
      setConfirmPassword('');
      setAuthMode('signin');
    } catch (err: any) {
      setError(err.message || 'Could not recreate password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFC]">
      {/* Left side: Hero Image with Dark Overlay Matching Screenshot 2 */}
      <div className="relative hidden lg:flex lg:w-1/2 min-h-screen bg-slate-950 overflow-hidden items-end p-12 lg:p-16">
        <img
          src="/src/assets/images/auth_hero_studio_1794057965531.jpg"
          alt="Course Studio Learning Workspace"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-6">
            <Logo size="lg" linkTo="/" />
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Welcome to Course Studio 🚀
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md mb-8">
            Generate customized courses, high-yield university exam summaries, and interactive video lessons with handwritten note evaluations.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full curriculum layout</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Integrated video lessons</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Handwritten answer evaluation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Email Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8 sm:p-10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {authMode === 'signup'
                ? 'Sign Up to Course Studio'
                : authMode === 'forgot_password'
                ? 'Recreate Password'
                : 'Sign In to Course Studio'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              {authMode === 'signup'
                ? 'Create your account to start generating courses'
                : authMode === 'forgot_password'
                ? 'Enter your registered email and set a new password directly'
                : 'Welcome back! Please enter your credentials'}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* MODE 1 & 2: SIGN IN OR SIGN UP */}
          {(authMode === 'signin' || authMode === 'signup') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  {/* Optional Profile Photo Upload */}
                  <div className="flex flex-col items-center justify-center pb-2 text-center">
                    <div className="relative group mb-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#8150E8] shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-sm bg-[#8150E8]"
                        >
                          {fullName.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-[#8150E8] text-white rounded-full shadow-md hover:bg-[#6f3fd4] transition-colors"
                        title="Upload Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#8150E8] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Or pick:</span>
                      {SIGNUP_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(av)}
                          className={`rounded-full border transition-transform hover:scale-105 ${
                            avatarUrl === av ? 'border-[#8150E8] ring-2 ring-purple-200' : 'border-transparent'
                          }`}
                        >
                          <img src={av} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Full Name"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />

                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMsg('');
                        setForgotEmail(email);
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setAuthMode('forgot_password');
                      }}
                      className="text-xs font-semibold text-[#8150E8] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
                {authMode === 'signup' && password && (
                  <div className="mt-1.5 px-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Password strength:</span>
                      <span className="font-semibold">{getPasswordStrength(password).label}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                        style={{ width: `${(getPasswordStrength(password).score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <span>{isLoading ? 'Processing...' : authMode === 'signup' ? 'Sign Up' : 'Sign In'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="mt-6 text-center text-xs text-slate-500">
                {authMode === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setAuthMode('signin');
                      }}
                      className="font-semibold text-[#8150E8] hover:underline ml-1 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setAuthMode('signup');
                      }}
                      className="font-semibold text-[#8150E8] hover:underline ml-1 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}

          {/* MODE 3: RECREATE PASSWORD DIRECTLY - NO OTP REQUIRED */}
          {authMode === 'forgot_password' && (
            <form onSubmit={handleRecreatePassword} className="space-y-4">
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 text-xs text-purple-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1 text-[#8150E8]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Instant Password Recreation</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Enter your registered email address and immediately set your new password. No email codes or OTP verification required.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
                {newPassword && (
                  <div className="mt-1.5 px-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Password strength:</span>
                      <span className="font-semibold">{getPasswordStrength(newPassword).label}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`}
                        style={{ width: `${(getPasswordStrength(newPassword).score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: '#8150E8' }}
              >
                <span>{isLoading ? 'Recreating Password...' : 'Recreate Password'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthMode('signin');
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mt-2 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
