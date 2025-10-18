import { getClients } from "@/lib/actions/clients";
import { DataTable } from "@/app/components/clients/data-table";

export default async function ClientsPage() {
  const result = await getClients();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Erreur lors du chargement des clients
            </p>
          </div>
        </div>
        <div className="text-red-500">Erreur: {result.error}</div>
      </div>
    );
  }

  const clients = result.data || [];

  return (
    <div className="h-full w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients et leurs informations
          </p>
        </div>
      </div>
      <DataTable data={clients} />
    </div>
  );
}
