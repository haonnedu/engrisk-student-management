"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

type Locale = "vi" | "en";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  // Read persisted locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "vi" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  // Stable context value — only recreates when locale actually changes
  const value = useMemo<LocaleContextType>(
    () => ({ locale, setLocale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
