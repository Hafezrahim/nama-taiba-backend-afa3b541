import { supabase, handleError } from './config';

export interface QuoteRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  offer_id?: string;
  product_id?: string;
  quantity?: number;
}

export const submitQuoteRequest = async (quoteData: QuoteRequest): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('quote_requests')
      .insert([quoteData]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
