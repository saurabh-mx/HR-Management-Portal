import { supabase } from '@/lib/supabase/supabaseClient';

export interface AppImage {
  id: string;
  url: string;
  type: string;
  sequence_order: number;
  is_active: boolean;
  created_at: string;
}

export const imageService = {
  // Get all images
  async getImages(type?: string) {
    let query = supabase.from('app_images').select('*').order('sequence_order', { ascending: true });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as AppImage[];
  },

  // Get active images
  async getActiveImages(type?: string) {
    let query = supabase.from('app_images').select('*').eq('is_active', true).order('sequence_order', { ascending: true });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching images from Supabase:", error);
      return [];
    }
    return data as AppImage[];
  },

  // Add a single image
  async addImage(url: string, type: string) {
    // Get max sequence to append to the end
    const { data: currentImages } = await supabase
      .from('app_images')
      .select('sequence_order')
      .eq('type', type)
      .order('sequence_order', { ascending: false })
      .limit(1);
      
    const nextSeq = (currentImages && currentImages.length > 0) ? currentImages[0].sequence_order + 1 : 0;

    const { data, error } = await supabase
      .from('app_images')
      .insert([{ url, type, sequence_order: nextSeq }])
      .select();
      
    if (error) throw error;
    return data[0] as AppImage;
  },

  // Add multiple images
  async addMultipleImages(urls: string[], type: string) {
    const { data: currentImages } = await supabase
      .from('app_images')
      .select('sequence_order')
      .eq('type', type)
      .order('sequence_order', { ascending: false })
      .limit(1);
      
    let nextSeq = (currentImages && currentImages.length > 0) ? currentImages[0].sequence_order + 1 : 0;

    const inserts = urls.map(url => ({
      url: url.trim(),
      type,
      sequence_order: nextSeq++
    }));

    const { data, error } = await supabase
      .from('app_images')
      .insert(inserts)
      .select();
      
    if (error) throw error;
    return data as AppImage[];
  },

  // Update sequence (bulk update)
  async updateSequence(updates: { id: string, sequence_order: number }[]) {
    // Supabase JS doesn't have a bulk update by ID natively in a single call without a stored procedure,
    // so we do it in a Promise.all for simplicity. Since lists are small (5-20 images), this is fine.
    const promises = updates.map(update => 
      supabase.from('app_images').update({ sequence_order: update.sequence_order }).eq('id', update.id)
    );
    await Promise.all(promises);
  },

  // Toggle active status
  async toggleActive(id: string, is_active: boolean) {
    const { error } = await supabase.from('app_images').update({ is_active }).eq('id', id);
    if (error) throw error;
  },

  // Delete image
  async deleteImage(id: string) {
    const { error } = await supabase.from('app_images').delete().eq('id', id);
    if (error) throw error;
  }
};
