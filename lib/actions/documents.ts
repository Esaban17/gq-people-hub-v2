"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from "@/lib/s3";
import { revalidatePath } from "next/cache";
import type { DocumentCategory } from "@/lib/generated/prisma";

export async function uploadDocument(
    userId: string,
    name: string,
    category: string,
    file: File
) {
    const sessionUser = await requireAuth();

    const timestamp = Date.now();
    const filePath = `documents/${userId}/${timestamp}_${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        await uploadToS3(filePath, buffer, file.type);
    } catch (err: any) {
        throw new Error("Error subiendo el archivo: " + err.message);
    }

    try {
        await prisma.employeeDocument.create({
            data: {
                user_id: userId,
                name: name,
                file_path: filePath,
                category: category as DocumentCategory,
                uploaded_by: sessionUser.id,
                size_bytes: file.size,
                mime_type: file.type,
            },
        });
    } catch (err: any) {
        await deleteFromS3(filePath);
        throw new Error("Error guardando el documento: " + err.message);
    }

    revalidatePath(`/profile`);
    revalidatePath(`/employees/${userId}`);
}

export async function deleteDocument(id: string, filePath: string, userId: string) {
    await requireAuth();

    await deleteFromS3(filePath);

    await prisma.employeeDocument.delete({
        where: { id },
    });

    revalidatePath(`/profile`);
    revalidatePath(`/employees/${userId}`);
}

export async function getEmployeeDocuments(userId: string) {
    const documents = await prisma.employeeDocument.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    return documents.map((doc) => ({
        ...doc,
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at.toISOString(),
    }));
}

export async function getDownloadUrl(filePath: string) {
    await requireAuth();
    return getSignedDownloadUrl(filePath, 3600);
}
