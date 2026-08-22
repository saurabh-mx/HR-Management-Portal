import { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, ShieldAlert, CalendarOff, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    activeStrikes: 0,
    personnelOnLoa: 0,
    pendingRankChanges: 0,
    deptCounts: {
      SASP: 0,
      SAPR: 0,
      LSPD: 0,
      BCSO: 0,
      'SASP Academy': 0
    },
    recentStrikes: [] as any[],
    recentLoas: [] as any[]
  });

  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedStrike, setSelectedStrike] = useState<any>(null);

  const getRoleWeight = (role: string) => {
    switch (role) {
      case 'admin': return 4;
      case 'High Command': return 3;
      case 'Command': return 2;
      case 'HR': return 1;
      default: return 0;
    }
  };

  const isPrivileged = getRoleWeight(currentUserRole) >= 1;

  useEffect(() => {
    async function fetchStats() {
      // Fetch User Role for access control
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const discordId = session.user.email.split('@')[0];
        const { data: userData } = await supabase
          .from('employees')
          .select('role')
          .eq('discord_tag', discordId)
          .single();
        if (userData) {
          setCurrentUserRole(userData.role || "");
        }
      }

      // 1. Total Personnel & Department Breakdown
      const { data: personnelData } = await supabase
        .from('employees')
        .select('department');
      
      const deptCounts = {
        SASP: 0,
        SAPR: 0,
        LSPD: 0,
        BCSO: 0,
        'SASP Academy': 0
      };

      if (personnelData) {
        personnelData.forEach(p => {
          if (p.department && deptCounts[p.department as keyof typeof deptCounts] !== undefined) {
            deptCounts[p.department as keyof typeof deptCounts]++;
          }
        });
      }

      // 2. Active Strikes
      const { data: strikesData, count: strikesCount } = await supabase
        .from('strikes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      // 3. Personnel on LOA (Only Approved leaves)
      const { data: loaData, count: loaCount } = await supabase
        .from('loa_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'Approved')
        .order('start_date', { ascending: false })
        .limit(5);

      // 4. Pending Rank Changes
      const { count: rankCount } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending Review');

      setStats({
        totalPersonnel: personnelData?.length || 0,
        activeStrikes: strikesCount || 0,
        personnelOnLoa: loaCount || 0,
        pendingRankChanges: rankCount || 0,
        deptCounts,
        recentStrikes: strikesData || [],
        recentLoas: loaData || []
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-widest text-slate-200 uppercase drop-shadow-md">
            Command <span className="font-bold text-yellow-500">Dashboard</span>
          </h1>
          <div className="w-16 h-px bg-yellow-500 my-4 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
          <p className="text-slate-400 mt-2 font-light tracking-wide">Welcome back. Here is the current department overview.</p>
        </div>
        
        {/* Lumio Style Button extracted from Stitch */}
        <div className="pt-2">
          <button className="bg-black text-white px-5 py-2.5 rounded-[7px] font-medium text-[15px] font-sans hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 border border-slate-700/50">
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Personnel" 
          value={stats.totalPersonnel} 
          icon={Users} 
          description="Active roster count"
          trend="neutral"
          hoverContent={
            <div className="flex flex-col items-center w-full h-full justify-center px-0.5 py-1">
              {/* LEVEL 1: SASP */}
              <div className="flex flex-col items-center justify-center py-0.5 px-4 rounded bg-slate-950/60 border border-[#999999]/50 shadow-inner z-10">
                <span className="text-[10px] tracking-widest uppercase font-bold leading-none mb-0.5" style={{ color: '#999999' }}>SASP</span>
                <span className="text-sm font-medium text-slate-200 leading-none">{stats.deptCounts.SASP}</span>
              </div>
              
              {/* CONNECTOR 1 */}
              <div className="w-px h-2.5 bg-slate-500/50"></div>
              
              {/* HORIZONTAL CONNECTOR */}
              <div className="w-[75%] h-px bg-slate-500/50"></div>
              
              {/* PRONGS */}
              <div className="flex w-[75%] justify-between">
                <div className="w-px h-2.5 bg-slate-500/50"></div>
                <div className="w-px h-2.5 bg-slate-500/50"></div>
                <div className="w-px h-2.5 bg-slate-500/50"></div>
              </div>
              
              {/* LEVEL 2: LSPD, BCSO, SAPR */}
              <div className="flex w-full justify-between z-10 gap-1 px-1">
                <div className="flex flex-col items-center justify-center py-0.5 w-[30%] rounded bg-slate-950/60 border border-[#1c4587]/50 shadow-inner">
                  <span className="text-[8px] uppercase font-bold leading-none mb-0.5" style={{ color: '#1c4587' }}>LSPD</span>
                  <span className="text-[11px] font-medium text-slate-200 leading-none">{stats.deptCounts.LSPD}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center py-0.5 w-[30%] rounded bg-slate-950/60 border border-[#d2b14b]/50 shadow-inner">
                  <span className="text-[8px] uppercase font-bold leading-none mb-0.5" style={{ color: '#d2b14b' }}>BCSO</span>
                  <span className="text-[11px] font-medium text-slate-200 leading-none">{stats.deptCounts.BCSO}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center py-0.5 w-[30%] rounded bg-slate-950/60 border border-[#008239]/50 shadow-inner">
                  <span className="text-[8px] uppercase font-bold leading-none mb-0.5" style={{ color: '#008239' }}>SAPR</span>
                  <span className="text-[11px] font-medium text-slate-200 leading-none">{stats.deptCounts.SAPR}</span>
                </div>
              </div>
              
              {/* CONNECTOR 2 */}
              <div className="w-px h-2.5 bg-slate-500/50"></div>
              
              {/* LEVEL 3: Academy */}
              <div className="flex flex-col items-center justify-center py-0.5 px-4 rounded bg-slate-950/60 border border-[#938383]/50 shadow-inner z-10">
                <span className="text-[9px] tracking-widest uppercase font-bold leading-none mb-0.5" style={{ color: '#938383' }}>Academy</span>
                <span className="text-sm font-medium text-slate-200 leading-none">{stats.deptCounts['SASP Academy']}</span>
              </div>
            </div>
          }
        />
        <StatCard 
          title="Active Strikes" 
          value={stats.activeStrikes} 
          icon={ShieldAlert} 
          description="Issued disciplinary actions"
          trend="neutral"
          hoverContent={
            isPrivileged ? (
              <div className="space-y-2 max-w-xs">
                <div className="text-xs font-semibold text-rose-400 border-b border-slate-700 pb-1">Recent Disciplinary Debriefs</div>
                {stats.recentStrikes.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No recent strikes.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stats.recentStrikes.map(strike => (
                      <div key={strike.id} className="text-xs border border-rose-900/30 bg-rose-950/20 p-2 rounded flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-1">
                          <div 
                            className="font-semibold text-slate-200 cursor-pointer hover:text-rose-400 hover:underline transition-colors w-fit shrink-0"
                            onClick={() => setSelectedStrike(strike)}
                          >
                            {strike.officer_name}
                          </div>
                          {strike.action_type && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider whitespace-nowrap shrink-0 ${
                              strike.action_type === 'Strike' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                              strike.action_type === 'Verbal Warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                              {strike.action_type} {strike.action_type === 'Strike' && strike.strike_level ? `(${strike.strike_level})` : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] leading-tight break-words line-clamp-2">{strike.reason}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Issued by: {strike.issued_by}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          }
        />
        <StatCard 
          title="Personnel on LOA" 
          value={stats.personnelOnLoa} 
          icon={CalendarOff} 
          description="Currently on leave"
          trend="neutral"
          hoverContent={
            isPrivileged ? (
              <div className="space-y-2 max-w-xs">
                <div className="text-xs font-semibold text-fuchsia-400 border-b border-slate-700 pb-1">Approved Leaves of Absence</div>
                {stats.recentLoas.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No approved LOAs.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stats.recentLoas.map(loa => (
                      <div key={loa.id} className="text-xs border border-fuchsia-900/30 bg-fuchsia-950/20 p-2 rounded flex flex-col gap-1">
                        <div className="font-semibold text-slate-200">{loa.officer_name}</div>
                        <div className="text-slate-400 text-[11px] leading-tight break-words">{loa.reason}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          {new Date(loa.start_date).toLocaleDateString()} - {new Date(loa.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          }
        />
        <StatCard 
          title="Pending Rank Changes" 
          value={stats.pendingRankChanges} 
          icon={TrendingUp} 
          description="Awaiting Command approval"
          trend="neutral"
        />
      </div>

      {/* Placeholder for Recent Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-96 rounded-xl border border-yellow-900/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-500/80 mb-4 border-b border-yellow-900/30 pb-2">Recent Activity Feed</h3>
          <div className="flex-1 flex items-center justify-center text-slate-500 font-light italic">
            (Coming Soon)
          </div>
        </div>
        <div className="col-span-3 h-96 rounded-xl border border-yellow-900/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle glow in corner */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-900/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-500/80 mb-4 border-b border-yellow-900/30 pb-2">Important Bulletins</h3>
          <div className="flex-1 flex items-center justify-center text-slate-500 font-light italic">
            (Coming Soon)
          </div>
        </div>
      </div>

      {/* Strike Preview Modal */}
      <Dialog open={!!selectedStrike} onOpenChange={(open) => !open && setSelectedStrike(null)}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-rose-900/50 text-slate-200 shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-widest uppercase text-rose-500 border-b border-rose-900/30 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Disciplinary Action Report
            </DialogTitle>
          </DialogHeader>
          
          {selectedStrike && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Subject Officer</h4>
                  <p className="text-base font-medium text-slate-200">{selectedStrike.officer_name}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date Issued</h4>
                  <p className="text-sm font-medium text-slate-300">{new Date(selectedStrike.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 relative">
                {selectedStrike.action_type && (
                   <span className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                          selectedStrike.action_type === 'Strike' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                          selectedStrike.action_type === 'Verbal Warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {selectedStrike.action_type} {selectedStrike.action_type === 'Strike' && selectedStrike.strike_level ? `(${selectedStrike.strike_level})` : ''}
                   </span>
                )}
                <h4 className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mb-2">Infraction / Reason</h4>
                <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap md:pr-24">{selectedStrike.reason}</p>
              </div>
              
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorizing Command</h4>
                <p className="text-sm font-medium text-slate-300">{selectedStrike.issued_by}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};