
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from './ui/use-toast';
import { z } from 'zod';
import { getContactInfo, ContactInfo } from '../services/contactService';

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone number is too short'),
  message: z.string().min(10, 'Message is too short')
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const { t, language, isRTL } = useLanguage();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const data = await getContactInfo();
        setContactInfo(data);
      } catch (err) {
        console.error("Failed to load contact info:", err);
      }
    };

    loadContactInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      contactSchema.parse(formData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<ContactFormData> = {};
        err.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    if (contactInfo?.whatsapp) {
      try {
        // Format message for WhatsApp
        const whatsappMessage = `*New Contact Form Submission*
*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone}
*Message:* ${formData.message}`;
        
        // Create WhatsApp URL with encoded message
        const whatsappUrl = `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: t('Message ready to send!', 'الرسالة جاهزة للإرسال!'),
          description: t('WhatsApp has been opened with your message.', 'تم فتح واتساب برسالتك.'),
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } catch (error) {
        console.error('Error opening WhatsApp:', error);
        toast({
          variant: "destructive",
          title: t('Error', 'خطأ'),
          description: t('Failed to open WhatsApp. Please try again.', 'فشل فتح واتساب. يرجى المحاولة مرة أخرى.'),
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t('WhatsApp number not available', 'رقم واتساب غير متوفر'),
        description: t('Please try another contact method.', 'يرجى تجربة وسيلة اتصال أخرى.'),
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-nama-purple mb-6">
        {t('Contact Us', 'اتصل بنا')}
      </h3>
      
      <form onSubmit={handleSubmit} className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {t('Name', 'الاسم')}
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('Your name', 'اسمك')}
            className={errors.name ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {language === 'en' ? errors.name : 'الاسم قصير جدًا'}
            </p>
          )}
        </div>
        
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {t('Email', 'البريد الإلكتروني')}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('Your email', 'بريدك الإلكتروني')}
            className={errors.email ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {language === 'en' ? errors.email : 'البريد الإلكتروني غير صالح'}
            </p>
          )}
        </div>
        
        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            {t('Phone', 'رقم الهاتف')}
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('Your phone number', 'رقم هاتفك')}
            className={errors.phone ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {language === 'en' ? errors.phone : 'رقم الهاتف قصير جدًا'}
            </p>
          )}
        </div>
        
        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            {t('Message', 'الرسالة')}
          </label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder={t('Your message', 'رسالتك')}
            className={errors.message ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {language === 'en' ? errors.message : 'الرسالة قصيرة جدًا'}
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-nama-purple hover:bg-nama-red"
          disabled={isSubmitting}
        >
          {isSubmitting ? 
            t('Sending...', 'جاري الإرسال...') : 
            t('Send Message', 'إرسال الرسالة')
          }
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
