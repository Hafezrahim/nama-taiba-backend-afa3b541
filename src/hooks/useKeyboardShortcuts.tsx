import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (
  onSearchOpen?: () => void,
  onHelpOpen?: () => void
) => {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => onSearchOpen?.(),
      description: 'Open search',
    },
    {
      key: '/',
      ctrl: true,
      action: () => onHelpOpen?.(),
      description: 'Open help',
    },
    {
      key: 'd',
      ctrl: true,
      shift: true,
      action: () => navigate('/admin'),
      description: 'Go to Dashboard',
    },
    {
      key: 'p',
      ctrl: true,
      shift: true,
      action: () => navigate('/admin/products'),
      description: 'Go to Products',
    },
    {
      key: 'o',
      ctrl: true,
      shift: true,
      action: () => navigate('/admin/orders'),
      description: 'Go to Orders',
    },
    {
      key: 'u',
      ctrl: true,
      shift: true,
      action: () => navigate('/admin/users'),
      description: 'Go to Users',
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: () => navigate('/admin/settings'),
      description: 'Go to Settings',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open dialogs/modals - handled by individual components
      },
      description: 'Close dialog',
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
        const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (!ctrlOrMeta || isCtrlOrMetaPressed) &&
          (!shortcut.shift || event.shiftKey) &&
          (!shortcut.alt || event.altKey)
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, navigate, onSearchOpen, onHelpOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
};

export const shortcutsList = [
  { keys: ['Ctrl', 'K'], description: { en: 'Open Search', ar: 'فتح البحث' } },
  { keys: ['Ctrl', '/'], description: { en: 'Open Help', ar: 'فتح المساعدة' } },
  { keys: ['Ctrl', 'Shift', 'D'], description: { en: 'Go to Dashboard', ar: 'الذهاب للوحة التحكم' } },
  { keys: ['Ctrl', 'Shift', 'P'], description: { en: 'Go to Products', ar: 'الذهاب للمنتجات' } },
  { keys: ['Ctrl', 'Shift', 'O'], description: { en: 'Go to Orders', ar: 'الذهاب للطلبات' } },
  { keys: ['Ctrl', 'Shift', 'U'], description: { en: 'Go to Users', ar: 'الذهاب للمستخدمين' } },
  { keys: ['Ctrl', 'Shift', 'S'], description: { en: 'Go to Settings', ar: 'الذهاب للإعدادات' } },
  { keys: ['Esc'], description: { en: 'Close Dialog', ar: 'إغلاق النافذة' } },
];
