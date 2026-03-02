"use client";

import { useState, useRef, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatarAction } from "@/app/actions/profile-actions";
import { toast } from "sonner";

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl: string | null;
    fullName: string;
}

export function AvatarUpload({ userId, currentAvatarUrl, fullName }: AvatarUploadProps) {
    const [isPending, startTransition] = useTransition();
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona una imagen");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("La imagen no debe superar 2MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload via server action
        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadAvatarAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                if (result.url) {
                    setPreviewUrl(result.url);
                }
                toast.success("Foto de perfil actualizada");
            }
        });
    };

    const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={previewUrl || ""} alt={fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Camera className="h-4 w-4" />
                )}
            </Button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
