import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimeOffRequest, Profile } from "@/lib/types";
import { ABSENCE_TYPE_LABELS } from "@/lib/types";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
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

  // Get approved requests for the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  let requestsQuery = supabase
    .from("time_off_requests")
    .select("*, profiles!time_off_requests_user_id_fkey(full_name, email)")
    .eq("status", "aprobada")
    .gte("end_date", startOfMonth)
    .lte("start_date", endOfMonth);

  // Admin sees all, others see only their area or own
  if (profile?.role !== "admin_rrhh") {
    requestsQuery = requestsQuery.eq("user_id", user.id);
  }

  const { data: approvedRequests } = await requestsQuery as { data: (TimeOffRequest & { profiles: { full_name: string; email: string } })[] | null };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  // Generate calendar days
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calendarDays = [];

  // Add empty days for alignment
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getRequestsForDay = (day: number) => {
    if (!approvedRequests) return [];
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return approvedRequests.filter((req) => {
      return dateStr >= req.start_date && dateStr <= req.end_date;
    });
  };

  const isToday = (day: number) => {
    return day === now.getDate();
  };

  const getAbsenceTypeColor = (type: string) => {
    switch (type) {
      case "vacaciones": return "bg-primary/20 text-primary";
      case "dia_personal": return "bg-blue-500/20 text-blue-600";
      case "enfermedad": return "bg-orange-500/20 text-orange-600";
      default: return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Calendario Global</h1>
        <p className="text-muted-foreground">Vista de ausencias del equipo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {currentMonth} {currentYear}
          </CardTitle>
          <CardDescription>Ausencias aprobadas para este mes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2 min-h-24" />;
              }
              const requests = getRequestsForDay(day);
              return (
                <div
                  key={day}
                  className={`p-2 min-h-24 border rounded-lg ${
                    isToday(day) ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday(day) ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {requests.slice(0, 2).map((req) => (
                      <div
                        key={req.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${getAbsenceTypeColor(req.absence_type)}`}
                        title={`${req.profiles?.full_name || "Usuario"} - ${ABSENCE_TYPE_LABELS[req.absence_type]}`}
                      >
                        {req.profiles?.full_name?.split(" ")[0] || "Usuario"}
                      </div>
                    ))}
                    {requests.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{requests.length - 2} mas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-sm text-muted-foreground">Vacaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20" />
              <span className="text-sm text-muted-foreground">Dia Personal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/20" />
              <span className="text-sm text-muted-foreground">Enfermedad</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Absences List */}
      <Card>
        <CardHeader>
          <CardTitle>Proximas Ausencias</CardTitle>
          <CardDescription>Ausencias aprobadas este mes</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedRequests && approvedRequests.length > 0 ? (
            <div className="space-y-3">
              {approvedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${
                      request.absence_type === "vacaciones" ? "bg-primary" :
                      request.absence_type === "dia_personal" ? "bg-blue-500" : "bg-orange-500"
                    }`} />
                    <div>
                      <p className="font-medium">{request.profiles?.full_name || "Usuario"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.start_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - {new Date(request.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getAbsenceTypeColor(request.absence_type)}>
                    {ABSENCE_TYPE_LABELS[request.absence_type]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay ausencias aprobadas este mes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
