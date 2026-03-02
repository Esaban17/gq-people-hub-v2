# GQ People Hub

Sistema interno de gestión de Recursos Humanos para GQ, construido con Next.js 16, React 19 y TypeScript.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Radix UI + Tailwind CSS 4 + shadcn/ui |
| Auth | NextAuth.js v5 (Credentials) |
| ORM | Prisma 7 (MariaDB adapter) |
| Base de datos | MariaDB / MySQL |
| Almacenamiento | AWS S3 (avatares, documentos) |
| Despliegue | On-premise (VMs en datacenter propio) |
| Validación | Zod + React Hook Form |
| Charts | Recharts |
| Package Manager | pnpm |

## Módulos

- **Dashboard** — Métricas generales, resumen de actividad reciente
- **Empleados** — CRUD de empleados, perfiles, asignación de áreas
- **Time Off** — Solicitudes de ausencia (vacaciones, día personal, enfermedad), flujo de aprobación multi-nivel
- **Onboarding** — Procesos de incorporación con tareas asignables por categoría (RRHH, IT, Jefe de área)
- **Calendario** — Vista de eventos y ausencias
- **Perfil** — Configuración personal, cambio de avatar

## Modelo de datos

Definido en `prisma/schema.prisma`:

- **User** — Empleados con roles (`admin_rrhh`, `jefe_area`, `empleado`)
- **Area** — Departamentos con jefe asignado
- **TimeOffBalance** — Saldo anual de días por empleado
- **TimeOffRequest** — Solicitudes con flujo de estados (`borrador` → `enviada` → `aprobada`/`rechazada`)
- **OnboardingProcess** — Proceso de incorporación vinculado a empleado
- **OnboardingTask** — Tareas del onboarding con categoría y responsable
- **EmployeeDocument** — Documentos almacenados en AWS S3 (contrato, identificación, fiscal)
- **Notification** — Notificaciones internas

## Autenticación

NextAuth.js v5 con provider de credenciales (email + contraseña hasheada con bcrypt). El middleware protege todas las rutas bajo `/(protected)/` y redirige a `/login` si no hay sesión activa.

Roles disponibles:
- `admin_rrhh` — Acceso total
- `jefe_area` — Gestión de su área y aprobación de solicitudes
- `empleado` — Acceso a su perfil y solicitudes propias

## Requisitos previos

- Node.js 18+
- pnpm
- MariaDB o MySQL
- Cuenta AWS con bucket S3 configurado

## Variables de entorno

Crear un archivo `.env` en la raíz:

```env
# Base de datos
DATABASE_URL="mysql://user:password@host:port/database"

# NextAuth
AUTH_SECRET="tu-secret-generado"
AUTH_URL="https://tu-dominio-interno.ejemplo.com"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="nombre-del-bucket"
```

## Instalación

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push    # sincronizar esquema con la BD
pnpm dev
```

La app estará disponible en `http://localhost:3000`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm prisma studio` | UI para explorar la BD |
| `pnpm prisma generate` | Generar cliente Prisma |
| `pnpm prisma db push` | Sincronizar esquema con BD |

## Estructura del proyecto

```
app/
├── (protected)/          # Rutas protegidas por auth
│   ├── dashboard/
│   ├── employees/
│   ├── time-off/
│   ├── onboarding/
│   ├── calendar/
│   ├── profile/
│   └── layout.tsx        # Layout con sidebar
├── actions/              # Server actions
├── api/auth/             # NextAuth route handler
├── login/
└── page.tsx              # Landing → redirect
components/               # Componentes UI (shadcn/ui)
lib/
├── auth.ts               # Configuración NextAuth
├── prisma.ts             # Cliente Prisma singleton
├── s3.ts                 # Utilidades AWS S3
├── actions/              # Server actions de dominio
└── generated/prisma/     # Cliente Prisma generado
prisma/
└── schema.prisma         # Esquema de la BD
middleware.ts             # Protección de rutas
```
