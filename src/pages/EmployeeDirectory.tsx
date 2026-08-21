import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Briefcase, Search, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
  badge_number: string;
  role: string;
  department: string;
  email: string;
  status: string;
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ 
    name: "", 
    badge_number: "", 
    role: "Patrol Officer", 
    department: "SASP",
    email: ""
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
      .select('*')
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching employees:", error);
    else if (data) setEmployees(data);
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = ['High Command', 'Command', 'HR'].includes(newEmployee.role);
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
      setNewEmployee({ name: "", badge_number: "", role: "Patrol Officer", department: "SASP", email: "" });
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.badge_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employee Directory</h1>
          <p className="text-sm text-slate-400">Manage and view personnel rosters, department allocations, and statuses.</p>
        </div>
        
        {/* Only render this button if the user is an Admin */}
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancel" : "Onboard Recruit"}
          </button>
        )}
      </div>

      {/* Only render the form if they are an Admin AND clicked the button */}
      {isAdmin && isAdding && (
        <Card className="bg-slate-900 border-emerald-900/50 text-slate-200">
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
                <label className="text-xs font-medium text-slate-400">Linked Email</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Optional portal login..." />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Personnel</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{employees.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Duty</CardTitle>
            <Shield className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {employees.filter((e) => e.status !== "Inactive").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Departments</CardTitle>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Set(employees.map(e => e.department)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Active Roster</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, badge_number, or email..."
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
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Callsign</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Portal Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{employee.name}</td>
                    <td className="py-3 text-slate-400">{employee.badge_number}</td>
                    <td className="py-3 text-slate-300">{employee.role}</td>
                    <td className="py-3 text-slate-400">{employee.department}</td>
                    <td className="py-3 text-slate-500">{employee.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}