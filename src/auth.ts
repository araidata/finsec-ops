import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import {
  configuredEntraTenantId,
  isEntraAuthConfigured,
} from "@/lib/auth/config";
import { entraIdentityFromProfile } from "@/lib/auth/entra-profile";
import { getPrisma } from "@/lib/server/prisma";

const configured = isEntraAuthConfigured();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: configured
    ? [
        MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
        }),
      ]
    : [],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },
  callbacks: {
    async signIn({ profile }) {
      const identity = entraIdentityFromProfile(profile);
      const expectedTenantId = configuredEntraTenantId();
      if (
        !identity ||
        !expectedTenantId ||
        identity.tenantId.toLowerCase() !== expectedTenantId.toLowerCase()
      ) {
        return false;
      }

      try {
        const user = await getPrisma().user.findUnique({
          where: {
            entraTenantId_entraSubject: {
              entraTenantId: identity.tenantId,
              entraSubject: identity.subject,
            },
          },
          select: { active: true },
        });
        return user?.active === true;
      } catch {
        return false;
      }
    },
    jwt({ token, profile }) {
      const identity = entraIdentityFromProfile(profile);
      if (identity) {
        token.entraSubject = identity.subject;
        token.entraTenantId = identity.tenantId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.entraSubject =
        typeof token.entraSubject === "string" ? token.entraSubject : undefined;
      session.user.entraTenantId =
        typeof token.entraTenantId === "string"
          ? token.entraTenantId
          : undefined;
      return session;
    },
  },
});
