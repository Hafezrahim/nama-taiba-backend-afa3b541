
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ClientInformationFormProps {
  clientInfo: {
    name: string;
    phone: string;
    address: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

const ClientInformationForm = ({
  clientInfo,
  onFieldChange
}: ClientInformationFormProps) => {
  const { t } = useLanguage();

  return (
    <>
      <div>
        <Label htmlFor="name">{t('Full Name', 'الاسم الكامل')} *</Label>
        <Input
          id="name"
          value={clientInfo.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder={t('Enter your full name', 'أدخل اسمك الكامل')}
          className="mt-1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone">{t('Phone Number', 'رقم الهاتف')} *</Label>
        <Input
          id="phone"
          value={clientInfo.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          placeholder={t('Enter your phone number', 'أدخل رقم هاتفك')}
          className="mt-1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="address">{t('Address', 'العنوان')} *</Label>
        <Input
          id="address"
          value={clientInfo.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          placeholder={t('Enter your address', 'أدخل عنوانك')}
          className="mt-1"
          required
        />
      </div>
    </>
  );
};

export default ClientInformationForm;
