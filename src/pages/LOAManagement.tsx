import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, UserCheck } from "lucide-react";

export default function LOAManagement() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Leave of Absence (LOA)</h1>
          <p className="text-sm text-slate-400">Track active and upcoming temporary leaves for active roster members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Active LOA Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <p className="font-medium text-white">Sarah Connor (Callsign: L-14)</p>
                  <p className="text-xs text-slate-500">Reason: Personal training / schedule conflict</p>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md">On Leave</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}