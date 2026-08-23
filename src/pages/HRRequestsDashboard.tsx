import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Clock, History, MessageSquare, Send, Ticket, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from "@/context/AuthContext";

interface HRRequest {
  id: string;
  officer_name: string;
  officer_email: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
}

interface Comment {
  id: string;
  request_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

export default function HRRequestsDashboard() {
  const { adminSafeMode } = useAuth();
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string, email: string, isAdmin: boolean } | null>(null);

  // Tab State for filtering Active vs Resolved
  const [activeTab, setActiveTab] = useState<'Active' | 'Resolved'>('Active');

  // Chat Thread States
  const [activeTicket, setActiveTicket] = useState<HRRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const [newRequest, setNewRequest] = useState({
    subject: "",
    description: ""
  });
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [newlyCreatedTicket, setNewlyCreatedTicket] = useState<HRRequest | null>(null);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  useEffect(() => {
    loadUserDataAndRequests();
  }, []);

  async function loadUserDataAndRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data: empData } = await supabase
      .from('employees')
      .select('name, badge_number, is_admin, role')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();

    const profile = {
      name: empData ? `${empData.name} (${empData.badge_number})` : session.user.email,
      email: session.user.email,
      isAdmin: empData?.is_admin || (empData?.role && ['High Command', 'HR'].includes(empData.role)) || false
    };

    setUserProfile(profile);

    let query = supabase.from('hr_requests').select('*').order('created_at', { ascending: false });
    if (!profile.isAdmin) {
      query = query.eq('officer_email', profile.email);
    }

    const { data: reqData, error } = await query;
    if (error) console.error("Error fetching requests:", error);
    else if (reqData) setRequests(reqData);
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!userProfile) return;

    const { data, error } = await supabase
      .from('hr_requests')
      .insert([{ ...newRequest, officer_name: userProfile.name, officer_email: userProfile.email, status: 'Pending Review' }])
      .select();

    if (error) {
      alert("Failed to submit ticket: " + error.message);
      setShowSubmitConfirm(false);
    } else if (data) {
      logAuditAction("HR_REQUEST_FILED", userProfile.name, `Submitted HR Ticket: ${newRequest.subject}`, userProfile.name);
      setRequests([data[0], ...requests]);
      setNewlyCreatedTicket(data[0]);
      setNewRequest({ subject: "", description: "" });
      setIsCustomSubject(false);
      setShowSubmitConfirm(false);
      setShowSubmitSuccess(true);
      setActiveTab('Active'); // Switch to active tab so they see their new ticket immediately
    }
  };

  const handleOpenTicket = async (ticket: HRRequest) => {
    setActiveTicket(ticket);
    const { data } = await supabase
      .from('hr_comments')
      .select('*')
      .eq('request_id', ticket.id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTicket || !userProfile) return;

    const { data, error } = await supabase
      .from('hr_comments')
      .insert([{
        request_id: activeTicket.id,
        author_name: userProfile.isAdmin ? `Command (${userProfile.name})` : userProfile.name,
        message: newComment
      }])
      .select();

    if (error) alert("Failed to send message.");
    else if (data) {
      setComments([...comments, data[0]]);
      setNewComment("");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('hr_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (activeTicket?.id === id) setActiveTicket({ ...activeTicket, status: newStatus });
    }
  };

  const handleConfirmResolve = async () => {
    if (!activeTicket || !userProfile) return;

    // Auto-send a message confirming resolution
    const { data } = await supabase
      .from('hr_comments')
      .insert([{
        request_id: activeTicket.id,
        author_name: `System Notification`,
        message: `This ticket has been officially marked as resolved by Command (${userProfile.name}) and is now closed to further replies.`
      }])
      .select();

    if (data) {
      setComments([...comments, data[0]]);
    }

    logAuditAction("HR_REQUEST_RESOLVED", activeTicket.officer_name, `Resolved HR Ticket: ${activeTicket.subject} by Admin`, userProfile.name);
    await handleUpdateStatus(activeTicket.id, 'Resolved');
    setShowResolveConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const { error } = await supabase.from('hr_requests').delete().eq('id', ticketToDelete);
    if (!error) {
      const ticket = requests.find(r => r.id === ticketToDelete);
      if (ticket) logAuditAction("HR_REQUEST_DELETED", ticket.officer_name, `Deleted HR Ticket: ${ticket.subject} by Admin`, userProfile?.name);
      setRequests(requests.filter(req => req.id !== ticketToDelete));
      setActiveTicket(null);
      setTicketToDelete(null);
    }
  };

  // Filter requests based on the selected tab
  const displayedRequests = requests.filter(req =>
    activeTab === 'Active' ? req.status !== 'Resolved' : req.status === 'Resolved'
  );

  // ==========================================
  // UI VIEW 1: THE PRIVATE CHAT THREAD VIEW
  // ==========================================
  if (activeTicket) {
    return (
      <div className="p-8 space-y-8 bg-transparent min-h-full">
        <button onClick={() => setActiveTicket(null)} className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-white mb-1">{activeTicket.subject}</CardTitle>
                <p className="text-sm text-slate-400">Filed by {activeTicket.officer_name} on {new Date(activeTicket.created_at).toLocaleString()}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold border ${activeTicket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                {activeTicket.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {activeTicket.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-slate-300 whitespace-pre-wrap">{activeTicket.description}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Official Communication Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No replies yet. Send a message below.</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className={`flex flex-col ${comment.author_name.includes('Command') ? 'items-start' : 'items-end'}`}>
                    <span className="text-[10px] text-slate-500 mb-1 px-1">{comment.author_name} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className={`px-4 py-2 rounded-xl text-sm max-w-[85%] ${comment.author_name.includes('Command') ? 'bg-emerald-900/40 border border-emerald-500/20 text-emerald-100' : 'bg-slate-800 text-slate-200'
                      }`}>
                      {comment.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex gap-2 pt-4 border-t border-slate-800 mt-4">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Type your secure message..."
                disabled={activeTicket.status === 'Resolved'}
              />
              <button
                type="submit"
                disabled={activeTicket.status === 'Resolved'}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </CardContent>
        </Card>

        {userProfile?.isAdmin && adminSafeMode && (
          <div className="flex justify-end gap-3 pt-4">
            {activeTicket.status !== 'Resolved' && (
              <button onClick={() => setShowResolveConfirm(true)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                Mark Issue as Resolved
              </button>
            )}
            <button onClick={() => setTicketToDelete(activeTicket.id)} className="flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-md font-medium text-sm transition-colors border border-transparent hover:border-rose-500/20">
              <Trash2 className="w-4 h-4" /> Delete Record
            </button>
          </div>
        )}

        {/* Resolve Confirmation Modal */}
        {showResolveConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Resolve Ticket</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Are you sure you want to mark this ticket as resolved? This will lock the thread and prevent further replies from the officer.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowResolveConfirm(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmResolve}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    Confirm Resolve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // UI VIEW 2: THE MAIN DASHBOARD
  // ==========================================
  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <Ticket className="w-10 h-10 text-brand" />
              HR REQUESTS & <span className="font-bold text-brand">SUPPORT</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              {userProfile?.isAdmin ? "Command View: Review and respond to departmental inquiries." : "Submit an official, confidential request directly to High Command."}
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900 border-emerald-900/50 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-emerald-400">Open a Confidential Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Your Name & Callsign</label>
              <input required type="text" value={userProfile?.name || ""} disabled className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Category</label>
              <select
                value={isCustomSubject ? 'Custom' : newRequest.subject}
                onChange={e => {
                  if (e.target.value === 'Custom') {
                    setIsCustomSubject(true);
                    setNewRequest({ ...newRequest, subject: '' });
                  } else {
                    setIsCustomSubject(false);
                    setNewRequest({ ...newRequest, subject: e.target.value });
                  }
                }}
                className={`w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ${isCustomSubject ? 'mb-2' : ''}`} required>
                <option value="" disabled>Select a subject...</option>
                <option value="Uniform Request">Uniform / Equipment Request</option>
                <option value="Callsign Change">Callsign Change Request</option>
                <option value="Internal Complaint">Internal Complaint / Report</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Custom">Other (Custom)</option>
              </select>
              {isCustomSubject && (
                <input
                  type="text"
                  value={newRequest.subject}
                  onChange={e => setNewRequest({ ...newRequest, subject: e.target.value })}
                  className="w-full rounded-md border border-emerald-500/50 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 animate-in fade-in slide-in-from-top-1"
                  placeholder="Type your custom category..."
                  required
                />
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-slate-400">Description</label>
              <textarea required rows={3} value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Provide detailed information..." />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-5 py-2 rounded-md font-medium transition-colors border border-emerald-500/20 text-sm">
                <Send className="w-4 h-4" /> Secure Submit
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TICKETS BOARD WITH TABS */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-2">
            <CardTitle className="text-lg font-medium">{userProfile?.isAdmin ? "Department Tickets" : "Your Tickets"}</CardTitle>

            {/* TAB CONTROLS */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('Active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-300 hover:bg-brand/10 group'
                  }`}
              >
                <Clock className="w-4 h-4 inline mr-1.5" /> Active
              </button>
              <button
                onClick={() => setActiveTab('Resolved')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'Resolved' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-brand/10 group'
                  }`}
              >
                <History className="w-4 h-4 inline mr-1.5" /> Resolved History
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="group/table">
                {displayedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 bg-slate-900/20 rounded-lg">
                      No {activeTab.toLowerCase()} tickets found.
                    </td>
                  </tr>
                ) : (
                  displayedRequests.map((request) => (
                    <tr key={request.id} className="bg-slate-900/30 hover:bg-slate-800/80 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-2xl shadow-[inset_2px_0_0_0_rgba(var(--brand-main),0.5)] hover:shadow-[inset_4px_0_0_0_rgba(var(--brand-main),1),_0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-lg">
                      <td className="py-3 px-3 text-slate-400 rounded-l-lg">{new Date(request.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-3 font-medium text-white">
                        <span className="inline-block transition-transform duration-300 origin-left group-hover:scale-105">
                          {request.officer_name}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-medium">{request.subject}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${request.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                          {request.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right rounded-r-lg">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleOpenTicket(request)} className="text-sky-400 hover:text-sky-300 text-xs font-medium border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" /> {activeTab === 'Resolved' ? 'View Log' : 'Open Thread'}
                          </button>
                          {userProfile?.isAdmin && adminSafeMode && (
                            <button onClick={() => setTicketToDelete(request.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Support Ticket</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to permanently delete this HR ticket? All associated messages and history will be completely erased. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setTicketToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Send className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Confirm Submission</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you ready to submit this request to High Command? All tickets are securely logged and officially bound to your badge number.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSubmitSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Dispatch confirms your request has been securely routed to High Command. You will be notified of any updates in your Active Tickets tab.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowSubmitSuccess(false)}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowSubmitSuccess(false);
                    if (newlyCreatedTicket) handleOpenTicket(newlyCreatedTicket);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-900/20"
                >
                  <MessageSquare className="w-4 h-4" /> Open Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}