import { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, ShieldAlert, CalendarOff, TrendingUp, Megaphone, Presentation } from "lucide-react";
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
    recentLoas: [] as any[],
    recentAnnouncements: [] as any[],
    recentPromotions: [] as any[],
    recentMeetings: [] as any[]
  });

  const [selectedStrike, setSelectedStrike] = useState<any>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
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
      const { data: promoData, count: rankCount } = await supabase
        .from('promotions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      // 5. Announcements
      const { data: annData } = await supabase
        .from('Announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // 6. Meetings
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalPersonnel: personnelData?.length || 0,
        activeStrikes: strikesCount || 0,
        personnelOnLoa: loaCount || 0,
        pendingRankChanges: rankCount || 0,
        deptCounts,
        recentStrikes: strikesData || [],
        recentLoas: loaData || [],
        recentAnnouncements: annData || [],
        recentPromotions: promoData || [],
        recentMeetings: meetingData || []
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
            <div className="max-w-xs w-full">
              {stats.recentStrikes.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No recent strikes.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto animated-scrollbar pr-1">
                    {stats.recentStrikes.map(strike => (
                      <div key={strike.id} className="text-xs border border-rose-900/30 bg-rose-950/20 p-2 rounded flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-1">
                          <div 
                            className="font-semibold text-slate-200 cursor-pointer hover:text-rose-400 hover:underline transition-colors w-fit shrink-0"
                            onClick={() => setSelectedStrike(strike)}
                          >
                            {strike.name}
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
          }
        />
        <StatCard 
          title="Personnel on LOA" 
          value={stats.personnelOnLoa} 
          icon={CalendarOff} 
          description="Currently on leave"
          trend="neutral"
          hoverContent={
            <div className="max-w-xs w-full">
              {stats.recentLoas.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No approved LOAs.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto animated-scrollbar pr-1">
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
          }
        />
        <StatCard 
          title="Meetings & Briefings" 
          value={stats.recentMeetings.length} 
          icon={Presentation} 
          description="Upcoming department syncs"
          trend="neutral"
          hoverContent={
            <div className="max-w-xs w-full">
              <div className="space-y-1.5 max-h-48 overflow-y-auto animated-scrollbar pr-1">
                {stats.recentMeetings.length > 0 ? (
                  stats.recentMeetings.map(meeting => (
                    <div key={meeting.id} className="text-xs border border-blue-900/30 bg-blue-950/20 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-blue-900/30 transition-colors" onClick={() => setSelectedAnnouncement(meeting)}>
                      <div className="flex justify-between items-start gap-1">
                        <div className="font-semibold text-slate-200 w-fit shrink-0 line-clamp-1">{meeting.title || meeting.name}</div>
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider whitespace-nowrap shrink-0 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {meeting.category || meeting.type || "Meeting"}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] leading-tight break-words line-clamp-2">{meeting.message || meeting.description}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{new Date(meeting.created_at || meeting.date).toLocaleDateString()} • {meeting.author || meeting.host || "Command"}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic">No upcoming meetings or briefings.</div>
                )}
              </div>
            </div>
          }
        />
      </div>

      {/* Important Bulletins */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Activity Feed and Bulletins */}
        <div className="col-span-4 h-96 rounded-xl border border-yellow-900/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-500/80 mb-4 border-b border-yellow-900/30 pb-2">Recent Activity Feed</h3>
          
          <div className="flex-1 overflow-y-auto animated-scrollbar pr-2 space-y-4">
            {/* Build activity feed dynamically */}
            {[
              ...stats.recentStrikes.map(s => ({ id: `strike-${s.id}`, type: 'strike', title: `${s.action_type} Issued`, desc: `To ${s.name} by ${s.issued_by}`, date: s.created_at, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-900/30' })),
              ...stats.recentLoas.map(l => ({ id: `loa-${l.id}`, type: 'loa', title: `LOA Request (${l.status})`, desc: `By ${l.officer_name}`, date: l.created_at || l.start_date, icon: CalendarOff, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-900/30' })),
              ...stats.recentAnnouncements.map(a => ({ id: `ann-${a.id}`, type: 'announcement', title: `Broadcast: ${a.title}`, desc: `By ${a.author}`, date: a.created_at || a.date, icon: Megaphone, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-900/30' })),
              ...stats.recentPromotions.map(p => ({ id: `promo-${p.id}`, type: 'promotion', title: `Rank Update (${p.status})`, desc: `${p.officer_name} to ${p.new_rank}`, date: p.created_at, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-900/30' }))
            ]
            .filter(item => item.date) // Ensure date exists
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(activity => (
              <div key={activity.id} className={`flex items-start gap-4 p-3 rounded-lg border ${activity.border} ${activity.bg} backdrop-blur-sm transition-all hover:bg-slate-900/50`}>
                <div className={`p-2 rounded-full bg-slate-950/50 shadow-inner ${activity.border} border`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-200 truncate">{activity.title}</h4>
                    <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{activity.desc}</p>
                </div>
              </div>
            ))}
            
            {(stats.recentStrikes.length + stats.recentLoas.length + stats.recentAnnouncements.length + stats.recentPromotions.length) === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500 font-light italic">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3 h-96 rounded-xl border border-rose-900/40 bg-slate-950/90 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle glow in corner */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-900/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="text-xs font-bold tracking-widest uppercase text-rose-500/90 mb-4 border-b border-rose-900/40 pb-2 flex items-center justify-between z-10">
            <span>Important Bulletins</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </h3>
          
          <div className="flex-1 overflow-y-auto animated-scrollbar pr-2 space-y-4 z-10">
            {stats.recentAnnouncements.length > 0 ? (
              stats.recentAnnouncements
                .map((bulletin) => {
                  const isBolo = bulletin.category === 'BOLO / Alert' || bulletin.category === 'Critical';
                  const isBriefing = bulletin.category === 'Shift Briefing';
                  
                  const bgClass = isBolo ? 'bg-rose-950/30 hover:bg-rose-900/20' : isBriefing ? 'bg-blue-950/30 hover:bg-blue-900/20' : 'bg-slate-900/50 hover:bg-slate-800/50';
                  const borderClass = isBolo ? 'border-rose-900/50' : isBriefing ? 'border-blue-900/50' : 'border-slate-800';
                  const titleClass = isBolo ? 'text-rose-100' : isBriefing ? 'text-blue-100' : 'text-slate-200';
                  const textClass = isBolo ? 'text-rose-200/70' : isBriefing ? 'text-blue-200/70' : 'text-slate-400';
                  const metaClass = isBolo ? 'text-rose-500/70' : isBriefing ? 'text-blue-500/70' : 'text-slate-500';
                  const badgeClass = isBolo ? 'text-rose-400 bg-rose-500/20 border-rose-500/30' : isBriefing ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' : 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
                  
                  return (
                    <div 
                      key={bulletin.id} 
                      className={`p-4 rounded-lg border flex flex-col gap-2 cursor-pointer transition-all ${bgClass} ${borderClass}`}
                      onClick={() => setSelectedAnnouncement(bulletin)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-bold leading-tight ${titleClass}`}>{bulletin.title}</h4>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border shrink-0 ml-2 ${badgeClass}`}>
                          {bulletin.category}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-3 leading-relaxed ${textClass}`}>{bulletin.message}</p>
                      <div className={`flex justify-between items-center mt-2 pt-2 border-t ${borderClass}`}>
                        <span className={`text-[10px] font-medium ${metaClass}`}>{bulletin.author}</span>
                        <span className={`text-[10px] font-medium ${metaClass}`}>{new Date(bulletin.created_at || bulletin.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500/60 font-light italic gap-3">
                <ShieldAlert className="w-8 h-8 opacity-20" />
                <p>No active bulletins.</p>
              </div>
            )}
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
                  <p className="text-base font-medium text-slate-200">{selectedStrike.name}</p>
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

      {/* Announcement Preview Modal */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-yellow-900/50 text-slate-200 shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-widest uppercase text-yellow-500 border-b border-yellow-900/30 pb-3 flex items-center gap-2">
              <Megaphone className="w-5 h-5" /> Official Announcement
            </DialogTitle>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date Posted</h4>
                  <p className="text-sm font-medium text-slate-300">{new Date(selectedAnnouncement.created_at || selectedAnnouncement.date).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Issued By</h4>
                  <p className="text-sm font-medium text-slate-300">{selectedAnnouncement.author}</p>
                </div>
              </div>
              
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 relative">
                 <span className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                        selectedAnnouncement.category === 'Announcement' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        selectedAnnouncement.category === 'BOLO / Alert' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {selectedAnnouncement.category}
                 </span>
                <h4 className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest mb-2">Subject / Title</h4>
                <p className="text-base text-slate-200 font-medium md:pr-24">{selectedAnnouncement.title}</p>
              </div>
              
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap">{selectedAnnouncement.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};