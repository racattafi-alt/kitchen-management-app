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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Thermometer, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

export default function Fridges() {
  const [activeTab, setActiveTab] = useState("fridges");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTempDialog, setShowTempDialog] = useState(false);
  const [selectedFridge, setSelectedFridge] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"fridge" | "freezer">("fridge");
  const [location, setLocation] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [temperature, setTemperature] = useState("");

  const utils = trpc.useUtils();
  const { data: fridges = [], isLoading: loadingFridges } = trpc.fridges.getAll.useQuery();
  const { data: outOfRange = [] } = trpc.fridges.getOutOfRange.useQuery();

  const createMutation = trpc.fridges.create.useMutation();
  const updateMutation = trpc.fridges.update.useMutation();
  const deleteMutation = trpc.fridges.delete.useMutation();
  const addTempMutation = trpc.fridges.addTemperature.useMutation();

  const resetForm = () => {
    setName("");
    setType("fridge");
    setLocation("");
    setMinTemp("");
    setMaxTemp("");
    setTemperature("");
    setSelectedFridge(null);
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
        location: (location || 'kitchen') as 'kitchen' | 'sala',
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

  const handleAddTemperature = async () => {
    if (!selectedFridge || !temperature) {
      toast.error("Inserisci la temperatura");
      return;
    }

    try {
      await addTempMutation.mutateAsync({
        fridgeId: selectedFridge.id,
        date: new Date(),
        temperature: temperature,
      });
      toast.success("Temperatura registrata!");
      setShowTempDialog(false);
      setTemperature("");
      setSelectedFridge(null);
      utils.fridges.getOutOfRange.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestione Frighi e Freezer</h1>
          <p className="text-muted-foreground">
            Monitora temperature e mantieni conformità HACCP
          </p>
        </div>

        {/* Alert temperature fuori range */}
        {outOfRange.length > 0 && (
          <Card className="mb-6 border-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-orange-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                ⚠️ {outOfRange.length} Temperature Fuori Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outOfRange.map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <div>
                      <span className="font-medium">{log.fridgeName}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="destructive">
                      {log.temperature}°C (Range: {log.minTemp}°C - {log.maxTemp}°C)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="fridges">
              <Thermometer className="w-4 h-4 mr-2" />
              Anagrafica Frighi
            </TabsTrigger>
            <TabsTrigger value="temperatures">
              <Thermometer className="w-4 h-4 mr-2" />
              Registra Temperature
            </TabsTrigger>
          </TabsList>

          {/* TAB: Anagrafica Frighi */}
          <TabsContent value="fridges">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Frighi e Freezer</CardTitle>
                    <CardDescription>Gestisci anagrafica e range temperature</CardDescription>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetForm()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Aggiungi Frigo/Freezer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nuovo Frigo/Freezer</DialogTitle>
                        <DialogDescription>
                          Inserisci i dati del nuovo frigo o freezer
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nome *</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="es. Frigo Cucina 1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="type">Tipo *</Label>
                          <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fridge">Frigo (+4°C)</SelectItem>
                              <SelectItem value="freezer">Freezer (-20°C)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="location">Posizione</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="es. Cucina principale"
                          />
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
                              placeholder={type === 'fridge' ? '0' : '-25'}
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
                              placeholder={type === 'fridge' ? '8' : '-15'}
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Annulla
                        </Button>
                        <Button onClick={handleCreateFridge}>
                          Crea
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFridges ? (
                  <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
                ) : fridges.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nessun frigo/freezer configurato. Clicca "Aggiungi" per iniziare.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Posizione</TableHead>
                        <TableHead>Range Temperatura</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fridges.map((fridge: any) => (
                        <TableRow key={fridge.id}>
                          <TableCell className="font-medium">{fridge.name}</TableCell>
                          <TableCell>
                            <Badge variant={fridge.type === 'fridge' ? 'default' : 'secondary'}>
                              {fridge.type === 'fridge' ? 'Frigo' : 'Freezer'}
                            </Badge>
                          </TableCell>
                          <TableCell>{fridge.location || "-"}</TableCell>
                          <TableCell>
                            {fridge.minTemp}°C - {fridge.maxTemp}°C
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFridge(fridge.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Registra Temperature */}
          <TabsContent value="temperatures">
            <Card>
              <CardHeader>
                <CardTitle>Registrazione Temperature</CardTitle>
                <CardDescription>
                  Inserisci le temperature giornaliere per ciascun frigo/freezer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fridges.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nessun frigo/freezer configurato. Vai alla tab "Anagrafica" per aggiungerne uno.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fridges.map((fridge: any) => (
                      <Card key={fridge.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{fridge.name}</CardTitle>
                          <CardDescription>
                            {fridge.type === 'fridge' ? 'Frigo' : 'Freezer'} • {fridge.location || 'N/A'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Range: {fridge.minTemp}°C - {fridge.maxTemp}°C
                            </p>
                            <Dialog open={showTempDialog && selectedFridge?.id === fridge.id} onOpenChange={(open) => {
                              setShowTempDialog(open);
                              if (!open) setSelectedFridge(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  className="w-full"
                                  onClick={() => setSelectedFridge(fridge)}
                                >
                                  <Thermometer className="w-4 h-4 mr-2" />
                                  Registra Temperatura
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registra Temperatura: {fridge.name}</DialogTitle>
                                  <DialogDescription>
                                    Range previsto: {fridge.minTemp}°C - {fridge.maxTemp}°C
                                  </DialogDescription>
                                </DialogHeader>

                                <div>
                                  <Label htmlFor="temp">Temperatura (°C)</Label>
                                  <Input
                                    id="temp"
                                    type="number"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                    placeholder="es. 4.5"
                                    autoFocus
                                  />
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setShowTempDialog(false);
                                    setTemperature("");
                                    setSelectedFridge(null);
                                  }}>
                                    Annulla
                                  </Button>
                                  <Button onClick={handleAddTemperature}>
                                    Salva
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
