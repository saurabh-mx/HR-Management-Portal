import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Activity, Shield, AlertTriangle, ScanLine } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { useAuth } from '@/auth/hooks/useAuth';
import { isHighCommandOrHR } from '@/auth/roles/roleMatrix';

export interface EmployeeForCard {
  id: string;
  name: string;
  badge_number: string;
  role?: string;
  department?: string;
  discord_tag?: string;
  status?: string;
  rank?: string;
  citizen_id?: string;
  phone_number?: string;
  department_join_date?: string;
  duration_in_department?: string;
  last_promotion_date?: string;
  days_since_last_promoted?: number | string;
  sub_department?: string;
  titles?: string;
  notes?: string;
  cert_fto?: boolean;
  cert_asd?: boolean;
  cert_heat?: boolean;
  cert_swat?: boolean;
  cert_cid?: boolean;
  cert_meu?: boolean;
  cert_k9?: boolean;
  cert_sop?: boolean;
  callsign?: string;
  avatar_url?: string;
  led_sub_departments?: string[];
  [key: string]: any;
}

const getDepartmentColor = (dept: string) => {
  switch (dept) {
    case "SASP": return "#999999";
    case "SAPR": return "#008239";
    case "LSPD": return "#1c4587";
    case "BCSO": return "#d2b14b";
    case "SASP Academy": return "#938383";
    default: return "#94a3b8";
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface FlashcardModalProps {
  employee: EmployeeForCard | null;
  onClose: () => void;
}

export default function FlashcardModal({ employee, onClose }: FlashcardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [employeeStrikes, setEmployeeStrikes] = useState({ strikes: 0, warnings: 0, verbals: 0, revoked: 0 });
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const { profile, adminSafeMode } = useAuth();
  const isAdmin = adminSafeMode || (profile && isHighCommandOrHR(profile));

  useEffect(() => {
    async function fetchUserStrikes() {
      if (!employee?.name) return;
      const { data } = await supabase
        .from('strikes')
        .select('*')
        .ilike('name', `${employee.name}%`);
      
      if (data) {
        let strikes = 0;
        let warnings = 0;
        let verbals = 0;
        let revoked = 0;

        data.forEach(curr => {
          if (curr.status === 'revoked') {
            revoked += 1;
            return;
          }
          if (curr.action_type === 'Strike') {
            strikes += parseInt(curr.strike_level?.split('/')[0] || '1');
          } else if (curr.action_type === 'Warning') {
            warnings += 1;
          } else if (curr.action_type === 'Verbal Warning') {
            verbals += 1;
          }
        });
        
        setEmployeeStrikes({ strikes, warnings, verbals, revoked });
      }
    }

    fetchUserStrikes();
  }, [employee]);

  useEffect(() => {
    async function fetchStreamUrl() {
      if (!isAdmin || !employee?.id) return;
      const { data } = await supabase
        .from('bodycam_streams')
        .select('stream_url, youtube_url')
        .eq('officer_id', employee.id)
        .maybeSingle();
      
      if (data?.stream_url) setStreamUrl(data.stream_url);
      if (data?.youtube_url) setYoutubeUrl(data.youtube_url);
    }
    fetchStreamUrl();
  }, [employee, isAdmin]);

  if (!employee) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md transition-opacity perspective-1000 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="animate-toss relative w-full max-w-[380px] h-[640px] shrink-0 cursor-pointer group/card my-auto"
        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
      >
        <div className={`w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] preserve-3d shadow-2xl will-change-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT OF CARD - SMART SECURITY BADGE */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-[24px] bg-slate-900 flex flex-col overflow-hidden backface-hidden ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px ${hexToRgba(getDepartmentColor(employee.department || ''), 0.2)}`
            }}
          >
            {/* Holographic Overlay Layer */}
            <div 
              className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover/card:scale-110"
              style={{
                background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(getDepartmentColor(employee.department || ''), 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(getDepartmentColor(employee.department || ''), 0.4)} 60%, transparent 80%)`,
                backgroundSize: '200% 200%',
                animation: 'shimmer 8s linear infinite'
              }}
            />
            
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
            `}</style>

            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 z-10" style={{ backgroundColor: getDepartmentColor(employee.department || '') }} />
            
            {/* Lanyard Hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/60 rounded-full border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] z-20" />

            {/* Background Logo Watermark */}
            <div 
              className="absolute inset-0 z-0 opacity-15 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110"
              style={{
                backgroundImage: `url(${(() => {
                  const dept = employee.department || '';
                  if (dept.includes('BCSO')) return '/logos/bcso.png';
                  if (dept.includes('LSPD')) return '/logos/lspd.png';
                  if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                  if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                  return '/logos/sasp.png';
                })()})`,
                backgroundSize: '120%'
              }}
            />

            <div className="flex flex-col z-10 relative mt-12 px-8 flex-1 h-full">
              {/* Header Row: Dept & Microchip */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={(() => {
                      const dept = employee.department || '';
                      if (dept.includes('BCSO')) return '/logos/bcso.png';
                      if (dept.includes('LSPD')) return '/logos/lspd.png';
                      if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                      if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                      return '/logos/sasp.png';
                    })()} 
                    alt="Dept Logo" 
                    className="h-7 w-auto drop-shadow-lg opacity-90 rounded-sm" 
                  />
                  <div>
                    <h3 className="text-xs font-black tracking-[0.25em] uppercase text-white/90 drop-shadow-md">
                      {employee.department || "STATE"}
                    </h3>
                    <p className="text-[8px] font-mono tracking-widest" style={{ color: getDepartmentColor(employee.department || '') }}>
                      OFFICIAL CREDENTIAL
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo & Main Info */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-28 h-28 rounded-xl flex items-center justify-center text-4xl font-bold border-2 bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute inset-0 border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
                  {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.name} className="w-full h-full object-cover filter contrast-110" />
                  ) : (
                    <span style={{ color: getDepartmentColor(employee.department || '') }}>{employee.name.charAt(0)}</span>
                  )}
                  
                  {/* Photo overlay scanline */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30 z-20" />
                </div>

                <div className="mt-4 text-center w-full">
                  <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-lg leading-none mb-1">
                    {employee.name}
                  </h2>
                  <p className="font-mono text-base font-bold tracking-[0.15em] drop-shadow-md" style={{ color: getDepartmentColor(employee.department || '') }}>
                    #{employee.badge_number}
                  </p>
                </div>
              </div>
              
              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 w-full text-center my-auto bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div className="flex flex-col items-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Rank</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{employee.rank || "—"}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Clearance</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{employee.role || "—"}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                  <p className={`text-xs font-black tracking-wider truncate uppercase ${employee.status === 'Active' ? 'text-emerald-400' : employee.status === 'Inactive' ? 'text-rose-400' : 'text-fuchsia-400'}`}>
                    {employee.status || "ACTIVE"}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Department</p>
                  <p className="text-xs font-bold truncate flex items-center justify-center gap-1" style={{ color: getDepartmentColor(employee.department || '') }}>
                    {employee.department || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer QR Code */}
            <a
              href={`/identity/${employee.badge_number}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-auto w-full flex flex-col items-center justify-end pb-3 bg-gradient-to-t from-black/80 to-transparent z-10 relative hover:opacity-80 transition-opacity cursor-pointer"
            >
              <QRCodeSVG
                value={`${import.meta.env.VITE_SITE_URL || window.location.origin}/identity/${employee.badge_number}`}
                size={64}
                bgColor="transparent"
                fgColor="rgba(148, 163, 184, 0.6)"
                level="L"
              />
              <p className="text-[6px] font-mono tracking-widest text-slate-500 mt-1.5 uppercase">
                Scan to verify identity
              </p>
            </a>
          </div>

          {/* BACK OF CARD - INTELLIGENCE DOSSIER (BENTO BOX) */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-[24px] bg-slate-950 flex flex-col overflow-hidden backface-hidden rotate-y-180 ${!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 30px ${hexToRgba(getDepartmentColor(employee.department || ''), 0.15)}`
            }}
          >
            {/* Holographic Overlay Layer */}
            <div 
              className="absolute inset-0 opacity-20 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover/card:scale-110"
              style={{
                background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(getDepartmentColor(employee.department || ''), 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(getDepartmentColor(employee.department || ''), 0.4)} 60%, transparent 80%)`,
                backgroundSize: '200% 200%',
                animation: 'shimmer 8s linear infinite'
              }}
            />

            {/* Tech Grid Background */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            {/* Background Logo Watermark */}
            <div 
              className="absolute inset-0 z-0 opacity-20 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110"
              style={{
                backgroundImage: `url(${(() => {
                  const dept = employee.department || '';
                  if (dept.includes('BCSO')) return '/logos/bcso.png';
                  if (dept.includes('LSPD')) return '/logos/lspd.png';
                  if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                  if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                  return '/logos/sasp.png';
                })()})`,
                backgroundSize: '120%'
              }}
            />
            
            <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: getDepartmentColor(employee.department || '') }} />
            
            {/* Header */}
            <div className="px-5 pt-5 pb-3 relative z-10 border-b border-white/5 bg-black/20">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    DOSSIER FILE
                  </h3>
                  <p className="text-[8px] font-mono tracking-widest mt-1 opacity-70" style={{ color: getDepartmentColor(employee.department || '') }}>
                    {employee.name} // {employee.badge_number}
                  </p>
                </div>
                <img 
                  src={(() => {
                    const dept = employee.department || '';
                    if (dept.includes('BCSO')) return '/logos/bcso.png';
                    if (dept.includes('LSPD')) return '/logos/lspd.png';
                    if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                    if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                    return '/logos/sasp.png';
                  })()} 
                  alt="Department Logo" 
                  className="h-8 w-auto opacity-80 drop-shadow-md" 
                />
              </div>
            </div>

            {/* Bento Box Grid Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 relative z-10">
              
              {/* Identity Block */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-3 h-3" /> Identity Matrix
                </p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Citizen ID</p>
                    <p className="text-xs font-medium text-slate-200 font-mono">{employee.citizen_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Phone Number</p>
                    <p className="text-xs font-medium text-slate-200 font-mono">{employee.phone_number || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Discord Tag</p>
                    <p className="text-xs font-medium text-slate-200">{employee.discord_tag || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Service Record Block */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Service Record
                </p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Sub Dept.</p>
                    <p className="text-xs font-medium text-slate-200">{employee.sub_department || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Leads</p>
                    <p className="text-xs font-medium text-slate-200 break-words" title={employee.led_sub_departments?.join(', ')}>
                      {employee.led_sub_departments?.length ? employee.led_sub_departments.join(', ') : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Titles</p>
                    <p className="text-xs font-medium text-slate-200 truncate" title={employee.titles}>{employee.titles || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Join Date</p>
                    <p className="text-xs font-medium text-slate-200">{employee.department_join_date || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Duration</p>
                    <p className="text-xs font-medium text-slate-200">{employee.duration_in_department || '—'}</p>
                  </div>
                  
                  {/* Promotion Progress Bar style */}
                  <div className="col-span-2 mt-1">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-[7px] text-slate-500 uppercase tracking-widest">Last Promoted</p>
                      <p className="text-[8px] font-bold text-emerald-400">{employee.days_since_last_promoted !== null && employee.days_since_last_promoted !== undefined ? `${employee.days_since_last_promoted} Days Ago` : '—'}</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                        style={{ 
                          width: `${Math.min(100, Math.max(5, (Number(employee.days_since_last_promoted) || 0) / 100 * 100))}%` 
                        }} 
                      />
                    </div>
                    <p className="text-[7px] text-slate-500 text-right mt-1">{employee.last_promotion_date || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Certifications Block */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Active Certifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'cert_fto', label: 'FTO' },
                    { key: 'cert_asd', label: 'ASD' },
                    { key: 'cert_heat', label: 'HEAT' },
                    { key: 'cert_swat', label: 'SWAT' },
                    { key: 'cert_cid', label: 'CID' },
                    { key: 'cert_meu', label: 'MEU' },
                    { key: 'cert_k9', label: 'K9' },
                    { key: 'cert_sop', label: 'SOP' }
                  ].map(cert => {
                    const isActive = employee[cert.key as keyof EmployeeForCard];
                    return isActive ? (
                      <span 
                        key={cert.key} 
                        className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                      >
                        {cert.label}
                      </span>
                    ) : (
                      <span 
                        key={cert.key} 
                        className="px-2 py-0.5 rounded-md text-[8px] font-bold tracking-widest uppercase border border-slate-700/50 bg-slate-800/30 text-slate-500"
                      >
                        {cert.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Disciplinary Actions Block */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> Disciplinary Actions
                </p>
                <div className="grid grid-cols-4 gap-y-2 gap-x-2 text-center">
                  <div className="bg-slate-950/40 rounded-lg py-1.5 px-1 border border-white/5 shadow-sm">
                    <p className="text-[12px] font-black text-rose-500 leading-none">{employeeStrikes.strikes}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Strikes</p>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg py-1.5 px-1 border border-white/5 shadow-sm">
                    <p className="text-[12px] font-black text-amber-500 leading-none">{employeeStrikes.warnings}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Warnings</p>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg py-1.5 px-1 border border-white/5 shadow-sm">
                    <p className="text-[12px] font-black text-indigo-400 leading-none">{employeeStrikes.verbals}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Verbals</p>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg py-1.5 px-1 border border-white/5 shadow-sm">
                    <p className="text-[12px] font-black text-slate-400 leading-none">{employeeStrikes.revoked}</p>
                    <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Revoked</p>
                  </div>
                </div>
              </div>

              {/* Bodycam Link for Admins/HC */}
              {isAdmin && (streamUrl || youtubeUrl) && (
                <div className="mt-4 pb-2 flex flex-col gap-2 relative z-50">
                  {streamUrl && (
                    <a
                      href={streamUrl.startsWith('http') ? streamUrl : `https://${streamUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Watch LIVE Bodycam (Kick)
                    </a>
                  )}
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://${youtubeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Watch LIVE Bodycam (YT)
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
