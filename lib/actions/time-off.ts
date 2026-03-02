"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AbsenceType, RequestStatus } from "@/lib/generated/prisma";

export async function approveRequest(requestId: string, currentRole: string) {
    const sessionUser = await requireAuth();

    let nextStatus: string = "aprobada";
    if (currentRole === "jefe_area") {
        nextStatus = "pendiente_rrhh";
    }

    const request = await prisma.timeOffRequest.findUnique({
        where: { id: requestId },
        select: { user_id: true, total_days: true, absence_type: true },
    });

    if (!request) {
        throw new Error("Solicitud no encontrada");
    }

    await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: {
            status: nextStatus as RequestStatus,
            approved_by: sessionUser.id,
            approved_at: new Date(),
        },
    });

    if (nextStatus === "aprobada" && request.absence_type === "vacaciones") {
        const currentYear = new Date().getFullYear();
        const balance = await prisma.timeOffBalance.findFirst({
            where: {
                user_id: request.user_id,
                year: currentYear,
            },
        });

        if (balance) {
            await prisma.timeOffBalance.update({
                where: { id: balance.id },
                data: {
                    used_days: (balance.used_days || 0) + request.total_days,
                },
            });
        }
    }

    revalidatePath("/time-off");
    revalidatePath("/dashboard");
}

export async function rejectRequest(requestId: string, comment?: string) {
    await requireAuth();

    await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: {
            status: "rechazada",
            approver_comment: comment || null,
        },
    });

    revalidatePath("/time-off");
    revalidatePath("/dashboard");
}

export async function createTimeOffRequest(data: {
    absence_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    status: string;
    employee_comment: string | null;
}) {
    const sessionUser = await requireAuth();

    const profile = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (profile?.role === "admin_rrhh") {
        return { error: "Los administradores de RRHH no pueden solicitar vacaciones." };
    }

    let finalStatus = data.status;
    if (data.status === "enviada") {
        finalStatus = profile?.role === "jefe_area" ? "pendiente_rrhh" : "pendiente_jefe";
    }

    try {
        await prisma.timeOffRequest.create({
            data: {
                user_id: sessionUser.id,
                absence_type: data.absence_type as AbsenceType,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                total_days: data.total_days,
                status: finalStatus as RequestStatus,
                employee_comment: data.employee_comment,
            },
        });

        revalidatePath("/time-off");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
