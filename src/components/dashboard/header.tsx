"use client";
import { useI18n } from "@/components/i18n-provider";

import { Bell } from "lucide-react";

export default function Header() {
  const { t } = useI18n();
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 px-4 md:px-8">
      <h2 className="text-lg font-semibold text-white md:text-xl">
        {t("Your training overview", "Edzéseid áttekintése")}
      </h2>

      <button
        aria-label={t("Notifications", "Értesítések")}
        className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 hover:bg-zinc-800"
      >
        <Bell size={19} />
      </button>
    </header>
  );
}
