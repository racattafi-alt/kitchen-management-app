import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, ThermometerSnowflake, Flame, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function HACCP() {
  const [activeTab, setActiveTab] = useState("current");
  // Dialog non conformità
  const [ncDialogCheckId, setNcDialogCheckId] = useState<string | null>(null);
  const [ncDialogRecipeName, setNcDialogRecipeName] = useState<string>("");
  const [ncForm, setNcForm] = useState({ description: "", immediateAction: "", productTreatment: "" });
  const [showNcForm, setShowNcForm] = useState(false);

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
  
  // Non conformità
  const { data: ncList = [], refetch: refetchNc } = trpc.nonConformities.getByProductionCheck.useQuery(
    { productionCheckId: ncDialogCheckId! },
    { enabled: !!ncDialogCheckId }
  );
  const createNc = trpc.nonConformities.create.useMutation({
    onSuccess: () => {
      toast.success("Non conformità registrata");
      setNcForm({ description: "", immediateAction: "", productTreatment: "" });
      setShowNcForm(false);
      refetchNc();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenNcDialog = (checkId: string, recipeName: string) => {
    setNcDialogCheckId(checkId);
    setNcDialogRecipeName(recipeName);
    setShowNcForm(false);
    setNcForm({ description: "", immediateAction: "", productTreatment: "" });
  };

  const handleCreateNc = () => {
    if (!ncDialogCheckId || !ncForm.description.trim()) {
      toast.error("La descrizione è obbligatoria");
      return;
    }
    createNc.mutate({
      productionCheckId: ncDialogCheckId,
      recipeName: ncDialogRecipeName,
      description: ncForm.description,
      immediateAction: ncForm.immediateAction || undefined,
      productTreatment: ncForm.productTreatment || undefined,
    });
  };

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
      <div className="container mx-auto py-4 md:py-8">
        {/* Header mobile-responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">HACCP - Controlli Settimanali</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {new Date(currentSheet.weekStartDate).toLocaleDateString("it-IT")}
                {" — "}
                {new Date(currentSheet.weekEndDate).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-11 sm:ml-0">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg">{check.recipeName}</CardTitle>
                        <CardDescription>
                          Quantità prodotta: {check.quantityProduced} kg
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {check.isCompliant ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Conforme
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-4 w-4 mr-1" /> Non Conforme
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleOpenNcDialog(check.id, check.recipeName || "")}
                        >
                          <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                          Non Conformità
                        </Button>
                      </div>
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

      {/* Dialog Non Conformità */}
      <Dialog open={!!ncDialogCheckId} onOpenChange={(open) => { if (!open) { setNcDialogCheckId(null); setShowNcForm(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">
              Non Conformità — {ncDialogRecipeName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Lista NC esistenti */}
            {ncList.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Registrate ({ncList.length})</p>
                {ncList.map((nc: any) => (
                  <div key={nc.id} className="border rounded p-3 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={nc.status === "closed" ? "default" : nc.status === "open" ? "destructive" : "secondary"} className="text-xs">
                        {nc.status === "open" ? "Aperta" : nc.status === "in_progress" ? "In corso" : nc.status === "closed" ? "Chiusa" : nc.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(nc.detectedAt).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="font-medium">{nc.description}</p>
                    {nc.immediateAction && (
                      <p className="text-muted-foreground text-xs">Azione immediata: {nc.immediateAction}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna non conformità registrata</p>
            )}

            {/* Form nuova NC */}
            {showNcForm ? (
              <div className="border rounded-lg p-4 space-y-3 bg-red-50">
                <p className="text-sm font-semibold text-red-700">Nuova Non Conformità</p>
                <div className="space-y-1">
                  <Label className="text-xs">Descrizione problema *</Label>
                  <Textarea
                    value={ncForm.description}
                    onChange={(e) => setNcForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrivi il problema..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Azione immediata</Label>
                  <Input
                    value={ncForm.immediateAction}
                    onChange={(e) => setNcForm(prev => ({ ...prev, immediateAction: e.target.value }))}
                    placeholder="Azione correttiva immediata..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trattamento prodotto</Label>
                  <Input
                    value={ncForm.productTreatment}
                    onChange={(e) => setNcForm(prev => ({ ...prev, productTreatment: e.target.value }))}
                    placeholder="Come è stato trattato il prodotto..."
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowNcForm(false)} className="flex-1">
                    Annulla
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateNc}
                    disabled={createNc.isPending || !ncForm.description.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {createNc.isPending ? "Salvataggio..." : "Salva"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setShowNcForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registra nuova non conformità
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setNcDialogCheckId(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
