"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Credenciales inválidas" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
}

export async function registerAction(data: {
  email: string;
  password: string;
  full_name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { error: "El correo ya está registrado" };
  }

  const password_hash = await bcrypt.hash(data.password, 12);

  await prisma.user.create({
    data: {
      email: data.email,
      password_hash,
      full_name: data.full_name,
    },
  });

  return { success: true };
}
