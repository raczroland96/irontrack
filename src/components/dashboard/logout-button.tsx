
"use client";

import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message);
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  };

  return (
    <button
      aria-label={t("Sign out", "Kijelentkezés")}
      title={t("Sign out", "Kijelentkezés")}
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-zinc-500 hover:text-red-400 disabled:opacity-50"
    >
      <LogOut size={17} />
    </button>
  );
}
