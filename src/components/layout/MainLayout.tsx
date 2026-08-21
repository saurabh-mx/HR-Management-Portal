import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useRef } from "react";
import { LogOut, User, ChevronDown, Key, ShieldCheck, Shield } from "lucide-react";

export default function MainLayout() {
  const [newPassword, setNewPassword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; role: string; is_admin: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserProfile();

    // Close dropdown if user clicks outside of it
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchUserProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    // Fetch their name and role from the employees roster based on their login email
    const { data } = await supabase
      .from('employees')
      .select('name, role, is_admin')
      .eq('email', session.user.email)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // Fallback if they aren't in the directory yet
      setProfile({ name: session.user.email, role: "Unassigned", is_admin: false });
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      alert("Error updating password: " + error.message);
    } else {
      alert("Dispatch: Password successfully updated.");
      setNewPassword("");
      setIsDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-10">
          <span className="text-slate-400 font-medium tracking-wide">High Command Portal</span>
          
          <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-slate-900 p-2 rounded-md transition-colors border border-transparent hover:border-slate-800"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-white leading-tight">
                  {profile ? profile.name : "Loading..."}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {profile ? profile.role : "Connecting..."}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden py-1">
                
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                  <p className="text-sm font-medium text-white">{profile?.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile?.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider border border-rose-500/20">
                        <ShieldCheck className="w-3 h-3" /> Command / HR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-500/20">
                        <Shield className="w-3 h-3" /> Standard Officer
                      </span>
                    )}
                  </div>
                </div>

                {/* Password Update Section */}
                <div className="px-4 py-3 border-b border-slate-800">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                    <Key className="w-3 h-3" /> Update Portal Password
                  </label>
                  <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-2">
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 text-sm rounded-md transition-colors border border-slate-700 font-medium">
                      Confirm Update
                    </button>
                  </form>
                </div>

                {/* Logout Action */}
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-2 text-sm rounded-md transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Secure Logout
                  </button>
                </div>
                
              </div>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}