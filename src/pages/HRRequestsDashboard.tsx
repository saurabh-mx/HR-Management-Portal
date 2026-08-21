import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, CheckCircle, Clock, Trash2, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface HRRequest {
  id: string;
  officer_name: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
}

export default function HRRequestsDashboard() {
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newRequest, setNewRequest] = useState({
    officer_name: "",
    subject: "",
    description: ""
  });

  useEffect(() => {
    fetchRequests();
    checkAdminStatus();
  }, []);

  // SECURITY CHECK
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

  async function fetchRequests() {
    const { data, error } = await supabase
      .from('hr_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching requests:", error);
    else if (data) setRequests(data);
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('hr_requests')
      .insert([{ ...newRequest, status: 'Pending Review' }])
      .select();

    if (error) {
      alert("Failed to submit ticket: " + error.message);
    } else if (data) {
      setRequests([data[0], ...requests]);
      setNewRequest({ officer_name: "", subject: "", description: "" });
      alert("Dispatch: Your request has been securely submitted to High Command.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('hr_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) alert("Failed to update status: " + error.message);
    else setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this HR ticket?")) return;
    const { error } = await supabase.from('hr_requests').delete().eq('id', id);
    if (!error) setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Ticket className="w-8 h-8 text-emerald-500" />
          HR Requests & Ticketing
        </h1>
        <p className="text-sm text-slate-400 mt-1">Submit official department requests, uniform inquiries, or formal reports directly to Command.</p>
      </div>

      {/* SUBMISSION FORM - VISIBLE TO EVERYONE */}
      <Card className="bg-slate-900 border-emerald-900/50 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-emerald-400">Open a New Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Your Name & Callsign</label>
              <input required type="text" value={newRequest.officer_name} onChange={e => setNewRequest({...newRequest, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Alex Hawk (101)" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Subject / Category</label>
              <select value={newRequest.subject} onChange={e => setNewRequest({...newRequest, subject: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" required>
                <option value="" disabled>Select a subject...</option>
                <option value="Uniform Request">Uniform / Equipment Request</option>
                <option value="Callsign Change">Callsign Change Request</option>
                <option value="Internal Complaint">Internal Complaint / Report</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-slate-400">Description of Request</label>
              <textarea required rows={3} value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Please provide detailed information..." />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-5 py-2 rounded-md font-medium transition-colors border border-emerald-500/20 text-sm">
                <Send className="w-4 h-4" />
                Submit Ticket
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TICKETS BOARD */}
      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Active Department Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date filed</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Status</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Command Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-6 text-center text-slate-500">
                      No active HR tickets.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(request.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{request.officer_name}</td>
                      <td className="py-3 text-slate-300 font-medium">{request.subject}</td>
                      <td className="py-3 text-slate-400 max-w-xs truncate" title={request.description}>{request.description}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          request.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {request.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {request.status}
                        </span>
                      </td>
                      
                      {/* ONLY ADMINS SEE THESE ACTIONS */}
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {request.status !== 'Resolved' && (
                              <button onClick={() => handleUpdateStatus(request.id, 'Resolved')} className="text-emerald-500 hover:text-emerald-400 text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded transition-colors" title="Mark as Resolved">
                                Resolve
                              </button>
                            )}
                            <button onClick={() => handleDelete(request.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-2" title="Delete Ticket">
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