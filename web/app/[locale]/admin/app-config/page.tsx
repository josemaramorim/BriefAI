import { AdminAppConfig } from "@/components/admin-app-config";

export default function AppConfigPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configurações Gerais (AppConfig)</h1>
      <AdminAppConfig />
    </main>
  );
}
