import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, UserCog, AlertOctagon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

interface EmployeeAccess {
  id: string;
  name: string;
  callsign: string;
  email: string;
  is_admin: boolean;
}

export default function AdminPanel() {
  const [personnel, setPersonnel] = useState<EmployeeAccess[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    verifyCommandAccess();
  }, []);

  // SECURITY CHECK: Verify they are High Command before loading the page
  async function verifyCommandAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setIsAuthorized(false);
      return;
    }

    const { data } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (data?.is_admin) {
      setIsAuthorized(true);
      fetchAccessList(); // Only fetch data if they are authorized
    } else {
      setIsAuthorized(false);
    }
  }

  async function fetchAccessList() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, callsign, email, is_admin')
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching access list:", error);
    else if (data) setPersonnel(data);
  }

  const toggleAdminAccess = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const confirmMsg = newStatus 
      ? "Grant High Command access to this officer?" 
      : "Revoke High Command access from this officer?";
      
    if (!window.confirm(confirmMsg)) return;

    const { error } = await supabase
      .from('employees')
      .update({ is_admin: newStatus })
      .eq('id', id);

    if (error) {
      alert("Failed to update access: " + error.message);
    } else {
      setPersonnel(personnel.map(p => p.id === id ? { ...p, is_admin: newStatus } : p));
    }
  };

  // SHOW LOADING SCREEN WHILE CHECKING
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Verifying security clearance...
      </div>
    );
  }

  // SHOW RESTRICTED ACCESS SCREEN TO STANDARD OFFICERS
  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-6">
        <AlertOctagon className="w-20 h-20 text-rose-500 animate-pulse" />
        <h1 className="text-4xl font-bold text-white tracking-tight">RESTRICTED AREA</h1>
        <p className="text-slate-400 max-w-md">
          Your current clearance level does not permit access to the High Command Admin Panel. This incident has been logged.
        </p>
        <Link to="/dashboard" className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-md transition-colors border border-slate-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // RENDER ACTUAL ADMIN PANEL FOR AUTHORIZED USERS
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          Command Access Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage portal permissions and High Command access levels.</p>
      </div>

      <Card className="bg-slate-900 border-rose-900/50 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <UserCog className="w-5 h-5 text-rose-400" />
            Active Roster Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Callsign</th>
                  <th className="pb-3 font-medium">Linked Email</th>
                  <th className="pb-3 font-medium">Current Access</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {personnel.map((officer) => (
                  <tr key={officer.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{officer.name}</td>
                    <td className="py-3 text-slate-400">{officer.callsign}</td>
                    <td className="py-3 text-slate-400">{officer.email || "No Email Linked"}</td>
                    <td className="py-3">
                      {officer.is_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                          <ShieldCheck className="w-3 h-3" /> Command
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
                          <Shield className="w-3 h-3" /> Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => toggleAdminAccess(officer.id, officer.is_admin)}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-colors border ${
                          officer.is_admin 
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700" 
                            : "bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border-rose-500/20"
                        }`}
                      >
                        {officer.is_admin ? "Revoke Access" : "Grant Command"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}