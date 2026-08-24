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
        <Card className="relative w-full h-full [backface-visibility:hidden] bg-slate-950/80 backdrop-blur-md border-brand/30 text-slate-200 flex flex-col overflow-hidden [transform-style:preserve-3d]">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10 transition-transform duration-500 [transform:translateZ(0px)] group-hover:[transform:translateZ(40px)]">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-slate-400 group-hover:text-brand/90 transition-colors duration-300">
              {title}
            </CardTitle>
            <Icon className="w-5 h-5 text-brand/50 group-hover:text-brand group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
          </CardHeader>
          <CardContent className="relative z-10 flex-1 transition-transform duration-500 [transform:translateZ(0px)] group-hover:[transform:translateZ(50px)]">
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
          <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900/70 backdrop-blur-xl border border-brand/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] text-slate-200 overflow-hidden flex flex-col p-4 rounded-xl [transform-style:preserve-3d]">
            {/* Glossy top highlight */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl [transform:translateZ(10px)]"></div>
            
            <div className="relative z-10 h-full w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 [transform:translateZ(-20px)] group-hover:[transform:translateZ(50px)]">
              {hoverContent}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};