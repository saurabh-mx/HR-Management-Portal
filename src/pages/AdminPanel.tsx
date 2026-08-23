import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, ShieldCheck, UserPlus, Users, Trash2, Shield, RefreshCw, Database, Link as LinkIcon, Edit2, Plus, X, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import { useAuth } from "@/context/AuthContext";
import { logAuditAction } from "@/lib/auditLogger";
import LOASyncModal from "@/components/admin/LOASyncModal";
import DataSyncModal from "@/components/admin/DataSyncModal";
import { CalendarOff } from "lucide-react";

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
  const { adminSafeMode } = useAuth();
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
  const [isCommitting, setIsCommitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [showLOASyncModal, setShowLOASyncModal] = useState(false);
  const [showDataSyncModal, setShowDataSyncModal] = useState(false);

  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterRoleFilter, setRosterRoleFilter] = useState("All");

  const [savedSyncs, setSavedSyncs] = useState<{ id: string, name: string, url: string }[]>([]);
  const [newSyncName, setNewSyncName] = useState("");
  const [newSyncUrl, setNewSyncUrl] = useState("");
  const [editingSyncId, setEditingSyncId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
    try {
      const saved = localStorage.getItem("saved_sync_links");
      if (saved) setSavedSyncs(JSON.parse(saved));
    } catch (e) { }
  }, []);

  const handleSaveSyncLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSyncName || !newSyncUrl) return;

    let updatedSyncs;
    if (editingSyncId) {
      updatedSyncs = savedSyncs.map(s => s.id === editingSyncId ? { ...s, name: newSyncName, url: newSyncUrl } : s);
    } else {
      updatedSyncs = [...savedSyncs, { id: Math.random().toString(36).substring(7), name: newSyncName, url: newSyncUrl }];
    }

    setSavedSyncs(updatedSyncs);
    localStorage.setItem("saved_sync_links", JSON.stringify(updatedSyncs));
    setNewSyncName("");
    setNewSyncUrl("");
    setEditingSyncId(null);
  };

  const handleDeleteSyncLink = (id: string) => {
    if (!window.confirm("Delete this saved sync link?")) return;
    const updatedSyncs = savedSyncs.filter(s => s.id !== id);
    setSavedSyncs(updatedSyncs);
    localStorage.setItem("saved_sync_links", JSON.stringify(updatedSyncs));
  };

  const handleEditSyncLink = (sync: { id: string, name: string, url: string }) => {
    setEditingSyncId(sync.id);
    setNewSyncName(sync.name);
    setNewSyncUrl(sync.url);
  };

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
      .select('*');

    if (error) console.error("Error fetching roster:", error);
    else if (data) {
      const departmentOrder = ["SASP", "SAPR", "LSPD", "BCSO", "SASP Academy"];
      const rankOrder = [
        ["Chief", "Sheriff", "Game Warden"],
        ["Asst. Chief", "Colonel", "Asst. Game Warden"],
        ["Captain", "major", "Lead Ranger"],
        ["Lieutenant"],
        ["Head-Sergeant"],
        ["Sergeant First Class"],
        ["Sergeant"],
        ["Corporal"],
        ["Senior-Officer", "Senior-deputy", "Senior-ranger"],
        ["Officer First Class", "deputy First Class", "ranger First Class"],
        ["Officer", "deputy", "ranger"]
      ];

      const getDeptIndex = (dept?: string) => {
        if (!dept) return 999;
        const i = departmentOrder.indexOf(dept);
        return i === -1 ? 999 : i;
      };

      const getRankIndex = (rank?: string) => {
        if (!rank) return 999;
        const lowerRank = rank.toLowerCase();
        for (let i = 0; i < rankOrder.length; i++) {
          if (rankOrder[i].some(r => r.toLowerCase() === lowerRank)) {
            return i;
          }
        }
        return 999;
      };

      const sorted = [...data].sort((a, b) => {
        const deptDiff = getDeptIndex(a.department) - getDeptIndex(b.department);
        if (deptDiff !== 0) return deptDiff;

        const rankDiff = getRankIndex(a.rank) - getRankIndex(b.rank);
        if (rankDiff !== 0) return rankDiff;

        return (a.badge_number || "").localeCompare(b.badge_number || "");
      });
      setEmployees(sorted);
    }
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
      logAuditAction("PERSONNEL_ADDED", newEmployee.name, `Manually added to roster (SASP - ${newEmployee.rank})`);
      setEmployees([...employees, data[0]]);
      setNewEmployee({ name: "", badge_number: "", rank: "Cadet", discord_tag: "" });
    }
  };

  // Removed handleToggleAdmin since clearance is now derived from role

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely remove this officer from the database?")) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      const emp = employees.find(e => e.id === id);
      if (emp) logAuditAction("PERSONNEL_REMOVED", emp.name, "Removed from database by Admin");
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setEditForm({ role: emp.role || 'Patrol Officer', department: emp.department || 'SASP' });
  };

  const handleSaveEdit = async (id: string) => {
    const isAdmin = editForm.role === 'admin';
    const { error } = await supabase
      .from('employees')
      .update({ role: editForm.role, department: editForm.department, is_admin: isAdmin })
      .eq('id', id);

    if (error) alert("Failed to update: " + error.message);
    else {
      const emp = employees.find(e => e.id === id);
      if (emp) logAuditAction("PERSONNEL_UPDATED", emp.name, `Updated Role to ${editForm.role} and Dept to ${editForm.department}`);
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...editForm, is_admin: isAdmin } : emp));
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const getRoleWeight = (r: string) => {
    if (r === 'admin') return 4;
    return 0;
  };

  const handleSyncCSV = async (eOrUrl?: any) => {
    const urlToUse = typeof eOrUrl === 'string' ? eOrUrl : csvUrl;
    if (!urlToUse) return alert("Please enter a valid Google Sheets CSV URL.");
    setIsSyncing(true);

    try {
      const response = await fetch(urlToUse);
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
        const isAdmin = field === 'role' ? value === 'admin' : emp.is_admin;
        return { ...emp, [field]: value, is_admin: isAdmin };
      }
      return emp;
    }));
  };

  const handleCommitStaged = async () => {
    if (isCommitting) return;
    setIsCommitting(true);
    const selected = stagedEmployees.filter(emp => selectedStagedIds.has(emp._staged_id));
    if (selected.length === 0) {
      setIsCommitting(false);
      return alert("Select at least one record to import.");
    }

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

    if (added > 0 || updated > 0) {
      logAuditAction("MASTER_SYNC", "Multiple", `Synced DB: ${added} added, ${updated} updated via CSV import`);
    }

    alert(`Database Sync Complete!\nAdded: ${added} new officers\nUpdated: ${updated} existing records`);
    setStagedEmployees([]);
    setSelectedStagedIds(new Set());
    fetchEmployees();
    setIsCommitting(false);
    setShowConfirmModal(false);
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

  const filteredEmployees = employees.filter(emp => {
    const q = rosterSearch.toLowerCase();
    const matchesSearch = !q || emp.name.toLowerCase().includes(q) || (emp.badge_number || '').toLowerCase().includes(q);
    const matchesRole = rosterRoleFilter === 'All' || (emp.role || 'Patrol Officer') === rosterRoleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      'admin': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      'High Command': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'Command': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'HR': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      'Supervisor': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      'Patrol Officer': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      'Student': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
    return styles[role] || styles['Patrol Officer'];
  };

  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      'SASP': 'text-blue-400',
      'LSPD': 'text-sky-400',
      'BCSO': 'text-amber-400',
      'SAPR': 'text-emerald-400',
      'SASP Academy': 'text-violet-400',
    };
    return colors[dept] || 'text-slate-400';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-transparent min-h-full">

      {/* ─── HEADER ─── */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Command Center
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  HIGH COMMAND TERMINAL • AUTHORIZED ACCESS
                </p>
              </div>
            </div>
          </div>

          {/* Stats Chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{employees.length}</span>
              <span className="text-xs text-slate-500">Personnel</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">System Online</span>
            </div>
          </div>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-brand/40 via-slate-800 to-transparent" />
      </div>

      {/* ─── QUICK ACTIONS ROW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Directory Imports */}
        <button
          onClick={() => setShowDataSyncModal(true)}
          disabled={showDataSyncModal}
          className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-5 text-left transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/60 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] disabled:opacity-60"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              {showDataSyncModal ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <Database className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Directory Imports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {showDataSyncModal ? "Fetching data..." : "Sync roster from Google Sheets"}
              </p>
            </div>
          </div>
        </button>

        {/* LOA Sync */}
        <button
          onClick={() => setShowLOASyncModal(true)}
          disabled={showLOASyncModal}
          className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-5 text-left transition-all duration-300 hover:border-fuchsia-500/40 hover:bg-slate-900/60 hover:shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)] disabled:opacity-60"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-fuchsia-500/20 transition-colors">
              <CalendarOff className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Sync LOA Records</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Import leave of absences from Sheets</p>
            </div>
          </div>
        </button>

        {/* Onboard Count / Quick Stat */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-5 text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">Access Overview</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-500"><span className="text-amber-400 font-semibold">{employees.filter(e => e.role === 'admin' || e.role === 'High Command').length}</span> HC</span>
                <span className="text-xs text-slate-500"><span className="text-blue-400 font-semibold">{employees.filter(e => e.role === 'Command').length}</span> CMD</span>
                <span className="text-xs text-slate-500"><span className="text-violet-400 font-semibold">{employees.filter(e => e.role === 'HR').length}</span> HR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ONBOARD RECRUIT ─── */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center gap-2.5">
          <UserPlus className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Onboard Recruit</h2>
        </div>
        <div className="p-5">
          <form onSubmit={handleAddEmployee} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px] space-y-1">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Full Name</label>
              <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors" placeholder="e.g. John Doe" />
            </div>
            <div className="w-[140px] space-y-1">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Callsign</label>
              <input required type="text" value={newEmployee.badge_number} onChange={e => setNewEmployee({ ...newEmployee, badge_number: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors" placeholder="e.g. X-200" />
            </div>
            <div className="flex-1 min-w-[160px] space-y-1">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Discord Tag</label>
              <input type="text" value={newEmployee.discord_tag} onChange={e => setNewEmployee({ ...newEmployee, discord_tag: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors" placeholder="e.g. username#1234" />
            </div>
            <div className="w-[130px] space-y-1">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rank</label>
              <input required type="text" value={newEmployee.rank} onChange={e => setNewEmployee({ ...newEmployee, rank: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors" placeholder="e.g. Cadet" />
            </div>
            <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-sm transition-all hover:shadow-lg hover:shadow-rose-600/20 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
      </div>

      {/* ─── ROSTER TABLE ─── */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md overflow-hidden">
        {/* Table Header with Search & Filters */}
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Database Roster & Access Control</h2>
              <span className="text-xs text-slate-600 font-medium ml-1">
                {filteredEmployees.length === employees.length ? employees.length : `${filteredEmployees.length} / ${employees.length}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80 text-xs text-white focus:ring-1 focus:ring-brand/50 focus:border-brand/50 placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>
          </div>
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {["All", "admin", "High Command", "Command", "HR", "Supervisor", "Patrol Officer", "Student"].map(role => (
              <button
                key={role}
                onClick={() => setRosterRoleFilter(role)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  rosterRoleFilter === role
                    ? "bg-brand/15 text-brand border border-brand/30 shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto px-5 pb-5 pt-2">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">Officer</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">Rank</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">Role</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/60">Department</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right border-b border-slate-800/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const canEdit = getRoleWeight(currentUserRole) >= getRoleWeight(emp.role || "");
                const role = emp.role || 'Patrol Officer';
                const dept = emp.department || 'SASP';

                return (
                  <tr key={emp.id} className="bg-slate-900/30 hover:bg-slate-800/80 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-2xl shadow-[inset_2px_0_0_0_rgba(var(--brand-main),0.5)] hover:shadow-[inset_4px_0_0_0_rgba(var(--brand-main),1),_0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-lg">
                    <td className="px-5 py-3 rounded-l-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400 uppercase flex-shrink-0 group-hover:border-brand/30 transition-colors">
                          {emp.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white leading-tight">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{emp.badge_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{emp.rank}</td>
                    {editingId === emp.id ? (
                      <>
                        <td className="px-4 py-3">
                          <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-white focus:ring-1 focus:ring-brand/50">
                            {getRoleWeight(currentUserRole) >= 4 && <option value="admin">admin</option>}
                            {getRoleWeight(currentUserRole) >= 3 && <option value="High Command">High Command</option>}
                            {getRoleWeight(currentUserRole) >= 2 && <option value="Command">Command</option>}
                            {getRoleWeight(currentUserRole) >= 1 && <option value="HR">HR</option>}
                            <option value="Supervisor">Supervisor</option>
                            <option value="Patrol Officer">Patrol Officer</option>
                            <option value="Student">Student</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="bg-slate-950 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-white focus:ring-1 focus:ring-brand/50">
                            <option value="SASP">SASP</option>
                            <option value="LSPD">LSPD</option>
                            <option value="BCSO">BCSO</option>
                            <option value="SAPR">SAPR</option>
                            <option value="SASP Academy">SASP Academy</option>
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadge(role)}`}>
                            {role}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${getDeptColor(dept)}`}>{dept}</td>
                      </>
                    )}
                    <td className="px-5 py-3 text-right rounded-r-lg">
                      {editingId === emp.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleSaveEdit(emp.id)} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors">Save</button>
                          <button onClick={handleCancelEdit} className="px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-400 hover:bg-slate-700 text-xs font-medium transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {canEdit ? (
                            <>
                              <button onClick={() => handleEditClick(emp)} className="p-1.5 rounded-md text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Edit Role/Dept">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {adminSafeMode && (
                                <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Delete Officer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-medium italic px-2">Restricted</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No personnel found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <LOASyncModal 
        isOpen={showLOASyncModal} 
        onClose={() => setShowLOASyncModal(false)} 
        onSuccess={() => {}} 
      />

      <DataSyncModal 
        isOpen={showDataSyncModal} 
        onClose={() => setShowDataSyncModal(false)} 
        onSuccess={() => fetchEmployees()} 
      />

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-950 border-slate-800 shadow-2xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Database Sync</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              You are about to commit {selectedStagedIds.size} records to the database. This action will add new officers and update existing ones. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:space-x-2 space-y-2 sm:space-y-0 flex-col sm:flex-row">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
              disabled={isCommitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCommitStaged}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
              disabled={isCommitting}
            >
              {isCommitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Committing...</>
              ) : (
                "Confirm Import"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}