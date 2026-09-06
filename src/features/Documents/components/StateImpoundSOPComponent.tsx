import { Shield, AlertCircle, Clock, FileCheck, HelpCircle, FileText, Info } from 'lucide-react';

export const StateImpoundSOPComponent = () => {
  return (
    <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm mt-2 relative">
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">San Andreas State Police</h2>
        <div className="flex items-center gap-2 text-[#3b82f6] font-bold tracking-widest uppercase text-sm">
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-[#3b82f6]"></div>
          State Impound Standard Operating Procedures
          <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-[#3b82f6]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What is a State Impound */}
        <div className="animate-fadeSlideIn opacity-0 rounded-2xl border border-white/5 bg-slate-900/50 p-6 flex flex-col gap-4 hover:border-white/10 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20">
              <HelpCircle className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <h3 className="text-lg font-black text-white tracking-wide">What is a State Impound?</h3>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed pl-3 border-l-2 border-[#3b82f6]/50">
            A State Impound means that a registered vehicle is being seized by the state for being involved in one or more crimes.
          </p>
        </div>

        {/* Who can State Impound */}
        <div className="animate-fadeSlideIn opacity-0 rounded-2xl border border-white/5 bg-slate-900/50 p-6 flex flex-col gap-4 hover:border-white/10 transition-colors group" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20">
              <Shield className="w-5 h-5 text-[#10b981]" />
            </div>
            <h3 className="text-lg font-black text-white tracking-wide">Who can State Impound?</h3>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed pl-3 border-l-2 border-[#10b981]/50">
            Any fully trained member of the SASP is authorized to do state impounds. <span className="text-white font-bold">(Officer/Deputy+)</span> Cadets are authorized only when supervised by a trained member. If you have any questions, ask a Sergeant or higher.
          </p>
        </div>
      </div>

      {/* When can I State Impound */}
      <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-[#ec4899]/20 bg-gradient-to-br from-[#ec4899]/5 to-transparent backdrop-blur-md p-6 md:p-8 relative overflow-hidden group" style={{ animationDelay: '200ms' }}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-32 h-32 text-[#ec4899]" />
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#ec4899]/10 flex items-center justify-center border border-[#ec4899]/20">
            <AlertCircle className="w-6 h-6 text-[#ec4899]" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide">When can I State Impound?</h3>
        </div>
        <p className="text-slate-300 font-medium leading-relaxed relative z-10 text-[15px]">
          State Impounds are reserved for vehicles that are used in crimes continuously and just provide constant issues. You can state impound as long as you can prove the vehicle has a reason to be state impounded. 
          <br /><br />
          <span className="text-[#ec4899] font-bold block bg-[#ec4899]/10 px-4 py-3 rounded-lg border border-[#ec4899]/20">
            The only exception is when the vehicle gets reported stolen at a police station before the crime happens (Not During or After) by the owner.
          </span>
        </p>
      </div>

      {/* How to State Impound */}
      <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md p-6 md:p-8" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center border border-[#0ea5e9]/20">
            <FileCheck className="w-6 h-6 text-[#0ea5e9]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-wide">How to State Impound</h3>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">(Picture guide at end)</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            "The first step of State Impound is to access the MDT. Next you want to search the vehicle you are giving a state impound to ensure it has no priors.",
            "Next you will go to the reports tab and create a report with the report tag.",
            "Fill your report out with as much detail as possible and attach the car",
            "Click on State Impound",
            "Tow the vehicle to the impound lot"
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-[#0ea5e9]/30 transition-colors group">
              <div className="w-6 h-6 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9] font-black text-xs shrink-0 mt-0.5 border border-[#0ea5e9]/30 group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                {index + 1}
              </div>
              <p className="text-slate-300 font-medium leading-relaxed">{step}</p>
            </div>
          ))}
          
          <ul className="list-disc pl-14 space-y-3 mt-4 text-slate-300 font-medium leading-relaxed">
            <li>
              There are multiple ways to bring a car to the impound lot (Nadia's, On Duty DOC, or do it yourself.) You must speak to the clerk at the tow yard to impound it.
            </li>
            <li className="bg-[#eab308]/10 border border-[#eab308]/20 p-3 rounded-lg text-[#eab308]">
              <strong>Note:</strong> If a vehicle does not fully get state impounded by an option above, the MDT will say state impounded but the vehicle will actually still be in possession of the owner. <strong>Police impounding the vehicle on scene is not the same!</strong>
            </li>
            <li>
              If a vehicle is missing an MDT picture or is out of date, add/fix the picture. Also, remember to add a note stating that the vehicle was state impounded AND include the report number corresponding to that impound. (Example: State Impounded by 223 on 11/26/2021 for 18 hours and $900 for being used in multiple drug calls, see report #1985)
            </li>
          </ul>
        </div>
      </div>

      {/* State Impound Time/Fine Table */}
      <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-[#3b82f6]/20 bg-gradient-to-br from-[#3b82f6]/5 to-transparent backdrop-blur-md p-6 md:p-8" style={{ animationDelay: '400ms' }}>
        <h3 className="text-2xl font-black text-white tracking-wide text-center mb-2">State Impound Time/Fine Table</h3>
        <p className="text-[#3b82f6] text-center font-bold uppercase tracking-wider text-xs mb-8">(Subject to Change)</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3b82f6]/30 bg-[#3b82f6]/10">
                <th className="p-4 text-white font-black uppercase tracking-wider text-sm w-1/3 rounded-tl-xl"># of State Impounds</th>
                <th className="p-4 text-white font-black uppercase tracking-wider text-sm w-1/3">Time</th>
                <th className="p-4 text-white font-black uppercase tracking-wider text-sm w-1/3 rounded-tr-xl">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { offense: '1st Offense', time: '1080 Minutes (18 hours)', fine: '$5000' },
                { offense: '2nd Offense', time: '2160 Minutes (1 Day 12 Hours)', fine: '$12500' },
                { offense: '3rd Offense', time: '4320 Minutes (3 Days)', fine: '$25000' },
                { offense: '4th Offense', time: '10080 Minutes (7 Days)', fine: '$37500' },
                { offense: '5th Offense', time: '17640 Minutes (12 Days 6 Hours)', fine: '$50000' },
                { offense: '6th or more', time: '20160 Minutes (14 Days)', fine: '$62500' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-slate-300 font-bold">{row.offense}</td>
                  <td className="p-4 text-slate-300 font-medium">{row.time}</td>
                  <td className="p-4 text-[#10b981] font-black">{row.fine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Guidelines */}
      <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-white/5 bg-slate-900/50 p-6 md:p-8" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#eab308]/10 flex items-center justify-center border border-[#eab308]/20">
            <FileText className="w-6 h-6 text-[#eab308]" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide">What should my State Impound note look like?</h3>
        </div>
        
        <ul className="space-y-4 text-slate-300 font-medium leading-relaxed">
          <li className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
            <p>You may make the note anyway you want, but it needs to have <span className="text-white font-bold">Reason, Time, Fine, and Offense number</span> in the note.</p>
          </li>
          <li className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block mb-1">For Example:</span>
              <p className="italic bg-black/30 p-4 rounded-xl border border-white/10">
                "On 11/24/2021 @ 1200 EST, 223 and other units responded to a 10-90 on Clinton Ave. Upon arriving on scene, officers noticed that the vehicle was seen 2 days ago during another 10-90. Plate was cross referred with the vehicle from previous and matched. Vehicle was then issued a State Impound by 223 Aaron Reddington for 1080 Minutes and a $900 Fine. See report #0001 for more information."
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
