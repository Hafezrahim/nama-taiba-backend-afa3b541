import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ukFlag from '@/assets/uk-flag.png';
import saFlag from '@/assets/sa-flag.png';
import { cn } from '@/lib/utils';

export function AdminLanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      className={cn(
        "flex items-center gap-2 hover:bg-muted px-2",
        "transition-all duration-200"
      )}
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <img 
        src={language === 'en' ? saFlag : ukFlag} 
        alt={language === 'en' ? 'العربية' : 'English'}
        className="h-5 w-5 rounded-full object-cover shadow-sm"
      />
      <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </Button>
  );
}
