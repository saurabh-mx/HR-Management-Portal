import { supabase } from "../supabase/supabaseClient";
import Papa from "papaparse";

export async function fetchAllEmployees() {
  let allRoster: any[] = [];
  let hasMore = true;
  let from = 0;
  const pageSize = 1000;
  
  while (hasMore) {
    const { data, error } = await supabase.from('employees').select('*').range(from, from + pageSize - 1);
    if (error) {
      console.error("Error fetching employees:", error);
      hasMore = false;
      break;
    }
    if (data && data.length > 0) {
      allRoster = [...allRoster, ...data];
      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  return allRoster;
}

export async function runGlobalAutoSync(profiles: {url: string, defaultDept?: string}[]) {
  console.log(`Starting global sync for ${profiles.length} profiles...`);
  const globalProcessedIds = new Set<string>();
  const globalSheetDepartments = new Set<string>();
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;

  for (const profile of profiles) {
    try {
      const result = await processSingleSheet(profile.url, profile.defaultDept);
      if (result) {
        totalAdded += result.added;
        totalUpdated += result.updated;
        result.processedIds.forEach(id => globalProcessedIds.add(id));
        result.sheetDepartments.forEach(dep => globalSheetDepartments.add(dep.toUpperCase()));
      }
    } catch (err) {
      console.error(`Error processing sheet ${profile.url}:`, err);
    }
  }

  // Global deletion phase
  const finalRoster = await fetchAllEmployees();
  for (const emp of finalRoster) {
    if (!globalProcessedIds.has(emp.id) && globalSheetDepartments.has((emp.department || '').toUpperCase())) {
      const { error } = await supabase.from('employees').delete().eq('id', emp.id);
      if (!error) totalDeleted++;
    }
  }

  console.log(`Global AutoSync Complete: Added ${totalAdded}, Updated ${totalUpdated}, Deleted ${totalDeleted}`);
  return true;
}

export async function processSingleSheet(csvUrl: string, fallbackDept?: string): Promise<{added: number, updated: number, processedIds: Set<string>, sheetDepartments: Set<string>, newCredentials: string[]} | null> {
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
            return resolve(null);
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
            return resolve(null);
          }

          const currentRoster = await fetchAllEmployees();
          
          let added = 0;
          let updated = 0;

          const processedIds = new Set<string>();
          const sheetDepartments = new Set<string>();
          const newCredentials: string[] = [];

          // Helper to generate a complex password
          const generateTempPassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < 8; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return 'A' + 'b' + '1' + '!' + password.substring(4);
          };

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
            
            // Priority: CSV Dept Column -> Fallback passed to function -> Existing DB Dept -> 'SASP'
            let dept = 'SASP';
            if (sheet_department) dept = sheet_department;
            else if (fallbackDept) dept = fallbackDept;
            else if (existing && existing.department) dept = existing.department;

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
              const { data: insertedData, error } = await supabase.from('employees').insert([payload]).select();
              if (!error) {
                added++;
                if (insertedData && insertedData.length > 0) {
                  const newEmp = insertedData[0];
                  processedIds.add(newEmp.id);
                  
                  // Auto provision officer credentials
                  const tempPassword = generateTempPassword();
                  const firstName = newEmp.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
                  const cleanCallsign = (newEmp.callsign || newEmp.badge_number || '000').replace(/[^a-zA-Z0-9]/g, '');
                  const username = `${firstName}.${cleanCallsign}`.toLowerCase();
                  
                  await supabase.rpc('admin_provision_officer', {
                    p_officer_id: newEmp.id,
                    p_username: username,
                    p_password: tempPassword
                  });
                  
                  newCredentials.push(`[SUCCESS] ${newEmp.name} -> Username: ${username} | Temp Pass: ${tempPassword}`);
                }
              }
            }
          }
          
          resolve({ added, updated, processedIds, sheetDepartments, newCredentials });
        },
        error: (error: any) => {
          console.error("AutoSync Parse Error:", error);
          resolve(null);
        }
      });
    });
  } catch (err: any) {
    console.error("AutoSync Fetch Error:", err);
    return null;
  }
}
