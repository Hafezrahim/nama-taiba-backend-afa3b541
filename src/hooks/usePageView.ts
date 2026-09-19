import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const SESSION_KEY = 'nt_tracked_paths';

/**
 * Records a visit to a public page. Each path is counted once per browser tab session
 * so refreshes and re-renders do not inflate the numbers.
 */
export const usePageView = (pageTitle?: string) => {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/client') || pathname.startsWith('/marketer')) {
      return;
    }

    let tracked: string[] = [];
    try {
      tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    } catch {
      tracked = [];
    }
    if (tracked.includes(pathname)) return;

    tracked.push(pathname);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(tracked));
    } catch {
      /* storage unavailable — still record the visit */
    }

    supabase
      .from('page_views')
      .insert({
        path: pathname,
        page_title: pageTitle ?? document.title,
        language,
        referrer: document.referrer || null,
      })
      .then(({ error }) => {
        if (error) console.warn('page view not recorded', error.message);
      });
  }, [pathname, pageTitle, language]);
};
