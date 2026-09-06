import { useState, useEffect } from 'react';
import { User, CheckCircle2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { usePermissions } from '@/auth/hooks/usePermissions';
import { toast } from 'sonner';

export interface UniformItem {
  item: string;
  value: string;
  texture: string;
}

export interface RankUniformDetailsProps {
  rankId: string;
  defaultTitle: string;
}

export const RankUniformDetailsComponent = ({ rankId, defaultTitle }: RankUniformDetailsProps) => {
  const { isHighCommandOrHR } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(defaultTitle);
  const [maleUniform, setMaleUniform] = useState<UniformItem[]>([]);
  const [femaleUniform, setFemaleUniform] = useState<UniformItem[]>([]);

  // Original state for canceling
  const [originalMaleUniform, setOriginalMaleUniform] = useState<UniformItem[]>([]);
  const [originalFemaleUniform, setOriginalFemaleUniform] = useState<UniformItem[]>([]);

  useEffect(() => {
    fetchUniformData();
  }, [rankId]);

  const fetchUniformData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('uniform_guide')
      .select('*')
      .eq('id', rankId)
      .single();

    if (error) {
      console.error('Error fetching uniform data:', error);
      toast.error('Failed to load uniform guidelines');
    } else if (data) {
      setTitle(data.title);
      setMaleUniform(data.male_uniform || []);
      setFemaleUniform(data.female_uniform || []);
      setOriginalMaleUniform(data.male_uniform || []);
      setOriginalFemaleUniform(data.female_uniform || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('uniform_guide')
      .update({
        male_uniform: maleUniform,
        female_uniform: femaleUniform,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankId);

    if (error) {
      console.error('Error saving uniform data:', error);
      toast.error('Failed to save changes');
    } else {
      toast.success('Uniform guidelines updated successfully');
      setOriginalMaleUniform(maleUniform);
      setOriginalFemaleUniform(femaleUniform);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setMaleUniform(originalMaleUniform);
    setFemaleUniform(originalFemaleUniform);
    setIsEditing(false);
  };

  const updateItem = (gender: 'male' | 'female', index: number, field: keyof UniformItem, value: string) => {
    const updateFn = gender === 'male' ? setMaleUniform : setFemaleUniform;
    updateFn(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm mt-2 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[#10b981] font-extrabold tracking-widest uppercase text-xs">
          <div className="w-8 h-[1px] bg-gradient-to-r from-[#10b981] to-transparent"></div>
          {title} UNIFORM DETAILS
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Male Section */}
        <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md shadow-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="bg-slate-900/80 border-b border-white/5 p-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center border border-[#3b82f6]/30">
                <User className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide uppercase">Male</h3>
            </div>
          </div>

          <div className="p-6 relative z-10">
            <div className="space-y-3">
              {maleUniform.map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-white/5 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0 w-1/3">
                    <CheckCircle2 className="w-4 h-4 text-[#3b82f6] shrink-0" />
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={row.item} 
                        onChange={(e) => updateItem('male', i, 'item', e.target.value)}
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs w-full focus:outline-none focus:border-[#3b82f6]/50"
                      />
                    ) : (
                      <span className="font-bold text-slate-200">{row.item}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end ml-7 sm:ml-0 text-right w-2/3">
                    {isEditing ? (
                      <div className="flex flex-col gap-1 w-full max-w-[250px]">
                        <input 
                          type="text" 
                          value={row.value} 
                          placeholder="Item ID"
                          onChange={(e) => updateItem('male', i, 'value', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[#3b82f6] font-bold text-xs w-full focus:outline-none focus:border-[#3b82f6]/50"
                        />
                        <input 
                          type="text" 
                          value={row.texture} 
                          placeholder="Texture ID"
                          onChange={(e) => updateItem('male', i, 'texture', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-400 text-xs w-full focus:outline-none focus:border-[#3b82f6]/50"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-[#3b82f6] font-black">{row.value}</span>
                        {row.texture && (
                          <span className="text-slate-400 text-[11px] font-medium mt-0.5 max-w-[150px] leading-tight sm:max-w-none">Texture: {row.texture}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Female Section */}
        <div className="animate-fadeSlideIn opacity-0 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-md shadow-xl overflow-hidden group" style={{ animationDelay: '150ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#ec4899]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="bg-slate-900/80 border-b border-white/5 p-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ec4899]/20 flex items-center justify-center border border-[#ec4899]/30">
                <User className="w-5 h-5 text-[#ec4899]" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide uppercase">Female</h3>
            </div>
          </div>

          <div className="p-6 relative z-10">
            <div className="space-y-3">
              {femaleUniform.map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-white/5 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0 w-1/3">
                    <CheckCircle2 className="w-4 h-4 text-[#ec4899] shrink-0" />
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={row.item} 
                        onChange={(e) => updateItem('female', i, 'item', e.target.value)}
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs w-full focus:outline-none focus:border-[#ec4899]/50"
                      />
                    ) : (
                      <span className="font-bold text-slate-200">{row.item}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end ml-7 sm:ml-0 text-right w-2/3">
                    {isEditing ? (
                      <div className="flex flex-col gap-1 w-full max-w-[250px]">
                        <input 
                          type="text" 
                          value={row.value} 
                          placeholder="Item ID"
                          onChange={(e) => updateItem('female', i, 'value', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[#ec4899] font-bold text-xs w-full focus:outline-none focus:border-[#ec4899]/50"
                        />
                        <input 
                          type="text" 
                          value={row.texture} 
                          placeholder="Texture ID"
                          onChange={(e) => updateItem('female', i, 'texture', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-400 text-xs w-full focus:outline-none focus:border-[#ec4899]/50"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-[#ec4899] font-black">{row.value}</span>
                        {row.texture && (
                          <span className="text-slate-400 text-[11px] font-medium mt-0.5 max-w-[150px] leading-tight sm:max-w-none">Texture: {row.texture}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
