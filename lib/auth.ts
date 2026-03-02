import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            area_id: true,
            password_hash: true,
            is_active: true,
          },
        });

        if (!user || !user.is_active) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          area_id: user.area_id,
        };
      },
    }),
  ],
});
