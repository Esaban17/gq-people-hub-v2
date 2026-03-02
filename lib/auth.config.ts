import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Prisma/Node.js imports).
 * Used by middleware.ts and spread into the full auth.ts config.
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.area_id = (user as any).area_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).area_id = token.area_id;
      }
      return session;
    },
  },
  providers: [],
};
