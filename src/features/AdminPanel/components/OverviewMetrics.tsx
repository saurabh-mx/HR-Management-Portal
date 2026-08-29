
import { Users, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import type { Employee } from '@/types';

interface OverviewMetricsProps {
  employees: Employee[];
  pendingCount: number;
  recentAlertsCount?: number;
  onOpenApprovals?: () => void;
}

export default function OverviewMetrics({ employees, pendingCount, recentAlertsCount = 0, onOpenApprovals }: OverviewMetricsProps) {
  const activePersonnel = employees.filter(e => e.status !== 'INACTIVE').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Total Personnel */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 text-left glass-panel transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Personnel</p>
            <h3 className="text-2xl font-bold text-slate-200">{activePersonnel}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400"><span className="text-amber-400 font-bold">{employees.filter(e => e.role === 'admin' || e.role === 'High Command').length}</span> HC</span>
          <span className="text-xs text-slate-400"><span className="text-blue-400 font-bold">{employees.filter(e => e.role === 'Command').length}</span> CMD</span>
          <span className="text-xs text-slate-400"><span className="text-violet-400 font-bold">{employees.filter(e => e.role === 'HR').length}</span> HR</span>
          <span className="text-xs text-slate-400"><span className="text-cyan-400 font-bold">{employees.filter(e => e.role === 'Supervisor').length}</span> SUP</span>
          <span className="text-xs text-slate-400"><span className="text-slate-300 font-bold">{employees.filter(e => e.role === 'Patrol Officer').length}</span> PO</span>
          <span className="text-xs text-slate-400"><span className="text-emerald-400 font-bold">{employees.filter(e => e.role === 'Student').length}</span> STU</span>
        </div>
      </div>

      {/* Pending Approvals */}
      <button 
        onClick={onOpenApprovals}
        className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 text-left glass-panel transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-slate-200">{pendingCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400 group-hover:text-amber-400/80 transition-colors">
          Awaiting officer review
        </div>
      </button>

      {/* System Health */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 text-left glass-panel transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">System Health</p>
            <h3 className="text-2xl font-bold text-slate-200">Optimal</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400/80">All systems online</span>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 text-left glass-panel transition-all duration-300 hover:border-rose-500/30 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Recent Alerts</p>
            <h3 className="text-2xl font-bold text-slate-200">{recentAlertsCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          In the last 24 hours
        </div>
      </div>

    </div>
  );
}
