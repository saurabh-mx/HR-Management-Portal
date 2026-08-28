import { Shield, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';

interface PendingApprovalScreenProps {
  officerName?: string;
  approvalRequestId?: string;
  onLogout: () => void;
}

export default function PendingApprovalScreen({
  officerName,
  approvalRequestId,
  onLogout,
}: PendingApprovalScreenProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  // Poll for status changes every 15 seconds
  useEffect(() => {
    if (!approvalRequestId) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from('approval_requests')
        .select('status, submitted_at')
        .eq('id', approvalRequestId)
        .maybeSingle();

      if (data) {
        setStatus(data.status);
        setSubmittedAt(data.submitted_at);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [approvalRequestId]);

  // If approved, auto-redirect after a short delay
  useEffect(() => {
    if (status === 'approved') {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background texture */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear_gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="relative rounded-3xl overflow-hidden p-[1px]">
          {/* Dynamic border based on status */}
          <div className={`absolute inset-0 opacity-60 ${
            status === 'approved'
              ? 'bg-gradient-to-br from-emerald-500/30 via-slate-800 to-emerald-500/30'
              : status === 'rejected'
                ? 'bg-gradient-to-br from-rose-500/30 via-slate-800 to-rose-500/30'
                : 'bg-gradient-to-br from-blue-500/30 via-slate-800 to-indigo-500/30'
          }`} />

          <div className="relative bg-slate-950/95 backdrop-blur-3xl rounded-[23px] overflow-hidden p-8 sm:p-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center text-center">
              {/* Status Icon */}
              {status === 'approved' ? (
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              ) : status === 'rejected' ? (
                <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-6 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <XCircle className="w-10 h-10 text-rose-400" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
                  <Shield className="w-10 h-10 text-blue-400" />
                  {/* Orbiting dot */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                </div>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {status === 'approved' ? 'Access Granted' : status === 'rejected' ? 'Access Denied' : 'Pending Approval'}
              </h2>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                {status === 'approved'
                  ? 'Your account has been approved. Redirecting to the portal...'
                  : status === 'rejected'
                    ? 'Your access request was denied. Please contact High Command for further assistance.'
                    : `Welcome${officerName ? `, ${officerName}` : ''}. Your account is awaiting approval from High Command or an administrator.`}
              </p>

              {/* Status Details Card */}
              <div className={`w-full rounded-xl border p-4 mb-6 ${
                status === 'approved'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : status === 'rejected'
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Status</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      status === 'approved' ? 'text-emerald-400' : status === 'rejected' ? 'text-rose-400' : 'text-blue-400'
                    }`}>
                      {status === 'approved' ? '✓ Approved' : status === 'rejected' ? '✗ Rejected' : '◌ Pending Review'}
                    </span>
                  </div>

                  {submittedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Submitted</span>
                      <span className="text-xs text-slate-300">{formatDate(submittedAt)}</span>
                    </div>
                  )}

                  {status === 'pending' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Est. Wait</span>
                      <span className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Typically &lt; 24 hours
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {status === 'approved' ? (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all group shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  <span className="flex items-center justify-center gap-3">
                    Enter Portal
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all"
                >
                  Sign Out
                </button>
              )}

              {status === 'pending' && (
                <p className="mt-4 text-[10px] text-slate-600 tracking-wider">
                  This page auto-refreshes. You'll be redirected when approved.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Secure Access Protocol &bull; Approval Required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
