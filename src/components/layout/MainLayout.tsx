import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState, useEffect, useRef } from "react";
import { LogOut, User, ChevronDown, ShieldCheck, Shield, Menu } from "lucide-react";
import { useAuth } from '@/auth/hooks/useAuth';
import { getDepartmentColor, hexToRgba } from '@/styles/theme';
import { imageService } from "@/lib/imageService";

export default function MainLayout() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bgImages, setBgImages] = useState<string[]>(["/landing-bg-4.jpg"]);
  const [bgIndex, setBgIndex] = useState(0);
  
  const { profile, logout } = useAuth();
  const deptColor = getDepartmentColor(profile?.department || '');

  useEffect(() => {
    // Close dropdown if user clicks outside of it
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Fetch dynamic background image
    imageService.getActiveImages('background').then(data => {
      if (data && data.length > 0) {
        setBgImages(data.map(img => img.url));
      }
    }).catch(console.error);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (bgImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgImages.length);
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(interval);
  }, [bgImages.length]);

  useEffect(() => {
    // Global mouse tracker for the premium glow effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Dynamic Background Slideshow */}
      {bgImages.map((imgUrl, idx) => (
        <div 
          key={imgUrl}
          className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${idx === bgIndex ? 'opacity-25' : 'opacity-0'}`}
          style={{
            backgroundImage: `url('${imgUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "grayscale(50%)"
          }}
        />
      ))}
      
      {/* Global Mouse Tracker Glow */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-100 mix-blend-screen"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${hexToRgba(deptColor, 0.18)}, transparent 50%)`
        }}
      />
      
      <Sidebar isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
        
        {/* Top Header */}
        <header 
          className="relative h-16 glass-panel rounded-2xl mx-4 mt-4 mb-2 flex items-center justify-between px-6 z-40 transition-all duration-500 animate-slide-down"
        >
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span 
              className="font-black tracking-widest uppercase text-sm drop-shadow-md hidden sm:inline-block"
              style={{ color: deptColor }}
            >
              {profile?.role ? `${profile.role} Portal` : 'Portal'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              {/* Profile Button */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-slate-900/50 p-2 rounded-xl transition-all duration-300 border border-transparent group"
                style={{
                  border: isDropdownOpen ? `1px solid ${hexToRgba(deptColor, 0.5)}` : '1px solid transparent',
                  backgroundColor: isDropdownOpen ? hexToRgba(deptColor, 0.1) : 'transparent'
                }}
              >
                <div 
                  className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center transition-all duration-300 overflow-hidden"
                  style={{
                    border: `1px solid ${hexToRgba(deptColor, 0.5)}`,
                    boxShadow: `0 0 15px ${hexToRgba(deptColor, 0.2)}`
                  }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" style={{ color: deptColor }} />
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-black tracking-wide text-white uppercase leading-tight">
                    {profile ? profile.name : "Loading..."}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {profile ? profile.role : "Connecting..."}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
  
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] overflow-hidden py-1 z-50 transition-all animate-in fade-in zoom-in-95 duration-200"
                  style={{ border: `1px solid ${hexToRgba(deptColor, 0.3)}` }}
                >
                  
                  {/* User Info Section */}
                  <div className="px-4 py-4 border-b bg-slate-900/50" style={{ borderColor: hexToRgba(deptColor, 0.2) }}>
                    <p className="text-sm font-black tracking-wider uppercase text-white">{profile?.name}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${profile?.is_admin ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {profile?.is_admin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />} {profile?.role || 'Unknown'}
                      </span>
                    </div>
                  </div>
  
                  {/* Logout Action */}
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 hover:border-red-500/50 px-3 py-2.5 text-xs rounded-xl transition-all font-black tracking-widest uppercase hover:scale-[1.02]"
                    >
                      <LogOut className="w-4 h-4" />
                      Secure Logout
                    </button>
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}