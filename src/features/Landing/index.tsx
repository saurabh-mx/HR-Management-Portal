import { Shield, ChevronRight, ArrowRight, ShieldCheck } from "lucide-react";
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
    <div ref={ref} className={`reveal-hidden ${isVisible ? 'reveal-visible' : ''} ${delay} ${className}`}>
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

  const currentImages = galleryImages.length > 0 ? galleryImages : FALLBACK_IMAGES;
  const nextImgIdx1 = (communityImgIdx + 1) % currentImages.length;
  const nextImgIdx2 = (communityImgIdx + 2) % currentImages.length;
  const nextImgIdx3 = (communityImgIdx + 3) % currentImages.length;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-300 relative bg-slate-950 overflow-x-hidden">
      
      {/* ─── DYNAMIC NAVIGATION HEADER ─── */}
      <header className={`fixed top-0 w-full flex items-center justify-between px-6 py-4 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl py-3' : 'bg-transparent py-6'}`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-8 h-8 bg-slate-950/60 rounded-sm border border-brand shadow-[0_0_15px_hsl(var(--brand-main)/0.5)] backdrop-blur-md rotate-45">
            <Shield className="w-5 h-5 text-brand -rotate-45" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-slate-100 drop-shadow-md">
            SASP <span className="font-light text-brand">PORTAL</span>
          </h1>
        </div>
        <nav className="hidden md:flex items-center space-x-10 font-medium text-[13px] tracking-[0.2em] text-slate-400">
          <a href="#" className="text-brand hover:text-brand/70 transition-colors hover:shadow-[0_0_10px_hsl(var(--brand-main)/0.5)]">HOME</a>
          <a href="#intro" className="hover:text-blue-400 transition-colors">ABOUT</a>
          <a href="#community" className="hover:text-emerald-400 transition-colors">COMMUNITY</a>
          <a href="#recruitment" className="hover:text-brand transition-colors">RECRUITMENT</a>
          <LoginModal>
            <button className="px-6 py-2.5 bg-slate-950/60 border border-emerald-600/40 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-md tracking-widest uppercase text-xs font-bold rounded-sm">
              PORTAL LOGIN
            </button>
          </LoginModal>
        </nav>
      </header>

      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20">
        <div 
          className="absolute inset-0 z-0 mask-linear-faded-b"
          style={{
            backgroundImage: "url('/landing-bg-1.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "top center",
            backgroundRepeat: "no-repeat"
          }}
        >
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"></div>
        </div>

        <Reveal className="relative z-20 px-6 w-full max-w-5xl mx-auto text-center mt-12">
          <div className="inline-block glass-panel p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up">
            <h2 className="text-4xl md:text-7xl font-extralight tracking-widest mb-2 uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,1)] text-slate-100">
              {landingData.hero.titleTop} 
            </h2>
            <h2 className="text-4xl md:text-7xl font-black tracking-widest mb-6 uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,1)] text-transparent bg-clip-text bg-gradient-to-br from-brand via-brand/90 to-brand/60">
              {landingData.hero.titleBottom}
            </h2>
            <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent mx-auto my-8 opacity-70"></div>
            
            <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light tracking-[0.1em] drop-shadow-md">
              {landingData.hero.subtitle.split('. ').map((part, i, arr) => (
                <span key={i} className={i === 1 ? "text-emerald-400 font-semibold" : ""}>
                  {part}{i !== arr.length - 1 ? '. ' : ''}
                </span>
              ))}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#recruitment" className="w-full sm:w-auto px-8 py-3.5 bg-brand/20 backdrop-blur-md hover:bg-brand hover:text-slate-950 text-brand border border-brand/50 font-bold tracking-widest text-xs uppercase transition-all duration-300 shadow-[0_0_25px_hsl(var(--brand-main)/0.2)] hover:shadow-[0_0_40px_hsl(var(--brand-main)/0.6)] flex items-center justify-center group rounded-sm">
                {landingData.hero.btnPrimary}
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#community" className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-slate-500 font-bold tracking-widest text-xs uppercase transition-all flex items-center justify-center backdrop-blur-md rounded-sm">
                {landingData.hero.btnSecondary}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── 2. INTRODUCTION (SPLIT LAYOUT) ─── */}
      <section id="intro" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <Reveal className="md:w-1/2" delay="delay-100">
            <div className="inline-block p-4 border border-blue-900/40 bg-blue-950/30 backdrop-blur-md rotate-45 mb-8 shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-lg">
              <Shield className="w-8 h-8 text-blue-500 -rotate-45" />
            </div>
            <h3 className="text-3xl md:text-4xl font-light mb-6 text-slate-200">The Frontline of Defense</h3>
            <p className="text-lg leading-relaxed font-light text-slate-400 mb-8">
              {landingData.intro.description}
            </p>
            <div className="pl-6 border-l-2 border-emerald-500/50 py-2">
              <span className="text-emerald-400 font-medium text-2xl tracking-widest uppercase">
                {landingData.intro.quote}
              </span>
            </div>
          </Reveal>
          
          <Reveal className="md:w-1/2 w-full h-[500px] relative" delay="delay-300">
            {/* Floating Image with soft mask */}
            <div 
              className="absolute inset-0 rounded-2xl mask-radial-faded opacity-90 shadow-2xl"
              style={{
                backgroundImage: "url('/landing-bg-4.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
            {/* Decorative elements */}
            <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 -right-10 w-40 h-40 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>
          </Reveal>
        </div>
      </section>

      {/* ─── 3. ABOUT US (BENTO BOX) ─── */}
      <section id="about" className="relative z-10 py-32 px-6 bg-slate-900/20 border-y border-slate-800/30">
        {/* Subtle Background */}
        <div 
          className="absolute inset-0 z-0 opacity-20 mask-linear-faded-b grayscale"
          style={{ backgroundImage: "url('/landing-bg-2.jpg')", backgroundSize: "cover", backgroundPosition: "top", backgroundAttachment: "fixed" }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-20">
          <Reveal className="text-center mb-24 max-w-3xl mx-auto">
            <h3 className="text-xs font-bold tracking-[0.3em] text-brand/80 uppercase mb-4">{landingData.about.label}</h3>
            <h2 className="text-4xl md:text-5xl font-extralight tracking-wide text-slate-100 mb-8">
              {landingData.about.title.split(' ')[0]} <span className="font-bold text-brand">{landingData.about.title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed font-light">
              {landingData.about.description}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {landingData.about.features.map((feature, idx) => {
              const Icon = feature.icon || ShieldCheck;
              const themeColor = feature.theme === 'blue' ? 'text-blue-400 border-blue-500/20 group-hover:border-blue-500/50 shadow-blue-500/5' : 
                                 feature.theme === 'emerald' ? 'text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50 shadow-emerald-500/5' : 
                                 'text-brand border-brand/20 group-hover:border-brand/50 shadow-brand/5';
              return (
                <Reveal key={idx} delay={`delay-${(idx + 1) * 100}`} className={`relative group bento-card glass-panel p-10 transition-all duration-500 shadow-2xl ${themeColor}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={`p-4 rounded-xl bg-slate-900 inline-block mb-8 border border-white/5`}>
                    <Icon className={`w-8 h-8 ${themeColor.split(' ')[0]}`} />
                  </div>
                  <h4 className="text-xl font-bold mb-4 tracking-wide text-slate-100 uppercase">{feature.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. COMMUNITY OUTREACH (SPLIT REVERSE) ─── */}
      <section id="community" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
          <Reveal className="md:w-1/2" delay="delay-100">
            <h3 className="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase mb-4">{landingData.community.label}</h3>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 text-slate-200 leading-tight">
              {landingData.community.title.split(': ')[0]}: <br />
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
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
            
            {/* ─── STACKED BACKGROUND PANELS ─── */}
            
            {/* Layer 3 (Deepest) */}
            <div className="absolute inset-0 rounded-3xl transform -rotate-[4deg] translate-y-8 -translate-x-6 border border-white/5 transition-all duration-700 ease-out -z-30 overflow-hidden opacity-30 group-hover:-rotate-[6deg] group-hover:translate-y-10 group-hover:-translate-x-8">
              <img src={currentImages[nextImgIdx3]} alt="Queue 3" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"></div>
            </div>

            {/* Layer 2 */}
            <div className="absolute inset-0 rounded-3xl transform rotate-[3deg] translate-y-5 translate-x-5 border border-white/10 transition-all duration-700 ease-out -z-20 overflow-hidden shadow-2xl opacity-50 group-hover:rotate-[5deg] group-hover:translate-y-7 group-hover:translate-x-7">
              <img src={currentImages[nextImgIdx2]} alt="Queue 2" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"></div>
            </div>

            {/* Layer 1 */}
            <div className="absolute inset-0 rounded-3xl transform -rotate-[2deg] translate-y-2 -translate-x-3 border border-white/10 transition-transform duration-700 ease-out -z-10 overflow-hidden shadow-2xl opacity-80 group-hover:-rotate-[3deg] group-hover:translate-y-3 group-hover:-translate-x-4">
              <img src={currentImages[nextImgIdx1]} alt="Queue 1" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] group-hover:bg-black/20 group-hover:backdrop-blur-0 transition-all duration-700"></div>
            </div>
            
            {/* Image Container */}
            <div 
              onClick={() => setCommunityImgIdx(prev => (prev + 1) % currentImages.length)}
              className="relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-2 group-hover:rotate-0 hover:scale-[1.02] transition-all duration-700 ease-out border border-white/10 overflow-hidden"
            >
              {/* Invisible spacer to perfectly set container boundary to the image size */}
              <img 
                src={currentImages[communityImgIdx]} 
                alt="spacer" 
                className="w-full h-auto opacity-0 block transition-all duration-1000"
              />

              {currentImages.map((imgUrl, idx) => (
                <img 
                  key={idx}
                  src={imgUrl}
                  alt="Gallery"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    idx === communityImgIdx 
                      ? 'opacity-100 scale-100 group-hover:scale-105 blur-0' 
                      : 'opacity-0 scale-110 blur-sm pointer-events-none'
                  }`}
                />
              ))}

              {/* Overlay Hint */}
              <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none z-10">
                <div className="px-6 py-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-[0.2em] text-white/80 shadow-2xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span>CLICK TO SWAP</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 5. RECRUITMENT CALL TO ACTION ─── */}
      <section id="recruitment" className="relative z-10 py-48 px-6 overflow-hidden">
        {/* Background Image Masked heavily */}
        <div 
          className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage: "url('/group-photo.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed"
          }}
        ></div>
        {/* Darkening Gradients */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950"></div>

        <Reveal className="max-w-4xl mx-auto text-center relative z-20">
          <div className="inline-block p-16 rounded-[3rem] bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-4xl md:text-6xl font-light mb-6 tracking-wide text-slate-200 uppercase drop-shadow-lg">
              {landingData.recruitment.title.split('Join')[0]} 
              <span className="font-black text-brand block mt-4 text-5xl md:text-7xl">Join {landingData.recruitment.title.split('Join')[1]}</span>
            </h2>
            <div className="w-16 h-[2px] bg-brand mx-auto my-10"></div>
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              {landingData.recruitment.description}
            </p>
            <a href={landingData.recruitment.link} target="_blank" rel="noopener noreferrer" className="relative inline-flex items-center justify-center px-12 py-5 bg-brand text-slate-950 font-extrabold tracking-[0.2em] uppercase text-sm transition-all group overflow-hidden rounded-sm">
              <div className="absolute inset-0 w-0 bg-white/20 group-hover:w-full transition-all duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center shadow-none">
                {landingData.recruitment.btnText}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </a>
            {/* Pulsing glow behind button */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-20 bg-brand/30 blur-[50px] -z-10 rounded-full"></div>
          </div>
        </Reveal>
      </section>

      {/* ─── LOGO STRIP ─── */}
      <section className="relative z-20 bg-slate-950/90 py-16 px-6 border-t border-slate-900">
        <h4 className="text-center text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase mb-8">Partner Agencies & Divisions</h4>
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
              className={`h-16 md:h-20 w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-500 cursor-pointer ${logo.rounded ? 'rounded-full border border-slate-800' : ''}`} 
            />
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-20 bg-slate-950 py-12 px-6 border-t border-slate-900 text-slate-500 text-xs tracking-widest uppercase">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-slate-700" />
            <span className="font-semibold text-slate-400">San Andreas State Police</span>
          </div>
          <p className="opacity-70">© {new Date().getFullYear()} SASP. "To protect and to serve"</p>
          <div className="flex space-x-8 font-medium">
            <a href="#" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
