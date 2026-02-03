import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Storage() {
  const { data: files, isLoading } = trpc.storage.list.useQuery({});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Archivio Cloud</h1>
            <p className="text-slate-600 mt-1">Documenti, certificati e foto lotti</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Upload className="h-4 w-4 mr-2" />
            Carica File
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              File Archiviati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : files && files.length > 0 ? (
              <div className="space-y-4">
                {files.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.fileKey}</p>
                      <p className="text-sm text-slate-500">Tipo: {item.documentType}</p>
                    </div>
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Visualizza</a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessun file archiviato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
