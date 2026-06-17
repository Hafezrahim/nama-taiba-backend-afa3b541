
import { fetchSheetData } from './config';
import type { Service } from './types';

export const getServices = async (): Promise<Service[]> => {
  try {
    const data = await fetchSheetData("services");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      titleEn: row[1] || "",
      titleAr: row[2] || "",
      descriptionEn: row[3] || "",
      descriptionAr: row[4] || "",
      iconName: row[5] || "chevron-right"
    }));
  } catch (error) {
    console.error("Error processing services:", error);
    return [];
  }
};
