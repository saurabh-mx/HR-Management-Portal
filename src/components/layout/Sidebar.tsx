import { Link, useLocation } from 'react-router-dom';
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
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility to merge tailwind classes cleanly
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Directory', path: '/directory', icon: Users },
    { name: 'Announcements', path: '/communications', icon: Megaphone },
    { name: 'Meetings', path: '/meetings', icon: MapPin },
    { name: 'LOA Requests', path: '/loa', icon: CalendarOff },
    { name: 'Disciplinary', path: '/strikes', icon: ShieldAlert },
    { name: 'Rank Management', path: '/promotions', icon: Award },
    { name: 'HR Requests', path: '/hr-requests', icon: FileText },
  ];

  return (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight">
          HR <span className="text-blue-500">Portal</span>
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-500" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Jane Doe</span>
            <span className="text-xs text-slate-500">Chief of Police</span>
          </div>
        </div>
      </div>
    </div>
  );
};