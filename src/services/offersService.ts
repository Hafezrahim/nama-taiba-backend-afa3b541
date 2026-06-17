
import { fetchSheetData } from './config';
import type { Offer } from './types';

export const getOffers = async (): Promise<Offer[]> => {
  try {
    const data = await fetchSheetData("offers");
    if (!data || data.length < 2) return [];
    
    return data.slice(1).map((row: any[]) => ({
      id: row[0] || "",
      titleAr: row[1] || "",
      titleEn: row[2] || "",
      descriptionAr: row[3] || "",
      descriptionEn: row[4] || "",
      image: row[5] || "",
      validUntil: row[6] || "",
      price: parseFloat(row[7]) || 0,
      minQty: parseInt(row[8], 10) || 1,  // Correctly map mim_qty as minQty
      maxQty: parseInt(row[8], 10) || 1,  // Default maxQty same as minQty for now
      category: row[9] || "",
      contact: row[10] || ""
    }));
  } catch (error) {
    console.error("Error processing offers:", error);
    return [];
  }
};

export const getOfferCategories = async (): Promise<string[]> => {
  try {
    const offers = await getOffers();
    const categoriesSet = new Set<string>();
    
    offers.forEach(offer => {
      if (offer.category) {
        categoriesSet.add(offer.category);
      }
    });
    
    return Array.from(categoriesSet);
  } catch (error) {
    console.error("Error getting offer categories:", error);
    return [];
  }
};
