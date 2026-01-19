"use client";

import { useState } from "react";
import { Profile, Area, ROLE_LABELS } from "@/lib/types";
import { ViewSwitcher, ViewMode } from "./view-switcher";
import { EmployeeListGrouped } from "./employee-list-grouped";
import { EmployeeOrgChart } from "./employee-org-chart";
import { Search, Info, Mail, Building2, UserCog, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmployeesViewProps {
    employees: Profile[];
    areas: Area[];
    role: string | null;
}

export function EmployeesView({ employees, areas, role }: EmployeesViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.area_id && areas.find(a => a.id === emp.area_id)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const EmployeeGrid = () => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => {
                const areaName = areas.find(a => a.id === employee.area_id)?.name;

                return (
                    <Card key={employee.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={employee.avatar_url || ""} />
                                    <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1 overflow-hidden">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold truncate">{employee.full_name}</p>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize">
                                            {ROLE_LABELS[employee.role]}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{employee.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Building2 className="h-3 w-3" />
                                            <span className="truncate">{areaName || "Sin área"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <Link href={`/employees/${employee.id}`}>
                                        <UserCog className="h-4 w-4 mr-2" />
                                        Gestionar
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, correo o área..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {role === "admin_rrhh" && (
                        <Link href="/employees/new">
                            <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Nuevo Empleado
                            </Button>
                        </Link>
                    )}
                    <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
                </div>
            </div>

            {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No se encontraron empleados.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" && <EmployeeGrid />}
                    {viewMode === "list" && <EmployeeListGrouped employees={filteredEmployees} areas={areas} />}
                    {viewMode === "chart" && (
                        <div className="border rounded-lg bg-background p-4 min-h-[500px] overflow-hidden overflow-x-auto">
                            {searchQuery && (
                                <div className="mb-4 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                    <Info className="h-4 w-4" />
                                    <span>La jerarquía puede estar incompleta al filtrar resultados.</span>
                                </div>
                            )}
                            <EmployeeOrgChart employees={filteredEmployees} areas={areas} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
