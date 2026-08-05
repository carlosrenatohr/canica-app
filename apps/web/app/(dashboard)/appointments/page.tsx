"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startDate: string;
  endDate?: string | null;
  status: "scheduled" | "confirmed" | "checked-in" | "completed" | "cancelled" | "no-show";
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<Appointment["status"], string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  "checked-in": "Registrada",
  completed: "Completada",
  cancelled: "Cancelada",
  "no-show": "No asistió",
};

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  "checked-in": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-gray-100 text-gray-800",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [providers, setProviders] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/appointments")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAppointments(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const uniquePatientIds = [...new Set(appointments.map((a) => a.patientId))];
    const uniqueProviderIds = [...new Set(appointments.map((a) => a.providerId))];
    Promise.all([
      ...uniquePatientIds.map((id) => fetch(`/api/patients/${id}`).then((r) => r.json())),
      ...uniqueProviderIds.map((id) => fetch(`/api/me`).then((r) => r.json())),
    ]).then((results) => {
      const patientResults = results.slice(0, uniquePatientIds.length);
      patientResults.forEach((r, i) => {
        if (r.data) setPatients((p) => ({ ...p, [uniquePatientIds[i]]: r.data }));
      });
    });
  }, [session, appointments]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para ver las citas.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando citas…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Citas</h1>
        <Button onClick={() => router.push("/appointments/new")}>Nueva cita</Button>
      </div>
      {appointments.length === 0 ? (
        <p className="text-muted-foreground">No hay citas programadas.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2">Fecha</th>
              <th className="text-left py-2">Paciente</th>
              <th className="text-left py-2">Estado</th>
              <th className="text-left py-2">Razón</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => {
              const patient = patients[a.patientId];
              return (
                <tr key={a.id} className="border-t">
                  <td className="py-2">
                    {new Date(a.startDate).toLocaleString("es-ES")}
                  </td>
                  <td className="py-2">
                    {patient ? `${patient.firstName} ${patient.lastName}` : a.patientId}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[a.status]}`}>
                      {statusLabels[a.status]}
                    </span>
                  </td>
                  <td className="py-2">{a.reason || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
