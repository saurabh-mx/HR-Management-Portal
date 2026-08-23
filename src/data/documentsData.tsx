import { useState } from 'react';
import { Book, ShieldAlert, FileText, Zap, AlertTriangle, Scale, CheckCircle2, XCircle, Map as MapIcon, Crosshair } from 'lucide-react';
import { PenalCodeComponent } from '../components/documents/PenalCodeComponent';

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MDTTemplatesComponent = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      title: 'Debrief / Arrest Report Template',
      windowTitle: 'SASP — BCSO / LSPD',
      content: `SASP — [DEPT] - [BADGE] [Officer Name] - ARREST REPORT
________________________________________

INCIDENT INFORMATION
📅 DATE OF INCIDENT: DD/MM/YYYY
⌚ TIME OF INCIDENT: GMT+5:30
🗺️ LOCATION (INITIAL): [Location]
🔴 LOCATION (CONCLUSION): [Location]
________________________________________

SCENE COMMAND: [Commanding Officer]
HIGHEST ON SCENE: [Highest Ranking Officer]
NEGOTIATOR: [Negotiating Officer / N/A]
EVIDENCE COLLECTOR: [Officer Name]
________________________________________

SUMMARY:
[Officer Name]:
[Detailed summary of the incident]
________________________________________

PROCESSING INFORMATION:
👮 MIRANDA RIGHTS: Read & Acknowledged
🏥 MEDICAL: Declined / Received @ Pillbox / Received On Scene
🍔 SUSTENANCE: Declined / Received
⚖️ LEGAL COUNSEL: Declined / Represented By Lawyer / Reductions approved by Supervisor
🆔 Identified As <> By MDT Picture, ID Card, DNA Sample
📸 Mugshot Was Already On File / Updated
🔎 Gun Serials Were Ran, Came Back Cold / Hot [Report #]
🩸 DNA For Suspect Was Already On File / Taken
🔫 Suspect Tested For GSR & Was Negative / Positive
🤝 Plead Guilty / No Contest / Not Guilty & Acknowledged Terms & Conditions
🚓 Transported To Bolingbrook By [Guards/Callsigns]
________________________________________

VEHICLES INVOLVED:
🚗 MAKE & MODEL: [Vehicle]
🏷️ PLATE: [Plate Number]
📄 DMV REGISTRATION: REGISTERED / UNREGISTERED
________________________________________

EVIDENCE LOCKER NUMBER: [#]
EVIDENCE LOCKER LOCATION: [Location]
CONFISCATED ITEMS (SEIZED AS EVIDENCE): [List items]
CONFISCATED ITEMS (MARKED FOR RETURN): [List items]
RETURNED BY: [Officer Name]
________________________________________

FINE: $[Amount]
TIME: [Months]
FINE & PROCESSED BY:
NAME OF SUSPECT: [Name]     NAME OF OFFICER: [Name]`
    },
    {
      title: 'MDT Incident Summary Templates',
      windowTitle: 'Scene Report Summaries',
      content: `VEHICLE TAMPERING (10-81):
On dispatch, an incident of Grand Theft Auto of a [vehicle description] was reported at [Location].
Officer [Name] was first to respond and initiated a pursuit. Suspect(s) refused to comply and began evading.
The pursuit continued through [streets/highways] at high speeds. Suspects were neutralized using nonlethal force and apprehended. Medical assistance was requested. Suspects were identified as [Names].
As suspects pleaded guilty, they have been fined and processed.
Commanding Officer: [Name]
Items Taken: [List] | Items to be Returned: [List]

________________________________________

BREAKING & ENTERING (10-33):
On [date] at [time], a house robbery was reported at [location]. Officers [Names] were first to respond.
[# suspects] were spotted. Officers requested suspects to surrender — suspects evaded in [vehicle].
Pursuit followed. Suspects were neutralized using nonlethal force and apprehended.
Moved to hospital, then MRPD for processing. Suspects identified as [Names]. Plead guilty — fined.
Commanding Officer: [Name]
Items Taken: [List] | Items to be Returned: [List]

________________________________________

STORE ROBBERY (24/7):
On [date] at [time], a store robbery was reported at [location]. Officers [Names] responded.
[# suspects] spotted inside. Negotiations began — suspects put forward hostage demands.
Officers agreed to preserve hostage. Suspects fled in [vehicle]. Pursuit, neutralized, apprehended.
Commanding Officer: [Name] | Hostage Name: [Name]
Items Taken: [List] | Items to be Returned: [List]

________________________________________

BANK ROBBERY (10-90 / FLEECA):
On [date] at [time], robbery reported at Fleeca Bank [Location]. Negotiations by [Officers].
Suspects robbed bank and fled in [vehicle]. Pursuit — suspects neutralized. Moved to hospital, then MRPD.
Suspects: [Names]. Plead guilty — fined and processed.
Commanding Officer: [Name] | Hostage Name: [Name]
Items Taken: [List] | Items to be Returned: [List]`
    },
    {
      title: 'Dispatch Call Template',
      windowTitle: 'Radio & Dispatch Protocols',
      content: `DISPATCH CALL FORMAT:
[Callsign] to Dispatch — [10-Code] — [Location]

EXAMPLE DISPATCH CALLS:

10-11 — Animal Problem
"Dispatch, 10-11 at [Location]. Animal causing disturbance. Requesting [animal control/backup]."

10-15 — Prisoner in Custody
"Dispatch, 10-15. Suspect [Name] in custody. Transporting to [Facility]. ETA [Time]."

10-31 — Crime in Progress
"Dispatch, 10-31 in progress at [Location]. [Description of crime]. Requesting backup."

10-33 — Emergency / Break-In
"ALL UNITS — 10-33 at [Location]. [# suspects]. [Weapons/Hostages]. OFFICER NEEDS ASSISTANCE."

10-41 — On Duty
"Dispatch, [Callsign] is 10-41. Available for service."

10-42 — Off Duty
"Dispatch, [Callsign] is 10-42. Going off duty."

10-51 — Wrecker Needed
"Dispatch, 10-51 at [Location]. [Vehicle Description/Plate]."

10-80 — Pursuit in Progress
"Dispatch, 10-80. Pursuit of [Vehicle] heading [Direction] on [Street]. Speed: [Approx]. Reason: [Offense]."

10-90 — Bank Robbery
"ALL UNITS — 10-90 in progress at [Bank Name/Location]. [# suspects]. Armed. ALL AVAILABLE UNITS RESPOND."

RADIO ETIQUETTE:
• Always identify your callsign first
• Speak clearly — no slang on official channels
• Confirm receipt: "Copy that" or "10-4"
• Emergency override: "ALL UNITS — 10-33"
• End transmissions: "[Callsign] out"`
    }
  ];

  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-wrap gap-4 mb-6">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`group relative px-6 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-500 overflow-hidden ${activeTab === idx
              ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/40 shadow-[0_0_20px_rgba(14,165,233,0.2)] scale-105'
              : 'bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group text-slate-400 border border-slate-800/80 hover:bg-slate-800/50 hover:text-white hover:border-slate-700 hover:scale-105'
              }`}
          >
            {activeTab === idx && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0ea5e9]/10 to-transparent animate-pulse pointer-events-none" />
            )}
            <span className="relative z-10">{tab.title}</span>
          </button>
        ))}
      </div>

      <div className="group rounded-3xl border border-slate-700/50 bg-[#020617]/90 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden relative transition-all duration-500 hover:shadow-[0_30px_60px_-20px_rgba(14,165,233,0.15)] hover:border-[#0ea5e9]/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Terminal Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-slate-900/80 border-b border-slate-800/80 relative z-10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div className="text-[#0ea5e9] text-xs font-black tracking-[0.2em] uppercase ml-4">
            {tabs[activeTab].windowTitle}
          </div>
        </div>

        {/* Terminal Content */}
        <div className="relative z-10 p-8 overflow-x-auto">
          <div className="text-emerald-400 font-mono text-[13px] sm:text-sm leading-loose whitespace-pre-wrap selection:bg-emerald-500/30">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export const documents = [
  {
    id: 'sop',
    title: 'SASP SOP',
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
          <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm  mt-2 relative">
            <div className="space-y-4">
              <div className="text-[#3b82f6] font-extrabold tracking-widest uppercase text-xs">
                Mission Statement
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                The San Andreas State Police is committed to providing the highest quality of police services to the citizens of San Andreas. We strive to maintain order, protect life and property, and improve the quality of life in our state.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-[#3b82f6] font-extrabold tracking-widest uppercase text-xs mb-4">
                <div className="w-8 h-[1px] bg-gradient-to-r from-[#3b82f6] to-transparent"></div>
                Core Values
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {['Integrity', 'Professionalism', 'Respect', 'Accountability', 'Courage', 'Compassion'].map((value, i) => (
                  <li 
                    key={i} 
                    className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex items-center gap-3 bg-slate-900/30 backdrop-blur-md p-4 rounded-xl border border-white/5 hover:border-[#3b82f6]/40 hover:bg-slate-800/40 hover:scale-[1.03] transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_20px_-10px_rgba(59,130,246,0.3)] group cursor-default"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_10px_#3b82f6]"></div>
                    <span className="relative z-10 text-slate-200 font-bold tracking-wide group-hover:text-white transition-colors">{value}</span>
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
          <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm  mt-2 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { code: 'Code 1', desc: 'Routine response. Non-emergency. Obey all traffic laws.', color: '#3b82f6' },
                { code: 'Code 2', desc: 'Urgent response. Lights only. No sirens. Proceed with caution.', color: '#eab308' },
                { code: 'Code 3', desc: 'Emergency response. Lights and sirens. Priority dispatch.', color: '#ef4444' },
                { code: 'Code 4', desc: 'Situation resolved. No further units required.', color: '#10b981' },
                { code: 'Code 5', desc: 'Felony traffic stop. High risk.', color: '#f97316' },
                { code: 'Code 77', desc: 'Possible ambush. Use extreme caution.', color: '#8b5cf6' },
                { code: 'Code 100', desc: 'Barricade situation or units holding position.', color: '#64748b' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col gap-2 p-5 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_15px_-5px_rgba(0,0,0,0.5)] group cursor-default" 
                  style={{ '--hover-color': item.color, animationDelay: `${i * 100}ms` } as React.CSSProperties}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }}></div>
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}></div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}></div>
                    <div className="font-black text-lg tracking-widest drop-shadow-sm group-hover:drop-shadow-[0_0_8px_currentColor]" style={{ color: item.color }}>{item.code}</div>
                  </div>
                  <div className="text-slate-300/90 font-medium leading-relaxed relative z-10 mt-1">{item.desc}</div>
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
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">
            <div className="space-y-4">
              {[
                { cond: 'Condition 1', desc: 'Minor traffic infractions, non-violent fleeing. Max 2 units.', color: '#3b82f6' },
                { cond: 'Condition 2', desc: 'Felony evasion, stolen vehicle, reckless driving. Max 4 units. Air-1 authorized.', color: '#f59e0b' },
                { cond: 'Condition 3', desc: 'Violent felonies, shots fired, immediate threat to life. Max 6 units. Air-1 and Interceptor authorized.', color: '#ef4444' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col sm:flex-row gap-5 sm:items-center p-6 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 group"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2" style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}` }}></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(90deg, ${hexToRgba(item.color, 0.1)}, transparent)` }}></div>
                  
                  <div className="px-5 py-2.5 rounded-xl font-black tracking-widest text-xs uppercase shadow-inner relative z-10 border" style={{ backgroundColor: hexToRgba(item.color, 0.1), color: item.color, borderColor: hexToRgba(item.color, 0.2) }}>
                    {item.cond}
                  </div>
                  <div className="text-slate-200 font-medium flex-1 leading-relaxed relative z-10 text-[15px]">
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
          <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm  mt-2 relative">
            <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-white/5 relative overflow-hidden backdrop-blur-xl shadow-2xl group animate-fadeSlideIn opacity-0">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#8b5cf6] shadow-[0_0_20px_#8b5cf6] transition-all duration-500 group-hover:w-3"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-[#8b5cf6]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <p className="text-xl md:text-2xl font-medium text-slate-200 leading-loose italic relative z-10 pl-4 border-l-2 border-white/10 ml-2">
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
          <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm  mt-2 relative">
            <ul className="space-y-4">
              {[
                'Primary unit maintains visual and calls out locations/directions.',
                'Secondary unit focuses on radio comms and coordination.',
                'No parallel units unless authorized by supervisor.',
                'Do not pass the primary unit unless requested.',
                'Maintain safe following distance to avoid collisions if suspect brakes suddenly.',
                'Pitting authorized only when safe and within SOP guidelines.'
              ].map((text, i) => (
                <li 
                  key={i} 
                  className="animate-fadeSlideIn opacity-0 flex gap-4 items-center group p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-slate-900/30 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#ec4899]/10 flex items-center justify-center shrink-0 border border-[#ec4899]/30 group-hover:bg-[#ec4899] group-hover:shadow-[0_0_15px_#ec4899] transition-all duration-500">
                    <span className="text-[#ec4899] font-black group-hover:text-white transition-colors">{i + 1}</span>
                  </div>
                  <span className="text-slate-300 font-medium text-[16px] leading-relaxed group-hover:text-white transition-colors">{text}</span>
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
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative pb-10">
            <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-4 flex gap-4 items-start">
              <AlertTriangle className="w-6 h-6 text-[#eab308] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[#eab308] font-bold text-sm uppercase tracking-wide">De-escalation Priority</div>
                <div className="text-slate-300 font-medium leading-relaxed">Officers must attempt to de-escalate situations whenever feasible before resorting to higher levels of force.</div>
              </div>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[31px] before:w-[2px] before:bg-gradient-to-b before:from-[#3b82f6] before:via-[#f59e0b] before:to-[#b91c1c] before:opacity-50 before:z-0">
              {[
                { title: 'Officer Presence', desc: 'No force used. Considered the best way to resolve a situation.', color: '#3b82f6' },
                { title: 'Verbal Commands', desc: 'Clear and direct orders. Used to persuade or instruct subjects.', color: '#10b981' },
                { title: 'Soft Empty Hand Control', desc: 'Escorts, holds, pressure points. Used for passive resistance.', color: '#f59e0b' },
                { title: 'Hard Empty Hand Control', desc: 'Strikes, takedowns. Used for active resistance.', color: '#f97316' },
                { title: 'Less-Lethal Weapons', desc: 'Taser, baton, beanbag. Used for assaultive behavior.', color: '#ef4444' },
                { title: 'Deadly Force', desc: 'Firearms. Used only when there is an imminent threat of death or serious injury.', color: '#b91c1c' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="animate-fadeSlideIn opacity-0 relative z-10 flex gap-8 items-center group"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div
                    className="w-16 h-16 rounded-full border-4 bg-slate-950 flex items-center justify-center font-black text-2xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative"
                    style={{ borderColor: item.color, color: item.color }}
                  >
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: item.color }}></div>
                    {i + 1}
                  </div>
                  <div className="flex-1 p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden" style={{ '--hover-color': item.color } as React.CSSProperties}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}></div>
                    <div className="font-black uppercase text-sm tracking-widest mb-1 drop-shadow-md" style={{ color: item.color }}>{item.title}</div>
                    <div className="text-slate-300 font-medium leading-relaxed text-[15px] relative z-10">{item.desc}</div>
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
          <div className="p-0 sm:p-0 pt-0 mt-0 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md shadow-2xl relative">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/10">
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] w-1/4 drop-shadow-sm">Crime</th>
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Units</th>
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Employees</th>
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Helicopter</th>
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Bike</th>
                    <th className="py-5 px-6 font-black text-[#10b981] uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Interceptor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['10-13A (Clean-up)', 'Unlimited', 'Unlimited', 'N/A', 'N/A', 'N/A'],
                    ['Pacific Std / Paleto', '5', '10', 'Yes', 'Yes', 'Yes'],
                    ['Gruppe 6', '4', '10', 'Yes', 'Yes', 'Yes'],
                    ['Jewelry / Fleeca', '4', '10', 'Yes (Either)', 'Yes (Either)', 'No'],
                    ['Drug Run', '4', '10', 'Yes', 'Yes', 'No'],
                    ['Prison Transport', '7', '15', 'Yes', 'No', 'Yes'],
                    ['Shootout vs Officers', '10*', '10', 'Yes', 'N/A', 'N/A']
                  ].map((row, i) => (
                    <tr 
                      key={i} 
                      className="animate-fadeSlideIn opacity-0 hover:bg-slate-800/40 transition-colors duration-300 cursor-default group"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <td className="py-4 px-6 font-bold text-slate-200 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">{row[0]}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-[15px] group-hover:text-slate-300 transition-colors">{row[1]}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-[15px] group-hover:text-slate-300 transition-colors">{row[2]}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-[15px] group-hover:text-slate-300 transition-colors">{row[3]}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-[15px] group-hover:text-slate-300 transition-colors">{row[4]}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-[15px] group-hover:text-slate-300 transition-colors">{row[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 px-6 text-[11px] uppercase tracking-widest text-slate-500 font-bold bg-slate-900/60 border-t border-white/5">
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
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#84cc16] font-extrabold tracking-widest uppercase text-xs mb-2">
                <div className="w-8 h-[1px] bg-gradient-to-r from-[#84cc16] to-transparent"></div>
                GENERAL RULES
              </div>
              <ul className="space-y-4">
                {[
                  "Always ask suspects if they require legal representation and medical treatment.",
                  "Officers are subject to random drug testing; no being under the influence on duty.",
                  "Units are counted as a vehicle, not individual officers.",
                  "Double ups are highly recommended but NOT mandatory.",
                  "Follow the Escalation of Force Pyramid at all times."
                ].map((text, i) => (
                  <li 
                    key={i} 
                    className="animate-fadeSlideIn opacity-0 flex gap-4 items-center group p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-slate-900/30 transition-all duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#84cc16] shrink-0 group-hover:shadow-[0_0_10px_#84cc16] transition-all duration-500"></div>
                    <span className="text-slate-300 font-medium text-[16px] leading-relaxed group-hover:text-white transition-colors">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)] p-6 md:p-8 space-y-6 mt-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#84cc16]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 text-[#84cc16] font-extrabold tracking-widest uppercase text-xs relative z-10">
                <div className="w-8 h-[1px] bg-gradient-to-r from-[#84cc16] to-transparent"></div>
                MANDATORY EQUIPMENT
              </div>
              <div className="flex flex-wrap gap-4 relative z-10">
                {['Glock', 'Taser', 'Radio', 'Transponder'].map((item, i) => (
                  <div
                    key={i}
                    className="animate-fadeSlideIn opacity-0 px-5 py-2.5 rounded-lg border border-[#84cc16]/20 bg-[#84cc16]/10 text-[#84cc16] font-bold text-sm tracking-wide shadow-sm hover:scale-105 hover:bg-[#84cc16] hover:text-slate-950 transition-all duration-300 cursor-default"
                    style={{ animationDelay: `${i * 100}ms` }}
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
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">
            <div className="space-y-4">
              <div className="text-[#0ea5e9] font-extrabold tracking-widest uppercase text-xs">
                VEHICLE SWAP RULES
              </div>
              <ul className="space-y-4">
                {[
                  "Vehicle swaps only allowed on C & D class boosts if original car is already in police custody.",
                  "B-Class and above: NO swaps allowed. Code Amber (1 rear tire pop) initiated immediately."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start group hover:translate-x-2 transition-transform duration-300">
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
          <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm  mt-2 relative relative pb-12">
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
                  <li key={i} className="flex gap-4 items-start group hover:translate-x-2 transition-transform duration-300">
                    <span className="text-[#0ea5e9] mt-0.5 font-black text-lg leading-none shrink-0">•</span>
                    <span className="text-slate-400 font-medium text-[15px] leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#eab308]/30 bg-[#eab308]/5 hover:bg-[#eab308]/10 hover:border-[#eab308]/50 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.05)] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] group cursor-default p-5 space-y-4 mt-8">
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
                  <li key={i} className="flex gap-4 items-start group hover:translate-x-2 transition-transform duration-300">
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
    id: 'penal_code',
    title: 'SA Penal Code',
    description: 'Official comprehensive list of charges, classifications, sentences, fines, and points.',
    icon: <Scale className="w-4 h-4" />,
    url: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/edit',
    original: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/edit',
    sections: [
      {
        badge: 'PENAL CODE',
        title: 'Master Database Sync',
        color: '#0ea5e9',
        content: <PenalCodeComponent />
      }
    ]
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
    id: 'case law',
    title: 'Case Law',
    description: 'San Andreas State Police — relevant case law and legal precedents.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/edit',
    original: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/view',
    sections: [
      {
        badge: 'CASE LAWS',
        title: 'DOJ Case Laws',
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                {
                  title: 'Miranda vs Arizona',
                  badge: 'MIRANDA RIGHTS',
                  color: '#a855f7',
                  desc: 'Any statements a defendant in custody makes during interrogation are admissible only if law enforcement told them of the right to remain silent and right to speak with an attorney before interrogation started.'
                },
                {
                  title: 'Pennsylvania vs Mimms',
                  badge: 'TRAFFIC STOP',
                  color: '#3b82f6',
                  desc: 'On a traffic stop, police can order a driver out at any time and pat them down for weapons.'
                },
                {
                  title: 'Maryland vs Wilson',
                  badge: 'TRAFFIC STOP',
                  color: '#3b82f6',
                  desc: 'Same as Pennsylvania vs Mimms, but applies to passengers in the vehicle.'
                },
                {
                  title: 'Brendlin vs California',
                  badge: 'DETENTION',
                  color: '#14b8a6',
                  desc: 'Allows officers to keep passengers in the car. Passengers are considered seized and cannot leave without permission once a car is lawfully stopped.'
                },
                {
                  title: 'Tennessee vs Garner',
                  badge: 'USE OF FORCE',
                  color: '#ef4444',
                  desc: 'A police officer may use deadly force to prevent the escape of a fleeing suspect if the officer has a good faith belief that the suspect poses a significant risk of death or injury to an officer or others.'
                },
                {
                  title: 'Chimel vs California',
                  badge: 'SEARCH & SEIZURE',
                  color: '#f97316',
                  desc: 'Search incident to arrest. If you arrest someone you can perform a warrantless search on their person and the immediate area in the arrested person\'s control (e.g. cab of car, couch they were sitting on).'
                },
                {
                  title: 'Terry vs Ohio',
                  badge: 'STOP & FRISK',
                  color: '#eab308',
                  desc: 'Stop and Frisk. Officers can do a pat down (NOT a search!) on a person they believe has committed, is committing, or is about to commit a crime, and has reason to believe the suspect may be armed and dangerous.'
                },
                {
                  title: 'Minnesota vs Dickerson',
                  badge: 'SEARCH & SEIZURE',
                  color: '#f97316',
                  desc: 'When doing a pat down for weapons and you feel other contraband, and you have enough reasonable suspicion (e.g. being in a heavy drug area), you can make a warrantless seizure on those items.'
                },
                {
                  title: 'Illinois vs Wardlow',
                  badge: 'REASONABLE SUSPICION',
                  color: '#eab308',
                  desc: 'Unprovoked flight or evasive behavior from an identifiable police officer, combined with being in a high crime area, provides enough reasonable suspicion for a Terry stop.'
                },
                {
                  title: 'Graham vs Connor',
                  badge: 'USE OF FORCE',
                  color: '#ef4444',
                  desc: 'Objective Reasonableness. In a court of law, everyone should look from the officer\'s perspective — did they use a reasonable amount of force given what was in front of them?'
                },
                {
                  title: 'Florida vs J.L.',
                  badge: 'SEARCH & SEIZURE',
                  color: '#f97316',
                  desc: 'You CANNOT search someone solely based on an anonymous tip.'
                },
                {
                  title: 'Maryland vs King',
                  badge: 'EVIDENCE',
                  color: '#10b981',
                  desc: 'DNA swabs, fingerprints, and photographs can be taken without a warrant, like Chimel but for body parts.'
                },
                {
                  title: 'Mapp vs Ohio',
                  badge: 'EVIDENCE',
                  color: '#10b981',
                  desc: 'If you obtain evidence illegally, such as from an unlawful search, it CANNOT be used in court. (Fruits of the Poisonous Tree)'
                },
                {
                  title: 'Whren vs U.S.',
                  badge: 'TRAFFIC STOP',
                  color: '#3b82f6',
                  desc: 'Any traffic violation committed by a driver is a legitimate legal basis for a traffic stop.'
                },
                {
                  title: 'Horton vs California',
                  badge: 'PLAIN VIEW',
                  color: '#059669',
                  desc: 'The Fourth Amendment does not prohibit the warrantless seizure of evidence that is in plain view.'
                },
                {
                  title: 'Hibel vs Nevada',
                  badge: 'STOP & IDENTIFY',
                  color: '#6366f1',
                  desc: 'Stop and identify does NOT violate the Fifth Amendment rights against self-incrimination. Terry Stops do not violate the Fourth Amendment.'
                }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                  style={{ 
                    animationDelay: `${i * 100}ms`, 
                    animationFillMode: 'forwards',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 
                      className="font-black text-[16px] tracking-wide transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, #ffffff 0%, ${item.color} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: `drop-shadow(0 0 8px ${hexToRgba(item.color, 0.4)})`
                      }}
                    >
                      {item.title}
                    </h3>
                    <div
                      className="px-3 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundColor: hexToRgba(item.color, 0.1),
                        borderColor: hexToRgba(item.color, 0.3),
                        color: item.color,
                        boxShadow: `0 0 10px ${hexToRgba(item.color, 0.2)}`
                      }}
                    >
                      {item.badge}
                    </div>
                  </div>
                  <p className="text-slate-400 font-medium text-[13px] leading-relaxed group-hover:text-slate-300 transition-colors">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'Amendments',
    title: 'Amendments',
    description: 'San Andreas State Police — relevant amendments and updates.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/edit',
    original: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/view',
    sections: [
      {
        badge: 'CONSTITUTION',
        title: 'Bill of Constitution',
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">
            <div className="space-y-4">


              <div className="p-6 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group border border-slate-800/60 space-y-4">
                <p className="text-slate-300 leading-relaxed font-medium">
                  The Bill of Rights comprises the first ten amendments to the State of Los Santos Constitution. These amendments add specific guarantees of personal freedoms and rights, clear limitations on the government's power in judicial and other proceedings, and explicit declarations that all powers not specifically granted to the Government are reserved for the state or the people.
                </p>
                <p className="text-[#0ea5e9] leading-relaxed font-medium">
                  In simple terms: An amendment is like editing the rulebook of the country. It's a way to change or add new rules to how the government works or to protect people's rights. So basically, any law passed by parliament can be filtered or changed to correct what the government wants to fix.
                </p>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="text-center text-slate-500 font-bold tracking-[0.2em] uppercase text-xs">
                Quick Reference
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { num: '1st', text: 'No Religious Discrimination' },
                  { num: '2nd', text: 'Right to Bear Arms with Paperwork' },
                  { num: '3rd', text: 'No Warrant, No Entry' },
                  { num: '4th', text: 'No Warrant, No Search & Seizure' },
                  { num: '5th', text: 'No Incrimination Without Evidence' },
                  { num: '6th', text: 'Right to Attorney' },
                  { num: '7th', text: 'Right to Trial by a Judge' },
                  { num: '8th', text: 'No Cruel or Unusual Punishments' },
                  { num: '9th', text: 'Protects Unlisted Rights' },
                  { num: '10th', text: 'Federal Powers Limited to Constitution' },
                ].map((amendment, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 50}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <span className="text-[#0ea5e9] font-black text-lg w-10 shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]">{amendment.num}</span>
                    <span 
                      className="text-slate-300 font-bold transition-all duration-500 group-hover:text-white group-hover:tracking-wide"
                      style={{
                        textShadow: '0 0 10px rgba(255,255,255,0)'
                      }}
                    >
                      {amendment.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Full Amendment Details
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    num: '1st',
                    category: 'FREEDOM OF EXPRESSION & RELIGION',
                    subtitle: 'No Religious Discrimination',
                    desc: 'Prevents Congress from making any law respecting establishment of religion, impeding free exercise of religion, abridging freedom of speech, infringing on freedom of the press, interfering with the right to peaceably assemble, or prohibiting the right to petition the government. (I.e. No religious discrimination)'
                  },
                  {
                    num: '2nd',
                    category: 'BEARING ARMS',
                    subtitle: 'Right to Bear Arms with Paperwork',
                    desc: 'Protects the right to keep and bear arms. (I.e. You have the right to keep and carry weapons with proper paperwork)'
                  },
                  {
                    num: '3rd',
                    category: 'QUARTERING OF SOLDIERS',
                    subtitle: 'No Warrant, No Entry',
                    desc: 'Places restrictions on the quartering of soldiers in private homes. (I.e. Without any warrant, LEO cannot enter anyone\'s property)'
                  },
                  {
                    num: '4th',
                    category: 'SEARCH AND SEIZURE',
                    subtitle: 'No Warrant, No Search & Seizure',
                    desc: 'Prohibits unreasonable searches and seizures of property by the government. It protects against arbitrary arrests and is the basis of the law regarding search warrants, stop-and-frisk, safety inspections, wiretaps, and other forms of surveillance. (I.e. Without warrant, LEO cannot search and seize private property)'
                  },
                  {
                    num: '5th',
                    category: 'RIGHTS OF PERSONS',
                    subtitle: 'No Incrimination Without Evidence',
                    desc: 'Protects against self-incrimination and forbids double jeopardy. Requires that due process of law be part of any proceeding that denies a citizen life, liberty, or property. (I.e. Without proper evidence and proof, LEO cannot incriminate any civilian through interrogations and threats directly or indirectly)'
                  },
                  {
                    num: '6th',
                    category: 'RIGHTS OF ACCUSED IN CRIMINAL PROSECUTIONS',
                    subtitle: 'Right to Attorney',
                    desc: 'Guarantees the rights of criminal defendants, including the right to a public trial without unnecessary delay, the right to a lawyer, and the right for the accused to know who the accusers are and the nature of the charges and evidence against them. (I.e. Every suspect has their right to an attorney)'
                  },
                  {
                    num: '7th',
                    category: 'CIVIL TRIALS',
                    subtitle: 'Right to Trial by a Judge',
                    desc: 'Provides for the right to trial by jury in certain civil cases, according to common law.'
                  },
                  {
                    num: '8th',
                    category: 'FURTHER GUARANTEES IN CRIMINAL CASES',
                    subtitle: 'No Cruel or Unusual Punishments',
                    desc: 'Prohibits cruel and unusual punishments, which are not limited to excessive fines.'
                  },
                  {
                    num: '9th',
                    category: 'UNENUMERATED RIGHTS',
                    subtitle: 'Protects Unlisted Rights',
                    desc: 'Protects rights not enumerated in the Constitution.'
                  },
                  {
                    num: '10th',
                    category: 'RESERVED POWERS',
                    subtitle: 'Federal Powers Limited to Constitution',
                    desc: 'States that the federal government possesses only those powers delegated, or enumerated, to it through the Constitution.'
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                      <span className="text-[#0ea5e9] font-black text-sm drop-shadow-md">{item.num}</span>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase transition-colors duration-500 group-hover:text-[#38bdf8]">{item.category}</div>
                      <div 
                        className="text-white font-black text-[15px] tracking-wide transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >{item.subtitle}</div>
                      <div className="text-slate-400 font-medium text-[13px] leading-relaxed pt-1 transition-colors duration-500 group-hover:text-slate-300">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'Robbery Handbook',
    title: 'Robbery Handbook',
    description: 'San Andreas State Police — guidelines for handling robbery cases.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/edit',
    original: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/view',
    sections: [
      {
        badge: 'ROBBERY HANDBOOK',
        title: 'SASP Robbery Response Handbook',
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">


            <div className="pt-2">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Tier 1 Robberies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {[
                  {
                    title: 'House Robbery (Breaking & Entering)',
                    tier: 'TIER 1',
                    tierColor: '#0d9488',
                    stats: [
                      { label: 'MIN OFFICERS', value: '2 units' },
                      { label: 'MAX CIVILIANS', value: '4 people' },
                      { label: 'NEGOTIATOR', value: 'No' },
                      { label: 'HELICOPTER', value: 'No' }
                    ],
                    protocols: [
                      'Minimum 2 officers required.',
                      'No negotiator needed.',
                      'Officers may enter if suspects are still inside.',
                      'Search incident to arrest authorized once suspect is apprehended.'
                    ],
                    charges: [
                      'Burglary (Primary Charge)',
                      'Grand Theft',
                      'Possession of Items used in a Commission of a Crime (2012)',
                      'Reckless Evading (if evading)'
                    ]
                  },
                  {
                    title: 'Cutting Catalytic Converters',
                    tier: 'TIER 1',
                    tierColor: '#0d9488',
                    stats: [
                      { label: 'MIN OFFICERS', value: '1 units' },
                      { label: 'MAX CIVILIANS', value: '2 people' },
                      { label: 'NEGOTIATOR', value: 'No' },
                      { label: 'HELICOPTER', value: 'No' }
                    ],
                    protocols: [
                      'Officers should respond quickly and maintain observation.',
                      'Suspects may flee in vehicles.'
                    ],
                    charges: [
                      'Vehicle Tampering',
                      'Reckless Evading (if evading)'
                    ]
                  },
                  {
                    title: 'Robbing Graveyards',
                    tier: 'TIER 1',
                    tierColor: '#0d9488',
                    stats: [
                      { label: 'MIN OFFICERS', value: '1 units' },
                      { label: 'MAX CIVILIANS', value: '2 people' },
                      { label: 'NEGOTIATOR', value: 'No' },
                      { label: 'HELICOPTER', value: 'No' }
                    ],
                    protocols: [
                      'Ensure the burial site is documented before evidence collection.'
                    ],
                    charges: [
                      'Vandalism of the burial site (4004B)',
                      'Reckless Evading (if evading)'
                    ]
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className="font-black text-lg leading-tight max-w-[200px] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${item.tierColor} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 0 8px ${hexToRgba(item.tierColor, 0.4)})`
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: hexToRgba(item.tierColor, 0.1),
                          borderColor: hexToRgba(item.tierColor, 0.3),
                          color: item.tierColor
                        }}
                      >
                        {item.tier}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                          <span className="text-[#0ea5e9] font-black text-[9px] tracking-widest uppercase">{stat.label}</span>
                          <span className="text-white font-bold text-sm">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Response Protocol</div>
                      <ul className="space-y-2.5">
                        {item.protocols.map((protocol, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#0ea5e9] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Applicable Charges</div>
                      <ul className="space-y-2.5">
                        {item.charges.map((charge, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#eab308] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-400 font-medium text-[13px] leading-relaxed font-mono">{charge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Tier 2 Robberies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {[
                  {
                    title: '24/7 / LTD Store / ATM Robberies',
                    tier: 'TIER 2',
                    tierColor: '#2563eb',
                    stats: [
                      { label: 'MIN OFFICERS', value: '2 units' },
                      { label: 'MAX CIVILIANS', value: '4 people' },
                      { label: 'NEGOTIATOR', value: 'Optional' },
                      { label: 'HELICOPTER', value: 'No' }
                    ],
                    protocols: [
                      'Minimum 2 officers required to respond.',
                      'Maximum of 4 civilians allowed inside.',
                      'Negotiator is optional but recommended.',
                      'Perimeter must be set up at a safe distance.'
                    ],
                    charges: [
                      '3rd Degree Robbery / 3rd Degree Aggravated Robbery',
                      'Kidnapping (if hostages taken)',
                      'Criminal Possession of Weapon (if armed, define class)',
                      'Reckless Evading (if evading)'
                    ]
                  },
                  {
                    title: 'Humane Labs',
                    tier: 'TIER 2',
                    tierColor: '#2563eb',
                    stats: [
                      { label: 'MIN OFFICERS', value: '4 units' },
                      { label: 'MAX CIVILIANS', value: '6 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Optional' }
                    ],
                    protocols: [
                      'Scene command must be established before approach.',
                      'Negotiator required.'
                    ],
                    charges: [
                      '3rd Degree Robbery / 3rd Degree Aggravated Robbery',
                      'Kidnapping (if hostages taken)',
                      'Criminal Possession of Weapon (if armed, define class)',
                      'Reckless Evading (if evading)'
                    ]
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className="font-black text-lg leading-tight max-w-[200px] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${item.tierColor} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 0 8px ${hexToRgba(item.tierColor, 0.4)})`
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: hexToRgba(item.tierColor, 0.1),
                          borderColor: hexToRgba(item.tierColor, 0.3),
                          color: item.tierColor
                        }}
                      >
                        {item.tier}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                          <span className="text-[#0ea5e9] font-black text-[9px] tracking-widest uppercase">{stat.label}</span>
                          <span className="text-white font-bold text-sm">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Response Protocol</div>
                      <ul className="space-y-2.5">
                        {item.protocols.map((protocol, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#0ea5e9] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Applicable Charges</div>
                      <ul className="space-y-2.5">
                        {item.charges.map((charge, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#eab308] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-400 font-medium text-[13px] leading-relaxed font-mono">{charge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Tier 3 Robberies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {[
                  {
                    title: 'Fleeca Bank',
                    tier: 'TIER 3',
                    tierColor: '#eab308',
                    stats: [
                      { label: 'MIN OFFICERS', value: '3 units' },
                      { label: 'MAX CIVILIANS', value: '4 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 3 officers required to respond.',
                      'Negotiator must be designated before any contact.',
                      'Officers must maintain cover positions.'
                    ],
                    charges: [
                      '2nd Degree Robbery / 2nd Degree Aggravated Robbery (if armed)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)',
                      'Reckless Evading (if evading)'
                    ]
                  },
                  {
                    title: 'Vangelico Jewelry Store',
                    tier: 'TIER 3',
                    tierColor: '#eab308',
                    stats: [
                      { label: 'MIN OFFICERS', value: '3 units' },
                      { label: 'MAX CIVILIANS', value: '6 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 3 officers required to respond.',
                      'Designated negotiator required.',
                      'No entering the store without authorization from scene command.'
                    ],
                    charges: [
                      '2nd Degree Robbery / 2nd Degree Aggravated Robbery (if armed)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)',
                      'Reckless Evading (if evading)'
                    ]
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className="font-black text-lg leading-tight max-w-[200px] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${item.tierColor} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 0 8px ${hexToRgba(item.tierColor, 0.4)})`
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: hexToRgba(item.tierColor, 0.1),
                          borderColor: hexToRgba(item.tierColor, 0.3),
                          color: item.tierColor
                        }}
                      >
                        {item.tier}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                          <span className="text-[#0ea5e9] font-black text-[9px] tracking-widest uppercase">{stat.label}</span>
                          <span className="text-white font-bold text-sm">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Response Protocol</div>
                      <ul className="space-y-2.5">
                        {item.protocols.map((protocol, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#0ea5e9] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Applicable Charges</div>
                      <ul className="space-y-2.5">
                        {item.charges.map((charge, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#eab308] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-400 font-medium text-[13px] leading-relaxed font-mono">{charge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Tier 4 Robberies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {[
                  {
                    title: 'Blaine County Savings Bank',
                    tier: 'TIER 4',
                    tierColor: '#f59e0b',
                    stats: [
                      { label: 'MIN OFFICERS', value: '5 units' },
                      { label: 'MAX CIVILIANS', value: '6 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 5 officers required to respond.',
                      'Negotiator and scene command mandatory.',
                      'Roadblocks authorized on major routes once suspects flee.'
                    ],
                    charges: [
                      '1st Degree Robbery / 1st Degree Aggravated Robbery',
                      'Reckless Evading (if evading)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)'
                    ]
                  },
                  {
                    title: 'Gruppe 6 (Armored Truck)',
                    tier: 'TIER 4',
                    tierColor: '#f59e0b',
                    stats: [
                      { label: 'MIN OFFICERS', value: '4 units' },
                      { label: 'MAX CIVILIANS', value: '4 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 4 officers required to respond.',
                      'Negotiator required if suspects are stationary.',
                      'Armored truck driver treated as a hostage — protect at all costs.'
                    ],
                    charges: [
                      '1st Degree Robbery / 1st Degree Aggravated Robbery',
                      'Reckless Evading (if evading)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)'
                    ]
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className="font-black text-lg leading-tight max-w-[200px] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${item.tierColor} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 0 8px ${hexToRgba(item.tierColor, 0.4)})`
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: hexToRgba(item.tierColor, 0.1),
                          borderColor: hexToRgba(item.tierColor, 0.3),
                          color: item.tierColor
                        }}
                      >
                        {item.tier}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                          <span className="text-[#0ea5e9] font-black text-[9px] tracking-widest uppercase">{stat.label}</span>
                          <span className="text-white font-bold text-sm">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Response Protocol</div>
                      <ul className="space-y-2.5">
                        {item.protocols.map((protocol, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#0ea5e9] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Applicable Charges</div>
                      <ul className="space-y-2.5">
                        {item.charges.map((charge, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#eab308] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-400 font-medium text-[13px] leading-relaxed font-mono">{charge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Tier 5 Robberies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {[
                  {
                    title: 'Gruppe 6 Office',
                    tier: 'TIER 5',
                    tierColor: '#be123c',
                    stats: [
                      { label: 'MIN OFFICERS', value: '5 units' },
                      { label: 'MAX CIVILIANS', value: '6 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 5 officers required to respond.',
                      'Negotiator and scene command mandatory.',
                      'High Command notification required.'
                    ],
                    charges: [
                      '1st Degree Robbery / 1st Degree Aggravated Robbery',
                      'Reckless Evading (if evading)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)'
                    ]
                  },
                  {
                    title: 'Pacific Standard',
                    tier: 'TIER 5',
                    tierColor: '#be123c',
                    stats: [
                      { label: 'MIN OFFICERS', value: '5 units' },
                      { label: 'MAX CIVILIANS', value: '6 people' },
                      { label: 'NEGOTIATOR', value: 'Required' },
                      { label: 'HELICOPTER', value: 'Yes' }
                    ],
                    protocols: [
                      'Minimum 5 officers required to respond.',
                      'Negotiator and scene command mandatory.',
                      'SRT deployment authorized.'
                    ],
                    charges: [
                      '1st Degree Robbery / 1st Degree Aggravated Robbery (if government bank)',
                      'Reckless Evading (if evading)',
                      'Criminal Possession of Weapon (define class)',
                      'Kidnapping (if hostages taken)'
                    ]
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 shadow-lg hover:shadow-lg cursor-default group hover:bg-slate-900/60 animate-fadeSlideIn opacity-0"
                    style={{ 
                      animationDelay: `${i * 100}ms`, 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className="font-black text-lg leading-tight max-w-[200px] transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${item.tierColor} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 0 8px ${hexToRgba(item.tierColor, 0.4)})`
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase shrink-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundColor: hexToRgba(item.tierColor, 0.1),
                          borderColor: hexToRgba(item.tierColor, 0.3),
                          color: item.tierColor
                        }}
                      >
                        {item.tier}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                          <span className="text-[#0ea5e9] font-black text-[9px] tracking-widest uppercase">{stat.label}</span>
                          <span className="text-white font-bold text-sm">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Response Protocol</div>
                      <ul className="space-y-2.5">
                        {item.protocols.map((protocol, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#0ea5e9] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[#0ea5e9] font-black text-[10px] tracking-widest uppercase">Applicable Charges</div>
                      <ul className="space-y-2.5">
                        {item.charges.map((charge, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="text-[#eab308] mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"></span>
                            <span className="text-slate-400 font-medium text-[13px] leading-relaxed font-mono">{charge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Universal Robbery Protocols
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Always establish a Scene Command officer before approaching any robbery.',
                  'Negotiator must be designated before any suspect communication — no freelancing.',
                  'Perimeter must be secured before entry — maintain positions at all times.',
                  'Officers are NOT authorized to make deals (e.g., free vehicles, no charges) without supervisor approval.',
                  'Evidence collector must document all items taken or left by suspects.',
                  'Medical must be requested at conclusion of every robbery response.',
                  'Full MDT arrest report must be filed within 30 minutes of incident conclusion.',
                  'Spike strips must NOT be placed inside active parking lots or near civilian vehicles.',
                  'Helicopter may only ram/intervene if suspects are on foot — never while suspect is driving.',
                  'Hostage safety is the FIRST priority — never take a shot that risks a hostage.',
                  'If suspects are wearing a mask, Unauthorized Face Covering (5002) is applicable.',
                  'If items used in commission of a crime are found, PC 2012 applies to all.'
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group hover:bg-slate-900/60 transition-colors">
                    <span className="text-[#0ea5e9] font-black text-lg w-8 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'Engagement Rules',
    title: 'Engagement Rules of Conduct',
    description: 'Critical engagement policies for SASP cadets. MANDATORY for field deployment.',
    icon: <Crosshair className="w-4 h-4" />,
    url: '',
    original: '',
    sections: [
      {
        badge: 'CADET ENGAGEMENT RULES',
        title: 'Engagement Rules of Conduct',
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm  mt-2 relative">
            <div className="space-y-6">
              {/* Authorized */}
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md shadow-lg hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)] hover:scale-[1.02] hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-emerald-900/40 transition-all duration-500 space-y-4 group cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors duration-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-emerald-500 font-black text-[10px] tracking-widest uppercase">Authorized</div>
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-emerald-300 transition-colors">Engagement Within City Limits</h3>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium relative z-10">
                  Officers are <span className="text-emerald-400 font-bold group-hover:text-emerald-300">authorized</span> to engage in gang-related shootouts happening <span className="font-bold text-white">inside the city limits of Los Santos</span>, excluding South Side and East Side.
                </p>
                <ul className="space-y-2.5 pt-2 relative z-10">
                  {[
                    'Officers MUST warn suspects on megaphone to leave city premises MULTIPLE times before engaging.',
                    'We understand the critical need to address and mitigate such situations swiftly to ensure safety and security of our citizens.',
                    'If suspects shoot down a person, do NOT allow them to take the downed bodies with them (inside city limits only).',
                    'Do NOT intervene if the officer count is below 10.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-3 items-start group/li">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/70 group-hover/li:text-emerald-400 shrink-0 mt-0.5 transition-colors" />
                      <span className="text-slate-400 font-medium leading-relaxed group-hover/li:text-slate-200 transition-colors">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not Authorized */}
              <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-md shadow-lg hover:shadow-[0_15px_40px_-10px_rgba(239,68,68,0.3)] hover:scale-[1.02] hover:-translate-y-1 hover:border-red-500/50 hover:bg-red-900/40 transition-all duration-500 space-y-4 group cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 rounded-full bg-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-slate-900 transition-colors duration-500">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-red-500 font-black text-[10px] tracking-widest uppercase">Not Authorized</div>
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-red-300 transition-colors">Non-Engagement Outside Los Santos Borders</h3>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium relative z-10">
                  Officers are <span className="text-red-400 font-bold group-hover:text-red-300">NOT authorized</span> to engage in any shootout occurring <span className="font-bold text-white">outside of Los Santos borders</span>, including areas such as Paleto Bay and Sandy Shores.
                </p>
                <ul className="space-y-2.5 pt-2 relative z-10">
                  {[
                    'Primary objective: take evidence and protect officer safety. Avoid unnecessary escalation.',
                    'If suspects shoot down a person — let them take the bodies and leave the area.',
                    'Officers are NOT authorized to follow them outside city borders.',
                    'Paleto Bay and Sandy Shores are considered OUTSIDE jurisdiction for engagement.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-3 items-start group/li">
                      <XCircle className="w-4 h-4 text-red-500/70 group-hover/li:text-red-400 shrink-0 mt-0.5 transition-colors" />
                      <span className="text-slate-400 font-medium leading-relaxed group-hover/li:text-slate-200 transition-colors">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conditional */}
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md shadow-lg hover:shadow-[0_15px_40px_-10px_rgba(245,158,11,0.3)] hover:scale-[1.02] hover:-translate-y-1 hover:border-amber-500/50 hover:bg-amber-900/40 transition-all duration-500 space-y-4 group cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 rounded-full bg-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors duration-500">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-amber-500 font-black text-[10px] tracking-widest uppercase">Conditional</div>
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-amber-300 transition-colors">Suspects Attempting to Bring Situation to City Limits</h3>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium relative z-10">
                  When suspects attempt to bring a shootout from Paleto Bay, Sandy Shores, or other external locations <span className="font-bold text-white">into city limits</span>:
                </p>
                <ul className="space-y-2.5 pt-2 relative z-10">
                  {[
                    'Officers MUST warn them on megaphone to leave city premises MULTIPLE times.',
                    'Officers WILL be authorized to neutralize suspects if they don\'t comply.',
                    'This action is taken to prevent escalation of violence and protect city integrity.',
                    'Do NOT intervene if the officer count is below 10.',
                    'Make sure NOT to interfere immediately — give them a chance to escape first.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-3 items-start group/li">
                      <AlertTriangle className="w-4 h-4 text-amber-500/70 group-hover/li:text-amber-400 shrink-0 mt-0.5 transition-colors" />
                      <span className="text-slate-400 font-medium leading-relaxed group-hover/li:text-slate-200 transition-colors">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important / Map */}
              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md shadow-lg hover:shadow-[0_15px_40px_-10px_rgba(244,63,94,0.3)] hover:scale-[1.02] hover:-translate-y-1 hover:border-rose-500/50 hover:bg-rose-900/40 transition-all duration-500 space-y-6 group cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-slate-900 transition-colors duration-500">
                      <MapIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-rose-500 font-black text-[10px] tracking-widest uppercase">Important</div>
                      <h3 className="text-white font-bold text-lg leading-tight group-hover:text-rose-300 transition-colors">Red-Marked Zones — Outside City Limits</h3>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-colors flex items-center gap-2 group/btn">
                    <MapIcon className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /> View City Limits Map
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium relative z-10">
                  All areas marked with <span className="text-rose-400 font-bold group-hover:text-rose-300">Red Lines on the map</span> are considered <span className="font-bold text-white">OUTSIDE City Limits</span>. Engagement rules for outside-border areas apply to these zones.
                </p>
                <div className="rounded-xl overflow-hidden border border-rose-500/30 group-hover:border-rose-500/50 transition-colors relative z-10 shadow-inner bg-slate-900/50 backdrop-blur-sm">
                  {/* Using a placeholder for the map image since it's a screenshot */}
                  <div className="w-full h-48 flex items-center justify-center text-rose-500/50 text-sm font-bold uppercase tracking-widest relative overflow-hidden group/map">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.1)_0%,transparent_70%)] opacity-50 group-hover/map:scale-110 transition-transform duration-1000"></div>
                    Map Image Placeholder
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Key Cadet Restrictions
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets CANNOT make independent arrests without FTO present</span>
                </div>

                {/* Column 2 */}
                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets CANNOT engage in shootouts without supervisor authorization</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets CANNOT negotiate with suspects without designated negotiator</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets CANNOT pursue outside city limits without command approval</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets MUST file MDT reports for every incident they attend</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets MUST wear full academy uniform during all training sessions</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets MUST address all superior officers by their rank</span>
                </div>

                <div className="flex gap-3 items-center p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-medium">Cadets MUST always follow the chain of command</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'Academy Training',
    title: 'SASP Academy Training',
    description: 'Provided by Shershah & Luthra — Official SASP Cadet Training Programme',
    icon: <Book className="w-4 h-4" />,
    url: '',
    original: '',
    sections: [
      {
        badge: 'ACADEMIC TRAINING GUIDE',
        title: 'SASP Academy Training',
        color: '#0ea5e9',
        content: (
          <div className="p-4 sm:p-6 pt-6 space-y-12 text-sm  mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { num: '01', title: 'ACADEMY ORIENTATION', desc: 'Introduction to SASP structure, chain of command, code of conduct, and department expectations.' },
                { num: '02', title: 'LEGAL FOUNDATIONS', desc: 'Study of penal codes, constitutional amendments, case laws, and legal authority of officers.' },
                { num: '03', title: 'PATROL PROCEDURES', desc: 'Traffic stops, foot pursuits, vehicle pursuits, use of force continuum, and scene management.' },
                { num: '04', title: 'MDT & DOCUMENTATION', desc: 'Filing arrest reports, MDT usage, incident documentation, evidence handling, and chain of custody.' },
                { num: '05', title: 'RADIO COMMUNICATION', desc: '10-codes, dispatch procedures, callsign protocols, and proper radio etiquette.' },
                { num: '06', title: 'FIELD EVALUATION', desc: 'Supervised ride-along with FTO, practical assessments, and final cadet evaluation exam.' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group hover:bg-slate-900/60 transition-colors">
                  <div className="text-4xl font-black text-[#0ea5e9]/20">{item.num}</div>
                  <div>
                    <h3 className="font-black text-[#0ea5e9] text-[11px] tracking-widest uppercase mb-2">{item.title}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed text-[13px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-center mb-8 relative">
                <div className="absolute left-0 w-full h-px bg-slate-800/80"></div>
                <div className="relative bg-slate-900 px-4 text-[#0ea5e9] font-bold tracking-[0.2em] uppercase text-[10px]">
                  Academy Rules
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Cadets must wear proper academy uniform at all times during training',
                  'Cadets must address all superior officers by rank',
                  'Cadets are NOT authorized to make independent arrests without FTO supervision',
                  'Cadets must complete all written assignments before proceeding to field training',
                  'Tardiness or absence without notice will result in academic penalty',
                  'Cadets must maintain professional conduct on and off duty',
                  'Any violation of academy rules may result in immediate dismissal'
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[#0ea5e9]/20 cursor-default group">
                    <CheckCircle2 className="w-5 h-5 text-[#0ea5e9] shrink-0" />
                    <span className="text-slate-300 font-medium text-[13px] leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4 p-5 rounded-xl border border-amber-500/30 bg-amber-950/20 items-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-slate-300 font-medium text-[13px] leading-relaxed">
                  <span className="font-bold text-white">Cadets who fail to meet academy standards will be subject to Performance Improvement Plans (PIP) or dismissal.</span> All training records are maintained in the department database.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'MDT Templates',
    title: 'MDT Templates & Dispatch',
    description: 'Official templates for MDT reports and dispatch communications.',
    icon: <FileText className="w-4 h-4" />,
    url: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0',
    original: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/view',
    sections: [
      {
        badge: 'MDT TEMPLATES',
        title: 'MDT Templates & Dispatch',
        color: '#0ea5e9',
        content: <MDTTemplatesComponent />
      }
    ]
  }
];
