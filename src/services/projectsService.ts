
import { fetchSheetData } from './config';
import type { Project } from './types';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const data = await fetchSheetData("projects");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      titleEn: row[1] || "",
      titleAr: row[2] || "",
      descriptionEn: row[3] || "",
      descriptionAr: row[4] || "",
      image: row[5] || "",
      date: row[6] || "",
      location: row[7] || ""
    }));
  } catch (error) {
    console.error("Error processing projects:", error);
    return [];
  }
};
