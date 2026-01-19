"use client";

import { Profile, Area } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmployeeOrgChartProps {
    employees: Profile[];
    areas: Area[];
}

export function EmployeeOrgChart({ employees, areas }: EmployeeOrgChartProps) {
    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const OrgCard = ({
        profile,
        role = "member",
        className
    }: {
        profile: Profile;
        role?: "lead" | "member" | "root";
        className?: string
    }) => (
        <Card className={cn(
            "w-64 shrink-0 transition-all hover:shadow-lg",
            role === "root" && "border-primary/50 bg-primary/5",
            role === "lead" && "border-blue-200 bg-blue-50/50",
            className
        )}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Avatar className={cn(
                    "h-12 w-12 border-2",
                    role === "root" ? "border-primary h-16 w-16" : "border-background",
                    role === "lead" && "border-blue-200"
                )}>
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm truncate w-56" title={profile.full_name}>
                        {profile.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate w-56" title={profile.position || ""}>
                        {profile.position || "Sin cargo"}
                    </p>
                    {role === "root" && <Badge variant="default" className="mt-1 text-[10px] h-5">Dirección</Badge>}
                    {role === "lead" && <Badge variant="secondary" className="mt-1 text-[10px] h-5">Responsable</Badge>}
                </div>
            </CardContent>
        </Card>
    );

    const employeesByArea = employees.reduce((acc, emp) => {
        const areaId = emp.area_id || "uncategorized";
        if (!acc[areaId]) acc[areaId] = [];
        acc[areaId].push(emp);
        return acc;
    }, {} as Record<string, Profile[]>);

    const rootEmployees = employees.filter(e => e.role === "admin_rrhh" && !e.area_id && e.email !== "admin@gqpeoplehub.demo");
    const uncategorizedEmployees = employeesByArea["uncategorized"]?.filter(e => e.role !== "admin_rrhh") || [];

    return (
        <div className="overflow-x-auto pb-12 pt-4 flex justify-center min-w-full">
            <div className="flex flex-col items-center gap-12 min-w-max px-8">
                {/* Root Level */}
                <div className="flex flex-col items-center gap-4 relative">
                    <div className="flex gap-4">
                        {rootEmployees.length > 0 ? rootEmployees.map(admin => (
                            <OrgCard key={admin.id} profile={admin} role="root" />
                        )) : (
                            <div className="p-4 border rounded-lg bg-muted text-muted-foreground font-medium text-sm">
                                Grupo Quattro
                            </div>
                        )}
                    </div>
                    {/* Connector */}
                    {(areas.length > 0 || uncategorizedEmployees.length > 0) && (
                        <div className="h-8 w-px bg-border absolute -bottom-8 left-1/2 -translate-x-1/2" />
                    )}
                </div>

                {/* Areas Level */}
                <div className="flex items-start gap-8 relative">
                    {/* Top Horizontal Line */}
                    <div className="absolute -top-4 left-10 right-10 h-px bg-border" />

                    {areas.map((area) => {
                        const areaEmployees = employeesByArea[area.id] || [];
                        const manager = areaEmployees.find(e => e.id === area.jefe_area_id);
                        const staff = areaEmployees.filter(e => e.id !== area.jefe_area_id);

                        return (
                            <div key={area.id} className="flex flex-col items-center gap-8 relative pt-4">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />

                                {/* Area Node */}
                                <div className="flex flex-col items-center gap-4 relative">
                                    <div className="text-sm font-bold bg-background px-3 py-1 rounded-full border shadow-sm z-10">
                                        {area.name}
                                    </div>

                                    {manager ? (
                                        <div className="relative">
                                            <OrgCard profile={manager} role="lead" />
                                            {staff.length > 0 && (
                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-64 p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                                            Sin Responsable
                                            {staff.length > 0 && (
                                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Staff */}
                                {staff.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4 pt-4 relative bg-muted/20 p-4 rounded-xl border border-dashed">
                                        {staff.map(employee => (
                                            <OrgCard key={employee.id} profile={employee} role="member" className="w-56 scale-95" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Uncategorized */}
                    {uncategorizedEmployees.length > 0 && (
                        <div className="flex flex-col items-center gap-8 relative pt-4">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />
                            <div className="text-sm font-bold bg-background px-3 py-1 rounded-full border shadow-sm z-10 text-muted-foreground">
                                Sin Área
                            </div>
                            <div className="grid grid-cols-1 gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                                {uncategorizedEmployees.map(employee => (
                                    <OrgCard key={employee.id} profile={employee} role="member" className="w-56 scale-95 opacity-80" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
