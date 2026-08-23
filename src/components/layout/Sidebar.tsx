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
  FileText,
  ClipboardList,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

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
    <div className="w-[280px] h-full bg-[#0a0f18]/95 backdrop-blur-3xl border-r border-slate-800/80 flex flex-col shadow-[15px_0_40px_rgba(0,0,0,0.6)] z-20 relative">
      {/* Custom Animation Styles */}
      <style>{`
        @keyframes popInOut {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-8 border-b border-slate-800/60 bg-transparent">
        <h2 className="text-lg font-extrabold tracking-widest uppercase flex items-center gap-2 drop-shadow-md">
          <span 
            className="inline-block"
            style={{ 
              animation: 'popInOut 2.5s ease-in-out infinite',
              ...(profile?.department === 'LSPD' ? { color: '#3b82f6', textShadow: '0 0 15px rgba(59,130,246,0.8)' } :
                  profile?.department === 'BCSO' ? { color: '#d97706', textShadow: '0 0 15px rgba(217,119,6,0.8)' } :
                  profile?.department === 'SAPR' ? { color: '#10b981', textShadow: '0 0 15px rgba(16,185,129,0.8)' } :
                  profile?.department === 'SASP Academy' ? { color: '#938383', textShadow: '0 0 15px rgba(147,131,131,0.8)' } :
                  { color: 'hsl(var(--brand-main))', textShadow: '0 0 15px hsl(var(--brand-main)/0.8)' })
            }}
          >
            {profile?.department || 'SASP'}
          </span>
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 relative no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path as string);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path as string}
              className={cn(
                "group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-300 ease-out overflow-hidden",
                isActive 
                  ? "text-white bg-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-slate-700/50 translate-x-1" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent hover:translate-x-1"
              )}
            >
              {/* Active State Background Gradient & Indicator Line */}
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-transparent z-0"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-brand rounded-r-full shadow-[0_0_15px_hsl(var(--brand-main))] z-10"></div>
                </>
              )}
              
              <div className="relative z-10 flex items-center justify-center p-1.5 rounded-lg bg-slate-950/50 shadow-inner group-hover:bg-slate-900 transition-colors">
                <Icon className={cn(
                  "w-4 h-4 transition-all duration-300 drop-shadow-lg", 
                  isActive ? "text-brand scale-110" : "text-slate-500 group-hover:text-brand"
                )} />
              </div>
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <Link to="/profile" className="block p-5 border-t border-slate-800/60 bg-[#0a0f18] hover:bg-slate-900 transition-all duration-300 group cursor-pointer">
        <div className="flex items-center gap-4 px-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-brand font-bold text-sm border border-slate-700/50 shadow-lg group-hover:shadow-[0_0_15px_rgba(var(--brand-main),0.4)] transition-all duration-300 group-hover:scale-105 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'HR'}</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden ml-1">
            <span className="text-sm font-extrabold tracking-widest text-slate-200 uppercase truncate group-hover:text-white transition-colors">
              {profile ? profile.name : "Loading..."}
            </span>
            <span className="text-[10px] text-brand/80 tracking-widest uppercase truncate mt-0.5">
              {profile ? profile.role : "Connecting..."}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};