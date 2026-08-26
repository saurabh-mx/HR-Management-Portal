import { useState, useEffect } from "react";
import { Database, Link as LinkIcon, RefreshCw, X, AlertTriangle, Play, Save, CheckCircle2 } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { fetchAllEmployees, runGlobalAutoSync } from "@/lib/sync/syncService";
import { useAuth } from '@/auth/hooks/useAuth';
import { isTrueAdmin } from '@/auth/roles/roleMatrix';
import Papa from "papaparse";

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DataSyncModal({ isOpen, onClose, onSuccess }: DataSyncModalProps) {
  const { profile, adminSafeMode } = useAuth();
  const hasEditAccess = adminSafeMode || isTrueAdmin(profile);
  const [csvUrl, setCsvUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [stagedEmployees, setStagedEmployees] = useState<any[]>([]);
  const [selectedStagedIds, setSelectedStagedIds] = useState<Set<string>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{added: number, updated: number, deleted?: number} | null>(null);
  const [savedSyncs, setSavedSyncs] = useState<{name: string, url: string, lastSync: string, isAutoSync?: boolean, defaultDept?: string, lastSyncStatus?: 'success' | 'error'}[]>([]);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [syncProfileName, setSyncProfileName] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const next = { ...prev };
        let needsUpdate = false;
        
        savedSyncs.forEach((sync, idx) => {
          if (sync.isAutoSync) {
            if (next[idx] === undefined) {
              next[idx] = 300;
              needsUpdate = true;
            } else if (next[idx] > 0) {
              next[idx] -= 1;
              needsUpdate = true;
            } else {
              if (sync.url) {
                runGlobalAutoSync([{ url: sync.url, defaultDept: sync.defaultDept }]).then(() => {
                  setSavedSyncs(prevSyncs => {
                    const newSyncs = prevSyncs.map(s => {
                      if (s.url === sync.url) return { ...s, lastSync: new Date().toLocaleString(), lastSyncStatus: 'success' as const };
                      return s;
                    });
                    localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(newSyncs));
                    return newSyncs;
                  });
                });
              }
              next[idx] = 300;
              needsUpdate = true;
            }
          } else {
            if (next[idx] !== undefined) {
              delete next[idx];
              needsUpdate = true;
            }
          }
        });
        
        return needsUpdate ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [savedSyncs]);

  useEffect(() => {
    const saved = localStorage.getItem('hr_portal_saved_syncs');
    if (saved) {
      try {
        setSavedSyncs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSaveSyncUrl = () => {
    if (!csvUrl) return alert("Please enter a URL first.");
    setIsSavingLink(true);
  };

  const confirmSaveSyncUrl = () => {
    if (!syncProfileName.trim()) return alert("Please provide a name for this sync profile.");
    
    // Attempt to infer department from name
    let inferredDept = 'SASP';
    const nameUpper = syncProfileName.toUpperCase();
    if (nameUpper.includes('LSPD')) inferredDept = 'LSPD';
    else if (nameUpper.includes('BCSO')) inferredDept = 'BCSO';
    else if (nameUpper.includes('SAPR')) inferredDept = 'SAPR';
    else if (nameUpper.includes('ACADEMY')) inferredDept = 'SASP Academy';

    const newSyncs = [...savedSyncs, { name: syncProfileName, url: csvUrl, lastSync: 'Never', defaultDept: inferredDept }];
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(newSyncs));
    setIsSavingLink(false);
    setSyncProfileName("");
  };

  const handleSyncCSV = async (eOrUrl?: any, fallbackDept?: string) => {
    let urlToUse = typeof eOrUrl === 'string' ? eOrUrl : csvUrl;
    urlToUse = urlToUse.trim();
    if (!urlToUse) return alert("Please enter a valid Google Sheets CSV URL.");

    // Auto-convert standard Google Sheets links to CSV export links
    if (urlToUse.includes("docs.google.com/spreadsheets") && urlToUse.includes("/edit")) {
      urlToUse = urlToUse.replace(/\/edit.*$/, '/export?format=csv');
      setCsvUrl(urlToUse);
    }

    setIsSyncing(true);
    setSyncStatus("Fetching CSV data...");

    try {
      const response = await fetch(urlToUse);
      const csvText = await response.text();

      // Guard against HTML/login pages
      if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || csvText.includes('<script') || csvText.includes('<html')) {
        alert("The URL returned a webpage, not CSV data. Ensure your Google Sheet is shared as 'Anyone with the link can view' and you are using the export link.");
        setIsSyncing(false);
        setSyncStatus("");
        return;
      }

      setSyncStatus("Parsing CSV data...");
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          setSyncStatus("Analyzing headers...");
          const rows = results.data as string[][];

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

          const findIdx = (row: string[], ...names: string[]) => {
            return row.findIndex(cell => names.some(n => cell && cell.toUpperCase().trim() === n.toUpperCase()));
          };

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
          const idxDept = findIdx(headerRow, 'DEPARTMENT', 'DEPT');
          const idxTitles = findIdx(headerRow, 'TITLES');
          const idxNotes = findIdx(headerRow, 'NOTES');

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
            setSyncStatus("");
            return;
          }

          setSyncStatus("Fetching current database roster...");
          const currentRoster = await fetchAllEmployees();
          
          const stagedData: any[] = [];
          const processedIds = new Set<string>();
          const sheetDepartments = new Set<string>();

          setSyncStatus(`Processing ${rows.length - (headerIdx + 2)} records...`);

          for (let i = headerIdx + 2; i < rows.length; i++) {
            const row = rows[i];
            
            const name = row[idxName]?.trim();
            const badge_number = row[idxBadge]?.trim();
            
            if (!name || !badge_number) continue;

            const rank = idxRank !== -1 ? row[idxRank]?.trim() || "Cadet" : "Cadet";
            const discord_tag = idxDiscord !== -1 ? row[idxDiscord]?.trim() || null : null;
            const status = (idxStatus !== -1 && row[idxStatus]?.trim()) ? row[idxStatus].trim() : 'ACTIVE';
            
            const generatedDiscordTag = name.toLowerCase().replace(/\s+/g, '.');
            const final_discord_tag = discord_tag || generatedDiscordTag;

            const citizen_id = idxCitizenId !== -1 ? row[idxCitizenId]?.trim() || null : null;
            const phone_number = idxPhone !== -1 ? row[idxPhone]?.trim() || null : null;
            const department_join_date = idxJoinDate !== -1 ? row[idxJoinDate]?.trim() || null : null;
            const duration_in_department = idxDuration !== -1 ? row[idxDuration]?.trim() || null : null;
            const last_promotion_date = idxPromoDate !== -1 ? row[idxPromoDate]?.trim() || null : null;
            const days_since_last_promoted = idxDaysPromo !== -1 ? row[idxDaysPromo]?.trim() || null : null;
            const sub_department = idxSubDept !== -1 ? row[idxSubDept]?.trim() || null : null;
            const sheet_department = idxDept !== -1 ? row[idxDept]?.trim() || null : null;
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
            if (existing) {
              processedIds.add(existing.id);
            }
            
            const r = existing ? existing.role : 'Patrol Officer';
            
            // Priority: CSV Dept Column -> Fallback passed to function -> Existing DB Dept -> 'SASP'
            let dept = 'SASP';
            if (sheet_department) dept = sheet_department;
            else if (fallbackDept) dept = fallbackDept;
            else if (existing && existing.department) dept = existing.department;
            
            sheetDepartments.add(dept.toUpperCase());

            let derivedIsAdmin = false;
            if (r === 'admin') {
              derivedIsAdmin = true;
            } else if (existing) {
              if (existing.role === 'admin') {
                derivedIsAdmin = false; // Demoted from admin
              } else {
                derivedIsAdmin = !!existing.is_admin; // Preserve manual DB setting
              }
            }

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
              department: dept
            };
            
            stagedData.push(payload);
          }
          
          // Identify records in DB that were NOT in the sheet to stage for deletion
          if (currentRoster) {
            for (const emp of currentRoster) {
              // Only delete missing officers if they belong to a department that was actually in this sheet
              if (!processedIds.has(emp.id) && sheetDepartments.has((emp.department || '').toUpperCase())) {
                stagedData.push({
                  _staged_id: Math.random().toString(36).substring(7),
                  _is_existing: true,
                  _is_delete: true, // Flag for deletion
                  _db_id: emp.id,
                  name: emp.name,
                  badge_number: emp.badge_number,
                  rank: emp.rank,
                  department: emp.department,
                  role: emp.role,
                  status: emp.status
                });
              }
            }
          }
          
          setStagedEmployees(stagedData);
          setShowConfirmModal(true);
          setIsSyncing(false);
          setSyncStatus("");
          
          if (typeof eOrUrl === 'string') {
            const updatedSyncs = savedSyncs.map(s => {
              if (s.url === eOrUrl) return { ...s, lastSync: new Date().toLocaleString(), lastSyncStatus: 'success' as const };
              return s;
            });
            setSavedSyncs(updatedSyncs);
            localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(updatedSyncs));
          }

        },
        error: (error: any) => {
          alert("Error parsing CSV: " + error.message);
          setIsSyncing(false);
          setSyncStatus("");
          if (typeof eOrUrl === 'string') {
            const updatedSyncs = savedSyncs.map(s => {
              if (s.url === eOrUrl) return { ...s, lastSync: new Date().toLocaleString(), lastSyncStatus: 'error' as const };
              return s;
            });
            setSavedSyncs(updatedSyncs);
            localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(updatedSyncs));
          }
        }
      });
    } catch (err: any) {
      alert("Error fetching CSV. Ensure it is a public 'Publish to Web' CSV link.\n" + err.message);
      setIsSyncing(false);
      setSyncStatus("");
      if (typeof eOrUrl === 'string') {
        const updatedSyncs = savedSyncs.map(s => {
          if (s.url === eOrUrl) return { ...s, lastSync: new Date().toLocaleString(), lastSyncStatus: 'error' as const };
          return s;
        });
        setSavedSyncs(updatedSyncs);
        localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(updatedSyncs));
      }
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
    let deleted = 0;
    
    for (const emp of selected) {
       const { _staged_id, _is_existing, _db_id, _is_delete, ...dbPayload } = emp;
       
       if (_is_delete) {
         const { error } = await supabase.from('employees').delete().eq('id', _db_id);
         if (!error) deleted++;
         else console.error("Delete error for", emp.name, error);
       } else if (_is_existing) {
         const { error } = await supabase.from('employees').update(dbPayload).eq('id', _db_id);
         if (!error) updated++;
         else console.error("Update error for", emp.name, error);
       } else {
         const { error } = await supabase.from('employees').insert([dbPayload]);
         if (!error) added++;
         else console.error("Insert error for", emp.name, error);
       }
    }
    
    logAuditAction("BULK_IMPORT", "Multiple", `Master Import complete: ${added} added, ${updated} updated, ${deleted} deleted.`);
    setSyncResult({ added, updated, deleted });
    setSelectedStagedIds(new Set());
    setIsCommitting(false);
    setShowConfirmModal(false);
    setStagedEmployees([]);
    setSelectedStagedIds(new Set());
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

  const handleDeleteSavedSync = (idxToDelete: number) => {
    const newSyncs = savedSyncs.filter((_, idx) => idx !== idxToDelete);
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(newSyncs));
  };

  const handleToggleAutoSync = (idxToToggle: number) => {
    const newSyncs = savedSyncs.map((sync, idx) => ({
      ...sync,
      isAutoSync: idx === idxToToggle ? !sync.isAutoSync : sync.isAutoSync
    }));
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_saved_syncs', JSON.stringify(newSyncs));

    // If it was just toggled ON, immediately trigger a background sync for all enabled rosters
    if (newSyncs[idxToToggle].isAutoSync) {
      const autoSyncProfiles = newSyncs.filter(s => s.isAutoSync && s.url);
      if (autoSyncProfiles.length > 0) {
        runGlobalAutoSync(autoSyncProfiles);
      }
    }
  };

  const handleCloseSuccess = () => {
    setSyncResult(null);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  if (syncResult) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-950 border border-emerald-500/30 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Database Sync Complete</h2>
            <p className="text-slate-400 text-sm mb-8">All selected records have been successfully imported into the master database.</p>
            
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-white mb-1">{syncResult.added}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">New</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-blue-400 mb-1">{syncResult.updated}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Updated</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-rose-500 mb-1">{syncResult.deleted || 0}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Deleted</span>
              </div>
            </div>

            <button 
              onClick={handleCloseSuccess}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold tracking-widest uppercase transition-colors"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmModal) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" /> Staged Sync Data
              </h2>
              <p className="text-sm text-slate-400 mt-1">Review the incoming records from Google Sheets before committing them to the database.</p>
            </div>
            <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex flex-wrap gap-4 items-center">
            <div className="text-sm text-slate-300">
              <span className="font-bold text-white">{selectedStagedIds.size}</span> of {stagedEmployees.length} selected
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bulk Set Role:</span>
              <select 
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdate('role', e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">-- Select Role --</option>
                <option value="Patrol Officer">Patrol Officer</option>
                {hasEditAccess && <option value="High Command">High Command</option>}
                <option value="Command">Command</option>
                <option value="Supervisor">Supervisor</option>
                <option value="HR">HR</option>
                <option value="Student">Student</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bulk Set Dept:</span>
              <select 
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdate('department', e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">-- Select Dept --</option>
                <option value="SASP">SASP</option>
                <option value="SASP Academy">SASP Academy</option>
                <option value="LSPD">LSPD</option>
                <option value="BCSO">BCSO</option>
                <option value="SAPR">SAPR</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-2">
                    <input 
                      type="checkbox" 
                      checked={selectedStagedIds.size === stagedEmployees.length && stagedEmployees.length > 0}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                    />
                  </th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Callsign</th>
                  <th className="p-2 font-medium">Sheet Rank</th>
                  <th className="p-2 font-medium">Set Dept.</th>
                  <th className="p-2 font-medium">Set Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {stagedEmployees.map((emp) => (
                  <tr key={emp._staged_id} className={`hover:bg-slate-800/30 transition-colors ${!selectedStagedIds.has(emp._staged_id) ? 'opacity-40' : ''}`}>
                    <td className="p-2">
                      <input 
                        type="checkbox" 
                        checked={selectedStagedIds.has(emp._staged_id)}
                        onChange={() => handleToggleStaged(emp._staged_id)}
                        className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      {emp._is_delete ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider">Delete</span>
                      ) : emp._is_existing ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Update</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">New</span>
                      )}
                    </td>
                    <td className="p-2 font-medium text-slate-200">{emp.name}</td>
                    <td className="p-2 text-slate-400 font-mono">{emp.badge_number}</td>
                    <td className="p-2 text-slate-300">{emp.rank}</td>
                    <td className="p-2">
                      <select 
                        value={emp.department} 
                        disabled={emp._is_delete}
                        onChange={(e) => setStagedEmployees(stagedEmployees.map(x => x._staged_id === emp._staged_id ? {...x, department: e.target.value} : x))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-full max-w-[120px] disabled:opacity-50"
                      >
                        <option value="SASP">SASP</option>
                        <option value="SASP Academy">SASP Academy</option>
                        <option value="LSPD">LSPD</option>
                        <option value="BCSO">BCSO</option>
                        <option value="SAPR">SAPR</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select 
                        value={emp.role} 
                        disabled={emp._is_delete}
                        onChange={(e) => {
                          const isAdmin = e.target.value === 'admin';
                          setStagedEmployees(stagedEmployees.map(x => x._staged_id === emp._staged_id ? {...x, role: e.target.value, is_admin: isAdmin} : x))
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-full max-w-[120px] disabled:opacity-50"
                      >
                        <option value="Patrol Officer">Patrol Officer</option>
                        {hasEditAccess && <option value="High Command">High Command</option>}
                        <option value="Command">Command</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="HR">HR</option>
                        <option value="Student">Student</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <p className="text-xs text-slate-400 max-w-lg">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" /> 
              Only selected rows will be processed. "Update" will overwrite existing records. "Delete" will permanently remove officers not found in the sheet.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCommitStaged}
                disabled={isCommitting || selectedStagedIds.size === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-bold tracking-wider text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isCommitting ? "Committing..." : `Commit ${selectedStagedIds.size} Records`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Active Sync Control */}
        {hasEditAccess ? (
          <div className="flex-1 p-8 bg-slate-900/50 border-r border-slate-800/60">
            <h2 className="text-2xl font-light text-slate-200 tracking-wider mb-2 flex items-center gap-3">
              <Database className="w-6 h-6 text-brand" />
              DIRECTORY <span className="font-bold text-brand">IMPORTS</span>
            </h2>
            <p className="text-sm text-slate-400 mb-8">Import personnel data securely from Google Sheets.</p>

            <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Google Sheets CSV Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={csvUrl} 
                  onChange={e => setCsvUrl(e.target.value)} 
                  className="flex-1 rounded-md border border-slate-800 bg-black/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand" 
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" 
                />
                {!isSavingLink && (
                  <button 
                    onClick={handleSaveSyncUrl}
                    title="Save this link for later"
                    className="px-3 rounded border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isSavingLink && (
                <div className="flex gap-2 items-center mt-2 p-3 bg-slate-800/40 rounded border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="text"
                    value={syncProfileName}
                    onChange={e => setSyncProfileName(e.target.value)}
                    placeholder="Profile Name (e.g., LSPD Active Roster)"
                    className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button 
                    onClick={confirmSaveSyncUrl}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setIsSavingLink(false); setSyncProfileName(""); }}
                    className="text-slate-400 hover:text-white px-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Ensure your sheet is set to "Publish to Web" as a CSV. Required headers: Name, Callsign, Rank, Discord Tag.
              </p>
            </div>
            
            <button 
              onClick={() => handleSyncCSV()}
              disabled={isSyncing || !csvUrl}
              className="w-full bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-4 py-3 rounded-md font-bold tracking-widest text-sm uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> {syncStatus || "Fetching & Parsing..."}</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Start Sync Process</>
              )}
            </button>
            
            {isSyncing && syncStatus && (
              <div className="flex items-center gap-3 mt-4 p-3 bg-brand/5 border border-brand/20 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--brand),0.5)]" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-xs text-brand font-medium tracking-wide mt-2">{syncStatus}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="flex-1 p-8 bg-slate-900/50 flex flex-col items-center justify-center border-r border-slate-800/60 text-center">
            <Database className="w-16 h-16 text-slate-800 mb-6" />
            <h2 className="text-2xl font-light text-slate-200 tracking-wider mb-2">RUN <span className="font-bold text-brand">SYNCS</span></h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              You have permission to run saved directory synchronizations. Only True Admins can modify or create new sync configurations.
            </p>
          </div>
        )}

        {/* Right Side: Saved Syncs */}
        <div className="w-full md:w-[350px] bg-slate-950 p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <LinkIcon className="w-40 h-40" />
          </div>
          
          <h3 className="text-sm font-bold tracking-widest uppercase text-slate-300 mb-6 flex items-center gap-2 z-10">
            <LinkIcon className="w-4 h-4 text-blue-400" /> Saved Syncs
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 z-10 custom-scrollbar pr-2">
            {savedSyncs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 italic">No saved sync configurations.</p>
              </div>
            ) : (
              savedSyncs.map((sync, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          sync.lastSyncStatus === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 
                          sync.lastSyncStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                          'bg-slate-600'
                        }`} 
                        title={sync.lastSyncStatus === 'error' ? 'Last sync failed' : sync.lastSyncStatus === 'success' ? 'Last sync successful' : 'Not synced yet'}
                      />
                      <p className="text-sm font-bold text-slate-200">{sync.name}</p>
                    </div>
                    {hasEditAccess && (
                      <button 
                        onClick={() => handleDeleteSavedSync(idx)}
                        className="text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono truncate mb-3">{sync.url}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
                    {hasEditAccess ? (
                      <label className="flex items-center gap-2 cursor-pointer group/toggle">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={sync.isAutoSync || false}
                            onChange={() => handleToggleAutoSync(idx)}
                          />
                          <div className={`block w-7 h-4 rounded-full transition-colors ${sync.isAutoSync ? 'bg-emerald-500' : 'bg-slate-700 group-hover/toggle:bg-slate-600'}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${sync.isAutoSync ? 'translate-x-3' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium select-none">
                          {sync.isAutoSync && timeRemaining[idx] !== undefined 
                            ? `Auto-Sync (Next: ${Math.floor(timeRemaining[idx] / 60).toString().padStart(2, '0')}:${(timeRemaining[idx] % 60).toString().padStart(2, '0')})`
                            : "Auto-Sync on Load"
                          }
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium select-none">
                        {sync.isAutoSync ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                        {sync.isAutoSync && timeRemaining[idx] !== undefined 
                          ? `Auto-Sync (Next: ${Math.floor(timeRemaining[idx] / 60).toString().padStart(2, '0')}:${(timeRemaining[idx] % 60).toString().padStart(2, '0')})`
                          : "Auto-Sync on Load"
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-400">Last: {sync.lastSync}</p>
                    <button 
                      onClick={() => handleSyncCSV(sync.url, sync.defaultDept)}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Run
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
