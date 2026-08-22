import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, XCircle, Clock, Trash2, Shield, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PromotionRecord {
  id: string;
  officer_name: string;
  old_rank?: string;
  current_rank?: string;
  requested_rank?: string;
  new_rank?: string;
  reason: string;
  status: string;
  created_by?: string;
  authorized_by?: string;
  processed_by?: string;
  created_at: string;
}

export default function RankManagement() {
  const [records, setRecords] = useState<PromotionRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authorName, setAuthorName] = useState("Command");
  
  // NEW: Employee Search State
  const [employees, setEmployees] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // NEW: Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // NEW: Bulk Select State
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // RANK HIERARCHY (Highest to Lowest)
  const rankGroups = [
    ["Chief", "Sheriff", "Game Warden"],
    ["Asst. Chief", "Colonel", "Asst. Game Warden"],
    ["Captain", "Major", "Lead Ranger"],
    ["Lieutenant"],
    ["Head-Sergeant"],
    ["Sergeant First Class"],
    ["Sergeant"],
    ["Corporal"],
    ["Senior-Officer", "Senior-Deputy", "Senior-Ranger"],
    ["Officer First Class", "Deputy First Class", "Ranger First Class"],
    ["Officer", "Deputy", "Ranger"],
    ["Cadet"]
  ];

  const getRankIndex = (rank: string) => {
    if (!rank) return 999;
    const lowerRank = rank.toLowerCase();
    for (let i = 0; i < rankGroups.length; i++) {
      if (rankGroups[i].some(r => r.toLowerCase() === lowerRank)) return i;
    }
    return 999; // Unknown rank
  };

  const getDeptIndex = (dept?: string) => {
    if (!dept) return 0;
    const d = dept.toUpperCase();
    if (d.includes("BCSO")) return 1;
    if (d.includes("SAPR") || d.includes("PARK") || d.includes("RANGER")) return 2;
    return 0; // Default to LSPD / SASP
  };

  const getAvailableRanks = () => {
    const currentIndex = getRankIndex(newRecord.current_rank);
    if (currentIndex === 999) return []; // If unknown, maybe just return all or empty? Let's return all.
    
    const deptIdx = getDeptIndex(newRecord.department);
    let availableRanks: string[] = [];
    
    if (newRecord.action_type === "Promotion") {
      // Promotion = ranks ABOVE current rank (lower index)
      for (let i = 0; i < currentIndex; i++) {
        const tier = rankGroups[i];
        availableRanks.push(tier.length === 3 ? tier[deptIdx] : tier[0]);
      }
    } else if (newRecord.action_type === "Demotion") {
      // Demotion = ranks BELOW current rank (higher index)
      for (let i = currentIndex + 1; i < rankGroups.length; i++) {
        const tier = rankGroups[i];
        availableRanks.push(tier.length === 3 ? tier[deptIdx] : tier[0]);
      }
    }
    return availableRanks;
  };

  // NEW: Modal State for Confirmations
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'Approve' | 'Deny' | 'Delete' | null;
    recordId: string | null;
  }>({ isOpen: false, type: null, recordId: null });

  const [newRecord, setNewRecord] = useState({
    officer_name: "",
    current_rank: "",
    department: "",
    action_type: "Promotion",
    requested_rank: "",
    reason: "",
    demotion_duration: ""
  });

  useEffect(() => {
    fetchRecords();
    checkAdminStatus();
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('name, badge_number, rank, department');
    if (data) setEmployees(data);
  }

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from('employees')
      .select('name, badge_number, is_admin, role')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin || ['High Command', 'HR'].includes(data.role)) setIsAdmin(true);
    }
    setIsCheckingAuth(false);
  }

  async function fetchRecords() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching promotions:", error);
    else if (data) setRecords(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the requested rank with the action type and optional duration
    let formattedRank = `[${newRecord.action_type}] ${newRecord.requested_rank}`;
    if (newRecord.action_type === "Demotion" && newRecord.demotion_duration) {
      formattedRank += ` (Until: ${newRecord.demotion_duration})`;
    }
    
    const { data, error } = await supabase
      .from('promotions')
      .insert([{ 
        officer_name: newRecord.officer_name,
        current_rank: newRecord.current_rank,
        old_rank: newRecord.current_rank, // Satisfy the DB constraint
        requested_rank: formattedRank,
        new_rank: formattedRank, // Satisfy the DB constraint
        reason: newRecord.reason,
        status: 'Pending Review', 
        created_by: authorName,
        authorized_by: authorName // Satisfy the DB constraint
      }])
      .select();

    if (error) alert("Failed to submit request: " + error.message);
    else if (data) {
      setRecords([data[0], ...records]);
      setNewRecord({ officer_name: "", current_rank: "", department: "", action_type: "Promotion", requested_rank: "", reason: "", demotion_duration: "" });
    }
  };

  const openModal = (id: string, type: 'Approve' | 'Deny' | 'Delete') => {
    setModalState({ isOpen: true, type, recordId: id });
  };

  const handleConfirmAction = async () => {
    if (!modalState.recordId || !modalState.type) return;

    const id = modalState.recordId;
    const type = modalState.type;

    if (type === 'Delete') {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (!error) setRecords(records.filter(rec => rec.id !== id));
    } else {
      const newStatus = type === 'Approve' ? 'Approved' : 'Denied';
      const { error } = await supabase.from('promotions').update({ 
        status: newStatus,
        processed_by: authorName
      }).eq('id', id);
      
      if (!error) {
        setRecords(records.map(rec => rec.id === id ? { ...rec, status: newStatus, processed_by: authorName } : rec));
      }
    }

    setModalState({ isOpen: false, type: null, recordId: null });
  };

  const handleBulkAction = async (action: 'Approved' | 'Denied') => {
    if (selectedRecords.length === 0) return;
    setIsProcessingBulk(true);

    const { error } = await supabase
      .from('promotions')
      .update({ status: action, processed_by: authorName })
      .in('id', selectedRecords);

    if (error) {
      alert(`Failed to bulk ${action.toLowerCase()} records: ` + error.message);
    } else {
      setRecords(records.map(r => 
        selectedRecords.includes(r.id) ? { ...r, status: action, processed_by: authorName } : r
      ));
      setSelectedRecords([]);
    }
    setIsProcessingBulk(false);
  };

  // NEW: Filter and Search Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full space-y-4">
        <Shield className="w-16 h-16 text-rose-500 opacity-50" />
        <h2 className="text-2xl font-bold tracking-widest text-slate-200 uppercase">Access Denied</h2>
        <p className="text-slate-400 font-light">You do not have clearance to view this module.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <Award className="w-10 h-10 text-brand" />
              RANK & <span className="font-bold text-brand">COMMENDATIONS</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Manage departmental promotions, commendations, and rank updates.
            </p>
          </div>
        </div>
      </div>

      {/* SUBMISSION FORM (ADMIN ONLY) */}
      {isAdmin && (
        <Card className="bg-slate-900/40 backdrop-blur-md border border-amber-900/50 text-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-amber-400 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Submit Rank / Commendation Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 relative md:col-span-1">
                <label className="text-xs font-medium text-slate-400">Officer Name</label>
                <input 
                  required 
                  type="text" 
                  value={newRecord.officer_name} 
                  onChange={e => {
                    setNewRecord({...newRecord, officer_name: e.target.value});
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" 
                  placeholder="Type name or callsign..." 
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && newRecord.officer_name.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto animated-scrollbar bg-slate-900 border border-slate-700 rounded-md shadow-2xl z-50 divide-y divide-slate-800/50">
                    {employees
                      .filter(emp =>
                        (emp.name && emp.name.toLowerCase().includes(newRecord.officer_name.toLowerCase())) ||
                        (emp.badge_number && emp.badge_number.toLowerCase().includes(newRecord.officer_name.toLowerCase()))
                      )
                      .slice(0, 8)
                      .map((emp, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm flex justify-between items-center"
                          onClick={() => {
                            setNewRecord({ 
                              ...newRecord, 
                              officer_name: `${emp.name} (${emp.badge_number})`,
                              current_rank: emp.rank || "",
                              department: emp.department || ""
                            });
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-medium text-slate-200">{emp.name} <span className="text-slate-500 font-normal">({emp.badge_number})</span></span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{emp.rank}</span>
                        </div>
                      ))}
                    {employees.filter(emp => (emp.name && emp.name.toLowerCase().includes(newRecord.officer_name.toLowerCase())) || (emp.badge_number && emp.badge_number.toLowerCase().includes(newRecord.officer_name.toLowerCase()))).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500 italic">No matches found.</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-slate-400">Department</label>
                <input 
                  readOnly 
                  type="text" 
                  value={newRecord.department} 
                  className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" 
                  placeholder="Auto-filled" 
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-slate-400">Current Rank</label>
                <input 
                  readOnly 
                  type="text" 
                  value={newRecord.current_rank} 
                  className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" 
                  placeholder="Auto-filled" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-slate-400">Action Type</label>
                <select 
                  value={newRecord.action_type}
                  onChange={e => setNewRecord({...newRecord, action_type: e.target.value})}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 appearance-none"
                >
                  <option value="Promotion">Promotion</option>
                  <option value="Demotion">Demotion</option>
                  <option value="Commendation">Commendation</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-slate-400">Target Rank / Award</label>
                {newRecord.action_type === 'Commendation' ? (
                  <input required type="text" value={newRecord.requested_rank} onChange={e => setNewRecord({...newRecord, requested_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="e.g. Medal of Valor" />
                ) : (
                  <select 
                    required 
                    value={newRecord.requested_rank} 
                    onChange={e => setNewRecord({...newRecord, requested_rank: e.target.value})} 
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 appearance-none"
                  >
                    <option value="" disabled>Select a rank...</option>
                    {getAvailableRanks().map((rank, idx) => (
                      <option key={idx} value={rank}>{rank}</option>
                    ))}
                  </select>
                )}
              </div>

              {newRecord.action_type === 'Demotion' && (
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-medium text-rose-400">Demoted Until (Optional)</label>
                  <input 
                    type="date" 
                    value={newRecord.demotion_duration} 
                    onChange={e => setNewRecord({...newRecord, demotion_duration: e.target.value})} 
                    onClick={e => (e.target as HTMLInputElement).showPicker()}
                    className="w-full rounded-md border border-rose-900/50 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-rose-500 cursor-pointer" 
                  />
                </div>
              )}

              <div className={`space-y-2 ${newRecord.action_type === 'Demotion' ? 'md:col-span-3' : 'md:col-span-4'}`}>
                <label className="text-xs font-medium text-slate-400">Reasoning / Citation</label>
                <input required type="text" value={newRecord.reason} onChange={e => setNewRecord({...newRecord, reason: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500" placeholder="Detail the reasoning for this request..." />
              </div>
              
              <div className="md:col-span-4 flex justify-end">
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm">
                  Submit Request
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RECORDS BOARD WITH SEARCH & FILTER */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium">Departmental Records</CardTitle>
            
            {/* NEW: Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search officers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 w-full sm:w-48 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Denied">Denied</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* BULK ACTIONS TOOLBAR */}
          {isAdmin && selectedRecords.length > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-amber-400 font-medium text-sm">
                {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('Approved')}
                  disabled={isProcessingBulk}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                >
                  {isProcessingBulk ? 'Processing...' : 'Approve Selected'}
                </button>
                <button 
                  onClick={() => handleBulkAction('Denied')}
                  disabled={isProcessingBulk}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                >
                  {isProcessingBulk ? 'Processing...' : 'Deny Selected'}
                </button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  {isAdmin && (
                    <th className="pb-3 px-2 font-medium w-10">
                      <input 
                        type="checkbox" 
                        checked={filteredRecords.length > 0 && selectedRecords.length === filteredRecords.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords(filteredRecords.map(r => r.id));
                          } else {
                            setSelectedRecords([]);
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                      />
                    </th>
                  )}
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Requested Rank</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Processed By</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="py-8 text-center text-slate-500">
                      No records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-brand/10 group transition-colors">
                      {isAdmin && (
                        <td className="py-3 px-2">
                          <input 
                            type="checkbox" 
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords(prev => [...prev, record.id]);
                              } else {
                                setSelectedRecords(prev => prev.filter(id => id !== record.id));
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                          />
                        </td>
                      )}
                      <td className="py-3 text-slate-400">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{record.officer_name}</td>
                      <td className="py-3 text-amber-400 font-medium">{record.requested_rank || record.new_rank}</td>
                      <td className="py-3 text-slate-300 max-w-[200px] truncate" title={record.reason}>{record.reason}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          record.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          record.status === 'Denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {record.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> : 
                           record.status === 'Denied' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-medium">
                        {record.processed_by || '—'}
                      </td>
                      
                      {/* ADMIN ACTIONS */}
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {record.status === 'Pending Review' && (
                              <>
                                <button onClick={() => openModal(record.id, 'Approve')} className="text-emerald-500 hover:text-emerald-400 text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded transition-colors">Approve</button>
                                <button onClick={() => openModal(record.id, 'Deny')} className="text-rose-500 hover:text-rose-400 text-xs font-medium border border-rose-500/30 bg-rose-500/10 px-2 py-1 rounded transition-colors">Deny</button>
                              </>
                            )}
                            <button onClick={() => openModal(record.id, 'Delete')} className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CONFIRMATION MODAL */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl max-w-sm w-full p-6 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              modalState.type === 'Approve' ? 'bg-emerald-500' : 
              modalState.type === 'Deny' ? 'bg-rose-500' : 'bg-red-700'
            }`}></div>
            
            <h3 className="text-xl font-bold tracking-wider text-slate-200 mb-2 mt-2">Confirm Action</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to <strong className={`font-bold uppercase tracking-wider ${
                modalState.type === 'Approve' ? 'text-emerald-500' : 
                modalState.type === 'Deny' ? 'text-rose-500' : 'text-red-500'
              }`}>{modalState.type}</strong> this request? 
              {modalState.type === 'Delete' ? " This will permanently erase it." : " This action will log your name."}
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalState({ isOpen: false, type: null, recordId: null })}
                className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors border shadow-lg ${
                  modalState.type === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-500/20' : 
                  modalState.type === 'Deny' ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/50 shadow-rose-500/20' : 
                  'bg-red-700 hover:bg-red-600 border-red-600/50 shadow-red-700/20'
                }`}
              >
                Confirm {modalState.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}