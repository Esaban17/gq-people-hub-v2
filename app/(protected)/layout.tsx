import React from "react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";
import type { Profile } from "@/lib/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireAuth();

  const profile = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      area_id: true,
      position: true,
      hire_date: true,
      birth_date: true,
      avatar_url: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  const profileData: Profile | null = profile
    ? {
        ...profile,
        hire_date: profile.hire_date?.toISOString().split("T")[0] ?? null,
        birth_date: profile.birth_date?.toISOString().split("T")[0] ?? null,
        created_at: profile.created_at.toISOString(),
        updated_at: profile.updated_at.toISOString(),
      }
    : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar user={profileData} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
