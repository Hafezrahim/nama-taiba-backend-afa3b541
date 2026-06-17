import { supabase, handleError } from './config';

export interface ContactInfo {
  address_en: string;
  address_ar: string;
  phone: string;
  email: string;
  whatsapp: string;
  map_url: string;
  latitude: number;
  longitude: number;
}

export const getContactInfo = async (): Promise<ContactInfo> => {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    if (!data) {
      return {
        address_en: 'Riyadh, Saudi Arabia',
        address_ar: 'الرياض، المملكة العربية السعودية',
        phone: '+966 12 345 6789',
        email: 'info@namataiba.com',
        whatsapp: '+966123456789',
        map_url: '',
        latitude: 24.7136,
        longitude: 46.6753
      };
    }

    return {
      address_en: data.address_en,
      address_ar: data.address_ar,
      phone: data.phone,
      email: data.email,
      whatsapp: data.whatsapp || '',
      map_url: data.map_url || '',
      latitude: data.latitude || 24.7136,
      longitude: data.longitude || 46.6753
    };
  } catch (error) {
    handleError(error, 'fetch contact info');
    return {
      address_en: 'Riyadh, Saudi Arabia',
      address_ar: 'الرياض، المملكة العربية السعودية',
      phone: '+966 12 345 6789',
      email: 'info@namataiba.com',
      whatsapp: '+966123456789',
      map_url: '',
      latitude: 24.7136,
      longitude: 46.6753
    };
  }
};

export const submitContactForm = async (formData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .insert([formData]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
