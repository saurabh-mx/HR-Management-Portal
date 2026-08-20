import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, UserCheck, Briefcase } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "Active" | "On Leave" | "Off Duty";
  callsign: string;
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Alex Hawk", role: "Captain / HR", department: "Law Enforcement", status: "Active", callsign: "L-01" },
  { id: "2", name: "Jai Singh", role: "Senior Associate", department: "Operations", status: "Active", callsign: "OPS-40" },
  { id: "3", name: "Sarah Connor", role: "Officer", department: "Law Enforcement", status: "On Leave", callsign: "L-14" },
  { id: "4", name: "Marcus Vance", role: "Supervisor", department: "Management", status: "Active", callsign: "M-02" },
];

export default function EmployeeDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees] = useState<Employee[]>(initialEmployees);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employee Directory</h1>
          <p className="text-sm text-slate-400">Manage and view personnel rosters, department allocations, and statuses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Personnel</CardTitle>
            <Shield className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{employees.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Duty</CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {employees.filter((e) => e.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Departments</CardTitle>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Personnel Roster</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
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
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Callsign</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{emp.name}</td>
                    <td className="py-3 text-slate-400">{emp.callsign}</td>
                    <td className="py-3 text-slate-300">{emp.role}</td>
                    <td className="py-3 text-slate-300">{emp.department}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          emp.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
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