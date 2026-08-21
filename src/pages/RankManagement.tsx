import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, XCircle, Clock, Trash2, Shield, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PromotionRecord {
  id: string;
  officer_name: string;
  current_rank: string;
  requested_rank: string;
  reason: string;
  status: string;
  created_by: string;
  created_at: string;
}

export default function RankManagement() {
  const [records, setRecords] = useState<PromotionRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorName, setAuthorName] = useState("Command");
  
  // NEW: Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [newRecord, setNewRecord] = useState({
    officer_name: "",
    current_rank: "",
    requested_rank: "",
    reason: ""
  });

  useEffect(() => {
    fetchRecords();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from('employees')
      .select('name, callsign, is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (data) {
      setAuthorName(`${data.name} (${data.callsign})`);
      if (data.is_admin) setIsAdmin(true);
    }
  }

  async function fetchRecords() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching promotions:", error);
    else if (data) setRecords(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('promotions')
      .insert([{ ...newRecord, status: 'Pending Review', created_by: authorName }])
      .select();

    if (error) alert("Failed to submit request: " + error.message);
    else if (data) {
      setRecords([data[0], ...records]);
      setNewRecord({ officer_name: "", current_rank: "", requested_rank: "", reason: "" });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('promotions').update({ status: newStatus }).eq('id', id);
    if (!error) setRecords(records.map(rec => rec.id === id ? { ...rec, status: newStatus } : rec));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this record?")) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (!error) setRecords(records.filter(rec => rec.id !== id));
  };

  // NEW: Filter and Search Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-500" />
          Rank & Commendations
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage departmental promotions, commendations, and rank updates.</p>
      </div>

      {/* SUBMISSION FORM (ADMIN ONLY) */}
      {isAdmin && (
        <Card className="bg-slate-900 border-amber-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-amber-400 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Submit Rank / Commendation Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Officer Name</label>
                <input required type="text" value={newRecord.officer_name} onChange={e => setNewRecord({...newRecord, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="e.g. Jai Singh" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Current Rank</label>
                <input required type="text" value={newRecord.current_rank} onChange={e => setNewRecord({...newRecord, current_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="e.g. Officer I" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Requested Rank / Commendation</label>
                <input required type="text" value={newRecord.requested_rank} onChange={e => setNewRecord({...newRecord, requested_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="e.g. Officer II or Medal of Valor" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-medium text-slate-400">Reasoning / Citation</label>
                <input required type="text" value={newRecord.reason} onChange={e => setNewRecord({...newRecord, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="Detail the reasoning for this request..." />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm">
                  Submit Request
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RECORDS BOARD WITH SEARCH & FILTER */}
      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium">Departmental Records</CardTitle>
            
            {/* NEW: Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search officers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 w-full sm:w-48 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Denied">Denied</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Requested Rank</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-500">
                      No records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{record.officer_name}</td>
                      <td className="py-3 text-amber-400 font-medium">{record.requested_rank}</td>
                      <td className="py-3 text-slate-300 max-w-[200px] truncate" title={record.reason}>{record.reason}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          record.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          record.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {record.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> : 
                           record.status === 'Denied' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {record.status}
                        </span>
                      </td>
                      
                      {/* ADMIN ACTIONS */}
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {record.status === 'Pending Review' && (
                              <>
                                <button onClick={() => handleUpdateStatus(record.id, 'Approved')} className="text-emerald-500 hover:text-emerald-400 text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded transition-colors">Approve</button>
                                <button onClick={() => handleUpdateStatus(record.id, 'Denied')} className="text-rose-500 hover:text-rose-400 text-xs font-medium border border-rose-500/30 bg-rose-500/10 px-2 py-1 rounded transition-colors">Deny</button>
                              </>
                            )}
                            <button onClick={() => handleDelete(record.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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