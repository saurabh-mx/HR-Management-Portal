import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { usePermissions } from '@/auth/hooks/usePermissions';
import { usePortalContent } from '@/hooks/usePortalContent';
import { hexToRgba } from '@/constants/documentsData';
import { useState, useEffect } from 'react';

interface PursuitCode {
  cond: string;
  desc: string;
  color: string;
}

export const PursuitCodesComponent = () => {
  const { isHighCommandOrHR } = usePermissions();
  const { data: pursuitCodes, isEditing, setIsEditing, updateContent, saving } = usePortalContent<PursuitCode[]>('sop_pursuit_codes', []);
  const [localData, setLocalData] = useState<PursuitCode[]>([]);

  useEffect(() => {
    if (pursuitCodes) {
      setLocalData(pursuitCodes);
    }
  }, [pursuitCodes, isEditing]);

  const handleSave = async () => {
    await updateContent(localData);
  };

  const handleCancel = () => {
    setLocalData(pursuitCodes || []);
    setIsEditing(false);
  };

  const handleEditItem = (index: number, field: keyof PursuitCode, value: string) => {
    const newData = [...localData];
    newData[index] = { ...newData[index], [field]: value };
    setLocalData(newData);
  };

  const handleAddItem = () => {
    setLocalData([...localData, { cond: 'New Code', desc: 'Description', color: '#ffffff' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newData = [...localData];
    newData.splice(index, 1);
    setLocalData(newData);
  };

  return (
    <div className="p-4 sm:p-8 pt-8 space-y-10 text-sm mt-2 relative">
      {isHighCommandOrHR && (
        <div className="flex justify-end mb-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9]/20 text-[#0ea5e9] rounded-lg hover:bg-[#0ea5e9]/30 transition-colors border border-[#0ea5e9]/30"
            >
              <Edit2 className="w-4 h-4" />
              Edit Pursuit Codes
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {localData.map((item, i) => (
          <div 
            key={i} 
            className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col sm:flex-row gap-5 sm:items-center p-6 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 group"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2" style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}` }}></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(90deg, ${hexToRgba(item.color, 0.1)}, transparent)` }}></div>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <div className="flex items-center gap-2 relative z-10">
                  <input
                    type="color"
                    value={item.color}
                    onChange={(e) => handleEditItem(i, 'color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    value={item.cond}
                    onChange={(e) => handleEditItem(i, 'cond', e.target.value)}
                    className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-black tracking-widest text-xs uppercase"
                  />
                </div>
              ) : (
                <div className="px-5 py-2.5 rounded-xl font-black tracking-widest text-xs uppercase shadow-inner relative z-10 border" style={{ backgroundColor: hexToRgba(item.color, 0.1), color: item.color, borderColor: hexToRgba(item.color, 0.2) }}>
                  {item.cond}
                </div>
              )}
            </div>
            
            <div className="text-slate-200 font-medium flex-1 leading-relaxed relative z-10 text-[15px]">
              {isEditing ? (
                <textarea
                  value={item.desc}
                  onChange={(e) => handleEditItem(i, 'desc', e.target.value)}
                  className="bg-black/30 border border-white/10 rounded px-3 py-2 text-slate-200 w-full min-h-[80px]"
                />
              ) : (
                item.desc
              )}
            </div>
            
            {isEditing && (
              <button
                onClick={() => handleRemoveItem(i)}
                className="relative z-10 text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg border border-red-500/20"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {isEditing && (
          <div 
            onClick={handleAddItem}
            className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border border-dashed border-white/20 bg-slate-900/20 hover:bg-slate-900/40 cursor-pointer transition-all duration-300 group min-h-[100px]" 
            style={{ animationDelay: `${localData.length * 150}ms` }}
          >
            <Plus className="w-8 h-8 text-slate-500 group-hover:text-slate-300" />
            <span className="text-slate-500 font-bold group-hover:text-slate-300">Add Code</span>
          </div>
        )}
      </div>
    </div>
  );
};
