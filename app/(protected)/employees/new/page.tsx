import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Area, Profile } from "@/lib/types";

export default async function NewEmployeePage() {
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

    if (profile?.role !== "admin_rrhh") {
        redirect("/dashboard");
    }

    const { data: areas } = await supabase
        .from("areas")
        .select("*")
        .order("name") as { data: Area[] | null };

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
                    <CreateUserForm areas={areas || []} />
                </CardContent>
            </Card>
        </div>
    );
}
