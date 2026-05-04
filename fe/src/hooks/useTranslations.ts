import { useCallback } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import viMessages from "../../messages/vi.json";
import enMessages from "../../messages/en.json";

const messages = {
  vi: viMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

export function useTranslations(namespace?: string) {
  const { locale } = useLocale();

  // useCallback with locale as dep ensures `t` is recreated when locale changes.
  // This makes any component that spreads { t } or calls t() re-render correctly.
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const keys = fullKey.split(".");

      let value: unknown = messages[locale];
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }

      if (typeof value !== "string") {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Translation key not found: "${fullKey}" (locale: ${locale})`);
        }
        return key;
      }

      if (params) {
        return value.replace(/\{(\w+)\}/g, (_match, paramKey: string) => {
          return params[paramKey]?.toString() ?? _match;
        });
      }

      return value;
    },
    // Re-create t whenever locale or namespace changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, namespace]
  );

  return { t, locale };
}
