import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { DocumentList } from "@/components/documents/document-list";
import { UploadButton } from "@/components/documents/upload-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEmployeeDocuments } from "@/lib/actions/documents";
import { User, FileText, History, ShieldCheck } from "lucide-react";
import type { Profile, Area, EmployeeDocument } from "@/lib/types";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) redirect("/login");

    // Fetch current user role to check permissions
    const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (currentUserProfile?.role === "empleado") {
        redirect("/dashboard");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single() as { data: Profile | null };

    if (!profile) notFound();

    const { data: area } = profile.area_id
        ? await supabase.from("areas").select("*").eq("id", profile.area_id).single()
        : { data: null };

    // Jefe can only see their team
    if (currentUserProfile?.role === "jefe_area" && profile.area_id) {
        const { data: targetArea } = await supabase
            .from("areas")
            .select("jefe_area_id")
            .eq("id", profile.area_id)
            .single();

        if (targetArea?.jefe_area_id !== user.id) {
            redirect("/employees");
        }
    }

    const documents = await getEmployeeDocuments(id) as EmployeeDocument[];
    const isAdmin = currentUserProfile?.role === "admin_rrhh";

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <ProfileHeader profile={profile} area={area as Area | null} />

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
