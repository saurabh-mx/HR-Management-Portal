import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, CheckCircle, Clock, Trash2, Send, MessageSquare, ArrowLeft, History } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [userProfile, setUserProfile] = useState<{name: string, email: string, isAdmin: boolean} | null>(null);
  
  // Tab State for filtering Active vs Resolved
  const [activeTab, setActiveTab] = useState<'Active' | 'Resolved'>('Active');

  // Chat Thread States
  const [activeTicket, setActiveTicket] = useState<HRRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const [newRequest, setNewRequest] = useState({
    officer_name: "",
    subject: "",
    description: ""
  });

  useEffect(() => {
    loadUserDataAndRequests();
  }, []);

  async function loadUserDataAndRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data: empData } = await supabase
      .from('employees')
      .select('name, badge_number, is_admin')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    const profile = {
      name: empData ? `${empData.name} (${empData.badge_number})` : session.user.email,
      email: session.user.email,
      isAdmin: empData?.is_admin || false
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

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const { data, error } = await supabase
      .from('hr_requests')
      .insert([{ ...newRequest, officer_email: userProfile.email, status: 'Pending Review' }])
      .select();

    if (error) {
      alert("Failed to submit ticket: " + error.message);
    } else if (data) {
      setRequests([data[0], ...requests]);
      setNewRequest({ officer_name: "", subject: "", description: "" });
      setActiveTab('Active'); // Switch to active tab so they see their new ticket immediately
      alert("Dispatch: Your request has been securely submitted to High Command.");
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this HR ticket and all its messages?")) return;
    const { error } = await supabase.from('hr_requests').delete().eq('id', id);
    if (!error) {
      setRequests(requests.filter(req => req.id !== id));
      setActiveTicket(null);
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
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <button onClick={() => setActiveTicket(null)} className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-white mb-1">{activeTicket.subject}</CardTitle>
                <p className="text-sm text-slate-400">Filed by {activeTicket.officer_name} on {new Date(activeTicket.created_at).toLocaleString()}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold border ${
                activeTicket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
                    <span className="text-[10px] text-slate-500 mb-1 px-1">{comment.author_name} • {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <div className={`px-4 py-2 rounded-xl text-sm max-w-[85%] ${
                      comment.author_name.includes('Command') ? 'bg-emerald-900/40 border border-emerald-500/20 text-emerald-100' : 'bg-slate-800 text-slate-200'
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

        {userProfile?.isAdmin && (
          <div className="flex justify-end gap-3 pt-4">
            {activeTicket.status !== 'Resolved' && (
              <button onClick={() => handleUpdateStatus(activeTicket.id, 'Resolved')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                Mark Issue as Resolved
              </button>
            )}
            <button onClick={() => handleDelete(activeTicket.id)} className="flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-md font-medium text-sm transition-colors border border-transparent hover:border-rose-500/20">
              <Trash2 className="w-4 h-4" /> Delete Record
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // UI VIEW 2: THE MAIN DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Ticket className="w-8 h-8 text-emerald-500" />
          HR Requests & Support
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {userProfile?.isAdmin ? "Command View: Review and respond to departmental inquiries." : "Submit an official, confidential request directly to High Command."}
        </p>
      </div>

      <Card className="bg-slate-900 border-emerald-900/50 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-emerald-400">Open a Confidential Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Your Name & Callsign</label>
              <input required type="text" value={newRequest.officer_name} onChange={e => setNewRequest({...newRequest, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. Alex Hawk (101)" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Category</label>
              <select value={newRequest.subject} onChange={e => setNewRequest({...newRequest, subject: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" required>
                <option value="" disabled>Select a subject...</option>
                <option value="Uniform Request">Uniform / Equipment Request</option>
                <option value="Callsign Change">Callsign Change Request</option>
                <option value="Internal Complaint">Internal Complaint / Report</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-slate-400">Description</label>
              <textarea required rows={3} value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Provide detailed information..." />
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
      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-2">
            <CardTitle className="text-lg font-medium">{userProfile?.isAdmin ? "Department Tickets" : "Your Tickets"}</CardTitle>
            
            {/* TAB CONTROLS */}
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('Active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1.5" /> Active
              </button>
              <button 
                onClick={() => setActiveTab('Resolved')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'Resolved' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <History className="w-4 h-4 inline mr-1.5" /> Resolved History
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No {activeTab.toLowerCase()} tickets found.
                    </td>
                  </tr>
                ) : (
                  displayedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(request.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{request.officer_name}</td>
                      <td className="py-3 text-slate-300 font-medium">{request.subject}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          request.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {request.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleOpenTicket(request)} className="text-sky-400 hover:text-sky-300 text-xs font-medium border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ml-auto">
                          <MessageSquare className="w-3 h-3" /> {activeTab === 'Resolved' ? 'View Log' : 'Open Thread'}
                        </button>
                      </td>
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