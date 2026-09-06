import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { toast } from 'sonner';

export function usePortalContent<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data: contentData, error } = await supabase
          .from('portal_content')
          .select('data')
          .eq('key', key)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching content:', error);
          return;
        }

        if (contentData) {
          setData(contentData.data as T);
        }
      } catch (err) {
        console.error('Failed to load portal content', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [key]);

  const updateContent = async (newData: T) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_content')
        .upsert({ key, data: newData });

      if (error) throw error;
      
      setData(newData);
      setIsEditing(false);
      toast.success('Content updated successfully');
    } catch (err: any) {
      console.error('Error updating content:', err);
      toast.error('Failed to update content: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    data,
    setData,
    loading,
    isEditing,
    setIsEditing,
    updateContent,
    saving
  };
}
