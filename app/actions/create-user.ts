"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Using the service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createUser(data: any) {
    // 1. Verify if current user is admin
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin_rrhh") {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    // 2. Create user with Admin Client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName,
        },
    });

    if (createError) {
        return { error: createError.message };
    }

    if (!newUser.user) {
        return { error: "Error creando el usuario" };
    }

    // 3. Update Profile (Profile is usually created by trigger, but we need to set specific fields)
    // We need to wait properly or upsert. Best to upsert here to be sure.
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
            full_name: data.fullName,
            role: data.role,
            area_id: data.areaId || null,
            position: data.position,
            is_active: true
        })
        .eq("id", newUser.user.id);


    if (profileError) {
        // Cleanup auth user if profile fails? Or just return error.
        // Ideally transactions, but Supabase HTTP API doesn't support spanning auth+db easily.
        return { error: "Usuario creado pero falló la actualización del perfil: " + profileError.message };
    }

    revalidatePath("/employees");
    return { success: true };
}
