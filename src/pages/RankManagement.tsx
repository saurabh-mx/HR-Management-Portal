import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Award, ChevronUp, Plus, X, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Promotion {
  id: string;
  officer_name: string;
  old_rank: string;
  new_rank: string;
  authorized_by: string;
  notes: string;
  promotion_date: string;
}

export default function RankManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState({ 
    officer_name: "", 
    old_rank: "", 
    new_rank: "", 
    authorized_by: "", 
    notes: "" 
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('promotion_date', { ascending: false });
    
    if (error) console.error("Error fetching promotions:", error);
    else if (data) setPromotions(data);
  }

  const handleIssuePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('promotions')
      .insert([newPromo])
      .select();

    if (error) {
      console.error("Error adding promotion:", error);
      alert("Failed to issue promotion.");
    } else if (data) {
      setPromotions([data[0], ...promotions]);
      setIsAdding(false);
      setNewPromo({ officer_name: "", old_rank: "", new_rank: "", authorized_by: "", notes: "" });
    }
  };

  const filteredPromotions = promotions.filter(
    (promo) =>
      promo.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.new_rank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rank Management</h1>
          <p className="text-sm text-slate-400">Official log of promotions, commendations, and rank changes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Authorize Promotion"}
        </button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-amber-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-amber-400">Official Rank Change Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssuePromotion} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Officer Name</label>
                <input required type="text" value={newPromo.officer_name} onChange={e => setNewPromo({...newPromo, officer_name: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="e.g. Alex Hawk" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Previous Rank</label>
                <input required type="text" value={newPromo.old_rank} onChange={e => setNewPromo({...newPromo, old_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="e.g. Officer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">New Rank</label>
                <input required type="text" value={newPromo.new_rank} onChange={e => setNewPromo({...newPromo, new_rank: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="e.g. Senior Officer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Authorized By</label>
                <input required type="text" value={newPromo.authorized_by} onChange={e => setNewPromo({...newPromo, authorized_by: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="Your Name/Callsign" />
              </div>
              <div className="space-y-2 lg:col-span-4">
                <label className="text-xs font-medium text-slate-400">Citation / Notes</label>
                <input type="text" value={newPromo.notes} onChange={e => setNewPromo({...newPromo, notes: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="Reason for promotion or commendation details..." />
              </div>
              <button type="submit" className="w-full lg:col-span-4 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-4 py-2 rounded-md font-medium transition-colors border border-amber-500/20 mt-2">
                Submit Official Record
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Promotions</CardTitle>
            <ChevronUp className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{promotions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Recent Commendations</CardTitle>
            <Award className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {promotions.filter(p => p.notes && p.notes.length > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Command Authorizations</CardTitle>
            <Medal className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Set(promotions.map(p => p.authorized_by)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Promotion History</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by officer or rank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
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
                  <th className="pb-3 font-medium">Rank Change</th>
                  <th className="pb-3 font-medium">Authorized By</th>
                  <th className="pb-3 font-medium">Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-400">
                      {new Date(promo.promotion_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-medium text-white">{promo.officer_name}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through">{promo.old_rank}</span>
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 font-medium">{promo.new_rank}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{promo.authorized_by}</td>
                    <td className="py-3 text-slate-300 italic">"{promo.notes}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}