import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Shield, Plus, FileText } from "lucide-react";
import { toast } from "sonner";

export default function HACCP() {
  const { data: batches, isLoading: loadingBatches } = trpc.haccp.listBatches.useQuery();
  const { data: haccpRecords, isLoading: loadingHACCP } = trpc.haccp.listRecords.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">HACCP & Conformità</h1>
            <p className="text-slate-600 mt-1">Gestione lotti e schede HACCP</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Lotto
          </Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Lotti di Produzione
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBatches ? (
                <div className="text-center py-8">Caricamento...</div>
              ) : batches && batches.length > 0 ? (
                <div className="space-y-4">
                  {batches.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <p className="font-semibold">{item.batchCode}</p>
                      <p className="text-sm text-slate-500">Status: {item.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Nessun lotto registrato</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Schede HACCP
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHACCP ? (
                <div className="text-center py-8">Caricamento...</div>
              ) : haccpRecords && haccpRecords.length > 0 ? (
                <div className="space-y-4">
                  {haccpRecords.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <p className="font-semibold">{item.recipeName}</p>
                      <p className="text-sm text-slate-500">Batch: {item.batchId}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Nessuna scheda HACCP</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
