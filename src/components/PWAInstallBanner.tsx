import { useState, useEffect } from 'react';
import { usePWA } from '@/contexts/PWAContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const PWAInstallBanner = () => {
  const { deferredPrompt, isInstalled, triggerInstall } = usePWA();
  const { t, isRTL } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner after 3 seconds if prompt is available and not dismissed
    if (deferredPrompt && !isInstalled && !dismissed) {
      const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (wasDismissed) {
        setDismissed(true);
        return;
      }
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isInstalled, dismissed]);

  if (!show || isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) setShow(false);
  };

  return (
    <div className={cn(
      "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-50",
      "bg-card border border-border shadow-2xl rounded-2xl p-4",
      "animate-in slide-in-from-bottom-5 duration-500"
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      <button onClick={handleDismiss} className="absolute top-2 end-2 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <img
          src="/uploads/b209d6cf-cd6c-41b6-ac17-8fcb2b241da3.png"
          alt="Nama Taiba"
          className="w-12 h-12 rounded-xl object-contain bg-white p-1 border"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t('Install Nama Taiba', 'تثبيت نما طيبة')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Quick access & offline support', 'وصول سريع ودعم بدون اتصال')}
          </p>
        </div>
        <Button size="sm" onClick={handleInstall} className="gap-1.5 shrink-0">
          <Download className="h-3.5 w-3.5" />
          {t('Install', 'تثبيت')}
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
