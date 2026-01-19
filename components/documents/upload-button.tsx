"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { DocumentCategory, DOCUMENT_CATEGORY_LABELS } from "@/lib/types";
import { uploadDocument } from "@/lib/actions/documents";
import { toast } from "sonner";

interface UploadButtonProps {
    userId: string;
}

export function UploadButton({ userId }: UploadButtonProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<DocumentCategory>("otro");
    const [name, setName] = useState("");

    const handleUpload = async () => {
        if (!file || !name) return;

        setIsUploading(true);
        try {
            await uploadDocument(userId, name, category, file);
            toast.success("Documento subido correctamente");
            setOpen(false);
            setFile(null);
            setName("");
            setCategory("otro");
        } catch (error) {
            toast.error("No se pudo subir el documento");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                    <DialogDescription>
                        Selecciona un archivo y una categoría para el documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Documento</Label>
                        <Input
                            id="name"
                            placeholder="Ej: Contrato 2024"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                            value={category}
                            onValueChange={(value) => setCategory(value as DocumentCategory)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="file">Archivo</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || !name || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                            "Confirmar Subida"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
