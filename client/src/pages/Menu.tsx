import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Menu() {
  const { data: menuTypes, isLoading } = trpc.menu.listTypes.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Menu Engine</h1>
            <p className="text-slate-600 mt-1">Gestisci menu e calcola food cost</p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Menu
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-teal-600" />
              Tipi di Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : menuTypes && menuTypes.length > 0 ? (
              <div className="space-y-4">
                {menuTypes.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-slate-500">Tipo: {item.serviceType}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessun menu configurato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
