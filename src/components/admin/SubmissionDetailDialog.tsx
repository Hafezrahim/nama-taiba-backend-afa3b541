import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DetailField {
  label: string;
  value?: string | null;
  dir?: 'ltr' | 'rtl';
  multiline?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: DetailField[];
  email?: string | null;
  phone?: string | null;
  defaultSubject?: string;
  children?: React.ReactNode;
}

const digitsOnly = (phone: string) => phone.replace(/[^\d]/g, '').replace(/^00/, '');

export default function SubmissionDetailDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  email,
  phone,
  defaultSubject = '',
  children,
}: Props) {
  const { t, isRTL } = useLanguage();
  const [subject, setSubject] = useState(defaultSubject);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setReply('');
    }
  }, [open, defaultSubject]);

  const sendEmail = () => {
    if (!email) return;
    const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reply)}`;
    window.open(url, '_blank', 'noopener');
  };

  const sendWhatsApp = () => {
    if (!phone) return;
    const url = `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(reply)}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className={f.multiline ? 'sm:col-span-2' : ''}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{f.label}</p>
              <p
                dir={f.dir}
                className={`text-sm ${f.multiline ? 'whitespace-pre-wrap rounded-md border bg-muted/40 p-3' : 'font-medium'}`}
              >
                {f.value || '-'}
              </p>
            </div>
          ))}
        </div>

        {children}

        <div className="space-y-3 border-t pt-4">
          <p className="font-semibold">{t('Reply', 'الرد')}</p>
          {email && (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('Subject', 'الموضوع')}
            />
          )}
          <Textarea
            rows={5}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t('Write your reply...', 'اكتب ردك...')}
          />
          <div className="flex flex-wrap gap-2">
            {email && (
              <Button onClick={sendEmail} disabled={!reply.trim()} className="gap-2">
                <Mail className="h-4 w-4" />
                {t('Reply by Email', 'الرد بالبريد')}
              </Button>
            )}
            {phone && (
              <Button variant="outline" onClick={sendWhatsApp} disabled={!reply.trim()} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('Reply on WhatsApp', 'الرد عبر واتساب')}
              </Button>
            )}
            {phone && (
              <Button variant="ghost" asChild className="gap-2">
                <a href={`tel:${digitsOnly(phone)}`}>
                  <Phone className="h-4 w-4" />
                  {t('Call', 'اتصال')}
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
