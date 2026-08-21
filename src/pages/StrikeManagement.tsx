import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Strike {
  id: string;
  officer_name: string;
  reason: string;
  issued_by: string;
  created_at: string;
}

export default function StrikeManagement() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorName, setAuthorName] = useState("Command");
  const [searchTerm, setSearchTerm] = useState("");
  const [newStrike, setNewStrike] = useState({ officer_name: "", reason: "" });

  useEffect(() => {
    fetchStrikes();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;
    const { data } = await supabase.from('employees').select('name, badge_number, is_admin').eq('discord_tag', session.user.email).single();
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin) setIsAdmin(true);
    }
  }

  async function fetchStrikes() {
    const { data } = await supabase.from('strikes').select('*').order('created_at', { ascending: false });
    if (data) setStrikes(data);
  }

  const handleIssueStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('strikes').insert([{ ...newStrike, issued_by: authorName }]).select();
    if (data) {
      setStrikes([data[0], ...strikes]);
      setNewStrike({ officer_name: "", reason: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this disciplinary strike?")) return;
    const { error } = await supabase.from('strikes').delete().eq('id', id);
    if (!error) setStrikes(strikes.filter(s => s.id !== id));
  };

  // 🔍 SAFE FILTER LOGIC
  const filteredStrikes = strikes.filter(strike => {
    const safeName = strike.officer_name || "";
    const safeReason = strike.reason || "";
    return safeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           safeReason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" /> Disciplinary Actions
        </h1>
        <p className="text-sm text-slate-400 mt-1">Official database for departmental strikes and reprimands.</p>
      </div>

      {isAdmin && (
        <Card className="bg-slate-900 border-rose-900/50 text-slate-200">
          <CardHeader><CardTitle className="text-lg font-medium text-rose-400">Issue New Strike</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleIssueStrike} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Officer Name / Callsign</label>
                <input required type="text" value={newStrike.officer_name} onChange={e => setNewStrike({...newStrike, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Reason / Infraction</label>
                <input required type="text" value={newStrike.reason} onChange={e => setNewStrike({...newStrike, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-md font-medium text-sm">Submit Record</button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">Department Strike Database</CardTitle>
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search officer or reason..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Infraction</th>
                  <th className="pb-3 font-medium">Issued By</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStrikes.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-8 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredStrikes.map((strike) => (
                    <tr key={strike.id} className="hover:bg-slate-800/40">
                      <td className="py-3 text-slate-400">{new Date(strike.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{strike.officer_name}</td>
                      <td className="py-3 text-slate-400">{strike.reason}</td>
                      <td className="py-3 text-slate-500">{strike.issued_by}</td>
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <button onClick={() => handleDelete(strike.id)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
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