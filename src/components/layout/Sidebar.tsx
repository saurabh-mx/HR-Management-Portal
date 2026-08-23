import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  MapPin, 
  CalendarOff, 
  ShieldAlert, 
  Award, 
  FileText,
  ClipboardList,
  Database,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const getDepartmentColor = (dept: string) => {
  switch (dept) {
    case "LSPD": return "#3b82f6";
    case "BCSO": return "#f59e0b";
    case "SAPR": return "#10b981";
    case "SASP Academy": return "#94a3b8";
    default: return "#22d3ee";
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const NavButton = ({ item, isActive, isCollapsed, index, deptColor }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const isHighlighted = isActive || isHovered;
  const Icon = item.icon;

  return (
    <Link
      to={item.path as string}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center rounded-2xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-300 ease-out overflow-visible",
        isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3.5"
      )}
      style={{ 
        animationDelay: `${index * 0.05}s`,
        backgroundColor: isActive ? hexToRgba(deptColor, 0.15) : (isHovered ? hexToRgba(deptColor, 0.05) : 'transparent'),
        backdropFilter: isHighlighted ? 'blur(8px)' : 'none',
        boxShadow: isActive
          ? `inset 4px 0 0 0 ${deptColor}, inset 0 0 20px ${hexToRgba(deptColor, 0.15)}, 0 10px 30px -10px rgba(0,0,0,0.5)`
          : isHovered
          ? `inset 4px 0 0 0 ${deptColor}, inset 0 0 10px ${hexToRgba(deptColor, 0.05)}`
          : `inset 2px 0 0 0 transparent`,
        transform: isHovered && !isActive ? 'scale(1.02) translateY(-1px)' : 'scale(1) translateY(0)',
        zIndex: isHighlighted ? 20 : 1,
        color: isHighlighted ? deptColor : '#94a3b8'
      }}
    >
      <div 
        className="relative z-10 flex items-center justify-center p-1.5 rounded-lg shadow-inner transition-colors"
        style={{
          backgroundColor: isHighlighted ? hexToRgba(deptColor, 0.2) : 'rgba(15, 23, 42, 0.5)',
          color: isHighlighted ? deptColor : '#64748b'
        }}
      >
        <Icon className={cn(
          "transition-all duration-300 drop-shadow-lg", 
          isCollapsed ? "w-5 h-5" : "w-4 h-4",
          isActive ? "scale-110 animate-pulse" : ""
        )} />
      </div>
      
      {!isCollapsed && (
        <span 
          className="relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 origin-left"
          style={{
            textShadow: isHighlighted ? `0 0 15px ${hexToRgba(deptColor, 0.8)}` : 'none',
            transform: isHovered && !isActive ? 'scale(1.05) translateX(2px)' : 'scale(1) translateX(0)',
          }}
        >
          {item.name}
        </span>
      )}

      {isCollapsed && (
        <div className="sidebar-tooltip absolute left-[88px] top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold whitespace-nowrap shadow-xl z-50">
          {item.name}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
        </div>
      )}
    </Link>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const deptColor = getDepartmentColor(profile?.department || '');

  const isAdminOrCommand = profile?.is_admin || ['High Command', 'HR'].includes(profile?.role || '');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Personnel Directory', path: '/directory', icon: Users },
    { name: 'Announcements', path: '/communications', icon: Megaphone },
    { name: 'Meetings', path: '/meetings', icon: MapPin },
    { name: 'LOA Requests', path: '/loa', icon: CalendarOff },
    { name: 'Disciplinary', path: '/strikes', icon: ShieldAlert },
    ...(isAdminOrCommand ? [{ name: 'Rank Management', path: '/promotions', icon: Award }] : []),
    { name: 'HR Requests', path: '/hr-requests', icon: FileText },
    { name: 'Documents', path: '/documents', icon: BookOpen },
    ...(profile?.is_admin ? [
      { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
      { name: 'Command Center', path: '/admin', icon: Database }
    ] : [])
  ];

  return (
    <div className={cn(
      "h-full bg-[#0a0f18]/95 backdrop-blur-3xl border-r border-slate-800/80 flex flex-col shadow-[15px_0_40px_rgba(0,0,0,0.6)] z-50 relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)",
      isCollapsed ? "w-[88px]" : "w-[280px]"
    )}>
      {/* Custom Animation Styles */}
      <style>{`
        @keyframes popInOut {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .sidebar-tooltip {
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
          transform: translateX(-10px);
        }
        .group:hover .sidebar-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      
      {/* Sidebar Header & Toggle */}
      <div className={cn("h-20 flex items-center border-b border-slate-800/60 bg-transparent relative transition-all duration-300", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
        {!isCollapsed && (
          <h2 className="text-lg font-extrabold tracking-widest uppercase flex items-center gap-2 drop-shadow-md overflow-hidden whitespace-nowrap">
            <span 
              className="inline-block"
              style={{ 
                animation: 'popInOut 2.5s ease-in-out infinite',
                color: deptColor,
                textShadow: `0 0 15px ${hexToRgba(deptColor, 0.8)}`
              }}
            >
              {profile?.department || 'SASP'}
            </span>
          </h2>
        )}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-2 rounded-lg text-slate-400 hover:bg-slate-800/80 transition-all duration-300 z-50 focus:outline-none",
            isCollapsed && "mt-1"
          )}
          style={{ color: isCollapsed ? '#94a3b8' : deptColor }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5 hover:text-white" /> : <PanelLeftClose className="w-5 h-5 hover:text-white" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 overflow-y-auto py-6 space-y-2 relative no-scrollbar", isCollapsed ? "px-3" : "px-4")}>
        {navItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path as string);
          return (
            <NavButton 
              key={item.path}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              index={index}
              deptColor={deptColor}
            />
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <Link to="/profile" className={cn("block border-t border-slate-800/60 bg-[#0a0f18] hover:bg-slate-900 transition-all duration-300 group cursor-pointer relative", isCollapsed ? "p-3 flex justify-center" : "p-5")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-4 px-2")}>
          <div className={cn(
            "rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-brand font-bold text-sm border border-slate-700/50 shadow-lg group-hover:shadow-[0_0_15px_rgba(var(--brand-main),0.4)] transition-all duration-300 group-hover:scale-105 overflow-hidden shrink-0",
            isCollapsed ? "w-10 h-10" : "w-11 h-11"
          )}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'HR'}</span>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden ml-1 whitespace-nowrap">
              <span className="text-sm font-extrabold tracking-widest text-slate-200 uppercase truncate group-hover:text-white transition-colors">
                {profile ? profile.name : "Loading..."}
              </span>
              <span className="text-[10px] text-brand/80 tracking-widest uppercase truncate mt-0.5">
                {profile ? profile.role : "Connecting..."}
              </span>
            </div>
          )}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="sidebar-tooltip absolute left-[88px] top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 flex flex-col">
              <span className="text-slate-200 uppercase">{profile?.name}</span>
              <span className="text-brand/80 uppercase text-[10px] mt-1">{profile?.role}</span>
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};