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
  FileText,
  ClipboardList,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/hooks/useAuth';
import { getDepartmentColor, } from '@/styles/theme';

const NavButton = ({ item, isActive, isCollapsed, deptColor }: any) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.path as string}
      className={cn(
        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        isCollapsed ? "justify-center p-3 my-1" : "gap-3 px-3 py-2.5 my-0.5",
        isActive
          ? "bg-primary/10 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full shadow-[0_0_10px_currentColor]"
          style={{ backgroundColor: deptColor, color: deptColor }}
        />
      )}

      <Icon
        strokeWidth={isActive ? 2 : 1.5}
        className={cn(
          "transition-all duration-300 shrink-0",
          isCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
          isActive ? "opacity-100 scale-105" : "opacity-70 group-hover:opacity-100"
        )}
        style={{ color: isActive ? deptColor : 'inherit' }}
      />

      {!isCollapsed && (
        <span className="truncate tracking-wide">{item.name}</span>
      )}

      {isCollapsed && (
        <div className="sidebar-tooltip absolute left-[80px] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-md text-white text-xs font-medium whitespace-nowrap shadow-2xl z-50">
          {item.name}
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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Personnel Directory', path: '/directory', icon: Users },
    { name: 'Announcements', path: '/communications', icon: Megaphone },
    { name: 'Meetings', path: '/meetings', icon: MapPin },
    { name: 'LOA Requests', path: '/loa', icon: CalendarOff },
    { name: 'Disciplinary', path: '/strikes', icon: ShieldAlert },
    { name: 'SOI Applications', path: '/soi-applications', icon: Shield },
    { name: 'HR Requests', path: '/hr-requests', icon: FileText },
    { name: 'Sub-Department', path: '/sub-department', icon: Building },
    { name: 'Documents', path: '/documents', icon: BookOpen },
    ...(profile?.is_admin ? [
      { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList }
    ] : []),
    ...(profile?.is_admin || profile?.role === 'High Command' || profile?.role === 'HR' ? [
      { name: 'Command Center', path: '/admin', icon: Database }
    ] : [])
  ];

  return (
    <div className={cn(
      "h-[calc(100vh-2rem)] my-4 ml-4 glass-panel rounded-2xl flex flex-col shadow-2xl z-50 relative transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] animate-slide-up",
      isCollapsed ? "w-[80px]" : "w-[260px]"
    )}>
      <style>{`
        .sidebar-tooltip {
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
          transform: translateX(-5px);
        }
        .group:hover .sidebar-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      {/* Sidebar Header & Toggle */}
      <div className={cn("h-16 flex items-center border-b border-white/5 bg-transparent transition-all duration-300", isCollapsed ? "justify-center px-0" : "px-5 justify-between")}>
        {!isCollapsed && (
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span style={{ color: deptColor }}>
              {profile?.department || 'SASP'}
            </span>
          </h2>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-300 focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 relative no-scrollbar px-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path as string);
          return (
            <NavButton
              key={item.path}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              deptColor={deptColor}
            />
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-3 border-t border-white/5 mt-auto">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-all duration-300 cursor-pointer group relative",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700/50 shadow-inner overflow-hidden shrink-0 group-hover:border-slate-500 transition-colors">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-300" style={{ color: deptColor }}>
                {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'HR'}
              </span>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                {profile ? profile.name : "Loading..."}
              </span>
              <span className="text-xs text-slate-500 truncate mt-0.5">
                {profile ? profile.role : "Connecting..."}
              </span>
            </div>
          )}

          {isCollapsed && (
            <div className="sidebar-tooltip absolute left-[80px] bottom-0 px-3 py-2 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-md text-white text-xs font-medium whitespace-nowrap shadow-2xl z-50 flex flex-col">
              <span>{profile?.name}</span>
              <span className="text-slate-400 mt-0.5">{profile?.role}</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};