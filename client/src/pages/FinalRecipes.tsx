import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ChefHat, Plus, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FinalRecipes() {
  const { data: recipes, isLoading } = trpc.finalRecipes.list.useQuery();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  const { data: recipeDetails } = trpc.finalRecipes.getDetails.useQuery(
    { id: selectedRecipeId! },
    { enabled: !!selectedRecipeId }
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.finalRecipes.update.useMutation({
    onSuccess: () => {
      toast.success("Ricetta aggiornata con successo");
      utils.finalRecipes.list.invalidate();
      utils.finalRecipes.getDetails.invalidate();
      setIsEditOpen(false);
      setSelectedRecipeId(null);
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento: " + error.message);
    },
  });

  const handleEdit = (recipe: any) => {
    setEditFormData({
      id: recipe.id,
      category: recipe.category,
      yieldPercentage: parseFloat(recipe.yieldPercentage || "100"),
      serviceWastePercentage: parseFloat(recipe.serviceWastePercentage || "0"),
    });
    setIsEditOpen(true);
    setSelectedRecipeId(null);
  };

  const handleUpdateSubmit = () => {
    if (!editFormData) return;
    updateMutation.mutate({
      id: editFormData.id,
      category: editFormData.category,
      yieldPercentage: editFormData.yieldPercentage,
      serviceWastePercentage: editFormData.serviceWastePercentage,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ricette Finali</h1>
            <p className="text-slate-600 mt-1">Piatti pronti per il menu (Livello 2)</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Ricetta
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              Lista Ricette
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : recipes && recipes.length > 0 ? (
              <div className="space-y-4">
                {recipes.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-slate-500">Codice: {item.code}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Categoria: <span className="font-medium">{item.category}</span>
                        {item.totalCost && (
                          <span className="ml-4">
                            Costo: <span className="font-medium text-green-600">€ {parseFloat(item.totalCost).toFixed(2)}/kg</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecipeId(item.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Dettagli
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifica
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessuna ricetta trovata</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Dettagli Ricetta */}
      <Dialog open={!!selectedRecipeId} onOpenChange={(open) => !open && setSelectedRecipeId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{recipeDetails?.name || "Dettagli Ricetta"}</DialogTitle>
            <DialogDescription>
              Codice: {recipeDetails?.code} | Categoria: {recipeDetails?.category}
            </DialogDescription>
          </DialogHeader>

          {recipeDetails && (
            <div className="space-y-6">
              {/* Informazioni Generali */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Resa Produzione</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {recipeDetails.yieldPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Costo Totale</p>
                  <p className="text-lg font-semibold text-green-600">
                    € {parseFloat(recipeDetails.totalCost || "0").toFixed(2)}/kg
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Metodo Conservazione</p>
                  <p className="text-slate-900">{recipeDetails.conservationMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Tempo Max Conservazione</p>
                  <p className="text-slate-900">{recipeDetails.maxConservationTime}</p>
                </div>
              </div>

              {/* Componenti */}
              <div key="components">
                <h3 className="font-semibold text-lg mb-3">Componenti</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Ingrediente/Semilavorato</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Tipo</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Quantità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Prezzo/Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((recipeDetails.componentsWithDetails as any[]) || []).map((comp: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{comp.name}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              comp.type === 'ingredient' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {comp.type === 'ingredient' ? 'Ingrediente' : 'Semilavorato'}
                            </span>
                          </td>
                          <td className="p-3 text-right">{comp.quantity}</td>
                          <td className="p-3 text-right">{comp.unit}</td>
                          <td className="p-3 text-right">€ {parseFloat(comp.pricePerUnit || 0).toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">
                            € {(parseFloat(comp.quantity) * parseFloat(comp.pricePerUnit || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operazioni di Produzione */}
              {recipeDetails.productionOperations && Array.isArray(recipeDetails.productionOperations) && recipeDetails.productionOperations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Operazioni di Produzione</h3>
                  <div className="space-y-2">
                    {(recipeDetails.productionOperations as any[]).map((op: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-medium">{idx + 1}. {op.description || op.operation || "Operazione"}</p>
                        {op.duration && <p className="text-sm text-slate-600 mt-1">Durata: {op.duration}</p>}
                        {op.temperature && <p className="text-sm text-slate-600">Temperatura: {op.temperature}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scarti al Servizio */}
              {recipeDetails.serviceWastePercentage && parseFloat(recipeDetails.serviceWastePercentage) > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Scarti al Servizio</h3>
                  <p className="text-slate-700">
                    Percentuale scarto: <span className="font-medium">{recipeDetails.serviceWastePercentage}%</span>
                  </p>
                  {recipeDetails.serviceWastePerIngredient && Array.isArray(recipeDetails.serviceWastePerIngredient) && recipeDetails.serviceWastePerIngredient.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(recipeDetails.serviceWastePerIngredient as any[]).map((waste: any, idx: number) => (
                        <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                          <span className="font-medium">{waste.ingredientName}</span>: {waste.wastePercentage}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Ricetta */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Ricetta</DialogTitle>
            <DialogDescription>
              Modifica categoria, resa produzione e scarto al servizio
            </DialogDescription>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-6">
              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pane">Pane</SelectItem>
                    <SelectItem value="Carne">Carne</SelectItem>
                    <SelectItem value="Salse">Salse</SelectItem>
                    <SelectItem value="Verdure">Verdure</SelectItem>
                    <SelectItem value="Formaggi">Formaggi</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resa Produzione */}
              <div className="space-y-2">
                <Label htmlFor="yieldPercentage">Resa Produzione (%)</Label>
                <Input
                  id="yieldPercentage"
                  type="number"
                  step="0.01"
                  value={editFormData.yieldPercentage}
                  onChange={(e) => setEditFormData({ ...editFormData, yieldPercentage: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-slate-500">
                  Percentuale di prodotto finito ottenuto rispetto alle materie prime utilizzate (es. 100% = nessuna perdita, 80% = 20% di perdita in cottura/lavorazione)
                </p>
              </div>

              {/* Scarto al Servizio */}
              <div className="space-y-2">
                <Label htmlFor="serviceWastePercentage">Scarto al Servizio (%)</Label>
                <Input
                  id="serviceWastePercentage"
                  type="number"
                  step="0.01"
                  value={editFormData.serviceWastePercentage}
                  onChange={(e) => setEditFormData({ ...editFormData, serviceWastePercentage: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-slate-500">
                  Percentuale di prodotto che viene scartato durante il servizio (es. ritagli, porzioni non servibili, ecc.)
                </p>
              </div>

              {/* Pulsanti */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annulla
                </Button>
                <Button
                  onClick={handleUpdateSubmit}
                  disabled={updateMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
