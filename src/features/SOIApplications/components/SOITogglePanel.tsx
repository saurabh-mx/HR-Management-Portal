import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      <Card className="glass-panel overflow-hidden">
        <CardContent className="flex items-center justify-center p-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
        </CardContent>
      </Card>
    );
  }

  if (errorMsg) {
    return (
      <Card className="glass-panel border-rose-500/30 overflow-hidden">
        <CardContent className="p-6 text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errorMsg}
        </CardContent>
      </Card>
    );
  }

  // If user cannot toggle ANY departments, don't show the panel
  if (authorizedDepartments.size === 0) {
    return null;
  }

  return (
    <Card className="glass-panel overflow-hidden relative group transition-all duration-300">
      <CardHeader className="border-b border-slate-800/60 bg-slate-900/40 pb-4">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield className="w-5 h-5" /> SOI Access Controls
          </div>
        </CardTitle>
        <p className="text-xs text-slate-400">Manage whether your department is accepting new SOI applications.</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800/50 max-h-[300px] overflow-y-auto custom-scrollbar">
          {settings.filter(setting => authorizedDepartments.has(setting.department)).map((setting) => {
            const canToggle = true; // since we filtered, they can always toggle what they see
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
                    disabled={!canToggle}
                    onClick={() => handleToggle(setting.department, setting.is_open)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      setting.is_open ? 'bg-emerald-500' : 'bg-slate-700'
                    } ${!canToggle && 'cursor-not-allowed opacity-50'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.is_open ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
