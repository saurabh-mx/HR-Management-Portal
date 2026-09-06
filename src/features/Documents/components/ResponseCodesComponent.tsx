import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { usePermissions } from '@/auth/hooks/usePermissions';
import { usePortalContent } from '@/hooks/usePortalContent';
import { useState, useEffect } from 'react';

interface ResponseCode {
  code: string;
  desc: string;
  color: string;
}

export const ResponseCodesComponent = () => {
  const { isHighCommandOrHR } = usePermissions();
  const { data: responseCodes, isEditing, setIsEditing, updateContent, saving } = usePortalContent<ResponseCode[]>('sop_response_codes', []);
  const [localData, setLocalData] = useState<ResponseCode[]>([]);

  useEffect(() => {
    if (responseCodes) {
      setLocalData(responseCodes);
    }
  }, [responseCodes, isEditing]);

  const handleSave = async () => {
    await updateContent(localData);
  };

  const handleCancel = () => {
    setLocalData(responseCodes || []);
    setIsEditing(false);
  };

  const handleEditItem = (index: number, field: keyof ResponseCode, value: string) => {
    const newData = [...localData];
    newData[index] = { ...newData[index], [field]: value };
    setLocalData(newData);
  };

  const handleAddItem = () => {
    setLocalData([...localData, { code: 'New Code', desc: 'Description', color: '#ffffff' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newData = [...localData];
    newData.splice(index, 1);
    setLocalData(newData);
  };

  return (
    <div className="p-4 sm:p-8 pt-8 space-y-8 text-sm mt-2 relative">
      {isHighCommandOrHR && (
        <div className="flex justify-end mb-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9]/20 text-[#0ea5e9] rounded-lg hover:bg-[#0ea5e9]/30 transition-colors border border-[#0ea5e9]/30"
            >
              <Edit2 className="w-4 h-4" />
              Edit Response Codes
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localData.map((item, i) => (
          <div 
            key={i} 
            className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col gap-2 p-5 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_15px_-5px_rgba(0,0,0,0.5)] group" 
            style={{ '--hover-color': item.color, animationDelay: `${i * 100}ms` } as React.CSSProperties}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }}></div>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}></div>

            <div className="flex items-center gap-3 relative z-10 justify-between">
              <div className="flex items-center gap-3 w-full">
                {isEditing ? (
                  <input
                    type="color"
                    value={item.color}
                    onChange={(e) => handleEditItem(i, 'color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                )}
                {isEditing ? (
                  <input
                    value={item.code}
                    onChange={(e) => handleEditItem(i, 'code', e.target.value)}
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white font-black tracking-wider text-base w-full"
                  />
                ) : (
                  <div className="font-black tracking-wider text-base transition-colors duration-300 group-hover:text-white" style={{ color: item.color }}>
                    {item.code}
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveItem(i)}
                  className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={item.desc}
                onChange={(e) => handleEditItem(i, 'desc', e.target.value)}
                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-slate-300 w-full mt-2 min-h-[80px]"
              />
            ) : (
              <div className="text-slate-300/90 font-medium leading-relaxed relative z-10 mt-1">
                {item.desc}
              </div>
            )}
          </div>
        ))}
        {isEditing && (
          <div 
            onClick={handleAddItem}
            className="animate-fadeSlideIn opacity-0 relative overflow-hidden flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-white/20 bg-slate-900/20 hover:bg-slate-900/40 cursor-pointer transition-all duration-300 group min-h-[120px]" 
            style={{ animationDelay: `${localData.length * 100}ms` }}
          >
            <Plus className="w-8 h-8 text-slate-500 group-hover:text-slate-300" />
            <span className="text-slate-500 font-bold group-hover:text-slate-300">Add Code</span>
          </div>
        )}
      </div>
    </div>
  );
};
