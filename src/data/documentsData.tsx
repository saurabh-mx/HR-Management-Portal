
import { Book, FileSpreadsheet, ShieldAlert, FileText, Zap, AlertTriangle } from 'lucide-react';

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const documents = [
  {
    id: 'sop',
    title: 'Standard Operating Procedures',
    description: 'San Andreas State Police — Official Standard Operating Procedures for all field personnel.',
    icon: <Book className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1O_G17ln-H-2MLofUvsf6gl4NGmEbmn04icIRm2lnHKQ/edit',
    original: 'https://docs.google.com/document/d/1O_G17ln-H-2MLofUvsf6gl4NGmEbmn04icIRm2lnHKQ/view',
    sections: [
      { 
        badge: 'INTRO', 
        title: 'Introduction & What It Takes to be a SASP Member', 
        color: '#3b82f6',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-6 text-sm border-t border-slate-800/80 mt-2">
            <div className="space-y-4">
              <div className="text-[#3b82f6] font-extrabold tracking-widest uppercase text-xs">
                Mission Statement
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                The San Andreas State Police is committed to providing the highest quality of police services to the citizens of San Andreas. We strive to maintain order, protect life and property, and improve the quality of life in our state.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="text-[#3b82f6] font-extrabold tracking-widest uppercase text-xs">
                Core Values
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Integrity', 'Professionalism', 'Respect', 'Accountability', 'Courage', 'Compassion'].map((value, i) => (
                  <li key={i} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></div>
                    <span className="text-slate-300 font-bold tracking-wide">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      },
      { 
        badge: 'RESPONSE CODES', 
        title: 'Response Codes & Meanings', 
        color: '#f59e0b',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-6 text-sm border-t border-slate-800/80 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { code: 'Code 1', desc: 'Routine response. Non-emergency. Obey all traffic laws.' },
                { code: 'Code 2', desc: 'Urgent response. Lights only. No sirens. Proceed with caution.' },
                { code: 'Code 3', desc: 'Emergency response. Lights and sirens. Priority dispatch.' },
                { code: 'Code 4', desc: 'Situation resolved. No further units required.' },
                { code: 'Code 5', desc: 'Felony traffic stop. High risk.' },
                { code: 'Code 77', desc: 'Possible ambush. Use extreme caution.' },
                { code: 'Code 100', desc: 'Barricade situation or units holding position.' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
                  <div className="text-[#f59e0b] font-black text-lg tracking-wide">{item.code}</div>
                  <div className="text-slate-400 font-medium leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        badge: 'PURSUIT', 
        title: 'Pursuit Codes (Condition 1, 2, 3)', 
        color: '#ef4444',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-8 text-sm border-t border-slate-800/80 mt-2">
            <div className="space-y-6">
              {[
                { cond: 'Condition 1', desc: 'Minor traffic infractions, non-violent fleeing. Max 2 units.', color: '#3b82f6' },
                { cond: 'Condition 2', desc: 'Felony evasion, stolen vehicle, reckless driving. Max 4 units. Air-1 authorized.', color: '#f59e0b' },
                { cond: 'Condition 3', desc: 'Violent felonies, shots fired, immediate threat to life. Max 6 units. Air-1 and Interceptor authorized.', color: '#ef4444' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4 sm:items-center p-5 rounded-xl border bg-slate-900/30" style={{ borderColor: hexToRgba(item.color, 0.3) }}>
                  <div className="px-4 py-2 rounded-lg font-black tracking-widest text-xs uppercase" style={{ backgroundColor: hexToRgba(item.color, 0.15), color: item.color }}>
                    {item.cond}
                  </div>
                  <div className="text-slate-300 font-medium flex-1 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        badge: 'RIGHTS', 
        title: 'Miranda Rights (When to read)', 
        color: '#8b5cf6',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-6 text-sm border-t border-slate-800/80 mt-2">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8b5cf6]"></div>
              <p className="text-lg font-bold text-slate-200 leading-relaxed italic">
                "You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you. Do you understand these rights as I have read them to you?"
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-[#8b5cf6] font-extrabold tracking-widest uppercase text-xs">When to Read</div>
              <p className="text-slate-400 font-medium">Must be read prior to any custodial interrogation. Spontaneous utterances do not require Miranda warning.</p>
            </div>
          </div>
        )
      },
      { 
        badge: 'CHASE', 
        title: 'Vehicle Chase Protocol', 
        color: '#ec4899',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-6 text-sm border-t border-slate-800/80 mt-2">
            <ul className="space-y-4">
              {[
                'Primary unit maintains visual and calls out locations/directions.',
                'Secondary unit focuses on radio comms and coordination.',
                'No parallel units unless authorized by supervisor.',
                'Do not pass the primary unit unless requested.',
                'Maintain safe following distance to avoid collisions if suspect brakes suddenly.',
                'Pitting authorized only when safe and within SOP guidelines.'
              ].map((text, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="text-[#ec4899] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                  <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      },
      { 
        badge: 'FORCE', 
        title: 'USE OF FORCE: Escalation Pyramid', 
        color: '#14b8a6',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-8 text-sm border-t border-slate-800/80 mt-2 pb-10">
            <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-4 flex gap-4 items-start">
              <AlertTriangle className="w-6 h-6 text-[#eab308] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[#eab308] font-bold text-sm uppercase tracking-wide">De-escalation Priority</div>
                <div className="text-slate-300 font-medium leading-relaxed">Officers must attempt to de-escalate situations whenever feasible before resorting to higher levels of force.</div>
              </div>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[23px] before:w-0.5 before:bg-slate-800 before:z-0">
              {[
                { title: 'Officer Presence', desc: 'No force used. Considered the best way to resolve a situation.', color: '#3b82f6' },
                { title: 'Verbal Commands', desc: 'Clear and direct orders. Used to persuade or instruct subjects.', color: '#10b981' },
                { title: 'Soft Empty Hand Control', desc: 'Escorts, holds, pressure points. Used for passive resistance.', color: '#f59e0b' },
                { title: 'Hard Empty Hand Control', desc: 'Strikes, takedowns. Used for active resistance.', color: '#f97316' },
                { title: 'Less-Lethal Weapons', desc: 'Taser, baton, beanbag. Used for assaultive behavior.', color: '#ef4444' },
                { title: 'Deadly Force', desc: 'Firearms. Used only when there is an imminent threat of death or serious injury.', color: '#b91c1c' }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex gap-6 items-center group">
                  <div 
                    className="w-12 h-12 rounded-full border-[3px] bg-slate-950 flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-110 shadow-lg"
                    style={{ borderColor: item.color, color: item.color, boxShadow: `0 0 15px ${hexToRgba(item.color, 0.2)}` }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 p-4 rounded-xl border bg-slate-900/40 transition-colors group-hover:bg-slate-900/60" style={{ borderColor: hexToRgba(item.color, 0.2) }}>
                    <div className="font-extrabold uppercase text-xs tracking-wider mb-1" style={{ color: item.color }}>{item.title}</div>
                    <div className="text-slate-400 font-medium leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      { 
        badge: 'RESPONSE', 
        title: 'Criminal Activity Response Table', 
        color: '#10b981',
        content: (
          <div className="p-0 sm:p-0 pt-0 text-sm mt-0 border-t border-slate-800/80 overflow-x-auto custom-scrollbar rounded-b-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs w-1/4">Crime</th>
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs">Units</th>
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs">Employees</th>
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs">Helicopter</th>
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs">Bike</th>
                  <th className="py-5 px-6 font-extrabold text-[#0ea5e9] uppercase tracking-wider text-xs">Interceptor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  ['10-13A (Clean-up)', 'Unlimited', 'Unlimited', 'N/A', 'N/A', 'N/A'],
                  ['Pacific Std / Paleto', '5', '10', 'Yes', 'Yes', 'Yes'],
                  ['Gruppe 6', '4', '10', 'Yes', 'Yes', 'Yes'],
                  ['Jewelry / Fleeca', '4', '10', 'Yes (Either)', 'Yes (Either)', 'No'],
                  ['Drug Run', '4', '10', 'Yes', 'Yes', 'No'],
                  ['Prison Transport', '7', '15', 'Yes', 'No', 'Yes'],
                  ['Shootout vs Officers', '10*', '10', 'Yes', 'N/A', 'N/A']
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{row[0]}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{row[1]}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{row[2]}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{row[3]}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{row[4]}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{row[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 px-6 text-[13px] text-slate-500 font-medium border-t border-slate-800/80 bg-slate-900/20">
              * 10 units max for officer shootouts. Employees = total personnel including ride-alongs.
            </div>
          </div>
        )
      },
      { 
        badge: 'GENERAL', 
        title: 'General Guidelines & Mandatory Equipment', 
        color: '#84cc16',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-8 text-sm border-t border-slate-800/80 mt-2">
            <div className="space-y-4">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                GENERAL RULES
              </div>
              <ul className="space-y-6">
                {[
                  "Always ask suspects if they require legal representation and medical treatment.",
                  "Officers are subject to random drug testing; no being under the influence on duty.",
                  "Units are counted as a vehicle, not individual officers.",
                  "Double ups are highly recommended but NOT mandatory.",
                  "Follow the Escalation of Force Pyramid at all times."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-[#84cc16] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                    <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/5 p-5 space-y-4 mt-8">
              <div className="text-[#84cc16] font-extrabold tracking-widest uppercase text-xs">
                MANDATORY EQUIPMENT
              </div>
              <div className="flex flex-wrap gap-3">
                {['Glock', 'Taser', 'Radio', 'Transponder'].map((item, i) => (
                  <div 
                    key={i} 
                    className="px-4 py-1.5 rounded-full border font-bold text-sm shadow-sm"
                    style={{
                      backgroundColor: hexToRgba('#84cc16', 0.05),
                      borderColor: hexToRgba('#84cc16', 0.3),
                      color: '#84cc16'
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      },
      { 
        badge: 'BOOSTING', 
        title: 'Boosting SOP (Vehicle Theft Response)', 
        color: '#a855f7',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-8 text-sm border-t border-slate-800/80 mt-2">
            <div className="space-y-4">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                VEHICLE SWAP RULES
              </div>
              <ul className="space-y-4">
                {[
                  "Vehicle swaps only allowed on C & D class boosts if original car is already in police custody.",
                  "B-Class and above: NO swaps allowed. Code Amber (1 rear tire pop) initiated immediately."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-[#a855f7] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                    <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 mt-8">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                CHASE TIMING (ACTIVE TRACKER)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Tracker active 20 min', desc: 'Reduce fair pursuit time by 15 min' },
                  { title: 'Tracker active 30 min', desc: 'Reduce fair pursuit time by 20 min' },
                  { title: 'Tracker active 45 min', desc: 'Chase ends' }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="rounded-xl border p-4 text-center space-y-1.5"
                    style={{
                      borderColor: hexToRgba('#a855f7', 0.25),
                      backgroundColor: hexToRgba('#a855f7', 0.05)
                    }}
                  >
                    <div className="text-white font-bold">{item.title}</div>
                    <div className="text-[#c084fc] font-medium text-[13px]">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                DEPLOYMENT BY VEHICLE CLASS
              </div>
              <div className="space-y-3">
                {[
                  { cls: 'X-Class', units: 'Vigero, Schlagen GT, Revolter/STX, Hakuchou, AIR-1, 1x STX Standby' },
                  { cls: 'S-Class', units: '2x Revolter, 1x STX, AIR-1, 1x STX Standby' },
                  { cls: 'A-Class', units: 'STX, Kamoda, Stainer, AIR-1, 1x STX Standby' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
                    <div className="text-[#0ea5e9] font-black w-20 shrink-0">{item.cls}</div>
                    <div className="text-slate-400 font-medium">{item.units}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      },
      { 
        badge: 'RACING', 
        title: 'Racing SOP & Code Amber (Tire Pop Rules)', 
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-6 text-sm border-t border-slate-800/80 mt-2 relative pb-12">
            <div className="space-y-4">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                RACING RESPONSE RULES
              </div>
              <ul className="space-y-4">
                {[
                  "Maximum 10 units responding. Target ONLY one vehicle at a time.",
                  "Unit Composition: 1x AIR-1, 1x STX, 1x Kamoda, 1x Stainer, 1x STX Standby.",
                  "Maintain fair chase for 30 minutes before pitting.",
                  "Vehicle swaps: allowed once within 30 minutes.",
                  "Tire pop permitted after 40 minutes AND a vehicle swap has occurred."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-[#0ea5e9] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                    <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#eab308]/30 bg-[#eab308]/5 p-5 space-y-4 mt-8">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#eab308] shrink-0 fill-[#eab308]" />
                <div className="text-[#eab308] font-extrabold tracking-widest uppercase text-xs">
                  CODE AMBER — TIRE POP RULES
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "Only allowed to pop ONE rear tire, regardless of the situation.",
                  "Must be done on foot — step out of vehicle before popping.",
                  "Exception: In-vehicle pop allowed if suspect is repeatedly ramming or causing head-on collisions."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-[#eab308] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                    <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#0ea5e9]/30 bg-[#0ea5e9]/5 p-5 space-y-2 mt-4">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                RIDE-ALONG UPDATE
              </div>
              <div className="text-slate-400 font-medium text-[15px] leading-relaxed">
                Avoid chasing solo; have at least one Ride-Along when pursuing a vehicle with more than 2 occupants.
              </div>
            </div>
            
            <div className="absolute bottom-4 left-6 text-slate-600 text-[11px] font-medium">
              Last Updated: 04/08/2025 by X-100 / X-200
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'roster',
    title: 'Master Roster',
    description: 'San Andreas State Police — Official Personnel and Rank Directory.',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    url: 'https://docs.google.com/spreadsheets/d/1yucIZVIu4KlfED4G0zujeGv6oDSZYNK_kbY2uMnpFSk/edit',
    original: 'https://docs.google.com/spreadsheets/d/1yucIZVIu4KlfED4G0zujeGv6oDSZYNK_kbY2uMnpFSk/view'
  },
  {
    id: 'uniform',
    title: 'LEO Uniform Guide',
    description: 'San Andreas State Police — Standardized Uniform and Appearance Regulations.',
    icon: <ShieldAlert className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1WQFtopQVk7K1QxLjvxB6z20EgitXSJVKxNrv7mAt18A/edit',
    original: 'https://docs.google.com/document/d/1WQFtopQVk7K1QxLjvxB6z20EgitXSJVKxNrv7mAt18A/view'
  },
  {
    id: 'impound',
    title: 'State Impound SOP',
    description: 'San Andreas State Police — Guidelines and protocols for vehicle seizures.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1EaRgGD-dzD4PhqXNh0wZSoGCyzVWbZswb_bfqXN2hMc/edit',
    original: 'https://docs.google.com/document/d/1EaRgGD-dzD4PhqXNh0wZSoGCyzVWbZswb_bfqXN2hMc/view'
  },
  {
    id: 'penal code',
    title: 'Penal Code',
    description: 'San Andreas State Police — penal code regulations.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/edit',
    original: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/view'
  },
  {
    id: 'case law',
    title: 'Case Law',
    description: 'San Andreas State Police — relevant case law and legal precedents.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/edit',
    original: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/view'
  },
  {
    id: 'Amendments',
    title: 'Amendments',
    description: 'San Andreas State Police — relevant amendments and updates.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/edit',
    original: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/view'
  },
  {
    id: 'Robbery Handbook',
    title: 'Robbery Handbook',
    description: 'San Andreas State Police — guidelines for handling robbery cases.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/edit',
    original: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/view'
  },
  {
    id: 'MDT Templates',
    title: 'MDT Templates',
    description: 'San Andreas State Police — templates for MDT entries.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0',
    original: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/view'
  }
];
