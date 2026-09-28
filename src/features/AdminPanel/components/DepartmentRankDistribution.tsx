import { useMemo, useState } from 'react';
import { Building2, Shield, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { Employee } from '@/types';

interface DepartmentRankDistributionProps {
  employees: Employee[];
}

export default function DepartmentRankDistribution({ employees }: DepartmentRankDistributionProps) {
  const [expandedRanks, setExpandedRanks] = useState<Record<string, boolean>>({});

  const toggleExpand = (dept: string, rank: string) => {
    const key = `${dept}-${rank}`;
    setExpandedRanks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const distribution = useMemo(() => {
    const data: Record<string, Record<string, Employee[]>> = {
      'SASP': {},
      'LSPD': {},
      'BCSO': {},
      'SAPR': {},
      'SASP Academy': {},
    };

    employees.forEach(emp => {
      if (emp.status === 'INACTIVE') return;
      const dept = emp.department || 'SASP';
      const rank = emp.rank || 'Unassigned';

      if (!data[dept]) {
        data[dept] = {};
      }

      if (!data[dept][rank]) {
        data[dept][rank] = [];
      }

      data[dept][rank].push(emp);
    });

    return data;
  }, [employees]);

  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      'SASP': 'text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      'LSPD': 'text-sky-400 border-sky-500/30 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]',
      'BCSO': 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      'SAPR': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      'SASP Academy': 'text-violet-400 border-violet-500/30 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    };
    return colors[dept] || 'text-slate-400 border-slate-500/30 bg-slate-500/10 shadow-[0_0_15px_rgba(100,116,139,0.15)]';
  };

  const getDeptTextClass = (dept: string) => {
    const colors: Record<string, string> = {
      'SASP': 'text-blue-400',
      'LSPD': 'text-sky-400',
      'BCSO': 'text-amber-400',
      'SAPR': 'text-emerald-400',
      'SASP Academy': 'text-violet-400',
    };
    return colors[dept] || 'text-slate-400';
  };

  const activeDepartments = Object.keys(distribution).filter(
    dept => Object.keys(distribution[dept]).length > 0
  );

  if (activeDepartments.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-slate-800/60 bg-slate-950/40 p-6 glass-panel">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800/60 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Department Rank Distribution</h2>
          <p className="text-xs text-slate-500 font-medium">Active roster breakdown by department and rank</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {activeDepartments.map(dept => {
          const ranks = Object.entries(distribution[dept]).sort((a, b) => b[1].length - a[1].length);
          const totalInDept = ranks.reduce((sum, [_, emps]) => sum + emps.length, 0);

          return (
            <div key={dept} className={`rounded-xl border ${getDeptColor(dept)} p-4 flex flex-col transition-transform duration-300 hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${getDeptTextClass(dept)}`} />
                  <h3 className={`font-bold uppercase tracking-wider ${getDeptTextClass(dept)} drop-shadow-md`}>{dept}</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10 shadow-inner">
                  <Users className="w-3 h-3 text-slate-300" />
                  <span className="text-xs font-bold text-white">{totalInDept}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                {ranks.map(([rank, emps]) => {
                  const isExpanded = expandedRanks[`${dept}-${rank}`];
                  return (
                    <div key={rank} className="flex flex-col rounded-lg bg-black/20 border border-white/5 overflow-hidden transition-all">
                      <div 
                        onClick={() => toggleExpand(dept, rank)}
                        className="flex items-center justify-between p-2 hover:bg-black/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className="text-xs font-medium text-slate-300 truncate" title={rank}>{rank}</span>
                        </div>
                        <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-white/10 text-xs font-bold text-white shadow-sm border border-white/5 shrink-0">
                          {emps.length}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-2 pb-2 pt-1 border-t border-white/5 bg-black/10">
                          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                            {emps.map(emp => (
                              <div key={emp.id} className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-300 truncate mr-2" title={emp.name}>{emp.name}</span>
                                <span className="text-slate-500 font-mono shrink-0">{emp.badge_number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
