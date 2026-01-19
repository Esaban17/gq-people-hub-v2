"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/onboarding-actions";
import { toast } from "sonner";
import { TaskStatus, TASK_STATUS_LABELS } from "@/lib/types";

interface TaskStatusToggleProps {
    taskId: string;
    currentStatus: TaskStatus;
    processId: string;
}

export function TaskStatusToggle({ taskId, currentStatus, processId }: TaskStatusToggleProps) {
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (newStatus: TaskStatus) => {
        if (newStatus === currentStatus) return;

        startTransition(async () => {
            const result = await updateTaskStatus(taskId, newStatus, processId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Estado de tarea actualizado");
            }
        });
    };

    const statuses: TaskStatus[] = ["pendiente", "en_progreso", "completada"];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPending} className="h-7 px-2">
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {statuses.map((status) => (
                    <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={currentStatus === status ? "bg-accent" : ""}
                    >
                        {TASK_STATUS_LABELS[status]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
