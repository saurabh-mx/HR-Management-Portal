import { Link, useLocation } from 'react-router-dom';
import { BookOpen } from "lucide-react";
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  MapPin, 
  CalendarOff, 
  ShieldAlert, 
  Award, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Directory', path: '/directory', icon: Users },
    { name: 'Announcements', path: '/communications', icon: Megaphone },
    { name: 'Meetings', path: '/meetings', icon: MapPin },
    { name: 'LOA Requests', path: '/loa', icon: CalendarOff },
    { name: 'Disciplinary', path: '/strikes', icon: ShieldAlert },
    { name: 'Rank Management', path: '/promotions', icon: Award },
    { name: 'HR Requests', path: '/hr-requests', icon: FileText },
    { name: 'Documents', path: '/documents', icon: BookOpen }
  ];

  return (
    <div className="w-64 h-full bg-slate-950/90 backdrop-blur-md border-r border-brand/30 flex flex-col shadow-[5px_0_15px_rgba(0,0,0,0.5)] z-20 relative">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-brand/30 bg-slate-950">
        <h2 className="text-lg font-extrabold tracking-widest text-slate-200 uppercase flex items-center gap-2 drop-shadow-md">
          SASP
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path as string);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path as string}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-md text-sm font-bold tracking-wider uppercase transition-all duration-200 ease-in-out border border-transparent",
                isActive 
                  ? "bg-brand/10 text-brand border-brand/30 shadow-[0_0_10px_rgba(234,179,8,0.1)] translate-x-1" 
                  : "text-slate-400 hover:text-brand hover:bg-slate-900 hover:border-brand/50 hover:translate-x-1"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors duration-200", 
                isActive ? "text-brand" : "text-slate-500 group-hover:text-brand"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-4 border-t border-brand/30 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-sm bg-slate-950 flex items-center justify-center text-brand font-bold text-xs border border-brand/30 shadow-md rotate-45">
            <span className="-rotate-45">{profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'HR'}</span>
          </div>
          <div className="flex flex-col overflow-hidden ml-2">
            <span className="text-sm font-bold tracking-wider text-slate-200 uppercase truncate">
              {profile ? profile.name : "Loading..."}
            </span>
            <span className="text-xs text-brand/80 tracking-widest uppercase truncate">
              {profile ? profile.role : "Connecting..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};