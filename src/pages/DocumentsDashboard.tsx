import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronRight, FileText } from "lucide-react";
import { documents, hexToRgba } from "@/data/documentsData";
import { useAuth } from "@/context/AuthContext";

const DocumentButton = ({ doc, isActive, onSelect, index, deptColor }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(doc)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 relative overflow-hidden"
      style={{
        animation: `slideUp 0.3s ease-out forwards`,
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
        backgroundColor: isActive ? hexToRgba(deptColor, 0.15) : (isHovered ? hexToRgba(deptColor, 0.05) : 'transparent'),
        backdropFilter: isHovered || isActive ? 'blur(8px)' : 'none',
        boxShadow: isActive
          ? `inset 4px 0 0 0 ${deptColor}, inset 0 0 20px ${hexToRgba(deptColor, 0.15)}, 0 10px 30px -10px rgba(0,0,0,0.5)`
          : isHovered
            ? `inset 4px 0 0 0 ${deptColor}, inset 0 0 10px ${hexToRgba(deptColor, 0.05)}`
            : `inset 2px 0 0 0 transparent`,
        transform: isHovered && !isActive ? 'scale(1.02) translateY(-1px)' : 'scale(1) translateY(0)',
        zIndex: isHovered || isActive ? 20 : 1,
        color: isActive || isHovered ? deptColor : '#94a3b8'
      }}
    >
      <div className="flex items-center gap-3 z-10 relative">
        <div
          className="p-1.5 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: isActive || isHovered ? hexToRgba(deptColor, 0.2) : 'rgba(15, 23, 42, 0.5)',
            color: isActive || isHovered ? deptColor : '#64748b'
          }}
        >
          {doc.icon}
        </div>
        <span
          className="text-left font-semibold tracking-wide truncate max-w-[170px] transition-all duration-300 origin-left"
          style={{
            textShadow: isActive || isHovered ? `0 0 15px ${hexToRgba(deptColor, 0.8)}` : 'none',
            transform: isHovered && !isActive ? 'scale(1.05) translateX(2px)' : 'scale(1) translateX(0)',
          }}
        >
          {doc.title}
        </span>
      </div>
      {isActive && <ChevronRight className="w-4 h-4 z-10 relative animate-pulse" style={{ color: deptColor }} />}
    </button>
  );
};

