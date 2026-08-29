import { useState } from "react";
import { Download, Link as LinkIcon, RotateCcw, Database, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 bg-slate-950 border border-slate-800/60 text-slate-200 overflow-hidden rounded-xl shadow-2xl flex flex-col">
        <DialogHeader className="hidden">
          <DialogTitle>Penal Code Import</DialogTitle>
        </DialogHeader>
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-wider uppercase">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            Penal Code Sync
          </h2>
          <p className="text-[11px] text-slate-500 font-medium ml-[52px] -mt-1">Import penal code classifications from a master CSV link.</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-slate-950/40">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-500" /> Master CSV Export Link
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste Google Sheets CSV Export Link..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
              disabled={isSyncing}
            />
            <p className="text-[10px] text-slate-500 font-medium pt-1">
              Must be a valid CSV export link. The default link points to the master Penal Code sheet.
            </p>
          </div>

          {syncStatus && (
            <div className={`p-4 rounded-lg flex items-start gap-3 border ${syncStatus.startsWith('Error') ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {syncStatus.startsWith('Error') ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-sm font-bold">{syncStatus.startsWith('Error') ? 'Sync Error' : 'Status'}</h4>
                <p className="text-sm opacity-80 mt-1">{syncStatus}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/60 mt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg font-bold text-[10px] tracking-wider uppercase text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent">
              Cancel
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing || !url}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 text-[10px] tracking-wider uppercase shadow-lg shadow-emerald-900/20"
            >
              {isSyncing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isSyncing ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
