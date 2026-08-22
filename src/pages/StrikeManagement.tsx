import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface Strike {
  id: string;
  name: string;
  reason: string;
  issued_by: string;
  created_at: string;
  action_type?: string;
  strike_level?: string;
  status?: string;
  revoked_by?: string;
  revoked_at?: string;
}

export default function StrikeManagement() {
  const { adminSafeMode } = useAuth();
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrueAdmin, setIsTrueAdmin] = useState(false);
  const [isCommand, setIsCommand] = useState(false);
  const [authorName, setAuthorName] = useState("Command");
  const [searchTerm, setSearchTerm] = useState("");
  const [newStrike, setNewStrike] = useState({ name: "", reason: "" });
  const [actionType, setActionType] = useState("Warning");
  const [strikeLevel, setStrikeLevel] = useState("1/5");
  const [employees, setEmployees] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [strikeToRevoke, setStrikeToRevoke] = useState<string | null>(null);

  useEffect(() => {
    fetchStrikes();
    checkAdminStatus();
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('name, badge_number, department');
    if (data) setEmployees(data);
  }

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;
    const { data } = await supabase.from('employees').select('name, badge_number, is_admin, role').eq('discord_tag', session.user.email.split('@')[0]).single();
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin) setIsTrueAdmin(true);
      if (data.is_admin || ['High Command', 'HR'].includes(data.role)) {
        setIsAdmin(true);
      } else if (data.role === 'Command') {
        setIsCommand(true);
      }
    }
  }

  async function fetchStrikes() {
    const { data } = await supabase.from('strikes').select('*').order('created_at', { ascending: false });
    if (data) setStrikes(data);
  }

  // Calculate cumulative strike points for an officer from active (approved) strikes
  const getOfficerStrikeTotal = (officerName: string) => {
    return strikes
      .filter(s => 
        s.name === officerName && 
        s.action_type === 'Strike' && 
        s.status !== 'revoked'
      )
      .reduce((total, s) => {
        const level = parseInt(s.strike_level?.split('/')[0] || '0');
        return total + level;
      }, 0);
  };

  const handleIssueStrike = async (e: React.FormEvent) => {
    e.preventDefault();

    // Command users: Verbal Warning & Warning go through directly, Strike needs HC/HR approval
    const isCommandOnly = isCommand && !isAdmin;
    const needsApproval = isCommandOnly && actionType === 'Strike';

    const { data, error } = await supabase.from('strikes').insert([{
      name: newStrike.name,
      reason: newStrike.reason,
      issued_by: authorName,
      action_type: actionType,
      strike_level: actionType === 'Strike' ? strikeLevel : null,
      severity: actionType === 'Strike' ? 'High' : actionType === 'Warning' ? 'Medium' : 'Low',
      status: needsApproval ? 'pending' : 'approved'
    }]).select();

    if (error) {
      console.error("Supabase error:", error);
      alert("Failed to submit: " + error.message);
      return;
    }

    if (data) {
      setStrikes([data[0], ...strikes]);
      setNewStrike({ name: "", reason: "" });
      setActionType("Warning");
      setStrikeLevel("1/5");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this disciplinary action?")) return;
    const { error } = await supabase.from('strikes').delete().eq('id', id);
    if (!error) setStrikes(strikes.filter(s => s.id !== id));
  };

  const handleConfirmRevoke = async () => {
    if (!strikeToRevoke) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from('strikes').update({
      status: 'revoked',
      revoked_by: authorName,
      revoked_at: now
    }).eq('id', strikeToRevoke);
    
    if (!error) {
      setStrikes(strikes.map(s => s.id === strikeToRevoke ? { ...s, status: 'revoked', revoked_by: authorName, revoked_at: now } : s));
      setStrikeToRevoke(null);
    } else {
      alert("Failed to revoke: " + error.message);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('strikes').update({ status: 'approved' }).eq('id', id);
    if (!error) setStrikes(strikes.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  };

  // 🔍 SAFE FILTER LOGIC
  const visibleStrikes = strikes.filter(strike => {
    const isApproved = !strike.status || strike.status === 'approved' || strike.status === 'revoked';
    const isPending = strike.status === 'pending';

    if (isAdmin) return true;
    if (isCommand) return isApproved || (isPending && strike.issued_by === authorName);
    return isApproved;
  });

  const filteredStrikes = visibleStrikes.filter(strike => {
    const safeName = strike.name || "";
    const safeReason = strike.reason || "";
    return safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeReason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
              DISCIPLINARY <span className="font-bold text-rose-500">ACTIONS</span>
            </h1>
            <div className="w-24 h-1 bg-rose-500 mt-4 mb-3 shadow-[0_0_15px_rgba(244,63,94,0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Official database for departmental strikes and reprimands.
            </p>
          </div>
        </div>
      </div>

      {(isAdmin || isCommand) && (
        <Card className="bg-slate-900/40 backdrop-blur-md border border-rose-900/50 text-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-rose-400">
              {isCommand && !isAdmin ? "Issue Disciplinary Action" : "Issue Disciplinary Action"}
            </CardTitle>
            {isCommand && !isAdmin && (
              <p className="text-xs text-amber-400/80 mt-1">⚠ You can issue Verbal Warnings & Warnings directly. Strike requests require High Command / HR approval.</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueStrike} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <label className="text-xs font-medium text-slate-400">Officer Name / Callsign</label>
                <input
                  required
                  type="text"
                  value={newStrike.name}
                  onChange={e => {
                    setNewStrike({ ...newStrike, name: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                  placeholder="Start typing name or callsign..."
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && newStrike.name.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto animated-scrollbar bg-slate-900 border border-slate-700 rounded-md shadow-2xl z-50 divide-y divide-slate-800/50">
                    {employees
                      .filter(emp =>
                        (emp.name && emp.name.toLowerCase().includes(newStrike.name.toLowerCase())) ||
                        (emp.badge_number && emp.badge_number.toLowerCase().includes(newStrike.name.toLowerCase()))
                      )
                      .slice(0, 8)
                      .map((emp, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm flex justify-between items-center"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const fullName = `${emp.name} (${emp.badge_number})`;
                            setNewStrike({ ...newStrike, name: fullName });
                            setShowSuggestions(false);
                            // Auto-calculate cumulative strike level
                            const existingTotal = getOfficerStrikeTotal(fullName);
                            const nextLevel = Math.min(existingTotal + 1, 5);
                            setStrikeLevel(`${nextLevel}/5`);
                          }}
                        >
                          <span className="font-medium text-slate-200">{emp.name} <span className="text-slate-500 font-normal">({emp.badge_number})</span></span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{emp.department}</span>
                        </div>
                      ))}
                    {employees.filter(emp => (emp.name && emp.name.toLowerCase().includes(newStrike.name.toLowerCase())) || (emp.badge_number && emp.badge_number.toLowerCase().includes(newStrike.name.toLowerCase()))).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500 italic">No matches found.</div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Action Type</label>
                <select value={actionType} onChange={e => setActionType(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white">
                  <option value="Verbal Warning">Verbal Warning</option>
                  <option value="Warning">Warning</option>
                  <option value="Strike">{isCommand && !isAdmin ? 'Strike (Requires Approval)' : 'Strike'}</option>
                </select>
              </div>

              {actionType === "Strike" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Strike Level</label>
                  {(() => {
                    const existingTotal = newStrike.name ? getOfficerStrikeTotal(newStrike.name) : 0;
                    const currentLevel = parseInt(strikeLevel.split('/')[0] || '1');
                    const cumulativeTotal = existingTotal + currentLevel;
                    return (
                      <>
                        <select value={strikeLevel} onChange={e => setStrikeLevel(e.target.value)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white">
                          <option value="1/5">1/5</option>
                          <option value="2/5">2/5</option>
                          <option value="3/5">3/5</option>
                          <option value="4/5">4/5</option>
                          <option value="5/5">5/5</option>
                        </select>
                        {newStrike.name && (
                          <div className={`text-xs px-2 py-1.5 rounded mt-1 ${
                            cumulativeTotal >= 5 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : cumulativeTotal >= 3
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                          }`}>
                            Existing: <span className="font-bold">{existingTotal}/5</span> + This: <span className="font-bold">{currentLevel}/5</span> = Cumulative: <span className="font-bold">{cumulativeTotal}/5</span>
                            {cumulativeTotal >= 5 && <span className="ml-2 font-bold uppercase text-rose-500">⚠ TERMINATION THRESHOLD</span>}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className={`space-y-2 ${actionType === 'Strike' ? 'md:col-span-2' : ''}`}>
                <label className="text-xs font-medium text-slate-400">Reason / Infraction</label>
                <input required type="text" value={newStrike.reason} onChange={e => setNewStrike({ ...newStrike, reason: e.target.value })} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className={`px-5 py-2 rounded-md font-medium text-sm transition-colors ${
                  isCommand && !isAdmin && actionType === 'Strike'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}>
                  {isCommand && !isAdmin && actionType === 'Strike' ? "Submit Strike Request for Approval" : "Submit Record"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">Department Strike Database</CardTitle>
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search officer or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium">Action Type</th>
                  <th className="pb-3 font-medium">Infraction</th>
                  <th className="pb-3 font-medium">Issued By</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Revoked By</th>
                  {(isAdmin || isCommand) && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStrikes.length === 0 ? (
                  <tr>
                    <td colSpan={(isAdmin || isCommand) ? 8 : 7} className="py-8 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredStrikes.map((strike) => (
                    <tr key={strike.id} className="hover:bg-brand/10 group">
                      <td className="py-3 text-slate-400">{new Date(strike.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-white">{strike.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${strike.action_type === 'Strike' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          strike.action_type === 'Verbal Warning' ? 'bg-brand/20 text-brand border border-brand/30' :
                            'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}>
                          {strike.action_type || 'Warning'} {strike.action_type === 'Strike' && strike.strike_level ? `(${strike.strike_level})` : ''}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{strike.reason}</td>
                      <td className="py-3 text-slate-500">
                        {strike.issued_by}
                      </td>
                      <td className="py-3">
                        {strike.status === 'pending' ? (
                          <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">Pending</span>
                        ) : strike.status === 'revoked' ? (
                          <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-500/20 text-slate-400 border border-slate-500/30">Revoked</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {strike.status === 'revoked' && strike.revoked_by ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-400">By: {strike.revoked_by}</span>
                            {strike.revoked_at && <span>On: {new Date(strike.revoked_at).toLocaleDateString()} at {new Date(strike.revoked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      {(isAdmin || isCommand) && (
                        <td className="py-3 text-right flex justify-end gap-2">
                          {isAdmin && strike.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApprove(strike.id)} className="text-emerald-500 hover:text-emerald-400 font-medium text-xs border border-emerald-500/30 px-2 py-1 rounded">Approve</button>
                              <button onClick={() => handleDelete(strike.id)} className="text-rose-500 hover:text-rose-400 font-medium text-xs border border-rose-500/30 px-2 py-1 rounded">Deny</button>
                            </div>
                          )}
                          {isAdmin && strike.status === 'approved' && (
                            <button onClick={() => setStrikeToRevoke(strike.id)} className="text-slate-500 hover:text-rose-400 font-medium text-xs border border-slate-700/50 px-2 py-1 rounded transition-colors">Revoke</button>
                          )}
                          {isTrueAdmin && adminSafeMode && (strike.status === 'pending' || strike.status === 'revoked') && (
                            <button onClick={() => handleDelete(strike.id)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 className="w-4 h-4 inline" /></button>
                          )}
                          {!isAdmin && isCommand && strike.status === 'pending' && (
                            <button onClick={() => handleDelete(strike.id)} className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1">Cancel Request</button>
                          )}
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
      
      {/* Revoke Confirmation Modal */}
      {strikeToRevoke && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Revoke Disciplinary Action</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to revoke this action? This will update the status to <span className="font-semibold text-slate-300">Revoked</span> and log your name as the revoking officer. This action cannot be easily undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setStrikeToRevoke(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmRevoke}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-lg shadow-rose-900/20"
                >
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
