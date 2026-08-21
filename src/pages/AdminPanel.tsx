import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, UserPlus, Users, Trash2, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  name: string;
  callsign: string;
  rank: string;
  email: string;
  is_admin: boolean;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    callsign: "",
    rank: "Cadet",
    email: ""
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // SECURITY CHECK: Verify High Command clearance
  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (data?.is_admin) {
      setIsAdmin(true);
      fetchEmployees(); // Only fetch roster if they are authorized
    } else {
      setIsAdmin(false);
    }
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('rank', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching roster:", error);
    else if (data) setEmployees(data);
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...newEmployee, is_admin: false }])
      .select();

    if (error) alert("Failed to add officer: " + error.message);
    else if (data) {
      setEmployees([...employees, data[0]]);
      setNewEmployee({ name: "", callsign: "", rank: "Cadet", email: "" });
    }
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('employees')
      .update({ is_admin: !currentStatus })
      .eq('id', id);

    if (error) alert("Failed to update clearance: " + error.message);
    else {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, is_admin: !currentStatus } : emp));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely remove this officer from the database?")) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(employees.filter(emp => emp.id !== id));
  };

  // 🚨 RESTRICTED AREA SCREEN FOR NON-ADMINS 🚨
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <ShieldAlert className="w-32 h-32 text-rose-600 animate-pulse drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
        <div>
          <h1 className="text-5xl font-black text-white tracking-widest uppercase mb-2">Restricted Area</h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            You do not possess the required High Command security clearance to access this terminal. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    );
  }

  // LOADING SCREEN WHILE CHECKING CLEARANCE
  if (isAdmin === null) {
    return <div className="p-6 text-slate-400 flex items-center gap-2"><Shield className="w-5 h-5 animate-spin" /> Verifying security clearance...</div>;
  }

  // ✅ AUTHORIZED HIGH COMMAND VIEW ✅
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          High Command Terminal
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage departmental roster, access control, and security clearances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD NEW OFFICER FORM */}
        <Card className="bg-slate-900 border-slate-800 text-slate-200 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-400" /> Onboard Recruit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Callsign</label>
                <input required type="text" value={newEmployee.callsign} onChange={e => setNewEmployee({...newEmployee, callsign: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. 104" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Portal Login Email</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Required for portal access" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Starting Rank</label>
                <input required type="text" value={newEmployee.rank} onChange={e => setNewEmployee({...newEmployee, rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. Cadet" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md font-medium transition-colors mt-2">
                Add to Database
              </button>
            </form>
          </CardContent>
        </Card>

        {/* ROSTER MANAGEMENT TABLE */}
        <Card className="bg-slate-900 border-slate-800 text-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" /> Database Roster & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Officer</th>
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Clearance</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-white">{emp.name} <span className="text-slate-500 font-normal">({emp.callsign})</span></td>
                      <td className="py-3 text-slate-300">{emp.rank}</td>
                      <td className="py-3 text-slate-500 text-xs">{emp.email || "No access"}</td>
                      <td className="py-3">
                        <button 
                          onClick={() => handleToggleAdmin(emp.id, emp.is_admin)}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border transition-colors ${
                            emp.is_admin ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {emp.is_admin ? "Command" : "Standard"}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1" title="Delete Officer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}