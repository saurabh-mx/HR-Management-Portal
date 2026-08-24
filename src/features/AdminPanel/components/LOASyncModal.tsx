import { useState, useEffect } from "react";
import { RefreshCw, X, Save, CheckCircle2, Database, AlertTriangle, Link as LinkIcon, Play } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import Papa from "papaparse";
import { useAuth } from '@/auth/hooks/useAuth';

interface LOASyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LOASyncModal({ isOpen, onClose, onSuccess }: LOASyncModalProps) {
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

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('hr_portal_loa_saved_syncs');
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
    localStorage.setItem('hr_portal_loa_saved_syncs', JSON.stringify(newSyncs));
    setIsSavingLink(false);
    setSyncProfileName("");
  };

  const handleDeleteSavedSync = (idx: number) => {
    const newSyncs = [...savedSyncs];
    newSyncs.splice(idx, 1);
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_loa_saved_syncs', JSON.stringify(newSyncs));
  };

  const handleToggleAutoSync = (idx: number) => {
    const newSyncs = savedSyncs.map((s, i) => {
      // If turning this one ON, turn others OFF (only one auto-sync allowed)
      if (i === idx) return { ...s, isAutoSync: !s.isAutoSync };
      return { ...s, isAutoSync: false };
    });
    setSavedSyncs(newSyncs);
    localStorage.setItem('hr_portal_loa_saved_syncs', JSON.stringify(newSyncs));
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
      localStorage.setItem('hr_portal_loa_saved_syncs', JSON.stringify(newSyncs));
      return newSyncs;
    });
  };

  const handleSyncCSV = async (eOrUrl?: any, autoCommit: boolean = false) => {
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

          // Try to find common LOA headers
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
          const idxStart = findIdx(['START DATE', 'START', 'FROM', 'BEGIN']);
          const idxEnd = findIdx(['END DATE', 'END', 'RETURN', 'TO', 'UNTIL']);
          const idxReason = findIdx(['REASON', 'WHY', 'DETAIL', 'EXPLANATION']);
          const idxStatus = findIdx(['STATUS', 'STATE']);

          if (idxName === -1) {
            setErrorMsg("Could not find an 'Officer Name' column.");
            setIsSyncing(false);
            updateLastSyncStatus(finalUrl, 'error');
            return;
          }

          const normalizeDate = (dateStr: string) => {
            if (!dateStr) return null;
            const upper = dateStr.toUpperCase();
            if (upper === 'TBD' || upper === 'N/A' || upper === 'INDEFINITE' || upper === 'NONE' || upper === 'END' || upper === 'EXPIRED') return null;

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
            return null; // Return null instead of raw string to prevent DB crashes
          };

          const newStaged: any[] = [];
          
          for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            const name = row[idxName]?.trim();
            if (!name) continue;

            const startRaw = idxStart !== -1 ? row[idxStart]?.trim() : "";
            const endRaw = idxEnd !== -1 ? row[idxEnd]?.trim() : "";
            const start = normalizeDate(startRaw) || new Date().toISOString().split('T')[0];
            const end = normalizeDate(endRaw); // Will be null if N/A or empty
            
            const reason = idxReason !== -1 ? row[idxReason]?.trim() : "Synced from sheet";
            let status = idxStatus !== -1 ? row[idxStatus]?.trim() : "Approved";
            if (!status) status = "Approved";
            
            // Auto-resolve status if END or EXPIRED is in the date field
            if (endRaw.toUpperCase() === 'END' || endRaw.toUpperCase() === 'EXPIRED') {
              status = 'Ended';
            }
            
            // Normalize EXPIRED to Ended if it's in the status column
            if (status.toUpperCase() === 'EXPIRED') status = 'Ended';
            
            // Normalize ACTIVE to Approved
            if (status.toUpperCase() === 'ACTIVE') status = 'Approved';
            
            // Normalize status
            if (status.toUpperCase() === 'PENDING') status = 'Pending Review';
            else if (!['Pending Review', 'Approved', 'Denied', 'Ended', 'End Requested'].includes(status)) {
              status = 'Approved'; // Default fallback
            }

            newStaged.push({
              officer_name: name,
              start_date: start,
              end_date: end,
              reason: reason || "Synced from external log",
              status: status
            });
          }
          
          // Sort by start_date descending (latest first)
          newStaged.sort((a, b) => {
            const dateA = new Date(a.start_date).getTime() || 0;
            const dateB = new Date(b.start_date).getTime() || 0;
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
      const { data: existingLoas, error: fetchErr } = await supabase
        .from('loa_requests')
        .select('id, officer_name, start_date');
        
      if (fetchErr) throw fetchErr;

      let addedCount = 0;
      let updatedCount = 0;

      setSyncStatus("Saving records to database...");

      for (const req of recordsToInsert) {
        // Find existing by name and start date
        const existing = existingLoas?.find(e => 
          e.officer_name?.toLowerCase() === req.officer_name?.toLowerCase() &&
          e.start_date === req.start_date
        );

        if (existing) {
          // Update status and end date
          const { error: updateErr } = await supabase
            .from('loa_requests')
            .update({
              status: req.status,
              end_date: req.end_date,
              reason: req.reason
            })
            .eq('id', existing.id);
            
          if (updateErr) throw updateErr;
          updatedCount++;
        } else {
          // Insert new
          const { error: insertErr } = await supabase
            .from('loa_requests')
            .insert([req]);
            
          if (insertErr) throw insertErr;
          addedCount++;
        }
      }

      await logAuditAction(
        "LOA_BULK_SYNC",
        "System",
        `Synced LOA records: ${addedCount} added, ${updatedCount} updated from Google Sheets`,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex overflow-hidden">
        
        {/* Left Content (Form & Staging) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-brand" />
              Sync LOA Records
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Area */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {syncResult ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Sync Complete!</h3>
                <p className="text-slate-400">
                  Successfully imported <span className="text-emerald-400 font-bold">{syncResult.added}</span> new records and updated <span className="text-blue-400 font-bold">{syncResult.updated}</span> existing records.
                </p>
                <button 
                  onClick={() => { resetModal(); onSuccess(); onClose(); }}
                  className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close & Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Google Sheets CSV URL</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={csvUrl}
                        onChange={(e) => setCsvUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand focus:border-brand"
                      />
                      {!isSavingLink && (
                        <button 
                          onClick={handleSaveSyncUrl}
                          title="Save this link for later"
                          className="px-3 rounded-md border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleSyncCSV()}
                        disabled={isSyncing || !csvUrl}
                        className="px-4 py-2 bg-brand/20 text-brand border border-brand/30 hover:bg-brand/30 rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Fetch Data
                      </button>
                    </div>

                    {isSavingLink && (
                      <div className="flex gap-2 items-center mt-3 p-3 bg-slate-800/40 rounded-md border border-slate-700 animate-in fade-in slide-in-from-top-2">
                        <input 
                          type="text"
                          value={syncProfileName}
                          onChange={e => setSyncProfileName(e.target.value)}
                          placeholder="Profile Name (e.g., LSPD Active LOAs)"
                          className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand"
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

                    {syncStatus && <p className="text-brand text-xs mt-3 animate-pulse">{syncStatus}</p>}
                  </div>
                  
                  {/* Beautiful Error UI */}
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-400">Sync Error</h4>
                        <p className="text-sm text-rose-200/80 mt-1">{errorMsg}</p>
                      </div>
                    </div>
                  )}
                </div>

                {stagedRequests.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        Staged Records ({selectedStagedIds.size} of {stagedRequests.length} selected)
                      </h3>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                            <tr>
                              <th className="px-4 py-3 font-medium text-slate-400 w-10">
                                <input 
                                  type="checkbox" 
                                  checked={selectedStagedIds.size === stagedRequests.length}
                                  onChange={toggleAll}
                                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                />
                              </th>
                              <th className="px-4 py-3 font-medium text-slate-400">Officer Name</th>
                              <th className="px-4 py-3 font-medium text-slate-400 whitespace-nowrap">Start Date</th>
                              <th className="px-4 py-3 font-medium text-slate-400 whitespace-nowrap">End Date</th>
                              <th className="px-4 py-3 font-medium text-slate-400">Reason</th>
                              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {stagedRequests.map((req, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 py-2">
                                  <input 
                                    type="checkbox"
                                    checked={selectedStagedIds.has(idx)}
                                    onChange={() => toggleOne(idx)}
                                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="px-4 py-2 text-white font-medium">{req.officer_name}</td>
                                <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{req.start_date}</td>
                                <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{req.end_date || <span className="text-slate-500 italic">N/A</span>}</td>
                                <td className="px-4 py-2 text-slate-400 truncate max-w-[150px]" title={req.reason}>{req.reason}</td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 border-slate-700 text-slate-300 font-medium shadow-sm">
                                    {req.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleCommitSync}
                        disabled={isCommitting || selectedStagedIds.size === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isCommitting ? "Importing..." : `Import ${selectedStagedIds.size} Records`}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Right Content (Saved Syncs Sidebar) */}
        <div className="w-80 bg-slate-950 flex flex-col border-l border-slate-800/60 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <LinkIcon className="w-40 h-40" />
          </div>
          
          <div className="p-6 pb-2">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-300 flex items-center gap-2 z-10 relative">
              <LinkIcon className="w-4 h-4 text-brand" /> Saved Syncs
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 z-10 custom-scrollbar">
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
                      <span className="text-[10px] text-slate-400 font-medium select-none">Auto-Sync on Load</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-400">Last: {sync.lastSync}</p>
                    <button 
                      onClick={() => {
                        setCsvUrl(sync.url);
                        handleSyncCSV(sync.url);
                      }}
                      className="text-[11px] font-bold text-brand hover:text-fuchsia-300 uppercase flex items-center gap-1 transition-colors bg-brand/10 px-2 py-1 rounded"
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
