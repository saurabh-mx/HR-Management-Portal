import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { ClipboardList, Search, Clock, User, Activity, AlertTriangle, Shield, Filter, LogIn, ChevronDown } from "lucide-react";
import { useAuth } from '@/auth/hooks/useAuth';

interface AuditLog {
  id: string;
  created_at: string;
  admin_email: string;
  action_type: string;
  target_employee: string;
  details: string;
}

export default function AuditLogs() {
  const { profile, adminSafeMode } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'System' | 'Logins'>('System');
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAdminStatus();
  }, [profile]);

  async function checkAdminStatus() {
    if (adminSafeMode) {
      setIsAdmin(true);
      fetchLogs();
      return;
    }

    if (!profile) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    if (profile.is_admin) {
      setIsAdmin(true);
      fetchLogs();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }

  async function fetchLogs() {
    const [{ data: logsData, error }, { data: empData }] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('employees')
        .select('discord_tag, name')
    ]);

    if (empData) {
      const map: Record<string, string> = {};
      empData.forEach(emp => {
        if (emp.discord_tag) {
          map[emp.discord_tag.toLowerCase()] = emp.name;
        }
      });
      setEmployeeMap(map);
    }

    if (error) {
      console.error("Error fetching audit logs:", error);
      alert("Error loading audit logs. Make sure the table exists and RLS policies are applied. " + error.message);
    } else if (logsData) {
      setLogs(logsData);
    }
    setIsLoading(false);
  }

  const getActionConfig = (type: string) => {
    const t = type.toUpperCase();

    let icon = <Activity className="w-4 h-4" />;
    if (t.includes('STRIKE')) icon = <AlertTriangle className="w-4 h-4" />;
    else if (t.includes('LOA')) icon = <Clock className="w-4 h-4" />;
    else if (t.includes('ROLE') || t.includes('RANK') || t.includes('PASSWORD')) icon = <Shield className="w-4 h-4" />;
    else if (t.includes('PERSONNEL') || t.includes('HR')) icon = <User className="w-4 h-4" />;

    if (t.endsWith('_SUBMITTED') || t.endsWith('_ADDED') || t.endsWith('_CREATED') || t.endsWith('_SCHEDULED') || t.endsWith('_FILED') || t.endsWith('_ISSUED')) {
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon };
    }
    if (t.endsWith('_UPDATED') || t.endsWith('_RESOLVED') || t.endsWith('_EXPORTED') || t.endsWith('_SYNC') || t.endsWith('_REQUEST')) {
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon };
    }
    if (t.endsWith('_DELETED') || t.endsWith('_REMOVED') || t.endsWith('_CANCELED') || t.endsWith('_DENIED')) {
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon };
    }

    return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon };
  };

  const filteredLogs = logs.filter(log => {
    // 1. Tab Filtering
    if (activeTab === 'System' && log.action_type === 'USER_LOGIN') return false;
    if (activeTab === 'Logins' && log.action_type !== 'USER_LOGIN') return false;

    // 2. Search & Action Filtering
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.admin_email.toLowerCase().includes(query) ||
      log.action_type.toLowerCase().includes(query) ||
      (log.target_employee && log.target_employee.toLowerCase().includes(query)) ||
      (log.details && log.details.toLowerCase().includes(query));

    const matchesFilter = actionFilter === "All" || (
      actionFilter === "SUBMIT" ? !!log.action_type.match(/_(SUBMITTED|ADDED|CREATED|SCHEDULED|FILED|ISSUED)$/i) :
        actionFilter === "UPDATE" ? !!log.action_type.match(/_(UPDATED|RESOLVED|EXPORTED|SYNC|REQUEST)$/i) :
          actionFilter === "DELETE" ? !!log.action_type.match(/_(DELETED|REMOVED|CANCELED|DENIED)$/i) :
            log.action_type === actionFilter
    );

    return matchesSearch && matchesFilter;
  });

  // We use fixed categories now
  const filterOptions = [
    { label: 'SUBMIT', dummy: 'DUMMY_SUBMITTED' },
    { label: 'UPDATE', dummy: 'DUMMY_UPDATED' },
    { label: 'DELETE', dummy: 'DUMMY_DELETED' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4 max-w-md bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 p-8 rounded-2xl border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.05)]">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wider">ACCESS DENIED</h2>
          <p className="text-slate-400">You do not have the required clearance to view Audit Logs. This area is restricted to High Command and HR personnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Header */}
      <div className="relative rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60 z-20">
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent"></div>
        </div>
        <div className="relative p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <ClipboardList className="w-7 h-7 text-brand" />
              AUDIT <span className="font-bold text-brand">LOGS</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg font-light tracking-wide max-w-xl">
              System-wide administrative action tracking and history.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {activeTab === 'System' && (
              <div className="relative w-full md:w-56">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-full flex items-center justify-between bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand/50 transition-all backdrop-blur-md"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">
                      {actionFilter === "All" ? "All Actions" : (
                        <span className="flex items-center gap-1.5">
                          {(() => {
                            const dummy = actionFilter === 'SUBMIT' ? 'DUMMY_SUBMITTED' : actionFilter === 'UPDATE' ? 'DUMMY_UPDATED' : 'DUMMY_DELETED';
                            const conf = getActionConfig(dummy);
                            return <><span className={conf.color}>{conf.icon}</span> {actionFilter}</>;
                          })()}
                        </span>
                      )}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full mt-2 right-0 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setActionFilter("All"); setIsFilterOpen(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${actionFilter === 'All' ? 'bg-brand/20 text-brand font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      All Actions
                    </button>
                    {filterOptions.map(({ label, dummy }) => {
                      const config = getActionConfig(dummy);
                      const isSelected = actionFilter === label;
                      return (
                        <button
                          key={label}
                          onClick={() => { setActionFilter(label); setIsFilterOpen(false); }}
                          className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isSelected
                              ? `${config.bg} ${config.color} border border-current shadow-sm`
                              : `hover:bg-slate-800 text-slate-400 border border-transparent hover:${config.border}`
                            }`}
                        >
                          <span className={isSelected ? '' : config.color}>{config.icon}</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all backdrop-blur-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/60 p-1.5 rounded-xl border border-slate-800/60 backdrop-blur-xl w-fit mb-6">
        <button
          onClick={() => { setActiveTab('System'); setActionFilter('All'); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'System'
              ? 'bg-brand/20 text-brand shadow-[0_0_15px_rgba(var(--brand-main),0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
        >
          <Shield className="w-4 h-4" /> Administrative Activity
        </button>
        <button
          onClick={() => { setActiveTab('Logins'); setActionFilter('All'); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'Logins'
              ? 'bg-brand/20 text-brand shadow-[0_0_15px_rgba(var(--brand-main),0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
        >
          <LogIn className="w-4 h-4" /> Login Activity
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              {activeTab === 'System' ? (
                <tr className="bg-slate-950/80 border-b border-slate-800/60 text-xs uppercase tracking-widest text-slate-400">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Details</th>
                  <th className="p-4 font-semibold">By Who</th>
                </tr>
              ) : (
                <tr className="bg-slate-950/80 border-b border-slate-800/60 text-xs uppercase tracking-widest text-slate-400">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">User Identity</th>
                  <th className="p-4 font-semibold">Authentication Status</th>
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">System Details</th>
                </tr>
              )}
            </thead>
            <tbody className="text-sm group/table">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/20 rounded-lg">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const config = getActionConfig(log.action_type);

                  if (activeTab === 'Logins') {
                    const discordTag = log.admin_email.split('@')[0].toLowerCase();
                    const realName = employeeMap[discordTag] || log.target_employee;

                    return (
                      <tr key={log.id} className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/30 hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(14,165,233,0.2)]/80 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-2xl shadow-[inset_2px_0_0_0_rgba(var(--brand-main),0.5)] hover:shadow-[inset_4px_0_0_0_rgba(var(--brand-main),1),_0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-lg">
                        <td className="p-4 font-bold text-slate-200 rounded-l-lg">
                          <span className="inline-block transition-transform duration-300 origin-left group-hover:scale-105">
                            {realName !== "System" && realName !== "Unknown" ? realName : (employeeMap[discordTag] || "—")}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{log.admin_email}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Authenticated User</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <Shield className="w-3.5 h-3.5" />
                            Secure Login
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-400 max-w-md truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={log.id} className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/30 hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(14,165,233,0.2)]/80 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-2xl shadow-[inset_2px_0_0_0_rgba(var(--brand-main),0.5)] hover:shadow-[inset_4px_0_0_0_rgba(var(--brand-main),1),_0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-lg">
                      <td className="p-4 font-mono text-slate-300 rounded-l-lg">
                        <span className="inline-block transition-transform duration-300 origin-left group-hover:scale-105">
                          {log.target_employee || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${config.bg} ${config.color} ${config.border}`}>
                          {config.icon}
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-400 max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-4 font-medium text-slate-300 rounded-r-lg">
                        {log.admin_email.split('@')[0]}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
