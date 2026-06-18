import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, Save, Loader2, Camera, Lock, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formData, setFormData] = useState({
    full_name_en: '',
    full_name_ar: '',
    phone: '',
    bio_en: '',
    bio_ar: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name_en: profile.full_name_en || '',
        full_name_ar: profile.full_name_ar || '',
        phone: profile.phone || '',
        bio_en: profile.bio_en || '',
        bio_ar: profile.bio_ar || '',
      });
    }
  }, [profile]);

  // Upload avatar handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Please select an image file', 'الرجاء اختيار ملف صورة'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Image size must be less than 2MB', 'يجب أن يكون حجم الصورة أقل من 2 ميجابايت'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create file path: userId/avatar.ext
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting parameter
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      toast({
        title: t('Success', 'نجاح'),
        description: t('Avatar updated successfully', 'تم تحديث الصورة الشخصية بنجاح'),
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to upload avatar', 'فشل رفع الصورة الشخصية'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: t('Success', 'نجاح'),
        description: t('Profile updated successfully', 'تم تحديث الملف الشخصي بنجاح'),
      });
    },
    onError: (error) => {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to update profile', 'فشل تحديث الملف الشخصي'),
        variant: 'destructive',
      });
      console.error('Profile update error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Passwords do not match', 'كلمات المرور غير متطابقة'),
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: t('Success', 'نجاح'),
        description: t('Password updated successfully', 'تم تحديث كلمة المرور بنجاح'),
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: t('Error', 'خطأ'),
        description: error.message || t('Failed to update password', 'فشل تحديث كلمة المرور'),
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = () => {
    const name = isRTL ? formData.full_name_ar : formData.full_name_en;
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            {/* Avatar with upload button */}
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>

                {/* Upload overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload hint */}
            <p className="text-xs text-muted-foreground mb-2">
              {t('Click on avatar to upload a new photo', 'اضغط على الصورة لرفع صورة جديدة')}
            </p>

            <CardTitle className="text-2xl">
              {t('My Profile', 'ملفي الشخصي')}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name_en">
                    {t('Full Name (English)', 'الاسم الكامل (إنجليزي)')}
                  </Label>
                  <div className="relative">
                    <User className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                    <Input
                      id="full_name_en"
                      name="full_name_en"
                      value={formData.full_name_en}
                      onChange={handleChange}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                      placeholder="hafez Rahim"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name_ar">
                    {t('Full Name (Arabic)', 'الاسم الكامل (عربي)')}
                  </Label>
                  <div className="relative">
                    <User className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                    <Input
                      id="full_name_ar"
                      name="full_name_ar"
                      value={formData.full_name_ar}
                      onChange={handleChange}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                      placeholder="محمد أحمد"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t('Phone Number', 'رقم الهاتف')}
                </Label>
                <div className="relative">
                  <Phone className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                    placeholder="+966 50 123 4567"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Bio Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bio_en">
                    {t('Bio (English)', 'نبذة (إنجليزي)')}
                  </Label>
                  <Textarea
                    id="bio_en"
                    name="bio_en"
                    value={formData.bio_en}
                    onChange={handleChange}
                    placeholder={t('Tell us about yourself...', 'أخبرنا عن نفسك...')}
                    rows={3}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio_ar">
                    {t('Bio (Arabic)', 'نبذة (عربي)')}
                  </Label>
                  <Textarea
                    id="bio_ar"
                    name="bio_ar"
                    value={formData.bio_ar}
                    onChange={handleChange}
                    placeholder={t('Tell us about yourself...', 'أخبرنا عن نفسك...')}
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('Saving...', 'جاري الحفظ...')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('Save Changes', 'حفظ التغييرات')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={`text-xl flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Lock className="h-5 w-5" />
              {t('Change Password', 'تغيير كلمة المرور')}
            </CardTitle>
            <CardDescription>
              {t('Update your account password', 'تحديث كلمة مرور حسابك')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {t('New Password', 'كلمة المرور الجديدة')}
                </Label>
                <div className="relative">
                  <Lock className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute top-3 text-muted-foreground hover:text-foreground ${isRTL ? 'left-3' : 'right-3'}`}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('Confirm New Password', 'تأكيد كلمة المرور الجديدة')}
                </Label>
                <div className="relative">
                  <Lock className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-3 text-muted-foreground hover:text-foreground ${isRTL ? 'left-3' : 'right-3'}`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('Updating...', 'جاري التحديث...')}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {t('Update Password', 'تحديث كلمة المرور')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
