import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { submitMarketerApplication } from '@/backend/marketerApplications';
import { useToast } from '@/hooks/use-toast';
import { Briefcase } from 'lucide-react';

const saudiCities = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 
  'الطائف', 'تبوك', 'بريدة', 'خميس مشيط', 'حائل', 'نجران', 'جازان', 'ينبع', 
  'الأحساء', 'القطيف', 'أبها', 'عرعر', 'سكاكا', 'الباحة', 'الجبيل'
];

export const MarketerApplicationForm = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    total_experience: '',
    message: ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: t('Invalid File Type', 'نوع الملف غير صالح'),
          description: t('Please upload PDF, JPG, or PNG only', 'يرجى تحميل PDF أو JPG أو PNG فقط'),
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: t('File Too Large', 'الملف كبير جداً'),
          description: t('File size must be less than 5MB', 'يجب أن يكون حجم الملف أقل من 5 ميجابايت'),
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      setCvFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let cvData = {};
      if (cvFile) {
        const base64 = await fileToBase64(cvFile);
        cvData = {
          cv_file_name: cvFile.name,
          cv_file_data: base64,
          cv_file_type: cvFile.type
        };
      }

      const result = await submitMarketerApplication({
        ...formData,
        ...cvData
      });

      if (result.success) {
        toast({
          title: t('Application Submitted', 'تم إرسال الطلب'),
          description: t('We will contact you soon', 'سنتواصل معك قريباً')
        });
        setFormData({ name: '', phone: '', city: '', total_experience: '', message: '' });
        setCvFile(null);
        setOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to submit application', 'فشل إرسال الطلب'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-nama-gold hover:bg-nama-orange text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 font-semibold"
          size="lg"
        >
          <Briefcase className="h-5 w-5" />
          {t('Become a Marketer', 'مندوب المبيعات')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
            {t('Become a Sales Representative', 'انضم كمندوب مبيعات')}
          </DialogTitle>
          <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
            {t('Fill out the form below to apply', 'املأ النموذج أدناه للتقديم')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('Name', 'الاسم')} *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('Enter your name', 'أدخل اسمك')}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t('Phone', 'الهاتف')} *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('Enter your phone', 'أدخل هاتفك')}
            />
          </div>

          <div>
            <Label htmlFor="city">{t('City', 'المدينة')} *</Label>
            <Select required value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select city', 'اختر المدينة')} />
              </SelectTrigger>
              <SelectContent>
                {saudiCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience">{t('Total Experience', 'إجمالي الخبرة')} *</Label>
            <Input
              id="experience"
              required
              value={formData.total_experience}
              onChange={(e) => setFormData({ ...formData, total_experience: e.target.value })}
              placeholder={t('e.g., 3 years', 'مثال: 3 سنوات')}
            />
          </div>

          <div>
            <Label htmlFor="cv">{t('Upload CV', 'تحميل السيرة الذاتية')} (PDF, JPG, PNG)</Label>
            <Input
              id="cv"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {cvFile && (
              <p className="text-xs text-muted-foreground mt-1">
                {cvFile.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message">{t('Message', 'رسالة')}</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t('Additional information', 'معلومات إضافية')}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('Submitting...', 'جارٍ الإرسال...') : t('Submit Application', 'إرسال الطلب')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
