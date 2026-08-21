import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from "@/lib/supabaseClient";
import React, { useState, useEffect, useRef } from "react";
import { LogOut, User, ChevronDown, Key, ShieldCheck, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 z-10 shadow-sm">
          <span className="text-muted-foreground font-medium tracking-wide">High Command Portal</span>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="relative" ref={dropdownRef}>
              {/* Profile Button */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-muted p-2 rounded-md transition-colors border border-transparent hover:border-border"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-semibold text-foreground leading-tight">
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
                <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-2xl overflow-hidden py-1">
                  
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-border bg-muted/50">
                    <p className="text-sm font-medium text-popover-foreground">{profile?.name}</p>
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
                  <div className="px-4 py-3 border-b border-border">
                    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
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
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                      <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 text-sm rounded-md transition-colors border border-transparent font-medium">
                        Confirm Update
                      </button>
                  </form>
                  </div>
  
                  {/* Logout Action */}
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-2 text-sm rounded-md transition-colors font-medium"
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