import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import type { Employee } from "@/types";

interface AuthContextType {
  session: Session | null;
  profile: Employee | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

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
        fetchProfile(session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (email: string | undefined) => {
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
      setProfile(data as Employee);
      applyDepartmentTheme((data as Employee).department);
    } else {
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

  return (
    <AuthContext.Provider value={{ session, profile, loading, logout }}>
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
