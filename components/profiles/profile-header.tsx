"use client";

import { Profile, Area, ROLE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Calendar, Cake } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvatarUpload } from "./avatar-upload";
import { EditProfileDialog } from "./edit-profile-dialog";

interface ProfileHeaderProps {
    profile: Profile;
    area?: Area | null;
}

export function ProfileHeader({ profile, area }: ProfileHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b">
            <AvatarUpload
                userId={profile.id}
                currentAvatarUrl={profile.avatar_url}
                fullName={profile.full_name}
            />
            <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                    <h1 className="text-3xl font-bold text-foreground">
                        {profile.full_name}
                    </h1>
                    <Badge variant="secondary" className="capitalize">
                        {ROLE_LABELS[profile.role]}
                    </Badge>
                    {!profile.is_active && (
                        <Badge variant="destructive">Inactivo</Badge>
                    )}
                </div>
                <p className="text-xl text-muted-foreground font-medium">
                    {profile.position || "Posición no definida"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{profile.email}</span>
                    </div>
                    {area && (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{area.name}</span>
                        </div>
                    )}
                    {profile.hire_date && (
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span suppressHydrationWarning>
                                Ingreso: {format(new Date(profile.hire_date), "PPP", { locale: es })}
                            </span>
                        </div>
                    )}
                    {profile.birth_date && (
                        <div className="flex items-center gap-2">
                            <Cake className="h-4 w-4" />
                            <span suppressHydrationWarning>
                                Cumpleaños: {format(new Date(profile.birth_date), "d 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                    )}
                </div>
                <div className="pt-4">
                    <EditProfileDialog profile={profile} />
                </div>
            </div>
        </div>
    );
}
