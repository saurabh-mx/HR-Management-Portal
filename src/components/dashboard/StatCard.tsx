import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export const StatCard = ({ title, value, description, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card className="bg-slate-950/80 backdrop-blur-md border-yellow-900/30 text-slate-200 shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:border-yellow-600/50 transition-colors group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-bold tracking-widest uppercase text-slate-400 group-hover:text-yellow-500/80 transition-colors">
          {title}
        </CardTitle>
        <Icon className="w-5 h-5 text-yellow-600/50 group-hover:text-yellow-500 transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-light text-slate-100 tracking-wider">{value}</div>
        {description && (
          <p className={cn(
            "text-xs mt-1",
            trend === "up" ? "text-emerald-400" : 
            trend === "down" ? "text-red-400" : "text-slate-500"
          )}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};