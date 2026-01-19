"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { approveRequest, rejectRequest } from "@/lib/actions/time-off";
import { useTransition } from "react";

interface ApprovalActionsProps {
    requestId: string;
    userRole: string;
}

export function ApprovalActions({ requestId, userRole }: ApprovalActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        startTransition(async () => {
            try {
                await approveRequest(requestId, userRole);
            } catch (error) {
                console.error("Error approving request:", error);
                alert("Error al aprobar la solicitud");
            }
        });
    };

    const handleReject = () => {
        const comment = prompt("Motivo del rechazo (opcional):");
        if (comment === null) return; // Cancelled

        startTransition(async () => {
            try {
                await rejectRequest(requestId, comment);
            } catch (error) {
                console.error("Error rejecting request:", error);
                alert("Error al rechazar la solicitud");
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleApprove}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Aprobar
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleReject}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                Rechazar
            </Button>
        </div>
    );
}
