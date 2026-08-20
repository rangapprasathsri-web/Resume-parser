import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  KeyRound
} from 'lucide-react';
import { resetPassword, formatAuthError } from '../../services/authService';
import { ThemeMode } from '../../types';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToLogin,
  theme,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col justify-between transition-colors duration-150">
      {/* Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-default bg-surface">
        <div className="flex items-center gap-2.5">
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
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Recovery</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
              Reset your password
            </h1>
            <p className="text-xs text-secondary font-sans leading-relaxed">
              Enter your registered account email and we'll send you instructions to reset your password.
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
          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[6px] bg-status-found/10 border border-status-found/30 space-y-2 text-xs text-status-found">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Reset instructions sent</span>
                </div>
                <p className="text-primary font-sans leading-relaxed">
                  We've sent a password reset link to <strong className="font-mono">{email}</strong>. Please check your inbox and spam folder.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 px-4 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return to Login */}
          {!success && (
            <div className="pt-2 text-center text-xs text-secondary font-sans border-t border-default">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-muted border-t border-default">
        EvidenceFirst • Zero-Hallucination Resume Intelligence Engine
      </footer>
    </div>
  );
};
