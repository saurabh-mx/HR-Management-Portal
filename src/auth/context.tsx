import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from '@/lib/supabase/supabaseClient';
import type { Session } from "@supabase/supabase-js";
import type { Employee } from "@/types";
import { runGlobalAutoSync } from '@/lib/sync/syncService';
import { logAuditAction } from "@/lib/auditLogger";
import { AlertTriangle, X } from "lucide-react";
import { isCommandOrHigher } from '@/auth/roles/roleMatrix';

interface AuthContextType {
  session: Session | null;
  profile: Employee | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  adminSafeMode: boolean;
  toggleAdminSafeMode: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSafeMode, setAdminSafeMode] = useState(false);
  const [authError, setAuthError] = useState<{ title: string, message: string } | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.email, false, session.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (_event === 'SIGNED_IN') {
          fetchProfile(session.user.email, true, session.user.user_metadata);
        } else {
          fetchProfile(session.user.email, false, session.user.user_metadata);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic Auto-Sync every 15 minutes for Admins
  useEffect(() => {
    if (!profile || !isCommandOrHigher(profile)) return;

    const syncInterval = setInterval(() => {
      const savedSyncsRaw = localStorage.getItem('hr_portal_saved_syncs');
      if (savedSyncsRaw) {
        try {
          const syncs = JSON.parse(savedSyncsRaw);
          const autoSyncProfiles = syncs.filter((s: any) => s.isAutoSync && s.url);
          if (autoSyncProfiles.length > 0) {
            runGlobalAutoSync(autoSyncProfiles);
          }
        } catch (e) {}
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [profile]);

  const fetchProfile = async (email: string | undefined, isLoginEvent: boolean = false, userMetaData: any = null) => {
    let discordId = "";

    if (userMetaData) {
      // Strictly use 'preferred_username' as it contains the unique Discord tag (e.g. venomplazzyt)
      // We avoid 'full_name' or 'global_name' because that contains the Display Name (e.g. '! Venom')
      discordId = userMetaData.preferred_username || userMetaData.name;
    } else if (email) {
      // Fallback for legacy email login
      discordId = userMetaData.preferred_username || userMetaData.name.split('#')[0];
    }

    if (!discordId) {
      setLoading(false);
      return;
    }

    // Discord sometimes appends #0 to the end of usernames now. Strip it.
    discordId = discordId.split('#')[0];

    const { data } = await supabase
      .from("employees")
      .select("*")
      .ilike('discord_tag', discordId)
      .maybeSingle();

    if (data) {
      const emp = data as Employee;
      setProfile(emp);

      if (isLoginEvent) {
        logAuditAction("USER_LOGIN", emp.name, "User logged into the portal", email || "");
      }

      applyDepartmentTheme(emp.department);

      // Trigger Auto-Sync if this user is an admin
      if (isCommandOrHigher(emp)) {
        const savedSyncsRaw = localStorage.getItem('hr_portal_saved_syncs');
        if (savedSyncsRaw) {
          try {
            const syncs = JSON.parse(savedSyncsRaw);
            const autoSyncProfiles = syncs.filter((s: any) => s.isAutoSync && s.url);
            if (autoSyncProfiles.length > 0) {
              console.log(`Triggering background auto-sync for ${autoSyncProfiles.length} roster(s)...`);
              runGlobalAutoSync(autoSyncProfiles).then(() => {
                console.log(`Global background roster sync completed.`);
              });
            }
          } catch (e) {
            console.error("Failed to parse saved syncs for auto-sync.");
          }
        }
      }

    } else {
      console.warn(`Unauthorized login attempt by Discord ID: ${discordId}`);
      if (isLoginEvent) {
        logAuditAction("USER_LOGIN_FAILED", "Unknown", `Unauthorized login attempt by Discord ID: ${discordId}`, email || "");
      }

      // UNAUTHORIZED -> Force Sign Out
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);

      setAuthError({
        title: "ACCESS DENIED",
        message: `Discord user "${discordId}" is not in the official roster. Please contact High Command.`
      });
    }
    setLoading(false);
  };

  const applyDepartmentTheme = (department?: string) => {
    let hslColor = '45 93% 47%'; // default yellow-500

    switch (department) {
      case 'SAPR': hslColor = '146 100% 25%'; break; // Green #008239
      case 'LSPD': hslColor = '217 66% 32%'; break; // Blue #1c4587
      case 'BCSO': hslColor = '45 61% 56%'; break; // Gold #d2b14b
      case 'SASP': hslColor = '0 0% 60%'; break; // Silver #999999
      case 'SASP Academy': hslColor = '0 6% 55%'; break; // Rose Grey #938383
    }

    document.documentElement.style.setProperty('--brand-main', hslColor);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const toggleAdminSafeMode = () => setAdminSafeMode(prev => !prev);

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      logout,
      refreshProfile: async () => { if (session) await fetchProfile(session.user.email); },
      adminSafeMode,
      toggleAdminSafeMode
    }}>
      {children}

      {/* Custom Global Access Denied Modal */}
      {authError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div className="bg-slate-950 border border-rose-500/30 w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 mx-4">

            {/* Header */}
            <div className="bg-rose-500/10 p-6 flex items-start gap-4 border-b border-rose-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(244,63,94,0.05)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_infinite]"></div>

              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.4)] relative z-10">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>

              <div className="relative z-10 pt-1">
                <h3 className="text-xl font-bold tracking-widest text-rose-500 uppercase">{authError.title}</h3>
                <p className="text-sm font-medium text-slate-300 mt-1 uppercase tracking-wide">Unauthorized System Breach Detected</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-5 mb-8">
                <p className="text-slate-300 leading-relaxed font-light text-center text-[15px]">
                  {authError.message}
                </p>
              </div>

              <button
                onClick={() => setAuthError(null)}
                className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};


