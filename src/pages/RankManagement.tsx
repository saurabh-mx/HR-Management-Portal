import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface RankLog {
  id: string;
  officer_name: string;
  old_rank: string;
  new_rank: string;
  action_type: string;
  authorized_by: string;
  created_at: string;
}

export default function RankManagement() {
  const [logs, setLogs] = useState<RankLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newLog, setNewLog] = useState({
    officer_name: "",
    old_rank: "",
    new_rank: "",
    action_type: "Promotion",
    authorized_by: ""
  });

  useEffect(() => {
    fetchLogs();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (data?.is_admin) setIsAdmin(true);
  }

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching logs:", error);
    else if (data) setLogs(data);
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('promotions')
      .insert([newLog])
      .select();

    if (error) alert("Failed to log action: " + error.message);
    else if (data) {
      setLogs([data[0], ...logs]);
      setNewLog({ officer_name: "", old_rank: "", new_rank: "", action_type: "Promotion", authorized_by: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this rank record?")) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (!error) setLogs(logs.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-indigo-500" />
          Rank & Commendations
        </h1>
        <p className="text-sm text-slate-400 mt-1">Official logs for officer promotions, demotions, and rank adjustments.</p>
      </div>

      {/* ONLY SHOW FORM TO ADMINS */}
      {isAdmin && (
        <Card className="bg-slate-900 border-indigo-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-indigo-400">Authorize Rank Change</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLog} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Officer Name</label>
                <input required type="text" value={newLog.officer_name} onChange={e => setNewLog({...newLog, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Action Type</label>
                <select value={newLog.action_type} onChange={e => setNewLog({...newLog, action_type: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white">
                  <option value="Promotion">Promotion</option>
                  <option value="Demotion">Demotion</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Previous Rank</label>
                <input required type="text" value={newLog.old_rank} onChange={e => setNewLog({...newLog, old_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">New Rank</label>
                <input required type="text" value={newLog.new_rank} onChange={e => setNewLog({...newLog, new_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Authorized By</label>
                <input required type="text" value={newLog.authorized_by} onChange={e => setNewLog({...newLog, authorized_by: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <button type="submit" className="w-full lg:col-span-5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-md font-medium transition-colors border border-indigo-500/20 mt-2">
                Log Official Record
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Promotion Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Officer</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Transition</th>
                <th className="pb-3 font-medium">Authorized By</th>
                {isAdmin && <th className="pb-3 font-medium text-right">Delete</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 text-slate-400">{new Date(log.created_at).toLocaleDateString()}</td>
                  <td className="py-3 font-medium text-white">{log.officer_name}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                      log.action_type === 'Promotion' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {log.action_type === 'Promotion' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{log.old_rank} → {log.new_rank}</td>
                  <td className="py-3 text-slate-500">{log.authorized_by}</td>
                  {isAdmin && (
                    <td className="py-3 text-right">
                      <button onClick={() => handleDelete(log.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}