import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function ProductionNew() {
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const { data: finalRecipes, isLoading } = trpc.finalRecipes.list.useQuery();
  
  const confirmProductionMutation = trpc.production.confirmWeeklyProduction.useMutation({
    onSuccess: () => {
      utils.production.list.invalidate();
      utils.production.listWeekly.invalidate();
      toast.success("Produzioni settimanali confermate con successo");
      setQuantities({});
    },
    onError: (error: any) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

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
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pianificazione Produzione</h1>
            <p className="text-muted-foreground mt-2">
              Inserisci le quantità da produrre per ogni ricetta
            </p>
          </div>
        </div>

        {/* Header con Data e Conferma */}
        <Card className="mb-6">
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredRecipes.map((recipe: any) => {
                  const quantity = quantities[recipe.id] || "";
                  const hasQuantity = quantity && parseFloat(quantity) > 0;

                  return (
                    <div
                      key={recipe.id}
                      className={`border rounded-lg p-4 transition-all ${
                        hasQuantity ? 'border-green-500 bg-green-50' : 'border-border'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Info Ricetta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{recipe.name}</h3>
                            <Badge variant="outline" className="shrink-0">
                              {recipe.code}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>Costo: €{Number(recipe.totalCost || 0).toFixed(2)}/kg</span>
                            {recipe.pieceWeight && (
                              <span>• Peso pezzo: {Number(recipe.pieceWeight).toFixed(3)} kg</span>
                            )}
                            {recipe.producedQuantity && Number(recipe.producedQuantity) > 0 && (
                              <span className="text-green-600 font-medium">
                                • Già prodotto: {Number(recipe.producedQuantity).toFixed(3)} kg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Input Quantità */}
                        <div className="flex items-center gap-2 md:w-64">
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
                              className={hasQuantity ? 'border-green-500' : ''}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
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
      </div>
    </DashboardLayout>
  );
}
