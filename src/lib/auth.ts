
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n";

export const auth = betterAuth({
  user: {
    additionalFields: {
      locale: { type: "string", defaultValue: "en", input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const preference = context?.getCookie("irontrack-locale");
          return { data: { ...user, locale: isLocale(preference) ? preference : "en" } };
        },
      },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  trustedOrigins: [
    "http://localhost:3000",
  ],
});
