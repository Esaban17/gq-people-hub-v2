import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile, TimeOffBalance, TimeOffRequest, OnboardingTask } from "@/lib/types";
import { ROLE_LABELS, STATUS_LABELS, ABSENCE_TYPE_LABELS, TASK_STATUS_LABELS } from "@/lib/types";
import { Calendar, Palmtree, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
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

  const currentYear = new Date().getFullYear();
  
  const { data: balance } = await supabase
    .from("time_off_balances")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", currentYear)
    .single() as { data: TimeOffBalance | null };

  const { data: recentRequests } = await supabase
    .from("time_off_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: TimeOffRequest[] | null };

  const { data: pendingTasks } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .eq("responsible_id", user.id)
    .eq("status", "pendiente")
    .limit(5) as { data: OnboardingTask[] | null };

  const availableDays = balance 
    ? balance.total_days - balance.used_days - balance.pending_days + balance.carryover_days
    : 15;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-500/10 text-green-600 border-green-200";
      case "rechazada": return "bg-red-500/10 text-red-600 border-red-200";
      case "enviada": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "borrador": return "bg-gray-500/10 text-gray-600 border-gray-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo width={60} height={54} />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Bienvenido, {profile?.full_name || "Usuario"}
            </h1>
            <p className="text-muted-foreground">
              {profile ? ROLE_LABELS[profile.role] : ""} - {profile?.position || "Sin puesto asignado"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dias Disponibles</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{availableDays}</div>
            <p className="text-xs text-muted-foreground">
              de {balance?.total_days || 15} dias totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dias Usados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.used_days || 0}</div>
            <p className="text-xs text-muted-foreground">dias este ano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.pending_days || 0}</div>
            <p className="text-xs text-muted-foreground">dias en espera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">tareas asignadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Time Off Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Solicitudes Recientes</CardTitle>
                <CardDescription>Tus ultimas solicitudes de tiempo libre</CardDescription>
              </div>
              <Link href="/time-off">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests && recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {ABSENCE_TYPE_LABELS[request.absence_type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.start_date).toLocaleDateString("es-ES")} - {new Date(request.end_date).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Palmtree className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No tienes solicitudes recientes</p>
                <Link href="/time-off/new">
                  <Button variant="link" className="mt-2">Crear solicitud</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas de Onboarding</CardTitle>
                <CardDescription>Tareas pendientes asignadas a ti</CardDescription>
              </div>
              <Link href="/onboarding">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTasks && pendingTasks.length > 0 ? (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(task.due_date).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No tienes tareas pendientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
