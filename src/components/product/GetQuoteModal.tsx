import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface GetQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function GetQuoteModal({ isOpen, onClose, productName }: GetQuoteModalProps) {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    quantity: 1,
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('quote_requests')
        .insert({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          quantity: formData.quantity,
          message: `Product: ${productName}\nLocation: ${formData.location}`,
          is_processed: false
        });

      if (error) throw error;

      toast.success(t('Quote request sent successfully', 'تم إرسال طلب عرض السعر بنجاح'));
      onClose();
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        quantity: 1,
        location: ''
      });
    } catch (error: any) {
      toast.error(error.message || t('Failed to send request', 'فشل إرسال الطلب'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('Get a Quote', 'طلب عرض سعر')}</DialogTitle>
          <DialogDescription>
            {t('Please fill out the form below to request a quote for', 'يرجى ملء النموذج أدناه لطلب عرض سعر لـ')} <span className="font-semibold text-nama-purple">{productName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('Product', 'المنتج')}</Label>
            <Input readOnly value={productName} className="bg-gray-50 text-gray-600 cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <Label>{t('Full Name', 'الاسم الكامل')} *</Label>
            <Input required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Phone', 'رقم الهاتف')} *</Label>
              <Input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Quantity', 'الكمية')} *</Label>
              <Input required type="number" min={1} value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t('Email', 'البريد الإلكتروني')} *</Label>
            <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <Label>{t('Full Location', 'الموقع الكامل')} *</Label>
            <Textarea required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder={t('City, District, Street...', 'المدينة، الحي، الشارع...')} />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-nama-purple hover:bg-nama-gold text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Send Request', 'إرسال الطلب')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
