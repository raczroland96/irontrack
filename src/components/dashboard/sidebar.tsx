
"use client";

import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n-provider";
import LogoutButton from "@/components/dashboard/logout-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightFromLine,
  Dumbbell,
  ChartNoAxesCombined,
  Settings,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const subscribeToCollapse = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("sidebar-collapse", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sidebar-collapse", callback);
  };
};

export default function Sidebar({ username }: { username: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeToCollapse,
    () => localStorage.getItem("sidebar-collapsed") === "true", () => false);
  const [mobilePath, setMobilePath] = useState<string | null>(null);
  const mobileOpen = mobilePath === pathname;
  const setMobileOpen = (open: boolean) => setMobilePath(open ? pathname : null);
  const navigation = [
    { name: t("Dashboard", "Áttekintés"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("Workout history", "Edzéstörténet"), href: "/workouts", icon: Dumbbell },
    { name: t("Workout plans", "Edzéstervek"), href: "/plans", icon: ClipboardList },
    { name: t("Progress", "Fejlődés"), href: "/progress", icon: ChartNoAxesCombined },
    { name: t("Settings", "Beállítások"), href: "/settings", icon: Settings },
  ];

  function toggleSidebar() {
    localStorage.setItem("sidebar-collapsed", String(!collapsed));
    window.dispatchEvent(new Event("sidebar-collapse"));
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-20 z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white md:hidden"
        aria-label={t("Open navigation", "Navigáció megnyitása")}
      >
        <ArrowRightFromLine size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-[60] flex h-screen flex-col
          border-r border-zinc-800 bg-[#09090b]
          px-4 py-6 transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="mb-10 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
                <Dumbbell size={22} />
              </div>
              <h1 className="font-bold text-white">IRONTRACK</h1>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <Dumbbell size={22} />
            </div>
          )}

          <button
            onClick={() => setMobileOpen(false)}
            className="text-zinc-400 hover:text-white md:hidden"
            aria-label={t("Close navigation", "Navigáció bezárása")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-label={item.name}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-lime-400 text-black"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto">
          <div className="mb-5 flex items-center gap-3">
            {!collapsed && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-white">
                  {username[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-white">
                  {username}
                </span>
              </>
            )}
            <LogoutButton />
          </div>

          {/* Desktop collapse button */}
          <button
            aria-label={collapsed ? t("Expand navigation", "Navigáció kibontása") : t("Collapse navigation", "Navigáció összecsukása")}
            onClick={toggleSidebar}
            className="hidden w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white md:flex"
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                {t("Collapse", "Összecsukás")}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
