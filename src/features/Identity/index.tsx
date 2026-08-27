import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2, Clock, User } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

// Rate limiter: max 15 lookups per session
const RATE_LIMIT_KEY = "identity_lookups";
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(): boolean {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, windowStart: Date.now() };

    // Reset if window expired
    if (Date.now() - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 1, windowStart: Date.now() }));
      return true;
    }

    if (data.count >= RATE_LIMIT_MAX) {
      return false;
    }

    data.count += 1;
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return true;
  }
}

const getDepartmentColor = (dept?: string) => {
  if (!dept) return "#94a3b8";
  if (dept.includes("BCSO")) return "#d2b14b";
  if (dept.includes("LSPD")) return "#3b82f6";
  if (dept.includes("SAPR")) return "#22c55e";
  if (dept.includes("Academy") || dept.includes("PAU")) return "#f97316";
  if (dept.includes("SASP")) return "#64748b";
  return "#94a3b8";
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDeptLogo = (dept?: string) => {
  if (!dept) return "/logos/sasp.png";
  if (dept.includes("BCSO")) return "/logos/bcso.png";
  if (dept.includes("LSPD")) return "/logos/lspd.png";
  if (dept.includes("SAPR")) return "/logos/sapr.jpg";
  if (dept.includes("Academy") || dept.includes("PAU")) return "/logos/pau.jpg";
  return "/logos/sasp.png";
};

interface IdentityData {
  badge_number: string;
  name: string;
  rank?: string;
  department?: string;
  status?: string;
  avatar_url?: string;
  cert_fto?: boolean;
  cert_asd?: boolean;
  cert_heat?: boolean;
  cert_swat?: boolean;
  cert_cid?: boolean;
  cert_meu?: boolean;
  cert_k9?: boolean;
  cert_sop?: boolean;
}

type ViewState = "loading" | "verified" | "not_found" | "error" | "rate_limited";

export default function IdentityCard() {
  const { badge } = useParams<{ badge: string }>();
  const [identity, setIdentity] = useState<IdentityData | null>(null);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [scanProgress, setScanProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!badge) {
      setViewState("not_found");
      return;
    }

    if (!checkRateLimit()) {
      setViewState("rate_limited");
      return;
    }

    // Simulate a scan animation before fetching
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    const fetchTimer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("badge_number, name, rank, department, status, avatar_url, cert_fto, cert_asd, cert_heat, cert_swat, cert_cid, cert_meu, cert_k9, cert_sop")
          .ilike("badge_number", badge)
          .maybeSingle();

        if (error) {
          console.error("Identity lookup error:", error);
          setViewState("error");
          return;
        }

        if (data) {
          setIdentity(data as IdentityData);
          setViewState("verified");
        } else {
          setViewState("not_found");
        }
      } catch (err) {
        console.error("Network error:", err);
        setViewState("error");
      }
    }, 2000);

    return () => {
      clearInterval(scanInterval);
      clearTimeout(fetchTimer);
    };
  }, [badge]);

  const deptColor = identity ? getDepartmentColor(identity.department) : "#94a3b8";
  const deptLogo = identity ? getDeptLogo(identity.department) : "/logos/sasp.png";

  const isActive = identity?.status?.toLowerCase() === "active" || identity?.status?.toLowerCase() === "active duty";
  const isLOA = identity?.status?.toLowerCase() === "loa" || identity?.status?.toLowerCase() === "on loa";
  const isInactive = identity?.status?.toLowerCase() === "inactive" || identity?.status?.toLowerCase() === "terminated" || identity?.status?.toLowerCase() === "suspended";

  const certs = identity
    ? [
        { key: "cert_fto", label: "FTO", emoji: "🎓" },
        { key: "cert_asd", label: "ASD", emoji: "🚁" },
        { key: "cert_heat", label: "HEAT", emoji: "🏎️" },
        { key: "cert_swat", label: "SWAT", emoji: "🛡️" },
        { key: "cert_cid", label: "CID", emoji: "🕵️" },
        { key: "cert_meu", label: "MEU", emoji: "🛥️" },
        { key: "cert_k9", label: "K9", emoji: "🐕" },
        { key: "cert_sop", label: "SOP", emoji: "📋" },
      ].filter((c) => identity[c.key as keyof IdentityData])
    : [];

  // LOADING STATE
  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <style>{`
          @keyframes scanline { 0% { top: 0; } 100% { top: 100%; } }
          @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        `}</style>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <p className="text-sm font-bold tracking-[0.3em] uppercase text-emerald-500" style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>
              Scanning Identity...
            </p>
          </div>

          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-3 font-mono tracking-widest uppercase">
            Verifying Badge #{badge}
          </p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (viewState === "error") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-black tracking-widest text-white uppercase">System Error</h2>
          <p className="text-sm text-slate-400 leading-relaxed">Unable to reach the verification server. Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-all border border-slate-700"
          >
            Retry Scan
          </button>
        </div>
      </div>
    );
  }

  // RATE LIMITED STATE
  if (viewState === "rate_limited") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <Shield className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-black tracking-widest text-white uppercase">Rate Limited</h2>
          <p className="text-sm text-slate-400 leading-relaxed">You have exceeded the maximum number of identity lookups (15/hour). Please wait before trying again.</p>
        </div>
      </div>
    );
  }

  // NOT FOUND STATE
  if (viewState === "not_found") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-black tracking-widest text-white uppercase">Identity Not Found</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Badge <span className="font-mono text-white font-bold">#{badge}</span> does not match any personnel in the system.
          </p>
          <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-bold tracking-widest uppercase bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full mx-auto w-fit mt-2">
            <XCircle className="w-3.5 h-3.5" /> UNVERIFIED
          </div>
        </div>
      </div>
    );
  }

  // VERIFIED STATE
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Background Effects */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${deptLogo})`,
          backgroundSize: "50%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "grayscale(100%) blur(2px)",
        }}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-20 blur-[150px]"
        style={{ backgroundColor: deptColor }}
      />

      {/* Header */}
      <div className="relative z-10 text-center mb-8" style={{ animation: "float 6s ease-in-out infinite" }}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <Shield className="w-6 h-6" style={{ color: deptColor }} />
          <h1 className="text-xs font-black tracking-[0.4em] uppercase text-slate-300">
            Digital Identity Verification
          </h1>
        </div>
        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase px-5 py-2 rounded-full border shadow-lg ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20"
              : isLOA
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20"
              : isInactive
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/20"
              : "bg-slate-500/10 text-slate-400 border-slate-500/30"
          }`}
        >
          {isActive ? (
            <><CheckCircle2 className="w-4 h-4" /> Verified — Active Duty</>
          ) : isLOA ? (
            <><Clock className="w-4 h-4" /> Verified — On Leave</>
          ) : isInactive ? (
            <><XCircle className="w-4 h-4" /> Verified — Inactive</>
          ) : (
            <><AlertTriangle className="w-4 h-4" /> Status: {identity?.status || "Unknown"}</>
          )}
        </div>
      </div>

      {/* ID CARD */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[380px] rounded-[24px] bg-slate-900 overflow-hidden z-10 group"
        style={{
          boxShadow: `0 25px 60px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px ${hexToRgba(deptColor, 0.2)}, 0 0 80px ${hexToRgba(deptColor, 0.15)}`,
        }}
      >
        {/* Holographic Overlay */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover:scale-110 z-30"
          style={{
            background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(deptColor, 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(deptColor, 0.4)} 60%, transparent 80%)`,
            backgroundSize: "200% 200%",
            animation: "shimmer 8s linear infinite",
          }}
        />

        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 z-20" style={{ backgroundColor: deptColor }} />

        {/* Lanyard Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/60 rounded-full border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] z-20" />

        {/* Background Watermark */}
        <div
          className="absolute inset-0 z-0 opacity-15 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110"
          style={{ backgroundImage: `url(${deptLogo})`, backgroundSize: "120%" }}
        />

        <div className="flex flex-col z-10 relative mt-12 px-8 pb-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <img src={deptLogo} alt="Dept" className="h-7 w-auto drop-shadow-lg opacity-90 rounded-sm" />
              <div>
                <h3 className="text-xs font-black tracking-[0.25em] uppercase text-white/90 drop-shadow-md">
                  {identity?.department || "STATE"}
                </h3>
                <p className="text-[8px] font-mono tracking-widest" style={{ color: deptColor }}>
                  VERIFIED CREDENTIAL
                </p>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-xl flex items-center justify-center text-4xl font-bold border-2 bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
              {identity?.avatar_url ? (
                <img src={identity.avatar_url} alt={identity.name} className="w-full h-full object-cover filter contrast-110" />
              ) : (
                <User className="w-12 h-12 text-slate-600" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30 z-20" />
            </div>

            <div className="mt-4 text-center w-full">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase drop-shadow-lg leading-none mb-1">
                {identity?.name}
              </h2>
              <p className="font-mono text-base font-bold tracking-[0.15em] drop-shadow-md" style={{ color: deptColor }}>
                #{identity?.badge_number}
              </p>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 w-full text-center bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
            <div className="flex flex-col items-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Rank</p>
              <p className="text-xs font-bold text-slate-200 truncate">{identity?.rank || "—"}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Department</p>
              <p className="text-xs font-bold truncate" style={{ color: deptColor }}>
                {identity?.department || "—"}
              </p>
            </div>
            <div className="flex flex-col items-center col-span-2">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
              <p
                className={`text-xs font-black tracking-wider uppercase ${
                  isActive ? "text-emerald-400" : isLOA ? "text-amber-400" : isInactive ? "text-rose-400" : "text-slate-400"
                }`}
              >
                {identity?.status || "UNKNOWN"}
              </p>
            </div>
          </div>

          {/* Certifications */}
          {certs.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {certs.map((c) => (
                <span
                  key={c.key}
                  className="px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center gap-1.5"
                >
                  <span className="text-sm">{c.emoji}</span> {c.label}
                </span>
              ))}
            </div>
          )}

          {/* QR Code Footer */}
          <div className="mt-6 flex flex-col items-center justify-end">
            <QRCodeSVG
              value={`${import.meta.env.VITE_SITE_URL || window.location.origin}/identity/${identity?.badge_number}`}
              size={56}
              bgColor="transparent"
              fgColor="rgba(148, 163, 184, 0.5)"
              level="L"
            />
            <p className="text-[6px] font-mono tracking-widest text-slate-500 mt-1.5 uppercase">
              Identity Verified • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-[10px] text-slate-600 tracking-widest uppercase font-bold">
          San Andreas State Personnel System
        </p>
      </div>
    </div>
  );
}
