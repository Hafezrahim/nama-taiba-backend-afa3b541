
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Clock, LogOut, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const Login = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, isApproved, loading: authLoading, signOut, allowedPages } = useAuth();
  
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isApproved && allowedPages.length > 0) {
        navigate('/admin');
      } else if (isApproved) {
        navigate('/');
      }
    }
  }, [user, isAdmin, isApproved, authLoading, navigate, allowedPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const validated = loginSchema.parse({ email, password });

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', validated.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('Failed to sign in');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, is_approved')
        .eq('user_id', data.user.id)
        .single();

      if (!roleData) {
        throw new Error('User role not found');
      }

      toast({
        title: t('Login successful', 'تم تسجيل الدخول بنجاح'),
        description: t('Welcome back!', 'مرحبًا بعودتك!')
      });

      if (roleData.role === 'admin') {
        navigate('/admin');
      } else if (roleData.is_approved === true) {
        const { data: perms } = await supabase
          .from('user_page_permissions')
          .select('page_path')
          .eq('user_id', data.user.id)
          .limit(1);
        
        if (perms && perms.length > 0) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }

    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err.message?.includes('Invalid login credentials')) {
        setError(t('Invalid email or password', 'البريد الإلكتروني أو كلمة المرور غير صحيحة'));
      } else {
        setError(err.message || t('Login failed', 'فشل تسجيل الدخول'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show pending approval message for logged-in but unapproved users
  if (user && !isAdmin && !isApproved) {
    return (
      <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">
                {t('Account Pending Approval', 'الحساب في انتظار الموافقة')}
              </CardTitle>
              <CardDescription>
                {t('Your account is currently under review', 'حسابك قيد المراجعة حالياً')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {t(
                    'Your account has been created successfully and is awaiting admin approval. You will receive a notification once your account has been approved.',
                    'تم إنشاء حسابك بنجاح وهو في انتظار موافقة المسؤول. ستتلقى إشعاراً بمجرد الموافقة على حسابك.'
                  )}
                </AlertDescription>
              </Alert>
              <div className="text-center text-sm text-muted-foreground">
                {t(
                  'This usually takes 24-48 hours. Thank you for your patience.',
                  'عادة ما يستغرق هذا 24-48 ساعة. شكراً لصبرك.'
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {t('Sign out and try another account', 'تسجيل الخروج وتجربة حساب آخر')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      <SEO
        titleEn="Sign In - Nama Taiba"
        titleAr="تسجيل الدخول - نما طيبة"
        descriptionEn="Sign in to your Nama Taiba account to access your orders, wishlist, and exclusive offers."
        descriptionAr="سجل الدخول إلى حسابك في نما طيبة للوصول إلى طلباتك والمفضلة والعروض الحصرية."
        keywords="login, sign in, account, Nama Taiba, تسجيل الدخول, حساب, نما طيبة"
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 items-center text-center">
            <div className="w-36 h-36 mx-auto mb-4">
              <img 
                src="/uploads/logo.png" 
                alt="Nama Taiba Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <CardTitle className="text-2xl text-nama-purple">
              {t('Sign In', 'تسجيل الدخول')}
            </CardTitle>
            <CardDescription>
              {t('Enter your email and password to login', 'أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول')}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email@example.com', 'email@example.com')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-nama-purple/30 focus-visible:ring-nama-purple"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('Password', 'كلمة المرور')}</Label>
                  <Link to="/reset-password" className="text-sm text-nama-purple hover:underline">
                    {t('Forgot password?', 'نسيت كلمة المرور؟')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-nama-purple/30 focus-visible:ring-nama-purple pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  {t('Remember me', 'تذكرني')}
                </Label>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-nama-purple hover:bg-nama-gold transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('Signing in...', 'جاري تسجيل الدخول...')}
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('Sign In', 'تسجيل الدخول')}
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm">
                {t('Don\'t have an account?', 'ليس لديك حساب؟')}{' '}
                <Link to="/signup" className="text-nama-purple hover:underline font-medium">
                  {t('Sign up', 'إنشاء حساب')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
