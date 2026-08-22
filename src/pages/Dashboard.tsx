import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, ShieldAlert, CalendarOff, TrendingUp, Megaphone, Presentation, Download, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';

export const Dashboard = () => {
  const { profile } = useAuth();
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
  const [showIdModal, setShowIdModal] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

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

      // 3. Personnel on LOA (Count only Approved leaves)
      const { count: loaCount } = await supabase
        .from('loa_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Approved');

      // Recent LOAs for Activity Feed
      const { data: loaData } = await supabase
        .from('loa_requests')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(10);

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

  const downloadIdImage = async () => {
    if (!idCardRef.current) {
      alert("Error: Could not find the ID card element.");
      return;
    }
    try {
      const dataUrl = await toPng(idCardRef.current, {
        backgroundColor: '#020617', // slate-950 equivalent for stable background
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${profile?.name?.replace(/ /g, '_') || 'Personnel'}_ID_Card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Failed to generate image", error);
      alert("Failed to generate image. Please check the console for details. Error: " + (error?.message || "Unknown error"));
    }
  };

  const downloadIdText = () => {
    if (!profile) return;
    const content = `SASP OFFICIAL PERSONNEL RECORD
Name: ${profile.name}
Callsign/Badge: ${profile.badge_number}
Department: ${profile.department}
Rank: ${profile.rank || "—"}
Role: ${profile.role}
Status: ${profile.status || "Active"}
Join Date: ${profile.department_join_date ? new Date(profile.department_join_date).toLocaleDateString() : "—"}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name?.replace(/ /g, '_')}_ID_Details.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg">
              WELCOME, <span className="font-bold text-brand">{profile?.name || "OFFICER"}</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand/70" /> 
              {profile?.rank || "Patrol"} <span className="text-slate-600">|</span> <span className="text-brand/80">{profile?.badge_number || "000"}</span>
            </p>
          </div>
          
          <div className="pb-1">
            <button 
              onClick={() => setShowIdModal(true)} 
              className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-3 rounded-lg font-medium text-sm font-sans hover:bg-slate-800 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-2 border border-slate-700 hover:border-brand/50 group"
            >
              <Download className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
              Export ID Card
            </button>
          </div>
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
                              strike.action_type === 'Verbal Warning' ? 'bg-brand/20 text-brand border border-brand/30' :
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
                    {stats.recentLoas.filter(loa => loa.status === 'Approved').map(loa => (
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
        <div className="col-span-4 h-96 rounded-xl border border-brand/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-4 border-b border-brand/30 pb-2">Recent Activity Feed</h3>
          
          <div className="flex-1 overflow-y-auto animated-scrollbar pr-2 space-y-4">
            {/* Build activity feed dynamically */}
            {(() => {
              const isPrivileged = profile?.is_admin || ['High Command', 'HR'].includes(profile?.role || '');
              
              const filteredLoas = isPrivileged 
                ? stats.recentLoas 
                : stats.recentLoas.filter(l => l.status !== 'Pending Review' && l.status !== 'Pending');
                
              const filteredPromotions = isPrivileged 
                ? stats.recentPromotions 
                : stats.recentPromotions.filter(p => p.status !== 'Pending Review' && p.status !== 'Pending');

              return [
                ...stats.recentStrikes.map(s => ({ id: `strike-${s.id}`, type: 'strike', title: `${s.action_type} Issued`, desc: `To ${s.name} by ${s.issued_by}`, date: s.created_at, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-900/30' })),
                ...filteredLoas.map(l => ({ id: `loa-${l.id}`, type: 'loa', title: `LOA Request (${l.status})`, desc: `By ${l.officer_name}`, date: l.created_at || l.start_date, icon: CalendarOff, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-900/30' })),
                ...stats.recentAnnouncements.map(a => ({ id: `ann-${a.id}`, type: 'announcement', title: `Broadcast: ${a.title}`, desc: `By ${a.author}`, date: a.created_at || a.date, icon: Megaphone, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-900/30' })),
                ...filteredPromotions.map(p => ({ id: `promo-${p.id}`, type: 'promotion', title: `Rank Update (${p.status})`, desc: `${p.officer_name} to ${p.new_rank}`, date: p.created_at, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-900/30' }))
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
              ));
            })()}
            
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
                  const badgeClass = isBolo ? 'text-rose-400 bg-rose-500/20 border-rose-500/30' : isBriefing ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' : 'text-brand bg-brand/20 border-brand/30';
                  
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
                          selectedStrike.action_type === 'Verbal Warning' ? 'bg-brand/20 text-brand border border-brand/30' :
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
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-brand/50 text-slate-200 shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-widest uppercase text-brand border-b border-brand/30 pb-3 flex items-center gap-2">
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
                        'bg-brand/20 text-brand border border-brand/30'
                      }`}>
                        {selectedAnnouncement.category}
                 </span>
                <h4 className="text-[10px] font-bold text-brand/70 uppercase tracking-widest mb-2">Subject / Title</h4>
                <p className="text-base text-slate-200 font-medium md:pr-24">{selectedAnnouncement.title}</p>
              </div>
              
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap">{selectedAnnouncement.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ID Card Export Modal */}
      <Dialog open={showIdModal} onOpenChange={setShowIdModal}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-brand/50 text-slate-200 shadow-2xl rounded-xl max-w-lg z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-widest uppercase text-brand border-b border-brand/30 pb-3 flex items-center gap-2">
              <Download className="w-5 h-5" /> Official Personnel Record
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 pt-2">
            {/* ID Card Wrapper for html2canvas */}
            <div className="flex justify-center w-full">
              <div 
                ref={idCardRef}
                className="w-full max-w-sm p-8 rounded-xl shadow-xl bg-slate-950 border border-slate-800 flex flex-col relative overflow-hidden"
              >
                {/* Visuals */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand z-10" />
                
                {/* Background Logo */}
                <div 
                  className="absolute inset-0 z-0 opacity-10 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity"
                  style={{
                    backgroundImage: `url(${(() => {
                      const dept = profile?.department || '';
                      if (dept.includes('BCSO')) return '/logos/bcso.png';
                      if (dept.includes('LSPD')) return '/logos/lspd.png';
                      if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                      if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                      return '/logos/sasp.png';
                    })()})`,
                    backgroundSize: '80%'
                  }}
                />
                
                <div className="flex flex-col items-center text-center space-y-4 z-10 relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 bg-slate-900/80 backdrop-blur-sm border-brand text-brand shadow-[0_0_15px_rgba(var(--brand-main),0.2)]">
                    {profile?.name?.charAt(0) || "U"}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-wide leading-tight">{profile?.name}</h2>
                    <p className="text-brand font-mono mt-1 text-xs tracking-widest">{profile?.badge_number}</p>
                  </div>

                  <div className="w-full h-px bg-slate-800/60 my-1" />

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 w-full text-left">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Department</p>
                      <p className="text-sm font-bold text-brand tracking-wide">{profile?.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Rank</p>
                      <p className="text-sm font-medium text-slate-200">{profile?.rank || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                      <p className="text-sm font-medium text-emerald-400">{profile?.status || "Active"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Role</p>
                      <p className="text-sm font-medium text-slate-300">{profile?.role || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800/50 pt-4">
              <button onClick={downloadIdText} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                Download Text
              </button>
              <button onClick={downloadIdImage} className="px-4 py-2 rounded-md text-sm font-medium bg-brand hover:bg-brand/90 text-black transition-colors shadow-lg shadow-brand/20">
                Download as Image
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};