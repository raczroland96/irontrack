"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { saveLocale } from "@/lib/locale-actions";

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  return <div className="space-y-3">
    <label className="block text-sm font-medium text-zinc-200" htmlFor="language">
      {t("Language", "Nyelv")}
    </label>
    <select id="language" value={locale} disabled={pending}
      className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white disabled:opacity-50"
      onChange={(event) => {
        const value = event.target.value;
        setMessage("");
        startTransition(async () => {
          try {
            const result = await saveLocale(value);
            if (result.error) throw new Error(result.error);
            setMessage(value === "hu" ? "Nyelv elmentve." : "Language saved.");
            router.refresh();
          } catch {
            setMessage(t("Could not save the language. Please try again.", "A nyelv mentése nem sikerült. Próbáld újra."));
          }
        });
      }}>
      <option value="en">English</option>
      <option value="hu">Magyar</option>
    </select>
    <p aria-live="polite" className="text-sm text-lime-400">
      {pending ? t("Saving…", "Mentés…") : message}
    </p>
  </div>;
}
