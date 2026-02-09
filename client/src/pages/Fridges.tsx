import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Thermometer, Plus, Trash2, AlertTriangle, ClipboardList, Download } from "lucide-react";

export default function Fridges() {
  const [activeTab, setActiveTab] = useState("fridges");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBatchTempDialog, setShowBatchTempDialog] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"fridge" | "freezer">("fridge");
  const [location, setLocation] = useState<"kitchen" | "sala">("kitchen");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  
  // Batch temperature states
  const [batchTemps, setBatchTemps] = useState<Record<string, string>>({});
  
  // Filtri storico temperature
  const [filterFridgeId, setFilterFridgeId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const utils = trpc.useUtils();
  const { data: fridges = [], isLoading: loadingFridges } = trpc.fridges.getAll.useQuery();
  const { data: outOfRange = [] } = trpc.fridges.getOutOfRange.useQuery();
  
  // Query storico temperature con filtri
  const { data: allTemperatures = [], isLoading: loadingTemps } = trpc.fridges.getAllTemperatures.useQuery({
    fridgeId: filterFridgeId || undefined,
    startDate: filterStartDate ? new Date(filterStartDate) : undefined,
    endDate: filterEndDate ? new Date(filterEndDate) : undefined,
  });

  const createMutation = trpc.fridges.create.useMutation();
  const deleteMutation = trpc.fridges.delete.useMutation();
  const addTempMutation = trpc.fridges.addTemperature.useMutation();

  const resetForm = () => {
    setName("");
    setType("fridge");
    setLocation("kitchen");
    setMinTemp("");
    setMaxTemp("");
  };

  const handleCreateFridge = async () => {
    if (!name || !minTemp || !maxTemp) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        type,
        location,
        minTemp: minTemp,
        maxTemp: maxTemp,
      });
      toast.success("Frigo/Freezer creato!");
      setShowAddDialog(false);
      resetForm();
      utils.fridges.getAll.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleDeleteFridge = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo frigo/freezer?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Eliminato!");
      utils.fridges.getAll.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleBatchTemperatureSave = async () => {
    const entries = Object.entries(batchTemps).filter(([_, temp]) => temp && temp.trim() !== "");
    
    if (entries.length === 0) {
      toast.error("Inserisci almeno una temperatura");
      return;
    }

    try {
      await Promise.all(
        entries.map(([fridgeId, temperature]) =>
          addTempMutation.mutateAsync({
            fridgeId,
            date: new Date(),
            temperature,
          })
        )
      );
      
      toast.success(`${entries.length} temperature salvate!`);
      setShowBatchTempDialog(false);
      setBatchTemps({});
      utils.fridges.getAll.invalidate();
      utils.fridges.getOutOfRange.invalidate();
      utils.fridges.getAllTemperatures.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleExportExcel = () => {
    if (allTemperatures.length === 0) {
      toast.error("Nessun dato da esportare");
      return;
    }

    // Crea CSV
    const headers = ["Data", "Frigo", "Temperatura (°C)", "Note"];
    const rows = allTemperatures.map((temp: any) => [
      new Date(temp.date).toLocaleString("it-IT"),
      fridges.find((f: any) => f.id === temp.fridgeId)?.name || temp.fridgeId,
      temp.temperature,
      temp.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storico_temperature_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Export completato!");
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestione Frighi e Temperature</h1>
            <p className="text-muted-foreground">
              Anagrafica frighi/freezer, registrazione temperature, alert automatici
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBatchTempDialog(true)} variant="default">
              <ClipboardList className="h-4 w-4 mr-2" />
              Compila Temperature
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Frigo/Freezer
            </Button>
          </div>
        </div>

        {/* Alert temperature fuori range */}
        {outOfRange.length > 0 && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Alert: Temperature Fuori Range
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-300">
                {outOfRange.length} frigo/freezer con temperature anomale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outOfRange.map((alert: any) => (
                  <div key={alert.id} className="flex justify-between items-center">
                    <span className="font-medium">{alert.fridgeName}</span>
                    <Badge variant="destructive">{alert.temperature}°C</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fridges">Anagrafica Frighi</TabsTrigger>
            <TabsTrigger value="temperatures">Storico Temperature</TabsTrigger>
          </TabsList>

          {/* Tab Anagrafica Frighi */}
          <TabsContent value="fridges">
            <Card>
              <CardHeader>
                <CardTitle>Frighi e Freezer Attivi</CardTitle>
                <CardDescription>
                  Gestisci anagrafica frighi/freezer con range temperature
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFridges ? (
                  <p>Caricamento...</p>
                ) : fridges.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun frigo/freezer registrato. Clicca "Nuovo Frigo/Freezer" per iniziare.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Posizione</TableHead>
                        <TableHead>Range Temp.</TableHead>
                        <TableHead>Ultima Temp.</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fridges.map((fridge: any) => (
                        <TableRow key={fridge.id}>
                          <TableCell className="font-medium">{fridge.name}</TableCell>
                          <TableCell>
                            <Badge variant={fridge.type === "fridge" ? "default" : "secondary"}>
                              {fridge.type === "fridge" ? "Frigo" : "Freezer"}
                            </Badge>
                          </TableCell>
                          <TableCell>{fridge.location === "kitchen" ? "Cucina" : "Sala"}</TableCell>
                          <TableCell>{fridge.minTemp}°C ~ {fridge.maxTemp}°C</TableCell>
                          <TableCell>
                            {fridge.lastTemperature ? (
                              <Badge variant={fridge.isOutOfRange ? "destructive" : "outline"}>
                                {fridge.lastTemperature}°C
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/D</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFridge(fridge.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Storico Temperature */}
          <TabsContent value="temperatures">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Storico Temperature</CardTitle>
                    <CardDescription>
                      Visualizza tutte le temperature registrate con filtri per frigo e data
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportExcel} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtri */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label>Frigo/Freezer</Label>
                    <Select value={filterFridgeId} onValueChange={setFilterFridgeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tutti</SelectItem>
                        {fridges.map((fridge: any) => (
                          <SelectItem key={fridge.id} value={fridge.id}>
                            {fridge.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data Inizio</Label>
                    <Input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Fine</Label>
                    <Input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tabella */}
                {loadingTemps ? (
                  <p>Caricamento...</p>
                ) : allTemperatures.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessuna temperatura registrata. Usa "Compila Temperature" per iniziare.
                  </p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data e Ora</TableHead>
                          <TableHead>Frigo/Freezer</TableHead>
                          <TableHead>Temperatura</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTemperatures.map((temp: any) => {
                          const fridge = fridges.find((f: any) => f.id === temp.fridgeId);
                          const isOutOfRange = fridge && (
                            parseFloat(temp.temperature) < parseFloat(fridge.minTemp) ||
                            parseFloat(temp.temperature) > parseFloat(fridge.maxTemp)
                          );

                          return (
                            <TableRow key={temp.id}>
                              <TableCell>
                                {new Date(temp.date).toLocaleString("it-IT")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {fridge?.name || temp.fridgeId}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isOutOfRange ? "destructive" : "outline"}>
                                  {temp.temperature}°C
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {temp.notes || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Nuovo Frigo */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuovo Frigo/Freezer</DialogTitle>
              <DialogDescription>
                Aggiungi un nuovo frigo o freezer all'anagrafica
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Frigo Principale Cucina"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select value={type} onValueChange={(val) => setType(val as "fridge" | "freezer")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fridge">Frigo</SelectItem>
                    <SelectItem value="freezer">Freezer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Posizione *</Label>
                <Select value={location} onValueChange={(val) => setLocation(val as "kitchen" | "sala")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">Cucina</SelectItem>
                    <SelectItem value="sala">Sala</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minTemp">Temp. Minima (°C) *</Label>
                  <Input
                    id="minTemp"
                    type="number"
                    step="0.1"
                    value={minTemp}
                    onChange={(e) => setMinTemp(e.target.value)}
                    placeholder="es. 2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTemp">Temp. Massima (°C) *</Label>
                  <Input
                    id="maxTemp"
                    type="number"
                    step="0.1"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(e.target.value)}
                    placeholder="es. 6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateFridge}>Salva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Compilazione Batch Temperature */}
        <Dialog open={showBatchTempDialog} onOpenChange={setShowBatchTempDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compila Temperature</DialogTitle>
              <DialogDescription>
                Inserisci le temperature per tutti i frighi/freezer. Lascia vuoto per saltare.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {fridges.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nessun frigo/freezer disponibile. Crea prima un frigo.
                </p>
              ) : (
                fridges.map((fridge: any) => (
                  <div key={fridge.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="font-medium">{fridge.name}</Label>
                      <p className="text-sm text-muted-foreground">
                        {fridge.type === "fridge" ? "Frigo" : "Freezer"} • {fridge.location === "kitchen" ? "Cucina" : "Sala"} • Range: {fridge.minTemp}~{fridge.maxTemp}°C
                      </p>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="°C"
                        value={batchTemps[fridge.id] || ""}
                        onChange={(e) => setBatchTemps({ ...batchTemps, [fridge.id]: e.target.value })}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowBatchTempDialog(false);
                setBatchTemps({});
              }}>
                Annulla
              </Button>
              <Button onClick={handleBatchTemperatureSave} disabled={fridges.length === 0}>
                Salva Temperature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
