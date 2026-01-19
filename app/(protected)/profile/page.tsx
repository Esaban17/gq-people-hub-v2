import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { DocumentList } from "@/components/documents/document-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployeeDocuments } from "@/lib/actions/documents";
import { User, FileText, Settings } from "lucide-react";
import type { Profile, Area, EmployeeDocument } from "@/lib/types";

export default async function ProfilePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single() as { data: Profile | null };

    if (!profile) redirect("/dashboard");

    const { data: area } = profile.area_id
        ? await supabase.from("areas").select("*").eq("id", profile.area_id).single()
        : { data: null };

    const documents = await getEmployeeDocuments(user.id) as EmployeeDocument[];

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <ProfileHeader profile={profile} area={area as Area | null} />

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="info" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Ajustes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Datos Laborales</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">ID de Empleado</span>
                                    <span className="font-mono text-xs">{profile.id}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Fecha de Contratación</span>
                                    <span>{profile.hire_date || "No registrada"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Área</span>
                                    <span>{area?.name || "Sin área"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Resumen de Cuenta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Estado</span>
                                    <span className="text-green-600 font-medium">Activo</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Último Acceso</span>
                                    <span>Hoy</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Idioma</span>
                                    <span>Español</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-lg font-semibold">Tus Documentos</h2>
                            <p className="text-sm text-muted-foreground">Gestiona tus contratos y documentos oficiales.</p>
                        </div>
                    </div>
                    <DocumentList documents={documents} userId={user.id} />
                </TabsContent>

                <TabsContent value="settings" className="pt-4">
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p>Las opciones de configuración estarán disponibles pronto.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
