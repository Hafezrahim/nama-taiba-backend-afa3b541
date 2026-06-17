
import { fetchSheetData } from './config';
import type { Blog } from './types';

export const getBlogs = async (): Promise<Blog[]> => {
  try {
    const data = await fetchSheetData("blogs");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      titleAr: row[1] || "",
      titleEn: row[2] || "",
      contentAr: row[3] || "",
      contentEn: row[4] || "",
      image: row[5] || "",
      date: row[6] || "",
      author: row[7] || ""
    }));
  } catch (error) {
    console.error("Error processing blogs:", error);
    return [];
  }
};
