import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

const AddReviewForm = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = (formData.get('name') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const position = (formData.get('position') as string)?.trim() || '';

    if (!name || !content) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('testimonials').insert([{
        name_en: language === 'en' ? name : name,
        name_ar: language === 'ar' ? name : name,
        position_en: language === 'en' ? position : position,
        position_ar: language === 'ar' ? position : position,
        content_en: language === 'en' ? content : content,
        content_ar: language === 'ar' ? content : content,
        rating,
        is_approved: false,
        is_featured: false,
      }]);

      if (error) throw error;

      toast.success(t(
        'Thank you! Your review has been submitted and will appear after admin approval.',
        'شكراً لك! تم إرسال مراجعتك وستظهر بعد موافقة المسؤول.'
      ));
      setOpen(false);
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('Failed to submit review', 'فشل في إرسال المراجعة'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          {t('Add Your Review', 'أضف مراجعتك')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Share Your Experience', 'شارك تجربتك')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('Your Name', 'اسمك')} *</Label>
            <Input name="name" required maxLength={100} />
          </div>

          <div>
            <Label>{t('Position / Company', 'المنصب / الشركة')}</Label>
            <Input name="position" maxLength={100} />
          </div>

          <div>
            <Label>{t('Your Review', 'مراجعتك')} *</Label>
            <Textarea name="content" required rows={4} maxLength={500} />
          </div>

          <div>
            <Label>{t('Rating', 'التقييم')}</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t(
              '* Your review will be visible after admin approval.',
              '* ستظهر مراجعتك بعد موافقة المسؤول.'
            )}
          </p>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? t('Submitting...', 'جاري الإرسال...')
              : t('Submit Review', 'إرسال المراجعة')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReviewForm;
