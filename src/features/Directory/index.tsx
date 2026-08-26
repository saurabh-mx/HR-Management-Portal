import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Search, UserMinus, CalendarOff, Database, Edit, ScanLine, Activity, AlertTriangle } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import DataSyncModal from '@/features/AdminPanel/components/DataSyncModal';
import { StatCard } from '@/features/Dashboard/components/StatCard';
import { isHighCommandOrHR } from '@/auth/roles/roleMatrix';
import { useAuth } from '@/auth/hooks/useAuth';

interface Employee {
  id: string;
  name: string;
  badge_number: string;
  role: string;
  department: string;
  discord_tag?: string;
  status: string;
  rank?: string;
  citizen_id?: string;
  phone_number?: string;
  department_join_date?: string;
  duration_in_department?: string;
  last_promotion_date?: string;
  days_since_last_promoted?: number;
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
  is_admin?: boolean;
  avatar_url?: string;
  led_sub_departments?: string[];
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

export const isStatusActive = (s?: string) => {
  const str = (s || '').trim().toLowerCase();
  return str === 'active' || str === 'active duty' || str === 'approved' || str === 'on duty';
};

export const isStatusInactive = (s?: string) => {
  const str = (s || '').trim().toLowerCase();
  return str === 'inactive' || str === 'terminated' || str === 'suspended' || str === 'fired' || str === 'resigned' || str === 'banned';
};

export const isStatusLOA = (s?: string) => {
  const str = (s || '').trim().toLowerCase();
  return str === 'loa' || str === 'on loa';
};

const EmployeeRow = ({ employee, onClick, isAdmin, onUpdateLeads }: { employee: Employee, onClick: () => void, isAdmin: boolean, onUpdateLeads: (empId: string, leads: string[]) => void }) => {
  const deptColor = getDepartmentColor(employee.department);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <tr
      onClick={onClick}
      className="group border-b border-transparent transition-all duration-300 relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? hexToRgba(deptColor, 0.15) : hexToRgba(deptColor, 0.05),
        backdropFilter: isHovered ? 'blur(8px)' : 'blur(2px)',
        boxShadow: isHovered 
          ? `inset 4px 0 0 0 ${deptColor}, inset 0 0 20px ${hexToRgba(deptColor, 0.15)}, 0 10px 30px -10px rgba(0,0,0,0.5)`
          : `inset 2px 0 0 0 ${deptColor}`,
        transform: isHovered ? 'scale(1.01) translateY(-1px)' : 'scale(1) translateY(0)',
        zIndex: isHovered ? 20 : 1
      }}
    >
      <td className="py-4 pl-4 pr-3 font-bold transition-all duration-300 origin-left" style={{ 
        color: deptColor, 
        fontSize: '1.125rem',
        textShadow: isHovered ? `0 0 15px ${hexToRgba(deptColor, 0.8)}` : 'none',
        transform: isHovered ? 'scale(1.1) translateX(4px)' : 'scale(1) translateX(0)',
      }}>{employee.name}</td>
      <td className="py-4 px-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${
          isStatusActive(employee.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
          isStatusInactive(employee.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
          isStatusLOA(employee.status) ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.1)]' :
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {employee.status}
        </span>
      </td>
      <td className="py-4 px-3 tracking-wider font-mono transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.85) }}>{employee.badge_number}</td>
      <td className="py-4 px-3 font-medium transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.85) }}>{employee.rank || "—"}</td>
      <td className="py-4 px-3 font-bold tracking-wider transition-all duration-300" style={{ color: deptColor, textShadow: isHovered ? `0 0 10px ${hexToRgba(deptColor, 0.5)}` : 'none' }}>{employee.department}</td>
      <td className="py-4 px-3 text-sm transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.7) }}>{employee.discord_tag || "—"}</td>
      {isAdmin && (
        <td className="py-4 px-3 text-right relative" onClick={e => e.stopPropagation()}>
           {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white p-1.5 rounded bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
               <Edit className="w-4 h-4" />
             </button>
           ) : (
             <div className="flex items-center justify-end gap-2">
               <details className="group relative text-left">
                 <summary className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1 text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden flex justify-between items-center w-36 shadow-lg hover:border-brand/50">
                    <span className="truncate">
                      {employee.led_sub_departments?.length ? employee.led_sub_departments.join(', ') : 'Select Leads...'}
                    </span>
                 </summary>
                 <div className="absolute right-0 top-full mt-1 z-50 w-48 flex flex-col gap-1 max-h-48 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-700 shadow-2xl custom-scrollbar">
                    {['HEAT', 'FTD', 'ASD', 'K9', 'MEDIA TEAM', 'DOC', 'SBI', 'MEU'].map(sub => (
                      <label key={sub} className="flex items-center gap-2 text-[11px] font-medium text-slate-300 cursor-pointer hover:text-white p-1.5 rounded hover:bg-slate-900 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={(employee.led_sub_departments || []).includes(sub)}
                          onChange={e => {
                             const currentLeads = employee.led_sub_departments || [];
                             if (e.target.checked) {
                               onUpdateLeads(employee.id, [...currentLeads, sub]);
                             } else {
                               onUpdateLeads(employee.id, currentLeads.filter(s => s !== sub));
                             }
                          }}
                          className="rounded border-slate-700 text-brand focus:ring-brand bg-slate-900 w-3.5 h-3.5"
                        />
                        {sub}
                      </label>
                    ))}
                 </div>
               </details>
               <button onClick={() => setIsEditing(false)} className="text-emerald-500 hover:text-emerald-400 p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors">
                 Done
               </button>
             </div>
           )}
        </td>
      )}
    </tr>
  );
};

