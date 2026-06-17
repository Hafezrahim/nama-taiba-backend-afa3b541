import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export function DynamicSEO() {
  const { language } = useLanguage();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.setting_key] = row.setting_value || '';
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Strict allowlists to prevent stored XSS via tag manager IDs
  const GTM_ID_RE = /^GTM-[A-Z0-9]+$/;
  const GA4_ID_RE = /^G-[A-Z0-9]+$/;

  // Inject GTM script dynamically
  useEffect(() => {
    if (!settings) return;
    const gtmEnabled = settings.gtm_enabled === 'true';
    const gtmId = settings.gtm_id;
    const validGtm = !!gtmId && GTM_ID_RE.test(gtmId);
    const existingScript = document.getElementById('gtm-script');

    if (gtmEnabled && validGtm && !existingScript) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId!)}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    } else if (!gtmEnabled || !validGtm) {
      if (gtmEnabled && gtmId && !validGtm) {
        console.warn('[DynamicSEO] Ignoring invalid GTM ID (expected format GTM-XXXXXX).');
      }
      existingScript?.remove();
      document.getElementById('gtm-noscript')?.remove();
    }
  }, [settings]);

  // Inject GA4 script dynamically
  useEffect(() => {
    if (!settings) return;
    const ga4Enabled = settings.ga4_enabled === 'true';
    const ga4Id = settings.ga4_id;
    const validGa4 = !!ga4Id && GA4_ID_RE.test(ga4Id);
    const existingScript = document.getElementById('ga4-script');

    if (ga4Enabled && validGa4 && !existingScript) {
      const gtagScript = document.createElement('script');
      gtagScript.id = 'ga4-script';
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id!)}`;
      document.head.appendChild(gtagScript);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga4-inline';
      inlineScript.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`;
      document.head.appendChild(inlineScript);
    } else if (!ga4Enabled || !validGa4) {
      if (ga4Enabled && ga4Id && !validGa4) {
        console.warn('[DynamicSEO] Ignoring invalid GA4 ID (expected format G-XXXXXX).');
      }
      existingScript?.remove();
      document.getElementById('ga4-inline')?.remove();
    }
  }, [settings]);

  if (!settings) return null;

  const title = language === 'ar' ? settings.seo_title_ar : settings.seo_title_en;
  const description = language === 'ar' ? settings.seo_description_ar : settings.seo_description_en;
  const keywords = language === 'ar' ? (settings.seo_keywords_ar || settings.seo_keywords) : (settings.seo_keywords_en || settings.seo_keywords);
  const canonicalUrl = settings.meta_canonical_url || 'https://www.nama-taiba.com';
  const ogImage = settings.seo_og_image || `${canonicalUrl}/uploads/logo.png`;

  return (
    <Helmet>
      <html lang={language === 'ar' ? 'ar' : 'en'} dir={language === 'ar' ? 'rtl' : 'ltr'} />
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {settings.meta_author && <meta name="author" content={settings.meta_author} />}
      {settings.meta_robots && <meta name="robots" content={settings.meta_robots} />}
      <link rel="canonical" href={canonicalUrl} />
      {settings.meta_theme_color && <meta name="theme-color" content={settings.meta_theme_color} />}

      {/* Open Graph */}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_SA' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {settings.meta_twitter_handle && <meta name="twitter:site" content={settings.meta_twitter_handle} />}
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* Search-engine verification */}
      {settings.verify_google && <meta name="google-site-verification" content={settings.verify_google} />}
      {settings.verify_bing && <meta name="msvalidate.01" content={settings.verify_bing} />}
      {settings.verify_yandex && <meta name="yandex-verification" content={settings.verify_yandex} />}
      {settings.verify_pinterest && <meta name="p:domain_verify" content={settings.verify_pinterest} />}
    </Helmet>
  );
}

export default DynamicSEO;
