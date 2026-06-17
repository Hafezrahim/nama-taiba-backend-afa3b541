import { supabase, handleError } from './config';

export interface Profile {
  id: string;
  fullNameAr?: string;
  fullNameEn?: string;
  avatarUrl?: string;
  phone?: string;
  bioAr?: string;
  bioEn?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      fullNameAr: data.full_name_ar,
      fullNameEn: data.full_name_en,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      bioAr: data.bio_ar,
      bioEn: data.bio_en
    };
  } catch (error) {
    handleError(error, 'fetch profile');
    return null;
  }
};

export const updateProfile = async (userId: string, profile: Partial<Profile>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name_ar: profile.fullNameAr,
        full_name_en: profile.fullNameEn,
        avatar_url: profile.avatarUrl,
        phone: profile.phone,
        bio_ar: profile.bioAr,
        bio_en: profile.bioEn
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'update profile');
    return false;
  }
};
