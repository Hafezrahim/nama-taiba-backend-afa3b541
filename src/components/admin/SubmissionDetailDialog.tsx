import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageCircle, Phone, Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface DetailField {
  label: string;
  value?: string | null;
  dir?: 'ltr' | 'rtl';
  multiline?: boolean;
}

export type SubmissionType = 'marketer_application' | 'contact_submission' | 'quote_request';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: DetailField[];
  email?: string | null;
  phone?: string | null;
  defaultSubject?: string;
  submissionType?: SubmissionType;
  submissionId?: string;
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
  submissionType,
  submissionId,
  children,
}: Props) {
  const { t, isRTL, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(defaultSubject);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState<'email' | 'whatsapp' | null>(null);

  const canLog = Boolean(submissionType && submissionId);

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setReply('');
    }
  }, [open, defaultSubject]);

  const { data: history } = useQuery({
    queryKey: ['submission-replies', submissionType, submissionId],
    enabled: open && canLog,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submission_replies')
        .select('id, channel, subject, message, status, created_at')
        .eq('submission_type', submissionType!)
        .eq('submission_id', submissionId!)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const openFallback = (channel: 'email' | 'whatsapp') => {
    if (channel === 'email' && email) {
      window.open(
        `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reply)}`,
        '_blank',
        'noopener',
      );
    }
    if (channel === 'whatsapp' && phone) {
      window.open(`https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(reply)}`, '_blank', 'noopener');
    }
  };

  const send = async (channel: 'email' | 'whatsapp') => {
    const recipient = channel === 'email' ? email : phone;
    if (!recipient || !reply.trim()) return;

    if (!canLog) {
      openFallback(channel);
      return;
    }

    setSending(channel);
    try {
      const { data, error } = await supabase.functions.invoke('send-reply', {
        body: {
          submission_type: submissionType,
          submission_id: submissionId,
          channel,
          recipient,
          subject: channel === 'email' ? subject : undefined,
          message: reply,
        },
      });

      const result = (data ?? {}) as { status?: string; provider_configured?: boolean; error?: string };

      if (!error && result.status === 'sent') {
        toast({
          title: t('Reply sent', 'تم إرسال الرد'),
          description:
            channel === 'email'
              ? t('The email was delivered to the sender.', 'تم إرسال البريد إلى المرسل.')
              : t('The WhatsApp message was delivered.', 'تم إرسال رسالة واتساب.'),
        });
        setReply('');
        queryClient.invalidateQueries({ queryKey: ['submission-replies', submissionType, submissionId] });
        return;
      }

      // Service not connected yet, or the provider refused — fall back to opening the app.
      toast({
        title: t('Sending service not ready', 'خدمة الإرسال غير جاهزة'),
        description:
          channel === 'email'
            ? t('Opening your mail app instead.', 'سيتم فتح تطبيق البريد بدلاً من ذلك.')
            : t('Opening WhatsApp instead.', 'سيتم فتح واتساب بدلاً من ذلك.'),
        variant: 'destructive',
      });
      openFallback(channel);
    } catch {
      openFallback(channel);
    } finally {
      setSending(null);
    }
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
              <Button onClick={() => send('email')} disabled={!reply.trim() || sending !== null} className="gap-2">
                {sending === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {t('Send Email Reply', 'إرسال رد بالبريد')}
              </Button>
            )}
            {phone && (
              <Button
                variant="outline"
                onClick={() => send('whatsapp')}
                disabled={!reply.trim() || sending !== null}
                className="gap-2"
              >
                {sending === 'whatsapp' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                {t('Send on WhatsApp', 'إرسال عبر واتساب')}
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

          {canLog && history && history.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" />
                {t('Previous replies', 'الردود السابقة')}
              </p>
              {history.map((h: any) => (
                <div key={h.id} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {h.channel === 'email' ? t('Email', 'بريد') : t('WhatsApp', 'واتساب')}
                    </Badge>
                    <Badge variant={h.status === 'sent' ? 'default' : 'destructive'}>
                      {h.status === 'sent' ? t('Sent', 'أُرسل') : t('Not sent', 'لم يُرسل')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-GB')}
                    </span>
                  </div>
                  {h.subject && <p className="font-medium">{h.subject}</p>}
                  <p className="whitespace-pre-wrap text-muted-foreground">{h.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
