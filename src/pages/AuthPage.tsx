import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Check, ArrowLeft, ArrowRight, Sparkles, AlertCircle, Camera, Upload, Trash2, KeyRound, Clock, RotateCcw } from 'lucide-react';
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

  // Forgot Password 3-step state: 1 = request email, 2 = enter 6-digit OTP, 3 = enter new password
  const [otpStep, setOtpStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{ delivered: boolean; provider: string } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status & Error
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validator
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Timer countdowns for OTP expiry & resend cooldown
  useEffect(() => {
    let interval: any = null;
    if (authMode === 'forgot_password' && otpStep === 2 && otpExpirySeconds > 0) {
      interval = setInterval(() => {
        setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, otpExpirySeconds]);

  useEffect(() => {
    let interval: any = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

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

  // Step 1: Request 6-Digit Email OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevOtpCode(null);

    if (!isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setDeliveryInfo({ delivered: !!data.emailDelivered, provider: data.provider || 'Local' });
      if (data.devOtp) {
        setDevOtpCode(data.devOtp);
      }
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setOtpStep(2);
      setSuccessMsg(
        data.emailDelivered
          ? `A 6-digit verification code has been dispatched to ${forgotEmail}. Please check your inbox and spam folder.`
          : `Verification session initialized for ${forgotEmail}. (Valid for 5 minutes).`
      );
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not resend verification code.');
      }
      if (data.devOtp) {
        setDevOtpCode(data.devOtp);
      }
      setDeliveryInfo({ delivered: !!data.emailDelivered, provider: data.provider || 'Local' });
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setSuccessMsg('A fresh 6-digit verification code has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Error resending code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      setResetToken(data.resetToken || '');
      setOtpStep(3);
      setSuccessMsg('Code verified successfully! You may now set your new password.');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password with Verified OTP Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword,
          resetToken,
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccessMsg('Password reset successful! You can now sign in with your new password.');
      setEmail(forgotEmail.trim());
      setPassword('');
      setConfirmPassword('');
      setAuthMode('signin');
      setOtpStep(1);
      setOtpCode('');
      setResetToken('');
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFC] dark:bg-slate-950">
      {/* Left side: Hero Image with Dark Overlay */}
      <div className="relative hidden lg:flex lg:w-1/2 min-h-screen bg-slate-950 overflow-hidden items-end p-12 lg:p-16">
        <img
          src="/src/assets/images/auth_hero_studio_1794057965531.jpg"
          alt="AlphaWave AI Learning Platform"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-6">
            <Logo size="lg" linkTo="/" />
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Welcome to AlphaWave AI 🚀
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md mb-8">
            Generate customized courses, high-yield learning modules, and interactive video lessons with grounded assessments and intelligent AI doubt solving.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full chapter curriculum with targeted concepts</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Separate, chapter-specific educational videos</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Interactive AI study notes and 5-MCQ assessments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {authMode === 'signup'
                ? 'Sign Up to AlphaWave AI'
                : authMode === 'forgot_password'
                ? otpStep === 1
                  ? 'Reset Your Password'
                  : otpStep === 2
                  ? 'Verify 6-Digit Code'
                  : 'Set New Password'
                : 'Sign In to AlphaWave AI'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {authMode === 'signup'
                ? 'Create your account to start generating personalized AI courses'
                : authMode === 'forgot_password'
                ? otpStep === 1
                  ? 'Enter your registered email to receive a 6-digit verification code'
                  : otpStep === 2
                  ? `Enter the 6-digit code sent to ${forgotEmail}`
                  : 'Create a secure new password for your account'
                : 'Welcome back! Please enter your credentials'}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 mb-4 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-4 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* MODE 1 & 2: SIGN IN / SIGN UP */}
          {authMode !== 'forgot_password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Profile Avatar (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <img
                          src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt="Avatar preview"
                          className="w-12 h-12 rounded-xl object-cover border-2 border-purple-200 dark:border-purple-800"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {SIGNUP_AVATARS.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setAvatarUrl(url)}
                              className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-transform hover:scale-105 ${
                                avatarUrl === url ? 'border-[#8150E8]' : 'border-transparent'
                              }`}
                            >
                              <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-semibold text-[#8150E8] hover:underline flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload custom photo</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarFile}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="learner@alphawave.ai"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMsg('');
                        setForgotEmail(email);
                        setOtpStep(1);
                        setAuthMode('forgot_password');
                      }}
                      className="text-[11px] font-semibold text-[#8150E8] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                  />
                </div>
                {authMode === 'signup' && password && (
                  <div className="mt-1.5 px-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Password strength:</span>
                      <span className="font-semibold">{getPasswordStrength(password).label}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                style={{ backgroundColor: '#8150E8' }}
              >
                <span>
                  {isLoading
                    ? authMode === 'signup'
                      ? 'Creating Account...'
                      : 'Signing In...'
                    : authMode === 'signup'
                    ? 'Create Free Account'
                    : 'Sign In to Dashboard'}
                </span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-4">
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

          {/* MODE 3: 3-STEP SECURE OTP PASSWORD RECOVERY */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {/* Stepper indicator */}
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    otpStep >= 1 ? 'bg-[#8150E8] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    1
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Email</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mx-2" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    otpStep >= 2 ? 'bg-[#8150E8] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    2
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">OTP</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mx-2" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    otpStep === 3 ? 'bg-[#8150E8] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    3
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">New Password</span>
                </div>
              </div>

              {/* STEP 1: Enter Email */}
              {otpStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    <p className="font-semibold flex items-center gap-1.5 mb-1 text-[#8150E8]">
                      <KeyRound className="w-4 h-4 shrink-0" />
                      <span>Six-Digit Email OTP Verification</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      We will dispatch a secure 6-digit one-time code to your registered email address. Codes are valid for 5 minutes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        placeholder="learner@alphawave.ai"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <span>{isLoading ? 'Dispatching Verification Code...' : 'Send 6-Digit OTP Code'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-Digit Code */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#8150E8]">Verification Code Sent</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Expires in: {Math.floor(otpExpirySeconds / 60)}:{otpExpirySeconds % 60 < 10 ? '0' : ''}{otpExpirySeconds % 60}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Enter the 6-digit verification code dispatched to <strong className="text-purple-700 dark:text-purple-300">{forgotEmail}</strong>.
                    </p>
                    {devOtpCode && (
                      <div className="mt-2.5 p-2 bg-purple-100 dark:bg-purple-900/60 rounded-lg border border-purple-300 text-center">
                        <span className="text-[11px] font-bold text-purple-900 dark:text-purple-100 block">
                          [Development Mode] Your OTP Code: <span className="font-mono text-base tracking-widest text-[#8150E8] ml-1">{devOtpCode}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_USER in .env to deliver real emails.
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="123456"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6 || otpExpirySeconds === 0}
                    className="w-full py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <span>{isLoading ? 'Verifying Code...' : 'Verify OTP Code'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1 font-semibold text-[#8150E8] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Set New Password */}
              {otpStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Session Verified</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Your identity has been confirmed. Please enter your new password below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                      />
                    </div>
                    {newPassword && (
                      <div className="mt-1.5 px-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Password strength:</span>
                          <span className="font-semibold">{getPasswordStrength(newPassword).label}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`}
                            style={{ width: `${(getPasswordStrength(newPassword).score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#8150E8] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: '#8150E8' }}
                  >
                    <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setOtpStep(1);
                  setAuthMode('signin');
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-2 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
