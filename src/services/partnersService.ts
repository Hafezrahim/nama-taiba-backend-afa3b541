
import { fetchSheetData } from './config';
import type { Partner } from './types';

export const getPartners = async (): Promise<Partner[]> => {
  try {
    const data = await fetchSheetData("partners");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      name: row[1] || "",
      logo: row[2] || "",
      description_ar: row[3] || "",
      description_en: row[4] || ""
    }));
  } catch (error) {
    console.error("Error processing partners:", error);
    return [];
  }
};
