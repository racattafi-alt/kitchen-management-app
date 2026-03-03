import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProductionNew() {
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("plan");

  const utils = trpc.useUtils();
  const { data: finalRecipes, isLoading } = trpc.finalRecipes.list.useQuery();
  
  // Query storico produzioni
  const { data: productions, isLoading: isLoadingProductions } = trpc.production.list.useQuery(
    { weekStartDate: new Date(weekStartDate) }
  );
  
  const confirmProductionMutation = trpc.production.confirmWeeklyProduction.useMutation({
    onSuccess: () => {
      utils.production.list.invalidate();
      utils.production.listWeekly.invalidate();
      toast.success("Produzioni settimanali confermate con successo");
      setQuantities({});
      setActiveTab("history");
    },
    onError: (error: any) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.production.delete.useMutation({
    onSuccess: () => {
      utils.production.list.invalidate();
      utils.production.listWeekly.invalidate();
      toast.success("Produzione eliminata");
    },
    onError: (error: any) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa produzione?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filtra ricette attive e vendibili
  const filteredRecipes = useMemo(() => {
    if (!finalRecipes) return [];
    const search = searchQuery.toLowerCase();
    return finalRecipes
      .filter((r: any) => r.isActive !== false && r.isSellable === true)
      .filter((r: any) => 
        !search || 
        r.name.toLowerCase().includes(search) || 
        r.code.toLowerCase().includes(search)
      );
  }, [finalRecipes, searchQuery]);

  const handleQuantityChange = (recipeId: string, value: string) => {
    setQuantities(prev => ({
      ...prev,
      [recipeId]: value
    }));
  };

  const handleConfirmProduction = () => {
    // Filtra solo ricette con quantità > 0
    const productions = Object.entries(quantities)
      .filter(([_, qty]) => qty && parseFloat(qty) > 0)
      .map(([recipeId, qty]) => ({
        recipeFinalId: recipeId,
        quantity: parseFloat(qty)
      }));

    if (productions.length === 0) {
      toast.error("Inserisci almeno una quantità per confermare le produzioni");
      return;
    }

    confirmProductionMutation.mutate({
      weekStartDate: new Date(weekStartDate),
      productions
    });
  };

  const totalRecipesWithQuantity = Object.values(quantities).filter(q => q && parseFloat(q) > 0).length;

  return (
    <DashboardLayout>
      <div className="container pt-6 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Pianificazione Produzione</h1>
            <p className="text-muted-foreground mt-2">
              Inserisci le quantità da produrre per ogni ricetta
            </p>
          </div>
        </div>

        {/* Tabs Pianifica / Storico */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="plan">Pianifica Produzione</TabsTrigger>
            <TabsTrigger value="history">Storico Produzioni</TabsTrigger>
          </TabsList>
          
          {/* TAB: Pianifica Produzione */}
          <TabsContent value="plan" className="space-y-6">
            {/* Header con Data e Conferma */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="weekStartDate">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Settimana di Produzione (Lunedì)
                    </Label>
                    <Input
                      id="weekStartDate"
                      type="date"
                      value={weekStartDate}
                      onChange={(e) => setWeekStartDate(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="search">
                      <Search className="inline h-4 w-4 mr-1" />
                      Cerca Ricetta
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Nome o codice ricetta..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleConfirmProduction}
                    disabled={confirmProductionMutation.isPending || totalRecipesWithQuantity === 0}
                    size="lg"
                    className="whitespace-nowrap"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Conferma Produzioni
                    {totalRecipesWithQuantity > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {totalRecipesWithQuantity}
                      </Badge>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista Ricette Scorrevole */}
            <Card>
          <CardHeader>
            <CardTitle>
              Ricette Disponibili
              {filteredRecipes.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {filteredRecipes.length} ricette
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Caricamento ricette...</p>
            ) : filteredRecipes.length === 0 ? (
              <p className="text-muted-foreground">
                {searchQuery ? "Nessuna ricetta trovata con questi criteri" : "Nessuna ricetta disponibile"}
              </p>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
                {filteredRecipes.map((recipe: any) => {
                  const quantity = quantities[recipe.id] || "";
                  const hasQuantity = quantity && parseFloat(quantity) > 0;

                  return (
                    <div
                      key={recipe.id}
                      className={`border rounded-lg p-3 sm:p-4 transition-all ${
                        hasQuantity ? 'border-green-500 bg-green-50' : 'border-border'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Info Ricetta - Mobile Optimized */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-base sm:text-lg break-words">{recipe.name}</h3>
                            <Badge variant="outline" className="self-start text-xs">
                              {recipe.code}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="font-medium">Costo: €{Number(recipe.totalCost || 0).toFixed(2)}/kg</span>
                            {recipe.pieceWeight && (
                              <span className="hidden sm:inline">•</span>
                            )}
                            {recipe.pieceWeight && (
                              <span>Peso pezzo: {Number(recipe.pieceWeight).toFixed(3)} kg</span>
                            )}
                          </div>
                        </div>

                        {/* Input Quantità - Full Width Mobile */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`qty-${recipe.id}`} className="sr-only">
                              Quantità per {recipe.name}
                            </Label>
                            <Input
                              id={`qty-${recipe.id}`}
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder={recipe.measurementType === 'unit_only' ? "Pezzi" : "kg"}
                              value={quantity}
                              onChange={(e) => handleQuantityChange(recipe.id, e.target.value)}
                              className={`text-base ${hasQuantity ? 'border-green-500' : ''}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                            {recipe.measurementType === 'unit_only' ? 'pz' : 'kg'}
                          </span>
                        </div>
                      </div>

                      {/* Conversione kg/pezzi */}
                      {hasQuantity && recipe.measurementType === 'both' && recipe.pieceWeight && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          ≈ {(parseFloat(quantity) / recipe.pieceWeight).toFixed(0)} pezzi
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
          
          {/* TAB: Storico Produzioni */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Produzioni Pianificate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProductions ? (
                  <p className="text-muted-foreground">Caricamento...</p>
                ) : !productions || productions.length === 0 ? (
                  <p className="text-muted-foreground">Nessuna produzione pianificata</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Settimana</TableHead>
                        <TableHead>Ricetta</TableHead>
                        <TableHead>Quantità</TableHead>
                        <TableHead>Unità</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productions.map((prod: any) => (
                        <TableRow key={prod.id}>
                          <TableCell>
                            {new Date(prod.weekStartDate).toLocaleDateString("it-IT")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{prod.recipeName || prod.recipeFinalId}</span>
                              <span className="text-sm text-muted-foreground">{prod.recipeCode}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{Number(prod.quantity || 0).toFixed(3)} kg</span>
                              {prod.measurementType === 'both' && prod.pieceWeight && (
                                <span className="text-xs text-muted-foreground">
                                  ≈ {(Number(prod.quantity) / Number(prod.pieceWeight)).toFixed(0)} pezzi
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                prod.measurementType === 'weight_only' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                prod.measurementType === 'unit_only' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }
                            >
                              {prod.measurementType === 'weight_only' ? 'Solo kg' :
                               prod.measurementType === 'unit_only' ? 'Solo pezzi' :
                               'kg + pezzi'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(prod.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
