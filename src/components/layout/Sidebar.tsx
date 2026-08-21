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
    <div className="w-64 h-full bg-card border-r border-border flex flex-col shadow-sm z-20 relative">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-border bg-card">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          HR <span className="text-primary">Portal</span>
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
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
                isActive 
                  ? "bg-primary/15 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-1"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors duration-200", 
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 shadow-sm">
            {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'HR'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">
              {profile ? profile.name : "Loading..."}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {profile ? profile.role : "Connecting..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};