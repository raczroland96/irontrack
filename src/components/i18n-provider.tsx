"use client";

import { createContext, useContext } from "react";
import { createI18n, type Locale } from "@/lib/i18n";

const I18nContext = createContext(createI18n("en"));

export default function I18nProvider({ locale, children }: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={createI18n(locale)}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
