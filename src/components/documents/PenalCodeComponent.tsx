import { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw, AlertTriangle, Scale, Download, Link, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQE40aOQ-HZjmifYwYf60i40Ep-Y6ag-_P3bmIwBekbROIgoKus42xqeudr6sRbbzPpdgajvFZzouz2/pub?gid=0&single=true&output=csv';

// Title headers we want to detect from the sheet
const TITLE_PATTERNS = [
  'TITLE 1:', 'TITLE 2:', 'TITLE 3:', 'TITLE 4:', 'TITLE 5:',
  'TITLE 6:', 'TITLE 7:', 'TITLE 8:', 'TITLE 9:', 'TITLE 10:',
  'TITLE A:', 'TITLE B:', 'TITLE C:', 'TITLE D:'
];

// Title A-D are definition/provision sections with a different column layout
const DEFINITION_TITLES = ['TITLE A', 'TITLE B', 'TITLE C', 'TITLE D'];
const isDefinitionSection = (title: string) => DEFINITION_TITLES.some(t => title.toUpperCase().includes(t));

function parseCSV(text: string) {
  const rows: any[] = [];
  const lines = text.split('\n');
  
  let currentTitle = '';
  let dataLineCount = 0; // track CSV data lines to skip the first 16 (TOC/index rows)
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].replace(/\r$/, '');
    if (!rawLine.trim()) continue;
    
    // Skip the first 16 data rows (table of contents / index)
    dataLineCount++;
    if (dataLineCount <= 16) continue;
    
    // Check if this line is a TITLE header row
    const upperLine = rawLine.toUpperCase();
    const matchedTitle = TITLE_PATTERNS.find(t => upperLine.includes(t));
    if (matchedTitle) {
      const titleIdx = upperLine.indexOf(matchedTitle.split(':')[0]);
      const titleText = rawLine.substring(titleIdx).replace(/,+/g, ' ').replace(/"/g, '').trim();
      currentTitle = titleText;
      continue;
    }
    
    // Check if this is the column header row (starts with "PC #")
    if (rawLine.startsWith('PC #')) continue;
    
    // Skip rows that don't start with P.C.
    if (!rawLine.match(/^P\.C\.\s?\d/)) continue;
    
    // Parse the data row — handle multi-line quoted fields
    let fullLine = rawLine;
    // If the line has an unclosed quote, keep appending next lines
    const quoteCount = (fullLine.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      let j = i + 1;
      while (j < lines.length) {
        fullLine += '\n' + lines[j].replace(/\r$/, '');
        const newQuoteCount = (fullLine.match(/"/g) || []).length;
        if (newQuoteCount % 2 === 0) {
          i = j; // skip these lines
          break;
        }
        j++;
      }
    }
    
    // Parse fields from the line
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let k = 0; k < fullLine.length; k++) {
      const char = fullLine[k];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Map columns based on section type
    const pcNumber = values[0] || '';
    
    if (pcNumber && isDefinitionSection(currentTitle)) {
      // Title A-D layout: PC#, (empty x5), Name, (empty x5), Description
      const name = values[6] || values[1] || '';
      const desc = values[12] || values[11] || '';
      rows.push({
        pc_number: pcNumber.trim(),
        offense: name.trim(),
        classification: '',
        sentence: '',
        fine: '',
        points: '',
        description: desc.trim(),
        title_header: currentTitle
      });
    } else if (pcNumber) {
      // Title 1-10 layout: PC#, Offense, (empty), (empty), CLASSIFICATION, (empty), SENTENCE, (empty), FINE, (empty), LICENSE POINTS, DESCRIPTION
      const offense = values[1] || '';
      const classification = values[4] || values[3] || '';
      const sentence = values[6] || '';
      const fine = values[8] || '';
      const points = values[10] || '';
      const description = values[11] || '';
      rows.push({
        pc_number: pcNumber.trim(),
        offense: offense.trim(),
        classification: classification.trim(),
        sentence: sentence.trim(),
        fine: fine.trim(),
        points: points.trim(),
        description: description.trim(),
        title_header: currentTitle
      });
    }
  }
  return rows;
}

export const PenalCodeComponent = () => {
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [nextSyncIn, setNextSyncIn] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const AUTO_SYNC_INTERVAL = 5 * 60;

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

  useEffect(() => {
    return () => {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const runImport = async (url: string) => {
    setImporting(true);
    setImportResult(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch CSV. Check the link.');
      const csvText = await response.text();

      const parsed = parseCSV(csvText);
      if (parsed.length === 0) throw new Error('No data found in sheet');

      // Clear existing data
      await supabase.from('penal_code').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert in batches of 50
      for (let i = 0; i < parsed.length; i += 50) {
        const batch = parsed.slice(i, i + 50);
        const { error: insertError } = await supabase.from('penal_code').insert(batch);
        if (insertError) throw insertError;
      }

      setImportResult(`Successfully imported ${parsed.length} charges!`);
      await fetchCharges();
    } catch (err: any) {
      console.error('Import error:', err);
      setImportResult(`Error: ${err.message}`);
    } finally {
      setImporting(false);
      setTimeout(() => setImportResult(null), 5000);
    }
  };

  const handleImport = () => {
    const url = customUrl.trim() || DEFAULT_CSV_URL;
    runImport(url);
  };

  const toggleAutoSync = () => {
    if (autoSync) {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      autoSyncRef.current = null;
      countdownRef.current = null;
      setAutoSync(false);
      setNextSyncIn(0);
    } else {
      const url = customUrl.trim() || DEFAULT_CSV_URL;
      runImport(url);
      setAutoSync(true);
      setNextSyncIn(AUTO_SYNC_INTERVAL);

      countdownRef.current = setInterval(() => {
        setNextSyncIn(prev => (prev <= 1 ? AUTO_SYNC_INTERVAL : prev - 1));
      }, 1000);

      autoSyncRef.current = setInterval(() => {
        runImport(url);
        setNextSyncIn(AUTO_SYNC_INTERVAL);
      }, AUTO_SYNC_INTERVAL * 1000);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
      {/* Header */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Scale className="w-6 h-6 text-[#0ea5e9]" />
              San Andreas Penal Code
            </h2>
            <p className="text-slate-400 font-medium mt-1">Official comprehensive list of charges, fines, and times.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={`p-2.5 rounded-xl border transition-all ${showLinkInput ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'}`}
              title="Custom CSV Link"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-bold disabled:opacity-50"
            >
              {importing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={toggleAutoSync}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-bold text-xs ${autoSync ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'}`}
            >
              {autoSync ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              Auto Sync
            </button>
          </div>
        </div>

        {autoSync && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0ea5e9]/5 border border-[#0ea5e9]/20">
            <div className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse" />
            <span className="text-[#0ea5e9] text-xs font-bold">Auto Sync Active</span>
            <span className="text-slate-500 text-xs">— Next sync in <span className="text-[#0ea5e9] font-mono font-bold">{formatCountdown(nextSyncIn)}</span></span>
          </div>
        )}

        {showLinkInput && (
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Paste a custom CSV link here, or leave blank for master sheet..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9]/50 transition-colors"
              />
            </div>
            {customUrl && (
              <button onClick={() => setCustomUrl('')} className="text-xs text-slate-500 hover:text-slate-300 font-bold whitespace-nowrap">
                Reset to Default
              </button>
            )}
          </div>
        )}

        {importResult && (
          <div className={`text-xs font-bold px-4 py-2 rounded-lg ${importResult.startsWith('Error') ? 'text-red-400 bg-red-500/5 border border-red-500/20' : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/20'}`}>
            {importResult}
          </div>
        )}
      </div>

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
            <div key={gIdx} className="space-y-0">
              {/* Title Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0ea5e9]/10 via-slate-900/95 to-slate-900/95 backdrop-blur-sm px-6 py-4 rounded-t-2xl border border-slate-800/80 border-b-0">
                <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full bg-[#0ea5e9]" />
                  {group.title}
                </h3>
              </div>

              {/* Table — different layout for definition vs offense sections */}
              <div className="overflow-x-auto rounded-b-2xl border border-slate-800/80 border-t-0">
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
                        <tr key={charge.id} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors align-top">
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
                              className={`border-t border-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40' : 'hover:bg-slate-800/30'}`}
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
