"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DocumentCategory } from "@/lib/types";

export async function uploadDocument(
    userId: string,
    name: string,
    category: DocumentCategory,
    file: File
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Create path: [userId]/[timestamp]_[filename]
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}_${file.name}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Insert into Database
    const { error: dbError } = await supabase
        .from("employee_documents")
        .insert({
            user_id: userId,
            name: name,
            file_path: filePath,
            category: category,
            uploaded_by: user.id,
            size_bytes: file.size,
            mime_type: file.type,
        });

    if (dbError) {
        // Cleanup storage if DB fails
        await supabase.storage.from("employee-documents").remove([filePath]);
        throw dbError;
    }

    revalidatePath(`/profile`);
    revalidatePath(`/employees/${userId}`);
}

export async function deleteDocument(id: string, filePath: string, userId: string) {
    const supabase = await createClient();

    // 1. Remove from Storage
    const { error: storageError } = await supabase.storage
        .from("employee-documents")
        .remove([filePath]);

    if (storageError) throw storageError;

    // 2. Remove from Database
    const { error: dbError } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath(`/profile`);
    revalidatePath(`/employees/${userId}`);
}

export async function getEmployeeDocuments(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getDownloadUrl(filePath: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
        .from("employee-documents")
        .createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data.signedUrl;
}
