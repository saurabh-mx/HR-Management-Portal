import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, UserX, Plus, X, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Strike {
  id: string;
  name: string;
  reason: string;
  severity: string;
  issued_by: string;
  created_at: string;
}

export default function StrikeManagement() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newStrike, setNewStrike] = useState({ name: "", reason: "", severity: "Verbal Warning", issued_by: "" });

  useEffect(() => {
    fetchStrikes();
  }, []);

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
      console.error("Error adding strike:", error);
      alert("Failed to issue strike.");
    } else if (data) {
      setStrikes([data[0], ...strikes]);
      setIsAdding(false);
      setNewStrike({ name: "", reason: "", severity: "Verbal Warning", issued_by: "" });
    }
  };

  const filteredStrikes = strikes.filter(
    (strike) =>
      strike.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strike.issued_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Strike Management</h1>
          <p className="text-sm text-slate-400">Track and manage disciplinary actions across all departments.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Issue Strike"}
        </button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-rose-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-rose-400">Issue Disciplinary Action</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueStrike} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Receiving Officer</label>
                <input required type="text" value={newStrike.name} onChange={e => setNewStrike({...newStrike, name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium text-slate-400">Reason</label>
                <input required type="text" value={newStrike.reason} onChange={e => setNewStrike({...newStrike, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Rule violation description..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Severity</label>
                <select value={newStrike.severity} onChange={e => setNewStrike({...newStrike, severity: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500">
                  <option value="Verbal Warning">Verbal Warning</option>
                  <option value="Strike 1">Strike 1</option>
                  <option value="Strike 2">Strike 2</option>
                  <option value="Strike 3">Strike 3</option>
                  <option value="Suspension">Suspension</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Issued By</label>
                <input required type="text" value={newStrike.issued_by} onChange={e => setNewStrike({...newStrike, issued_by: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Your Name/Callsign" />
              </div>
              <button type="submit" className="w-full lg:col-span-5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-4 py-2 rounded-md font-medium transition-colors border border-rose-500/20 mt-2">
                Submit Official Record
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Records</CardTitle>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{strikes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Suspensions</CardTitle>
            <UserX className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {strikes.filter((s) => s.severity === "Suspension").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Recent Warnings</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {strikes.filter((s) => s.severity === "Verbal Warning").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Disciplinary History</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by officer or issuer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
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
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStrikes.map((strike) => (
                  <tr key={strike.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-400">
                      {new Date(strike.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-medium text-white">{strike.name}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          strike.severity.includes("Strike") || strike.severity === "Suspension"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {strike.severity}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{strike.reason}</td>
                    <td className="py-3 text-slate-400">{strike.issued_by}</td>
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