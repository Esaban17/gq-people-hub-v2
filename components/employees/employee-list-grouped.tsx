"use client";

import { Profile, Area, ROLE_LABELS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Mail, Building2 } from "lucide-react";
import Link from "next/link";

interface EmployeeListGroupedProps {
    employees: Profile[];
    areas: Area[];
}

export function EmployeeListGrouped({ employees, areas }: EmployeeListGroupedProps) {
    // Group employees by area_id
    const groupedEmployees = employees.reduce((acc, employee) => {
        const areaId = employee.area_id || "uncategorized";
        if (!acc[areaId]) {
            acc[areaId] = [];
        }
        acc[areaId].push(employee);
        return acc;
    }, {} as Record<string, Profile[]>);

    // Get uncategorized employees
    const uncategorized = groupedEmployees["uncategorized"] || [];

    // Sort areas by name
    const sortedAreas = [...areas].sort((a, b) => a.name.localeCompare(b.name));

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const EmployeeCard = ({ employee }: { employee: Profile }) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar_url || ""} />
                    <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate text-sm">{employee.full_name}</p>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize ml-2 shrink-0">
                            {ROLE_LABELS[employee.role]}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{employee.position || "Posición no definida"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{employee.email}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                    <Link href={`/employees/${employee.id}`}>
                        <UserCog className="h-4 w-4" />
                        <span className="sr-only">Gestionar</span>
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            {sortedAreas.map((area) => {
                const areaEmployees = groupedEmployees[area.id];
                if (!areaEmployees?.length) return null;

                return (
                    <div key={area.id} className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">{area.name}</h2>
                            <Badge variant="outline" className="ml-2">
                                {areaEmployees.length} {areaEmployees.length === 1 ? "Miembro" : "Miembros"}
                            </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {areaEmployees.map((employee) => (
                                <EmployeeCard key={employee.id} employee={employee} />
                            ))}
                        </div>
                    </div>
                );
            })}

            {uncategorized.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold text-muted-foreground">Sin Área Asignada</h2>
                        <Badge variant="outline" className="ml-2">
                            {uncategorized.length}
                        </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {uncategorized.map((employee) => (
                            <EmployeeCard key={employee.id} employee={employee} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
