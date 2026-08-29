import { Shield, ChevronRight, ArrowRight, ShieldCheck, Activity, Users } from "lucide-react";
import LoginModal from '@/auth/components/LoginModal';
import { landingData } from '@/constants/landingData';
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { imageService } from "@/lib/imageService";

// --- Scroll Reveal Component ---
function Reveal({ children, className = "", delay = "" }: { children: ReactNode; className?: string; delay?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${delay} ${className}`}>
      {children}
    </div>
  );
}

// Fallback array if database is empty
const FALLBACK_IMAGES = [
  '/landing-bg-1.jpg',
  '/landing-bg-2.jpg',
  '/landing-bg-3.jpg',
  '/landing-bg-4.jpg',
  '/group-photo.jpg'
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [communityImgIdx, setCommunityImgIdx] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>(FALLBACK_IMAGES);
  
  // For mouse tilt effect on cards
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Fetch dynamic gallery images
    const fetchImages = async () => {
      try {
        const data = await imageService.getActiveImages('gallery');
        if (data && data.length > 0) {
          setGalleryImages(data.map(img => img.url));
        }
      } catch (err) {
        console.error("Failed to fetch gallery images", err);
      }
    };
    fetchImages();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const currentImages = galleryImages.length > 0 ? galleryImages : FALLBACK_IMAGES;
  const nextImgIdx2 = (communityImgIdx + 2) % currentImages.length;
  const nextImgIdx3 = (communityImgIdx + 3) % currentImages.length;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-300 relative bg-[#0B1121] overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* ─── GLOBAL NAVIGATION HEADER ─── */}
      <header className={`fixed top-0 w-full flex items-center justify-between px-6 py-4 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl py-3' : 'bg-transparent py-6'}`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-8 h-8 bg-slate-900/80 rounded-lg border border-slate-700 shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">
            SASP <span className="font-light text-slate-400">PORTAL</span>
          </h1>
        </div>

        {/* Mobile Login */}
        <div className="md:hidden flex items-center">
          <LoginModal>
            <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 transition-all backdrop-blur-md tracking-wider uppercase text-[10px] font-bold rounded-lg shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
              LOGIN
            </button>
          </LoginModal>
        </div>

        <nav className="hidden md:flex items-center space-x-10 font-medium text-[13px] tracking-[0.1em] text-slate-400">
          <a href="#" className="hover:text-emerald-400 transition-colors">HOME</a>
          <a href="#about" className="hover:text-emerald-400 transition-colors">ABOUT</a>
          <a href="#community" className="hover:text-emerald-400 transition-colors">COMMUNITY</a>
          <a href="#recruitment" className="hover:text-emerald-400 transition-colors">RECRUITMENT</a>
          <LoginModal>
            <button className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 text-emerald-400 transition-all hover:scale-105 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-md tracking-widest uppercase text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950">
              PORTAL LOGIN
            </button>
          </LoginModal>
        </nav>
      </header>

      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Deep Slate abstract mesh / gradient background */}
        <div className="absolute inset-0 z-0 bg-[#0B1121]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse duration-[10000ms] delay-1000"></div>
          {/* Faint grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwaC00MHY0MGg0MHYtNDB6IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAuNWg0MG0tNDAgMzlINDIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNLjUgMHY0MG0zOS00MHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50"></div>
        </div>

        <Reveal className="relative z-20 px-6 w-full max-w-5xl mx-auto text-center mt-12">
          <div className="inline-block p-10">
            <h2 className="text-4xl md:text-7xl font-extralight tracking-tight mb-2 text-slate-100">
              {landingData.hero.titleTop} 
            </h2>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 pb-2">
              {landingData.hero.titleBottom}
            </h2>
            <div className="w-24 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto my-8 opacity-80 rounded-full"></div>
            
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light tracking-wide">
              {landingData.hero.subtitle.split('. ').map((part, i, arr) => (
                <span key={i} className={i === 1 ? "text-slate-200 font-medium" : ""}>
                  {part}{i !== arr.length - 1 ? '. ' : ''}
                </span>
              ))}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#recruitment" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-xs uppercase transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-1 flex items-center justify-center group rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950">
                {landingData.hero.btnPrimary}
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#community" className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-slate-500 font-bold tracking-widest text-xs uppercase transition-all flex items-center justify-center backdrop-blur-md rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950 hover:-translate-y-1">
                {landingData.hero.btnSecondary}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── 2. VALUE PROPOSITIONS (GLASS CARDS GRID) ─── */}
      <section id="about" className="relative z-10 py-32 px-6 bg-[#0F172A]/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto relative z-20">
          <Reveal className="text-center mb-24 max-w-3xl mx-auto">
            <h3 className="text-xs font-bold tracking-[0.2em] text-emerald-500 uppercase mb-4">{landingData.about.label}</h3>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-8">
              {landingData.about.title.split(' ')[0]} <span className="font-semibold">{landingData.about.title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-lg text-slate-400 font-light leading-relaxed">
              {landingData.about.description}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {landingData.about.features.map((feature, idx) => {
              const Icon = feature.icon || ShieldCheck;
              const isCenter = idx === 1;
              return (
                <Reveal key={idx} delay={`delay-${(idx + 1) * 100}`} className="h-full">
                  <div 
                    onMouseMove={handleMouseMove}
                    className="group relative h-full rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 p-10 transition-all duration-300 hover:border-emerald-500/30 overflow-hidden flex flex-col"
                    style={{
                      transform: `perspective(1000px) rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`,
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>
                    
                    <div className={`p-4 rounded-xl inline-flex mb-8 border border-white/5 shadow-inner transition-colors duration-300 ${isCenter ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700/80 group-hover:text-emerald-400'}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold mb-4 tracking-tight text-white">{feature.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-light flex-1">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 3. FEATURES HIGHLIGHT (SPLIT LAYOUT) ─── */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <Reveal className="md:w-1/2" delay="delay-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold tracking-widest uppercase mb-8">
              <Activity className="w-4 h-4 text-emerald-400" />
              The Frontline of Defense
            </div>
            <h3 className="text-3xl md:text-5xl font-light mb-6 text-white tracking-tight leading-tight">
              Operational <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Excellence</span>
            </h3>
            <p className="text-lg leading-relaxed font-light text-slate-400 mb-8">
              {landingData.intro.description}
            </p>
            <div className="pl-6 border-l-2 border-emerald-500/50 py-2">
              <span className="text-emerald-400 font-medium text-xl tracking-wide">
                {landingData.intro.quote}
              </span>
            </div>
          </Reveal>
          
          <Reveal className="md:w-1/2 w-full relative group" delay="delay-300">
            {/* Browser Frame Mockup */}
            <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900 transition-transform duration-700 hover:-translate-y-2">
              <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <div 
                className="w-full h-[400px]"
                style={{
                  backgroundImage: "url('/landing-bg-4.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-slate-900/20"></div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
          </Reveal>
        </div>
      </section>

      {/* ─── 4. COMMUNITY OUTREACH (SPLIT REVERSE) ─── */}
      <section id="community" className="relative z-10 py-32 px-6 bg-slate-900/30 border-y border-slate-800/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
          <Reveal className="md:w-1/2" delay="delay-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold tracking-widest uppercase mb-8">
              <Users className="w-4 h-4 text-blue-400" />
              {landingData.community.label}
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-8 text-white leading-tight tracking-tight">
              {landingData.community.title.split(': ')[0]}: <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {landingData.community.title.split(': ')[1]}
              </span>
            </h2>
            <div className="space-y-6 text-slate-400 font-light leading-relaxed text-lg">
              {landingData.community.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </Reveal>
          
          <Reveal className="md:w-1/2 w-full relative cursor-pointer group" delay="delay-300">
            {/* Interactive Image Stack */}
            <div className="relative w-full aspect-video">
              {/* Layer 3 */}
              <div className="absolute inset-0 rounded-2xl transform -rotate-6 translate-y-8 -translate-x-4 border border-white/10 opacity-30 shadow-2xl transition-all duration-500 ease-out group-hover:-rotate-12 group-hover:translate-y-12 group-hover:-translate-x-8 overflow-hidden bg-slate-800">
                <img src={currentImages[nextImgIdx3]} onError={(e) => e.currentTarget.src = FALLBACK_IMAGES[2]} alt="Queue 3" className="w-full h-full object-cover mix-blend-overlay" />
              </div>

              {/* Layer 2 */}
              <div className="absolute inset-0 rounded-2xl transform rotate-3 translate-y-4 translate-x-4 border border-white/10 opacity-50 shadow-2xl transition-all duration-500 ease-out group-hover:rotate-6 group-hover:translate-y-6 group-hover:translate-x-8 overflow-hidden bg-slate-800">
                <img src={currentImages[nextImgIdx2]} onError={(e) => e.currentTarget.src = FALLBACK_IMAGES[1]} alt="Queue 2" className="w-full h-full object-cover mix-blend-overlay" />
              </div>

              {/* Layer 1 */}
              <div className="absolute inset-0 rounded-2xl transform -rotate-2 border border-white/20 shadow-2xl transition-all duration-500 ease-out group-hover:rotate-0 group-hover:scale-105 overflow-hidden z-10" onClick={() => setCommunityImgIdx(prev => (prev + 1) % currentImages.length)}>
                 <img 
                  src={currentImages[communityImgIdx]} 
                  onError={(e) => e.currentTarget.src = FALLBACK_IMAGES[0]}
                  alt="Gallery Main"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
                  <span>Click to view next</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 5. RECRUITMENT CALL TO ACTION ─── */}
      <section id="recruitment" className="relative z-10 py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-950">
          <div 
            className="absolute inset-0 opacity-20 mix-blend-luminosity grayscale"
            style={{
              backgroundImage: "url('/group-photo.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1121] via-transparent to-[#0B1121]"></div>
        </div>

        <Reveal className="max-w-4xl mx-auto text-center relative z-20">
          <div className="inline-block p-12 md:p-16 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight text-white">
              {landingData.recruitment.title.split('Join')[0]} 
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 block mt-2 text-5xl md:text-6xl pb-2">Join {landingData.recruitment.title.split('Join')[1]}</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              {landingData.recruitment.description}
            </p>
            <a href={landingData.recruitment.link} target="_blank" rel="noopener noreferrer" className="relative inline-flex items-center justify-center px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-[0.1em] uppercase text-sm transition-all duration-300 rounded-lg group shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
              <span className="relative z-10 flex items-center">
                {landingData.recruitment.btnText}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
          </div>
        </Reveal>
      </section>

      {/* ─── LOGO STRIP ─── */}
      <section className="relative z-20 bg-[#070B15] py-16 px-6 border-t border-slate-800/50">
        <h4 className="text-center text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase mb-10">Partner Agencies & Divisions</h4>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-12 md:gap-20">
          {[
            { src: '/logos/sasp.png', alt: 'SASP' },
            { src: '/logos/lspd.png', alt: 'LSPD' },
            { src: '/logos/bcso.png', alt: 'BCSO' },
            { src: '/logos/sapr.jpg', alt: 'SAPR', rounded: true },
            { src: '/logos/pau.jpg', alt: 'PAU', rounded: true }
          ].map((logo, idx) => (
            <img 
              key={idx} 
              src={logo.src} 
              alt={logo.alt} 
              className={`h-14 md:h-16 w-auto object-contain opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105 transition-all duration-500 cursor-pointer ${logo.rounded ? 'rounded-full border border-slate-800' : ''}`} 
            />
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-20 bg-[#070B15] py-12 px-6 border-t border-slate-800/50 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-semibold text-slate-400">San Andreas State Police</span>
          </div>
          <p className="opacity-70 font-light text-xs tracking-widest uppercase">© {new Date().getFullYear()} SASP. "To protect and to serve"</p>
          <div className="flex space-x-8 font-medium text-xs tracking-wider uppercase">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
