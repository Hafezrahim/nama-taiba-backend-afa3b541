import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper type for bilingual content
export interface BilingualContent {
  ar: string;
  en: string;
}

// Helper function to handle errors
export const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  throw new Error(`Failed to ${context}: ${error.message}`);
};
