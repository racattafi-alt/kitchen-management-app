import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, ThermometerSnowflake, Flame } from "lucide-react";
import { toast } from "sonner";

export default function HACCP() {
  const [activeTab, setActiveTab] = useState("current");
  
  // Query scheda HACCP settimana corrente
  const { data: currentSheet, isLoading: loadingSheet } = trpc.haccpSheets.getCurrentWeek.useQuery();
  const { data: productionChecks, isLoading: loadingChecks, refetch: refetchChecks } = trpc.haccpSheets.getProductionChecks.useQuery(
    { sheetId: currentSheet?.id || "" },
    { enabled: !!currentSheet?.id }
  );
  
  // Query storico schede HACCP
  const { data: allSheets } = trpc.haccpSheets.getAll.useQuery();
  
  // Mutations
  const createSheet = trpc.haccpSheets.createSheet.useMutation({
    onSuccess: () => {
      toast.success("Scheda HACCP creata");
      window.location.reload();
    },
  });
  
  const createCheck = trpc.haccpSheets.createProductionCheck.useMutation({
    onSuccess: () => {
      toast.success("Controllo HACCP salvato");
      refetchChecks();
    },
  });
  
  const updateCheck = trpc.haccpSheets.updateProductionCheck.useMutation({
    onSuccess: () => {
      toast.success("Controllo HACCP aggiornato");
      refetchChecks();
    },
  });
  
  const updateSheet = trpc.haccpSheets.updateSheet.useMutation({
    onSuccess: () => {
      toast.success("Scheda HACCP aggiornata");
      window.location.reload();
    },
  });
  
  // Crea scheda HACCP per settimana corrente
  const handleCreateWeeklySheet = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lunedì
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Domenica
    weekEnd.setHours(23, 59, 59, 999);
    
    createSheet.mutate({
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
    });
  };
  
  // Completa scheda HACCP
  const handleCompleteSheet = () => {
    if (!currentSheet) return;
    updateSheet.mutate({
      id: currentSheet.id,
      status: "completed",
      completedAt: new Date(),
    });
  };
  
  // Gestione checkbox controlli temperatura
  const handleCheckboxChange = (checkId: string, field: string, value: boolean) => {
    updateCheck.mutate({
      id: checkId,
      [field]: value,
    });
  };
  
  // Gestione conformità
  const handleComplianceChange = (checkId: string, isCompliant: boolean, reason?: string, action?: string) => {
    updateCheck.mutate({
      id: checkId,
      isCompliant,
      nonComplianceReason: reason,
      correctiveAction: action,
    });
  };
  
  if (loadingSheet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Se non esiste scheda per settimana corrente
  if (!currentSheet) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Scheda HACCP Settimanale</CardTitle>
              <CardDescription>Nessuna scheda HACCP per la settimana corrente</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateWeeklySheet} disabled={createSheet.isPending}>
                {createSheet.isPending ? "Creazione..." : "Crea Scheda Settimana Corrente"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">HACCP - Controlli Settimanali</h1>
            <p className="text-gray-500 mt-1">
              Settimana dal {new Date(currentSheet.weekStartDate).toLocaleDateString("it-IT")} 
              {" "}al {new Date(currentSheet.weekEndDate).toLocaleDateString("it-IT")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={currentSheet.status === "completed" ? "default" : "secondary"}>
              {currentSheet.status === "draft" && <><Clock className="h-4 w-4 mr-1" /> Bozza</>}
              {currentSheet.status === "completed" && <><CheckCircle2 className="h-4 w-4 mr-1" /> Completata</>}
              {currentSheet.status === "approved" && <><CheckCircle2 className="h-4 w-4 mr-1" /> Approvata</>}
            </Badge>
            {currentSheet.status === "draft" && (
              <Button onClick={handleCompleteSheet} disabled={updateSheet.isPending}>
                Completa Scheda
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current">Controlli Settimana Corrente</TabsTrigger>
            <TabsTrigger value="history">Storico Schede</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4 mt-6">
            {loadingChecks ? (
              <p className="text-gray-500">Caricamento controlli...</p>
            ) : !productionChecks || productionChecks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nessun controllo HACCP per questa settimana. 
                  <br />
                  Conferma le produzioni nella sezione Produzione per creare i controlli.
                </CardContent>
              </Card>
            ) : (
              productionChecks.map((check) => (
                <Card key={check.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{check.recipeName}</CardTitle>
                        <CardDescription>
                          Quantità prodotta: {check.quantityProduced} kg
                        </CardDescription>
                      </div>
                      {check.isCompliant ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Conforme
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-4 w-4 mr-1" /> Non Conforme
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Controlli temperatura */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ThermometerSnowflake className="h-5 w-5" />
                        Controlli Temperatura
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`chill4-${check.id}`}
                          checked={check.chillTemp4C || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(check.id, "chillTemp4C", checked as boolean)
                          }
                        />
                        <label htmlFor={`chill4-${check.id}`} className="text-sm cursor-pointer">
                          Abbattimento 4°C completato
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`chill-20-${check.id}`}
                          checked={check.chillTempMinus20C || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(check.id, "chillTempMinus20C", checked as boolean)
                          }
                        />
                        <label htmlFor={`chill-20-${check.id}`} className="text-sm cursor-pointer">
                          Abbattimento -20°C completato
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`cooking-${check.id}`}
                          checked={check.cookingTempOk || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(check.id, "cookingTempOk", checked as boolean)
                          }
                        />
                        <label htmlFor={`cooking-${check.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                          <Flame className="h-4 w-4" />
                          Temperatura cottura OK
                        </label>
                      </div>
                    </div>
                    
                    {/* Modulo inadempienza */}
                    {!check.isCompliant && (
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Modulo Inadempienza
                        </h4>
                        <div>
                          <label className="text-sm font-medium">Descrizione problema</label>
                          <Textarea
                            value={check.nonComplianceReason || ""}
                            onChange={(e) =>
                              handleComplianceChange(
                                check.id,
                                false,
                                e.target.value,
                                check.correctiveAction || undefined
                              )
                            }
                            placeholder="Descrivi il problema riscontrato..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Azione correttiva applicata</label>
                          <Textarea
                            value={check.correctiveAction || ""}
                            onChange={(e) =>
                              handleComplianceChange(
                                check.id,
                                false,
                                check.nonComplianceReason || undefined,
                                e.target.value
                              )
                            }
                            placeholder="Descrivi l'azione correttiva..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                    
                    {check.checkedAt && (
                      <p className="text-xs text-gray-500 border-t pt-3">
                        Ultimo controllo: {new Date(check.checkedAt).toLocaleString("it-IT")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-6">
            {!allSheets || allSheets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nessuna scheda HACCP nello storico
                </CardContent>
              </Card>
            ) : (
              allSheets.map((sheet) => (
                <Card key={sheet.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          Settimana {new Date(sheet.weekStartDate).toLocaleDateString("it-IT")} 
                          {" - "}
                          {new Date(sheet.weekEndDate).toLocaleDateString("it-IT")}
                        </CardTitle>
                      </div>
                      <Badge variant={sheet.status === "approved" ? "default" : "secondary"}>
                        {sheet.status === "draft" && "Bozza"}
                        {sheet.status === "completed" && "Completata"}
                        {sheet.status === "approved" && "Approvata"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {sheet.notes && (
                    <CardContent>
                      <p className="text-sm text-gray-600">{sheet.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
