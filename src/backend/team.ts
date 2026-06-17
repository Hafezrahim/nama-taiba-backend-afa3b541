import { supabase, handleError } from './config';

export interface TeamMember {
  id: string;
  nam_ar: string;
  nam_en: string;
  position_ar: string;
  position_en: string;
  image_url: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nam_ar: row.name_ar,
      nam_en: row.name_en,
      position_ar: row.position_ar,
      position_en: row.position_en,
      image_url: row.image_url || ''
    }));
  } catch (error) {
    handleError(error, 'fetch team members');
    return [];
  }
};
