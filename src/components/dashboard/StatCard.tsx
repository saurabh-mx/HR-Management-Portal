import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  hoverContent?: React.ReactNode;
}

export const StatCard = ({ title, value, description, icon: Icon, trend, hoverContent }: StatCardProps) => {
  return (
    <div className="relative group h-full min-h-[150px] [perspective:1000px]">
      <div className={cn(
        "relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-xl",
        hoverContent && "group-hover:[transform:rotateY(180deg)]"
      )}>
        
        {/* FRONT FACE */}
        <Card className="relative w-full h-full [backface-visibility:hidden] bg-slate-950/80 backdrop-blur-md border-yellow-900/30 text-slate-200 flex flex-col overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/0 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-slate-400 group-hover:text-yellow-500/90 transition-colors duration-300">
              {title}
            </CardTitle>
            <Icon className="w-5 h-5 text-yellow-600/50 group-hover:text-yellow-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
          </CardHeader>
          <CardContent className="relative z-10 flex-1">
            <div className="text-3xl font-light text-slate-100 tracking-wider group-hover:text-white transition-colors duration-300">{value}</div>
            {description && (
              <p className={cn(
                "text-xs mt-1 transition-all duration-300",
                trend === "up" ? "text-emerald-400" : 
                trend === "down" ? "text-red-400" : "text-slate-500 group-hover:text-slate-400"
              )}>
                {description}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* BACK FACE */}
        {hoverContent && (
          <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900/70 backdrop-blur-xl border border-yellow-500/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] text-slate-200 overflow-hidden flex flex-col p-4 rounded-xl">
            {/* Glossy top highlight */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl"></div>
            
            <div className="relative z-10 h-full w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">
              {hoverContent}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};