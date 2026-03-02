import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { DocumentList } from "@/components/documents/document-list";
import { UploadButton } from "@/components/documents/upload-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEmployeeDocuments } from "@/lib/actions/documents";
import { User, FileText, ShieldCheck } from "lucide-react";
import type { Profile, Area, EmployeeDocument } from "@/lib/types";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const sessionUser = await requireAuth();

    const currentUserProfile = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (currentUserProfile?.role === "empleado") {
        redirect("/dashboard");
    }

    const profileRaw = await prisma.user.findUnique({
        where: { id },
    });

    if (!profileRaw) notFound();

    const profile: Profile = {
        id: profileRaw.id,
        email: profileRaw.email,
        full_name: profileRaw.full_name,
        role: profileRaw.role as Profile["role"],
        area_id: profileRaw.area_id,
        position: profileRaw.position,
        hire_date: profileRaw.hire_date?.toISOString().split("T")[0] ?? null,
        birth_date: profileRaw.birth_date?.toISOString().split("T")[0] ?? null,
        avatar_url: profileRaw.avatar_url,
        is_active: profileRaw.is_active,
        created_at: profileRaw.created_at.toISOString(),
        updated_at: profileRaw.updated_at.toISOString(),
    };

    const areaRaw = profile.area_id
        ? await prisma.area.findUnique({ where: { id: profile.area_id } })
        : null;

    const area: Area | null = areaRaw
        ? {
            id: areaRaw.id,
            name: areaRaw.name,
            description: areaRaw.description,
            jefe_area_id: areaRaw.jefe_area_id,
            created_at: areaRaw.created_at.toISOString(),
            updated_at: areaRaw.updated_at.toISOString(),
        }
        : null;

    if (currentUserProfile?.role === "jefe_area" && profile.area_id) {
        const targetArea = await prisma.area.findUnique({
            where: { id: profile.area_id },
            select: { jefe_area_id: true },
        });

        if (targetArea?.jefe_area_id !== sessionUser.id) {
            redirect("/employees");
        }
    }

    const documents = await getEmployeeDocuments(id) as EmployeeDocument[];
    const isAdmin = currentUserProfile?.role === "admin_rrhh";

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <ProfileHeader profile={profile} area={area} />

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="info" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Administración
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Empleado</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">ID Interno</span>
                                    <span className="col-span-2 font-mono">{profile.id}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Correo Electrónico</span>
                                    <span className="col-span-2">{profile.email}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Rol del Sistema</span>
                                    <span className="col-span-2 capitalize">{profile.role}</span>
                                </div>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Fecha ingreso</span>
                                    <span className="col-span-2">{profile.hire_date || "No registrada"}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Puesto</span>
                                    <span className="col-span-2">{profile.position || "N/A"}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Área</span>
                                    <span className="col-span-2">{area?.name || "Sin área"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Documentos del Empleado</h2>
                            <p className="text-sm text-muted-foreground">Expediente digital de {profile.full_name}</p>
                        </div>
                        <UploadButton userId={id} />
                    </div>
                    <DocumentList documents={documents} userId={id} canDelete={isAdmin} />
                </TabsContent>

                <TabsContent value="admin" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones Administrativas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Solo disponible para Admin RRHH.</p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" disabled={!isAdmin}>Editar Perfil</Button>
                                <Button variant="outline" disabled={!isAdmin}>Cambiar Área</Button>
                                <Button variant="destructive" disabled={!isAdmin}>Desactivar Empleado</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
