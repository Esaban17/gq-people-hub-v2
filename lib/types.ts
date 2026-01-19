export type UserRole = "admin_rrhh" | "jefe_area" | "empleado";
export type RequestStatus = "borrador" | "enviada" | "pendiente_jefe" | "pendiente_rrhh" | "aprobada" | "rechazada" | "cancelada";
export type AbsenceType = "vacaciones" | "dia_personal" | "enfermedad";
export type TaskStatus = "pendiente" | "en_progreso" | "completada";
export type TaskCategory = "rrhh" | "it" | "jefe_area";
export type DocumentCategory = "contrato" | "identificacion" | "fiscal" | "otro";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  area_id: string | null;
  position: string | null;
  hire_date: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string;
  description: string | null;
  jefe_area_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeOffBalance {
  id: string;
  user_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  carryover_days: number;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  user_id: string;
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  total_days: number;
  status: RequestStatus;
  employee_comment: string | null;
  approver_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProcess {
  id: string;
  employee_id: string;
  start_date: string;
  expected_completion_date: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTask {
  id: string;
  onboarding_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  responsible_id: string | null;
  due_date: string | null;
  status: TaskStatus;
  comments: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  category: DocumentCategory;
  uploaded_by: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_rrhh: "Admin RRHH",
  jefe_area: "Jefe de Area",
  empleado: "Empleado",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  pendiente_jefe: "Pendiente Jefe",
  pendiente_rrhh: "Pendiente RRHH",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacaciones: "Vacaciones",
  dia_personal: "Dia Personal",
  enfermedad: "Enfermedad",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completada: "Completada",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contrato: "Contrato",
  identificacion: "Identificación",
  fiscal: "Documento Fiscal",
  otro: "Otro",
};
