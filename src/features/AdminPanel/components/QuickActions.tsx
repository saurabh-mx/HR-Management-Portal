
import { ImageIcon, Shield, Users, CalendarOff, ShieldAlert, Download, Zap } from 'lucide-react';

interface QuickActionsProps {
  isAdmin: boolean;
  isHighCommandOrHR: boolean;
  onOpenImageManagement: () => void;
  onOpenSOIToggle: () => void;
  onOpenRosterSync: () => void;
  onOpenLOASync: () => void;
  onOpenDisciplinarySync: () => void;
  onOpenPenalCodeSync: () => void;
  onOpenRoster: () => void;
}

export default function QuickActions({
  isAdmin,
  isHighCommandOrHR,
  onOpenImageManagement,
  onOpenSOIToggle,
  onOpenRosterSync,
  onOpenLOASync,
  onOpenDisciplinarySync,
  onOpenPenalCodeSync,
  onOpenRoster
}: QuickActionsProps) {
  return (
    <div className="flex flex-col h-full border border-slate-800/60 rounded-xl glass-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-200">Quick Actions</h3>
        </div>
      </div>
      
      <div className="p-5 flex-1 bg-slate-950/20 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* SECTION 1: PERSONNEL & ACCESS */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Personnel & Operations
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {/* Access Control */}
            {(isHighCommandOrHR) && (
              <button
                onClick={onOpenRoster}
                aria-label="Manage Access Control"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all shrink-0">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">Access Control</h3>
                    <p className="text-xs text-slate-400">Manage personnel & assign roles</p>
                  </div>
                </div>
              </button>
            )}

            {/* SOI Access Controls */}
            {isHighCommandOrHR && (
              <button
                onClick={onOpenSOIToggle}
                aria-label="Manage SOI Access Controls"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">SOI Controls</h3>
                    <p className="text-xs text-slate-400">Toggle sub-department applications</p>
                  </div>
                </div>
              </button>
            )}

            {/* Image Management */}
            {isAdmin && (
              <button
                onClick={onOpenImageManagement}
                aria-label="Manage Dynamic Imagery"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:scale-105 transition-all shrink-0">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">Image Management</h3>
                    <p className="text-xs text-slate-400">Upload and configure system assets</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 2: SYSTEM SYNCS */}
        {isAdmin && (
          <div className="space-y-4 mt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Data Synchronization
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Roster Sync */}
              <button
                onClick={onOpenRosterSync}
                aria-label="Synchronize Database Roster"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-left transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <div className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-blue-300 transition-colors">Roster Sync</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Import external personnel</p>
                  </div>
                </div>
              </button>

              {/* LOA Sync */}
              <button
                onClick={onOpenLOASync}
                aria-label="Synchronize LOA Records"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-left transition-all duration-300 hover:border-fuchsia-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <div className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center group-hover:bg-fuchsia-500/20 transition-colors">
                    <CalendarOff className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-fuchsia-300 transition-colors">LOA Sync</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Sync leave of absence</p>
                  </div>
                </div>
              </button>

              {/* Disciplinary Sync */}
              <button
                onClick={onOpenDisciplinarySync}
                aria-label="Synchronize Disciplinary Records"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-left transition-all duration-300 hover:border-rose-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <div className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-rose-300 transition-colors">Discipline</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Import strikes/warnings</p>
                  </div>
                </div>
              </button>

              {/* Penal Code Sync */}
              <button
                onClick={onOpenPenalCodeSync}
                aria-label="Synchronize Penal Code"
                className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-left transition-all duration-300 hover:border-sky-500/50 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <div className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <Download className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-sky-300 transition-colors">Penal Code</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Update charge lists</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
