import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from "@/lib/supabaseClient";
import React, { useState, useEffect, useRef } from "react";
import { LogOut, User, ChevronDown, Key, ShieldCheck, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function MainLayout() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { profile, logout } = useAuth();

  useEffect(() => {
    // Close dropdown if user clicks outside of it
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      toast.error("Error updating password: " + error.message);
    } else {
      toast.success("Dispatch: Password successfully updated.");
      setNewPassword("");
      setConfirmPassword("");
      setIsDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-black text-foreground overflow-hidden relative">
      {/* Premium Dark Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#050505] to-black z-0 pointer-events-none"></div>
      
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="relative h-16 border-b border-brand/30 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 flex items-center justify-between px-6 z-40 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          <span className="text-brand font-bold tracking-widest uppercase text-sm drop-shadow-md">
            {profile?.role ? `${profile.role} Portal` : 'Portal'}
          </span>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              {/* Profile Button */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-slate-900 p-2 rounded-md transition-colors border border-transparent hover:border-brand/30 group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border border-brand/30 group-hover:border-brand shadow-[0_0_10px_hsl(var(--brand-main)/0.1)] transition-colors">
                  <User className="w-5 h-5 text-brand" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-bold tracking-wide text-slate-200 uppercase leading-tight">
                    {profile ? profile.name : "Loading..."}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {profile ? profile.role : "Connecting..."}
                  </div>
              </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
  
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-brand/50 rounded-lg shadow-[0_5px_20px_rgba(0,0,0,0.8)] overflow-hidden py-1 z-50">
                  
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-brand/30 bg-slate-900/50">
                    <p className="text-sm font-bold tracking-wider uppercase text-slate-200">{profile?.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {profile?.is_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase tracking-wider border border-destructive/20">
                          <ShieldCheck className="w-3 h-3" /> Command / HR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border">
                          <Shield className="w-3 h-3" /> Standard Officer
                        </span>
                      )}
                    </div>
                  </div>
  
                  {/* Password Update Section */}
                  <div className="px-4 py-3 border-b border-brand/30">
                    <label className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-brand/80 mb-2">
                      <Key className="w-3 h-3" /> Update Portal Password
                    </label>
                    <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-2">
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                      <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand"
                        required
                      />
                      <button type="submit" className="w-full bg-brand hover:bg-brand text-slate-950 px-3 py-2 text-sm rounded-md transition-all border border-transparent font-bold tracking-wider uppercase mt-1">
                        Confirm Update
                      </button>
                  </form>
                  </div>
  
                  {/* Logout Action */}
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 hover:border-red-500/50 px-3 py-2 text-sm rounded-md transition-all font-bold tracking-wider uppercase"
                    >
                      <LogOut className="w-4 h-4" />
                      Secure Logout
                    </button>
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}