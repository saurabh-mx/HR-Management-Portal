import { useState } from "react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { Shield, ArrowRight, Fingerprint, Lock, KeyRound, User } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { authenticateOfficer, AuthError } from "@/lib/auth";
import type { LoginResponse } from "@/lib/auth";
import { useAuth } from '@/auth/hooks/useAuth';

interface LoginModalProps {
  children: React.ReactNode;
  onForcePasswordChange?: (officerId: string, tempToken: string) => void;
  onPendingApproval?: (approvalId?: string) => void;
}

type LoginMode = 'discord' | 'officer';

export default function LoginModal({ children, onForcePasswordChange, onPendingApproval }: LoginModalProps) {
  const { setOfficerAuthFlow } = useAuth();
  
  // Shared state
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('discord');

  // Discord OAuth state
  const [isHuman, setIsHuman] = useState(false);

  // Officer Login state
  const [officerUsername, setOfficerUsername] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");

  // ─── Discord OAuth Login ─────────────────────────────────────────────
  const handleDiscordLogin = async () => {
    setLoading(true);
    setError("");

    if (!isHuman) {
      setError("Biometric verification required before proceeding.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize secure connection.");
      setLoading(false);
    }
  };

  // ─── Custom Officer Login ───────────────────────────────────────────
  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isHuman) {
      setError("Biometric verification required before proceeding.");
      setLoading(false);
      return;
    }

    if (!officerUsername || !officerPassword) {
      setError("Username and Password are required.");
      setLoading(false);
      return;
    }

    try {
      const result: LoginResponse = await authenticateOfficer({
        username: officerUsername,
        password: officerPassword,
      });

      switch (result.action) {
        case 'AUTHENTICATED':
          setOpen(false);
          break;

        case 'FORCE_PASSWORD_CHANGE':
          setOpen(false);
          // Extract officer ID from the login response
          if (result.temporary_token) {
            const officerId = result.officer_id;
            if (officerId) {
              if (onForcePasswordChange) {
                onForcePasswordChange(officerId, result.temporary_token);
              } else {
                setOfficerAuthFlow('force_password_change', {
                  officerId,
                  tempToken: result.temporary_token
                });
              }
            }
          }
          break;

        case 'PENDING_APPROVAL':
          setOpen(false);
          if (onPendingApproval) {
            onPendingApproval(result.approval_request_id);
          } else {
            setOfficerAuthFlow('pending_approval', {
              approvalId: result.approval_request_id
            });
          }
          break;

        case 'MFA_REQUIRED':
          // Phase 2: Handle MFA challenge
          setError("MFA verification is not yet implemented.");
          break;
      }
    } catch (err: any) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Invalid username or password.");
      }
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode: LoginMode) => {
    setLoginMode(mode);
    setError("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-md w-[95vw] p-0 bg-transparent border-none outline-none shadow-2xl">
        {/* Animated glowing border wrapper */}
        <div className="relative group rounded-3xl overflow-hidden p-[1px]">
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-slate-800 to-indigo-500/30 opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-slow-spin" style={{ animationDuration: '8s' }}></div>

          {/* Inner Card */}
          <div className="relative bg-slate-950/90 backdrop-blur-3xl rounded-[23px] overflow-hidden flex flex-col items-center p-8 sm:p-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">

            {/* Background Details */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

            {/* Header / Logo */}
            <div className="relative z-10 flex flex-col items-center text-center mb-6 w-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group-hover:border-emerald-500/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Shield className="w-8 h-8 text-emerald-400 relative z-10" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                {loginMode === 'discord'
                  ? "Secure Access"
                  : "Officer Login"}
              </h2>
              <p className="text-sm font-light text-slate-400">
                {loginMode === 'discord'
                  ? "Authenticate via State Police Network"
                  : "Sign in with your officer credentials"}
              </p>
            </div>

            {/* ─── Login Mode Tabs ─── */}
            <div className="w-full flex rounded-xl bg-slate-900/50 border border-slate-800/60 p-1 mb-6 relative z-10">
              <button
                type="button"
                onClick={() => handleModeSwitch('discord')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  loginMode === 'discord'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Discord
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('officer')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  loginMode === 'officer'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Officer
              </button>
            </div>

            {/* Error Message */}
            <div className={`w-full overflow-hidden transition-all duration-300 ${error ? 'max-h-24 mb-6 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
              </div>
            </div>

            {/* ─── DISCORD LOGIN FORM ─── */}
            {loginMode === 'discord' && (
              <div className="w-full space-y-6 relative z-10">
                {/* Security Verification Toggle */}
                <div
                  onClick={() => setIsHuman(!isHuman)}
                  className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between cursor-pointer group/toggle hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${isHuman ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Fingerprint className={`w-5 h-5 transition-transform duration-300 ${isHuman ? 'scale-110' : ''}`} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-slate-200 group-hover/toggle:text-white transition-colors">Biometric Check</span>
                      <span className="text-xs font-light text-slate-500">Verify human presence</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`w-12 h-6 rounded-full transition-colors duration-300 border ${isHuman ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950 border-slate-700'}`}></div>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${isHuman ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </div>

                {/* Discord Login Button */}
                <button
                  disabled={loading}
                  onClick={handleDiscordLogin}
                  type="button"
                  className="w-full relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(88,101,242,0.15)] hover:shadow-[0_0_30px_rgba(88,101,242,0.3)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? "Connecting..." : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                        </svg>
                        <span>Login with Discord</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite] z-0"></div>
                </button>
              </div>
            )}

            {/* ─── OFFICER LOGIN FORM ─── */}
            {loginMode === 'officer' && (
              <form onSubmit={handleOfficerLogin} className="w-full space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={officerUsername}
                      onChange={(e) => setOfficerUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all sm:text-sm"
                      placeholder="Username (e.g. john.1A23)"
                      autoComplete="username"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all sm:text-sm"
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Security Verification Toggle */}
                <div
                  onClick={() => setIsHuman(!isHuman)}
                  className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between cursor-pointer group/toggle hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${isHuman ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Fingerprint className={`w-5 h-5 transition-transform duration-300 ${isHuman ? 'scale-110' : ''}`} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-slate-200 group-hover/toggle:text-white transition-colors">Biometric Check</span>
                      <span className="text-xs font-light text-slate-500">Verify human presence</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`w-12 h-6 rounded-full transition-colors duration-300 border ${isHuman ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950 border-slate-700'}`}></div>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${isHuman ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? "Authenticating..." : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite] z-0"></div>
                </button>

                {/* Help text */}
                <div className="text-center pt-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Username format: name.callsign &bull; Contact admin for credentials
                  </p>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 text-center relative z-10">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                End-to-End Encrypted &bull; Secure Connection
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
