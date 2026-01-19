import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile, OnboardingProcess, OnboardingTask } from "@/lib/types";
import { TASK_STATUS_LABELS } from "@/lib/types";
import { ArrowLeft, UserPlus, CheckCircle, Clock, AlertCircle, Calendar, Mail, Briefcase } from "lucide-react";
import Link from "next/link";
import { TaskStatusToggle } from "@/components/onboarding/task-status-toggle";

interface OnboardingWithDetails extends OnboardingProcess {
    profiles: Profile;
    onboarding_tasks: (OnboardingTask & { responsible: { full_name: string } | null })[];
}

const TASK_CATEGORY_LABELS_LOCAL: Record<string, string> = {
    rrhh: "Recursos Humanos",
    it: "Tecnología",
    jefe_area: "Jefe de Área",
};

export default async function OnboardingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single() as { data: Profile | null };

    const { data: process } = await supabase
        .from("onboarding_processes")
        .select(`
      *,
      profiles!onboarding_processes_employee_id_fkey(*),
      onboarding_tasks(*, responsible:profiles!onboarding_tasks_responsible_id_fkey(full_name))
    `)
        .eq("id", id)
        .single() as { data: OnboardingWithDetails | null };

    if (!process) {
        notFound();
    }

    // Check permissions
    if (profile?.role === "empleado" && process.employee_id !== user.id) {
        redirect("/dashboard");
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "activo": return "bg-green-500/10 text-green-600 border-green-200";
            case "completado": return "bg-blue-500/10 text-blue-600 border-blue-200";
            case "pausado": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
            default: return "bg-gray-500/10 text-gray-600 border-gray-200";
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case "completada": return "bg-green-500/10 text-green-600 border-green-200";
            case "en_progreso": return "bg-blue-500/10 text-blue-600 border-blue-200";
            case "pendiente": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
            default: return "bg-gray-500/10 text-gray-600 border-gray-200";
        }
    };

    const getTaskStatusIcon = (status: string) => {
        switch (status) {
            case "completada": return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "en_progreso": return <Clock className="h-4 w-4 text-blue-600" />;
            case "pendiente": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const tasks = process.onboarding_tasks || [];
    const completedTasks = tasks.filter((t) => t.status === "completada").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Group tasks by category
    const tasksByCategory = tasks.reduce((acc, task) => {
        const category = task.category || "otro";
        if (!acc[category]) acc[category] = [];
        acc[category].push(task);
        return acc;
    }, {} as Record<string, typeof tasks>);

    const canEditTasks = profile?.role === "admin_rrhh" ||
        tasks.some(t => t.responsible_id === user.id);

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/onboarding">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Onboarding
                        </h1>
                        <Badge variant="outline" className={getStatusColor(process.status)}>
                            {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">Proceso de incorporación</p>
                </div>
            </div>

            {/* Employee Info Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={process.profiles?.avatar_url || ""} />
                            <AvatarFallback className="text-lg">
                                {process.profiles?.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h2 className="text-xl font-semibold">{process.profiles?.full_name}</h2>
                                <p className="text-muted-foreground">{process.profiles?.position || "Sin puesto asignado"}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{process.profiles?.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Inicio: {new Date(process.start_date).toLocaleDateString("es-ES")}</span>
                                </div>
                                {process.expected_completion_date && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        <span>Esperado: {new Date(process.expected_completion_date).toLocaleDateString("es-ES")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Progreso General</CardTitle>
                    <CardDescription>
                        {completedTasks} de {tasks.length} tareas completadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completado</span>
                            <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="text-sm font-medium">{tasks.filter(t => t.status === "pendiente").length}</p>
                                <p className="text-xs text-muted-foreground">Pendientes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium">{tasks.filter(t => t.status === "en_progreso").length}</p>
                                <p className="text-xs text-muted-foreground">En Progreso</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm font-medium">{completedTasks}</p>
                                <p className="text-xs text-muted-foreground">Completadas</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks by Category */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Tareas</h2>

                {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
                    <Card key={category}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                {TASK_CATEGORY_LABELS_LOCAL[category] || category}
                            </CardTitle>
                            <CardDescription>
                                {categoryTasks.filter(t => t.status === "completada").length} de {categoryTasks.length} completadas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {categoryTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start justify-between p-3 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-start gap-3">
                                            {getTaskStatusIcon(task.status)}
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">{task.title}</p>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {task.responsible && (
                                                        <span>Responsable: {task.responsible.full_name}</span>
                                                    )}
                                                    {task.due_date && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Vence: {new Date(task.due_date).toLocaleDateString("es-ES")}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getTaskStatusColor(task.status)}>
                                                {TASK_STATUS_LABELS[task.status]}
                                            </Badge>
                                            {canEditTasks && (
                                                <TaskStatusToggle
                                                    taskId={task.id}
                                                    currentStatus={task.status}
                                                    processId={id}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {tasks.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No hay tareas asignadas a este proceso</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Notes */}
            {process.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{process.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
