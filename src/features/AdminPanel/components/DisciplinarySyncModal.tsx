import { useState, useEffect, useRef } from "react";
import { RefreshCw, X, Save, CheckCircle2, Database, AlertTriangle, Link as LinkIcon, Play } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import Papa from "papaparse";
import { useAuth } from '@/auth/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DisciplinarySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DisciplinarySyncModal({ isOpen, onClose, onSuccess }: DisciplinarySyncModalProps) {
  const { profile } = useAuth();
  const [csvUrl, setCsvUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [stagedRequests, setStagedRequests] = useState<any[]>([]);
  const [selectedStagedIds, setSelectedStagedIds] = useState<Set<number>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [syncResult, setSyncResult] = useState<{added: number, updated: number} | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Saved Syncs State
  const [savedSyncs, setSavedSyncs] = useState<{name: string, url: string, lastSync: string, lastSyncStatus?: 'success' | 'error', isAutoSync?: boolean}[]>([]);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [syncProfileName, setSyncProfileName] = useState("");
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});
  const handleSyncCSVRef = useRef<any>(null);

  useEffect(() => {
    handleSyncCSVRef.current = handleSyncCSV;
  });

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
              if (sync.url && handleSyncCSVRef.current) {
                handleSyncCSVRef.current(sync.url, true);
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
    if (!isOpen) return;
    const saved = localStorage.getItem('hr_portal_disciplinary_saved_syncs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSyncs(parsed);
        
        // Find one to auto sync if we haven't already
        const auto = parsed.find((s: any) => s.isAutoSync);
        if (auto && !hasAutoSynced) {
          setCsvUrl(auto.url);
          handleSyncCSV(auto.url, true);
          setHasAutoSynced(true);
        }
      } catch (e) {}
    }
  }, [isOpen, hasAutoSynced]);

  if (!isOpen) return null;

  const handleSaveSyncUrl = () => {
    if (!csvUrl) return setErrorMsg("Please enter a URL first to save.");
    setIsSavingLink(true);
  };

  const confirmSaveSyncUrl = () => {
    if (!syncProfileName.trim()) return setErrorMsg("Please provide a name for this sync profile.");
    const newSyncs = [...savedSyncs, { name: syncProfileName, url: csvUrl, lastSync: 'Never' }];
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_disciplinary_saved_syncs', JSON.stringify(newSyncs));
    setIsSavingLink(false);
    setSyncProfileName("");
  };

  const handleDeleteSavedSync = (idx: number) => {
    const newSyncs = [...savedSyncs];
    newSyncs.splice(idx, 1);
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_disciplinary_saved_syncs', JSON.stringify(newSyncs));
  };

  const handleToggleAutoSync = (idx: number) => {
    const newSyncs = savedSyncs.map((s, i) => {
      // If turning this one ON, turn others OFF (only one auto-sync allowed)
      if (i === idx) return { ...s, isAutoSync: !s.isAutoSync };
      return { ...s, isAutoSync: false };
    });
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_disciplinary_saved_syncs', JSON.stringify(newSyncs));
  };

  const updateLastSyncStatus = (url: string, status: 'success' | 'error') => {
    setSavedSyncs(prevSyncs => {
      const newSyncs = prevSyncs.map(s => {
        if (s.url === url || s.url.replace(/\/edit.*$/, '/export?format=csv') === url) {
          return { 
            ...s, 
            lastSync: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), 
            lastSyncStatus: status 
          };
        }
        return s;
      });
      localStorage.setItem('hr_portal_disciplinary_saved_syncs', JSON.stringify(newSyncs));
      return newSyncs;
    });
  };

  async function handleSyncCSV(eOrUrl?: any, autoCommit: boolean = false) {
    setErrorMsg(null);
    let finalUrl = typeof eOrUrl === 'string' ? eOrUrl : csvUrl;
    finalUrl = finalUrl.trim();
    
    if (!finalUrl) {
      setErrorMsg("Please enter a valid Google Sheets CSV URL.");
      return;
    }

    // Auto-convert standard Google Sheets links to CSV export links
    if (finalUrl.includes("docs.google.com/spreadsheets") && finalUrl.includes("/edit")) {
      finalUrl = finalUrl.replace(/\/edit.*$/, '/export?format=csv');
      setCsvUrl(finalUrl);
    }

    setIsSyncing(true);
    setSyncStatus("Fetching CSV data...");

    try {
      const response = await fetch(finalUrl);
      const csvText = await response.text();

      // Guard against HTML/login pages
      if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || csvText.includes('<script') || csvText.includes('<html')) {
        setErrorMsg("The URL returned a webpage instead of CSV data. Ensure your Google Sheet is shared as 'Anyone with the link can view' and you are using the export link format.");
        setIsSyncing(false);
        setSyncStatus("");
        updateLastSyncStatus(finalUrl, 'error');
        return;
      }

      setSyncStatus("Parsing CSV data...");
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          setSyncStatus("Analyzing headers...");
          const rows = results.data as string[][];

          // Try to find common Disciplinary/Strikes headers
          let headerIdx = -1;
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            if (rows[i].some(cell => cell && (cell.toUpperCase().includes('NAME') || cell.toUpperCase().includes('OFFICER') || cell.toUpperCase().includes('DISCORD') || cell.toUpperCase().includes('CALLSIGN')))) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) {
            setErrorMsg("Could not find a recognizable header row.");
            setIsSyncing(false);
            updateLastSyncStatus(finalUrl, 'error');
            return;
          }

          const headerRow = rows[headerIdx];
          
          const findIdx = (keywords: string[]) => {
            return headerRow.findIndex(cell => keywords.some(k => cell && cell.toUpperCase().includes(k.toUpperCase())));
          };

          const idxName = findIdx(['NAME', 'OFFICER', 'MEMBER']);
          const idxReason = findIdx(['REASON', 'WHY', 'DETAIL', 'EXPLANATION', 'INCIDENT']);
          const idxIssuedBy = findIdx(['ISSUED BY', 'ISSUER', 'ISSUED']);
          const idxActionType = findIdx(['ACTION', 'TYPE']);
          const idxLevel = findIdx(['LEVEL', 'STRIKE LEVEL']);
          const idxStatus = findIdx(['STATUS', 'STATE']);
          const idxDate = findIdx(['DATE', 'TIMESTAMP', 'CREATED']);
          const idxRevokedBy = findIdx(['REVOKED BY']);
          const idxRevokedDate = findIdx(['REVOKED DATE', 'REVOKED ON']);

          if (idxName === -1) {
            setErrorMsg("Could not find an 'Officer Name' column.");
            setIsSyncing(false);
            updateLastSyncStatus(finalUrl, 'error');
            return;
          }

          const normalizeDate = (dateStr: string) => {
            if (!dateStr) return null;
            const upper = dateStr.toUpperCase();
            if (upper === 'TBD' || upper === 'N/A' || upper === 'INDEFINITE' || upper === 'NONE') return null;

            const parts = dateStr.trim().split(/[-/.]/);
            if (parts.length === 3) {
              // If year is first (YYYY-MM-DD)
              if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
              
              const yearStr = parts[2];
              // If year is last (DD/MM/YYYY, MM/DD/YYYY, DD/MM/YY, or MM/DD/YY)
              if (yearStr.length === 2 || yearStr.length === 4) {
                const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;
                
                let day = parseInt(parts[0]);
                let month = parseInt(parts[1]);
                if (month > 12) { // It was actually MM/DD/YY
                  day = parseInt(parts[1]);
                  month = parseInt(parts[0]);
                }
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              }
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            return null;
          };

          const newStaged: any[] = [];
          
          for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            const name = row[idxName]?.trim();
            if (!name) continue;

            const reason = idxReason !== -1 ? row[idxReason]?.trim() : "Synced from sheet";
            const issuedBy = idxIssuedBy !== -1 ? row[idxIssuedBy]?.trim() : "System";
            const actionType = idxActionType !== -1 ? row[idxActionType]?.trim() : "Warning";
            const level = idxLevel !== -1 ? row[idxLevel]?.trim() : "1/5";
            let statusRaw = idxStatus !== -1 ? row[idxStatus]?.trim().toLowerCase() : "approved";
            if (!statusRaw) statusRaw = "approved";
            
            // Map common sheet statuses to DB statuses
            let status = "approved";
            if (statusRaw.includes('pending')) status = "pending";
            else if (statusRaw.includes('revoked')) status = "revoked";
            
            const dateRaw = idxDate !== -1 ? row[idxDate]?.trim() : "";
            const createdAt = normalizeDate(dateRaw) || new Date().toISOString().split('T')[0];
            
            const revokedBy = idxRevokedBy !== -1 ? row[idxRevokedBy]?.trim() : null;
            const revokedDateRaw = idxRevokedDate !== -1 ? row[idxRevokedDate]?.trim() : "";
            const revokedAt = normalizeDate(revokedDateRaw);

            newStaged.push({
              name: name,
              reason: reason,
              issued_by: issuedBy,
              action_type: actionType,
              strike_level: level,
              severity: actionType === 'Strike' ? 'High' : actionType === 'Warning' ? 'Medium' : 'Low',
              status: status,
              created_at: createdAt,
              revoked_by: revokedBy,
              revoked_at: revokedAt ? new Date(revokedAt).toISOString() : null
            });
          }
          
          // Sort by date descending (latest first)
          newStaged.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime() || 0;
            const dateB = new Date(b.created_at).getTime() || 0;
            return dateB - dateA;
          });

          if (autoCommit) {
            await executeCommit(newStaged, finalUrl);
            setIsSyncing(false);
          } else {
            setStagedRequests(newStaged);
            setSelectedStagedIds(new Set(newStaged.map((_, i) => i)));
            setSyncStatus("");
            setIsSyncing(false);
          }
        },
        error: (err: any) => {
          console.error(err);
          setErrorMsg("Error parsing CSV data. Please check the format.");
          setIsSyncing(false);
          updateLastSyncStatus(finalUrl, 'error');
        }
      });
    } catch (error) {
      console.error(error);
      setErrorMsg("Error fetching CSV. Make sure the link is publicly accessible (Anyone with link can view).");
      setIsSyncing(false);
      updateLastSyncStatus(finalUrl, 'error');
    }
  };

  const executeCommit = async (recordsToInsert: any[], sourceUrl: string) => {
    setIsCommitting(true);
    setSyncStatus("Checking for existing records...");
    setErrorMsg(null);

    try {
      const { data: existingStrikes, error: fetchErr } = await supabase
        .from('strikes')
        .select('id, name, created_at, reason');
        
      if (fetchErr) throw fetchErr;

      let addedCount = 0;
      let updatedCount = 0;

      setSyncStatus("Saving records to database...");

      for (const req of recordsToInsert) {
        // Find existing by name, date and reason
        const existing = existingStrikes?.find(e => 
          e.name?.toLowerCase() === req.name?.toLowerCase() &&
          e.created_at?.split('T')[0] === req.created_at?.split('T')[0] &&
          e.reason?.toLowerCase() === req.reason?.toLowerCase()
        );

        if (existing) {
          // Update status
          const { error: updateErr } = await supabase
            .from('strikes')
            .update({
              status: req.status,
              action_type: req.action_type,
              strike_level: req.strike_level,
              severity: req.severity,
              revoked_by: req.revoked_by,
              revoked_at: req.revoked_at
            })
            .eq('id', existing.id);
            
          if (updateErr) throw updateErr;
          updatedCount++;
        } else {
          // Insert new
          const { error: insertErr } = await supabase
            .from('strikes')
            .insert([req]);
            
          if (insertErr) throw insertErr;
          addedCount++;
        }
      }

      await logAuditAction(
        "DISCIPLINARY_BULK_SYNC",
        "System",
        `Synced Disciplinary records: ${addedCount} added, ${updatedCount} updated from Google Sheets`,
        profile?.name || "Admin"
      );

      setSyncResult({ added: addedCount, updated: updatedCount });
      updateLastSyncStatus(sourceUrl, 'success');
    } catch (error: any) {
      console.error("Sync error:", error);
      setErrorMsg(`Error saving to database: ${error.message}`);
    } finally {
      setIsCommitting(false);
      setSyncStatus("");
    }
  };

  const handleCommitSync = async () => {
    if (selectedStagedIds.size === 0) return;
    const recordsToInsert = Array.from(selectedStagedIds).map(idx => stagedRequests[idx]);
    await executeCommit(recordsToInsert, csvUrl);
  };

  const resetModal = () => {
    setCsvUrl("");
    setStagedRequests([]);
    setSelectedStagedIds(new Set());
    setSyncResult(null);
    setErrorMsg(null);
  };

  const toggleAll = () => {
    if (selectedStagedIds.size === stagedRequests.length) {
      setSelectedStagedIds(new Set());
    } else {
      setSelectedStagedIds(new Set(stagedRequests.map((_, i) => i)));
    }
  };

  const toggleOne = (idx: number) => {
    const next = new Set(selectedStagedIds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedStagedIds(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl p-0 bg-slate-950 border border-slate-800/60 text-slate-200 overflow-hidden rounded-xl shadow-2xl flex flex-col md:flex-row h-[85vh] gap-0">
        <DialogHeader className="hidden">
          <DialogTitle>Disciplinary Actions Import</DialogTitle>
        </DialogHeader>
        
        {/* Left Side: Sync Input & Staged Data */}
        <div className="flex-1 flex flex-col h-full bg-slate-950/40 relative">
          
          {/* Header */}
          <div className="p-6 pb-0 shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-wider uppercase">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-rose-400" />
              </div>
              Disciplinary Sync
            </h2>
            <p className="text-[11px] text-slate-500 font-medium ml-[52px] -mt-1">Import disciplinary actions from a CSV link.</p>
          </div>

          {/* Sync Controls */}
          <div className="p-6 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CSV Data Source URL</label>
                <input 
                  type="text" 
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors"
                  value={csvUrl}
                  onChange={(e) => setCsvUrl(e.target.value)}
                  disabled={isSyncing || isCommitting}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSyncCSV()}
                  disabled={isSyncing || isCommitting || !csvUrl}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-xs tracking-wider uppercase shadow-lg shadow-rose-900/20"
                >
                  {isSyncing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Fetching...</> : <><RefreshCw className="w-4 h-4" /> Run Sync</>}
                </button>
                <button 
                  onClick={handleSaveSyncUrl}
                  disabled={isSyncing || isCommitting || !csvUrl}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-xs tracking-wider uppercase border border-slate-700"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>

            {isSavingLink && (
              <div className="flex gap-2 items-center mt-3 p-3 bg-slate-800/40 rounded-md border border-slate-700 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text"
                  value={syncProfileName}
                  onChange={e => setSyncProfileName(e.target.value)}
                  placeholder="Profile Name (e.g., LSPD Active Disciplinary)"
                  className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"
                  autoFocus
                />
                <button 
                  onClick={confirmSaveSyncUrl}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
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

            {syncStatus && <p className="text-rose-400 text-[11px] mt-3 animate-pulse uppercase tracking-wider font-bold">{syncStatus}</p>}
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar relative">
            
            {syncResult ? (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300 z-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Sync Complete!</h3>
                <p className="text-slate-400 text-sm">
                  Successfully imported <span className="text-emerald-400 font-bold">{syncResult.added}</span> new records and updated <span className="text-blue-400 font-bold">{syncResult.updated}</span> existing records.
                </p>
                <button 
                  onClick={() => { resetModal(); onSuccess(); onClose(); }}
                  className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Close & Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Beautiful Error UI */}
                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-400">Sync Error</h4>
                      <p className="text-sm text-rose-200/80 mt-1">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {stagedRequests.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        Staged Records ({selectedStagedIds.size} of {stagedRequests.length} selected)
                      </h3>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="border-b border-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-900/50">
                            <tr>
                              <th className="p-3 w-10">
                                <input 
                                  type="checkbox" 
                                  checked={selectedStagedIds.size === stagedRequests.length}
                                  onChange={toggleAll}
                                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950 w-3.5 h-3.5"
                                />
                              </th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Officer</th>
                              <th className="p-3">Date</th>
                              <th className="p-3 hidden md:table-cell">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-sm">
                            {stagedRequests.map((req, idx) => (
                              <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${!selectedStagedIds.has(idx) ? 'opacity-40' : ''}`}>
                                <td className="p-3">
                                  <input 
                                    type="checkbox"
                                    checked={selectedStagedIds.has(idx)}
                                    onChange={() => toggleOne(idx)}
                                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950 w-3.5 h-3.5"
                                  />
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-500/10 border-rose-500/20 text-rose-400">
                                    {req.type}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-200">{req.officer_name}</td>
                                <td className="p-3 text-slate-400 font-mono">{req.date}</td>
                                <td className="p-3 text-slate-500 hidden md:table-cell truncate max-w-[200px]" title={req.reason}>{req.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleCommitSync}
                        disabled={isCommitting || selectedStagedIds.size === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-colors text-sm uppercase tracking-wider"
                      >
                        {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isCommitting ? "Importing..." : `Commit ${selectedStagedIds.size} Records`}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Right Side: Saved Syncs */}
        <div className="w-full md:w-[350px] bg-slate-950/80 border-l border-slate-800/60 p-6 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <LinkIcon className="w-40 h-40" />
          </div>
          
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2 z-10">
            <LinkIcon className="w-3.5 h-3.5 text-rose-400" /> Saved Profiles
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 z-10 custom-scrollbar pr-2">
            {savedSyncs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                <p className="text-xs text-slate-500 italic">No saved sync configurations.</p>
                <p className="text-[10px] text-slate-600 mt-1 px-4">Save a URL to quickly run imports without typing the link again.</p>
              </div>
            ) : (
              savedSyncs.map((sync, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors group shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 max-w-[85%]">
                      <div 
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          sync.lastSyncStatus === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 
                          sync.lastSyncStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                          'bg-slate-600'
                        }`} 
                        title={sync.lastSyncStatus === 'error' ? 'Last sync failed' : sync.lastSyncStatus === 'success' ? 'Last sync successful' : 'Not synced yet'}
                      />
                      <p className="text-sm font-bold text-slate-200 truncate">{sync.name}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteSavedSync(idx)}
                      className="text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 font-mono truncate mb-3 bg-slate-950 px-2 py-1 rounded">{sync.url}</p>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/80">
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
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-400">Last: {sync.lastSync}</p>
                    <button 
                      onClick={() => {
                        setCsvUrl(sync.url);
                        handleSyncCSV(sync.url);
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-400 uppercase flex items-center gap-1 transition-colors bg-rose-500/10 px-2 py-1 rounded"
                    >
                      <Play className="w-3 h-3" /> Run
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
