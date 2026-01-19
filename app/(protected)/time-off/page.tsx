import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile, TimeOffBalance, TimeOffRequest } from "@/lib/types";
import { STATUS_LABELS, ABSENCE_TYPE_LABELS } from "@/lib/types";
import { Plus, Palmtree, Calendar, Users, Clock } from "lucide-react";
import Link from "next/link";
import { ApprovalActions } from "@/components/time-off/approval-actions";

export default async function TimeOffPage() {
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

  const { data: requests } = await supabase
    .from("time_off_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: TimeOffRequest[] | null };

  // Fetch requests pending approval if user is Jefe or Admin
  let pendingApprovals: any[] = [];
  if (profile?.role === "jefe_area" || profile?.role === "admin_rrhh") {
    let query = supabase
      .from("time_off_requests")
      .select("*, profiles!time_off_requests_user_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (profile.role === "jefe_area") {
      query = query.eq("status", "pendiente_jefe");
    } else {
      query = query.eq("status", "pendiente_rrhh");
    }

    const { data } = await query;
    pendingApprovals = data || [];
  }

  const availableDays = balance
    ? balance.total_days - balance.used_days - balance.pending_days + balance.carryover_days
    : 15;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-500/10 text-green-600 border-green-200";
      case "rechazada": return "bg-red-500/10 text-red-600 border-red-200";
      case "pendiente_rrhh":
      case "pendiente_jefe":
      case "enviada": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "borrador": return "bg-gray-500/10 text-gray-600 border-gray-200";
      case "cancelada": return "bg-red-500/10 text-red-400 border-red-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vacaciones y Tiempo Libre</h1>
          <p className="text-muted-foreground">Gestiona tus solicitudes de ausencia</p>
        </div>
        {profile?.role !== "admin_rrhh" && (
          <Link href="/time-off/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </Link>
        )}
      </div>

      {/* Quantity Cards */}
      {profile?.role !== "admin_rrhh" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
              <Palmtree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{availableDays}</div>
              <p className="text-xs text-muted-foreground">
                de {balance?.total_days || 15} días totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Días Usados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.used_days || 0}</div>
              <p className="text-xs text-muted-foreground">días este año</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.pending_days || 0}</div>
              <p className="text-xs text-muted-foreground">días en espera</p>
            </CardContent>
          </Card>

          {/* Note: The 4th card on dashboard was 'Tareas Pendientes' (Onboarding). 
              The user said "move cards that are there right now to Vacation component". 
              Tasks don't belong in Vacation. So I'll only move the 3 vacation-related ones.
              On Time Off page, there is a 4th card "Pendientes" (days pending). 
              I already included that above. 
              The existing Time Off page had 4 cards: Available, Total, Used, Pending.
              Dashboard had: Available, Used, Pending, Tasks.
              I will keep the 4th card "Total Anual" from the original Time Off page but style it like the others?
              Or just stick to the 3 relevant ones + Total.
           */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Anual</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.total_days || 15}</div>
              <p className="text-xs text-muted-foreground">días asignados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Section (Jefe/Admin) */}
      {(profile?.role === "jefe_area" || profile?.role === "admin_rrhh") && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Solicitudes por Aprobar
          </h2>
          <Card>
            <CardContent className="p-0">
              {pendingApprovals.length > 0 ? (
                <div className="divide-y">
                  {pendingApprovals.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{(request.profiles as any).full_name}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{ABSENCE_TYPE_LABELS[request.absence_type as unknown as import("@/lib/types").AbsenceType] || request.absence_type}</span>
                          <span>•</span>
                          <span>{request.total_days} dias</span>
                          <span>•</span>
                          <span>{new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</span>
                        </div>
                        {request.employee_comment && (
                          <p className="text-sm mt-1 italic text-muted-foreground">"{request.employee_comment}"</p>
                        )}
                      </div>
                      <ApprovalActions requestId={request.id} userRole={profile.role} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No hay solicitudes pendientes de tu aprobación.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests List */}
      {profile?.role !== "admin_rrhh" && (
        <Card>
          <CardHeader>
            <CardTitle>Mis Solicitudes</CardTitle>
            <CardDescription>Historial de todas tus solicitudes de tiempo libre</CardDescription>
          </CardHeader>
          <CardContent>
            {requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Palmtree className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {ABSENCE_TYPE_LABELS[request.absence_type]}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(request.start_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - {new Date(request.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{request.total_days} dias</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Palmtree className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No tienes solicitudes</p>
                <p className="text-sm">Crea tu primera solicitud de tiempo libre</p>
                <Link href="/time-off/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Solicitud
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
