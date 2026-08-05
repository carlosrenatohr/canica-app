# Plan de Implementación — Canica Design System v1

## Auditoría del Estado Actual

### Lo que existe hoy
- **3 componentes UI**: `Button`, `Input`, `Label` en `apps/web/src/components/ui/` (shadcn baseline)
- **packages/ui**: existe pero mínimo (solo `cn` utility)
- **globals.css**: solo `@import "tailwindcss"` — sin tokens, sin tema, sin dark mode
- **19 páginas**: login, signup, dashboard (placeholder), pacientes (5 páginas), citas (2), timeline, consultas (3), auditoría
- **Sidebar**: 3 links (Pacientes, Citas, Auditoría) — minimalista

### Gap contra el Design System (`docs/styles-design.md`)

| Aspecto | DS pide | Hoy existe |
|---|---|---|
| **Colores** | Medical Teal `#0F766E`, Indigo `#4F46E5`, success/warning/danger/info | Solo zinc/shadcn defaults |
| **Dark mode** | `#0B0F14` bg, `#121923` card, `#182230` elevated | No existe |
| **Typography** | Inter, escala Display→Caption, weights 400-700 | font-default (system) |
| **Radius** | Buttons 12px, inputs 14px, cards 18px, dialogs 24px | shadcn defaults (6-8px) |
| **Shadows** | `0 4px 12px rgb(0 0 0 / 6%)` — sutil, Apple-style | shadcn defaults |
| **Tokens semánticos** | `bg-primary`, `bg-surface`, `text-muted`, `border-default` | Inline colors (`bg-blue-500`) |
| **Layout** | Sidebar 72px/260px + Topbar + Content | Solo sidebar simple |
| **Cards** | Header/Body/Footer consistente | Tablas everywhere |
| **Empty states** | Ilustración + texto + CTA | "No hay datos" o vacío |
| **Loading** | Skeletons | Spinners o nada |
| **Motion** | 150-250ms ease-out | Sin animaciones |
| **Dashboard** | Role-based (Doctor/Receptionist/Admin) | Placeholder vacío |
| **HIPAA UX** | Avatar blur, PHI hidden, auto-lock, session timeout | No implementado |

---

## Plan de Implementación

### Fase 1: Foundation (tokens + theme + dark mode)

**Objetivo**: Establecer la base visual que todo lo demás consume.

#### 1.1 Token System (`apps/web/app/globals.css` + `apps/web/src/lib/tokens.css`)

```css
/* Light theme */
--bg: #FAFAFA;
--bg-surface: #FFFFFF;
--bg-secondary: #F5F7FA;
--border: #E5E7EB;
--text-primary: #111827;
--text-secondary: #6B7280;

/* Brand */
--primary: #0F766E;      /* Medical Teal */
--primary-hover: #115E59;
--primary-light: #CCFBF1;
--secondary: #4F46E5;    /* Indigo */
--success: #16A34A;
--warning: #D97706;
--danger: #DC2626;
--info: #0284C7;

/* Radius */
--radius-button: 12px;
--radius-input: 14px;
--radius-card: 18px;
--radius-dialog: 24px;

/* Shadows */
--shadow-sm: 0 1px 2px rgb(0 0 0 / 4%);
--shadow-md: 0 4px 12px rgb(0 0 0 / 6%);
--shadow-lg: 0 8px 24px rgb(0 0 0 / 8%);

/* Motion */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 250ms;
--easing: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */
```

#### 1.2 Dark Mode (Tailwind v4 `@media (prefers-color-scheme)` + `.dark` class)

```css
.dark {
  --bg: #0B0F14;
  --bg-surface: #121923;
  --bg-secondary: #182230;
  --border: #273244;
  --text-primary: #F9FAFB;
  --text-secondary: #94A3B8;
  /* Brand colors NEVER change */
}
```

#### 1.3 Typography (`apps/web/app/globals.css`)

- Importar Inter vía `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')`
- Definir escala: Display 40, H1 32, H2 24, H3 20, Body 16, Small 14, Caption 12
- Weight floor: 400-700 (no 800+)

#### 1.4 Componentes base actualizados

- `Button`: 4 variantes (Primary filled, Secondary outline, Ghost text, Danger red), radius 12px
- `Input`: radius 14px, padding generoso, labels siempre visibles (no floating)
- `Card`: nuevo — Header/Body/Footer, radius 18px, shadow sutil
- `Badge`: nuevo — para estados (success/warning/danger/info)
- `Skeleton`: nuevo — para loading states

---

### Fase 2: Layout System

**Objetivo**: Sidebar + Topbar + Content area.

#### 2.1 Sidebar redesign (`apps/web/src/components/layout/sidebar.tsx`)

