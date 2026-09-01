import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitContactForm } from '@/backend/contact';
import { Send, MessageSquare } from 'lucide-react';

const InstallContactForm = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      toast({
        title: t('Message too short', 'الرسالة قصيرة جداً'),
        description: t('Please write at least 10 characters.', 'يرجى كتابة 10 أحرف على الأقل.'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const result = await submitContactForm({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      subject: 'Install page inquiry',
      message: form.message,
    });
    setLoading(false);

    if (result.success) {
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      toast({
        title: t('Message sent', 'تم إرسال الرسالة'),
        description: t('We will get back to you shortly.', 'سنعاود التواصل معك قريباً.'),
      });
    } else {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Could not send your message. Please try again.', 'تعذر إرسال رسالتك. حاول مرة أخرى.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="bg-muted/40 border rounded-2xl p-6 text-start" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">{t('Send us an inquiry', 'أرسل لنا استفساراً')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {t(
          'Prefer not to use WhatsApp? Send your message here and our team will reply by email.',
          'لا تفضل استخدام واتساب؟ أرسل رسالتك هنا وسيرد فريقنا عبر البريد الإلكتروني.'
        )}
      </p>

      {sent ? (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-5 text-center space-y-2">
          <p className="font-semibold">{t('Thank you!', 'شكراً لك!')}</p>
          <p className="text-sm opacity-80">
            {t('Your inquiry has been received.', 'تم استلام استفسارك.')}
          </p>
          <Button variant="outline" size="sm" onClick={() => setSent(false)}>
            {t('Send another message', 'إرسال رسالة أخرى')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="install-name">{t('Name', 'الاسم')} *</Label>
              <Input
                id="install-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('Your name', 'اسمك')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="install-email">{t('Email', 'البريد الإلكتروني')} *</Label>
              <Input
                id="install-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="install-phone">{t('Phone (optional)', 'الهاتف (اختياري)')}</Label>
            <Input
              id="install-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+966 5X XXX XXXX"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="install-message">{t('Message', 'الرسالة')} *</Label>
            <Textarea
              id="install-message"
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t('How can we help you?', 'كيف يمكننا مساعدتك؟')}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {loading ? t('Sending...', 'جارٍ الإرسال...') : t('Send Inquiry', 'إرسال الاستفسار')}
          </Button>
        </form>
      )}
    </section>
  );
};

export default InstallContactForm;
