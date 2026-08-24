import { supabase } from "../supabase/supabaseClient";
import Papa from "papaparse";

/**
 * Runs a complete Google Sheets -> Supabase sync in the background
 * completely bypassing the UI and automatically committing records.
 */
export async function runBackgroundAutoSync(csvUrl: string, fallbackDept?: string) {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as string[][];

          let headerIdx = -1;
          for (let i = 0; i < rows.length; i++) {
            if (rows[i].some(cell => cell && (cell.toUpperCase() === 'BADGE #' || cell.toUpperCase() === 'CALLSIGN'))) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) {
            console.error("AutoSync: Could not find header row.");
            return resolve(false);
          }

          const headerRow = rows[headerIdx];
          const subHeaderRow = rows.length > headerIdx + 1 ? rows[headerIdx + 1] : [];

          const findIdx = (row: string[], ...names: string[]) => {
            return row.findIndex(cell => names.some(n => cell && cell.toUpperCase().trim() === n.toUpperCase()));
          };

          const idxName = findIdx(headerRow, 'NAME');
          const idxBadge = findIdx(headerRow, 'BADGE #', 'CALLSIGN');
          const idxRank = findIdx(headerRow, 'RANK');
          const idxDiscord = findIdx(headerRow, 'DISCORD TAG', 'EMAIL');
          const idxStatus = findIdx(headerRow, 'STATUS');
          const idxCitizenId = findIdx(headerRow, 'CITIZEN ID');
          const idxPhone = findIdx(headerRow, 'PHONE NUMBER');
          const idxJoinDate = findIdx(headerRow, 'DEPARTMENT JOIN DATE');
          const idxDuration = findIdx(headerRow, 'DURATION IN DEPARTMENT');
          const idxPromoDate = findIdx(headerRow, 'LAST PROMOTION DATE');
          const idxDaysPromo = findIdx(headerRow, 'DAYS SINCE LAST PROMOTED');
          const idxSubDept = findIdx(headerRow, 'SUB DEPT.');
          const idxDept = findIdx(headerRow, 'DEPARTMENT', 'DEPT');
          const idxTitles = findIdx(headerRow, 'TITLES');
          const idxNotes = findIdx(headerRow, 'NOTES');

          const idxFto = findIdx(subHeaderRow, 'FTO');
          const idxAsd = findIdx(subHeaderRow, 'ASD');
          const idxHeat = findIdx(subHeaderRow, 'HEAT');
          const idxSwat = findIdx(subHeaderRow, 'SWAT');
          const idxCid = findIdx(subHeaderRow, 'CID');
          const idxMeu = findIdx(subHeaderRow, 'MEU');
          const idxK9 = findIdx(subHeaderRow, 'K-9');
          const idxSop = findIdx(subHeaderRow, 'SOP');

          if (idxName === -1 || idxBadge === -1) {
            console.error("AutoSync: Could not find NAME or BADGE # columns.");
            return resolve(false);
          }

          const { data: currentRoster } = await supabase.from('employees').select('*');
          
          let added = 0;
          let updated = 0;
          let deleted = 0;

          const processedIds = new Set<string>();
          const sheetDepartments = new Set<string>();

          // Sequential updates to avoid overloading the DB
          for (let i = headerIdx + 2; i < rows.length; i++) {
            const row = rows[i];
            
            const name = row[idxName]?.trim();
            const badge_number = row[idxBadge]?.trim();
            
            if (!name || !badge_number) continue;

            const rank = idxRank !== -1 ? row[idxRank]?.trim() || "Cadet" : "Cadet";
            const discord_tag = idxDiscord !== -1 ? row[idxDiscord]?.trim() || null : null;
            const status = (idxStatus !== -1 && row[idxStatus]?.trim()) ? row[idxStatus].trim() : 'ACTIVE';
            
            const generatedDiscordTag = name.toLowerCase().replace(/\s+/g, '.');
            const final_discord_tag = discord_tag || generatedDiscordTag;

            const citizen_id = idxCitizenId !== -1 ? row[idxCitizenId]?.trim() || null : null;
            const phone_number = idxPhone !== -1 ? row[idxPhone]?.trim() || null : null;
            const department_join_date = idxJoinDate !== -1 ? row[idxJoinDate]?.trim() || null : null;
            const duration_in_department = idxDuration !== -1 ? row[idxDuration]?.trim() || null : null;
            const last_promotion_date = idxPromoDate !== -1 ? row[idxPromoDate]?.trim() || null : null;
            const days_since_last_promoted = idxDaysPromo !== -1 ? row[idxDaysPromo]?.trim() || null : null;
            const sub_department = idxSubDept !== -1 ? row[idxSubDept]?.trim() || null : null;
            const sheet_department = idxDept !== -1 ? row[idxDept]?.trim() || null : null;
            const titles = idxTitles !== -1 ? row[idxTitles]?.trim() || null : null;
            const notes = idxNotes !== -1 ? row[idxNotes]?.trim() || null : null;

            const parseCert = (val: string) => (val?.toUpperCase() === 'TRUE');
            const cert_fto = idxFto !== -1 ? parseCert(row[idxFto]) : false;
            const cert_asd = idxAsd !== -1 ? parseCert(row[idxAsd]) : false;
            const cert_heat = idxHeat !== -1 ? parseCert(row[idxHeat]) : false;
            const cert_swat = idxSwat !== -1 ? parseCert(row[idxSwat]) : false;
            const cert_cid = idxCid !== -1 ? parseCert(row[idxCid]) : false;
            const cert_meu = idxMeu !== -1 ? parseCert(row[idxMeu]) : false;
            const cert_k9 = idxK9 !== -1 ? parseCert(row[idxK9]) : false;
            const cert_sop = idxSop !== -1 ? parseCert(row[idxSop]) : false;

            const safeString = (val: any) => String(val || "").trim().toLowerCase();
            const bBadge = safeString(badge_number);
            const bName = safeString(name);

            const isMatch = (e: any) => 
              safeString(e.badge_number) === bBadge || 
              safeString(e.name) === bName;

            const existing = currentRoster?.find(isMatch);
            if (existing) {
              processedIds.add(existing.id);
            }

            const r = existing ? existing.role : 'Patrol Officer';
            
            // Priority: Existing DB Dept -> CSV Dept Column -> Fallback passed to function -> 'SASP'
            let dept = 'SASP';
            if (existing && existing.department) dept = existing.department;
            else if (sheet_department) dept = sheet_department;
            else if (fallbackDept) dept = fallbackDept;

            sheetDepartments.add(dept.toUpperCase());

            let derivedIsAdmin = false;
            if (r === 'admin') {
              derivedIsAdmin = true;
            } else if (existing) {
              if (existing.role === 'admin') {
                derivedIsAdmin = false; // Demoted from admin
              } else {
                derivedIsAdmin = !!existing.is_admin; // Preserve manual DB setting
              }
            }

            const payload = {
              name, badge_number, rank, discord_tag: final_discord_tag, status, citizen_id, phone_number,
              department_join_date, duration_in_department, last_promotion_date, days_since_last_promoted,
              sub_department, titles, notes,
              cert_fto, cert_asd, cert_heat, cert_swat, cert_cid, cert_meu, cert_k9, cert_sop,
              is_admin: derivedIsAdmin,
              role: r,
              department: dept
            };

            if (existing) {
              const { error } = await supabase.from('employees').update(payload).eq('id', existing.id);
              if (!error) updated++;
            } else {
              const { error } = await supabase.from('employees').insert([payload]);
              if (!error) added++;
            }
          }
          
          if (currentRoster) {
            for (const emp of currentRoster) {
              if (!processedIds.has(emp.id) && sheetDepartments.has((emp.department || '').toUpperCase())) {
                const { error } = await supabase.from('employees').delete().eq('id', emp.id);
                if (!error) deleted++;
              }
            }
          }
          
          console.log(`AutoSync Complete: Added ${added}, Updated ${updated}, Deleted ${deleted}`);
          resolve(true);
        },
        error: (error: any) => {
          console.error("AutoSync Parse Error:", error);
          resolve(false);
        }
      });
    });
  } catch (err: any) {
    console.error("AutoSync Fetch Error:", err);
    return false;
  }
}
