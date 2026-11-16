"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { deletePlan, startPlan } from "./actions";

export default function PlanControls({ planId, active }: { planId: string; active: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const buttonClass = "inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-lime-400 disabled:opacity-40";
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending || active} onClick={() => {
        setError("");
        startTransition(async () => {
          try {
            const { href } = await startPlan(planId);
            router.push(href);
            router.refresh();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("Unable to start plan.", "Az edzésterv nem indítható."));
          }
        });
      }} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-40"><Play size={15} />{pending ? t("Please wait…", "Kis türelmet…") : t("Start workout", "Edzés indítása")}</button>
      <Link href={`/plans/${planId}`} aria-disabled={pending} className={`${buttonClass} ${pending ? "pointer-events-none opacity-40" : ""}`}><Pencil size={15} />{t("Edit", "Szerkesztés")}</Link>
      <button type="button" disabled={pending} className={buttonClass} onClick={() => {
        if (!window.confirm(t("Delete this plan? Your workout history will be kept.", "Törlöd ezt az edzéstervet? Az edzéstörténeted megmarad."))) return;
        setError("");
        startTransition(async () => {
          try { await deletePlan(planId); router.refresh(); }
          catch (cause) { setError(cause instanceof Error ? cause.message : t("Unable to delete plan.", "Az edzésterv nem törölhető.")); }
        });
      }}><Trash2 size={15} />{t("Delete", "Törlés")}</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}
