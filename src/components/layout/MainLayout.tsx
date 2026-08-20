import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function MainLayout() {
  const [newPassword, setNewPassword] = useState("");

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
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6">
          <span className="text-slate-500 text-sm">Welcome to the portal.</span>
          
          <div className="flex items-center gap-3">
            {/* Change Password Form */}
            <form onSubmit={handlePasswordUpdate} className="flex gap-2">
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-44 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 text-sm rounded-md transition-colors border border-slate-700">
                Update
              </button>
            </form>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 text-sm rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}