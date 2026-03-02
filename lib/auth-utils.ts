import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/generated/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  area_id: string | null;
}

export async function getCurrentSession() {
  const session = await auth();
  return session;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return profile;
}
