"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export default function PlanNotFound() {
  const { t } = useI18n();
  return <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-[#111113] p-8 text-center">
    <h1 className="text-xl font-semibold text-white">{t("Plan not found", "Az edzésterv nem található")}</h1>
    <p className="mt-3 text-sm text-zinc-400">{t("This plan is unavailable in your account.", "Ez az edzésterv nem érhető el a fiókodban.")}</p>
    <Link href="/plans" className="mt-6 inline-flex rounded-xl bg-lime-400 px-5 py-3 text-sm font-semibold text-black">
      {t("Back to plans", "Vissza az edzéstervekhez")}
    </Link>
  </div>;
}
