"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    full_name?: string;
    position?: string;
    birth_date?: string | null;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: data.full_name,
            position: data.position,
            birth_date: data.birth_date || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        return { error: "Error actualizando el perfil: " + error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/employees");
    return { success: true };
}

export async function updateProfileAvatar(avatarUrl: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        return { error: "Error actualizando el avatar: " + error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/employees");
    return { success: true };
}
