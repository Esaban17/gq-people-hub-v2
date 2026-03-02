"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOnboardingProcess, getActiveEmployees } from "@/app/actions/onboarding-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import type { Profile, TaskCategory } from "@/lib/types";

const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  rrhh: "RRHH",
  it: "IT",
  jefe_area: "Jefe de Area",
};

const DEFAULT_TASKS: { title: string; category: TaskCategory; description: string }[] = [
  { title: "Configurar cuenta de correo", category: "it", description: "Crear y configurar correo corporativo" },
  { title: "Entregar equipo de trabajo", category: "it", description: "Laptop, mouse, teclado, etc." },
  { title: "Crear accesos a sistemas", category: "it", description: "VPN, herramientas internas" },
  { title: "Firmar contrato laboral", category: "rrhh", description: "Documentacion legal" },
  { title: "Registrar en nomina", category: "rrhh", description: "Alta en sistema de nominas" },
  { title: "Entregar credencial", category: "rrhh", description: "Credencial de empleado" },
  { title: "Reunion de bienvenida", category: "jefe_area", description: "Presentacion con el equipo" },
  { title: "Explicar responsabilidades", category: "jefe_area", description: "Roles y objetivos del puesto" },
];

interface NewTask {
  title: string;
  category: TaskCategory;
  description: string;
  due_date: string;
  responsible_id: string;
}

export default function NewOnboardingPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<NewTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      const data = await getActiveEmployees();
      setEmployees(data as Profile[]);
    };

    fetchEmployees();
  }, []);

  const addDefaultTasks = () => {
    const newTasks = DEFAULT_TASKS.map((task) => ({
      ...task,
      due_date: "",
      responsible_id: "",
    }));
    setTasks([...tasks, ...newTasks]);
  };

  const addCustomTask = () => {
    setTasks([
      ...tasks,
      {
        title: "",
        category: "rrhh",
        description: "",
        due_date: "",
        responsible_id: "",
      },
    ]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof NewTask, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !startDate) {
      setError("Por favor selecciona un empleado y fecha de inicio");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createOnboardingProcess({
      employee_id: selectedEmployee,
      start_date: startDate,
      expected_completion_date: expectedDate || null,
      notes: notes || null,
      tasks: tasks
        .filter((t) => t.title)
        .map((task) => ({
          title: task.title,
          category: task.category,
          description: task.description || null,
          due_date: task.due_date || null,
          responsible_id: task.responsible_id || null,
        })),
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/onboarding">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Onboarding</h1>
          <p className="text-muted-foreground">Crea un proceso de incorporacion para un nuevo empleado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion del Proceso</CardTitle>
            <CardDescription>Datos basicos del onboarding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Fecha Esperada de Finalizacion</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre el proceso..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas del Onboarding</CardTitle>
                <CardDescription>Define las tareas a completar durante el proceso</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addDefaultTasks}>
                  Agregar Plantilla
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addCustomTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Tarea
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        placeholder="Titulo de la tarea"
                        value={task.title}
                        onChange={(e) => updateTask(index, "title", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Select
                        value={task.category}
                        onValueChange={(value) => updateTask(index, "category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[]).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {TASK_CATEGORY_LABELS[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        placeholder="Fecha limite"
                        value={task.due_date}
                        onChange={(e) => updateTask(index, "due_date", e.target.value)}
                      />
                      <Select
                        value={task.responsible_id}
                        onValueChange={(value) => updateTask(index, "responsible_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Descripcion (opcional)"
                      value={task.description}
                      onChange={(e) => updateTask(index, "description", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay tareas agregadas</p>
                <p className="text-sm">Usa los botones de arriba para agregar tareas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Link href="/onboarding" className="flex-1">
            <Button type="button" variant="outline" className="w-full bg-transparent">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Onboarding"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
