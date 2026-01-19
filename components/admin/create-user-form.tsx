"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createUser } from "@/app/actions/create-user";
import { Area } from "@/lib/types";
import { Loader2 } from "lucide-react";

export const UserRoleSchema = z.enum(["admin_rrhh", "jefe_area", "empleado"]);

const FormSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    fullName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    role: UserRoleSchema,
    areaId: z.string().optional(),
    position: z.string().min(2, { message: "El puesto es requerido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

interface CreateUserFormProps {
    areas: Area[];
}

export function CreateUserForm({ areas }: CreateUserFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            fullName: "",
            role: "empleado",
            areaId: "",
            position: "",
            password: "",
        },
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        startTransition(async () => {
            const result = await createUser(data);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Usuario creado exitosamente");
                form.reset();
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Corporativo</FormLabel>
                                <FormControl>
                                    <Input placeholder="usuario@gqpeoplehub.demo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña Temporal</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rol</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="empleado">Empleado</SelectItem>
                                        <SelectItem value="jefe_area">Jefe de Área</SelectItem>
                                        <SelectItem value="admin_rrhh">Admin RRHH</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Puesto / Cargo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Desarrollador Senior" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {form.watch("role") !== "admin_rrhh" && (
                    <FormField
                        control={form.control}
                        name="areaId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Área</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un área" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {areas.map((area) => (
                                            <SelectItem key={area.id} value={area.id}>
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando usuario...
                        </>
                    ) : (
                        "Crear Usuario"
                    )}
                </Button>
            </form>
        </Form>
    );
}
