
export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  category: string;
  size: string;
  price: number;
  isFeatured: boolean;
  inStock: boolean;
  keywords?: string;
}

export interface Offer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  validUntil: string;
  price: number;
  maxQty: number;
  minQty: number;
  category: string;
  contact: string;
}

export interface Service {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconName: string;
}

export interface Project {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  date: string;
  location: string;
}

export interface AboutInfo {
  vision: { content_ar: string; content_en: string; image?: string };
  mission: { content_ar: string; content_en: string; image?: string };
  history: { content_ar: string; content_en: string; image?: string };
}

export interface TeamMember {
  id: string;
  nam_ar: string;
  nam_en: string;
  position_ar: string;
  position_en: string;
  image_url: string;
}

export interface Certification {
  id: string;
  name_ar: string;
  name_en: string;
  image: string;
  type_ar: string;
  type_en: string;
  issued_by_ar: string;
  issued_by_en: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description_ar: string;
  description_en: string;
}

export interface Blog {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  image: string;
  date: string;
  author: string;
}

export interface Testimonial {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  contentAr: string;
  contentEn: string;
  rating: number;
  avatar?: string;
}
