import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeesView } from "@/components/employees/employees-view";
import type { Profile, Area } from "@/lib/types";

export default async function EmployeesPage() {
    const sessionUser = await requireAuth();

    const userProfile = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true, area_id: true },
    });

    if (!userProfile) {
        return redirect("/login");
    }

    const { role } = userProfile;

    if (role !== "admin_rrhh" && role !== "jefe_area") {
        return redirect("/dashboard");
    }

    const employeesRaw = await prisma.user.findMany({
        orderBy: { full_name: "asc" },
    });

    const areasRaw = await prisma.area.findMany({
        orderBy: { name: "asc" },
    });

    let employees: Profile[] = employeesRaw.map((e) => ({
        id: e.id,
        email: e.email,
        full_name: e.full_name,
        role: e.role as Profile["role"],
        area_id: e.area_id,
        position: e.position,
        hire_date: e.hire_date?.toISOString().split("T")[0] ?? null,
        birth_date: e.birth_date?.toISOString().split("T")[0] ?? null,
        avatar_url: e.avatar_url,
        is_active: e.is_active,
        created_at: e.created_at.toISOString(),
        updated_at: e.updated_at.toISOString(),
    }));

    let areas: Area[] = areasRaw.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        jefe_area_id: a.jefe_area_id,
        created_at: a.created_at.toISOString(),
        updated_at: a.updated_at.toISOString(),
    }));

    if (role === "jefe_area") {
        if (!userProfile.area_id) {
            employees = [];
            areas = [];
        } else {
            employees = employees.filter(e => e.area_id === userProfile.area_id);
            areas = areas.filter(a => a.id === userProfile.area_id);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
                    <p className="text-muted-foreground">
                        Gestión y visualización del personal de la empresa.
                    </p>
                </div>
            </div>

            <EmployeesView employees={employees} areas={areas} role={role} />
        </div>
    );
}
