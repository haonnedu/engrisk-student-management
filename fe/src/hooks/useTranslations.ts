import { useLocale } from '@/contexts/LocaleContext';
import viMessages from '../../messages/vi.json';
import enMessages from '../../messages/en.json';

const messages = {
  vi: viMessages,
  en: enMessages,
};

export function useTranslations(namespace?: string) {
  const { locale } = useLocale();
  
  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = namespace ? `${namespace}.${key}`.split('.') : key.split('.');
    let value: any = messages[locale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Replace params like {count}, {name}, etc.
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  return { t, locale };
}

