"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** "sidebar" = white-on-dark style; "navbar" = standard style */
  variant?: "sidebar" | "navbar";
}

const LANGUAGES = [
  { code: "vi" as const, flag: "🇻🇳", label: "VI" },
  { code: "en" as const, flag: "🇬🇧", label: "EN" },
];

export function LanguageSwitcher({ variant = "sidebar" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-lg p-0.5"
      style={
        variant === "sidebar"
          ? { background: "rgba(255,255,255,0.08)" }
          : { background: "var(--muted)" }
      }
    >
      {LANGUAGES.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150 select-none",
              isActive
                ? variant === "sidebar"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "bg-background text-foreground shadow-sm"
                : variant === "sidebar"
                  ? "text-white/60 hover:text-white/90"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
