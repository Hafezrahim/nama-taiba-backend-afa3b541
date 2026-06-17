import { supabase, handleError } from './config';

export interface MapLocation {
  id: string;
  name_en: string;
  name_ar: string;
  address_en: string | null;
  address_ar: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  map_url: string | null;
  icon_color: string | null;
  is_active: boolean;
  display_order: number;
}

export const getMapLocations = async (activeOnly = true): Promise<MapLocation[]> => {
  try {
    let query = supabase
      .from('map_locations')
      .select('*')
      .order('display_order', { ascending: true });
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as MapLocation[];
  } catch (error) {
    handleError(error, 'fetch map locations');
    return [];
  }
};

export const upsertMapLocation = async (location: Partial<MapLocation>) => {
  const { data, error } = await supabase
    .from('map_locations')
    .upsert(location as any)
    .select()
    .single();
  if (error) throw error;
  return data as MapLocation;
};

export const deleteMapLocation = async (id: string) => {
  const { error } = await supabase.from('map_locations').delete().eq('id', id);
  if (error) throw error;
};
