import { Shield, ChevronRight, Scale, ShieldCheck, Crosshair, ArrowRight } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";

export default function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans text-slate-300 relative overflow-hidden bg-slate-900"
      style={{
        backgroundImage: "url('/sasp-tall-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Global Background Overlay for better readability (Grey) */}
      <div className="fixed inset-0 z-0 bg-slate-950/60 pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="absolute top-0 w-full flex items-center justify-between px-6 py-6 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-7 h-7 bg-slate-900/80 rounded-sm border border-brand shadow-[0_0_10px_hsl(var(--brand-main)/0.4)] backdrop-blur-md rotate-45">
            <Shield className="w-5 h-5 text-brand -rotate-45" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-slate-100 drop-shadow-md">
            SASP <span className="font-light text-brand">PORTAL</span>
          </h1>
        </div>
        <nav className="hidden md:flex items-center space-x-10 font-medium text-sm tracking-widest text-slate-400">
          <a href="#" className="text-brand hover:text-brand/70 transition-colors hover:shadow-[0_0_10px_hsl(var(--brand-main)/0.5)]">HOME</a>
          <a href="#about" className="hover:text-blue-400 transition-colors">ABOUT</a>
          <a href="#community" className="hover:text-emerald-400 transition-colors">COMMUNITY</a>
          <a href="#recruitment" className="hover:text-brand transition-colors">RECRUITMENT</a>
          <LoginModal>
            <button className="px-6 py-2 bg-slate-900/80 text-emerald-500 border border-emerald-600/50 hover:bg-emerald-900/30 hover:border-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] backdrop-blur-sm tracking-widest uppercase text-xs">
              PORTAL LOGIN
            </button>
          </LoginModal>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Hero Content */}
        <div className="relative z-20 px-6 w-full max-w-5xl mx-auto text-center mt-12">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-widest mb-4 uppercase drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] text-slate-200">
            San Andreas <br /><span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand/70 via-brand to-brand">State Police</span>
          </h2>
          <div className="w-24 h-px bg-brand mx-auto my-8 shadow-[0_0_10px_hsl(var(--brand-main)/0.8)]"></div>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto font-light tracking-wide drop-shadow-md bg-slate-950/40 p-2 rounded-lg backdrop-blur-sm border border-slate-800">
            Upholding Law. <span className="text-emerald-500 font-medium">Preserving Order.</span> Protecting the Community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#recruitment" className="w-full sm:w-auto px-8 py-3 bg-brand/20 hover:bg-brand/40 text-brand border border-brand/50 font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_hsl(var(--brand-main)/0.2)] hover:shadow-[0_0_30px_hsl(var(--brand-main)/0.4)] flex items-center justify-center group backdrop-blur-md">
              Join the Force
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#community" className="w-full sm:w-auto px-8 py-3 bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border border-blue-500/50 font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center backdrop-blur-md">
              Community Resources
            </a>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="relative z-10 py-20 px-6 border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center relative z-20">
          <div className="inline-block p-4 border border-blue-900/50 bg-slate-950/60 backdrop-blur-md rotate-45 mb-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <Shield className="w-6 h-6 text-blue-500 -rotate-45 opacity-80" />
          </div>
          <p className="text-lg md:text-xl leading-loose font-light text-slate-300 bg-slate-950/60 p-8 rounded-xl backdrop-blur-sm border border-slate-800/50 shadow-xl">
            Welcome to the official portal of the San Andreas State Police (SASP). We give the utmost importance to law and order, standing as the frontline of defense across the state. Our commitment is unwavering, and our mission is clear: <br /><br /><span className="text-emerald-500 font-medium text-2xl tracking-widest uppercase">“To protect and to serve!”</span>
          </p>
        </div>
      </section>

      {/* About Us / Mission Section */}
      <section id="about" className="relative z-10 py-24 px-6 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 bg-slate-950/60 p-8 rounded-xl backdrop-blur-sm border border-slate-800/50 inline-block w-full">
            <h3 className="text-sm font-bold tracking-[0.2em] text-blue-500 uppercase mb-4">Our Mission</h3>
            <h2 className="text-3xl md:text-5xl font-light tracking-wide text-slate-100 drop-shadow-lg">Our <span className="font-bold text-brand">Prime Objective</span></h2>
            <p className="mt-8 text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
              Every individual in the SASP department works towards one unified goal: to provide elite, professional Law Enforcement to the entire community within our jurisdiction. We believe that justice, integrity, and rapid response are the cornerstones of a safe society.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 (Blue) */}
            <div className="relative group bg-slate-950/80 backdrop-blur-md p-8 border border-slate-800/50 hover:border-blue-600/50 transition-colors shadow-xl overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
              <Scale className="w-7 h-7 text-slate-500 group-hover:text-blue-500 transition-colors mb-6" />
              <h4 className="text-lg font-bold mb-3 tracking-wider text-slate-200 uppercase drop-shadow-md">Statewide Jurisdiction</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                From city streets to county highways, our troopers are equipped to handle complex emergencies and maintain peace across all of San Andreas.
              </p>
            </div>

            {/* Feature 2 (Green) */}
            <div className="relative group bg-slate-950/80 backdrop-blur-md p-8 border border-slate-800/50 hover:border-emerald-600/50 transition-colors shadow-xl overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-emerald-500 transition-colors"></div>
              <ShieldCheck className="w-7 h-7 text-slate-500 group-hover:text-emerald-500 transition-colors mb-6" />
              <h4 className="text-lg font-bold mb-3 tracking-wider text-slate-200 uppercase drop-shadow-md">Unwavering Integrity</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                We hold our officers to the highest ethical standards, ensuring transparent and fair treatment for all citizens we are sworn to protect.
              </p>
            </div>

            {/* Feature 3 (Gold) */}
            <div className="relative group bg-slate-950/80 backdrop-blur-md p-8 border border-slate-800/50 hover:border-brand/50 transition-colors shadow-xl overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-brand transition-colors"></div>
              <Crosshair className="w-7 h-7 text-slate-500 group-hover:text-brand transition-colors mb-6" />
              <h4 className="text-lg font-bold mb-3 tracking-wider text-slate-200 uppercase drop-shadow-md">Tactical Excellence</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Highly trained units stand ready to intercept and investigate criminal activity to keep our streets safe from advanced threats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Outreach Section */}
      <section id="community" className="relative z-10 py-24 px-6 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 relative">
            <div className="w-full h-[300px] border-2 border-emerald-600/30 bg-emerald-900/10 backdrop-blur-sm rounded-lg flex items-center justify-center p-8 text-center text-emerald-500/50 border-dashed">
              <span className="tracking-widest uppercase text-xs">Community Engagement</span>
            </div>
          </div>

          <div className="md:w-1/2 bg-slate-950/70 p-8 rounded-xl backdrop-blur-md border border-slate-800/50 shadow-2xl">
            <h3 className="text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase mb-2 drop-shadow-md">Community Outreach</h3>
            <h2 className="text-3xl md:text-5xl font-light mb-8 text-slate-200 drop-shadow-lg">Beyond the Badge: <br /><span className="font-bold text-blue-500">Community First</span></h2>
            <div className="space-y-6 text-slate-300 font-light leading-relaxed">
              <p>
                Law enforcement is only one side of the coin; prevention is the other. Alternatively, we don't just react to crime—we actively work to stop it before it starts.
              </p>
              <p>
                The SASP regularly organizes awareness programs and law/order campaigns designed to keep the city out of future crimes. By engaging directly with the citizens we protect, we build the mutual trust and education necessary for a thriving, secure community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment / Call to Action */}
      <section id="recruitment" className="relative z-10 py-40 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-20 bg-slate-950/80 p-12 rounded-2xl backdrop-blur-md border border-brand/20 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-wide text-slate-200 uppercase drop-shadow-lg">
            Step Up. Stand Out. <span className="font-bold text-brand block mt-2">Join SASP.</span>
          </h2>
          <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Are you ready to make a difference? We are looking for dedicated individuals with a strong moral compass and a drive for public service. As a State Police Trooper, you will receive rigorous training, dynamic career advancement opportunities, and the chance to serve on the frontlines of justice.
          </p>
          <a href="https://saspftd.web.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-10 py-5 bg-brand hover:bg-brand text-slate-950 font-extrabold tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_hsl(var(--brand-main)/0.4)] hover:shadow-[0_0_40px_hsl(var(--brand-main)/0.6)] group rounded-sm">
            Apply to the Academy
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/90 py-12 px-6 border-t border-slate-900 text-slate-500 text-xs tracking-widest uppercase backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-blue-500/50" />
            <span className="font-semibold text-slate-400">SASP</span>
          </div>
          <p>© {new Date().getFullYear()} SASP. All rights reserved. "To protect and to serve"</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
