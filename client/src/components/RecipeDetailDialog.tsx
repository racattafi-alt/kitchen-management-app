import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Package, Calculator, Printer, Edit } from "lucide-react";
import { toast } from "sonner";

interface RecipeDetailDialogProps {
  recipeId: string | null;
  recipeType: 'final' | 'semi' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RecipeDetailDialog({
  recipeId,
  recipeType,
  open,
  onOpenChange,
}: RecipeDetailDialogProps) {
  const [multiplier, setMultiplier] = useState(1);

  // Carica dettagli ricetta finale
  const { data: finalRecipe, isLoading: loadingFinal } = trpc.finalRecipes.getDetails.useQuery(
    { id: recipeId || "" },
    { enabled: open && recipeType === 'final' && !!recipeId }
  );

  // Carica dettagli semilavorato
  const { data: semiRecipe, isLoading: loadingSemi } = trpc.semiFinished.getById.useQuery(
    { id: recipeId || "" },
    { enabled: open && recipeType === 'semi' && !!recipeId }
  );

  const recipe = recipeType === 'final' ? finalRecipe : semiRecipe;
  const isLoading = loadingFinal || loadingSemi;

  if (!open || !recipe) return null;

  const components = recipeType === 'final' 
    ? (recipe as any).componentsWithDetails || []
    : (recipe as any).components || [];

  const handlePrint = () => {
    toast.info("Funzionalità stampa in arrivo");
  };

  const handleEdit = () => {
    toast.info("Funzionalità modifica in arrivo");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {recipeType === 'final' ? (
                <ChefHat className="h-6 w-6 text-primary" />
              ) : (
                <Package className="h-6 w-6 text-primary" />
              )}
              <div>
                <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {recipe.code || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Stampa
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Caricamento dettagli...
          </div>
        ) : (
          <Tabs defaultValue="ingredients" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ingredients">Ingredienti</TabsTrigger>
              <TabsTrigger value="procedure">Procedura</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            {/* Tab Ingredienti */}
            <TabsContent value="ingredients" className="space-y-4">
              {/* Moltiplicatore */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Calculator className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="multiplier">Moltiplicatore Batch</Label>
                  <p className="text-sm text-muted-foreground">
                    Moltiplica le quantità per calcolare batch più grandi
                  </p>
                </div>
                <Input
                  id="multiplier"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              {/* Tabella Ingredienti */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantità Base</TableHead>
                      <TableHead className="text-right">Quantità × {multiplier}</TableHead>
                      <TableHead className="text-right">Unità</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nessun componente disponibile
                        </TableCell>
                      </TableRow>
                    ) : (
                      components.map((comp: any, idx: number) => {
                        const baseQty = Number(comp.quantity) / 1000; // Converti da grammi a kg
                        const multipliedQty = baseQty * multiplier;
                        const cost = multipliedQty * Number(comp.pricePerUnit || 0);
                        
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {comp.name || 'Sconosciuto'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={comp.type === 'ingredient' ? 'default' : 'secondary'}>
                                {comp.type === 'ingredient' ? 'Ingrediente' : 'Semilavorato'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {baseQty.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {multipliedQty.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-right">
                              {comp.unit || 'Kg'}
                            </TableCell>
                            <TableCell className="text-right">
                              € {cost.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Riepilogo Costi */}
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Resa:</span>
                  <span className="font-medium">{recipe.yieldPercentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Costo Totale (× {multiplier}):</span>
                  <span className="font-semibold text-primary text-lg">
                    € {(Number((recipe as any).totalCost || (recipe as any).finalPricePerKg || 0) * multiplier).toFixed(2)}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Tab Procedura */}
            <TabsContent value="procedure" className="space-y-4">
              <div className="p-6 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-4">Procedura Standard</h3>
                <div className="space-y-4">
                  <p className="text-muted-foreground italic">
                    Procedura dettagliata in arrivo. 
                    Qui verrà visualizzato il diagramma di flusso della preparazione.
                  </p>
                  {/* Placeholder per diagramma di flusso */}
                  <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Diagramma di flusso</p>
                    <p className="text-sm">(da implementare)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab Info */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Informazioni Generali</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <Badge>{recipe.category || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Codice:</span>
                      <span className="font-medium">{recipe.code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resa:</span>
                      <span className="font-medium">{recipe.yieldPercentage}%</span>
                    </div>
                    {recipeType === 'final' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Metodo Conservazione:</span>
                          <span className="font-medium">{(recipe as any).conservationMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tempo Max Conservazione:</span>
                          <span className="font-medium">{(recipe as any).maxConservationTime || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scarto Servizio:</span>
                          <span className="font-medium">{(recipe as any).serviceWastePercentage || 0}%</span>
                        </div>
                      </>
                    )}
                    {recipeType === 'semi' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shelf Life:</span>
                        <span className="font-medium">{(recipe as any).shelfLifeDays || 0} giorni</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
