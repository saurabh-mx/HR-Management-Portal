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
  role?: string;
  department?: string;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    badge_number: "",
    rank: "Cadet",
    discord_tag: ""
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "Patrol Officer", department: "SASP" });

  const [stagedEmployees, setStagedEmployees] = useState<any[]>([]);
  const [selectedStagedIds, setSelectedStagedIds] = useState<Set<string>>(new Set());

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

    const discordId = session.user.email.split('@')[0];
    const { data } = await supabase
      .from('employees')
      .select('is_admin, role')
      .eq('discord_tag', discordId)
      .single();
    
    if (data?.is_admin) {
      setIsAdmin(true);
      setCurrentUserRole(data.role || "");
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
    
    const isDuplicate = employees.some(
      emp => emp.name.toLowerCase() === newEmployee.name.toLowerCase() || 
             emp.badge_number === newEmployee.badge_number
    );

    if (isDuplicate) {
      alert(`An officer with the name "${newEmployee.name}" or callsign "${newEmployee.badge_number}" already exists!`);
      return;
    }

    const defaultDiscordTag = newEmployee.name.toLowerCase().replace(/\s+/g, '.');
    const finalDiscordTag = newEmployee.discord_tag || defaultDiscordTag;
    
    const { data, error } = await supabase
      .from('employees')
      .insert([{ 
        ...newEmployee, 
        discord_tag: finalDiscordTag,
        is_admin: false, 
        role: 'Patrol Officer', 
        department: 'SASP',
        status: 'ACTIVE'
      }])
      .select();

    if (error) alert("Failed to add officer: " + error.message);
    else if (data) {
      setEmployees([...employees, data[0]]);
      setNewEmployee({ name: "", badge_number: "", rank: "Cadet", discord_tag: "" });
    }
  };

  // Removed handleToggleAdmin since clearance is now derived from role

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely remove this officer from the database?")) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(employees.filter(emp => emp.id !== id));
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setEditForm({ role: emp.role || 'Patrol Officer', department: emp.department || 'SASP' });
  };

  const handleSaveEdit = async (id: string) => {
    const isAdmin = ['admin', 'High Command', 'Command', 'HR'].includes(editForm.role);
    const { error } = await supabase
      .from('employees')
      .update({ role: editForm.role, department: editForm.department, is_admin: isAdmin })
      .eq('id', id);

    if (error) alert("Failed to update: " + error.message);
    else {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...editForm, is_admin: isAdmin } : emp));
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const getRoleWeight = (r: string) => {
    if (r === 'admin') return 4;
    if (r === 'High Command') return 3;
    if (r === 'Command') return 2;
    if (r === 'HR') return 1;
    return 0;
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
          
          // 3. Process data rows (start after subHeaderRow)
          const stagedData: any[] = [];
          for (let i = headerIdx + 2; i < rows.length; i++) {
            const row = rows[i];
            
            const name = row[idxName]?.trim();
            const badge_number = row[idxBadge]?.trim();
            
            if (!name || !badge_number) continue; // Skip invalid or blank rows

            const rank = idxRank !== -1 ? row[idxRank]?.trim() || "Cadet" : "Cadet";
            const discord_tag = idxDiscord !== -1 ? row[idxDiscord]?.trim() || null : null;
            const status = (idxStatus !== -1 && row[idxStatus]?.trim()) ? row[idxStatus].trim() : 'ACTIVE';
            
            // Default Portal ID: name.lastname (e.g. kevin.johnson)
            const generatedDiscordTag = name.toLowerCase().replace(/\s+/g, '.');
            const final_discord_tag = discord_tag || generatedDiscordTag;

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

            const safeString = (val: any) => String(val || "").trim().toLowerCase();
            const bBadge = safeString(badge_number);
            const bName = safeString(name);

            const isMatch = (e: any) => 
              safeString(e.badge_number) === bBadge || 
              safeString(e.name) === bName;

            const hasDuplicateInStaged = stagedData.find(isMatch);
            if (hasDuplicateInStaged) continue;

            const existing = currentRoster?.find(isMatch);
            const r = existing ? existing.role : 'Patrol Officer';
            const derivedIsAdmin = ['admin', 'High Command', 'Command', 'HR'].includes(r);

            const payload = {
              _staged_id: Math.random().toString(36).substring(7),
              _is_existing: !!existing,
              _db_id: existing?.id,
              name, badge_number, rank, discord_tag: final_discord_tag, status, citizen_id, phone_number,
              department_join_date, duration_in_department, last_promotion_date, days_since_last_promoted,
              sub_department, titles, notes,
              cert_fto, cert_asd, cert_heat, cert_swat, cert_cid, cert_meu, cert_k9, cert_sop,
              is_admin: derivedIsAdmin,
              role: r,
              department: existing ? existing.department : 'SASP'
            };
            
            stagedData.push(payload);
          }
          
          setStagedEmployees(stagedData);
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

  const handleBulkUpdate = (field: 'role' | 'department', value: string) => {
    setStagedEmployees(stagedEmployees.map(emp => {
      if (selectedStagedIds.has(emp._staged_id)) {
        const isAdmin = field === 'role' ? ['admin', 'High Command', 'Command', 'HR'].includes(value) : emp.is_admin;
        return { ...emp, [field]: value, is_admin: isAdmin };
      }
      return emp;
    }));
  };

  const handleCommitStaged = async () => {
    const selected = stagedEmployees.filter(emp => selectedStagedIds.has(emp._staged_id));
    if (selected.length === 0) return alert("Select at least one record to import.");
    
    let added = 0;
    let updated = 0;
    
    for (const emp of selected) {
       const { _staged_id, _is_existing, _db_id, ...dbPayload } = emp;
       
       if (_is_existing) {
         const { error } = await supabase.from('employees').update(dbPayload).eq('id', _db_id);
         if (!error) updated++;
         else console.error("Update error for", emp.name, error);
       } else {
         const { error } = await supabase.from('employees').insert([dbPayload]);
         if (!error) added++;
         else console.error("Insert error for", emp.name, error);
       }
    }
    
    alert(`Database Sync Complete!\nAdded: ${added} new officers\nUpdated: ${updated} existing records`);
    setStagedEmployees([]);
    setSelectedStagedIds(new Set());
    fetchEmployees();
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStagedIds(new Set(stagedEmployees.map(e => e._staged_id)));
    } else {
      setSelectedStagedIds(new Set());
    }
  };

  const handleToggleStaged = (id: string) => {
    const newSet = new Set(selectedStagedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStagedIds(newSet);
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

        {stagedEmployees.length > 0 && (
          <Card className="bg-slate-900 border-amber-500/50 text-slate-200 lg:col-span-3">
             <CardHeader>
               <CardTitle className="text-amber-400">Review Pending Imports</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="mb-4 flex gap-4 flex-wrap">
                  <div className="flex flex-col gap-2 p-2 border border-slate-800 rounded bg-slate-950">
                    <span className="text-xs text-slate-500 font-medium">Bulk Set Department</span>
                    <div className="flex gap-2">
                       <button onClick={() => handleBulkUpdate('department', 'SASP')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">SASP</button>
                       <button onClick={() => handleBulkUpdate('department', 'LSPD')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">LSPD</button>
                       <button onClick={() => handleBulkUpdate('department', 'BCSO')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">BCSO</button>
                       <button onClick={() => handleBulkUpdate('department', 'SAPR')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">SAPR</button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-2 border border-slate-800 rounded bg-slate-950">
                    <span className="text-xs text-slate-500 font-medium">Bulk Set Role</span>
                    <div className="flex gap-2">
                       {getRoleWeight(currentUserRole) >= 4 && <button onClick={() => handleBulkUpdate('role', 'admin')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">admin</button>}
                       {getRoleWeight(currentUserRole) >= 3 && <button onClick={() => handleBulkUpdate('role', 'High Command')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">High Command</button>}
                       {getRoleWeight(currentUserRole) >= 2 && <button onClick={() => handleBulkUpdate('role', 'Command')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">Command</button>}
                       {getRoleWeight(currentUserRole) >= 1 && <button onClick={() => handleBulkUpdate('role', 'HR')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">HR</button>}
                       <button onClick={() => handleBulkUpdate('role', 'Patrol Officer')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">Patrol Officer</button>
                       <button onClick={() => handleBulkUpdate('role', 'Student')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded">Student</button>
                    </div>
                  </div>
                  
                  <div className="ml-auto flex items-end gap-2">
                     <button onClick={() => setStagedEmployees([])} className="px-4 py-2 border border-rose-900/50 hover:bg-rose-900/20 text-rose-400 text-sm font-medium rounded transition-colors">Cancel Preview</button>
                     <button onClick={handleCommitStaged} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50" disabled={selectedStagedIds.size === 0}>Commit {selectedStagedIds.size} Selected</button>
                  </div>
               </div>
               
               <div className="max-h-96 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-900">
                     <tr>
                       <th className="p-2"><input type="checkbox" checked={selectedStagedIds.size === stagedEmployees.length && stagedEmployees.length > 0} onChange={e => handleToggleSelectAll(e.target.checked)} className="rounded border-slate-700 bg-slate-800" /></th>
                       <th className="p-2">Name</th>
                       <th className="p-2">Callsign</th>
                       <th className="p-2">Rank</th>
                       <th className="p-2">Role</th>
                       <th className="p-2">Dept</th>
                       <th className="p-2">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/60">
                     {stagedEmployees.map(emp => (
                       <tr key={emp._staged_id} className="hover:bg-slate-800/40">
                         <td className="p-2"><input type="checkbox" checked={selectedStagedIds.has(emp._staged_id)} onChange={() => handleToggleStaged(emp._staged_id)} className="rounded border-slate-700 bg-slate-800" /></td>
                         <td className="p-2 font-medium">{emp.name}</td>
                         <td className="p-2 text-slate-400">{emp.badge_number}</td>
                         <td className="p-2 text-slate-400">{emp.rank}</td>
                         <td className="p-2 text-amber-300">{emp.role}</td>
                         <td className="p-2 text-blue-300">{emp.department}</td>
                         <td className="p-2 font-medium">{emp._is_existing ? <span className="text-amber-500">UPDATE</span> : <span className="text-emerald-500">NEW</span>}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </CardContent>
          </Card>
        )}

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
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => {
                    const canEdit = getRoleWeight(currentUserRole) >= getRoleWeight(emp.role || "");

                    return (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-white">{emp.name} <span className="text-slate-500 font-normal">({emp.badge_number})</span></td>
                      <td className="py-3 text-slate-300">{emp.rank}</td>
                      {editingId === emp.id ? (
                        <>
                          <td className="py-3">
                            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="bg-slate-950 border border-slate-700 rounded text-xs p-1 text-white">
                              {getRoleWeight(currentUserRole) >= 4 && <option value="admin">admin</option>}
                              {getRoleWeight(currentUserRole) >= 3 && <option value="High Command">High Command</option>}
                              {getRoleWeight(currentUserRole) >= 2 && <option value="Command">Command</option>}
                              {getRoleWeight(currentUserRole) >= 1 && <option value="HR">HR</option>}
                              <option value="Patrol Officer">Patrol Officer</option>
                              <option value="Student">Student</option>
                            </select>
                          </td>
                          <td className="py-3">
                            <select value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="bg-slate-950 border border-slate-700 rounded text-xs p-1 text-white">
                              <option value="SASP">SASP</option>
                              <option value="LSPD">LSPD</option>
                              <option value="BCSO">BCSO</option>
                              <option value="SAPR">SAPR</option>
                            </select>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 text-slate-400 text-sm">{emp.role || "Patrol Officer"}</td>
                          <td className="py-3 text-slate-400 text-sm">{emp.department || "SASP"}</td>
                        </>
                      )}
                      <td className="py-3 text-right">
                        {editingId === emp.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleSaveEdit(emp.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Save</button>
                            <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-400 text-xs font-medium">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            {canEdit ? (
                              <>
                                <button onClick={() => handleEditClick(emp)} className="text-slate-500 hover:text-blue-400 transition-colors text-xs font-medium uppercase tracking-wider" title="Edit Role/Dept">
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-500 hover:text-rose-400 transition-colors" title="Delete Officer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-600 font-medium italic">Restricted</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}