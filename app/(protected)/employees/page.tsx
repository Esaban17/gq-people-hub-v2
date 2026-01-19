import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployeesView } from "@/components/employees/employees-view";
import { Profile, Area } from "@/lib/types";

export default async function EmployeesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Fetch user profile to check role
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role, area_id")
        .eq("id", user.id)
        .single();

    if (!userProfile) {
        return redirect("/login");
    }

    const { role } = userProfile;

    // Only Admin RRHH and Jefe de Area can access this page
    if (role !== "admin_rrhh" && role !== "jefe_area") {
        return redirect("/dashboard");
    }

    // Fetch all employees (base query)
    let { data: employees } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name") as { data: Profile[] | null };

    // Fetch all areas
    let { data: areas } = await supabase
        .from("areas")
        .select("*")
        .order("name") as { data: Area[] | null };

    if (!employees) employees = [];
    if (!areas) areas = [];

    // Filter for Jefe de Area
    if (role === "jefe_area") {
        if (!userProfile.area_id) {
            // If jefe has no area assigned, they technically see nothing or should see an error.
            // For now, return empty list to be safe.
            employees = [];
            areas = [];
        } else {
            // Filter employees to only those in the same area
            employees = employees.filter(e => e.area_id === userProfile.area_id);
            // Filter areas to only their area (so org chart is focused)
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
