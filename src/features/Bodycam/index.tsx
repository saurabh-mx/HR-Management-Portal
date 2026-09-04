import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/supabaseClient";

const getFullDepartmentName = (dept?: string) => {
  if (!dept) return "SAN ANDREAS STATE POLICE";
  switch (dept.toUpperCase()) {
    case "LSPD": return "LOS SANTOS POLICE DEPARTMENT";
    case "BCSO": return "BLAINE COUNTY SHERIFF'S OFFICE";
    case "SASP": return "SAN ANDREAS STATE POLICE";
    case "SAPR": return "SAN ANDREAS PARK RANGERS";
    case "SASP ACADEMY": return "SAN ANDREAS STATE POLICE ACADEMY";
    default: return dept.toUpperCase();
  }
};

const getDeptLogo = (dept: string) => {
  if (!dept) return '/logos/sasp.png';
  const upper = dept.toUpperCase();
  if (upper.includes('BCSO')) return '/logos/bcso.png';
  if (upper.includes('LSPD')) return '/logos/lspd.png';
  if (upper.includes('SAPR')) return '/logos/sapr.jpg';
  if (upper.includes('ACADEMY') || upper.includes('PAU')) return '/logos/pau.jpg';
  return '/logos/sasp.png';
};

const getDepartmentTheme = (dept?: string) => {
  if (!dept) return { primary: "#94a3b8", bg: "#0f172a" }; 
  const upper = dept.toUpperCase();
  if (upper.includes("SASP") && !upper.includes("ACADEMY")) return { primary: "#e2e8f0", bg: "#020617" }; 
  if (upper.includes("SAPR")) return { primary: "#22c55e", bg: "#020617" }; 
  if (upper.includes("LSPD")) return { primary: "#3b82f6", bg: "#020617" }; 
  if (upper.includes("BCSO")) return { primary: "#eab308", bg: "#020617" }; 
  if (upper.includes("ACADEMY")) return { primary: "#94a3b8", bg: "#020617" }; 
  return { primary: "#94a3b8", bg: "#020617" };
};

export default function BodycamOverlay() {
  const { badge } = useParams<{ badge: string }>();
  const [employee, setEmployee] = useState<any | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every second for exact accuracy
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchOfficer() {
      if (!badge) return;
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("badge_number", badge)
        .single();
      
      if (!error && data) {
        setEmployee(data);
      }
    }
    fetchOfficer();
  }, [badge]);

  if (!employee) return null;

  // Strict formatting: YYYY-MM-DD HH:MM:SS 
  const formattedDate = time.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }); // Outputs: YYYY-MM-DD
  
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const timeZone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(time).find(part => part.type === 'timeZoneName')?.value || 'UTC';
  const theme = getDepartmentTheme(employee.department);

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent font-sans select-none pointer-events-none">
      
      {/* Top Right Container */}
      <div className="absolute top-10 right-10 flex flex-col gap-2 animate-in slide-in-from-right-8 slide-in-from-top-4 fade-in duration-1000 ease-out">

        {/* Row 2: Modern HUD Container */}
        <div 
          className="flex items-stretch bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden relative"
          style={{ boxShadow: `0 8px 32px ${theme.primary}20` }}
        >
          
          {/* Subtle colored glow inside */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.primary}, transparent)` }}></div>

          {/* Text Data */}
          <div className="flex flex-col justify-center p-5 pl-7 pr-8 relative z-10">
            
            {/* Integrated Axon Branding & Rec Indicator */}
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_12px_rgba(239,68,68,1)] border border-red-300"></div>
                <span className="text-red-500 font-black text-xs tracking-[0.25em] drop-shadow-md">REC</span>
              </div>
              <div className="bg-[#fad000] text-black font-black text-[9px] px-2 py-0.5 tracking-[0.25em] rounded-sm shadow-[0_0_10px_rgba(250,208,0,0.4)]">
                AXON
              </div>
            </div>

            <h2 className="text-[12px] font-black text-white/90 tracking-[0.25em] uppercase mb-1.5 drop-shadow-md">
              {getFullDepartmentName(employee.department)}
            </h2>
            
            <div className="text-[24px] font-mono font-medium text-white tracking-[0.1em] mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tabular-nums">
              {formattedDate} <span className="opacity-40 mx-2">|</span> {formattedTime} <span className="text-sm ml-2 opacity-60">{timeZone}</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-black tracking-[0.2em] uppercase drop-shadow-md" style={{ color: theme.primary }}>
                {employee.rank || "OFFICER"}
              </span>
              <span className="text-white/20 text-xs">/</span>
              <span className="text-[16px] font-bold tracking-widest text-white drop-shadow-md uppercase">
                <span className="opacity-60 mr-2">[{employee.badge_number}]</span>
                {employee.fullName || employee.name}
              </span>
            </div>
          </div>

          {/* Logo Section */}
          <div className="flex items-center justify-center p-5 min-w-[100px] border-l border-white/10 bg-gradient-to-r from-transparent to-white/5 relative z-10">
            <img 
              src={getDeptLogo(employee.department)} 
              alt="Department Seal" 
              className="w-16 h-16 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,1)] opacity-95 contrast-125"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
