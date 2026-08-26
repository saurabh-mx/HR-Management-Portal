import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, XCircle, Trash2, Search, Plus, X, Filter, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from '@/auth/hooks/useAuth';
import { isHighCommandOrHR, isTrueAdmin, canReviewSOI } from '@/auth/roles/roleMatrix';

interface SOIApplication {
  id: string;
  officer_name: string;
  department: string;
  current_rank: string;
  target_sub_department: string;
  summary: string;
  status: string;
  review?: string;
  reviewed_by?: string;
  created_at: string;
}

export default function SOIApplications() {
  const { profile, adminSafeMode } = useAuth();
  const [records, setRecords] = useState<SOIApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authorName, setAuthorName] = useState("Unknown");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const subDepartments = ["HEAT", "FTD", "ASD", "K9", "MEDIA TEAM", "DOC", "SBI", "MEU"];

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'Approve' | 'Deny' | 'Delete' | null;
    recordId: string | null;
  }>({ isOpen: false, type: null, recordId: null });

  const [reviewText, setReviewText] = useState("");

  const [newRecord, setNewRecord] = useState({
    target_sub_department: "HEAT",
    summary: ""
  });

  useEffect(() => {
    if (profile) {
      setAuthorName(`${profile.name} (${profile.badge_number})`);
      fetchRecords(profile);
      setIsCheckingAuth(false);
    } else {
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  async function fetchRecords(userObj?: any) {
    let query = supabase.from('soi_applications').select('*').order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching SOI applications:", error);
    } else if (data) {
      const viewable = data.filter(r => {
        if (isHighCommandOrHR(userObj)) return true;
        if (r.status === 'Approved') return true;
        return r.officer_name === `${userObj.name} (${userObj.badge_number})` || 
               canReviewSOI(userObj, r.target_sub_department);
      });
      setRecords(viewable);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;
    const officerName = `${profile.name} (${profile.badge_number})`;

    const { data, error } = await supabase
      .from('soi_applications')
      .insert([{
        officer_name: officerName,
        department: profile.department || 'Unknown',
        current_rank: profile.rank || 'Unknown',
        target_sub_department: newRecord.target_sub_department,
        summary: newRecord.summary,
        status: 'Pending Review'
      }])
      .select();

    if (error) alert("Failed to submit request: " + error.message);
    else if (data) {
      logAuditAction("SOI_REQUEST", officerName, `Submitted SOI for ${newRecord.target_sub_department}`, authorName);
      setRecords([data[0], ...records]);
      setNewRecord({ target_sub_department: "HEAT", summary: "" });
      setShowForm(false);
    }
  };

  const openModal = (id: string, type: 'Approve' | 'Deny' | 'Delete') => {
    setReviewText("");
    setModalState({ isOpen: true, type, recordId: id });
  };

  const handleConfirmAction = async () => {
    if (!modalState.recordId || !modalState.type) return;

    const id = modalState.recordId;
    const type = modalState.type;

    if (type === 'Delete') {
      const { error } = await supabase.from('soi_applications').delete().eq('id', id);
      if (!error) {
        const rec = records.find(r => r.id === id);
        if (rec) logAuditAction("SOI_DELETED", rec.officer_name, `Deleted SOI application by Admin`, authorName);
        setRecords(records.filter(rec => rec.id !== id));
      }
    } else {
      if (type === 'Deny' && !reviewText.trim()) {
        alert("Please provide a reason for denial in the review comments.");
        return;
      }

      const newStatus = type === 'Approve' ? 'Approved' : 'Denied';
      const { error } = await supabase.from('soi_applications').update({
        status: newStatus,
        reviewed_by: authorName,
        review: reviewText
      }).eq('id', id);

      if (!error) {
        const rec = records.find(r => r.id === id);
        if (rec) logAuditAction("SOI_DECISION", rec.officer_name, `${newStatus} SOI request for ${rec.target_sub_department}`, authorName);
        setRecords(records.map(rec => rec.id === id ? { ...rec, status: newStatus, reviewed_by: authorName, review: reviewText } : rec));
      }
    }

    setModalState({ isOpen: false, type: null, recordId: null });
  };


  const filteredRecords = records.filter(record => {
    const matchesSearch = record.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.target_sub_department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-[90vh]">
      {/* Sleek Glassmorphic Header */}
      <div className="relative mb-8">
        <div className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <Shield className="w-7 h-7 text-brand" />
              SOI <span className="font-bold text-brand">APPLICATIONS</span>
            </h1>
            <div className="w-16 h-1 bg-brand mt-2 mb-2 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-sm text-slate-400 font-light tracking-wide flex items-center gap-2">
              Apply for sub-departments and manage pending requests.
            </p>
          </div>
          <div className="shrink-0">
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md border text-sm ${
                showForm 
                ? 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800' 
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/50 hover:-translate-y-0.5'
              }`}
            >
              {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              <span>{showForm ? "Cancel" : "Submit SOI Application"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBMISSION FORM */}
      <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100 mb-8 mt-4' : 'grid-rows-[0fr] opacity-0 mb-0 mt-0'}`}>
        <div className="overflow-hidden">
          <Card className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/40 backdrop-blur-md border border-emerald-900/50 text-slate-200 shadow-xl relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-emerald-400 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Submit Statement of Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-medium text-slate-400">Officer Name</label>
              <input
                readOnly
                type="text"
                value={`${profile?.name} (${profile?.badge_number})`}
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:border-white/10 transition-all duration-500 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                placeholder="Auto-filled"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-medium text-slate-400">Department</label>
              <input
                readOnly
                type="text"
                value={profile?.department || "Unknown"}
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:border-white/10 transition-all duration-500 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                placeholder="Auto-filled"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-medium text-slate-400">Current Rank</label>
              <input
                readOnly
                type="text"
                value={profile?.rank || "Unknown"}
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:border-white/10 transition-all duration-500 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                placeholder="Auto-filled"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-medium text-slate-400">Target Sub-Department</label>
              <select
                value={newRecord.target_sub_department}
                onChange={e => setNewRecord({ ...newRecord, target_sub_department: e.target.value })}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 appearance-none"
              >
                {subDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-4">
              <label className="text-xs font-medium text-slate-400">Request / Qualifications Summary</label>
              <textarea 
                required 
                rows={4}
                value={newRecord.summary} 
                onChange={e => setNewRecord({ ...newRecord, summary: e.target.value })} 
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500" 
                placeholder="Detail why you want to join this sub-department and any relevant qualifications..." 
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm">
                Submit Application
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* RECORDS BOARD WITH SEARCH & FILTER */}
      <Card className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium">Application Records</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search officers or departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 w-full sm:w-48 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
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
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Target Sub-Department</th>
                  <th className="pb-3 font-medium">Summary</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Review</th>
                  <th className="pb-3 font-medium">Processed By</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/20 rounded-lg">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const canViewSummary = isHighCommandOrHR(profile) || canReviewSOI(profile, record.target_sub_department) || record.officer_name === `${profile?.name} (${profile?.badge_number})`;
                    
                    return (
                    <React.Fragment key={record.id}>
                      <tr 
                        className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/30 hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.2)]/80 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-2xl shadow-[inset_2px_0_0_0_rgba(16,185,129,0.3)] hover:shadow-[inset_4px_0_0_0_rgba(16,185,129,1),_0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-lg cursor-pointer"
                        onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                      >
                        <td className="py-3 px-3 text-slate-400 rounded-l-lg">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-medium text-white transition-colors">
                          <div className="flex items-center gap-1.5 group-hover:text-brand transition-colors">
                            {record.officer_name}
                            {expandedRowId === record.id ? <ChevronUp className="w-4 h-4 text-brand" /> : <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-brand" />}
                          </div>
                        </td>
                        <td className="py-3 text-emerald-400 font-medium">{record.target_sub_department}</td>
                        <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate" title={canViewSummary ? record.summary : 'Confidential'}>
                          {canViewSummary ? record.summary : 'Confidential'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${record.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              record.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                            {record.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
                              record.status === 'Denied' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate" title={record.review || ''}>
                          {record.status === 'Approved' ? (record.review || '—') : 
                           (record.status === 'Denied' && (isHighCommandOrHR(profile) || canReviewSOI(profile, record.target_sub_department))) ? (record.review || '—') :
                           record.review ? 'Confidential' : '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-medium">
                          {record.reviewed_by || '—'}
                        </td>
  
                        <td className="py-3 px-3 text-right rounded-r-lg">
                          <div className="flex items-center justify-end gap-2">
                            {record.status === 'Pending Review' && canReviewSOI(profile, record.target_sub_department) && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); openModal(record.id, 'Approve'); }} className="text-emerald-500 hover:text-emerald-400 text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded transition-colors">Approve</button>
                                <button onClick={(e) => { e.stopPropagation(); openModal(record.id, 'Deny'); }} className="text-rose-500 hover:text-rose-400 text-xs font-medium border border-rose-500/30 bg-rose-500/10 px-2 py-1 rounded transition-colors">Deny</button>
                              </>
                            )}
                            {isTrueAdmin(profile) && adminSafeMode && (
                              <button onClick={(e) => { e.stopPropagation(); openModal(record.id, 'Delete'); }} className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRowId === record.id && (
                        <tr>
                          <td colSpan={8} className="p-0 border-b border-slate-800/50">
                            <div className="bg-slate-900/50 p-6 shadow-inner animate-in slide-in-from-top-2 flex flex-col md:flex-row gap-6 mx-2 my-2 rounded-xl border border-slate-800">
                              <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-semibold text-brand uppercase tracking-widest flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5" /> Application Summary
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mt-2">
                                  {canViewSummary ? record.summary : 'This application summary is marked as confidential and is only visible to HR, High Command, the applicant, and the respective sub-department lead.'}
                                </p>
                              </div>
                              <div className="flex-1 space-y-2 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
                                <h4 className="text-xs font-semibold text-brand uppercase tracking-widest flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5" /> Review Comments
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mt-2">
                                  {record.status === 'Approved' ? (record.review || 'No review comments provided.') : 
                                    (record.status === 'Denied' && (isHighCommandOrHR(profile) || canReviewSOI(profile, record.target_sub_department))) ? (record.review || 'No review comments provided.') :
                                    record.review ? 'This review is marked as confidential.' : 'Pending review...'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CONFIRMATION MODAL */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 border border-slate-700 shadow-2xl rounded-xl max-w-sm w-full p-6 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${modalState.type === 'Approve' ? 'bg-emerald-500' :
                modalState.type === 'Deny' ? 'bg-rose-500' : 'bg-red-700'
              }`}></div>

            <h3 className="text-xl font-bold tracking-wider text-slate-200 mb-2 mt-2">Confirm Action</h3>
            <p className="text-sm text-slate-400 mb-4">
              Are you sure you want to <strong className={`font-bold uppercase tracking-wider ${modalState.type === 'Approve' ? 'text-emerald-500' :
                  modalState.type === 'Deny' ? 'text-rose-500' : 'text-red-500'
                }`}>{modalState.type}</strong> this application?
              {modalState.type === 'Delete' ? " This will permanently erase it." : " This action will log your name."}
            </p>

            {(modalState.type === 'Approve' || modalState.type === 'Deny') && (
              <div className="mb-6 space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Review Comments</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={modalState.type === 'Approve' ? 'Optional welcome message or feedback...' : 'Required reason for denial...'}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalState({ isOpen: false, type: null, recordId: null })}
                className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors border shadow-lg ${modalState.type === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-500/20' :
                    modalState.type === 'Deny' ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/50 shadow-rose-500/20' :
                      'bg-red-700 hover:bg-red-600 border-red-600/50 shadow-red-700/20'
                  }`}
              >
                Confirm {modalState.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
