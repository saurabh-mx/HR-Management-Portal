import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarClock, CalendarCheck, Plus, X, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LOARequest {
  id: string;
  officer_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function LOAManagement() {
  const [requests, setRequests] = useState<LOARequest[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRequest, setNewRequest] = useState({ officer_name: "", start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from('loa_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching LOAs:", error);
    else if (data) setRequests(data);
  }

  const handleSubmitLOA = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('loa_requests')
      .insert([{ ...newRequest, status: 'Pending' }])
      .select();

    if (error) {
      console.error("Error adding LOA:", error);
      alert("Failed to submit request.");
    } else if (data) {
      setRequests([data[0], ...requests]);
      setIsAdding(false);
      setNewRequest({ officer_name: "", start_date: "", end_date: "", reason: "" });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('loa_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } else {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Leave of Absence</h1>
          <p className="text-sm text-slate-400">Submit and manage personnel time-off requests.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Request Leave"}
        </button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-indigo-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-indigo-400">Submit LOA Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitLOA} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Officer Name</label>
                <input required type="text" value={newRequest.officer_name} onChange={e => setNewRequest({...newRequest, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Jai Singh" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Start Date</label>
                <input required type="date" value={newRequest.start_date} onChange={e => setNewRequest({...newRequest, start_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">End Date</label>
                <input required type="date" value={newRequest.end_date} onChange={e => setNewRequest({...newRequest, end_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2 lg:col-span-4">
                <label className="text-xs font-medium text-slate-400">Reason</label>
                <input required type="text" value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Brief reason for leave..." />
              </div>
              <button type="submit" className="w-full lg:col-span-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-md font-medium transition-colors border border-indigo-500/20 mt-2">
                Submit Request to Command
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Requests</CardTitle>
            <Calendar className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{requests.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Approval</CardTitle>
            <CalendarClock className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Approved Leave</CardTitle>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Leave Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Command Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{req.officer_name}</td>
                    <td className="py-3 text-slate-400">
                      {req.start_date} to {req.end_date}
                    </td>
                    <td className="py-3 text-slate-300">{req.reason}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          req.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : req.status === "Denied"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {req.status === "Pending" && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(req.id, "Approved")}
                            className="text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req.id, "Denied")}
                            className="text-slate-400 hover:text-rose-400 transition-colors"
                            title="Deny"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
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