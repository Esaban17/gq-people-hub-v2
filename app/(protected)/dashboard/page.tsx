import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile, TimeOffBalance, TimeOffRequest, OnboardingTask } from "@/lib/types";
import { ROLE_LABELS, STATUS_LABELS, ABSENCE_TYPE_LABELS, TASK_STATUS_LABELS } from "@/lib/types";
import { Calendar, Palmtree, CheckCircle, Clock, AlertCircle, Cake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth() + 1; // getMonth is 0-indexed
  const currentDay = today.getDate();

  // Fetch people on vacation today
  const { data: onVacation } = await supabase
    .from("time_off_requests")
    .select("*, profiles(full_name, avatar_url, position)")
    .eq("status", "aprobada")
    .lte("start_date", todayStr)
    .gte("end_date", todayStr) as { data: (TimeOffRequest & { profiles: Profile })[] | null };

  // Fetch birthdays today
  // Note: Supabase/Postgres specific query for date parts might need raw SQL or specific filter.
  // Using a simpler approach: fetch all active profiles and filter in JS if dataset is small, 
  // OR use .rpc() if we had a function. For now, let's try to select needed fields and filter JS side 
  // as the employee count is likely low for this MVP. 
  // Ideally: .filter('birth_date', 'eq', today-month-day pattern) - hard with standard filter.
  // Alternative: Create a postgres function later if needed. For now, fetch all users with birth_date.
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, birth_date, position")
    .eq("is_active", true);

  const birthdaysToday = allProfiles?.filter(p => {
    if (!p.birth_date) return false;
    const bdate = new Date(p.birth_date);
    // Be careful with timezone, birth_date string usually YYYY-MM-DD.
    // Parse manually to avoid timezone shifts.
    const [y, m, d] = p.birth_date.split('-').map(Number);
    return m === currentMonth && d === currentDay;
  }) || [];

  // Fetch pending tasks - either assigned to user OR from user's own onboarding
  let pendingTasks: OnboardingTask[] = [];

  // Tasks where user is responsible
  const { data: responsibleTasks } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .eq("responsible_id", user.id)
    .neq("status", "completada")
    .limit(5) as { data: OnboardingTask[] | null };

  // Tasks from user's own onboarding process (if empleado)
  if (profile?.role === "empleado") {
    const { data: myOnboarding } = await supabase
      .from("onboarding_processes")
      .select("id")
      .eq("employee_id", user.id)
      .single();

    if (myOnboarding) {
      const { data: myTasks } = await supabase
        .from("onboarding_tasks")
        .select("*")
        .eq("onboarding_id", myOnboarding.id)
        .neq("status", "completada")
        .limit(5) as { data: OnboardingTask[] | null };

      pendingTasks = myTasks || [];
    }
  } else {
    pendingTasks = responsibleTasks || [];
  }

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

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* On Vacation Card */}
        <Card className="col-span-1 lg:col-span-1 border-blue-100 bg-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-blue-500" />
              De Vacaciones Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onVacation && onVacation.length > 0 ? (
              <div className="space-y-4">
                {onVacation.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 bg-background p-2 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.profiles.avatar_url || ""} />
                      <AvatarFallback>{req.profiles.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{req.profiles.full_name}</p>
                      <p className="text-xs text-muted-foreground">{req.profiles.position || "Empleado"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nadie está de vacaciones hoy.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Birthdays Card */}
        <Card className="col-span-1 lg:col-span-1 border-pink-100 bg-pink-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              Cumpleañeros del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdaysToday.length > 0 ? (
              <div className="space-y-4">
                {birthdaysToday.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-background p-2 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url || ""} />
                      <AvatarFallback>{p.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">¡Deséale un feliz cumpleaños!</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Hoy no hay cumpleaños.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks (Kept as it's useful) */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Mis Tareas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks && pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card/50"
                  >
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                  </div>
                ))}
                <Link href="/onboarding">
                  <Button variant="link" size="sm" className="w-full mt-2 h-auto p-0 text-muted-foreground">Ver todas</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No tienes tareas pendientes.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
