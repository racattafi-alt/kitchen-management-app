import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Waste() {
  const { data: wasteRecords, isLoading } = trpc.waste.list.useQuery({});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Waste Management</h1>
            <p className="text-slate-600 mt-1">Tracciamento scarti di produzione e servizio</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plus className="h-4 w-4 mr-2" />
            Registra Scarto
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Registro Scarti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : wasteRecords && wasteRecords.length > 0 ? (
              <div className="space-y-4">
                {wasteRecords.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <p className="font-semibold">Componente: {item.componentId}</p>
                    <p className="text-sm text-slate-500">Tipo: {item.wasteType} - {item.wastePercentage}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessuno scarto registrato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
