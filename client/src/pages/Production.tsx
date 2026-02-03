import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Production() {
  const { data: productions, isLoading } = trpc.production.list.useQuery({});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Produzione Settimanale</h1>
            <p className="text-slate-600 mt-1">Pianifica e gestisci la produzione</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Produzione
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Produzioni Pianificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : productions && productions.length > 0 ? (
              <div className="space-y-4">
                {productions.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <p className="font-semibold">Ricetta: {item.recipeFinalId}</p>
                    <p className="text-sm text-slate-500">Quantità: {item.desiredQuantity} - Status: {item.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessuna produzione pianificata</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
