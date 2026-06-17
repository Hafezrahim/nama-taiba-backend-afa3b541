import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, Phone, MapPin, User } from 'lucide-react';

interface OrderItem {
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
}

const OrderConfirmation = () => {
  const { t, isRTL, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!orderDetails) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('Order Confirmed!', 'تم تأكيد الطلب!')}
            </h1>
            <p className="text-muted-foreground">
              {t('Thank you for your order. We will contact you soon.', 'شكراً لطلبك. سنتواصل معك قريباً.')}
            </p>
          </div>

          {/* Order ID */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5" />
                {t('Order Number', 'رقم الطلب')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-primary">
                #{orderDetails.orderId.slice(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {t('Customer Information', 'معلومات العميل')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>{orderDetails.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span dir="ltr">{orderDetails.customerPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span>{orderDetails.customerAddress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {t('Order Items', 'عناصر الطلب')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? item.nameEn : item.nameAr}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('Qty:', 'الكمية:')} {item.quantity} × {item.price.toFixed(2)} {t('SAR', 'ر.س')}
                      </p>
                    </div>
                    <p className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} {t('SAR', 'ر.س')}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Subtotal', 'المجموع الفرعي')}</span>
                  <span>{orderDetails.subtotal.toFixed(2)} {t('SAR', 'ر.س')}</span>
                </div>
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('Discount', 'الخصم')}</span>
                    <span>-{orderDetails.discount.toFixed(2)} {t('SAR', 'ر.س')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('Total', 'الإجمالي')}</span>
                  <span className="text-primary">{orderDetails.total.toFixed(2)} {t('SAR', 'ر.س')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button variant="outline" className="w-full sm:w-auto">
                {t('Continue Shopping', 'مواصلة التسوق')}
              </Button>
            </Link>
            <Link to="/">
              <Button className="w-full sm:w-auto">
                {t('Back to Home', 'العودة للرئيسية')}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;