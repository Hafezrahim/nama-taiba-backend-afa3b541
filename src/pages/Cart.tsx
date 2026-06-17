
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import CartItemsList from '@/components/cart/CartItemsList';
import ClientInfoForm from '@/components/cart/ClientInfoForm';
import CartOrderSummary from '@/components/cart/CartOrderSummary';
import ShippingSelector from '@/components/cart/ShippingSelector';
import { generateInvoice } from '@/utils/invoiceGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const Cart = () => {
  const { t, isRTL, language } = useLanguage();
  const { user, userRole, loading: authLoading } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, getSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Check if user has client role (only clients can checkout)
  const isClientRole = userRole === 'client';
  const isRestrictedRole = userRole && userRole !== 'client';

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [shippingPrice, setShippingPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const total = subtotal + shippingPrice - discount;

  // Fetch user profile data if logged in as client
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !isClientRole) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name_en, full_name_ar, phone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile) {
          // Pre-fill form with user's profile data
          const name = language === 'ar' 
            ? (profile.full_name_ar || profile.full_name_en || '')
            : (profile.full_name_en || profile.full_name_ar || '');
          
          if (name && !clientName) setClientName(name);
          if (profile.phone && !clientPhone) setClientPhone(profile.phone);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user, isClientRole, language]);


  const handleCouponValidation = (code: string) => {
    if (code.toLowerCase() === 'discount10') {
      const discountAmount = subtotal * 0.1;
      setDiscount(discountAmount);
      toast({
        title: t('Coupon applied', 'تم تطبيق الكوبون'),
        description: t('10% discount applied', 'تم تطبيق خصم 10٪')
      });
    } else if (code.toLowerCase() === 'discount20') {
      const discountAmount = subtotal * 0.2;
      setDiscount(discountAmount);
      toast({
        title: t('Coupon applied', 'تم تطبيق الكوبون'),
        description: t('20% discount applied', 'تم تطبيق خصم 20٪')
      });
    } else {
      toast({
        title: t('Invalid coupon', 'كوبون غير صالح'),
        description: t('Please check and try again', 'يرجى التحقق والمحاولة مرة أخرى'),
        variant: 'destructive'
      });
    }
  };

  const handleDistrictChange = (districtId: string, price: number) => {
    setSelectedDistrictId(districtId);
    setShippingPrice(price);
  };

  const validateFormData = () => {
    // Check if user is a restricted role (admin, marketer, user) trying to checkout
    if (isRestrictedRole) {
      toast({
        title: t('Access Denied', 'الوصول مرفوض'),
        description: t(
          'Only clients can place orders. Please use a client account.',
          'يمكن للعملاء فقط تقديم الطلبات. يرجى استخدام حساب عميل.'
        ),
        variant: 'destructive'
      });
      return false;
    }

    if (!clientName || !clientPhone || !clientAddress) {
      toast({
        title: t('Missing information', 'معلومات ناقصة'),
        description: t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'),
        variant: 'destructive'
      });
      return false;
    }

    if (!selectedCityId || !selectedDistrictId) {
      toast({
        title: t('Missing delivery location', 'موقع التوصيل مفقود'),
        description: t('Please select your city and district', 'يرجى اختيار المدينة والحي'),
        variant: 'destructive'
      });
      return false;
    }
    
    if (cartItems.length === 0) {
      toast({
        title: t('Empty cart', 'سلة فارغة'),
        description: t('Please add items to your cart before checkout', 'الرجاء إضافة منتجات إلى سلة التسوق قبل إتمام الشراء'),
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const handleCheckout = async () => {
    if (!validateFormData()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const clientInfo = {
        name: clientName, 
        phone: clientPhone, 
        address: clientAddress
      };
      
      const totals = {
        subtotal, 
        shipping: shippingPrice, 
        discount, 
        vat: 0,
        total
      };
      
      // Save order to database
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: clientName,
          customer_phone: clientPhone,
          customer_address: clientAddress,
          status: 'pending',
          subtotal,
          shipping: shippingPrice,
          discount,
          total,
          user_id: currentUser?.id || null
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }
      
      // Save order items - product_id can be null if item.id is not a valid UUID
      const orderItems = cartItems.map(item => {
        // Check if item.id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidRegex.test(item.id);
        
        return {
          order_id: order.id,
          product_id: isValidUuid ? item.id : null,
          product_name_en: item.nameEn,
          product_name_ar: item.nameAr || item.nameEn,
          price: item.price,
          quantity: item.quantity
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }
      
      // Generate invoice PDF
      const { pdf } = await generateInvoice(cartItems, clientInfo, totals, { language });
      pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);
      
      // Prepare order details for confirmation page
      const orderDetailsForConfirmation = {
        orderId: order.id,
        customerName: clientName,
        customerPhone: clientPhone,
        customerAddress: clientAddress,
        items: cartItems.map(item => ({
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        shipping: shippingPrice,
        discount,
        total
      };
      
      clearCart();
      setClientName('');
      setClientPhone('');
      setClientAddress('');
      setSelectedCityId('');
      setSelectedDistrictId('');
      setShippingPrice(0);
      setDiscount(0);
      
      // Navigate to order confirmation page
      navigate('/order-confirmation', { state: { orderDetails: orderDetailsForConfirmation } });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('Checkout failed', 'فشل إتمام الشراء'),
        description: t('Please try again later', 'يرجى المحاولة مرة أخرى لاحقًا'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      <SEO
        titleEn="Shopping Cart - Nama Taiba"
        titleAr="سلة التسوق - نما طيبة"
        descriptionEn="Review your shopping cart and proceed to checkout. Free shipping on orders over 200 SAR."
        descriptionAr="راجع سلة التسوق الخاصة بك وأكمل عملية الشراء. شحن مجاني للطلبات فوق 200 ريال."
        keywords="shopping cart, checkout, buy, Nama Taiba, سلة التسوق, الدفع, شراء, نما طيبة"
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Role restriction warning */}
        {isRestrictedRole && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              {t(
                'You are logged in as ' + userRole + '. Only client accounts can place orders. Please sign out and use a client account to checkout.',
                'أنت مسجل الدخول كـ ' + userRole + '. يمكن لحسابات العملاء فقط تقديم الطلبات. يرجى تسجيل الخروج واستخدام حساب عميل للدفع.'
              )}
            </AlertDescription>
          </Alert>
        )}

        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-primary">
          {t('Shopping Cart', 'سلة التسوق')}
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium text-gray-600 mb-4">
              {t('Your cart is empty', 'سلة التسوق فارغة')}
            </h2>
            <p className="text-gray-500 mb-8">
              {t('Add items to your cart to see them here', 'أضف منتجات إلى سلة التسوق لتظهر هنا')}
            </p>
            <Link to="/products">
              <Button className="bg-nama-purple hover:bg-nama-gold">
                {t('Continue Shopping', 'مواصلة التسوق')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CartItemsList
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
              />

              <ClientInfoForm
                clientName={clientName}
                clientPhone={clientPhone}
                clientAddress={clientAddress}
                onNameChange={setClientName}
                onPhoneChange={setClientPhone}
                onAddressChange={setClientAddress}
              />

              <ShippingSelector
                selectedCityId={selectedCityId}
                selectedDistrictId={selectedDistrictId}
                onCityChange={setSelectedCityId}
                onDistrictChange={handleDistrictChange}
              />
            </div>
            
            <div>
              <CartOrderSummary
                cartItems={cartItems}
                subtotal={subtotal}
                shipping={shippingPrice}
                discount={discount}
                total={total}
                isProcessing={isProcessing}
                clientInfo={{
                  name: clientName,
                  phone: clientPhone,
                  address: clientAddress
                }}
                onCheckout={handleCheckout}
                onCouponApply={handleCouponValidation}
              />
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;
