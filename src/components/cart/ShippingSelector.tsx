
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';

interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

interface District {
  id: string;
  city_id: string;
  name_ar: string;
  name_en: string;
  shipping_price: number;
}

interface ShippingSelectorProps {
  selectedCityId: string;
  selectedDistrictId: string;
  onCityChange: (cityId: string) => void;
  onDistrictChange: (districtId: string, shippingPrice: number) => void;
}

const ShippingSelector = ({
  selectedCityId,
  selectedDistrictId,
  onCityChange,
  onDistrictChange
}: ShippingSelectorProps) => {
  const { t, language } = useLanguage();

  const { data: cities } = useQuery({
    queryKey: ['active-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as City[];
    }
  });

  const { data: districts } = useQuery({
    queryKey: ['districts-by-city', selectedCityId],
    queryFn: async () => {
      if (!selectedCityId) return [];
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('city_id', selectedCityId)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as District[];
    },
    enabled: !!selectedCityId
  });

  const selectedDistrict = districts?.find(d => d.id === selectedDistrictId);

  const handleCityChange = (cityId: string) => {
    onCityChange(cityId);
    onDistrictChange('', 0);
  };

  const handleDistrictChange = (districtId: string) => {
    const district = districts?.find(d => d.id === districtId);
    onDistrictChange(districtId, district?.shipping_price || 0);
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-3 sm:p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {t('Delivery Location', 'موقع التوصيل')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>{t('City', 'المدينة')} *</Label>
            <Select value={selectedCityId} onValueChange={handleCityChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('Select city', 'اختر المدينة')} />
              </SelectTrigger>
              <SelectContent>
                {cities?.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {language === 'ar' ? city.name_ar : city.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('District', 'الحي')} *</Label>
            <Select 
              value={selectedDistrictId} 
              onValueChange={handleDistrictChange}
              disabled={!selectedCityId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('Select district', 'اختر الحي')} />
              </SelectTrigger>
              <SelectContent>
                {districts?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {language === 'ar' ? district.name_ar : district.name_en} - {district.shipping_price.toFixed(2)} {t('SAR', 'ر.س')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDistrict && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('Shipping Cost', 'تكلفة التوصيل')}:
                </span>
                <span className="font-bold text-primary">
                  {selectedDistrict.shipping_price.toFixed(2)} {t('SAR', 'ر.س')}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingSelector;
