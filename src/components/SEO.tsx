import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  keywordsEn?: string;
  keywordsAr?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  product?: {
    price?: number;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
  };
  noIndex?: boolean;
}

const BASE_URL = 'https://www.nama-taiba.com';
const DEFAULT_IMAGE = 'https://www.nama-taiba.com/uploads/logo.png';

export function SEO({
  titleEn = 'Nama Taiba Factory',
  titleAr = 'مصنع نما طيبة',
  descriptionEn = 'Leading manufacturer of premium building materials, GRC, GRP, and modern construction solutions in Saudi Arabia',
  descriptionAr = 'مصنع رائد لمواد البناء عالية الجودة، GRC، GRP، والحلول الإنشائية الحديثة في المملكة العربية السعودية',
  keywordsEn,
  keywordsAr,
  keywords = 'building materials, construction, GRC, GRP, Saudi Arabia, Nama Taiba, مصنع نما طيبة, مواد بناء',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  article,
  product,
  noIndex = false,
}: SEOProps) {
  const { language } = useLanguage();
  
  const title = language === 'ar' ? titleAr : titleEn;
  const description = language === 'ar' ? descriptionAr : descriptionEn;
  const activeKeywords = language === 'ar' ? (keywordsAr || keywords) : (keywordsEn || keywords);
  const brand = language === 'ar' ? 'نما طيبة' : 'Nama Taiba';
  const fullTitle = title.includes(brand) ? title : `${title} | ${brand}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language === 'ar' ? 'ar' : 'en'} dir={language === 'ar' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={activeKeywords} />
      <meta name="author" content="Nama Taiba" />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={language === 'ar' ? 'نما طيبة' : 'Nama Taiba'} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_SA' : 'en_US'} />
      <meta property="og:locale:alternate" content={language === 'ar' ? 'en_US' : 'ar_SA'} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@namataiba" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Article-specific meta */}
      {type === 'article' && article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
        </>
      )}
      
      {/* Product-specific meta (for rich snippets) */}
      {type === 'product' && product && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: title,
            description: description,
            image: imageUrl,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: product.currency || 'SAR',
              availability: product.availability === 'in stock' 
                ? 'https://schema.org/InStock' 
                : 'https://schema.org/OutOfStock',
            },
          })}
        </script>
      )}
      
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Nama Taiba Factory',
          alternateName: 'مصنع نما طيبة',
          url: BASE_URL,
          logo: DEFAULT_IMAGE,
          sameAs: [
            'https://twitter.com/namataiba',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+966-xxx-xxx-xxx',
            contactType: 'customer service',
            areaServed: 'SA',
            availableLanguage: ['ar', 'en'],
          },
        })}
      </script>
    </Helmet>
  );
}

export default SEO;
