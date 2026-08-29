import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, User, Badge, Hash, Globe } from 'lucide-react';
import { getPendingApprovals, getApprovalHistory, approveOfficerRequest, rejectOfficerRequest, AuthError } from '@/lib/auth';
import type { ApprovalRequest } from '@/lib/auth';
import { useAuth } from '@/auth/hooks/useAuth';
import { logAuditAction } from '@/lib/auditLogger';

export default function OfficerApprovalPanel() {
  const { profile } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [history, setHistory] = useState<ApprovalRequest[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rationale, setRationale] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, historyPage]);

  const fetchPending = async () => {
    setLoading(true);
    const data = await getPendingApprovals();
    setPendingApprovals(data);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const result = await getApprovalHistory(historyPage, 10);
    setHistory(result.data);
    setHistoryTotal(result.total);
  };

  const handleApprove = async (approvalId: string) => {
    const reason = rationale[approvalId];
    if (!reason || reason.trim().length < 10) {
      setError('Rationale must be at least 10 characters.');
      return;
    }

    setActionLoading(approvalId);
    setError(null);

    try {
      await approveOfficerRequest(approvalId, profile?.id || '', {
        rationale: reason,
      });

      const approval = pendingApprovals.find(a => a.id === approvalId);
      logAuditAction(
        'OFFICER_ACCESS_APPROVED',
        approval?.officer_name || 'Unknown',
        `Approved officer access: ${reason}`
      );

      await fetchPending();
      if (showHistory) await fetchHistory();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Failed to approve request.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = rationale[approvalId];
    if (!reason || reason.trim().length < 10) {
      setError('Rationale must be at least 10 characters for rejection.');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this access request?')) return;

    setActionLoading(approvalId);
    setError(null);

    try {
      await rejectOfficerRequest(approvalId, profile?.id || '', reason);

      const approval = pendingApprovals.find(a => a.id === approvalId);
      logAuditAction(
        'OFFICER_ACCESS_REJECTED',
        approval?.officer_name || 'Unknown',
        `Rejected officer access: ${reason}`
      );

      await fetchPending();
      if (showHistory) await fetchHistory();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Failed to reject request.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border glass-panel p-8 text-center">
        <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">Loading approval queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── PENDING APPROVALS ─── */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-500/20 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Officer Access Requests</h2>
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
              {pendingApprovals.length} Pending
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-300 text-xs">✕</button>
            </div>
          )}

          <div className="divide-y divide-amber-500/10">
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="hover:bg-amber-500/5 transition-colors">
                {/* Summary Row */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{approval.officer_name || 'Unknown Officer'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {approval.officer_callsign && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> {approval.officer_callsign}
                          </span>
                        )}
                        {approval.officer_department && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {approval.officer_department}
                          </span>
                        )}
                        {approval.officer_badge && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Badge className="w-3 h-3" /> {approval.officer_badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 hidden sm:block">
                      {formatDate(approval.submitted_at)}
                    </span>
                    {expandedId === approval.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details + Action */}
                {expandedId === approval.id && (
                  <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Officer Details Card */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-900/50 rounded-lg p-4 border border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Discord</span>
                        <span className="text-xs text-slate-300">{approval.officer_discord_tag || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Request Type</span>
                        <span className="text-xs text-slate-300 capitalize">{approval.request_type?.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Submitted</span>
                        <span className="text-xs text-slate-300">{formatDate(approval.submitted_at)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Expires</span>
                        <span className="text-xs text-slate-300">{formatDate(approval.expires_at)}</span>
                      </div>
                    </div>

                    {/* Rationale Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Decision Rationale <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        value={rationale[approval.id] || ''}
                        onChange={(e) => setRationale(prev => ({ ...prev, [approval.id]: e.target.value }))}
                        placeholder="Provide rationale for your decision (min 10 chars)..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors resize-none h-20"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={actionLoading === approval.id}
                        className="flex-1 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === approval.id ? 'Processing...' : 'Approve Access'}
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={actionLoading === approval.id}
                        className="flex-1 px-4 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === approval.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── NO PENDING ─── */}
      {pendingApprovals.length === 0 && (
        <div className="rounded-xl border glass-panel p-6 text-center">
          <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No Pending Officer Access Requests</p>
          <p className="text-xs text-slate-600 mt-1">All officer access requests have been processed.</p>
        </div>
      )}

      {/* ─── APPROVAL HISTORY TOGGLE ─── */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-medium transition-colors"
      >
        <Clock className="w-3.5 h-3.5" />
        {showHistory ? 'Hide History' : 'View Approval History'}
        {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* ─── APPROVAL HISTORY ─── */}
      {showHistory && (
        <div className="rounded-xl border glass-panel backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Approval History</h2>
              <span className="text-[10px] text-slate-500">{historyTotal} total</span>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No approval history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 border-b border-slate-800/60">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Officer</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Decision</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reviewer</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3 text-slate-200 font-medium text-xs">{item.officer_name || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {item.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{item.reviewer_name || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(item.reviewed_at)}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={item.rationale || ''}>
                        {item.rationale || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {historyTotal > 10 && (
            <div className="px-5 py-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Page {historyPage + 1} of {Math.ceil(historyTotal / 10)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                  disabled={historyPage === 0}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setHistoryPage(historyPage + 1)}
                  disabled={(historyPage + 1) * 10 >= historyTotal}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
