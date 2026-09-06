import { AlertTriangle, Shield, Star, ShieldAlert } from 'lucide-react';

export const UniformGuideComponent = () => {
  const ranks = [
    {
      title: 'Cadet',
      color: '#64748b', // slate-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center"></div>
      )
    },
    {
      title: 'Officer',
      color: '#3b82f6', // blue-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center">
          <svg width="24" height="12" viewBox="0 0 32 16" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 14L16 4L30 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Senior Officer',
      color: '#0ea5e9', // sky-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center">
          <svg width="24" height="18" viewBox="0 0 32 24" className="fill-none stroke-[#c4a64d] stroke-[2.5]">
            <path d="M4 10C4 10 16 4 28 10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 14C4 14 16 22 28 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Corporal',
      color: '#10b981', // emerald-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex flex-col items-center justify-center gap-[2px]">
          <svg width="20" height="6" viewBox="0 0 24 8" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 7L12 2L22 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="20" height="6" viewBox="0 0 24 8" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 7L12 2L22 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Sergeant',
      color: '#f59e0b', // amber-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex flex-col items-center justify-center gap-[2px]">
          <svg width="18" height="4" viewBox="0 0 24 6" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 5L12 1L22 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="18" height="4" viewBox="0 0 24 6" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 5L12 1L22 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="18" height="4" viewBox="0 0 24 6" className="fill-none stroke-[#c4a64d] stroke-[3]">
            <path d="M2 5L12 1L22 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Lieutenant',
      color: '#f97316', // orange-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center gap-1.5">
          <div className="w-1 h-3.5 bg-[#c4a64d] shadow-sm"></div>
        </div>
      )
    },
    {
      title: 'Captain',
      color: '#ef4444', // red-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center gap-1">
          <div className="w-1 h-3.5 bg-[#c4a64d] shadow-sm"></div>
          <div className="w-1 h-3.5 bg-[#c4a64d] shadow-sm"></div>
        </div>
      )
    },
    {
      title: 'Assistant Chief',
      color: '#d946ef', // fuchsia-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center gap-0.5 text-[#c4a64d]">
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2.5 h-2.5 fill-current" />
        </div>
      )
    },
    {
      title: 'Chief',
      color: '#8b5cf6', // violet-500
      badge: (
        <div className="w-12 h-8 bg-slate-800/80 rounded border border-white/10 flex items-center justify-center gap-0.5 text-[#c4a64d]">
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2.5 h-2.5 fill-current" />
          <Star className="w-2.5 h-2.5 fill-current" />
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm mt-2 relative">
      
      {/* Legend and Colorways */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-[#3b82f6] font-extrabold tracking-widest uppercase text-xs mb-4">
          <div className="w-8 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent"></div>
          Legend and Colorways
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranks.map((rank, i) => (
            <div 
              key={i} 
              className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_15px_-5px_rgba(0,0,0,0.5)] group cursor-default" 
              style={{ '--hover-color': rank.color, animationDelay: `${i * 100}ms` } as React.CSSProperties}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${rank.color}, transparent)` }}></div>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}` }}></div>
              
              <div className="relative z-10 shrink-0">
                {rank.badge}
              </div>
              <div className="font-black text-[15px] tracking-wide drop-shadow-sm group-hover:drop-shadow-[0_0_8px_currentColor] text-slate-200 group-hover:text-white transition-colors">
                {rank.title}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-slate-400 italic font-medium text-xs ml-1">*All chevrons come in Silver variants too.</p>
      </div>

      {/* Rank Badge Requirement */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)] p-6 md:p-8 space-y-6 mt-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#eab308]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="flex items-center gap-2 text-[#eab308] font-extrabold tracking-widest uppercase text-xs relative z-10">
          <div className="w-8 h-[1px] bg-gradient-to-r from-[#eab308] to-transparent"></div>
          RANK BADGE REQUIREMENT
        </div>

        <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-4 flex gap-4 items-start relative z-10">
          <AlertTriangle className="w-6 h-6 text-[#eab308] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[#eab308] font-bold text-sm uppercase tracking-wide">RANK BADGES ARE COMPULSORY*</div>
            <div className="text-slate-300 font-medium leading-relaxed">Chevrons in uniform must be according to your rank and of your respective department:</div>
            
            <div className="flex gap-6 mt-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded border border-white/20 shadow-sm">
                <Shield className="w-4 h-4 text-white" />
                <span className="font-bold text-white tracking-wide">LSPD: White</span>
              </div>
              <div className="flex items-center gap-2 bg-[#eab308]/10 px-3 py-1.5 rounded border border-[#eab308]/30 shadow-sm">
                <ShieldAlert className="w-4 h-4 text-[#eab308]" />
                <span className="font-bold text-[#eab308] tracking-wide">BCSO: Yellow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
