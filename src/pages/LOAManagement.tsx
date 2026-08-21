import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [newRequest, setNewRequest] = useState({
    officer_name: "",
    start_date: "",
    end_date: "",
    reason: ""
  });

  useEffect(() => {
    fetchRequests();
    checkAdminStatus();
  }, []);

  // SECURITY CHECK: Verify if the logged-in user is High Command
  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (data?.is_admin) {
      setIsAdmin(true);
    }
  }

  async function fetchRequests() {
    // Replace 'loa_requests' with your actual table name if it is different
    const { data, error } = await supabase
      .from('loa_requests') 
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching LOAs:", error);
    else if (data) setRequests(data);
  }

  // ANYONE CAN SUBMIT A REQUEST
  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('loa_requests')
      .insert([{ ...newRequest, status: 'Pending' }])
      .select();

    if (error) {
      alert("Failed to submit request: " + error.message);
    } else if (data) {
      setRequests([data[0], ...requests]);
      setNewRequest({ officer_name: "", start_date: "", end_date: "", reason: "" });
      alert("LOA Request submitted successfully and is pending Command approval.");
    }
  };

  // ONLY ADMINS CAN UPDATE STATUS
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('loa_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    }
  };

  // ONLY ADMINS CAN DELETE
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    const { error } = await supabase.from('loa_requests').delete().eq('id', id);
    if (!error) setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <CalendarRange className="w-8 h-8 text-purple-500" />
          Leave of Absence (LOA)
        </h1>
        <p className="text-sm text-slate-400 mt-1">Submit and manage departmental time-off requests.</p>
      </div>

      {/* LOA SUBMISSION FORM - VISIBLE TO EVERYONE */}
      <Card className="bg-slate-900 border-purple-900/50 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-purple-400">Submit LOA Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRequest} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Officer Name</label>
              <input required type="text" value={newRequest.officer_name} onChange={e => setNewRequest({...newRequest, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Your Name" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Start Date</label>
              <input required type="date" value={newRequest.start_date} onChange={e => setNewRequest({...newRequest, start_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">End Date</label>
              <input required type="date" value={newRequest.end_date} onChange={e => setNewRequest({...newRequest, end_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-medium text-slate-400">Reason</label>
              <input required type="text" value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Brief reason for leave..." />
            </div>
            <button type="submit" className="w-full lg:col-span-5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-2 rounded-md font-medium transition-colors border border-purple-500/20 mt-2">
              Submit Request to Command
            </button>
          </form>
        </CardContent>
      </Card>

      {/* LOA RECORDS TABLE */}
      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Departmental LOA Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date Filed</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  {/* ONLY ADMINS SEE THE ACTIONS COLUMN HEADER */}
                  {isAdmin && <th className="pb-3 font-medium text-right">Command Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-slate-500">
                      No LOA requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(request.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{request.officer_name}</td>
                      <td className="py-3 text-slate-300">{request.start_date} to {request.end_date}</td>
                      <td className="py-3 text-slate-400">{request.reason}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          request.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          request.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {request.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> : 
                           request.status === 'Denied' ? <XCircle className="w-3 h-3" /> : 
                           <Clock className="w-3 h-3" />}
                          {request.status}
                        </span>
                      </td>
                      
                      {/* ONLY ADMINS SEE THE ACTION BUTTONS */}
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {request.status === 'Pending' && (
                              <>
                                <button onClick={() => handleUpdateStatus(request.id, 'Approved')} className="text-emerald-500 hover:text-emerald-400 p-1" title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleUpdateStatus(request.id, 'Denied')} className="text-rose-500 hover:text-rose-400 p-1" title="Deny">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDelete(request.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-2" title="Delete Record">
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