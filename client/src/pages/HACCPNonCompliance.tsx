import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertTriangle, Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";

export default function HACCPNonCompliance() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedNC, setSelectedNC] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Form states per creazione
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [productTreatment, setProductTreatment] = useState("");
  
  // Form states per modifica
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [rootCauseCategory, setRootCauseCategory] = useState("");
  const [correctiveActionPlan, setCorrectiveActionPlan] = useState("");
  const [correctiveActionResponsible, setCorrectiveActionResponsible] = useState("");
  const [correctiveActionDeadline, setCorrectiveActionDeadline] = useState("");
  const [effectivenessVerification, setEffectivenessVerification] = useState("");
  const [verificationDate, setVerificationDate] = useState("");
  const [verificationEvidence, setVerificationEvidence] = useState("");
  const [status, setStatus] = useState<"open" | "in_progress" | "pending_verification" | "closed">("open");

  const utils = trpc.useUtils();
  const { data: nonConformities = [], isLoading } = trpc.nonConformities.getAll.useQuery();
  
  const createMutation = trpc.nonConformities.create.useMutation();
  const updateMutation = trpc.nonConformities.update.useMutation();
  const deleteMutation = trpc.nonConformities.delete.useMutation();

  const resetCreateForm = () => {
    setDescription("");
    setImmediateAction("");
    setProductTreatment("");
  };

  const resetEditForm = () => {
    setRootCauseAnalysis("");
    setRootCauseCategory("");
    setCorrectiveActionPlan("");
    setCorrectiveActionResponsible("");
    setCorrectiveActionDeadline("");
    setEffectivenessVerification("");
    setVerificationDate("");
    setVerificationEvidence("");
    setStatus("open");
  };

  const handleCreate = async () => {
    if (!description) {
      toast.error("Inserisci la descrizione della non conformità");
      return;
    }

    try {
      await createMutation.mutateAsync({
        description,
        immediateAction,
        productTreatment,
      });
      toast.success("Non conformità creata!");
      setShowCreateDialog(false);
      resetCreateForm();
      utils.nonConformities.getAll.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleOpenEdit = (nc: any) => {
    setSelectedNC(nc);
    setRootCauseAnalysis(nc.rootCauseAnalysis || "");
    setRootCauseCategory(nc.rootCauseCategory || "");
    setCorrectiveActionPlan(nc.correctiveActionPlan || "");
    setCorrectiveActionResponsible(nc.correctiveActionResponsible || "");
    setCorrectiveActionDeadline(nc.correctiveActionDeadline ? new Date(nc.correctiveActionDeadline).toISOString().split("T")[0] : "");
    setEffectivenessVerification(nc.effectivenessVerification || "");
    setVerificationDate(nc.verificationDate ? new Date(nc.verificationDate).toISOString().split("T")[0] : "");
    setVerificationEvidence(nc.verificationEvidence || "");
    setStatus(nc.status);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedNC) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedNC.id,
        rootCauseAnalysis,
        rootCauseCategory,
        correctiveActionPlan,
        correctiveActionResponsible,
        correctiveActionDeadline: correctiveActionDeadline ? new Date(correctiveActionDeadline) : undefined,
        effectivenessVerification,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        verificationEvidence,
        status,
      });
      toast.success("Non conformità aggiornata!");
      setShowEditDialog(false);
      resetEditForm();
      utils.nonConformities.getAll.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa non conformità?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Non conformità eliminata!");
      utils.nonConformities.getAll.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Aperta</Badge>;
      case "in_progress":
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />In Corso</Badge>;
      case "pending_verification":
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />In Verifica</Badge>;
      case "closed":
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300"><CheckCircle className="h-3 w-3" />Chiusa</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredNCs = nonConformities.filter((nc: any) => {
    if (activeTab === "all") return true;
    return nc.status === activeTab;
  });

  return (
    <DashboardLayout>
      <div className="container py-4 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestione Non Conformità HACCP</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Registro completo non conformità: temperature fuori range, produzioni non conformi, azioni correttive
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Nuova Non Conformità</span>
          </Button>
        </div>

        {/* Tabs filtro */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="all">Tutte ({nonConformities.length})</TabsTrigger>
            <TabsTrigger value="open">Aperte ({nonConformities.filter((nc: any) => nc.status === "open").length})</TabsTrigger>
            <TabsTrigger value="in_progress" className="hidden md:inline-flex">In Corso ({nonConformities.filter((nc: any) => nc.status === "in_progress").length})</TabsTrigger>
            <TabsTrigger value="pending_verification" className="hidden md:inline-flex">In Verifica ({nonConformities.filter((nc: any) => nc.status === "pending_verification").length})</TabsTrigger>
            <TabsTrigger value="closed">Chiuse ({nonConformities.filter((nc: any) => nc.status === "closed").length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Caricamento...</p>
            </CardContent>
          </Card>
        ) : filteredNCs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessuna non conformità {activeTab !== "all" ? `in stato "${activeTab}"` : "registrata"}</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Le non conformità vengono create automaticamente quando:
                </p>
                <ul className="text-xs md:text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                  <li>• Una produzione viene marcata come "Non Conforme" nei controlli HACCP</li>
                  <li>• Una temperatura frigo/freezer è fuori range</li>
                  <li>• Viene registrata manualmente una non conformità</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredNCs.map((nc: any) => (
              <Card key={nc.id}>
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                        <span className="truncate">{nc.ncCode}</span>
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm mt-1">
                        {new Date(nc.date).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })}
                        {nc.recipeName && ` • ${nc.recipeName}`}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rilevata da: {nc.detectedByUserName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(nc.status)}
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(nc)}>
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline ml-2">Modifica</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(nc.id)}>
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs md:text-sm font-medium">Descrizione Non Conformità:</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{nc.description}</p>
                    </div>
                    {nc.immediateAction && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Azione Immediata:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{nc.immediateAction}</p>
                      </div>
                    )}
                    {nc.productTreatment && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Trattamento Prodotto:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{nc.productTreatment}</p>
                      </div>
                    )}
                    {nc.rootCauseAnalysis && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Analisi Causa Radice:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{nc.rootCauseAnalysis}</p>
                      </div>
                    )}
                    {nc.correctiveActionPlan && (
                      <div>
                        <p className="text-xs md:text-sm font-medium">Piano Azione Correttiva:</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{nc.correctiveActionPlan}</p>
                        {nc.correctiveActionResponsible && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Responsabile: {nc.correctiveActionResponsible}
                            {nc.correctiveActionDeadline && ` • Scadenza: ${new Date(nc.correctiveActionDeadline).toLocaleDateString("it-IT")}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Creazione */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Non Conformità HACCP</DialogTitle>
            <DialogDescription>
              Registra una nuova non conformità rilevata nei controlli HACCP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descrizione Non Conformità *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi dettagliatamente la non conformità rilevata..."
                rows={4}
                className="text-sm md:text-base"
              />
            </div>
            <div>
              <Label htmlFor="immediateAction">Azione Immediata Intrapresa</Label>
              <Textarea
                id="immediateAction"
                value={immediateAction}
                onChange={(e) => setImmediateAction(e.target.value)}
                placeholder="Descrivi l'azione immediata intrapresa per contenere il problema..."
                rows={3}
                className="text-sm md:text-base"
              />
            </div>
            <div>
              <Label htmlFor="productTreatment">Trattamento del Prodotto</Label>
              <Textarea
                id="productTreatment"
                value={productTreatment}
                onChange={(e) => setProductTreatment(e.target.value)}
                placeholder="Descrivi come è stato trattato il prodotto non conforme (scarto, rilavorazione, ecc.)..."
                rows={3}
                className="text-sm md:text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending ? "Creazione..." : "Crea Non Conformità"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-full md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Non Conformità: {selectedNC?.ncCode}</DialogTitle>
            <DialogDescription>
              Completa l'analisi causa radice, piano correttivo e verifica efficacia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sezione 1: Analisi Causa Radice */}
            <div className="border-b pb-4">
              <h3 className="text-sm md:text-base font-semibold mb-3">1. Analisi Causa Radice</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="rootCauseAnalysis">Analisi Causa Radice</Label>
                  <Textarea
                    id="rootCauseAnalysis"
                    value={rootCauseAnalysis}
                    onChange={(e) => setRootCauseAnalysis(e.target.value)}
                    placeholder="Analizza la causa radice del problema (5 Perché, Ishikawa, ecc.)..."
                    rows={3}
                    className="text-sm md:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="rootCauseCategory">Categoria Causa Radice</Label>
                  <Select value={rootCauseCategory} onValueChange={setRootCauseCategory}>
                    <SelectTrigger id="rootCauseCategory" className="text-sm md:text-base">
                      <SelectValue placeholder="Seleziona categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metodo">Metodo</SelectItem>
                      <SelectItem value="materiale">Materiale</SelectItem>
                      <SelectItem value="macchina">Macchina/Attrezzatura</SelectItem>
                      <SelectItem value="manodopera">Manodopera</SelectItem>
                      <SelectItem value="ambiente">Ambiente</SelectItem>
                      <SelectItem value="misurazione">Misurazione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sezione 2: Piano Azione Correttiva */}
            <div className="border-b pb-4">
              <h3 className="text-sm md:text-base font-semibold mb-3">2. Piano Azione Correttiva</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="correctiveActionPlan">Piano Azione Correttiva</Label>
                  <Textarea
                    id="correctiveActionPlan"
                    value={correctiveActionPlan}
                    onChange={(e) => setCorrectiveActionPlan(e.target.value)}
                    placeholder="Descrivi il piano d'azione per eliminare la causa radice e prevenire ricorrenze..."
                    rows={3}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="correctiveActionResponsible">Responsabile Azione</Label>
                    <Input
                      id="correctiveActionResponsible"
                      value={correctiveActionResponsible}
                      onChange={(e) => setCorrectiveActionResponsible(e.target.value)}
                      placeholder="Nome responsabile..."
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="correctiveActionDeadline">Scadenza Azione</Label>
                    <Input
                      id="correctiveActionDeadline"
                      type="date"
                      value={correctiveActionDeadline}
                      onChange={(e) => setCorrectiveActionDeadline(e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione 3: Verifica Efficacia */}
            <div className="border-b pb-4">
              <h3 className="text-sm md:text-base font-semibold mb-3">3. Verifica Efficacia</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="effectivenessVerification">Verifica Efficacia</Label>
                  <Textarea
                    id="effectivenessVerification"
                    value={effectivenessVerification}
                    onChange={(e) => setEffectivenessVerification(e.target.value)}
                    placeholder="Descrivi come è stata verificata l'efficacia dell'azione correttiva..."
                    rows={3}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="verificationDate">Data Verifica</Label>
                    <Input
                      id="verificationDate"
                      type="date"
                      value={verificationDate}
                      onChange={(e) => setVerificationDate(e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verificationEvidence">Evidenza Verifica</Label>
                    <Input
                      id="verificationEvidence"
                      value={verificationEvidence}
                      onChange={(e) => setVerificationEvidence(e.target.value)}
                      placeholder="Es: Report, foto, misurazioni..."
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stato */}
            <div>
              <Label htmlFor="status">Stato Non Conformità</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger id="status" className="text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aperta</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="pending_verification">In Verifica</SelectItem>
                  <SelectItem value="closed">Chiusa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Annulla
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
