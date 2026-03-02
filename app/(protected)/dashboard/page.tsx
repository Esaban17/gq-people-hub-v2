import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile, OnboardingTask } from "@/lib/types";
import { ROLE_LABELS, TASK_STATUS_LABELS } from "@/lib/types";
import { Palmtree, CheckCircle, Cake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const sessionUser = await requireAuth();

  const profile = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Fetch people on vacation today
  const onVacationRaw = await prisma.timeOffRequest.findMany({
    where: {
      status: "aprobada",
      start_date: { lte: todayStart },
      end_date: { gte: todayStart },
    },
    include: {
      user: { select: { full_name: true, avatar_url: true, position: true } },
    },
  });

  const onVacation = onVacationRaw.map((req) => ({
    id: req.id,
    profiles: {
      full_name: req.user.full_name,
      avatar_url: req.user.avatar_url,
      position: req.user.position,
    },
  }));

  // Fetch birthdays today
  const allProfiles = await prisma.user.findMany({
    where: { is_active: true },
    select: { id: true, full_name: true, avatar_url: true, birth_date: true, position: true },
  });

  const birthdaysToday = allProfiles.filter((p) => {
    if (!p.birth_date) return false;
    const bdate = p.birth_date;
    return (bdate.getMonth() + 1) === currentMonth && bdate.getDate() === currentDay;
  });

  // Fetch pending tasks
  let pendingTasks: OnboardingTask[] = [];

  const responsibleTasksRaw = await prisma.onboardingTask.findMany({
    where: {
      responsible_id: sessionUser.id,
      status: { not: "completada" },
    },
    take: 5,
  });

  if (profile?.role === "empleado") {
    const myOnboarding = await prisma.onboardingProcess.findFirst({
      where: { employee_id: sessionUser.id },
      select: { id: true },
    });

    if (myOnboarding) {
      const myTasksRaw = await prisma.onboardingTask.findMany({
        where: {
          onboarding_id: myOnboarding.id,
          status: { not: "completada" },
        },
        take: 5,
      });

      pendingTasks = myTasksRaw.map((t) => ({
        ...t,
        category: t.category as OnboardingTask["category"],
        status: t.status as OnboardingTask["status"],
        due_date: t.due_date?.toISOString().split("T")[0] ?? null,
        completed_at: t.completed_at?.toISOString() ?? null,
        created_at: t.created_at.toISOString(),
        updated_at: t.updated_at.toISOString(),
      }));
    }
  } else {
    pendingTasks = responsibleTasksRaw.map((t) => ({
      ...t,
      category: t.category as OnboardingTask["category"],
      status: t.status as OnboardingTask["status"],
      due_date: t.due_date?.toISOString().split("T")[0] ?? null,
      completed_at: t.completed_at?.toISOString() ?? null,
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
    }));
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
              {profile ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] : ""} - {profile?.position || "Sin puesto asignado"}
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

        {/* Pending Tasks */}
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
