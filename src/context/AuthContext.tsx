import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import type { Employee } from "@/types";
import { runBackgroundAutoSync } from "@/lib/syncService";
import { logAuditAction } from "@/lib/auditLogger";

interface AuthContextType {
  session: Session | null;
  profile: Employee | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  adminSafeMode: boolean;
  toggleAdminSafeMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSafeMode, setAdminSafeMode] = useState(false);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (_event === 'SIGNED_IN') {
          fetchProfile(session.user.email, true);
        } else {
          fetchProfile(session.user.email);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (email: string | undefined, isLoginEvent: boolean = false) => {
    if (!email) {
      setLoading(false);
      return;
    }
    const discordId = email.split('@')[0];
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq('discord_tag', discordId)
      .single();

    if (data) {
      const emp = data as Employee;
      setProfile(emp);
      
      if (isLoginEvent) {
        logAuditAction("USER_LOGIN", emp.name, "User logged into the portal", email);
      }
      
      applyDepartmentTheme(emp.department);

      // Trigger Auto-Sync if this user is an admin
      if (emp.is_admin || ['admin', 'High Command', 'Command'].includes(emp.role || '')) {
        const savedSyncsRaw = localStorage.getItem('hr_portal_saved_syncs');
        if (savedSyncsRaw) {
          try {
            const syncs = JSON.parse(savedSyncsRaw);
            const autoSyncProfiles = syncs.filter((s: any) => s.isAutoSync && s.url);
            if (autoSyncProfiles.length > 0) {
              console.log(`Triggering background auto-sync for ${autoSyncProfiles.length} roster(s)...`);
              for (const profile of autoSyncProfiles) {
                runBackgroundAutoSync(profile.url, profile.defaultDept).then((success) => {
                  if (success) {
                    console.log(`Background roster sync completed successfully for: ${profile.name || 'Unknown'}`);
                  }
                });
              }
            }
          } catch (e) {
            console.error("Failed to parse saved syncs for auto-sync.");
          }
        }
      }

    } else {
      if (isLoginEvent) {
        logAuditAction("USER_LOGIN", "Unknown", "Unregistered user logged in", email);
      }
      setProfile({ name: email, role: "Unassigned", is_admin: false });
      applyDepartmentTheme();
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
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
