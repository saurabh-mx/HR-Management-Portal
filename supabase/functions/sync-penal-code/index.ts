// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Papa from 'npm:papaparse';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore: Deno is provided by the Edge Runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Fetch CSV from Google Sheets
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQE40aOQ-HZjmifYwYf60i40Ep-Y6ag-_P3bmIwBekbROIgoKus42xqeudr6sRbbzPpdgajvFZzouz2/pub?gid=0&single=true&output=csv';
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();

    // 2. Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error('CSV Parsing Errors:', parsed.errors);
      throw new Error('Failed to parse CSV correctly.');
    }

    // 3. Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Transform and Upsert data
    // Columns: "PC #", "Offense", "Classification", "Sentence", "Fine", "Points"
    const rows = parsed.data.map((row: any) => ({
      pc_number: row['PC #']?.trim() || '',
      offense: row['Offense']?.trim() || '',
      classification: row['Classification']?.trim() || '',
      sentence: row['Sentence']?.trim() || '',
      fine: row['Fine']?.trim() || '',
      points: row['Points']?.trim() || ''
    })).filter((row: any) => row.pc_number !== ''); // skip empty PC #

    // Clear existing data (optional) or upsert. Since pc_number is unique, we can upsert
    // But to handle deletions from the sheet, it's safer to delete all and insert or just upsert.
    // Given it's a sync, let's delete all and insert to be completely synchronized.
    const { error: deleteError } = await supabase
      .from('penal_code')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // hack to delete all rows

    if (deleteError) {
      throw new Error(`Failed to clear table: ${deleteError.message}`);
    }

    const { error: insertError } = await supabase
      .from('penal_code')
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert rows: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ message: `Successfully synced ${rows.length} charges from Google Sheets.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Sync Error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
