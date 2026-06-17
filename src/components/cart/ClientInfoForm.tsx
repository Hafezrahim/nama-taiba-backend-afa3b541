
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientInfoFormProps {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

const ClientInfoForm = ({
  clientName,
  clientPhone,
  clientAddress,
  onNameChange,
  onPhoneChange,
  onAddressChange,
}: ClientInfoFormProps) => {
  const { t } = useLanguage();

  return (
    <Card className="mt-4 sm:mt-8">
      <CardContent className="p-3 sm:p-6">
        <h2 className="font-bold text-xl mb-4">
          {t('Client Information', 'معلومات العميل')}
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t('Full Name', 'الاسم الكامل')} *</Label>
            <Input 
              id="name" 
              value={clientName} 
              onChange={(e) => onNameChange(e.target.value)} 
              placeholder={t('Enter your full name', 'أدخل اسمك الكامل')}
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">{t('Phone Number', 'رقم الهاتف')} *</Label>
            <Input 
              id="phone" 
              value={clientPhone} 
              onChange={(e) => onPhoneChange(e.target.value)} 
              placeholder={t('Enter your phone number', 'أدخل رقم هاتفك')}
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address">{t('Delivery Address', 'عنوان التوصيل')} *</Label>
            <Input 
              id="address" 
              value={clientAddress} 
              onChange={(e) => onAddressChange(e.target.value)} 
              placeholder={t('Enter your full address', 'أدخل عنوانك الكامل')}
              className="mt-1"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoForm;
