
import { fetchSheetData } from './config';
import type { Product } from './types';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await fetchSheetData("products");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      nameAr: row[1] || "",
      nameEn: row[2] || "",
      descriptionAr: row[3] || "",
      descriptionEn: row[4] || "",
      image: row[5] || "",
      category: row[6] || "",
      size: row[7] || "",
      price: parseFloat(row[8]) || 0,
      isFeatured: row[9]?.toLowerCase() === "true",
      inStock: row[10]?.toLowerCase() === "true",
      keywords: row[11] || ""
    }));
  } catch (error) {
    console.error("Error processing products:", error);
    return [];
  }
};
