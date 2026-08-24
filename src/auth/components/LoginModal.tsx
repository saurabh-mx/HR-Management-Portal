import { useState } from "react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { Shield, ArrowRight, Fingerprint, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface LoginModalProps {
  children: React.ReactNode;
}

export default function LoginModal({ children }: LoginModalProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

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
            <div className="relative z-10 flex flex-col items-center text-center mb-10 w-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group-hover:border-emerald-500/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Shield className="w-8 h-8 text-emerald-400 relative z-10" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Secure Access
              </h2>
              <p className="text-sm font-light text-slate-400">
                Authenticate via State Police Network
              </p>
            </div>

            {/* Error Message */}
            <div className={`w-full overflow-hidden transition-all duration-300 ${error ? 'max-h-24 mb-6 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
              </div>
            </div>

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
                onClick={async () => {
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
                }}
                type="button" 
                className="w-full relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(88,101,242,0.15)] hover:shadow-[0_0_30px_rgba(88,101,242,0.3)] hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    "Connecting..."
                  ) : (
                    <>
                      <span>Login with Discord</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite] z-0"></div>
              </button>
              
            </div>

            {/* Footer */}
            <div className="mt-8 text-center relative z-10">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                End-to-End Encrypted &bull; OAuth2
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
