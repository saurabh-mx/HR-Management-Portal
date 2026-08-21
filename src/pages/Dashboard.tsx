import { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, ShieldAlert, CalendarOff, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    activeStrikes: 0,
    personnelOnLoa: 0,
    pendingRankChanges: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      // 1. Total Personnel
      const { count: personnelCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
        
      // 2. Active Strikes
      const { count: strikesCount } = await supabase
        .from('strikes')
        .select('*', { count: 'exact', head: true });

      // 3. Personnel on LOA (Only Approved leaves)
      const { count: loaCount } = await supabase
        .from('loa_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Approved');

      // 4. Pending Rank Changes
      const { count: rankCount } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending Review');

      setStats({
        totalPersonnel: personnelCount || 0,
        activeStrikes: strikesCount || 0,
        personnelOnLoa: loaCount || 0,
        pendingRankChanges: rankCount || 0,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-widest text-slate-200 uppercase drop-shadow-md">
            Command <span className="font-bold text-yellow-500">Dashboard</span>
          </h1>
          <div className="w-16 h-px bg-yellow-500 my-4 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
          <p className="text-slate-400 mt-2 font-light tracking-wide">Welcome back. Here is the current department overview.</p>
        </div>
        
        {/* Lumio Style Button extracted from Stitch */}
        <div className="pt-2">
          <button className="bg-black text-white px-5 py-2.5 rounded-[7px] font-medium text-[15px] font-sans hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 border border-slate-700/50">
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Personnel" 
          value={stats.totalPersonnel} 
          icon={Users} 
          description="Active roster count"
          trend="neutral"
        />
        <StatCard 
          title="Active Strikes" 
          value={stats.activeStrikes} 
          icon={ShieldAlert} 
          description="Issued disciplinary actions"
          trend="neutral"
        />
        <StatCard 
          title="Personnel on LOA" 
          value={stats.personnelOnLoa} 
          icon={CalendarOff} 
          description="Currently on leave"
          trend="neutral"
        />
        <StatCard 
          title="Pending Rank Changes" 
          value={stats.pendingRankChanges} 
          icon={TrendingUp} 
          description="Awaiting Command approval"
          trend="neutral"
        />
      </div>

      {/* Placeholder for Recent Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-96 rounded-xl border border-yellow-900/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-500/80 mb-4 border-b border-yellow-900/30 pb-2">Recent Activity Feed</h3>
          <div className="flex-1 flex items-center justify-center text-slate-500 font-light italic">
            (Coming Soon)
          </div>
        </div>
        <div className="col-span-3 h-96 rounded-xl border border-yellow-900/30 bg-slate-950/80 p-6 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle glow in corner */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-900/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-500/80 mb-4 border-b border-yellow-900/30 pb-2">Important Bulletins</h3>
          <div className="flex-1 flex items-center justify-center text-slate-500 font-light italic">
            (Coming Soon)
          </div>
        </div>
      </div>
    </div>
  );
};