import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, UserPlus, Users, Trash2, Shield, RefreshCw, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";

interface Employee {
  id: string;
  name: string;
  badge_number: string;
  rank: string;
  discord_tag: string;
  is_admin: boolean;
  status?: string;
  citizen_id?: string;
  phone_number?: string;
  department_join_date?: string;
  duration_in_department?: string;
  last_promotion_date?: string;
  days_since_last_promoted?: string;
  sub_department?: string;
  titles?: string;
  notes?: string;
  cert_fto?: boolean;
  cert_asd?: boolean;
  cert_heat?: boolean;
  cert_swat?: boolean;
  cert_cid?: boolean;
  cert_meu?: boolean;
  cert_k9?: boolean;
  cert_sop?: boolean;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    badge_number: "",
    rank: "Cadet",
    discord_tag: ""
  });
  
  const [csvUrl, setCsvUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // SECURITY CHECK: Verify High Command clearance
  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setIsAdmin(false);
      return;
    }

    // BOOTSTRAP CHECK: If the database is completely empty (e.g. after a migration), 
    // we must allow access so the user can run the initial sync!
    const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true });
    if (count === 0) {
      setIsAdmin(true);
      fetchEmployees();
      return;
    }

    const { data } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('discord_tag', session.user.email)
      .single();
    
    if (data?.is_admin) {
      setIsAdmin(true);
      fetchEmployees(); // Only fetch roster if they are authorized
    } else {
      setIsAdmin(false);
    }
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('rank', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching roster:", error);
    else if (data) setEmployees(data);
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...newEmployee, is_admin: false }])
      .select();

    if (error) alert("Failed to add officer: " + error.message);
    else if (data) {
      setEmployees([...employees, data[0]]);
      setNewEmployee({ name: "", badge_number: "", rank: "Cadet", discord_tag: "" });
    }
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('employees')
      .update({ is_admin: !currentStatus })
      .eq('id', id);

    if (error) alert("Failed to update clearance: " + error.message);
    else {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, is_admin: !currentStatus } : emp));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely remove this officer from the database?")) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(employees.filter(emp => emp.id !== id));
  };

  const handleSyncCSV = async () => {
    if (!csvUrl) return alert("Please enter a valid Google Sheets CSV URL.");
    setIsSyncing(true);

    try {
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as string[][];
          let added = 0;
          let updated = 0;

          // 1. Find the actual header row dynamically
          let headerIdx = -1;
          for (let i = 0; i < rows.length; i++) {
            if (rows[i].some(cell => cell && (cell.toUpperCase() === 'BADGE #' || cell.toUpperCase() === 'CALLSIGN'))) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) {
            alert("Could not find the header row containing 'BADGE #' or 'Callsign'.");
            setIsSyncing(false);
            return;
          }

          const headerRow = rows[headerIdx];
          const subHeaderRow = rows.length > headerIdx + 1 ? rows[headerIdx + 1] : [];

          // Helper to find column index (case insensitive)
          const findIdx = (row: string[], ...names: string[]) => {
            return row.findIndex(cell => names.some(n => cell && cell.toUpperCase().trim() === n.toUpperCase()));
          };

          // 2. Map column indices
          const idxName = findIdx(headerRow, 'NAME');
          const idxBadge = findIdx(headerRow, 'BADGE #', 'CALLSIGN');
          const idxRank = findIdx(headerRow, 'RANK');
          const idxDiscord = findIdx(headerRow, 'DISCORD TAG', 'EMAIL');
          const idxStatus = findIdx(headerRow, 'STATUS');
          const idxCitizenId = findIdx(headerRow, 'CITIZEN ID');
          const idxPhone = findIdx(headerRow, 'PHONE NUMBER');
          const idxJoinDate = findIdx(headerRow, 'DEPARTMENT JOIN DATE');
          const idxDuration = findIdx(headerRow, 'DURATION IN DEPARTMENT');
          const idxPromoDate = findIdx(headerRow, 'LAST PROMOTION DATE');
          const idxDaysPromo = findIdx(headerRow, 'DAYS SINCE LAST PROMOTED');
          const idxSubDept = findIdx(headerRow, 'SUB DEPT.');
          const idxTitles = findIdx(headerRow, 'TITLES');
          const idxNotes = findIdx(headerRow, 'NOTES');

          // Certifications are usually on the row directly beneath the main headers in this specific sheet
          const idxFto = findIdx(subHeaderRow, 'FTO');
          const idxAsd = findIdx(subHeaderRow, 'ASD');
          const idxHeat = findIdx(subHeaderRow, 'HEAT');
          const idxSwat = findIdx(subHeaderRow, 'SWAT');
          const idxCid = findIdx(subHeaderRow, 'CID');
          const idxMeu = findIdx(subHeaderRow, 'MEU');
          const idxK9 = findIdx(subHeaderRow, 'K-9');
          const idxSop = findIdx(subHeaderRow, 'SOP');

          if (idxName === -1 || idxBadge === -1) {
            alert("Could not find 'NAME' or 'BADGE #' columns.");
            setIsSyncing(false);
            return;
          }

          // Fetch current roster to compare
          const { data: currentRoster } = await supabase.from('employees').select('*');
          const { data: { session } } = await supabase.auth.getSession();
          
          // 3. Process data rows (start after subHeaderRow)
          for (let i = headerIdx + 2; i < rows.length; i++) {
            const row = rows[i];
            
            const name = row[idxName]?.trim();
            const badge_number = row[idxBadge]?.trim();
            
            if (!name || !badge_number) continue; // Skip invalid or blank rows

            const rank = idxRank !== -1 ? row[idxRank]?.trim() || "Cadet" : "Cadet";
            const discord_tag = idxDiscord !== -1 ? row[idxDiscord]?.trim() || null : null;
            const status = idxStatus !== -1 ? row[idxStatus]?.trim() || null : null;
            const citizen_id = idxCitizenId !== -1 ? row[idxCitizenId]?.trim() || null : null;
            const phone_number = idxPhone !== -1 ? row[idxPhone]?.trim() || null : null;
            const department_join_date = idxJoinDate !== -1 ? row[idxJoinDate]?.trim() || null : null;
            const duration_in_department = idxDuration !== -1 ? row[idxDuration]?.trim() || null : null;
            const last_promotion_date = idxPromoDate !== -1 ? row[idxPromoDate]?.trim() || null : null;
            const days_since_last_promoted = idxDaysPromo !== -1 ? row[idxDaysPromo]?.trim() || null : null;
            const sub_department = idxSubDept !== -1 ? row[idxSubDept]?.trim() || null : null;
            const titles = idxTitles !== -1 ? row[idxTitles]?.trim() || null : null;
            const notes = idxNotes !== -1 ? row[idxNotes]?.trim() || null : null;

            const parseCert = (val: string) => (val?.toUpperCase() === 'TRUE');
            const cert_fto = idxFto !== -1 ? parseCert(row[idxFto]) : false;
            const cert_asd = idxAsd !== -1 ? parseCert(row[idxAsd]) : false;
            const cert_heat = idxHeat !== -1 ? parseCert(row[idxHeat]) : false;
            const cert_swat = idxSwat !== -1 ? parseCert(row[idxSwat]) : false;
            const cert_cid = idxCid !== -1 ? parseCert(row[idxCid]) : false;
            const cert_meu = idxMeu !== -1 ? parseCert(row[idxMeu]) : false;
            const cert_k9 = idxK9 !== -1 ? parseCert(row[idxK9]) : false;
            const cert_sop = idxSop !== -1 ? parseCert(row[idxSop]) : false;

            const existing = currentRoster?.find(e => e.badge_number === badge_number || e.name === name);

            const payload = {
              name, badge_number, rank, discord_tag, status, citizen_id, phone_number,
              department_join_date, duration_in_department, last_promotion_date, days_since_last_promoted,
              sub_department, titles, notes,
              cert_fto, cert_asd, cert_heat, cert_swat, cert_cid, cert_meu, cert_k9, cert_sop
            };

            if (existing) {
              await supabase.from('employees').update(payload).eq('id', existing.id);
              updated++;
            } else {
              const isSyncUser = session?.user?.email && (discord_tag === session.user.email);
              await supabase.from('employees').insert([{ ...payload, is_admin: isSyncUser }]);
              added++;
            }
          }
          
          alert(`Database Sync Complete!\nAdded: ${added} new officers\nUpdated: ${updated} existing records`);
          fetchEmployees();
          setIsSyncing(false);
          setCsvUrl("");
        },
        error: (error: any) => {
          alert("Error parsing CSV: " + error.message);
          setIsSyncing(false);
        }
      });
    } catch (err: any) {
      alert("Error fetching CSV. Ensure it is a public 'Publish to Web' CSV link.\n" + err.message);
      setIsSyncing(false);
    }
  };

  // 🚨 RESTRICTED AREA SCREEN FOR NON-ADMINS 🚨
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <ShieldAlert className="w-32 h-32 text-rose-600 animate-pulse drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
        <div>
          <h1 className="text-5xl font-black text-white tracking-widest uppercase mb-2">Restricted Area</h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            You do not possess the required High Command security clearance to access this terminal. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    );
  }

  // LOADING SCREEN WHILE CHECKING CLEARANCE
  if (isAdmin === null) {
    return <div className="p-6 text-slate-400 flex items-center gap-2"><Shield className="w-5 h-5 animate-spin" /> Verifying security clearance...</div>;
  }

  // ✅ AUTHORIZED HIGH COMMAND VIEW ✅
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          High Command Terminal
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage departmental roster, access control, and security clearances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD NEW OFFICER FORM */}
        <Card className="bg-slate-900 border-slate-800 text-slate-200 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-400" /> Onboard Recruit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Badge Number</label>
                <input required type="text" value={newEmployee.badge_number} onChange={e => setNewEmployee({...newEmployee, badge_number: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. X-200" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Discord Tag</label>
                <input type="text" value={newEmployee.discord_tag} onChange={e => setNewEmployee({...newEmployee, discord_tag: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. username#1234" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Starting Rank</label>
                <input required type="text" value={newEmployee.rank} onChange={e => setNewEmployee({...newEmployee, rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="e.g. Cadet" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md font-medium transition-colors mt-2">
                Add to Database
              </button>
            </form>
          </CardContent>
        </Card>

        {/* GOOGLE SHEETS SYNC */}
        <Card className="bg-slate-900 border-slate-800 text-slate-200 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-emerald-400">
              <Database className="w-5 h-5" /> Sync from Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Paste a public Google Sheets CSV URL. The sheet must have headers: <strong>Name, Callsign, Rank, Discord Tag</strong>.
              </p>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={csvUrl} 
                  onChange={e => setCsvUrl(e.target.value)} 
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500" 
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" 
                />
              </div>
              <button 
                onClick={handleSyncCSV}
                disabled={isSyncing || !csvUrl}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Syncing Data...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Run Database Sync</>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ROSTER MANAGEMENT TABLE */}
        <Card className="bg-slate-900 border-slate-800 text-slate-200 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" /> Database Roster & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Officer</th>
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Discord Tag</th>
                    <th className="pb-3 font-medium">Clearance</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-white">{emp.name} <span className="text-slate-500 font-normal">({emp.badge_number})</span></td>
                      <td className="py-3 text-slate-300">{emp.rank}</td>
                      <td className="py-3 text-slate-500 text-xs">{emp.discord_tag || "Not Provided"}</td>
                      <td className="py-3">
                        <button 
                          onClick={() => handleToggleAdmin(emp.id, emp.is_admin)}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border transition-colors ${
                            emp.is_admin ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {emp.is_admin ? "Command" : "Standard"}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1" title="Delete Officer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}