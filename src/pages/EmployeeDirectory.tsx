import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Search, Plus, X, UserMinus, CalendarOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
  badge_number: string;
  role: string;
  department: string;
  discord_tag?: string;
  status: string;
  rank?: string;
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

const EmployeeRow = ({ employee }: { employee: Employee }) => {
  const deptColor = getDepartmentColor(employee.department);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
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
      <td className="py-4 px-3 font-medium transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.85) }}>{employee.role === 'admin' ? 'High Command' : employee.role}</td>
      <td className="py-4 px-3 font-bold tracking-wider transition-all duration-300" style={{ color: deptColor, textShadow: isHovered ? `0 0 10px ${hexToRgba(deptColor, 0.5)}` : 'none' }}>{employee.department}</td>
      <td className="py-4 px-3 text-sm transition-colors duration-300" style={{ color: isHovered ? deptColor : hexToRgba(deptColor, 0.7) }}>{employee.discord_tag || "—"}</td>
    </tr>
  );
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeDepartment, setActiveDepartment] = useState("All");
  const departmentsList = ["All", "SASP", "LSPD", "BCSO", "SAPR", "SASP Academy"];
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ 
    name: "", 
    badge_number: "", 
    role: "Patrol Officer", 
    department: "SASP",
    discord_tag: ""
  });

  useEffect(() => {
    fetchEmployees();
    checkAdminStatus();
  }, []);

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

    const isAdmin = ['admin', 'High Command', 'Command', 'HR'].includes(newEmployee.role);
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
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.badge_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.discord_tag && emp.discord_tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
          
          <div className="pb-1">
            {isAdmin && (
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-3 rounded-lg font-medium text-sm font-sans hover:bg-slate-800 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-2 border border-slate-700 hover:border-emerald-500/50 group"
              >
                {isAdding ? <X className="w-4 h-4 text-rose-500" /> : <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />}
                {isAdding ? "Cancel" : "Onboard Recruit"}
              </button>
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
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, callsign, or Discord ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
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
                  <th className="pb-3 px-3 font-medium">Role</th>
                  <th className="pb-3 px-3 font-medium">Department</th>
                  <th className="pb-3 px-3 font-medium">Discord ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent border-t border-slate-800/60">
                {filteredEmployees.map((employee) => (
                  <EmployeeRow key={employee.id} employee={employee} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}