import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Search, Plus, X, UserMinus, CalendarOff, CheckCircle2, Circle, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import DataSyncModal from "@/components/admin/DataSyncModal";

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

const EmployeeRow = ({ employee, onClick }: { employee: Employee, onClick: () => void }) => {
  const deptColor = getDepartmentColor(employee.department);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      onClick={onClick}
      className="border-b border-transparent transition-all duration-300 relative cursor-pointer"
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
          employee.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
          employee.status === 'Inactive' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
          employee.status === 'LOA' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.1)]' :
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {employee.status}
        </span>
      </td>
      <td className="py-4 px-3 tracking-wider font-mono transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.85) }}>{employee.badge_number}</td>
      <td className="py-4 px-3 font-medium transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.85) }}>{employee.rank || "—"}</td>
      <td className="py-4 px-3 font-bold tracking-wider transition-all duration-300" style={{ color: deptColor, textShadow: isHovered ? `0 0 10px ${hexToRgba(deptColor, 0.5)}` : 'none' }}>{employee.department}</td>
      <td className="py-4 px-3 text-sm transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.7) }}>{employee.discord_tag || "—"}</td>
    </tr>
  );
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [allStrikes, setAllStrikes] = useState<any[]>([]);
  const [activeDepartment, setActiveDepartment] = useState("All");
  const departmentsList = ["All", "SASP", "LSPD", "BCSO", "SAPR", "SASP Academy"];
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ 
    name: "", 
    badge_number: "", 
    role: "Patrol Officer", 
    department: "SASP",
    discord_tag: ""
  });

  useEffect(() => {
    fetchEmployees();
    fetchStrikes();
    checkAdminStatus();
  }, []);

  async function fetchStrikes() {
    const { data } = await supabase.from('strikes').select('name, status, action_type, strike_level');
    if (data) setAllStrikes(data);
  }

  // SECURITY CHECK: Verify if the logged-in user is High Command
  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data, error } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    if (!error && data?.is_admin) {
      setIsAdmin(true);
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
        const deptDiff = getDeptIndex(a.department) - getDeptIndex(b.department);
        if (deptDiff !== 0) return deptDiff;
        
        const rankDiff = getRankIndex(a.rank) - getRankIndex(b.rank);
        if (rankDiff !== 0) return rankDiff;
        
        return (a.badge_number || "").localeCompare(b.badge_number || "");
      });
      setEmployees(sorted);
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isDuplicate = employees.some(
      emp => emp.name.toLowerCase() === newEmployee.name.toLowerCase() || 
             emp.badge_number === newEmployee.badge_number
    );

    if (isDuplicate) {
      alert(`An officer with the name "${newEmployee.name}" or callsign "${newEmployee.badge_number}" already exists!`);
      return;
    }

    const isAdmin = newEmployee.role === 'admin';
    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...newEmployee, status: 'Active', is_admin: isAdmin }])
      .select();

    if (error) {
      console.error("Error adding employee:", error);
      alert("Failed to onboard recruit: " + error.message);
    } else if (data) {
      setEmployees([...employees, data[0]]);
      setIsAdding(false);
      setNewEmployee({ name: "", badge_number: "", role: "Patrol Officer", department: "SASP", discord_tag: "" });
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

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg">
              PERSONNEL <span className="font-bold text-brand">DIRECTORY</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Manage and view personnel rosters, department allocations, and statuses.
            </p>
          </div>
          
          <div className="pb-1 flex items-center gap-3">
            {isAdmin && (
              <>
                <button 
                  onClick={() => setIsSyncModalOpen(true)}
                  className="bg-brand/10 backdrop-blur-md text-brand px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-brand/20 transition-all flex items-center gap-2 border border-brand/30"
                >
                  <Database className="w-4 h-4" /> Master Import
                </button>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-3 rounded-lg font-medium text-sm font-sans hover:bg-slate-800 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-2 border border-slate-700 hover:border-emerald-500/50 group"
                >
                  {isAdding ? <X className="w-4 h-4 text-rose-500" /> : <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />}
                  {isAdding ? "Cancel" : "Onboard Recruit"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Only render the form if they are an Admin AND clicked the button */}
      {isAdmin && isAdding && (
        <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-emerald-400">Onboard New Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Alex Hawk" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Callsign</label>
                <input required type="text" value={newEmployee.badge_number} onChange={e => setNewEmployee({...newEmployee, badge_number: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 710" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Discord ID</label>
                <input type="text" value={newEmployee.discord_tag} onChange={e => setNewEmployee({...newEmployee, discord_tag: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Optional Discord ID..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Role / Rank</label>
                <input required type="text" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Patrol Officer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Department</label>
                <select value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="SASP">SASP</option>
                  <option value="LSPD">LSPD</option>
                  <option value="BCSO">BCSO</option>
                  <option value="SAPR">SAPR</option>
                </select>
              </div>
              <button type="submit" className="w-full lg:col-span-5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-md font-medium transition-colors border border-emerald-500/20 mt-2">
                Save Official Record
              </button>
            </form>
          </CardContent>
        </Card>
      )}

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
        <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Personnel</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{departmentEmployees.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Duty</CardTitle>
            <Shield className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {departmentEmployees.filter((e) => e.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">On LOA</CardTitle>
            <CalendarOff className="w-4 h-4 text-fuchsia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {departmentEmployees.filter((e) => e.status === "LOA").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Inactive</CardTitle>
            <UserMinus className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {departmentEmployees.filter((e) => e.status === "Inactive").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 shadow-xl overflow-hidden">
        <CardHeader>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent border-t border-slate-800/60">
                {filteredEmployees.map((employee) => (
                  <EmployeeRow 
                    key={employee.id} 
                    employee={employee} 
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity perspective-1000"
          onClick={() => setSelectedEmployee(null)}
        >
          <div 
            className="animate-toss relative w-full max-w-md h-[550px] cursor-pointer group"
            onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          >
            <div className={`w-full h-full relative transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* FRONT OF CARD */}
              <div 
                className="absolute inset-0 w-full h-full p-6 rounded-2xl shadow-2xl bg-slate-950 border border-slate-800 flex flex-col relative overflow-hidden backface-hidden group"
                style={{
                  boxShadow: `0 25px 50px -12px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.25)}, inset 0 0 20px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.1)}`
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: getDepartmentColor(selectedEmployee.department) }} />
                
                {/* Background Logo */}
                <div 
                  className="absolute inset-0 z-0 opacity-10 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-110 group-hover:scale-100 transition-transform duration-700"
                  style={{
                    backgroundImage: `url(${(() => {
                      const dept = selectedEmployee.department || '';
                      if (dept.includes('BCSO')) return '/logos/bcso.png';
                      if (dept.includes('LSPD')) return '/logos/lspd.png';
                      if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                      if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                      return '/logos/sasp.png';
                    })()})`,
                    backgroundSize: '80%'
                  }}
                />
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedEmployee(null); }} 
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 z-10 relative mt-6 flex-1 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 bg-slate-900/80 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--brand-main),0.2)]"
                    style={{
                      borderColor: getDepartmentColor(selectedEmployee.department),
                      color: getDepartmentColor(selectedEmployee.department)
                    }}
                  >
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-wide leading-tight">{selectedEmployee.name}</h2>
                    <p className="font-mono mt-1 text-sm tracking-widest" style={{ color: getDepartmentColor(selectedEmployee.department) }}>{selectedEmployee.badge_number}</p>
                  </div>
                  <div className="w-full h-px bg-slate-800/60 my-2" />
                  
                  <div className="grid grid-cols-2 gap-y-6 gap-x-6 w-full text-left mt-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Department</p>
                      <p className="text-sm font-bold tracking-wide truncate" style={{ color: getDepartmentColor(selectedEmployee.department) }}>{selectedEmployee.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Rank</p>
                      <p className="text-sm font-medium text-slate-200 truncate">{selectedEmployee.rank || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                      <p className={`text-sm font-medium truncate ${selectedEmployee.status === 'Active' ? 'text-emerald-400' : selectedEmployee.status === 'Inactive' ? 'text-rose-400' : 'text-fuchsia-400'}`}>{selectedEmployee.status || "Active"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Role</p>
                      <p className="text-sm font-medium text-slate-300 truncate">{selectedEmployee.role || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800/60 relative z-10">
                  <p className="text-[9px] tracking-[0.2em] text-slate-500 uppercase text-center group-hover:opacity-0 transition-opacity duration-300">
                    San Andreas State Property
                  </p>
                  <p 
                    className="absolute inset-x-0 bottom-4 text-[10px] tracking-widest uppercase font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ color: getDepartmentColor(selectedEmployee.department) }}
                  >
                    Click anywhere to flip
                  </p>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div 
                className="absolute inset-0 w-full h-full p-6 rounded-2xl shadow-2xl bg-slate-950 border border-slate-800 overflow-hidden backface-hidden rotate-y-180 flex flex-col group"
                style={{
                  boxShadow: `0 25px 50px -12px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.25)}, inset 0 0 20px ${hexToRgba(getDepartmentColor(selectedEmployee.department), 0.1)}`
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: getDepartmentColor(selectedEmployee.department) }} />
                
                {/* Background Logo */}
                <div 
                  className="absolute inset-0 z-0 opacity-10 bg-center bg-no-repeat pointer-events-none mix-blend-luminosity scale-100 group-hover:scale-110 transition-transform duration-700"
                  style={{
                    backgroundImage: `url(${(() => {
                      const dept = selectedEmployee.department || '';
                      if (dept.includes('BCSO')) return '/logos/bcso.png';
                      if (dept.includes('LSPD')) return '/logos/lspd.png';
                      if (dept.includes('SAPR')) return '/logos/sapr.jpg';
                      if (dept.includes('Academy') || dept.includes('PAU')) return '/logos/pau.jpg';
                      return '/logos/sasp.png';
                    })()})`,
                    backgroundSize: '80%'
                  }}
                />
                
                <div className="flex justify-between items-center mb-6 relative z-10 pt-2 transform group-hover:scale-105 transition-transform duration-700 ease-out origin-top">
                  <div>
                    <h3 className="text-xl font-bold tracking-wide text-white leading-tight">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-[10px] font-mono tracking-widest mt-1" style={{ color: getDepartmentColor(selectedEmployee.department) }}>DOSSIER DETAILS</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedEmployee(null); }} 
                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 animated-scrollbar relative z-10 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/50 backdrop-blur-sm p-3.5 rounded-lg border border-slate-800/50">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Citizen ID</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.citizen_id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Phone Number</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Sub Dept.</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.sub_department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Titles</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.titles || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-900/50 backdrop-blur-sm p-3.5 rounded-lg border border-slate-800/50">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Join Date</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.department_join_date || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.duration_in_department || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Last Promoted</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.last_promotion_date || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Days Since</p>
                      <p className="text-xs font-medium text-slate-200">{selectedEmployee.days_since_last_promoted !== null && selectedEmployee.days_since_last_promoted !== undefined ? selectedEmployee.days_since_last_promoted : '—'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 backdrop-blur-sm p-3.5 rounded-lg border border-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Certifications</p>
                    <div className="grid grid-cols-3 gap-y-2 gap-x-2">
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
                        return (
                          <div key={cert.key} className="flex items-center gap-1.5">
                            {isActive ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-700" />
                            )}
                            <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                              {cert.label}
                            </span>
                          </div>
                        )
                      })}
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