"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Download,
    Trash2,
    FileIcon,
    HardDrive,
    Calendar,
} from "lucide-react";
import { EmployeeDocument, DOCUMENT_CATEGORY_LABELS } from "@/lib/types";
import { deleteDocument, getDownloadUrl } from "@/lib/actions/documents";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DocumentListProps {
    documents: EmployeeDocument[];
    userId: string;
    canDelete?: boolean;
}

export function DocumentList({ documents, userId, canDelete = false }: DocumentListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDownload = async (filePath: string, name: string) => {
        try {
            const url = await getDownloadUrl(filePath);
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error("No se pudo obtener el enlace de descarga");
        }
    };

    const handleDelete = async (id: string, filePath: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) return;

        setIsDeleting(id);
        try {
            await deleteDocument(id, filePath, userId);
            toast.success("Documento eliminado");
        } catch (error) {
            toast.error("No se pudo eliminar el documento");
        } finally {
            setIsDeleting(null);
        }
    };

    const formatSize = (bytes: number | null) => {
        if (!bytes) return "N/A";
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    if (documents.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p>No hay documentos registrados para este empleado.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                    <FileIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium truncate" title={doc.name}>
                                        {doc.name}
                                    </p>
                                    <Badge variant="outline" className="mt-1 text-[10px] h-5 capitalize">
                                        {DOCUMENT_CATEGORY_LABELS[doc.category]}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="grid gap-2 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <HardDrive className="h-3 w-3" />
                                <span>{formatSize(doc.size_bytes)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span suppressHydrationWarning>
                                    {format(new Date(doc.created_at), "PPP", { locale: es })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDownload(doc.file_path, doc.name)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </Button>
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(doc.id, doc.file_path)}
                                    disabled={isDeleting === doc.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
