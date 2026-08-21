import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertOctagon, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Strike {
  id: string;
  officer_name: string;
  reason: string;
  severity: string;
  issued_by: string;
  created_at: string;
}

export default function StrikeManagement() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStrike, setNewStrike] = useState({
    officer_name: "",
    reason: "",
    severity: "Warning",
    issued_by: ""
  });

  useEffect(() => {
    fetchStrikes();
    checkAdminStatus();
  }, []);

  // SECURITY CHECK: Verify if the logged-in user is High Command
  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data, error } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (!error && data?.is_admin) {
      setIsAdmin(true);
    }
  }

  async function fetchStrikes() {
    const { data, error } = await supabase
      .from('strikes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching strikes:", error);
    else if (data) setStrikes(data);
  }

  const handleIssueStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('strikes')
      .insert([newStrike])
      .select();

    if (error) {
      alert("Failed to issue strike: " + error.message);
    } else if (data) {
      setStrikes([data[0], ...strikes]);
      setNewStrike({ officer_name: "", reason: "", severity: "Warning", issued_by: "" });
    }
  };

  const handleDeleteStrike = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;

    const { error } = await supabase
      .from('strikes')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Failed to delete strike: " + error.message);
    } else {
      setStrikes(strikes.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <AlertOctagon className="w-8 h-8 text-rose-500" />
          Disciplinary Action
        </h1>
        <p className="text-sm text-slate-400 mt-1">Official tracking for departmental warnings, strikes, and suspensions.</p>
      </div>

      {/* ONLY SHOW THIS FORM TO COMMAND / HR */}
      {isAdmin && (
        <Card className="bg-slate-900 border-rose-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-rose-400">Issue Disciplinary Action</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueStrike} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Receiving Officer</label>
                <input required type="text" value={newStrike.officer_name} onChange={e => setNewStrike({...newStrike, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. Jai Singh" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium text-slate-400">Reason for Action</label>
                <input required type="text" value={newStrike.reason} onChange={e => setNewStrike({...newStrike, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. Insubordination during active scene" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Severity</label>
                <select value={newStrike.severity} onChange={e => setNewStrike({...newStrike, severity: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500">
                  <option value="Warning">Official Warning</option>
                  <option value="Strike 1">Strike 1</option>
                  <option value="Strike 2">Strike 2</option>
                  <option value="Strike 3">Strike 3 (Termination/Suspension)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Issuing Command Member</label>
                <input required type="text" value={newStrike.issued_by} onChange={e => setNewStrike({...newStrike, issued_by: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. Chief Jane Doe" />
              </div>
              <button type="submit" className="w-full lg:col-span-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-4 py-2 rounded-md font-medium transition-colors border border-rose-500/20 mb-0.5">
                Submit Official Record
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STRIKES RECORD TABLE - VISIBLE TO EVERYONE */}
      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Departmental Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date Issued</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Issued By</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {strikes.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-slate-500">
                      No disciplinary records found.
                    </td>
                  </tr>
                ) : (
                  strikes.map((strike) => (
                    <tr key={strike.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(strike.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{strike.officer_name}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          strike.severity.includes('Warning') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          strike.severity.includes('Strike 3') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {strike.severity.includes('Warning') ? <AlertTriangle className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                          {strike.severity}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{strike.reason}</td>
                      <td className="py-3 text-slate-500">{strike.issued_by}</td>
                      
                      {/* ONLY SHOW DELETE BUTTON TO ADMINS */}
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDeleteStrike(strike.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}