- **Collapsed**: 72px (solo iconos)
- **Expanded**: 260px (iconos + labels)
- Toggle button
- Patient context visible when inside a chart
- Navigation: Dashboard, Pacientes, Citas, Consultas, Auditoría, Configuración
- Maximum 7 root sections

#### 2.2 Topbar (nuevo `apps/web/src/components/layout/topbar.tsx`)

- Search global
- Notifications bell
- Quick actions (Cmd+K)
- User menu (avatar, rol, logout)

#### 2.3 Content area

- Padding generoso (24-32px)
- Max-width constraint (1200px)
- Responsive: sidebar collapses on tablet, drawer on mobile

---

### Fase 3: Component Library (`packages/ui`)

**Objetivo**: Mover componentes compartidos a `packages/ui` para reusabilidad.

#### 3.1 Componentes a crear/migrar

| Componente | Variants | Notas |
|---|---|---|
| Button | Primary, Secondary, Ghost, Danger | Radius 12px, 44px click target |
| Input | Text, Email, Password, Search | Radius 14px, label always visible |
| Card | Default, Interactive, Elevated | Header/Body/Footer, radius 18px |
| Badge | Success, Warning, Danger, Info, Neutral | Para estados |
| Avatar | With image, Fallback initials | HIPAA: blur option |
| Dialog | Modal, Alert | Radius 24px |
| Select | Single, Multi | Consistent with Input |
| Table | Sortable, Filterable | Sticky header, hover, responsive collapse |
| Skeleton | Text, Card, Avatar | Para loading |
| Toast | Success, Error, Info | Para feedback |
| Tabs | Horizontal, Vertical | Para consultas (diagnósticos/prescripciones) |
| DropdownMenu | Actions, Navigation | Radix-based |
| Tooltip | Info, Validation | Keyboard accessible |
| Breadcrumb | Navigation | Para nested routes |
| Pagination | List navigation | Para pacientes/citas |
| EmptyState | Illustration + CTA | "No hay datos" → ilustración + acción |
| CommandPalette | Cmd+K search | Linear/Notion style |

#### 3.2 Estructura de packages/ui

```
packages/ui/
  src/
    tokens.css          ← design tokens
    components/
      button.tsx
      input.tsx
      card.tsx
      badge.tsx
      avatar.tsx
      dialog.tsx
      select.tsx
      table.tsx
      skeleton.tsx
      toast.tsx
      tabs.tsx
      dropdown-menu.tsx
      tooltip.tsx
      breadcrumb.tsx
      pagination.tsx
      empty-state.tsx
      command-palette.tsx
    lib/
      utils.ts          ← cn()
    index.ts            ← barrel export
```

---

### Fase 4: Page Redesigns

**Objetivo**: Aplicar design system a cada página existente.

#### 4.1 Login/Signup (`apps/web/app/login/page.tsx`, `signup/page.tsx`)

- Centered card, generous padding
- Medical Teal accent (logo area, button)
- Inter typography
- Subtle background gradient or pattern
- "Calm before Information" — minimal fields, clear CTA

#### 4.2 Dashboard (`apps/web/app/(dashboard)/page.tsx`)

- **Role-based layout** (ver DS: Doctor, Receptionist, Administrator)
- **Doctor**: Today's patients, next appointment, pending notes, alerts, recent results
- **Receptionist**: Today's schedule, check-ins, queue, payments
- **Administrator**: KPIs, users, clinics, activity, audit
- Cards with clear hierarchy (no tables for dashboard)
- Skeleton loading states

#### 4.3 Pacientes (`apps/web/app/(dashboard)/patients/`)

- **Lista**: Cards en vez de tabla (con avatar, nombre, última visita, estado)
- **Detalle**: Patient header siempre visible (nombre, edad, alergias), tabs (Resumen, Timeline, Consultas, Documentos)
- **Crear/Editar**: Formularios con spacing generoso, labels visibles, validación inline

#### 4.4 Citas (`apps/web/app/(dashboard)/appointments/`)

- **Lista**: Cards de citas (paciente, fecha, doctor, estado) — no tabla
- **Crear**: Calendar-like picker, doctor/time selection
- **Estado visual**: Badges coloreados por status

#### 4.5 Timeline (`apps/web/app/(dashboard)/patients/[id]/timeline/`)

- Vertical timeline visual (línea + puntos)
- Cards por evento (consulta, diagnóstico, prescripción)
- Timestamps claros
- Filtros por tipo de evento

#### 4.6 Consultas (`apps/web/app/(dashboard)/patients/[id]/consultations/`)

- **Detalle con tabs**: Diagnósticos, Prescripciones, Notas
- **Formulario**: Progressive disclosure (queja → historia → examen → evaluación → plan)
- **Finalizar**: Confirmation dialog con resumen

