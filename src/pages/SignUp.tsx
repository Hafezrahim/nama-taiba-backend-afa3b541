
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().min(7, 'Phone number is too short').max(20),
  city: z.string().trim().min(2, 'City is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string(),
  role: z.enum(['client', 'user', 'marketer'], { required_error: 'Please select a role' })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type SignUpRole = 'client' | 'user' | 'marketer';

const SignUp = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    role: 'client' as SignUpRole
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const validated = signupSchema.parse(formData);

      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.fullName,
            phone: validated.phone,
            city: validated.city,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      const needsApproval = validated.role === 'user' || validated.role === 'marketer';
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: validated.role,
          is_approved: !needsApproval
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw new Error('Failed to assign role');
      }

      if (needsApproval) {
        toast({
          title: t('Registration Submitted', 'تم إرسال التسجيل'),
          description: t(
            'Your account has been created and is pending admin approval.',
            'تم إنشاء حسابك وهو في انتظار موافقة المسؤول.'
          )
        });
      } else {
        toast({
          title: t('Success!', 'نجح!'),
          description: t('Account created successfully!', 'تم إنشاء الحساب بنجاح!')
        });
      }

      setTimeout(() => navigate('/login'), 2000);
      
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err.message?.includes('already registered')) {
        setError(t('This email is already registered', 'هذا البريد الإلكتروني مسجل بالفعل'));
      } else {
        setError(err.message || t('Failed to create account', 'فشل إنشاء الحساب'));
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'client' as SignUpRole,
      label: t('Client', 'عميل'),
      description: t('Browse and purchase products', 'تصفح وشراء المنتجات')
    },
    {
      value: 'marketer' as SignUpRole,
      label: t('Marketer', 'مسوق'),
      description: t('Marketing opportunities (requires approval)', 'فرص التسويق (يتطلب الموافقة)')
    }
  ];

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        titleEn="Create Account - Nama Taiba"
        titleAr="إنشاء حساب - نما طيبة"
        descriptionEn="Create your Nama Taiba account to start shopping, save favorites, and get exclusive offers."
        descriptionAr="أنشئ حسابك في نما طيبة لبدء التسوق وحفظ المفضلة والحصول على عروض حصرية."
        keywords="sign up, register, create account, Nama Taiba, تسجيل, إنشاء حساب, نما طيبة"
      />
      <Header />
      
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader>
              <div className="w-28 h-28 mx-auto mb-4">
                <img src="/uploads/logo.png" alt="Nama Taiba Logo" className="w-full h-full object-contain" />
              </div>
              <CardTitle className="text-2xl text-center">{t('Create Account', 'إنشاء حساب')}</CardTitle>
              <CardDescription className="text-center">{t('Sign up to get started', 'سجل للبدء')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('Full Name', 'الاسم الكامل')}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={t('Enter your full name', 'أدخل اسمك الكامل')}
                    required
                    disabled={loading}
                    maxLength={100}
                  />
                </div>

                {/* Phone & City side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('Phone', 'رقم الهاتف')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t('05xxxxxxxx', '05xxxxxxxx')}
                      required
                      disabled={loading}
                      maxLength={20}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('City', 'المدينة')}</Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={t('Your city', 'مدينتك')}
                      required
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('Enter your email', 'أدخل بريدك الإلكتروني')}
                    required
                    disabled={loading}
                    maxLength={255}
                  />
                </div>

                {/* Password with eye icon */}
                <div className="space-y-2">
                  <Label htmlFor="password">{t('Password', 'كلمة المرور')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('At least 6 characters', '6 أحرف على الأقل')}
                      required
                      disabled={loading}
                      maxLength={100}
                      className={isRTL ? 'pl-10 pr-3' : 'pr-10 pl-3'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center text-muted-foreground hover:text-foreground transition-colors`}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password with eye icon */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('Confirm Password', 'تأكيد كلمة المرور')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder={t('Re-enter your password', 'أعد إدخال كلمة المرور')}
                      required
                      disabled={loading}
                      maxLength={100}
                      className={isRTL ? 'pl-10 pr-3' : 'pr-10 pl-3'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center text-muted-foreground hover:text-foreground transition-colors`}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Account Type */}
                <div className="space-y-3">
                  <Label>{t('Account Type', 'نوع الحساب')}</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as SignUpRole })}
                    disabled={loading}
                    className="space-y-2"
                  >
                    {roleOptions.map((option) => (
                      <label
                        key={option.value}
                        htmlFor={option.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                          formData.role === option.value ? 'border-nama-purple bg-nama-purple/5' : ''
                        } ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('Creating Account...', 'جاري إنشاء الحساب...') : t('Sign Up', 'إنشاء حساب')}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    {t('Already have an account?', 'هل لديك حساب بالفعل؟')}{' '}
                  </span>
                  <Link to="/login" className="text-primary hover:underline">
                    {t('Sign In', 'تسجيل الدخول')}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignUp;
