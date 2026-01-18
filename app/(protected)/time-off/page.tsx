import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile, TimeOffBalance, TimeOffRequest } from "@/lib/types";
import { STATUS_LABELS, ABSENCE_TYPE_LABELS } from "@/lib/types";
import { Plus, Palmtree, Calendar } from "lucide-react";
import Link from "next/link";

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

  const availableDays = balance 
    ? balance.total_days - balance.used_days - balance.pending_days + balance.carryover_days
    : 15;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-500/10 text-green-600 border-green-200";
      case "rechazada": return "bg-red-500/10 text-red-600 border-red-200";
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
        <Link href="/time-off/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{availableDays}</div>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.total_days || 15}</div>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.used_days || 0}</div>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.pending_days || 0}</div>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Solicitudes</CardTitle>
          <CardDescription>Historial de todas tus solicitudes de tiempo libre</CardDescription>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Link key={request.id} href={`/time-off/${request.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
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
                </Link>
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
    </div>
  );
}
