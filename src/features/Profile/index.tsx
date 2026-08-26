import { useRef, useState, useEffect } from "react";
import { useAuth } from '@/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { Shield, Badge, Calendar, User, Download, FileText, CheckCircle2, Key, ClipboardList, Medal, Fingerprint, MapPin, Hash, Camera, X, Barcode } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { canToggleAdminSafeMode } from '@/auth/roles/roleMatrix';

const getDepartmentColor = (dept?: string) => {
    if (!dept) return '#10b981';
    if (dept.includes('BCSO')) return '#eab308';
    if (dept.includes('LSPD')) return '#3b82f6';
    if (dept.includes('SAPR')) return '#22c55e';
    if (dept.includes('Academy') || dept.includes('PAU')) return '#f97316';
    if (dept.includes('SASP')) return '#64748b';
    return '#10b981';
};

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Profile() {
  const { profile, adminSafeMode, toggleAdminSafeMode } = useAuth();
  const idCardRef = useRef<HTMLDivElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarInput, setAvatarInput] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [totalStrikes, setTotalStrikes] = useState(0);
  const [totalWarnings, setTotalWarnings] = useState(0);
  const [totalVerbalWarnings, setTotalVerbalWarnings] = useState(0);
  const [totalRevoked, setTotalRevoked] = useState(0);

  useEffect(() => {
    async function fetchUserStrikes() {
      if (!profile?.name) return;
      const { data } = await supabase
        .from('strikes')
        .select('*')
        .ilike('name', `${profile.name}%`);
      
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
        
        setTotalStrikes(strikes);
        setTotalWarnings(warnings);
        setTotalVerbalWarnings(verbals);
        setTotalRevoked(revoked);
      }
    }
    fetchUserStrikes();
  }, [profile?.name]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const canToggleAdmin = canToggleAdminSafeMode(profile);

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
    const toastId = toast.loading("Generating Secure ID Card...");
    try {
      const dataUrl = await toPng(idCardRef.current, { 
        backgroundColor: '#020617', 
        pixelRatio: 2, 
        cacheBust: true,
        style: { transform: 'scale(1)' } 
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${profile?.name?.replace(/ /g, '_') || 'Personnel'}_ID_Card.png`;
      a.click();
      logAuditAction("ID_EXPORTED", profile?.name || "Unknown", "Exported Digital ID Card as PNG", profile?.name);
      toast.success("ID Card generated successfully", { id: toastId });
    } catch (error: any) {
      console.error("Export Error: ", error);
      toast.error("Failed to generate image.", { 
        id: toastId, 
        description: "This is often caused by external avatar URLs preventing export due to strict CORS policies. Try using Imgur or removing your avatar temporarily." 
      });
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
    toast.success("Dossier text exported");
  };

  const handleSaveAvatar = async () => {
    const url = avatarInput.trim();
    if (!url) return toast.error("Please enter an image URL");
    if (!profile?.id) return toast.error("Profile not found");

    setIsSavingAvatar(true);
    const { error } = await supabase
      .from('employees')
      .update({ avatar_url: url })
      .eq('id', profile.id);

    if (error) {
      toast.error("Failed to save avatar: " + error.message);
    } else {
      setAvatarUrl(url);
      setIsEditingAvatar(false);
      setAvatarInput("");
      toast.success("Profile picture updated!");
      logAuditAction("AVATAR_UPDATED", profile.name || "Unknown", "Updated profile picture URL", profile.name);
    }
    setIsSavingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.id) return;
    setIsSavingAvatar(true);
    const { error } = await supabase
      .from('employees')
      .update({ avatar_url: null })
      .eq('id', profile.id);

    if (error) {
      toast.error("Failed to remove avatar: " + error.message);
    } else {
      setAvatarUrl("");
      setIsEditingAvatar(false);
      toast.success("Profile picture removed");
    }
    setIsSavingAvatar(false);
  };

  if (!profile) return <div className="p-8 text-slate-400 animate-pulse flex justify-center items-center h-full">Loading Profile...</div>;

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
    <div className="relative p-4 md:p-8 min-h-full max-w-7xl mx-auto">
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Huge Department Watermark */}
      <div 
        className="fixed top-20 right-0 w-[600px] h-[600px] bg-no-repeat bg-right-top opacity-[0.04] pointer-events-none mix-blend-luminosity -z-10"
        style={{ backgroundImage: `url(${deptLogo})`, backgroundSize: 'contain' }}
      />

      <div className="relative z-10 space-y-10">

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
          
          <div className="absolute top-6 right-6 flex items-end z-20">
            {canToggleAdmin && (
              <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-lg">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Admin Safe Mode</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${adminSafeMode ? 'text-brand' : 'text-slate-500'}`}>{adminSafeMode ? 'Active' : 'Disabled'}</span>
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

          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
            <div 
              className="w-36 h-36 md:w-44 md:h-44 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative group cursor-pointer ring-4 ring-slate-900/50" 
              onClick={() => { setIsEditingAvatar(true); setAvatarInput(avatarUrl); }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="text-6xl font-light text-slate-300 group-hover:text-white transition-colors">{profile.name?.substring(0, 2).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left mt-2 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4 w-fit mx-auto md:mx-0">
                <CheckCircle2 className="w-3 h-3" /> {profile.status || "Active Duty"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-wider text-white uppercase drop-shadow-lg mb-3">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-medium tracking-wide">
                <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs"><Badge className="w-3.5 h-3.5 text-brand" /> {profile.rank || "Officer"}</span>
                <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs"><MapPin className="w-3.5 h-3.5 text-brand" /> {profile.department}</span>
                <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs"><Hash className="w-3.5 h-3.5 text-brand" /> {profile.badge_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: ID CARD */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand" /> Digital Identity
                </h3>
              </div>

              {/* ID CARD COMPONENT */}
              <div 
                ref={idCardRef} 
                className="w-full max-w-[320px] mx-auto aspect-[6/9] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] bg-slate-900 border border-slate-700/50 flex flex-col relative overflow-hidden group transition-all duration-500"
              >
                {/* Lanyard Hole Punch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-slate-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5 z-20"></div>

                {/* Hologram Effect */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover:scale-110 z-20"
                  style={{
                    background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(getDepartmentColor(profile.department), 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(getDepartmentColor(profile.department), 0.4)} 60%, transparent 80%)`,
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

                {/* Top Banner / Department color */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-brand/40 to-transparent z-10 pointer-events-none" />

                {/* Background Watermark */}
                <div
                  className="absolute inset-0 z-0 opacity-15 mix-blend-luminosity bg-center bg-no-repeat pointer-events-none transition-transform duration-700 ease-out scale-110 group-hover:scale-[1.25]"
                  style={{ backgroundImage: `url(${deptLogo})`, backgroundSize: '90%' }}
                />

                <div className="flex flex-col items-center flex-1 z-10 relative pt-12 px-6 pb-6 transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1">
                  {/* Department Logo */}
                  <div className="absolute top-8 left-6 opacity-90">
                    <img 
                      src={deptLogo} 
                      alt="Department Logo" 
                      className="w-11 h-11 object-contain drop-shadow-lg mix-blend-screen rounded-full" 
                    />
                  </div>

                  {/* Avatar */}
                  <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden mt-6 relative z-10 ring-4 ring-slate-950">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={profile.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-700" />
                    )}
                  </div>

                  {/* Identity */}
                  <div className="mt-5 text-center">
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase leading-none drop-shadow-md">{profile.name}</h2>
                    <p className="text-brand font-mono font-bold mt-2 tracking-[0.2em]">{profile.badge_number}</p>
                  </div>

                  {/* Grid Data */}
                  <div className="w-full mt-6 grid grid-cols-2 gap-y-4 gap-x-4 bg-slate-950/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                    <div>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</p>
                      <p className="text-[10px] font-bold text-brand uppercase tracking-wider truncate">{profile.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rank</p>
                      <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider truncate">{profile.rank || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clearance</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">{profile.role || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider truncate">{profile.status || "Active"}</p>
                    </div>
                  </div>
                  
                  {/* Endorsements (Certs) */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 px-2">
                    {profile.cert_fto && <span title="FTO" className="text-[14px] drop-shadow-md">🎓</span>}
                    {profile.cert_asd && <span title="ASD" className="text-[14px] drop-shadow-md">🚁</span>}
                    {profile.cert_heat && <span title="HEAT" className="text-[14px] drop-shadow-md">🏎️</span>}
                    {profile.cert_swat && <span title="SWAT" className="text-[14px] drop-shadow-md">🛡️</span>}
                    {profile.cert_cid && <span title="CID" className="text-[14px] drop-shadow-md">🕵️</span>}
                    {profile.cert_meu && <span title="MEU" className="text-[14px] drop-shadow-md">🛥️</span>}
                    {profile.cert_k9 && <span title="K9" className="text-[14px] drop-shadow-md">🐕</span>}
                    {profile.cert_sop && <span title="SOP" className="text-[14px] drop-shadow-md">📋</span>}
                  </div>

                  <div className="mt-auto pt-4 w-full flex flex-col items-center">
                    <Barcode className="w-full h-8 text-slate-600/50" />
                    <p className="text-[6px] tracking-[0.3em] text-slate-600 uppercase mt-2 font-bold">Property of San Andreas</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={downloadIdImage} className="bg-brand hover:bg-brand/90 text-white shadow-[0_0_20px_rgba(var(--brand-main),0.3)] px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all flex items-center justify-center gap-2 group">
                  <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" /> Save Image
                </button>
                <button onClick={downloadIdText} className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all flex items-center justify-center gap-2 group">
                  <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Copy Text
                </button>
              </div>
            </div>

            {/* SECURITY BOX */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-300 mb-6 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand" /> Access Control
              </h3>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-600"
                    placeholder="New Password"
                    required
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-600"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-colors disabled:opacity-50"
                >
                  {isUpdatingPassword ? "Updating Keys..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: BENTO BOX GRID */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            
            {/* Dossier Grid Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl hover:border-brand/30 transition-colors duration-500">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-8 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-brand" /> Personal Details
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Citizen ID</span>
                    <span className="text-sm font-medium text-slate-200 font-mono">{profile.citizen_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</span>
                    <span className="text-sm font-medium text-slate-200 font-mono">{profile.phone_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discord</span>
                    <span className="text-sm font-medium text-slate-200">{profile.discord_tag || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl hover:border-brand/30 transition-colors duration-500">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-8 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-brand" /> Department Info
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sub-Dept</span>
                    <span className="text-sm font-medium text-slate-200">{profile.sub_department || "—"}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Titles</span>
                    <span className="text-sm font-medium text-slate-200">{profile.titles || "—"}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time in Svc</span>
                    <span className="text-sm font-medium text-brand">{profile.duration_in_department || "—"}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Strikes</span>
                    <span className={`text-sm font-bold ${totalStrikes > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{totalStrikes}/5</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warnings</span>
                    <span className={`text-sm font-bold ${totalWarnings > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{totalWarnings}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verbal Warnings</span>
                    <span className={`text-sm font-bold ${totalVerbalWarnings > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>{totalVerbalWarnings}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revoked Actions</span>
                    <span className="text-sm font-bold text-slate-400">{totalRevoked}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Grid Row 2 (Timeline) */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-8 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" /> Service Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department Entry</p>
                    <p className="text-sm font-medium text-slate-200">{formatDate(profile.department_join_date)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Medal className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Promotion</p>
                    <p className="text-sm font-medium text-slate-200">
                      {formatDate(profile.last_promotion_date)} 
                      <span className="text-slate-500 text-xs ml-2">({profile.days_since_last_promoted !== undefined ? `${profile.days_since_last_promoted} days ago` : ""})</span>
                    </p>
                  </div>
                </div>
              </div>

              {profile.notes && (
                <div className="mt-8 pt-6 border-t border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Service Notes</p>
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 text-sm text-slate-300 italic whitespace-pre-wrap">
                    {profile.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Certifications (Tags) */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-6 flex items-center gap-2">
                <Medal className="w-4 h-4 text-brand" /> Active Certifications
              </h3>

              <div className="flex flex-wrap gap-3">
                {profile.cert_fto && (
                  <span className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-indigo-300">
                    <span className="text-base">🎓</span> FTO
                  </span>
                )}
                {profile.cert_asd && (
                  <span className="inline-flex items-center gap-2 bg-sky-950/40 border border-sky-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-sky-300">
                    <span className="text-base">🚁</span> ASD
                  </span>
                )}
                {profile.cert_heat && (
                  <span className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-rose-300">
                    <span className="text-base">🏎️</span> H.E.A.T
                  </span>
                )}
                {profile.cert_swat && (
                  <span className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-slate-300">
                    <span className="text-base">🛡️</span> S.W.A.T
                  </span>
                )}
                {profile.cert_cid && (
                  <span className="inline-flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-amber-300">
                    <span className="text-base">🕵️</span> C.I.D
                  </span>
                )}
                {profile.cert_meu && (
                  <span className="inline-flex items-center gap-2 bg-teal-950/40 border border-teal-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-teal-300">
                    <span className="text-base">🛥️</span> M.E.U
                  </span>
                )}
                {profile.cert_k9 && (
                  <span className="inline-flex items-center gap-2 bg-orange-950/40 border border-orange-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-orange-300">
                    <span className="text-base">🐕</span> K-9 Unit
                  </span>
                )}
                {profile.cert_sop && (
                  <span className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider text-emerald-300">
                    <span className="text-base">📋</span> S.O.P
                  </span>
                )}

                {!profile.cert_fto && !profile.cert_asd && !profile.cert_heat && !profile.cert_swat && !profile.cert_cid && !profile.cert_meu && !profile.cert_k9 && !profile.cert_sop && (
                  <div className="w-full text-center py-6">
                    <p className="text-sm text-slate-600 font-medium italic">No specialized certifications logged in database.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditingAvatar(false)}>
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand" /> Avatar Setup
              </h3>
              <button onClick={() => setIsEditingAvatar(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden relative group">
                {avatarInput ? (
                  <img src={avatarInput} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-700" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Image URL</label>
              <input
                type="url"
                value={avatarInput}
                onChange={e => setAvatarInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand transition-colors"
                placeholder="https://imgur.com/..."
                autoFocus
              />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Direct image links only. Note: Some hosts (like Discord) block exports. Imgur is recommended.</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar || !avatarInput.trim()}
                className="w-full bg-brand hover:bg-brand/90 text-white px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all disabled:opacity-50"
              >
                {isSavingAvatar ? "Saving..." : "Save Picture"}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isSavingAvatar}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 px-4 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all disabled:opacity-50"
                >
                  Remove Picture
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
