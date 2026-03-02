import type { UserRole } from "@/lib/generated/prisma";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    area_id: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      area_id: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    area_id: string | null;
  }
}
