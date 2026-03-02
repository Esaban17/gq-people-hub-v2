"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uploadToS3, getPublicUrl } from "@/lib/s3";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    full_name?: string;
    position?: string;
    birth_date?: string | null;
}) {
    const sessionUser = await requireAuth();

    try {
        await prisma.user.update({
            where: { id: sessionUser.id },
            data: {
                full_name: data.full_name,
                position: data.position,
                birth_date: data.birth_date ? new Date(data.birth_date) : null,
            },
        });
    } catch (err: any) {
        return { error: "Error actualizando el perfil: " + err.message };
    }

    revalidatePath("/profile");
    revalidatePath("/employees");
    return { success: true };
}

export async function updateProfileAvatar(avatarUrl: string) {
    const sessionUser = await requireAuth();

    try {
        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { avatar_url: avatarUrl },
        });
    } catch (err: any) {
        return { error: "Error actualizando el avatar: " + err.message };
    }

    revalidatePath("/profile");
    revalidatePath("/employees");
    return { success: true };
}

export async function uploadAvatarAction(formData: FormData) {
    const sessionUser = await requireAuth();

    const file = formData.get("file") as File;
    if (!file) return { error: "No se proporcionó archivo" };

    if (!file.type.startsWith("image/")) {
        return { error: "El archivo debe ser una imagen" };
    }

    if (file.size > 2 * 1024 * 1024) {
        return { error: "La imagen no debe superar 2MB" };
    }

    const fileExt = file.name.split(".").pop();
    const key = `avatars/${sessionUser.id}/avatar.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        await uploadToS3(key, buffer, file.type);
        const publicUrl = getPublicUrl(key);

        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { avatar_url: publicUrl },
        });

        revalidatePath("/profile");
        revalidatePath("/employees");
        return { success: true, url: publicUrl };
    } catch (err: any) {
        return { error: "Error subiendo la imagen: " + err.message };
    }
}
