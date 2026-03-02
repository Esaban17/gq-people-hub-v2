import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Area } from "@/lib/types";

export default async function NewEmployeePage() {
    const sessionUser = await requireAuth();

    const profile = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (profile?.role !== "admin_rrhh") {
        redirect("/dashboard");
    }

    const areasRaw = await prisma.area.findMany({
        orderBy: { name: "asc" },
    });

    const areas: Area[] = areasRaw.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        jefe_area_id: a.jefe_area_id,
        created_at: a.created_at.toISOString(),
        updated_at: a.updated_at.toISOString(),
    }));

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/employees">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nuevo Empleado</h1>
                    <p className="text-muted-foreground">
                        Registra un nuevo usuario en la plataforma.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Usuario</CardTitle>
                    <CardDescription>
                        La contraseña será temporal y el usuario deberá cambiarla al iniciar sesión (Próximamente).
                        Por ahora, comunica la contraseña de manera segura.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateUserForm areas={areas} />
                </CardContent>
            </Card>
        </div>
    );
}
