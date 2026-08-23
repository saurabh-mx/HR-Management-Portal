import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { logAuditAction } from "@/lib/auditLogger";
import { Shield, Badge, Calendar, User, Download, FileText, CheckCircle2, Key, ClipboardList, Medal, Fingerprint, MapPin, Hash, Phone, Mail } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export default function Profile() {
  const { profile, adminSafeMode, toggleAdminSafeMode } = useAuth();
  const idCardRef = useRef<HTMLDivElement>(null);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const canToggleAdmin = profile?.is_admin || ['High Command', 'HR'].includes(profile?.role || '');

  const handleToggleAdmin = () => {
    toggleAdminSafeMode();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Error updating password: " + error.message);
    } else {
      logAuditAction("PASSWORD_UPDATED", profile?.name || "Unknown", "User updated their password manually", profile?.name);
      toast.success("Password successfully updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsUpdatingPassword(false);
  };

  const downloadIdImage = async () => {
    if (!idCardRef.current) return;
    try {
      const dataUrl = await toPng(idCardRef.current, { backgroundColor: '#020617', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${profile?.name?.replace(/ /g, '_') || 'Personnel'}_ID_Card.png`;
      a.click();
      logAuditAction("ID_EXPORTED", profile?.name || "Unknown", "Exported Digital ID Card as PNG", profile?.name);
    } catch (error: any) {
      alert("Failed to generate image.");
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
Join Date: ${formatDate(profile.department_join_date)}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name?.replace(/ /g, '_')}_ID_Details.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logAuditAction("ID_EXPORTED", profile.name || "Unknown", "Exported Digital ID Card as Text", profile.name);
  };

  if (!profile) return <div className="p-8 text-slate-400 animate-pulse">Loading Profile...</div>;

  const getDeptLogo = (dept: string) => {
    if (!dept) return '/logos/sasp.png';
    if (dept.includes('BCSO')) return '/logos/bcso.png';
    if (dept.includes('LSPD')) return '/logos/lspd.png';
    if (dept.includes('SAPR')) return '/logos/sapr.jpg';
    if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
    return '/logos/sasp.png';
  };

  const deptLogo = getDeptLogo(profile.department || '');

  return (
    <div className="relative p-6 md:p-10 min-h-full max-w-7xl mx-auto overflow-hidden">
      
      <div className="relative z-10 space-y-8">
        
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-6 flex flex-col items-end z-20">
            {canToggleAdmin && (
              <div className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-xl shadow-lg">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold tracking-widest text-slate-200 uppercase">Admin Mode</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">{adminSafeMode ? 'Active' : 'Hidden'}</span>
                </div>
                <button 
                  onClick={handleToggleAdmin}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${adminSafeMode ? 'bg-brand' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminSafeMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border border-brand/50 shadow-[0_0_30px_rgba(var(--brand-main),0.15)] flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative group">
              <div className="absolute inset-0 bg-brand/5 group-hover:bg-brand/10 transition-colors"></div>
              <span className="text-5xl md:text-6xl font-light text-slate-300 group-hover:text-white transition-colors">{profile.name?.substring(0, 2).toUpperCase()}</span>
            </div>
            
            <div className="flex-1 text-center md:text-left mt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-4">
                <CheckCircle2 className="w-3 h-3" /> {profile.status || "Active Duty"}
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-wider text-white uppercase drop-shadow-lg mb-2">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-medium tracking-wide">
                <span className="flex items-center gap-2"><Badge className="w-4 h-4 text-brand" /> {profile.rank || "Officer"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand" /> {profile.department}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-brand" /> {profile.badge_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT: LEFT SIDEBAR (ID CARD) + RIGHT CONTENT (DOSSIER) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: ID CARD & ACTIONS */}
          <div className="col-span-1 lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-xl shadow-xl flex flex-col items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-6 w-full border-b border-brand/30 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Digital Credentials
              </h3>
              
              <div ref={idCardRef} className="w-full p-6 rounded-xl shadow-2xl bg-slate-950 border border-slate-800 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand z-10" />
                <div 
                  className="absolute inset-0 z-0 opacity-10 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110 group-hover:scale-100 transition-transform duration-700"
                  style={{ backgroundImage: `url(${deptLogo})`, backgroundSize: '80%' }}
                />
                <div className="flex flex-col items-center text-center space-y-4 z-10 relative mt-4 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 bg-slate-900/80 backdrop-blur-sm border-brand text-brand shadow-[0_0_15px_rgba(var(--brand-main),0.2)]">
                    {profile.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wide leading-tight">{profile.name}</h2>
                    <p className="text-brand font-mono mt-1 text-sm tracking-widest">{profile.badge_number}</p>
                  </div>
                  <div className="w-full h-px bg-slate-800/60 my-2" />
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 w-full text-left">
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Department</p>
                      <p className="text-xs font-bold text-brand tracking-wide truncate">{profile.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Rank</p>
                      <p className="text-xs font-medium text-slate-200 truncate">{profile.rank || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                      <p className="text-xs font-medium text-emerald-400 truncate">{profile.status || "Active"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Role</p>
                      <p className="text-xs font-medium text-slate-300 truncate">{profile.role || "—"}</p>
                    </div>
                  </div>
                  <div className="w-full pt-4 mt-2 border-t border-slate-800/60">
                    <p className="text-[8px] tracking-[0.2em] text-slate-500 uppercase text-center">
                      San Andreas State Property
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6 w-full">
                <button onClick={downloadIdImage} className="w-full bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-4 py-2.5 rounded-md font-bold tracking-widest text-[10px] uppercase transition-colors flex items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Export as Image
                </button>
                <button onClick={downloadIdText} className="w-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-md font-bold tracking-widest text-[10px] uppercase transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Export Details
                </button>
              </div>
            </div>
            
            {/* Security Settings Panel */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-6 border-b border-brand/30 pb-2 flex items-center gap-2">
                <Key className="w-4 h-4" /> Security Settings
              </h3>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password</p>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</p>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2.5 rounded-md font-bold tracking-widest text-[10px] uppercase transition-colors disabled:opacity-50"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED DOSSIER */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            
            {/* Identity & Contact */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-6 border-b border-brand/30 pb-2 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Personal Dossier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="w-3 h-3"/> Full Name</p>
                  <p className="text-sm font-medium text-slate-200 border-b border-slate-800 pb-1">{profile.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Hash className="w-3 h-3"/> Citizen ID</p>
                  <p className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-1 font-mono">{profile.citizen_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> Phone Number</p>
                  <p className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-1 font-mono">{profile.phone_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Discord Communication</p>
                  <p className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-1">{profile.discord_tag || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Service Record */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-6 border-b border-brand/30 pb-2 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Service Record
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sub-Department</p>
                  <p className="text-sm font-medium text-slate-200 bg-slate-950 p-2.5 rounded-md border border-slate-800/50">{profile.sub_department || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Titles</p>
                  <p className="text-sm font-medium text-slate-200 bg-slate-950 p-2.5 rounded-md border border-slate-800/50">{profile.titles || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Department Entry</p>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950 p-2.5 rounded-md border border-slate-800/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand/70" /> {formatDate(profile.department_join_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Time in Service</p>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950 p-2.5 rounded-md border border-slate-800/50">{profile.duration_in_department || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Promotion</p>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950 p-2.5 rounded-md border border-slate-800/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand/70" /> {formatDate(profile.last_promotion_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Time in Current Rank</p>
                  <p className="text-sm font-medium text-slate-300 bg-slate-950 p-2.5 rounded-md border border-slate-800/50">{profile.days_since_last_promoted !== undefined ? `${profile.days_since_last_promoted} Days` : "—"}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Service Notes</p>
                  <p className="text-sm font-medium text-slate-400 bg-slate-950/50 p-3 rounded-md border border-slate-800/30 min-h-[80px] whitespace-pre-wrap italic">
                    {profile.notes || "No additional service notes recorded."}
                  </p>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-brand/80 mb-6 border-b border-brand/30 pb-2 flex items-center gap-2">
                <Medal className="w-4 h-4" /> Certifications & Qualifications
              </h3>
              
              <div className="flex flex-wrap gap-3">
                {profile.cert_fto && (
                  <div className="flex items-center gap-2.5 bg-indigo-950/40 border border-indigo-500/30 px-4 py-2.5 rounded-lg">
                    <Medal className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold tracking-wider text-indigo-200">FTO</span>
                  </div>
                )}
                {profile.cert_asd && (
                  <div className="flex items-center gap-2.5 bg-sky-950/40 border border-sky-500/30 px-4 py-2.5 rounded-lg">
                    <Medal className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-bold tracking-wider text-sky-200">ASD</span>
                  </div>
                )}
                {profile.cert_heat && (
                  <div className="flex items-center gap-2.5 bg-rose-950/40 border border-rose-500/30 px-4 py-2.5 rounded-lg">
                    <Medal className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold tracking-wider text-rose-200">H.E.A.T</span>
                  </div>
                )}
                {profile.cert_swat && (
                  <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-600 px-4 py-2.5 rounded-lg">
                    <Shield className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-bold tracking-wider text-slate-200">S.W.A.T</span>
                  </div>
                )}
                {profile.cert_cid && (
                  <div className="flex items-center gap-2.5 bg-amber-950/40 border border-amber-500/30 px-4 py-2.5 rounded-lg">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold tracking-wider text-amber-200">C.I.D</span>
                  </div>
                )}
                {profile.cert_meu && (
                  <div className="flex items-center gap-2.5 bg-teal-950/40 border border-teal-500/30 px-4 py-2.5 rounded-lg">
                    <Medal className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-bold tracking-wider text-teal-200">M.E.U</span>
                  </div>
                )}
                {profile.cert_k9 && (
                  <div className="flex items-center gap-2.5 bg-orange-950/40 border border-orange-500/30 px-4 py-2.5 rounded-lg">
                    <Medal className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold tracking-wider text-orange-200">K-9 Unit</span>
                  </div>
                )}
                {profile.cert_sop && (
                  <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-lg">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold tracking-wider text-emerald-200">S.O.P Reader</span>
                  </div>
                )}
                
                {!profile.cert_fto && !profile.cert_asd && !profile.cert_heat && !profile.cert_swat && !profile.cert_cid && !profile.cert_meu && !profile.cert_k9 && !profile.cert_sop && (
                  <div className="w-full text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <p className="text-sm text-slate-500 font-medium italic">No specialized certifications recorded in dossier.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
