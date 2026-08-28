import { useState, useEffect } from 'react';
import { KeyRound, Shield, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';
import { validatePassword, getPasswordStrengthDisplay, validatePasswordDifference } from '@/lib/auth/passwordService';
import type { PasswordValidationResult } from '@/lib/auth/passwordService';
import { changeOfficerPassword, AuthError } from '@/lib/auth/authService';
import { PASSWORD_POLICY } from '@/lib/auth/constants';

interface ForcePasswordChangeProps {
  officerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ForcePasswordChange({ officerId, onSuccess, onCancel }: ForcePasswordChangeProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);

  useEffect(() => {
    if (newPassword.length > 0) {
      setValidation(validatePassword(newPassword));
    } else {
      setValidation(null);
    }
  }, [newPassword]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsDiffer = oldPassword.length > 0 && newPassword.length > 0
    ? validatePasswordDifference(oldPassword, newPassword)
    : true;

  const canSubmit = validation?.valid
    && passwordsMatch
    && passwordsDiffer
    && oldPassword.length > 0
    && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      await changeOfficerPassword(officerId, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);

      // Delay to show success, then transition
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.details?.errors) {
          setError(err.details.errors.join(' '));
        } else if (err.details?.confirm_password) {
          setError(err.details.confirm_password);
        } else if (err.details?.message) {
          setError(err.details.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full relative">
          <div className="relative bg-slate-950/90 backdrop-blur-3xl rounded-3xl overflow-hidden p-10 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password Updated</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your password has been changed successfully. Your account is now pending admin approval.
                You will be notified when access is granted.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400/80">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-widest uppercase font-medium">Redirecting...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const strengthDisplay = validation ? getPasswordStrengthDisplay(validation.strength) : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background texture */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        {/* Glowing border wrapper */}
        <div className="relative group rounded-3xl overflow-hidden p-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-slate-800 to-rose-500/30 opacity-60" />

          <div className="relative bg-slate-950/95 backdrop-blur-3xl rounded-[23px] overflow-hidden p-8 sm:p-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <KeyRound className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Set New Password
              </h2>
              <p className="text-sm text-slate-400 max-w-xs">
                Your initial password must be changed before you can access the system.
              </p>
            </div>

            {/* Security notice */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Your new password must be at least {PASSWORD_POLICY.MIN_LENGTH} characters with uppercase, lowercase, digits, and special characters.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Old Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl bg-slate-900/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    placeholder="Enter your initial password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl bg-slate-900/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    placeholder="Choose a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {validation && strengthDisplay && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Strength</span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${strengthDisplay.colorClass.split(' ')[0]}`}>
                        {strengthDisplay.label}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${strengthDisplay.colorClass.split(' ')[1]}`}
                        style={{ width: strengthDisplay.barWidth }}
                      />
                    </div>

                    {/* Requirement checklist */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      {[
                        { label: `${PASSWORD_POLICY.MIN_LENGTH}+ chars`, met: newPassword.length >= PASSWORD_POLICY.MIN_LENGTH },
                        { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
                        { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
                        { label: 'Number', met: /[0-9]/.test(newPassword) },
                        { label: 'Special char', met: new RegExp(`[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(newPassword) },
                        { label: 'Different from old', met: passwordsDiffer },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {req.met ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                          <span className={`text-[10px] tracking-wide ${req.met ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-slate-900/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all text-sm ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500/50 focus:ring-emerald-500/50'
                          : 'border-rose-500/50 focus:ring-rose-500/50'
                        : 'border-slate-800 focus:ring-amber-500/50 focus:border-amber-500/50'
                    }`}
                    placeholder="Re-enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[10px] text-rose-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full relative overflow-hidden bg-amber-600 hover:bg-amber-500 text-white px-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 mt-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    'Updating...'
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite] z-0" />
              </button>

              {/* Cancel option */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-medium"
                >
                  Cancel & Sign Out
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Mandatory Security Protocol &bull; First Login
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
