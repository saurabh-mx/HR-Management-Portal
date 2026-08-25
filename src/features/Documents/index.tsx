import { useState } from "react";
import { BookOpen, ChevronRight, FileText, Search, ShieldCheck, ExternalLink, Menu } from "lucide-react";
import { documents, hexToRgba } from '@/constants/documentsData';
import { useAuth } from '@/auth/hooks/useAuth';

const DocumentButton = ({ doc, isActive, onSelect, index, deptColor, isSidebarCollapsed }: any) => {
  return (
    <button
      onClick={() => onSelect(doc)}
      title={isSidebarCollapsed ? doc.title : undefined}
      className={`group flex w-full items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} rounded-xl px-3 py-3 text-xs font-medium transition-all duration-500 relative overflow-hidden outline-none ${isActive ? 'scale-[1.02] ml-1' : 'hover:scale-[1.03] hover:ml-1'}`}
      style={{
        animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
        backgroundColor: isActive ? hexToRgba(deptColor, 0.15) : 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isActive ? hexToRgba(deptColor, 0.5) : 'rgba(255,255,255,0.03)'}`,
        boxShadow: isActive
          ? `0 10px 30px -10px ${hexToRgba(deptColor, 0.4)}, inset 0 0 15px ${hexToRgba(deptColor, 0.15)}`
          : `0 4px 15px -10px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Animated background gradient on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
        style={{ background: `linear-gradient(120deg, transparent, ${hexToRgba(deptColor, 0.1)}, transparent)` }}
      />
      
      {/* Left accent line */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
        style={{ backgroundColor: deptColor, boxShadow: `0 0 8px ${deptColor}` }}
      />

      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'} z-10 relative`}>
        <div
          className={`p-2 rounded-lg transition-all duration-500 ${isActive ? 'scale-110 shadow-md' : 'group-hover:scale-110 group-hover:shadow-sm'}`}
          style={{
            backgroundColor: isActive ? hexToRgba(deptColor, 0.2) : 'rgba(255,255,255,0.05)',
            color: isActive ? deptColor : '#64748b',
            boxShadow: isActive ? `0 0 15px ${hexToRgba(deptColor, 0.3)}` : undefined
          }}
        >
          {doc.icon}
        </div>
        {!isSidebarCollapsed && (
          <span
            className={`text-left font-black tracking-widest truncate max-w-[120px] transition-all duration-500 origin-left ${isActive ? 'drop-shadow-md scale-105' : 'text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1'}`}
            style={{ 
              color: isActive ? deptColor : undefined,
              textShadow: isActive ? `0 0 10px ${hexToRgba(deptColor, 0.4)}` : undefined
            }}
          >
            {doc.title}
          </span>
        )}
      </div>
      {!isSidebarCollapsed && (
        <ChevronRight 
          className={`w-4 h-4 z-10 relative transition-all duration-500 shrink-0 ${isActive ? 'opacity-100 translate-x-0 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0'}`} 
          style={{ color: isActive ? '#fff' : deptColor }} 
        />
      )}
    </button>
  );
};

const AnimatedSection = ({ children, idx }: any) => {
  return (
    <div 
      className="w-full opacity-0 translate-y-4 animate-fadeSlideIn"
      style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}
    >
      {children}
    </div>
  );
};

export default function DocumentsDashboard() {
  const { profile } = useAuth();
  const [activeDoc, setActiveDoc] = useState(documents[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use department color based on user's department, fallback to cyan
  const theme = {
    hex: profile?.department === 'LSPD' ? '#3b82f6' :
         profile?.department === 'BCSO' ? '#eab308' :
         profile?.department === 'SASP' ? '#06b6d4' :
         profile?.department === 'SAMS' ? '#ef4444' :
         profile?.department === 'DOJ' ? '#a855f7' : '#06b6d4'
  };

  const handleDocSelect = (doc: any) => {
    if (doc.id === activeDoc.id) return;
    setIsAnimating(true);
    // Auto collapse sidebar for immersion
    if (window.innerWidth > 768) {
      setIsSidebarCollapsed(true);
    }
    setTimeout(() => {
      setActiveDoc(doc);
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div className="relative min-h-[90vh] w-full p-6 text-slate-200 overflow-hidden">

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }
        
        /* Reading Area Global Overrides */
        .reading-content {
          font-size: 15px;
          line-height: 1.8;
          color: #cbd5e1; /* text-slate-300 */
        }
        .reading-content p {
          margin-bottom: 1.25rem;
        }
        .reading-content ul {
          margin-top: 1rem;
          margin-bottom: 1.5rem;
        }
        .reading-content li {
          margin-bottom: 0.5rem;
        }
        .reading-content strong, .reading-content b {
          color: #f1f5f9; /* text-slate-100 */
          font-weight: 700;
        }
      `}</style>
      
      <div className="mx-auto flex h-[85vh] w-full max-w-[1500px] gap-8 relative z-10">
        
        {/* LEFT SIDEBAR: CONTENTS MENU */}
        <div 
          className={`flex flex-col rounded-3xl border backdrop-blur-xl shrink-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] relative overflow-hidden group/sidebar transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
          style={{ 
            borderColor: hexToRgba(theme.hex, 0.15),
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)' 
          }}
        >
          {/* Subtle moving highlight */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-1000"
               style={{ background: `radial-gradient(400px circle at 50% 50%, ${hexToRgba(theme.hex, 0.05)}, transparent 80%)` }} />
          
          <div className="p-5 pb-4 relative z-10 bg-slate-900/40 flex items-center justify-between min-h-[72px]">
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-black tracking-[0.25em] flex items-center gap-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] whitespace-nowrap" style={{ color: theme.hex }}>
                <BookOpen className="w-4 h-4 animate-float" /> 
                LIBRARY
              </h3>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800 transition-colors ${isSidebarCollapsed ? 'mx-auto' : ''}`}
            >
              <Menu className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>
          
          {/* Quick Search */}
          <div className={`px-5 pb-4 relative z-10 bg-slate-900/40 transition-all duration-500 overflow-hidden ${isSidebarCollapsed ? 'h-0 p-0 opacity-0' : 'h-auto opacity-100'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/80 rounded-lg py-2 pl-9 pr-3 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
                style={{ borderColor: hexToRgba(theme.hex, 0.3) }}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative z-10 pb-4">
            {!isSidebarCollapsed && (
              <div className="px-2 pb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase whitespace-nowrap">
                Active Modules
              </div>
            )}
            {documents
              .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((doc, idx) => (
              <DocumentButton
                key={doc.id}
                doc={doc}
                isActive={activeDoc.id === doc.id}
                onSelect={handleDocSelect}
                index={idx}
                deptColor={theme.hex}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t border-slate-800/50 bg-slate-900/80 relative z-10 flex items-center transition-all duration-500 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0" style={{ color: theme.hex }} title={profile?.rank || 'Authorized'}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clearance</div>
                <div className="text-xs font-black text-slate-300 truncate max-w-[140px]">{profile?.rank || 'Authorized'}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: DOCUMENT VIEWER */}
        <div 
          className="flex flex-1 flex-col rounded-3xl border backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-500 bg-[#020617]/60"
          style={{ 
            borderColor: hexToRgba(theme.hex, 0.15),
            transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
            opacity: isAnimating ? 0.8 : 1
          }}
        >
          {activeDoc.sections ? (
            // Native Document: Header and Content share the scroll container so header scrolls out of view
            <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar reading-content">
              {/* Scrollable Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-8 md:p-12 gap-6 relative z-20 overflow-hidden border-b border-slate-800/40">
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${hexToRgba(theme.hex, 0.4)}, transparent 70%)` }}></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, ${hexToRgba(theme.hex, 0.5)}, transparent)` }}></div>
                
                <div className={`relative z-10 transition-all duration-700 ${isAnimating ? 'opacity-0 -translate-y-8 blur-md' : 'opacity-100 translate-y-0 blur-0'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-[0.2em] uppercase border shadow-sm" style={{ color: theme.hex, borderColor: hexToRgba(theme.hex, 0.3), backgroundColor: hexToRgba(theme.hex, 0.1) }}>
                      {activeDoc.id === 'sop' ? 'INTERNAL' : 'EXTERNAL'} ACCESS
                    </span>
                    <span className="text-slate-400/80 text-[11px] font-bold tracking-[0.15em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> RESTRICTED
                    </span>
                  </div>
                  <h2 
                    className="text-4xl md:text-5xl font-black tracking-tight mb-3 transition-transform duration-500 hover:scale-[1.01] animate-fadeSlideIn opacity-0"
                    style={{ 
                      background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(theme.hex, 0.8)} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 4px 12px ${hexToRgba(theme.hex, 0.3)})`,
                      animationDelay: '0.1s',
                      animationFillMode: 'forwards'
                    }}
                  >
                    {activeDoc.title}
                  </h2>
                  <p className="text-[15px] md:text-base text-slate-300 font-medium max-w-3xl leading-relaxed">{activeDoc.description}</p>
                </div>
                
                {activeDoc.original && (
                  <div className={`relative z-10 flex shrink-0 items-center justify-center transition-all duration-500 delay-100 ${isAnimating ? 'opacity-0 translate-x-8 blur-md' : 'opacity-100 translate-x-0 blur-0'}`}>
                    <a
                      href={activeDoc.original}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center gap-2 transition-all outline-none"
                    >
                      <div className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-[0_0_20px_rgba(var(--brand-main),0.4)]"
                           style={{ borderColor: hexToRgba(theme.hex, 0.4), backgroundColor: hexToRgba(theme.hex, 0.15) }}>
                         <ExternalLink className="w-5 h-5 drop-shadow-md transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" style={{ color: theme.hex }} />
                      </div>
                      <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 group-hover:text-white transition-colors">View</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Native Document Content */}
              <div className="p-8 md:p-12 space-y-6">
                <div className="max-w-5xl mx-auto space-y-6 pb-12">
                  {activeDoc.sections.map((section: any, idx: number) => (
                    <AnimatedSection key={idx} idx={idx}>
                      <div className={`w-full transition-all duration-700 delay-100 ${isAnimating ? 'opacity-0 translate-y-8 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
                        {activeDoc.sections.length > 1 && section.title && (
                          <div className="mb-6 flex flex-col items-start relative pl-5 group">
                            <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full transition-all duration-500 group-hover:w-1.5" style={{ backgroundColor: hexToRgba(section.color || theme.hex, 0.8), boxShadow: `0 0 10px ${hexToRgba(section.color || theme.hex, 0.5)}` }}></div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 
                                className="text-xl md:text-2xl font-black tracking-tight drop-shadow-md transition-all duration-500 hover:scale-[1.01]"
                                style={{ 
                                  background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(section.color || theme.hex, 0.7)} 100%)`,
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  filter: `drop-shadow(0 0 8px ${hexToRgba(section.color || theme.hex, 0.3)})`
                                }}
                              >
                                {section.title}
                              </h3>
                              {section.badge && (
                                <span 
                                  className="px-2.5 py-1 rounded-md text-[9px] font-black tracking-[0.2em] uppercase border shadow-sm transition-all duration-500 hover:shadow-md"
                                  style={{ 
                                    color: section.color || theme.hex, 
                                    borderColor: hexToRgba(section.color || theme.hex, 0.4), 
                                    backgroundColor: hexToRgba(section.color || theme.hex, 0.1),
                                    boxShadow: `0 0 10px ${hexToRgba(section.color || theme.hex, 0.2)}`
                                  }}
                                >
                                  {section.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {section.content}
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Iframe Document: Fixed Header, scrolling iframe
            <div className="flex flex-col h-full w-full relative z-10">
              {/* Fixed Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-8 md:p-12 gap-6 shrink-0 relative z-20 overflow-hidden border-b border-slate-800/40 bg-slate-900/50 backdrop-blur-xl">
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${hexToRgba(theme.hex, 0.4)}, transparent 70%)` }}></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, ${hexToRgba(theme.hex, 0.5)}, transparent)` }}></div>
                
                <div className={`relative z-10 transition-all duration-700 ${isAnimating ? 'opacity-0 -translate-y-8 blur-md' : 'opacity-100 translate-y-0 blur-0'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-[0.2em] uppercase border shadow-sm" style={{ color: theme.hex, borderColor: hexToRgba(theme.hex, 0.3), backgroundColor: hexToRgba(theme.hex, 0.1) }}>
                      {activeDoc.id === 'sop' ? 'INTERNAL' : 'EXTERNAL'} ACCESS
                    </span>
                    <span className="text-slate-400/80 text-[11px] font-bold tracking-[0.15em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> RESTRICTED
                    </span>
                  </div>
                  <h2 
                    className="text-4xl md:text-5xl font-black tracking-tight mb-3 transition-transform duration-500 hover:scale-[1.01] animate-fadeSlideIn opacity-0"
                    style={{ 
                      background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(theme.hex, 0.8)} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 4px 12px ${hexToRgba(theme.hex, 0.3)})`,
                      animationDelay: '0.1s',
                      animationFillMode: 'forwards'
                    }}
                  >
                    {activeDoc.title}
                  </h2>
                  <p className="text-[15px] md:text-base text-slate-300 font-medium max-w-3xl leading-relaxed">{activeDoc.description}</p>
                </div>
                
                {activeDoc.original && (
                  <div className={`relative z-10 flex shrink-0 items-center justify-center transition-all duration-500 delay-100 ${isAnimating ? 'opacity-0 translate-x-8 blur-md' : 'opacity-100 translate-x-0 blur-0'}`}>
                    <a
                      href={activeDoc.original}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center gap-2 transition-all outline-none"
                    >
                      <div className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-[0_0_20px_rgba(var(--brand-main),0.4)]"
                           style={{ borderColor: hexToRgba(theme.hex, 0.4), backgroundColor: hexToRgba(theme.hex, 0.15) }}>
                         <ExternalLink className="w-5 h-5 drop-shadow-md transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" style={{ color: theme.hex }} />
                      </div>
                      <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 group-hover:text-white transition-colors">View</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Iframe Content */}
              <div className="flex-1 w-full relative p-6">
                <div className={`w-full h-full rounded-2xl overflow-hidden border shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-900 transition-all duration-700 ease-out ${isAnimating ? 'opacity-0 scale-[0.98] translate-y-4' : 'opacity-100 scale-100 translate-y-0 delay-200'}`}
                     style={{ borderColor: hexToRgba(theme.hex, 0.3) }}>
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20 mix-blend-overlay"></div>
                  <iframe
                    src={activeDoc.url}
                    className="w-full h-full border-0 relative z-10"
                    title={activeDoc.title}
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}