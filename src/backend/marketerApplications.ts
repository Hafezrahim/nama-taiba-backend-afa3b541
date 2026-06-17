import { supabase } from './config';

export interface MarketerApplication {
  name: string;
  phone: string;
  city: string;
  total_experience: string;
  cv_file_name?: string;
  cv_file_data?: string;
  cv_file_type?: string;
  message?: string;
}

export const submitMarketerApplication = async (applicationData: MarketerApplication): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('marketer_applications')
      .insert([applicationData]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
