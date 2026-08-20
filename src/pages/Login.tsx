import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="w-12 h-12 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">HR Portal Access</CardTitle>
          <p className="text-sm text-slate-400">Enter your secure credentials to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-slate-400">Officer Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. alex.hawk@soulcity.com" />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-slate-400">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="••••••••" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors">
              {loading ? "Authenticating..." : "Secure Login"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}