import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createI18n, isLocale } from "@/lib/i18n";

// Request-scoped: a different user's language must never enter a shared cache.
export const getI18n = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    return createI18n(isLocale(user?.locale) ? user.locale : "en");
  }
  const preference = (await cookies()).get("irontrack-locale")?.value;
  return createI18n(isLocale(preference) ? preference : "en");
});
