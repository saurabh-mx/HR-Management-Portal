import { useState } from "react";
import { Download, Link as LinkIcon, RotateCcw, X } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';

const TITLE_PATTERNS = [
  'TITLE 1:', 'TITLE 2:', 'TITLE 3:', 'TITLE 4:', 'TITLE 5:',
  'TITLE 6:', 'TITLE 7:', 'TITLE 8:', 'TITLE 9:', 'TITLE 10:',
  'TITLE A:', 'TITLE B:', 'TITLE C:', 'TITLE D:'
];

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
      const titleText = rawLine.substring(titleIdx).replace(/,+/, ' ').replace(/"/g, '').trim();
      currentTitle = titleText;
      continue;
    }
    
    // Check if this is the column header row (starts with "PC #")
    if (rawLine.startsWith('PC #')) continue;
    
    // Skip rows that don't start with P.C.
    if (!rawLine.match(/^P\.C\.\s?\d/)) continue;
    
    // Parse the data row — handle multi-line quoted fields
    let fullLine = rawLine;
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

interface PenalCodeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PenalCodeSyncModal({ isOpen, onClose, onSuccess }: PenalCodeSyncModalProps) {
  const DEFAULT_CSV_URL = 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/export?format=csv';
  
  const [url, setUrl] = useState(DEFAULT_CSV_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Fetching CSV...');
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch CSV. Check the link.');
      const csvText = await response.text();

      setSyncStatus('Parsing data...');
      const parsed = parseCSV(csvText);
      if (parsed.length === 0) throw new Error('No data found in sheet');

      setSyncStatus('Clearing old data...');
      await supabase.from('penal_code').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setSyncStatus('Saving new charges...');
      for (let i = 0; i < parsed.length; i += 50) {
        const batch = parsed.slice(i, i + 50);
        const { error: insertError } = await supabase.from('penal_code').insert(batch);
        if (insertError) throw insertError;
      }

      setSyncStatus(`Successfully imported ${parsed.length} charges!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Import error:', err);
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Penal Code Import</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> CSV Export Link
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste Google Sheets CSV Export Link..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <p className="text-xs text-slate-500">
              Must be a valid CSV export link. The default link points to the master Penal Code sheet.
            </p>
          </div>

          {syncStatus && (
            <div className={`p-4 rounded-xl border text-sm font-medium ${syncStatus.startsWith('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {syncStatus}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing || !url}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all disabled:opacity-50"
            >
              {isSyncing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isSyncing ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
