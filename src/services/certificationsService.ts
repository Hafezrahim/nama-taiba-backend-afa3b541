
import { fetchSheetData } from './config';
import type { Certification } from './types';

export const getCertifications = async (): Promise<Certification[]> => {
  try {
    const data = await fetchSheetData("certifications");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      name_ar: row[1] || "",
      name_en: row[2] || "",
      image: row[3] || "",
      type_ar: row[4] || "",
      type_en: row[5] || "",
      issued_by_ar: row[6] || "",
      issued_by_en: row[7] || ""
    }));
  } catch (error) {
    console.error("Error processing certifications:", error);
    return [];
  }
};
