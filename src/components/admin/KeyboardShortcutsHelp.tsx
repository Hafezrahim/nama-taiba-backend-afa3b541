import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { shortcutsList } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const { t, language, isRTL } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            {t('Keyboard Shortcuts', 'اختصارات لوحة المفاتيح')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcutsList.map((shortcut, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? shortcut.description.ar : shortcut.description.en}
              </span>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center border-t pt-3">
          {t('Press Escape to close this dialog', 'اضغط Escape لإغلاق هذه النافذة')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
