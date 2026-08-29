import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from '@/auth/hooks/useAuth';
import { canReviewSOI, isHighCommandOrHR } from '@/auth/roles/roleMatrix';

interface SOISetting {
  department: string;
  is_open: boolean;
}

const ALL_DEPARTMENTS = ["HEAT", "FTD", "ASD", "K9", "MEDIA TEAM", "DOC", "SBI", "MEU", "DAO"];

export default function SOITogglePanel() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SOISetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // A user is authorized to see this panel if they can review AT LEAST one department
  // We'll calculate this dynamically after fetching settings
  const [authorizedDepartments, setAuthorizedDepartments] = useState<Set<string>>(new Set());
  const isGlobalAdmin = isHighCommandOrHR(profile);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let { data, error } = await supabase
        .from('soi_settings')
        .select('*')
        .order('department');

      if (error) {
        // Suppress table not found error and just show friendly message
        if (error.code === '42P01') {
          setErrorMsg("Settings table not found. Please run the SQL migration.");
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        // Self-heal: Insert any missing departments
        const existingDepts = new Set(data.map(d => d.department));
        const missingDepts = ALL_DEPARTMENTS.filter(d => !existingDepts.has(d));
        
        if (missingDepts.length > 0) {
          const { data: insertedData, error: insertError } = await supabase
            .from('soi_settings')
            .insert(missingDepts.map(d => ({ department: d, is_open: true })))
            .select();
            
          if (!insertError && insertedData) {
            data = [...data, ...insertedData];
            data.sort((a, b) => a.department.localeCompare(b.department));
          }
        }

        setSettings(data);
        
        // Calculate which departments the current user can toggle
        const authDepts = new Set<string>();
        data.forEach(dept => {
          if (isGlobalAdmin || canReviewSOI(profile, dept.department)) {
            authDepts.add(dept.department);
          }
        });
        setAuthorizedDepartments(authDepts);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggle = async (department: string, currentStatus: boolean) => {
    if (!authorizedDepartments.has(department)) return;
    
    // Optimistic UI update
    const newStatus = !currentStatus;
    setSettings(prev => prev.map(s => s.department === department ? { ...s, is_open: newStatus } : s));

    try {
      const { error } = await supabase
        .from('soi_settings')
        .update({ 
          is_open: newStatus,
          updated_by: `${profile?.name} (${profile?.badge_number})`,
          updated_at: new Date().toISOString()
        })
        .eq('department', department);

      if (error) throw error;
      
      logAuditAction(
        "SOI_STATUS_TOGGLED",
        "System",
        `${newStatus ? 'Opened' : 'Closed'} SOI applications for ${department}`,
        `${profile?.name} (${profile?.badge_number})`
      );
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setSettings(prev => prev.map(s => s.department === department ? { ...s, is_open: currentStatus } : s));
      alert("Failed to update status: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <DialogContent className="max-w-md p-6 bg-slate-950 border border-slate-800/60 text-slate-400 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </DialogContent>
    );
  }

  if (errorMsg) {
    return (
      <DialogContent className="max-w-md p-6 bg-slate-950 border border-rose-500/30 text-rose-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {errorMsg}
      </DialogContent>
    );
  }

  // If user cannot toggle ANY departments, don't show the panel
  if (authorizedDepartments.size === 0) {
    return null;
  }

  return (
    <DialogContent className="max-w-md p-0 bg-slate-950 border border-slate-800/60 text-slate-200 overflow-hidden rounded-xl shadow-2xl flex flex-col">
      <DialogHeader className="hidden">
        <DialogTitle>SOI Access Controls</DialogTitle>
      </DialogHeader>
      
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-wider uppercase">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          SOI Controls
        </h2>
        <p className="text-[11px] text-slate-500 font-medium ml-[52px] -mt-1">Manage SOI application open/close status.</p>
      </div>

      <div className="p-0 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-950/40">
        <div className="divide-y divide-slate-800/50">
          {settings.filter(setting => authorizedDepartments.has(setting.department)).map((setting) => {
            return (
              <div key={setting.department} className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-800/40`}>
                <div>
                  <h4 className="font-semibold text-slate-200">{setting.department}</h4>
                  <p className="text-xs text-slate-500">
                    {setting.is_open ? 'Currently accepting applications.' : 'Applications are closed.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${setting.is_open ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {setting.is_open ? 'Open' : 'Closed'}
                  </span>
                  
                  <button
                    onClick={() => handleToggle(setting.department, setting.is_open)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                      setting.is_open ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        setting.is_open ? 'translate-x-6' : 'translate-x-1'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DialogContent>
  );
}
