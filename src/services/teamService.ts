
import { fetchSheetData } from './config';
import type { TeamMember } from './types';

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const data = await fetchSheetData("team");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      nam_ar: row[1] || "",
      nam_en: row[2] || "",
      position_ar: row[3] || "",
      position_en: row[4] || "",
      image_url: row[5] || ""
    }));
  } catch (error) {
    console.error("Error processing team members:", error);
    return [];
  }
};
