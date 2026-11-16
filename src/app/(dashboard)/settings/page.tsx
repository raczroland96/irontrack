
import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";
import LanguageSwitcher from "@/components/language-switcher";

import {
  Dumbbell,
  ChevronRight,
  Settings,
} from "lucide-react";

export default async function SettingsPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Settings className="text-lime-400" size={25} />

          <h1 className="text-2xl font-bold text-white">
            {t("Settings", "Beállítások")}
          </h1>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          {t("Manage your application settings and exercise library.", "Az alkalmazás és a gyakorlatgyűjtemény beállításai.")}
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-[#111113] p-5">
        <LanguageSwitcher />
        <p className="mt-2 text-sm text-zinc-500">{t("Your language is saved to your account and follows you across devices.", "A nyelvet a fiókodhoz mentjük, így másik eszközön is megmarad.")}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("Training", "Edzés")}
        </h2>

        <Link
          href="/settings/exercises"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#111113] p-5 transition hover:border-lime-400/50 hover:bg-zinc-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/10">
            <Dumbbell
              size={23}
              className="text-lime-400"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white">
              {t("Exercise Library", "Gyakorlatgyűjtemény")}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {t("Browse the shared exercise database and add custom exercises.", "Böngéssz a közös gyakorlatok között, és adj hozzá sajátokat.")}
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-lime-400"
          />
        </Link>
      </section>
    </div>
  );
}
