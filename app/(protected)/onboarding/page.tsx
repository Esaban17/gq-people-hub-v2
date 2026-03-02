import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { OnboardingTask } from "@/lib/types";
import { TASK_STATUS_LABELS } from "@/lib/types";
import { Plus, UserPlus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { OnboardingActions } from "@/components/onboarding/onboarding-actions";

export default async function OnboardingPage() {
  const sessionUser = await requireAuth();

  const profile = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true },
  });

  if (profile?.role === "empleado") {
    const myOnboarding = await prisma.onboardingProcess.findFirst({
      where: { employee_id: sessionUser.id },
    });

    if (myOnboarding) {
      redirect(`/onboarding/${myOnboarding.id}`);
    }
    redirect("/dashboard");
  }

  const processesRaw = await prisma.onboardingProcess.findMany({
    orderBy: { created_at: "desc" },
    include: {
      employee: { select: { full_name: true, email: true } },
      tasks: true,
    },
  });

  const onboardingProcesses = processesRaw.map((p) => ({
    id: p.id,
    employee_id: p.employee_id,
    start_date: p.start_date.toISOString().split("T")[0],
    expected_completion_date: p.expected_completion_date?.toISOString().split("T")[0] ?? null,
    status: p.status,
    notes: p.notes,
    created_by: p.created_by,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
    profiles: { full_name: p.employee.full_name, email: p.employee.email },
    onboarding_tasks: p.tasks.map((t) => ({
      id: t.id,
      onboarding_id: t.onboarding_id,
      title: t.title,
      description: t.description,
      category: t.category as OnboardingTask["category"],
      status: t.status as OnboardingTask["status"],
      responsible_id: t.responsible_id,
      due_date: t.due_date?.toISOString().split("T")[0] ?? null,
      completed_at: t.completed_at?.toISOString() ?? null,
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
    })),
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo": return "bg-green-500/10 text-green-600 border-green-200";
      case "completado": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "pausado": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const calculateProgress = (tasks: OnboardingTask[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "completada").length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Onboarding</h1>
          <p className="text-muted-foreground">Gestiona los procesos de incorporacion de nuevos empleados</p>
        </div>
        {profile?.role === "admin_rrhh" && (
          <Link href="/onboarding/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Onboarding
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {onboardingProcesses.filter((p) => p.status === "activo").length}
            </div>
            <p className="text-xs text-muted-foreground">procesos en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingProcesses.filter((p) => p.status === "completado").length}
            </div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingProcesses.reduce((acc, p) =>
                acc + (p.onboarding_tasks?.filter((t) => t.status === "pendiente").length || 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">en total</p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Processes List */}
      <Card>
        <CardHeader>
          <CardTitle>Procesos de Onboarding</CardTitle>
          <CardDescription>Lista de todos los procesos de incorporacion</CardDescription>
        </CardHeader>
        <CardContent>
          {onboardingProcesses.length > 0 ? (
            <div className="space-y-4">
              {onboardingProcesses.map((process) => {
                const progress = calculateProgress(process.onboarding_tasks);
                const completedTasks = process.onboarding_tasks?.filter((t) => t.status === "completada").length || 0;
                const totalTasks = process.onboarding_tasks?.length || 0;

                return (
                  <div key={process.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/onboarding/${process.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
                        <div className="p-2 rounded-full bg-primary/10">
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{process.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{process.profiles?.email}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(process.status)}>
                          {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                        </Badge>
                        {profile?.role === "admin_rrhh" && (
                          <OnboardingActions
                            processId={process.id}
                            currentStatus={process.status}
                            expectedDate={process.expected_completion_date}
                            notes={process.notes}
                          />
                        )}
                      </div>
                    </div>
                    <Link href={`/onboarding/${process.id}`} className="block cursor-pointer">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{completedTasks}/{totalTasks} tareas</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Inicio: {new Date(process.start_date).toLocaleDateString("es-ES")}</span>
                        {process.expected_completion_date && (
                          <span>Esperado: {new Date(process.expected_completion_date).toLocaleDateString("es-ES")}</span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay procesos de onboarding</p>
              <p className="text-sm">Crea un nuevo proceso para un empleado</p>
              {profile?.role === "admin_rrhh" && (
                <Link href="/onboarding/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Onboarding
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
