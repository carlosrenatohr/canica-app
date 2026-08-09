const ROLE_LABELS: Record<string, string> = {
  doctor: "Médico",
  receptionist: "Recepcionista",
  administrator: "Administrador",
  "clinic-owner": "Dueño de clínica",
  specialist: "Especialista",
  assistant: "Asistente",
};

export function getRoleLabel(role: string | undefined): string {
  if (!role) return "Usuario";
  return ROLE_LABELS[role] ?? role;
}