export default function EmployeeDirectory() {
  const { profile, adminSafeMode } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeDepartment, setActiveDepartment] = useState("All");
  const departmentsList = ["All", "SASP", "LSPD", "BCSO", "SAPR", "SASP Academy"];
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const [employeeStrikes, setEmployeeStrikes] = useState({ strikes: 0, warnings: 0, verbals: 0, revoked: 0 });

  useEffect(() => {
    async function fetchUserStrikes() {
      if (!selectedEmployee?.name) return;
      const { data } = await supabase
        .from('strikes')
        .select('*')
        .ilike('name', `${selectedEmployee.name}%`);
      
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
      } else {
        setEmployeeStrikes({ strikes: 0, warnings: 0, verbals: 0, revoked: 0 });
      }
    }
    
    if (selectedEmployee) {
      fetchUserStrikes();
    }
  }, [selectedEmployee]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [profile, adminSafeMode]);

  // SECURITY CHECK: Verify if the logged-in user is High Command
  function checkAdminStatus() {
    if (adminSafeMode || (profile && isHighCommandOrHR(profile))) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    
    if (error) console.error("Error fetching employees:", error);
    else if (data) {
      const departmentOrder = ["SASP", "SAPR", "LSPD", "BCSO", "SASP Academy"];
      const rankOrder = [
        ["Chief", "Sheriff", "Game Warden"],
        ["Asst. Chief", "Colonel", "Asst. Game Warden"],
        ["Captain", "major", "Lead Ranger"],
        ["Lieutenant"],
        ["Head-Sergeant"],
        ["Sergeant First Class"],
        ["Sergeant"],
        ["Corporal"],
        ["Senior-Officer", "Senior-deputy", "Senior-ranger"],
        ["Officer First Class", "deputy First Class", "ranger First Class"],
        ["Officer", "deputy", "ranger"]
      ];
      
      const getDeptIndex = (dept?: string) => {
        if (!dept) return 999;
        const i = departmentOrder.indexOf(dept);
        return i === -1 ? 999 : i;
      };
      
      const getRankIndex = (rank?: string) => {
        if (!rank) return 999;
        const lowerRank = rank.toLowerCase();
        for (let i = 0; i < rankOrder.length; i++) {
          if (rankOrder[i].some(r => r.toLowerCase() === lowerRank)) {
            return i;
          }
        }
        return 999;
      };

      const sorted = [...data].sort((a, b) => {
        const aIsStudent = a.role?.toLowerCase() === 'student';
        const bIsStudent = b.role?.toLowerCase() === 'student';
        
        if (aIsStudent && !bIsStudent) return 1;
        if (!aIsStudent && bIsStudent) return -1;

        const deptDiff = getDeptIndex(a.department) - getDeptIndex(b.department);
        if (deptDiff !== 0) return deptDiff;
        
        const rankDiff = getRankIndex(a.rank) - getRankIndex(b.rank);
        if (rankDiff !== 0) return rankDiff;
        
        return (a.badge_number || "").localeCompare(b.badge_number || "");
      });
      setEmployees(sorted);
    }
  }

  const handleUpdateLeads = async (empId: string, newLeads: string[]) => {
    const updatedEmployees = employees.map(e => e.id === empId ? { ...e, led_sub_departments: newLeads } : e);
    setEmployees(updatedEmployees);
    
    if (selectedEmployee?.id === empId) {
      setSelectedEmployee({ ...selectedEmployee, led_sub_departments: newLeads });
    }

    const { error } = await supabase
      .from('employees')
      .update({ led_sub_departments: newLeads })
      .eq('id', empId);
      
    if (error) {
       alert("Failed to update leads: " + error.message);
    } else {
       const emp = updatedEmployees.find(e => e.id === empId);
       logAuditAction("PERSONNEL_UPDATED", emp?.name || 'Unknown', `Updated Leads to [${newLeads.join(', ')}]`);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp.badge_number && emp.badge_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (emp.discord_tag && emp.discord_tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (emp.status && emp.status.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = activeDepartment === "All" || emp.department === activeDepartment;
    
    return matchesSearch && matchesDept;
  });

  const departmentEmployees = activeDepartment === "All" ? employees : employees.filter(e => e.department === activeDepartment);

  const getDeptCount = (list: Employee[], dept: string) => list.filter(e => e.department === dept).length;
  
  const renderDeptBreakdown = (list: Employee[]) => (
    <div className="space-y-2.5 h-full flex flex-col justify-center">
      <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand/80 mb-1 border-b border-brand/20 pb-1">Department Breakdown</h4>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <div className="flex justify-between items-center bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 px-2 py-1 rounded border-l-2" style={{ borderLeftColor: getDepartmentColor('SASP') }}><span className="font-bold" style={{ color: getDepartmentColor('SASP') }}>SASP</span><span className="font-bold text-slate-200">{getDeptCount(list, 'SASP')}</span></div>
        <div className="flex justify-between items-center bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 px-2 py-1 rounded border-l-2" style={{ borderLeftColor: getDepartmentColor('LSPD') }}><span className="font-bold" style={{ color: getDepartmentColor('LSPD') }}>LSPD</span><span className="font-bold text-slate-200">{getDeptCount(list, 'LSPD')}</span></div>
        <div className="flex justify-between items-center bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 px-2 py-1 rounded border-l-2" style={{ borderLeftColor: getDepartmentColor('BCSO') }}><span className="font-bold" style={{ color: getDepartmentColor('BCSO') }}>BCSO</span><span className="font-bold text-slate-200">{getDeptCount(list, 'BCSO')}</span></div>
        <div className="flex justify-between items-center bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 px-2 py-1 rounded border-l-2" style={{ borderLeftColor: getDepartmentColor('SAPR') }}><span className="font-bold" style={{ color: getDepartmentColor('SAPR') }}>SAPR</span><span className="font-bold text-slate-200">{getDeptCount(list, 'SAPR')}</span></div>
        <div className="flex justify-between items-center col-span-2 bg-slate-950/40 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-[0_10px_30px_-15px_rgba(14,165,233,0.2)] hover:border-white/10 transition-all duration-500 px-2 py-1 rounded border-l-2" style={{ borderLeftColor: getDepartmentColor('SASP Academy') }}><span className="font-bold" style={{ color: getDepartmentColor('SASP Academy') }}>SASP Academy</span><span className="font-bold text-slate-200">{getDeptCount(list, 'SASP Academy')}</span></div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      
      {/* Sleek Glassmorphic Header */}
      <div className="relative mb-8">
        <div className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg">
              PERSONNEL <span className="font-bold text-brand">DIRECTORY</span>
            </h1>
            <div className="w-16 h-1 bg-brand mt-2 mb-2 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-sm text-slate-400 font-light tracking-wide flex items-center gap-2">
              Manage and view personnel rosters, department allocations, and statuses.
            </p>
          </div>
          
          <div className="pb-1 flex items-center gap-3">
            {isAdmin && (
              <>
                <button onClick={() => setIsSyncModalOpen(true)} className="bg-brand/10 backdrop-blur-md text-brand px-5 py-2 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-brand/20 transition-all flex items-center gap-2 border border-brand/30 shadow-[0_0_10px_hsl(var(--brand-main)/0.2)] whitespace-nowrap">
                  <Database className="w-4 h-4" /> Directory Imports
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {departmentsList.map(dept => {
          const isActive = activeDepartment === dept;
          const activeColor = dept === 'All' ? 'hsl(var(--brand-main))' : getDepartmentColor(dept);
          
          return (
            <button
              key={dept}
              onClick={() => setActiveDepartment(dept)}
              style={isActive ? { backgroundColor: activeColor, color: '#020617', boxShadow: `0 0 15px ${activeColor}` } : {}}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive 
                  ? "" 
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60"
              }`}
            >
              {dept}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Personnel"
          value={departmentEmployees.length}
          icon={Users}
          hoverContent={renderDeptBreakdown(departmentEmployees)}
        />
        <StatCard
          title="Active Duty"
          value={departmentEmployees.filter(e => isStatusActive(e.status)).length}
          icon={Shield}
          hoverContent={renderDeptBreakdown(departmentEmployees.filter(e => isStatusActive(e.status)))}
        />
        <StatCard
          title="On LOA"
          value={departmentEmployees.filter(e => isStatusLOA(e.status)).length}
          icon={CalendarOff}
          hoverContent={renderDeptBreakdown(departmentEmployees.filter(e => isStatusLOA(e.status)))}
        />
        <StatCard
          title="Inactive"
          value={departmentEmployees.filter(e => isStatusInactive(e.status)).length}
          icon={UserMinus}
          hoverContent={renderDeptBreakdown(departmentEmployees.filter(e => isStatusInactive(e.status)))}
        />
      </div>

      <Card className="glass-panel rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 animate-slide-up">
        <CardHeader className="bg-slate-950/40 border-b border-white/5">
          <CardTitle className="text-lg font-medium text-white">{activeDepartment === "All" ? "Global" : activeDepartment} Active Roster</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, callsign, status, or Discord ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 pl-4 font-medium">Officer</th>
                  <th className="pb-3 px-3 font-medium">Status</th>
                  <th className="pb-3 px-3 font-medium">Callsign</th>
                  <th className="pb-3 px-3 font-medium">Rank</th>
                  <th className="pb-3 px-3 font-medium">Department</th>
                  <th className="pb-3 px-3 font-medium">Discord ID</th>
                  {isAdmin && <th className="pb-3 px-3 font-medium text-right w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent border-t border-slate-800/60">
                {filteredEmployees.map((employee) => (
                  <EmployeeRow 
                    key={employee.id} 
                    employee={employee} 
                    isAdmin={!!isAdmin}
                    onUpdateLeads={handleUpdateLeads}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsFlipped(false);
                    }} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Flash Card Modal */}
      {selectedEmployee && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md transition-opacity perspective-1000 overflow-y-auto"
          onClick={() => setSelectedEmployee(null)}
        >
          <div 
            className="animate-toss relative w-full max-w-[380px] h-[640px] shrink-0 cursor-pointer group/card my-auto"
            onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          >
            <div className={`w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] preserve-3d shadow-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* FRONT OF CARD - SMART SECURITY BADGE */}
              <div 
                className="absolute inset-0 w-full h-full rounded-[24px] bg-slate-900 flex flex-col overflow-hidden backface-hidden"
                style={{
                  boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.2)}`
                }}
              >
                {/* Holographic Overlay Layer */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover/card:scale-110"
                  style={{
                    background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.4)} 60%, transparent 80%)`,
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
                <div className="absolute top-0 left-0 right-0 h-2 z-10" style={{ backgroundColor: getDepartmentColor(selectedEmployee.department) }} />
                
                {/* Lanyard Hole */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/60 rounded-full border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] z-20" />

                {/* Background Logo Watermark */}
                <div 
                  className="absolute inset-0 z-0 opacity-15 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110"
                  style={{
                    backgroundImage: `url(${(() => {
                      const dept = selectedEmployee.department || '';
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
                          const dept = selectedEmployee.department || '';
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
                          {selectedEmployee.department || "STATE"}
                        </h3>
                        <p className="text-[8px] font-mono tracking-widest" style={{ color: getDepartmentColor(selectedEmployee.department) }}>
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
                      {selectedEmployee.avatar_url ? (
                        <img src={selectedEmployee.avatar_url} alt={selectedEmployee.name} className="w-full h-full object-cover filter contrast-110" />
                      ) : (
                        <span style={{ color: getDepartmentColor(selectedEmployee.department) }}>{selectedEmployee.name.charAt(0)}</span>
                      )}
                      
                      {/* Photo overlay scanline */}
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30 z-20" />
                    </div>

                    <div className="mt-4 text-center w-full">
                      <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-lg leading-none mb-1">
                        {selectedEmployee.name}
                      </h2>
                      <p className="font-mono text-base font-bold tracking-[0.15em] drop-shadow-md" style={{ color: getDepartmentColor(selectedEmployee.department) }}>
                        #{selectedEmployee.badge_number}
                      </p>
                    </div>
                  </div>
                  
                  {/* Data Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 w-full text-left mt-auto bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Rank</p>
                      <p className="text-xs font-bold text-slate-200 truncate">{selectedEmployee.rank || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Clearance</p>
                      <p className="text-xs font-bold text-slate-200 truncate">{selectedEmployee.role || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                      <p className={`text-xs font-black tracking-wider truncate uppercase ${selectedEmployee.status === 'Active' ? 'text-emerald-400' : selectedEmployee.status === 'Inactive' ? 'text-rose-400' : 'text-fuchsia-400'}`}>
                        {selectedEmployee.status || "ACTIVE"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Department</p>
                      <p className="text-xs font-bold truncate flex items-center gap-1" style={{ color: getDepartmentColor(selectedEmployee.department) }}>
                        {selectedEmployee.department || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Barcode */}
                <div className="mt-auto h-12 w-full flex flex-col items-center justify-end pb-3 bg-gradient-to-t from-black/80 to-transparent z-10 relative">
                  <div className="flex gap-1 h-5 opacity-60">
                    {/* Simulated barcode bars */}
                    {[1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 5, 1, 2, 3, 1, 2, 1].map((w, i) => (
                      <div key={i} className="bg-white h-full" style={{ width: `${w * 2}px` }} />
                    ))}
                  </div>
                  <p className="text-[6px] font-mono tracking-widest text-slate-500 mt-1 uppercase">
                    Scan for verification
                  </p>
                </div>
              </div>

              {/* BACK OF CARD - INTELLIGENCE DOSSIER (BENTO BOX) */}
              <div 
                className="absolute inset-0 w-full h-full rounded-[24px] bg-slate-950 flex flex-col overflow-hidden backface-hidden rotate-y-180"
                style={{
                  boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 30px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.15)}`
                }}
              >
                {/* Holographic Overlay Layer */}
                <div 
                  className="absolute inset-0 opacity-20 mix-blend-color-dodge pointer-events-none transition-transform duration-1000 ease-out group-hover/card:scale-110"
                  style={{
                    background: `linear-gradient(125deg, transparent 20%, ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.4)} 40%, rgba(255,255,255,0.8) 50%, ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.4)} 60%, transparent 80%)`,
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
                      const dept = selectedEmployee.department || '';
                      if (dept.includes('BCSO')) return '/logos/bcso.png';
                      if (dept.includes('LSPD')) return '/logos/lspd.png';
                      if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                      if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                      return '/logos/sasp.png';
                    })()})`,
                    backgroundSize: '120%'
                  }}
                />
                
                <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: getDepartmentColor(selectedEmployee.department) }} />
                
                {/* Header */}
                <div className="px-5 pt-5 pb-3 relative z-10 border-b border-white/5 bg-black/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        DOSSIER FILE
                      </h3>
                      <p className="text-[8px] font-mono tracking-widest mt-1 opacity-70" style={{ color: getDepartmentColor(selectedEmployee.department) }}>
                        {selectedEmployee.name} // {selectedEmployee.badge_number}
                      </p>
                    </div>
                    <img 
                      src={(() => {
                        const dept = selectedEmployee.department || '';
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
                        <p className="text-xs font-medium text-slate-200 font-mono">{selectedEmployee.citizen_id || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Phone Number</p>
                        <p className="text-xs font-medium text-slate-200 font-mono">{selectedEmployee.phone_number || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Discord Tag</p>
                        <p className="text-xs font-medium text-slate-200">{selectedEmployee.discord_tag || '—'}</p>
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
                        <p className="text-xs font-medium text-slate-200">{selectedEmployee.sub_department || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Leads</p>
                        <p className="text-xs font-medium text-slate-200 truncate" title={selectedEmployee.led_sub_departments?.join(', ')}>
                          {selectedEmployee.led_sub_departments?.length ? selectedEmployee.led_sub_departments.join(', ') : '—'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Titles</p>
                        <p className="text-xs font-medium text-slate-200 truncate" title={selectedEmployee.titles}>{selectedEmployee.titles || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Join Date</p>
                        <p className="text-xs font-medium text-slate-200">{selectedEmployee.department_join_date || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Duration</p>
                        <p className="text-xs font-medium text-slate-200">{selectedEmployee.duration_in_department || '—'}</p>
                      </div>
                      
                      {/* Promotion Progress Bar style */}
                      <div className="col-span-2 mt-1">
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-[7px] text-slate-500 uppercase tracking-widest">Last Promoted</p>
                          <p className="text-[8px] font-bold text-emerald-400">{selectedEmployee.days_since_last_promoted !== null ? `${selectedEmployee.days_since_last_promoted} Days Ago` : '—'}</p>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (selectedEmployee.days_since_last_promoted || 0) / 100 * 100))}%` 
                            }} 
                          />
                        </div>
                        <p className="text-[7px] text-slate-500 text-right mt-1">{selectedEmployee.last_promotion_date || 'N/A'}</p>
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
                        const isActive = selectedEmployee[cert.key as keyof Employee];
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DataSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onSuccess={() => {
          fetchEmployees();
        }} 
      />
    </div>
  );
}