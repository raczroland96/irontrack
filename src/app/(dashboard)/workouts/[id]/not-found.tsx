"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export default function WorkoutNotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-[#111113] p-8 text-center">
      <h1 className="text-xl font-semibold text-white">{t("Workout not found", "Az edzés nem található")}</h1>
      <p className="mt-3 text-sm text-zinc-400">{t("This workout is unavailable in your history.", "Ez az edzés nem érhető el az előzményeidben.")}</p>
      <Link href="/workouts" className="mt-6 inline-flex rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black">
        {t("Back to workout history", "Vissza az edzéstörténethez")}
      </Link>
    </div>
  );
}