const AnimatedSection = ({ children, idx }: any) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    if (domRef.current) {
      observer.observe(domRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={domRef} 
      className={`transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: isVisible ? `${(idx % 5) * 100}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

export default function DocumentsDashboard() {
  const { profile } = useAuth();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [activeDoc, setActiveDoc] = useState(documents[0]);
  const [isAnimating, setIsAnimating] = useState(false);

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
    setTimeout(() => {
      setActiveDoc(doc);
      setExpandedSection(doc.sections ? 0 : null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative min-h-[90vh] w-full p-6 text-slate-200">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
      
      <div className="mx-auto flex h-[85vh] w-full max-w-[1400px] gap-6">
        
        {/* LEFT SIDEBAR: CONTENTS MENU */}
        <div 
          className="flex w-72 flex-col rounded-2xl border backdrop-blur-md shrink-0 shadow-2xl relative overflow-hidden"
          style={{ 
            borderColor: hexToRgba(theme.hex, 0.2),
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)' 
          }}
        >
          <div className="absolute top-0 left-0 w-full h-32 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom, ${hexToRgba(theme.hex, 0.1)}, transparent)` }}></div>
          
          <div className="border-b border-slate-800/80 p-5 relative z-10">
            <h3 className="text-xs font-black tracking-[0.2em] flex items-center gap-3 drop-shadow-md" style={{ color: theme.hex }}>
              <BookOpen className="w-4 h-4" /> 
              INDEX
            </h3>
            <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
              {documents.length} available resources
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 relative z-10">
            {documents.map((doc, idx) => (
              <DocumentButton
                key={doc.id}
                doc={doc}
                isActive={activeDoc.id === doc.id}
                onSelect={handleDocSelect}
                index={idx}
                deptColor={theme.hex}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: DOCUMENT VIEWER */}
        <div 
          className="flex flex-1 flex-col rounded-2xl border backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300"
          style={{ 
            borderColor: hexToRgba(theme.hex, 0.2),
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)' 
          }}
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 p-8 gap-6 shrink-0 relative z-20" style={{ background: hexToRgba(theme.hex, 0.03) }}>
            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border" style={{ color: theme.hex, borderColor: hexToRgba(theme.hex, 0.3), backgroundColor: hexToRgba(theme.hex, 0.1) }}>
                  {activeDoc.id === 'sop' ? 'INTERNAL' : 'EXTERNAL'}
                </span>
                <span className="text-slate-500 text-xs font-medium tracking-wide">RESTRICTED ACCESS</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{activeDoc.title}</h2>
              <p className="mt-2 text-[15px] text-slate-400 font-medium max-w-2xl leading-relaxed">{activeDoc.description}</p>
            </div>
            
            <div className={`transition-all duration-300 delay-100 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <a
                href={activeDoc.original}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2.5 rounded-xl border px-6 py-3 text-sm font-bold transition-all overflow-hidden relative shadow-lg"
                style={{
                  borderColor: hexToRgba(theme.hex, 0.4),
                  backgroundColor: hexToRgba(theme.hex, 0.1),
                  color: theme.hex
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(45deg, transparent, ${hexToRgba(theme.hex, 0.1)}, transparent)` }}></div>
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="relative z-10">View Original {activeDoc.id === 'sop' ? 'SOP Document' : 'Document'}</span>
              </a>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full relative bg-[#0f172a]">
            {/* Tech Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0"></div>

            {activeDoc.sections ? (
              <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar p-6 space-y-3">
                <div className="max-w-4xl mx-auto space-y-3 pb-8">
                  {activeDoc.sections.map((section: any, idx: number) => (
                    <AnimatedSection key={idx} idx={idx}>
                      <div 
                        className={`flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden ${expandedSection === idx ? 'border-slate-700 bg-slate-900/60 shadow-lg' : 'border-slate-800/80 bg-slate-900/40'}`}
                      >
                        <div 
                          onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                          className={`flex items-center gap-5 p-4 px-5 transition-all duration-300 cursor-pointer group ${expandedSection === idx ? 'bg-slate-800/40' : 'hover:bg-slate-800/80 hover:-translate-y-1 hover:shadow-xl'}`}
                        >
                          <div 
                            className="px-3 py-1.5 text-[10px] font-extrabold tracking-[0.2em] uppercase rounded-lg border shadow-sm shrink-0 w-28 text-center transition-colors"
                            style={{
                              color: section.color,
                              borderColor: hexToRgba(section.color, 0.3),
                              backgroundColor: hexToRgba(section.color, 0.1),
                            }}
                          >
                            {section.badge}
                          </div>
                          
                          <h3 className={`font-bold text-base transition-colors flex-1 ${expandedSection === idx ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {section.title}
                          </h3>
                          
                          <div 
                            className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm"
                            style={{ 
                              borderColor: expandedSection === idx ? section.color : 'rgba(30, 41, 59, 1)',
                              backgroundColor: expandedSection === idx ? section.color : 'transparent',
                              color: expandedSection === idx ? '#fff' : '#64748b'
                            }}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${expandedSection === idx ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                          </div>
                        </div>
                        
                        <div 
                          className={`transition-all duration-500 ease-in-out origin-top ${expandedSection === idx ? 'max-h-[2000px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95 pointer-events-none'}`}
                        >
                          {section.content}
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            ) : (
              <div className="absolute inset-2">
                <div className={`w-full h-full rounded-xl overflow-hidden border border-slate-800/50 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100 transition-all duration-500 delay-200'}`}>
                  <iframe
                    src={activeDoc.url}
                    className="w-full h-full border-0"
                    title={activeDoc.title}
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}