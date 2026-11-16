"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n";

export async function saveLocale(value: string) {
  if (!isLocale(value)) return { error: "Invalid language / Érvénytelen nyelv" };
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { locale: value } });
  }
  // Also retain the language on the sign-in screen after signing out.
  (await cookies()).set("irontrack-locale", value, {
    path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return { success: true };
}
