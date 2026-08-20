import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { registerWithEmail, loginWithGoogle, formatAuthError } from '../../services/authService';
import { ThemeMode } from '../../types';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  onBackToLanding?: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onNavigateToLogin,
  onBackToLanding,
  theme,
  onToggleTheme,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation criteria
  const hasMinLength = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (!hasMinLength) {
      setError('Your password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await registerWithEmail(fullName, email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      setSuccess(true);
    } catch (err: any) {
      setError(formatAuthError(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col justify-between transition-colors duration-150">
      {/* Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-default bg-surface">
        <div className="flex items-center gap-2.5">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-xs text-secondary hover:text-primary font-medium px-2.5 py-1 rounded-[6px] border border-default hover:bg-surface-sunken transition-colors mr-2 cursor-pointer"
            >
              ← Landing Page
            </button>
          )}
          <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white">
            <FileText className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm font-semibold text-primary tracking-tight">EvidenceFirst</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-muted font-mono">
              «Resume Intelligence Engine»
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="text-xs font-mono text-secondary hover:text-primary px-2.5 py-1 rounded-[6px] border border-default hover:bg-surface-sunken transition-colors cursor-pointer"
        >
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-surface border border-default rounded-[10px] shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-accent-subtle text-accent text-[11px] font-mono font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
              Get started with EvidenceFirst
            </h1>
            <p className="text-xs text-secondary font-sans leading-relaxed">
              Create an account to start analyzing resumes with verifiable, zero-hallucination evidence.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-[6px] bg-status-missing/10 border border-status-missing/30 flex items-start gap-2.5 text-xs text-status-missing">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-sans">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-3 rounded-[6px] bg-status-found/10 border border-status-found/30 flex items-center gap-2.5 text-xs text-status-found font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Account created successfully. Loading workspace...</span>
            </div>
          )}

          {/* Social Sign Up (Google) */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading || success}
            className="w-full py-2.5 px-4 rounded-[6px] border border-strong bg-surface hover:bg-surface-sunken text-primary text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-secondary" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Setting up Google account...' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-default" />
            </div>
            <div className="relative px-3 bg-surface text-[11px] font-mono text-muted uppercase">
              Or create with email
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-primary">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] pl-9 pr-3 py-2 text-xs sm:text-sm text-primary placeholder:text-muted outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-primary">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                  className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] pl-9 pr-3 py-2 text-xs sm:text-sm text-primary placeholder:text-muted outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-primary">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] pl-9 pr-10 py-2 text-xs sm:text-sm text-primary placeholder:text-muted outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-primary">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] pl-9 pr-3 py-2 text-xs sm:text-sm text-primary placeholder:text-muted outline-none transition-colors"
                />
              </div>
            </div>

            {/* Micro Validation Indicators */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className={hasMinLength ? 'text-status-found' : 'text-muted'}>
                  {hasMinLength ? '✓' : '•'} At least 6 characters
                </span>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className={passwordsMatch ? 'text-status-found' : 'text-status-missing'}>
                    {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading || success}
              className="w-full mt-2 py-2.5 px-4 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          {/* Footer Login Link */}
          <div className="pt-2 text-center text-xs text-secondary font-sans border-t border-default">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-accent font-medium hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-muted border-t border-default">
        EvidenceFirst • Zero-Hallucination Resume Intelligence Engine
      </footer>
    </div>
  );
};
