import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, FileWarning, Clock, Edit2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { usePermissions } from '@/auth/hooks/usePermissions';
import { toast } from 'sonner';

export const SergeantsAboveComponent = () => {
  const { isHighCommandOrHR } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [rules, setRules] = useState<any[]>([]);
  const [originalRules, setOriginalRules] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('uniform_guide')
      .select('*')
      .eq('id', 'sergeants_above')
      .single();

    if (error) {
      console.error('Error fetching sergeants above data:', error);
    } else if (data) {
      setRules(data.rules || []);
      setOriginalRules(data.rules || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('uniform_guide')
      .update({
        rules: rules,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'sergeants_above');

    if (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save changes');
    } else {
      toast.success('Rules updated successfully');
      setOriginalRules(rules);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setRules(originalRules);
    setIsEditing(false);
  };

  const updateRule = (index: number, field: string, value: string) => {
    setRules(prev => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#ec4899] animate-spin" />
      </div>
    );
  }

  // Safe getters to match our JSON schema from DB
  const mainRule = rules.find(r => r.type === 'main_rule') || { title: 'Formal Uniform Policy', content: '' };
  const mandatoryEquip = rules.find(r => r.type === 'mandatory_equipment') || { title: 'Mandatory Equipment', content: '', note: '' };
  const bulletRules = rules.filter(r => r.type === 'bullet_rule');

  return (
    <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm mt-2 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[#ec4899] font-extrabold tracking-widest uppercase text-xs">
          <div className="w-8 h-[1px] bg-gradient-to-r from-[#ec4899] to-transparent"></div>
          SERGEANTS & ABOVE
        </div>

        {isHighCommandOrHR && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            EDIT
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-md transition-colors"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              SAVE
            </button>
          </div>
        )}
      </div>

      {/* Main Rule */}
      <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)] p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <div className="w-full">
            <h3 className="text-xl font-black text-white tracking-wide mb-2">{mainRule.title}</h3>
            {isEditing ? (
              <textarea
                value={mainRule.content}
                onChange={(e) => updateRule(rules.findIndex(r => r.type === 'main_rule'), 'content', e.target.value)}
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-slate-300 text-sm w-full min-h-[80px] focus:outline-none focus:border-[#3b82f6]/50"
              />
            ) : (
              <p className="text-slate-300 font-medium leading-relaxed text-[15px]">
                {mainRule.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid for specific ranks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sergeant First Class & Below Rules */}
        <div className="animate-fadeSlideIn opacity-0 rounded-2xl border border-[#ec4899]/20 bg-[#ec4899]/5 hover:bg-[#ec4899]/10 transition-all duration-300 p-6 space-y-4 group" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#ec4899]" />
            <h4 className="text-[#ec4899] font-black uppercase tracking-wider text-sm">{mandatoryEquip.title}</h4>
          </div>
          {isEditing ? (
            <textarea
              value={mandatoryEquip.content}
              onChange={(e) => updateRule(rules.findIndex(r => r.type === 'mandatory_equipment'), 'content', e.target.value)}
              className="bg-black/30 border border-white/10 rounded px-3 py-2 text-slate-300 text-sm w-full min-h-[80px] focus:outline-none focus:border-[#ec4899]/50"
            />
          ) : (
            <p className="text-slate-300 font-medium leading-relaxed">
              {mandatoryEquip.content}
            </p>
          )}
          <div className="pt-4 border-t border-[#ec4899]/20">
            {isEditing ? (
              <input
                type="text"
                value={mandatoryEquip.note}
                onChange={(e) => updateRule(rules.findIndex(r => r.type === 'mandatory_equipment'), 'note', e.target.value)}
                className="bg-black/30 border border-white/10 rounded px-3 py-2 text-[#ec4899]/80 font-semibold italic text-[13px] w-full focus:outline-none focus:border-[#ec4899]/50"
              />
            ) : (
              <p className="text-[#ec4899]/80 font-semibold italic text-[13px]">
                {mandatoryEquip.note}
              </p>
            )}
          </div>
        </div>

        {/* Major and Corporal rules */}
        <div className="space-y-6">
          {bulletRules.map((rule, idx) => (
            <div key={idx} className="animate-fadeSlideIn opacity-0 rounded-2xl border border-white/5 bg-slate-900/50 p-5 flex items-start gap-4 hover:border-white/10 transition-colors" style={{ animationDelay: `${150 + idx * 50}ms` }}>
              <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: rule.color, boxShadow: `0 0 10px ${rule.color}80` }}></div>
              <div className="w-full">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={rule.title}
                      onChange={(e) => {
                        const globalIdx = rules.findIndex(r => r === rule);
                        updateRule(globalIdx, 'title', e.target.value);
                      }}
                      className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white font-bold uppercase tracking-wider text-xs mb-2 w-full focus:outline-none"
                    />
                    <textarea
                      value={rule.content}
                      onChange={(e) => {
                        const globalIdx = rules.findIndex(r => r === rule);
                        updateRule(globalIdx, 'content', e.target.value);
                      }}
                      className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-300 font-medium text-sm w-full focus:outline-none"
                    />
                  </>
                ) : (
                  <p className="text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold uppercase tracking-wider text-xs block mb-1">{rule.title}</span>
                    {rule.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="animate-fadeSlideIn opacity-0 mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center text-center space-y-2" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 text-slate-400">
          <FileWarning className="w-4 h-4" />
          <span className="font-bold text-[13px] tracking-wide">This document is subject to change and is a work in progress.</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          <span>Last update: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
