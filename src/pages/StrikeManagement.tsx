import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, UserX, } from "lucide-react";

interface Strike {
  id: string;
  name: string;
  callsign: string;
  reason: string;
  severity: "Warning" | "Strike 1" | "Strike 2" | "Final Warning";
  date: string;
}

const initialStrikes: Strike[] = [
  { id: "1", name: "Sarah Connor", callsign: "L-14", reason: "Unexcused absence from mandatory patrol", severity: "Strike 1", date: "2026-06-10" },
  { id: "2", name: "Marcus Vance", callsign: "M-02", reason: "Protocol breach during high-risk transport", severity: "Warning", date: "2026-06-15" },
];

export default function StrikeManagement() {
  const [strikes] = useState<Strike[]>(initialStrikes);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Strike Management</h1>
          <p className="text-sm text-slate-400">Monitor active disciplinary actions, warnings, and strikes for personnel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Strikes</CardTitle>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{strikes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Reviews</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Dismissed / Cleared</CardTitle>
            <UserX className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">4</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Disciplinary Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Personnel</th>
                  <th className="pb-3 font-medium">Callsign</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Date Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {strikes.map((strike) => (
                  <tr key={strike.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{strike.name}</td>
                    <td className="py-3 text-slate-400">{strike.callsign}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border-rose-500/20">
                        {strike.severity}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{strike.reason}</td>
                    <td className="py-3 text-slate-400">{strike.date}</td>
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