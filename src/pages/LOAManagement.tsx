import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarOff, CheckCircle, Clock, Trash2, Search, Plus, X, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from "@/context/AuthContext";
import LOASyncModal from "@/components/admin/LOASyncModal";

interface LOARequest {
  id: string;
  officer_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  ended_by?: string;
  ended_at?: string;
}

export default function LOAManagement() {
  const { adminSafeMode } = useAuth();
  const [requests, setRequests] = useState<LOARequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isTrueAdmin, setIsTrueAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authorName, setAuthorName] = useState("");
  const [newRequest, setNewRequest] = useState({ start_date: "", end_date: "", reason: "" });
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{ id: string, newStatus: string, title: string, message: string } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  useEffect(() => {
    fetchRequests();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;
    const { data } = await supabase.from('employees').select('name, badge_number, is_admin, role').eq('discord_tag', session.user.email.split('@')[0]).single();
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin) setIsTrueAdmin(true);
      if (data.is_admin || (data.role && ['High Command', 'HR'].includes(data.role))) setIsAdmin(true);
    }
  }

  async function fetchRequests() {
    const { data } = await supabase.from('loa_requests').select('*').order('start_date', { ascending: false });
    if (data) setRequests(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('loa_requests').insert([{ ...newRequest, officer_name: authorName, status: 'Pending Review' }]).select();
    if (data) {
      logAuditAction("LOA_SUBMITTED", authorName, `Submitted LOA request from ${newRequest.start_date} to ${newRequest.end_date}`, authorName);
      setRequests([data[0], ...requests]);
      setNewRequest({ start_date: "", end_date: "", reason: "" });
      setShowForm(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    let updates: any = { status: newStatus };
    if (newStatus === 'Ended') {
      updates.ended_by = authorName;
      updates.ended_at = new Date().toISOString();
    }

    const { error } = await supabase.from('loa_requests').update(updates).eq('id', id);
    if (!error) {
      const req = requests.find(r => r.id === id);
      if (req) logAuditAction("LOA_UPDATED", req.officer_name, `LOA status changed to: ${newStatus}`, authorName);
      setRequests(requests.map(req => req.id === id ? { ...req, ...updates } : req));
    }
  };

  const handleConfirmStatus = async () => {
    if (!statusAction) return;
    await handleUpdateStatus(statusAction.id, statusAction.newStatus);
    setStatusAction(null);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    const { error } = await supabase.from('loa_requests').delete().eq('id', requestToDelete);
    if (!error) {
      const req = requests.find(r => r.id === requestToDelete);
      if (req) logAuditAction("LOA_DELETED", req.officer_name, `Deleted LOA request by Admin`, authorName);
      setRequests(requests.filter(req => req.id !== requestToDelete));
      setRequestToDelete(null);
    }
  };

  // 🔍 FILTER LOGIC
  const filteredRequests = requests.filter(req => {
    // Privacy filter: Normal users only see their own LOAs
    if (!isAdmin && req.officer_name !== authorName) return false;

    // Status filter
    if (statusFilter !== "All" && req.status !== statusFilter) return false;

    // Search filter
    return req.officer_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative mb-8">
        <div className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <CalendarOff className="w-7 h-7 text-brand" />
              LEAVE OF <span className="font-bold text-brand">ABSENCE</span>
            </h1>
            <div className="w-16 h-1 bg-brand mt-2 mb-2 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-sm text-slate-400 font-light tracking-wide flex items-center gap-2">
              Submit and manage departmental time-off requests.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={() => setShowSyncModal(true)}
                className="bg-brand/10 backdrop-blur-md text-brand px-5 py-2 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-brand/20 transition-all flex items-center gap-2 border border-brand/30 shadow-[0_0_10px_hsl(var(--brand-main)/0.2)]"
              >
                <Database className="w-4 h-4" /> Sync LOAs
              </button>
            )}
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md border text-sm ${
                showForm 
                ? 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800' 
                : 'bg-fuchsia-600/90 hover:bg-fuchsia-500 text-white border-fuchsia-500/50 hover:-translate-y-0.5'
              }`}
            >
              {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              <span>{showForm ? "Cancel" : "Submit Request"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100 mb-8 mt-4' : 'grid-rows-[0fr] opacity-0 mb-0 mt-0'}`}>
        <div className="overflow-hidden">
          <Card className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader><CardTitle className="text-lg font-medium text-fuchsia-400">Submit LOA Request</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Officer Name</label>
              <input disabled type="text" value={authorName || "Loading..."} className="w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Reason</label>
              <input required type="text" value={newRequest.reason} onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Start Date</label>
              <input required type="date" value={newRequest.start_date} onChange={e => setNewRequest({ ...newRequest, start_date: e.target.value })} onClick={e => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">End Date</label>
              <input required type="date" value={newRequest.end_date} onChange={e => setNewRequest({ ...newRequest, end_date: e.target.value })} onClick={e => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer" />
            </div>
            <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2 rounded-md font-medium text-sm">Submit Request</button></div>
          </form>
        </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
          <CardTitle className="text-lg font-medium">Departmental LOA Records</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand w-full sm:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Active (Approved)</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Denied">Denied</option>
              <option value="Ended">Ended</option>
            </select>

            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search officer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Start Date</th>
                  <th className="pb-3 font-medium">End Date</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="group/table">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="bg-slate-950/30 hover:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                    <td className="py-3 px-4 rounded-l-lg font-medium text-white">
                      <span className="inline-block transition-transform duration-300 origin-left group-hover:text-brand">
                        {req.officer_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{req.start_date}</td>
                    <td className="py-3 px-4 text-slate-400">{req.end_date}</td>
                    <td className="py-3 px-4 text-slate-400">{req.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          req.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            req.status === 'Ended' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                              req.status === 'End Requested' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {req.status === 'Pending Review' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />} {req.status}
                      </span>
                      {req.status === 'Ended' && req.ended_by && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Ended by {req.ended_by}<br />on {new Date(req.ended_at!).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {/* Normal User Actions */}
                      {req.status === 'Approved' && req.officer_name === authorName && !isAdmin && (
                        <button onClick={() => setStatusAction({ id: req.id, newStatus: 'End Requested', title: 'Request End LOA', message: 'Are you sure you want to request to end your Leave of Absence early? Command will need to approve this return.' })} className="text-sky-400 hover:text-white text-xs px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 rounded transition-colors">Request End LOA</button>
                      )}

                      {/* Admin Actions */}
                      {isAdmin && (
                        <>
                          {req.status === 'Pending Review' && (
                            <>
                              <button onClick={() => setStatusAction({ id: req.id, newStatus: 'Approved', title: 'Approve LOA', message: 'Are you sure you want to approve this Leave of Absence?' })} className="text-emerald-500 hover:text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded">Approve</button>
                              <button onClick={() => setStatusAction({ id: req.id, newStatus: 'Denied', title: 'Deny LOA', message: 'Are you sure you want to deny this Leave of Absence?' })} className="text-rose-500 hover:text-rose-400 text-xs px-2 py-1 bg-rose-500/10 rounded">Deny</button>
                            </>
                          )}
                          {(req.status === 'Approved' || req.status === 'End Requested') && (
                            <button onClick={() => setStatusAction({ id: req.id, newStatus: 'Ended', title: 'End LOA', message: 'Are you sure you want to officially end this Leave of Absence?' })} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 rounded transition-colors">End LOA</button>
                          )}
                          {isTrueAdmin && adminSafeMode && (
                            <button onClick={() => setRequestToDelete(req.id)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4 inline" /></button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete LOA Record</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to delete this LOA record? This action is permanent and cannot be undone.
                Normally, LOA records should be marked as "Ended" to retain history rather than deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRequestToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(14,165,233,0.2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-lg shadow-rose-900/20"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Action Confirmation Modal */}
      {statusAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className={`absolute top-0 left-0 right-0 h-1 ${statusAction.newStatus === 'Approved' ? 'bg-emerald-500' :
                statusAction.newStatus === 'Denied' ? 'bg-rose-500' :
                  statusAction.newStatus === 'End Requested' ? 'bg-sky-500' :
                    'bg-slate-500'
              }`} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${statusAction.newStatus === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    statusAction.newStatus === 'Denied' ? 'bg-rose-500/10 border-rose-500/20' :
                      statusAction.newStatus === 'End Requested' ? 'bg-sky-500/10 border-sky-500/20' :
                        'bg-slate-500/10 border-slate-500/20'
                  }`}>
                  <CheckCircle className={`w-5 h-5 ${statusAction.newStatus === 'Approved' ? 'text-emerald-500' :
                      statusAction.newStatus === 'Denied' ? 'text-rose-500' :
                        statusAction.newStatus === 'End Requested' ? 'text-sky-500' :
                          'text-slate-500'
                    }`} />
                </div>
                <h3 className="text-lg font-bold text-white">{statusAction.title}</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {statusAction.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStatusAction(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(14,165,233,0.2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatus}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors shadow-lg ${statusAction.newStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' :
                      statusAction.newStatus === 'Denied' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' :
                        statusAction.newStatus === 'End Requested' ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/20' :
                          'bg-slate-600 hover:bg-slate-700 shadow-slate-900/20'
                    }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LOASyncModal 
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}