#### 4.7 Auditoría (`apps/web/app/(dashboard)/audit/`)

- Tabla (aquí sí, por la naturaleza de los datos)
- Sticky header, filtros, búsqueda
- Badges por acción (create/update/delete/export)
- Timestamps precisos

---

### Fase 5: HIPAA-Conscious UX

**Objetivo**: Privacidad visible en la interfaz.

- **Patient avatar**: Blur hasta que se abra el perfil
- **PHI en notificaciones**: Oculto por defecto (mostrar solo "Nueva consulta para [Paciente]")
- **Browser titles**: Sin PHI (`Canica — Consulta` en vez de `Consulta — María García`)
- **Auto-lock**: 5 min inactividad → modal de confirmación
- **Session timeout warning**: 30 seg antes de expirar
- **Audit visibility**: Indicador sutil de "acción being logged"
- **Role-aware navigation**: Solo mostrar secciones permitidas

---

### Fase 6: Empty States + Loading + Motion

#### 6.1 Empty States (por página)

| Página | Empty State |
|---|---|
| Pacientes | Ilustración de persona + "Agrega tu primer paciente" + Botón |
| Citas | Calendario vacío + "No hay citas hoy" + Botón |
| Consultas | Historial vacío + "Sin consultas registradas" |
| Auditoría | "Sin registros de auditoría" |
| Timeline | "Inicio del expediente" + Ilustración |

#### 6.2 Loading States

- **Skeleton** para listas (3-5 items)
- **Skeleton** para cards (avatar + 2 líneas)
- **Skeleton** para dashboard (4 cards + tabla)
- **Nunca**: spinners gigantes, "Cargando..."

#### 6.3 Motion

- Transiciones de página: 200ms ease-out
- Hover en cards: 150ms (scale 1.01 + shadow)
- Dialog open/close: 250ms ease-out
- Sidebar collapse: 200ms
- **Reduced motion**: Respetar `prefers-reduced-motion`

---

## Orden de Ejecución

| Fase | Dependencias | Esfuerzo estimado |
|---|---|---|
| **1. Foundation** | Ninguna | Alto (tokens + dark mode + typography) |
| **2. Layout** | Fase 1 | Medio (sidebar + topbar) |
| **3. Components** | Fase 1 | Alto (17 componentes) |
| **4. Pages** | Fases 1-3 | Alto (8+ páginas) |
| **5. HIPAA UX** | Fases 1-3 | Bajo (patrones puntuales) |
| **6. Empty/Loading/Motion** | Fases 1-3 | Medio (por página) |

**Recomendación**: Fase 1 → 2 → 3 (paralelo) → 4 → 5 → 6

---

## Research: Apps Similares (insights aplicados)

### Foresight Mental Health EHR Redesign
- **Insight**: Reorganizar por workflows, no por features. Dashboard role-aware.
- **Aplicación**: Canica dashboard debe ser role-based (Doctor/Receptionist/Admin).

### iKnowMed G2 (Oncology EHR)
- **Insight**: "Not a dumping ground of widgets, but a true entry point." Role-specific views.
- **Aplicación**: Dashboard como punto de entrada inteligente, no tabla genérica.

### ClyHealth (AI Healthcare)
- **Insight**: 3-level layered architecture (critical → detail → deep). "No user has to pass through all layers unless they choose to."
- **Aplicación**: Progressive disclosure en consultas (queja → historia → examen → plan).

### VP0 Patient EHR Chart
- **Insight**: "Patient header always visible. Vitals as trends with flags. Allergies prominent."
- **Aplicación**: Patient detail page con header sticky, alergias destacadas.

### Bahmni UX Redesign
- **Insight**: Split-screen view (patient history + consultation side-by-side). Modern stack.
- **Aplicación**: Consulta page podría usar layout split en desktop.

### PULSE Health Design System
- **Insight**: "Dark-first token architecture. Chart colors never confused for health status."
- **Aplicación**: Tokens semánticos separados de colores de datos clínicos.

### Skyfall Aegis (Free HealthTech UI Kit)
- **Insight**: HIPAA-aware patterns, consent screens, role-aware navigation.
- **Aplicación**: Directamente aplicable a Canica. Podría usar como referencia.

### MediFlow
- **Insight**: "Patient header with allergies pinned at top. Vitals as trend cards with week-over-week change."
- **Aplicación**: Patient detail con趋势 cards para signos vitales.

---

## Referencias

- Design System: `docs/styles-design.md`
- Specs: `.specs/design-system.md`
- Board: `board.md` → W6 (indexar codebase-memory)
- Research: Foresight, iKnowMed G2, ClyHealth, VP0, Bahmni, PULSE, Skyfall Aegis, MediFlow
