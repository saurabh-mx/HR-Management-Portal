import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface LoginModalProps {
  children: React.ReactNode;
}

export default function LoginModal({ children }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    let authError = null;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      authError = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authError = error;
    }
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Upon successful login, the parent AuthProvider state will change
      // and redirect away from the landing page.
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 bg-transparent border-none outline-none">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <ShieldAlert className="w-12 h-12 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              {isSignUp ? "Claim Portal ID" : "HR Portal Access"}
            </CardTitle>
            <p className="text-sm text-slate-400">
              {isSignUp ? "Set your secure password for the first time" : "Enter your secure credentials to continue"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-400">Portal ID</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. james.bond@soulcity.com" />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-400">Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="••••••••" />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors">
                {loading ? "Authenticating..." : (isSignUp ? "Set Password & Login" : "Secure Login")}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {isSignUp ? "Already claimed your ID? Login here" : "First time? Claim your Portal ID here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
