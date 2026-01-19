"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Send, Save } from "lucide-react";
import Link from "next/link";
import type { AbsenceType } from "@/lib/types";
import { ABSENCE_TYPE_LABELS } from "@/lib/types";

export default function NewTimeOffRequestPage() {
  const [absenceType, setAbsenceType] = useState<AbsenceType>("vacaciones");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (status: "borrador" | "enviada") => {
    if (!startDate || !endDate) {
      setError("Por favor selecciona las fechas");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Debes iniciar sesion");
      setIsLoading(false);
      return;
    }

    // Fetch profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin_rrhh") {
      setError("Los administradores de RRHH no pueden solicitar vacaciones.");
      setIsLoading(false);
      return;
    }

    const totalDays = calculateDays();

    // Determine initial status if sending
    let finalStatus: string = status;
    if (status === "enviada") {
      finalStatus = profile?.role === "jefe_area" ? "pendiente_rrhh" : "pendiente_jefe";
    }

    const { error: insertError } = await supabase
      .from("time_off_requests")
      .insert({
        user_id: user.id,
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        status: finalStatus as any,
        employee_comment: comment || null,
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
    } else {
      router.push("/time-off");
      router.refresh();
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/time-off">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Solicitud</h1>
          <p className="text-muted-foreground">Crea una nueva solicitud de tiempo libre</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Solicitud</CardTitle>
          <CardDescription>Completa los datos de tu solicitud de ausencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="absenceType">Tipo de Ausencia</Label>
            <Select value={absenceType} onValueChange={(value) => setAbsenceType(value as AbsenceType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {ABSENCE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Total de dias solicitados: <span className="text-lg">{calculateDays()}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">Comentarios (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Agrega cualquier informacion adicional..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit("borrador")}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Borrador
            </Button>
            <Button
              onClick={() => handleSubmit("enviada")}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Solicitud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
