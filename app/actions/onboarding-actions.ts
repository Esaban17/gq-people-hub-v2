"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteOnboardingProcess(processId: string) {
    const supabase = await createClient();

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

    // First delete all tasks associated with this process
    const { error: tasksError } = await supabase
        .from("onboarding_tasks")
        .delete()
        .eq("onboarding_id", processId);

    if (tasksError) {
        return { error: "Error eliminando las tareas: " + tasksError.message };
    }

    // Then delete the process
    const { error: processError } = await supabase
        .from("onboarding_processes")
        .delete()
        .eq("id", processId);

    if (processError) {
        return { error: "Error eliminando el proceso: " + processError.message };
    }

    revalidatePath("/onboarding");
    return { success: true };
}

export async function updateOnboardingProcess(processId: string, data: {
    status?: string;
    expected_completion_date?: string | null;
    notes?: string | null;
}) {
    const supabase = await createClient();

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

    const { error } = await supabase
        .from("onboarding_processes")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", processId);

    if (error) {
        return { error: "Error actualizando el proceso: " + error.message };
    }

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${processId}`);
    return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string, processId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    // Check if user is admin or is the responsible for this task
    const { data: task } = await supabase
        .from("onboarding_tasks")
        .select("responsible_id")
        .eq("id", taskId)
        .single();

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin_rrhh";
    const isResponsible = task?.responsible_id === user.id;

    if (!isAdmin && !isResponsible) {
        return { error: "No tienes permisos para actualizar esta tarea" };
    }

    const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === "completada") {
        updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from("onboarding_tasks")
        .update(updateData)
        .eq("id", taskId);

    if (error) {
        return { error: "Error actualizando la tarea: " + error.message };
    }

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${processId}`);
    return { success: true };
}
