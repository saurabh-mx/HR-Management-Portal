import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarOff, CheckCircle, Clock, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LOARequest {
  id: string;
  officer_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function LOAManagement() {
  const [requests, setRequests] = useState<LOARequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRequest, setNewRequest] = useState({ officer_name: "", start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    fetchRequests();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;
    const { data } = await supabase.from('employees').select('is_admin').eq('discord_tag', session.user.email.split('@')[0]).single();
    if (data?.is_admin) setIsAdmin(true);
  }

  async function fetchRequests() {
    const { data } = await supabase.from('loa_requests').select('*').order('start_date', { ascending: false });
    if (data) setRequests(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('loa_requests').insert([{ ...newRequest, status: 'Pending Review' }]).select();
    if (data) {
      setRequests([data[0], ...requests]);
      setNewRequest({ officer_name: "", start_date: "", end_date: "", reason: "" });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('loa_requests').update({ status: newStatus }).eq('id', id);
    if (!error) setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this LOA record?")) return;
    const { error } = await supabase.from('loa_requests').delete().eq('id', id);
    if (!error) setRequests(requests.filter(req => req.id !== id));
  };

  // 🔍 FILTER LOGIC
  const filteredRequests = requests.filter(req => 
    req.officer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <CalendarOff className="w-10 h-10 text-brand" />
              LEAVE OF <span className="font-bold text-brand">ABSENCE</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Submit and manage departmental time-off requests.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader><CardTitle className="text-lg font-medium text-fuchsia-400">Submit LOA Request</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Officer Name</label>
              <input required type="text" value={newRequest.officer_name} onChange={e => setNewRequest({...newRequest, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Reason</label>
              <input required type="text" value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Start Date</label>
              <input required type="date" value={newRequest.start_date} onChange={e => setNewRequest({...newRequest, start_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">End Date</label>
              <input required type="date" value={newRequest.end_date} onChange={e => setNewRequest({...newRequest, end_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2 rounded-md font-medium text-sm">Submit Request</button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">Departmental LOA Records</CardTitle>
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search officer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Start Date</th>
                  <th className="pb-3 font-medium">End Date</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Command</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-brand/10 group">
                    <td className="py-3 font-medium text-white">{req.officer_name}</td>
                    <td className="py-3 text-slate-400">{req.start_date}</td>
                    <td className="py-3 text-slate-400">{req.end_date}</td>
                    <td className="py-3 text-slate-400">{req.reason}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : req.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {req.status === 'Pending Review' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />} {req.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-right space-x-2">
                        {req.status === 'Pending Review' && (
                          <>
                            <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="text-emerald-500 hover:text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded">Approve</button>
                            <button onClick={() => handleUpdateStatus(req.id, 'Denied')} className="text-rose-500 hover:text-rose-400 text-xs px-2 py-1 bg-rose-500/10 rounded">Deny</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(req.id)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    )}
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