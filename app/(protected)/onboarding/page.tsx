import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Profile, OnboardingProcess, OnboardingTask } from "@/lib/types";
import { TASK_STATUS_LABELS } from "@/lib/types";
import { Plus, UserPlus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface OnboardingWithDetails extends OnboardingProcess {
  profiles: { full_name: string; email: string };
  onboarding_tasks: OnboardingTask[];
}

export default async function OnboardingPage() {
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

  // Check if user has permission to view onboarding
  if (profile?.role === "empleado") {
    // Employees can only see their own onboarding
    const { data: myOnboarding } = await supabase
      .from("onboarding_processes")
      .select("*, profiles!onboarding_processes_employee_id_fkey(full_name, email), onboarding_tasks(*)")
      .eq("employee_id", user.id)
      .single() as { data: OnboardingWithDetails | null };

    if (myOnboarding) {
      redirect(`/onboarding/${myOnboarding.id}`);
    }
    redirect("/dashboard");
  }

  // Admin or Jefe de Area - get all onboarding processes
  const { data: onboardingProcesses } = await supabase
    .from("onboarding_processes")
    .select("*, profiles!onboarding_processes_employee_id_fkey(full_name, email), onboarding_tasks(*)")
    .order("created_at", { ascending: false }) as { data: OnboardingWithDetails[] | null };

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
              {onboardingProcesses?.filter((p) => p.status === "activo").length || 0}
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
              {onboardingProcesses?.filter((p) => p.status === "completado").length || 0}
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
              {onboardingProcesses?.reduce((acc, p) => 
                acc + (p.onboarding_tasks?.filter((t) => t.status === "pendiente").length || 0), 0
              ) || 0}
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
          {onboardingProcesses && onboardingProcesses.length > 0 ? (
            <div className="space-y-4">
              {onboardingProcesses.map((process) => {
                const progress = calculateProgress(process.onboarding_tasks);
                const completedTasks = process.onboarding_tasks?.filter((t) => t.status === "completada").length || 0;
                const totalTasks = process.onboarding_tasks?.length || 0;

                return (
                  <Link key={process.id} href={`/onboarding/${process.id}`}>
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <UserPlus className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{process.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{process.profiles?.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(process.status)}>
                          {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                        </Badge>
                      </div>
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
                    </div>
                  </Link>
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
