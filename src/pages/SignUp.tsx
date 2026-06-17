
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
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  role: z.enum(['client', 'user', 'marketer'], { required_error: 'Please select a role' })
});

type SignUpRole = 'client' | 'user' | 'marketer';

const SignUp = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'client' as SignUpRole
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      const validated = signupSchema.parse(formData);

      // Sign up the user
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.fullName
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      // Determine if role needs approval
      const needsApproval = validated.role === 'user' || validated.role === 'marketer';
      
      // Insert user role with approval status
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: validated.role,
          is_approved: !needsApproval // Clients are auto-approved
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw new Error('Failed to assign role');
      }

      // Show appropriate success message
      if (needsApproval) {
        toast({
          title: t('Registration Submitted', 'تم إرسال التسجيل'),
          description: t(
            'Your account has been created and is pending admin approval. You will be notified once approved.',
            'تم إنشاء حسابك وهو في انتظار موافقة المسؤول. سيتم إخطارك بمجرد الموافقة.'
          )
        });
      } else {
        toast({
          title: t('Success!', 'نجح!'),
          description: t('Account created successfully!', 'تم إنشاء الحساب بنجاح!')
        });
      }

      // Redirect to login
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
      value: 'user' as SignUpRole,
      label: t('User', 'مستخدم'),
      description: t('Access user features (requires approval)', 'الوصول إلى ميزات المستخدم (يتطلب الموافقة)')
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
                <img 
                  src="/uploads/logo.png" 
                  alt="Nama Taiba Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <CardTitle className="text-2xl text-center">
                {t('Create Account', 'إنشاء حساب')}
              </CardTitle>
              <CardDescription className="text-center">
                {t('Sign up to get started', 'سجل للبدء')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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

                <div className="space-y-2">
                  <Label htmlFor="password">{t('Password', 'كلمة المرور')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('Enter your password', 'أدخل كلمة المرور')}
                    required
                    disabled={loading}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t('Account Type', 'نوع الحساب')}</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as SignUpRole })}
                    disabled={loading}
                  >
                    {roleOptions.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3 space-x-reverse">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label
                          htmlFor={option.value}
                          className="flex flex-col cursor-pointer"
                        >
                          <span className="font-semibold">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{option.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
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
