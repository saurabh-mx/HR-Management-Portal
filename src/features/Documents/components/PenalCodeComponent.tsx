import { useState, useEffect } from 'react';
import { Search, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';

// Removed parseCSV logic - now in PenalCodeSyncModal

const DEFINITION_TITLES = ['TITLE A', 'TITLE B', 'TITLE C', 'TITLE D'];
const isDefinitionSection = (title: string) => DEFINITION_TITLES.some(t => title.toUpperCase().includes(t));

export const PenalCodeComponent = () => {
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchCharges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('penal_code')
      .select('*')
      .order('pc_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching penal code:', error);
    } else {
      setCharges(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCharges();
  }, []);





  const getSeverityColor = (classification: string) => {
    const cls = (classification || '').toLowerCase();
    if (cls.includes('capital')) return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    if (cls.includes('felony')) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (cls.includes('wobbler')) return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    if (cls.includes('misdemeanor')) return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    if (cls.includes('infraction')) return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
  };

  const categories = Array.from(new Set(charges.map(c => c.classification).filter(Boolean)));

  const filteredCharges = charges.filter(c => {
    const matchesSearch = (c.offense || '').toLowerCase().includes(search.toLowerCase()) || 
                          (c.pc_number || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? c.classification === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // Group charges by title_header
  const groupedMap: Record<string, any[]> = {};
  filteredCharges.forEach(charge => {
    const header = charge.title_header || 'Other';
    if (!groupedMap[header]) groupedMap[header] = [];
    groupedMap[header].push(charge);
  });

  // Custom sort order: TITLE A, TITLE B, TITLE 1-10, TITLE C, TITLE D
  const titleOrder = (title: string): number => {
    const upper = title.toUpperCase();
    if (upper.includes('TITLE A')) return 0;
    if (upper.includes('TITLE B')) return 1;
    if (upper.includes('TITLE 1:')) return 10;
    if (upper.includes('TITLE 2:')) return 11;
    if (upper.includes('TITLE 3:')) return 12;
    if (upper.includes('TITLE 4:')) return 13;
    if (upper.includes('TITLE 5:')) return 14;
    if (upper.includes('TITLE 6:')) return 15;
    if (upper.includes('TITLE 7:')) return 16;
    if (upper.includes('TITLE 8:')) return 17;
    if (upper.includes('TITLE 9:')) return 18;
    if (upper.includes('TITLE 10:')) return 19;
    if (upper.includes('TITLE C')) return 20;
    if (upper.includes('TITLE D')) return 21;
    return 99;
  };

  const grouped = Object.entries(groupedMap)
    .map(([title, items]) => ({ title, items }))
    .sort((a, b) => titleOrder(a.title) - titleOrder(b.title));

  return (
    <div className="space-y-6 pt-4 text-sm w-full">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by charge name, PC code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9]/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${!categoryFilter ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
          >
            All
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${categoryFilter === cat ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold gap-3">
          <RotateCcw className="w-5 h-5 animate-spin" /> Loading Database...
        </div>
      ) : filteredCharges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-slate-800/50 rounded-2xl bg-slate-900/20">
          <AlertTriangle className="w-10 h-10 text-slate-600" />
          <p className="font-bold">No charges found.</p>
          <p className="text-slate-600 text-xs">Click "Import" above to populate the database from Google Sheet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0 animate-fadeSlideIn opacity-0" style={{ animationDelay: `${gIdx * 150}ms`, animationFillMode: 'forwards' }}>
              {/* Title Header */}
              <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-6 py-4 rounded-t-2xl border border-slate-700/50 border-b-0 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-6 rounded-full transition-all duration-500 group-hover:h-8 group-hover:w-1.5 bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                  <h3 
                    className="text-lg md:text-xl font-black tracking-wide drop-shadow-md transition-all duration-500 group-hover:scale-[1.01]"
                    style={{
                      background: `linear-gradient(135deg, #ffffff 0%, #0ea5e9 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 0 8px rgba(14,165,233,0.4))`
                    }}
                  >
                    {group.title}
                  </h3>
                </div>
              </div>

              {/* Table — different layout for definition vs offense sections */}
              <div className="overflow-x-auto rounded-b-2xl border border-slate-700/50 border-t-0 bg-[#0f172a]/90 backdrop-blur-sm relative z-10 shadow-2xl">
                {isDefinitionSection(group.title) ? (
                  /* Simple table for Title A-D (Sentencing, Definitions, Provisions) */
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/80">
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[120px]">PC #</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[220px]">Name</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((charge) => (
                        <tr key={charge.id} className="border-t border-slate-800/50 hover:bg-slate-800/60 hover:scale-[1.01] hover:shadow-lg hover:shadow-[#0ea5e9]/10 transition-all duration-300 align-top group relative z-10 cursor-default">
                          <td className="px-4 py-3">
                            <span className="text-[#0ea5e9] font-mono font-bold text-xs">{charge.pc_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white font-bold text-sm">{charge.offense}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{charge.description || '—'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Full table for Title 1-10 (Criminal Offenses) */
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/80">
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[100px]">PC #</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500">Offense</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[130px]">Class</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[100px]">Sentence</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[100px]">Fine</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[80px]">Points</th>
                        <th className="px-4 py-3 text-[10px] font-black tracking-widest uppercase text-slate-500 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((charge) => {
                        const severity = getSeverityColor(charge.classification);
                        const isExpanded = expandedRow === charge.id;
                        return (
                          <>
                            <tr
                              key={charge.id}
                              className={`border-t border-slate-800/50 transition-all duration-300 cursor-pointer relative z-10 ${isExpanded ? 'bg-slate-800/60 shadow-lg' : 'hover:bg-slate-800/60 hover:scale-[1.01] hover:shadow-lg hover:shadow-[#0ea5e9]/10'}`}
                              onClick={() => setExpandedRow(isExpanded ? null : charge.id)}
                            >
                              <td className="px-4 py-3">
                                <span className="text-[#0ea5e9] font-mono font-bold text-xs">{charge.pc_number}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-white font-semibold text-sm">{charge.offense}</span>
                              </td>
                              <td className="px-4 py-3">
                                {charge.classification && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${severity.text} ${severity.bg} ${severity.border}`}>
                                    {charge.classification}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-white font-mono font-bold text-xs">{charge.sentence || '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-white font-mono font-bold text-xs">{charge.fine || '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-white font-mono font-bold text-xs">{charge.points || '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                {charge.description && (
                                  isExpanded ? 
                                    <ChevronUp className="w-4 h-4 text-slate-500" /> : 
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                              </td>
                            </tr>
                            {isExpanded && charge.description && (
                              <tr key={`${charge.id}-desc`} className="bg-slate-800/20">
                                <td colSpan={7} className="px-6 py-4">
                                  <div className="flex gap-3">
                                    <div className="w-1 rounded-full bg-[#0ea5e9]/30 shrink-0" />
                                    <div>
                                      <div className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1.5">Description</div>
                                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{charge.description}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer stats */}
      {!loading && filteredCharges.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/30 border border-slate-800/50 text-xs text-slate-500">
          <span>Showing <span className="text-white font-bold">{filteredCharges.length}</span> of <span className="text-white font-bold">{charges.length}</span> charges</span>
          <span>{grouped.length} sections</span>
        </div>
      )}
    </div>
  );
};
