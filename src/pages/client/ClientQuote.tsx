import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, MapPin, Phone, Mail, User,
  Building2, CheckCircle, ChevronRight, ChevronLeft, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string | null;
  category: string | null;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  unit: string;
}

const UNITS = ['Ton', 'Kg', 'Bag', 'Pallet', 'Piece', 'Box', 'طن', 'كغ', 'كيس', 'طبلية', 'قطعة', 'صندوق'];

const STEPS = [
  { id: 1, nameEn: 'Select Products', nameAr: 'اختر المنتجات' },
  { id: 2, nameEn: 'Set Quantities', nameAr: 'حدد الكميات' },
  { id: 3, nameEn: 'Location & Contact', nameAr: 'الموقع والتواصل' },
  { id: 4, nameEn: 'Confirmation', nameAr: 'التأكيد' },
];

const ClientQuote = () => {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [contact, setContact] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    company: '',
    location: '',
    city: '',
    notes: '',
  });

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) setContact(c => ({ ...c, email: user.email! }));
  }, [user]);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-quote'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name_en, name_ar, price, image, category')
        .eq('is_active', true)
        .order('name_en');
      return (data || []) as Product[];
    },
  });

  // Unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      !search ||
      p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToQuote = (product: Product) => {
    setQuoteItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev; // Already added
      return [...prev, { product, quantity: 1, unit: 'Ton' }];
    });
  };

  const removeFromQuote = (productId: string) => {
    setQuoteItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setQuoteItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const updateUnit = (productId: string, unit: string) => {
    setQuoteItems(prev => prev.map(i => i.product.id === productId ? { ...i, unit } : i));
  };

  const isInQuote = (productId: string) => quoteItems.some(i => i.product.id === productId);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Build a structured message
      const itemLines = quoteItems.map(
        (i, idx) =>
          `${idx + 1}. Product: ${i.product.name_en} (${i.product.name_ar})\n   Quantity: ${i.quantity} ${i.unit}`
      ).join('\n');

      const message =
        `=== QUOTE REQUEST ===\n\n` +
        `ITEMS REQUESTED:\n${itemLines}\n\n` +
        `DELIVERY LOCATION: ${contact.location}, ${contact.city}\n\n` +
        `NOTES: ${contact.notes || 'None'}`;

      const { error } = await supabase.from('quote_requests').insert({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company || null,
        message,
        quantity: quoteItems.reduce((sum, i) => sum + i.quantity, 0),
        is_processed: false,
      });

      if (error) throw error;
      setSubmitted(true);
      setStep(4);
      toast({ title: t('Quote Submitted!', 'تم إرسال طلب العرض!'), description: t('We will contact you shortly.', 'سنتواصل معك قريباً.') });
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setQuoteItems([]);
    setContact({ name: '', email: user?.email || '', phone: '', company: '', location: '', city: '', notes: '' });
    setSubmitted(false);
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">{t('Request a Quotation', 'طلب عرض سعر')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('Select your products, set quantities, provide your location and we\'ll send you a quote.', 'اختر المنتجات، حدد الكميات، وأدخل موقعك وسنرسل لك عرض السعر.')}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center shrink-0">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                step === s.id ? 'bg-primary text-primary-foreground' :
                step > s.id ? 'bg-emerald-100 text-emerald-700' :
                'bg-muted text-muted-foreground'
              )}
            >
              {step > s.id ? <CheckCircle className="h-4 w-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">{s.id}</span>}
              <span className="hidden sm:inline">{language === 'ar' ? s.nameAr : s.nameEn}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('w-8 h-0.5 mx-1', step > s.id ? 'bg-emerald-400' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* ---- STEP 1: Product Picker ---- */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Cart badge */}
          {quoteItems.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {quoteItems.length} {t('product(s) added to quote', 'منتج(ات) أضيف للعرض')}
              </span>
              <Button size="sm" className="ms-auto" onClick={() => setStep(2)}>
                {t('Continue', 'متابعة')} <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            </div>
          )}

          {/* Search + category filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={t('Search products...', 'ابحث عن منتج...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {cat === 'all' ? t('All', 'الكل') : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">{t('No products found', 'لا توجد منتجات')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const inQuote = isInQuote(product.id);
                return (
                  <Card
                    key={product.id}
                    className={cn('overflow-hidden transition-all hover:shadow-md', inQuote && 'ring-2 ring-primary')}
                  >
                    {product.image && (
                      <div className="aspect-[3/2] overflow-hidden bg-muted">
                        <img src={product.image} alt={product.name_en} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">
                        {language === 'ar' ? product.name_ar : product.name_en}
                      </h3>
                      {product.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">{product.category}</Badge>
                      )}
                      <Button
                        size="sm"
                        variant={inQuote ? 'secondary' : 'default'}
                        className="w-full mt-3 gap-2"
                        onClick={() => inQuote ? removeFromQuote(product.id) : addToQuote(product)}
                      >
                        {inQuote ? (
                          <><CheckCircle className="h-4 w-4" /> {t('Added', 'مضاف')}</>
                        ) : (
                          <><Plus className="h-4 w-4" /> {t('Add to Quote', 'أضف للعرض')}</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {quoteItems.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="gap-2">
                {t('Next: Set Quantities', 'التالي: حدد الكميات')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---- STEP 2: Quantities ---- */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('Set the quantity and unit for each product.', 'حدد الكمية والوحدة لكل منتج.')}
          </p>

          {quoteItems.map(item => (
            <Card key={item.product.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Product info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.product.image ? (
                      <img src={item.product.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {language === 'ar' ? item.product.name_ar : item.product.name_en}
                      </p>
                      {item.product.category && (
                        <Badge variant="secondary" className="text-xs">{item.product.category}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="px-3 py-2 hover:bg-muted transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border-x py-2 text-sm font-semibold bg-background focus:outline-none"
                      />
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Unit picker */}
                    <select
                      value={item.unit}
                      onChange={e => updateUnit(item.product.id, e.target.value)}
                      className="border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>

                    <button
                      onClick={() => removeFromQuote(item.product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> {t('Back', 'رجوع')}
            </Button>
            <Button onClick={() => setStep(3)} className="gap-2" disabled={quoteItems.length === 0}>
              {t('Next: Location & Contact', 'التالي: الموقع والتواصل')} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- STEP 3: Location & Contact ---- */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {t('Contact Information', 'معلومات التواصل')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('Full Name', 'الاسم الكامل')} <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      value={contact.name}
                      onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                      placeholder={t('Your full name', 'اسمك الكامل')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('Email Address', 'البريد الإلكتروني')} <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      type="email"
                      value={contact.email}
                      onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      placeholder="you@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('Phone Number', 'رقم الهاتف')} <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      type="tel"
                      value={contact.phone}
                      onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                      placeholder="+966 50 000 0000"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('Company / Organization', 'الشركة / المؤسسة')}</Label>
                  <div className="relative">
                    <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      value={contact.company}
                      onChange={e => setContact(c => ({ ...c, company: e.target.value }))}
                      placeholder={t('Optional', 'اختياري')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                {t('Delivery Location', 'موقع التسليم')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('City', 'المدينة')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={contact.city}
                    onChange={e => setContact(c => ({ ...c, city: e.target.value }))}
                    placeholder={t('e.g. Riyadh, Jeddah...', 'مثال: الرياض، جدة...')}
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label>{t('Delivery Address / District', 'عنوان التسليم / الحي')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={contact.location}
                    onChange={e => setContact(c => ({ ...c, location: e.target.value }))}
                    placeholder={t('Street, district or landmark', 'الشارع، الحي، أو معلم قريب')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('Additional Notes', 'ملاحظات إضافية')}</Label>
                <Textarea
                  value={contact.notes}
                  onChange={e => setContact(c => ({ ...c, notes: e.target.value }))}
                  placeholder={t('Delivery time preference, special requirements, etc.', 'وقت التسليم المفضل، متطلبات خاصة، إلخ.')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> {t('Back', 'رجوع')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!contact.name || !contact.email || !contact.phone || !contact.city || !contact.location || submitting}
              className="gap-2"
            >
              {submitting ? t('Submitting...', 'جاري الإرسال...') : t('Submit Quote Request', 'إرسال طلب العرض')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- STEP 4: Success ---- */}
      {step === 4 && submitted && (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('Quote Request Sent!', 'تم إرسال طلب العرض!')}</h2>
            <p className="text-muted-foreground mb-2">
              {t('Thank you,', 'شكراً,')} <strong>{contact.name}</strong>!
            </p>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t(
                'We received your quote request for ' + quoteItems.length + ' product(s). Our team will review it and contact you via email or phone within 24 hours.',
                'استلمنا طلب عرض السعر الخاص بك لـ ' + quoteItems.length + ' منتج/منتجات. سيقوم فريقنا بمراجعته والتواصل معك عبر البريد الإلكتروني أو الهاتف خلال 24 ساعة.'
              )}
            </p>

            {/* Summary */}
            <div className="bg-muted/30 border rounded-xl p-4 max-w-md mx-auto text-start mb-8">
              <h3 className="font-semibold mb-3 text-sm">{t('Request Summary', 'ملخص الطلب')}</h3>
              <div className="space-y-2">
                {quoteItems.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{language === 'ar' ? item.product.name_ar : item.product.name_en}</span>
                    <span className="font-medium text-primary">{item.quantity} {item.unit}</span>
                  </div>
                ))}
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  <div>{t('Delivery to:', 'التسليم إلى:')} <strong>{contact.city}, {contact.location}</strong></div>
                  <div>{t('Contact:', 'تواصل:')} <strong>{contact.phone}</strong></div>
                </div>
              </div>
            </div>

            <Button onClick={resetForm} variant="outline">
              {t('Submit Another Quote', 'إرسال طلب آخر')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientQuote;
