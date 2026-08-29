import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Activity, ShieldAlert, CheckCircle, RefreshCw, UserPlus, Trash2, Edit2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  admin_email: string;
  action_type: string;
  target_employee: string;
  details: string;
  created_at: string;
}

export default function LiveActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    const subscription = supabase
      .channel('public:audit_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const newLog = payload.new as AuditLog;
        setLogs(prev => [newLog, ...prev].slice(0, 50)); // keep last 50
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setLogs(data);
    }
    setIsLoading(false);
  };

  const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('remove') || a.includes('delete')) return <Trash2 className="w-4 h-4 text-rose-400" />;
    if (a.includes('add') || a.includes('onboard')) return <UserPlus className="w-4 h-4 text-emerald-400" />;
    if (a.includes('sync')) return <RefreshCw className="w-4 h-4 text-sky-400" />;
    if (a.includes('approve') || a.includes('accept')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (a.includes('reject') || a.includes('deny') || a.includes('strike')) return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    if (a.includes('edit') || a.includes('update') || a.includes('toggle')) return <Edit2 className="w-4 h-4 text-amber-400" />;
    return <Shield className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full border border-slate-800/60 rounded-xl glass-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-200">Live Activity Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Live</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-950/20 relative min-h-[350px] max-h-[350px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-600" />
            <p className="text-sm">Connecting to feed...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Activity className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No recent activity found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors group">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0 bg-slate-900 border border-slate-700/50 w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {log.action_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      <span className="text-slate-300 font-medium">{log.target_employee}</span> — {log.details}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 truncate max-w-[120px]">
                        {log.admin_email}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
