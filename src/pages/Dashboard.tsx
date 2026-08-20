import { StatCard } from "@/components/dashboard/StatCard";
import { Users, ShieldAlert, CalendarOff, TrendingUp } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Command Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back. Here is the current department overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Personnel" 
          value="142" 
          icon={Users} 
          description="+4 since last month"
          trend="up"
        />
        <StatCard 
          title="Active Strikes" 
          value="12" 
          icon={ShieldAlert} 
          description="3 require HR review"
          trend="down"
        />
        <StatCard 
          title="Personnel on LOA" 
          value="8" 
          icon={CalendarOff} 
          description="2 returning this week"
          trend="neutral"
        />
        <StatCard 
          title="Pending Rank Changes" 
          value="5" 
          icon={TrendingUp} 
          description="Awaiting Command approval"
          trend="neutral"
        />
      </div>

      {/* Placeholder for Recent Activity Feed */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-96 rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center">
          <p className="text-slate-500">Recent Activity Feed (Coming Soon)</p>
        </div>
        <div className="col-span-3 h-96 rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center">
          <p className="text-slate-500">Important Bulletins (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
};