import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { AlertCircle, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface PendingSOI {
  id: string;
  applicant_name: string;
  target_sub_department: string;
  status: string;
  created_at: string;
}

export default function PriorityQueue() {
  const [pendingRequests, setPendingRequests] = useState<PendingSOI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingSOIs();

    const subscription = supabase
      .channel('public:soi_applications:priority')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soi_applications' }, () => {
        fetchPendingSOIs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchPendingSOIs = async () => {
    const { data, error } = await supabase
      .from('soi_applications')
      .select('id, applicant_name, target_sub_department, status, created_at')
      .eq('status', 'Pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (data && !error) {
      setPendingRequests(data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full border border-slate-800/60 rounded-xl glass-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-200">Priority Queue</h3>
        </div>
        <Link 
          to="/soi"
          className="text-xs font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-0 bg-slate-950/20 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-600" />
            <p className="text-sm">Loading queue...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Shield className="w-8 h-8 mb-2 opacity-20 text-emerald-400" />
            <p className="text-sm font-medium text-slate-400">Queue is clear</p>
            <p className="text-xs">No pending requests require attention.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-400">
                      {req.applicant_name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{req.applicant_name}</h4>
                    <p className="text-xs text-slate-500">
                      Applied for <span className="text-amber-400 font-medium">{req.target_sub_department}</span> • {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Link
                  to="/soi"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
