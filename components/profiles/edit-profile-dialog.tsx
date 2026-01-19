"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/profile-actions";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

interface EditProfileDialogProps {
    profile: Profile;
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const [fullName, setFullName] = useState(profile.full_name || "");
    const [position, setPosition] = useState(profile.position || "");
    const [birthDate, setBirthDate] = useState(profile.birth_date || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const result = await updateProfile({
                full_name: fullName,
                position: position,
                birth_date: birthDate || null,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Perfil actualizado correctamente");
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Actualiza tu información personal. El área es asignada por Recursos Humanos.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Juan Pérez García"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo / Puesto</Label>
                            <Input
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                placeholder="Desarrollador Senior"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
