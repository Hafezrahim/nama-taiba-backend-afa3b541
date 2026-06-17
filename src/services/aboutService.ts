
import { fetchSheetData } from './config';
import type { AboutInfo } from './types';

export const getAboutInfo = async (): Promise<AboutInfo> => {
  try {
    const data = await fetchSheetData("about");
    if (!data || data.length < 2) {
      return {
        vision: { 
          content_ar: "رؤيتنا هي أن نكون المصنع الأول في المملكة للجودة والخدمات", 
          content_en: "Our vision is to be the top manufacturer in Saudi Arabia for quality",
          image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
        },
        mission: { 
          content_ar: "تقديم منتجات بلوك بمعايير عالمية", 
          content_en: "Deliver block products with global standards",
          image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
        },
        history: { 
          content_ar: "تأسس المصنع في 2016 في المدينة المنورة", 
          content_en: "Established in 2016 in Madinah",
          image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
        }
      };
    }
    
    // Convert rows to key-value pairs
    const aboutInfo: { [key: string]: { content_ar: string; content_en: string; image?: string } } = {};
    data.slice(1).forEach((row: any[]) => {
      if (row[0]) {
        aboutInfo[row[0]] = {
          content_ar: row[1] || "",
          content_en: row[2] || "",
          image: row[3] || "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png"
        };
      }
    });
    
    return {
      vision: aboutInfo.vision || { 
        content_ar: "رؤيتنا هي أن نكون المصنع الأول في المملكة للجودة والخدمات", 
        content_en: "Our vision is to be the top manufacturer in Saudi Arabia for quality",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      },
      mission: aboutInfo.mission || { 
        content_ar: "تقديم منتجات بلوك بمعايير عالمية", 
        content_en: "Deliver block products with global standards",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      },
      history: aboutInfo.history || { 
        content_ar: "تأسس المصنع في 2016 في المدينة المنورة", 
        content_en: "Established in 2016 in Madinah",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      }
    };
  } catch (error) {
    console.error("Error processing about info:", error);
    return {
      vision: { 
        content_ar: "رؤيتنا هي أن نكون المصنع الأول في المملكة للجودة والخدمات", 
        content_en: "Our vision is to be the top manufacturer in Saudi Arabia for quality",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      },
      mission: { 
        content_ar: "تقديم منتجات بلوك بمعايير عالمية", 
        content_en: "Deliver block products with global standards",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      },
      history: { 
        content_ar: "تأسس المصنع في 2016 في المدينة المنورة", 
        content_en: "Established in 2016 in Madinah",
        image: "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png" 
      }
    };
  }
};
