"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(data: any) {
    const sessionUser = await requireAuth();

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (currentUser?.role !== "admin_rrhh") {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        return { error: "Ya existe un usuario con ese correo electrónico" };
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    try {
        await prisma.user.create({
            data: {
                email: data.email,
                password_hash,
                full_name: data.fullName,
                role: data.role,
                area_id: data.areaId || null,
                position: data.position || null,
                is_active: true,
            },
        });
    } catch (err: any) {
        return { error: "Error creando el usuario: " + err.message };
    }

    revalidatePath("/employees");
    return { success: true };
}
