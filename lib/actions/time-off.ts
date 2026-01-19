"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveRequest(requestId: string, currentRole: string) {
    const supabase = await createClient();

    // Determine next status
    let nextStatus: string = "aprobada";
    if (currentRole === "jefe_area") {
        nextStatus = "pendiente_rrhh";
    }

    // Get request details first
    const { data: request, error: fetchError } = await supabase
        .from("time_off_requests")
        .select("user_id, total_days, absence_type")
        .eq("id", requestId)
        .single();

    if (fetchError || !request) {
        throw new Error("Error fetching request: " + fetchError?.message);
    }

    // Update request status
    const { error } = await supabase
        .from("time_off_requests")
        .update({
            status: nextStatus as any,
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString()
        })
        .eq("id", requestId);

    if (error) {
        throw new Error(error.message);
    }

    // If fully approved (by RRHH), deduct from balance
    if (nextStatus === "aprobada" && request.absence_type === "vacaciones") {
        // Get current balance
        const currentYear = new Date().getFullYear();
        const { data: balance } = await supabase
            .from("time_off_balances")
            .select("id, used_days")
            .eq("user_id", request.user_id)
            .eq("year", currentYear)
            .single();

        if (balance) {
            const newUsed = (balance.used_days || 0) + request.total_days;

            await supabase
                .from("time_off_balances")
                .update({
                    used_days: newUsed,
                    updated_at: new Date().toISOString()
                })
                .eq("id", balance.id);
        }
    }

    revalidatePath("/time-off");
    revalidatePath("/dashboard");
}

export async function rejectRequest(requestId: string, comment?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("time_off_requests")
        .update({
            status: "rechazada" as any,
            approver_comment: comment || null
        })
        .eq("id", requestId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/time-off");
    revalidatePath("/dashboard");
}
