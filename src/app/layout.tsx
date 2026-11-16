
import type { Metadata } from "next";
import "./globals.css";
import I18nProvider from "@/components/i18n-provider";
import { getI18n } from "@/lib/i18n-server";

// The document language is resolved from the current account at request time.
export const instant = false;

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Track your workouts and fitness progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <body><I18nProvider locale={locale}>{children}</I18nProvider></body>
    </html>
  );
}
