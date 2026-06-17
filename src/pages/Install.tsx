import { useLanguage } from '@/contexts/LanguageContext';
import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Chrome, Globe, Monitor, Apple } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { cn } from '@/lib/utils';

const Install = () => {
  const { t, language, isRTL } = useLanguage();
  const { deferredPrompt, isInstalled, triggerInstall } = usePWA();

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        titleEn="Install App | Nama Taiba"
        titleAr="تثبيت التطبيق | نما طيبة"
        descriptionEn="Install Nama Taiba app on your device"
        descriptionAr="ثبت تطبيق نما طيبة على جهازك"
      />
      <Header />
      <main className="min-h-screen flex items-center justify-center py-20 px-4 bg-background">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="mx-auto w-28 h-28 rounded-3xl overflow-hidden shadow-xl border-2 border-primary/20">
            <img
              src="/uploads/b209d6cf-cd6c-41b6-ac17-8fcb2b241da3.png"
              alt="Nama Taiba"
              className="w-full h-full object-contain bg-white p-3"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              {t('Install Nama Taiba', 'تثبيت نما طيبة')}
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {t(
                'Install our app for a faster experience with offline access, push notifications, and instant loading.',
                'ثبّت تطبيقنا للحصول على تجربة أسرع مع الوصول بدون اتصال والإشعارات والتحميل الفوري.'
              )}
            </p>
          </div>

          {isInstalled ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl p-6 space-y-2">
              <Smartphone className="h-10 w-10 mx-auto" />
              <p className="font-semibold text-lg">
                {t('App is already installed!', 'التطبيق مثبت بالفعل!')}
              </p>
              <p className="text-sm opacity-80">
                {t('You can find it on your home screen.', 'يمكنك العثور عليه على شاشتك الرئيسية.')}
              </p>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button size="lg" onClick={triggerInstall} className="gap-2 w-full text-lg h-14 rounded-xl shadow-lg">
                <Download className="h-5 w-5" />
                {t('Install Now', 'تثبيت الآن')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('Works on Chrome, Edge, Samsung Internet & more', 'يعمل على كروم، إيدج، سامسونج إنترنت والمزيد')}
              </p>
            </div>
          ) : (
            <div className="space-y-5 text-start">
              <p className="font-semibold text-foreground text-center">
                {t('Installation Instructions', 'تعليمات التثبيت')}
              </p>

              {/* Chrome / Edge Desktop */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <p className="font-medium text-sm">{t('Chrome / Edge (Desktop)', 'كروم / إيدج (سطح المكتب)')}</p>
                </div>
                <p className="text-sm text-muted-foreground ps-7">
                  {t(
                    'Click the install icon (⊕) in the address bar, or go to Menu (⋮) → "Install Nama Taiba"',
                    'اضغط على أيقونة التثبيت (⊕) في شريط العنوان، أو اذهب إلى القائمة (⋮) ← "تثبيت نما طيبة"'
                  )}
                </p>
              </div>

              {/* Chrome / Edge Mobile */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-primary" />
                  <p className="font-medium text-sm">{t('Chrome / Edge (Mobile)', 'كروم / إيدج (الجوال)')}</p>
                </div>
                <p className="text-sm text-muted-foreground ps-7">
                  {t(
                    'Tap the browser menu (⋮) → "Install app" or "Add to Home Screen"',
                    'اضغط على قائمة المتصفح (⋮) ← "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"'
                  )}
                </p>
              </div>

              {/* Safari iOS */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary" />
                  <p className="font-medium text-sm">{t('Safari (iPhone / iPad)', 'سفاري (آيفون / آيباد)')}</p>
                </div>
                <p className="text-sm text-muted-foreground ps-7">
                  {t(
                    'Tap the Share button (↑) → scroll down → "Add to Home Screen"',
                    'اضغط على زر المشاركة (↑) ← مرر للأسفل ← "إضافة إلى الشاشة الرئيسية"'
                  )}
                </p>
              </div>

              {/* Samsung Internet */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <p className="font-medium text-sm">{t('Samsung Internet', 'سامسونج إنترنت')}</p>
                </div>
                <p className="text-sm text-muted-foreground ps-7">
                  {t(
                    'Tap the menu (≡) → "Add page to" → "Home screen"',
                    'اضغط على القائمة (≡) ← "إضافة الصفحة إلى" ← "الشاشة الرئيسية"'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
