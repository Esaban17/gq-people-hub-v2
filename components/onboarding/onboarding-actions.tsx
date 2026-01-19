"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteOnboardingProcess, updateOnboardingProcess } from "@/app/actions/onboarding-actions";
import { toast } from "sonner";

interface OnboardingActionsProps {
    processId: string;
    currentStatus: string;
    expectedDate: string | null;
    notes: string | null;
}

export function OnboardingActions({ processId, currentStatus, expectedDate, notes }: OnboardingActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const [editStatus, setEditStatus] = useState(currentStatus);
    const [editExpectedDate, setEditExpectedDate] = useState(expectedDate || "");
    const [editNotes, setEditNotes] = useState(notes || "");

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteOnboardingProcess(processId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Proceso de onboarding eliminado");
                setShowDeleteDialog(false);
            }
        });
    };

    const handleUpdate = () => {
        startTransition(async () => {
            const result = await updateOnboardingProcess(processId, {
                status: editStatus,
                expected_completion_date: editExpectedDate || null,
                notes: editNotes || null,
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Proceso actualizado");
                setShowEditDialog(false);
            }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar Proceso
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Proceso
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el proceso de onboarding y todas sus tareas asociadas.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Proceso de Onboarding</DialogTitle>
                        <DialogDescription>
                            Modifica los detalles del proceso de incorporación.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activo">Activo</SelectItem>
                                    <SelectItem value="pausado">Pausado</SelectItem>
                                    <SelectItem value="completado">Completado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expectedDate">Fecha Esperada de Finalización</Label>
                            <Input
                                id="expectedDate"
                                type="date"
                                value={editExpectedDate}
                                onChange={(e) => setEditExpectedDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                placeholder="Notas adicionales sobre el proceso..."
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} disabled={isPending}>
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
                </DialogContent>
            </Dialog>
        </>
    );
}
