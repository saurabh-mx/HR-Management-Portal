import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bell, Send } from "lucide-react";

export default function CommunicationsFeed() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Communications Feed</h1>
          <p className="text-sm text-slate-400">Department-wide announcements, direct directives, and server alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> High Command Broadcast
            </CardTitle>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-white font-medium">Mandatory Briefing at Sandy Shores PD</p>
            <p className="text-sm text-slate-400">All active duty personnel must report to the main briefing room by 20:00 hours for protocol updates regarding recent Soulcity operations.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" /> General Dispatch Log
            </CardTitle>
            <span className="text-xs text-slate-500">Yesterday</span>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-white font-medium">Shift Rotation Update</p>
            <p className="text-sm text-slate-400">Night patrol units have been reassigned to sector 4. Ensure check-ins are logged correctly via the radio terminal.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}