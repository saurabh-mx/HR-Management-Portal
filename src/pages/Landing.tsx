import { Shield } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="absolute top-0 w-full flex items-center justify-between px-6 py-4 z-50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-transparent rounded-full border-2 border-white/80">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">SAN ANDREAS STATE POLICE</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-8 font-medium text-sm text-slate-200 drop-shadow-md">
          <a href="#" className="text-white font-semibold hover:text-blue-400 transition-colors">HOME</a>
          <a href="#" className="hover:text-blue-400 transition-colors">DIVISIONS</a>
          <a href="#" className="hover:text-blue-400 transition-colors">RECRUITMENT</a>
          <a href="#" className="hover:text-blue-400 transition-colors">COMMUNITY</a>
          <LoginModal>
            <button className="px-4 py-2 bg-blue-600/80 text-white rounded-md hover:bg-blue-600 transition-colors backdrop-blur-sm border border-blue-500/50">
              STAFF LOGIN
            </button>
          </LoginModal>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative flex items-center">
        {/* Background Overlay & Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-900/60 z-10" />
          <img 
            src="/sasp-bg.png" 
            alt="Police Background" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 px-6 md:px-16 w-full max-w-6xl mx-auto text-white">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 uppercase drop-shadow-lg leading-tight">
            SASP: SPECIALIZED OPERATIONS &<br />COMMUNITY SERVICE
          </h2>
          <p className="text-xl md:text-2xl text-slate-100 mb-8 max-w-2xl font-medium drop-shadow-md">
            Dedicated to the safety of San Andreas. Explore our units and join the team.
          </p>
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-md transition-all shadow-lg hover:shadow-blue-600/25">
            LEARN MORE ABOUT SASP
          </button>
        </div>
      </main>
    </div>
  );
}
