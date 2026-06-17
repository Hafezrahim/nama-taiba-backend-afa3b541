
import { fetchSheetData } from './config';
import type { Testimonial } from './types';

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const data = await fetchSheetData("testimonials");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      name: row[1] || "",
      company: row[2] || "",
      textAr: row[3] || "",
      textEn: row[4] || "",
      date: row[5] || ""
    }));
  } catch (error) {
    console.error("Error processing testimonials:", error);
    return [];
  }
};
