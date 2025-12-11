import { cookies } from "next/headers";
import { AdminWarningDays } from "@/components/admin-warning-days";

export default function WarningDaysPage() {
  // Supondo que o token JWT esteja salvo em cookie 'token' (ajuste conforme sua auth)
  const token = cookies().get("token")?.value || "";
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configuração de Warning (Admin)</h1>
      <AdminWarningDays token={token} />
    </main>
  );
}
