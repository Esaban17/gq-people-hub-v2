"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TaskCategory, TaskStatus } from "@/lib/generated/prisma";

export async function deleteOnboardingProcess(processId: string) {
    const sessionUser = await requireAuth();

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (currentUser?.role !== "admin_rrhh") {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    try {
        await prisma.onboardingProcess.delete({
            where: { id: processId },
        });
    } catch (err: any) {
        return { error: "Error eliminando el proceso: " + err.message };
    }

    revalidatePath("/onboarding");
    return { success: true };
}

export async function updateOnboardingProcess(processId: string, data: {
    status?: string;
    expected_completion_date?: string | null;
    notes?: string | null;
}) {
    const sessionUser = await requireAuth();

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (currentUser?.role !== "admin_rrhh") {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    try {
        await prisma.onboardingProcess.update({
            where: { id: processId },
            data: {
                status: data.status,
                expected_completion_date: data.expected_completion_date
                    ? new Date(data.expected_completion_date)
                    : null,
                notes: data.notes,
            },
        });
    } catch (err: any) {
        return { error: "Error actualizando el proceso: " + err.message };
    }

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${processId}`);
    return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string, processId: string) {
    const sessionUser = await requireAuth();

    const task = await prisma.onboardingTask.findUnique({
        where: { id: taskId },
        select: { responsible_id: true },
    });

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    const isAdmin = currentUser?.role === "admin_rrhh";
    const isResponsible = task?.responsible_id === sessionUser.id;

    if (!isAdmin && !isResponsible) {
        return { error: "No tienes permisos para actualizar esta tarea" };
    }

    try {
        await prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                status: status as TaskStatus,
                completed_at: status === "completada" ? new Date() : undefined,
            },
        });
    } catch (err: any) {
        return { error: "Error actualizando la tarea: " + err.message };
    }

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${processId}`);
    return { success: true };
}

export async function createOnboardingProcess(data: {
    employee_id: string;
    start_date: string;
    expected_completion_date: string | null;
    notes: string | null;
    tasks: {
        title: string;
        category: string;
        description: string | null;
        due_date: string | null;
        responsible_id: string | null;
    }[];
}) {
    const sessionUser = await requireAuth();

    try {
        const process = await prisma.onboardingProcess.create({
            data: {
                employee_id: data.employee_id,
                start_date: new Date(data.start_date),
                expected_completion_date: data.expected_completion_date
                    ? new Date(data.expected_completion_date)
                    : null,
                notes: data.notes,
                created_by: sessionUser.id,
                status: "activo",
                tasks: {
                    create: data.tasks
                        .filter((t) => t.title)
                        .map((task) => ({
                            title: task.title,
                            description: task.description,
                            category: task.category as TaskCategory,
                            due_date: task.due_date ? new Date(task.due_date) : null,
                            responsible_id: task.responsible_id || null,
                            status: "pendiente" as TaskStatus,
                        })),
                },
            },
        });

        revalidatePath("/onboarding");
        return { success: true, id: process.id };
    } catch (err: any) {
        return { error: "Error creando el proceso: " + err.message };
    }
}

export async function getActiveEmployees() {
    const employees = await prisma.user.findMany({
        where: { is_active: true },
        orderBy: { full_name: "asc" },
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

    return employees.map((e) => ({
        ...e,
        hire_date: e.hire_date?.toISOString().split("T")[0] ?? null,
        birth_date: e.birth_date?.toISOString().split("T")[0] ?? null,
        created_at: e.created_at.toISOString(),
        updated_at: e.updated_at.toISOString(),
    }));
}
