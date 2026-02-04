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
import { ChefHat, Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ComponentWithDetails = {
  type: 'ingredient' | 'semi_finished' | 'operation';
  componentId?: string;
  componentName?: string;
  quantity: number;
  unit: string;
  name: string;
  pricePerUnit: number;
  costType?: string;
};

export default function FinalRecipes() {
  const { data: recipes, isLoading } = trpc.finalRecipes.list.useQuery();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  // Stati per gestione componenti
  const [editComponents, setEditComponents] = useState<ComponentWithDetails[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<any>({
    name: '',
    code: '',
    category: 'Altro',
    yieldPercentage: 100,
    serviceWastePercentage: 0,
    conservationMethod: 'Refrigerato',
    maxConservationTime: '48 ore',
  });
  const [createComponents, setCreateComponents] = useState<ComponentWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'ingredient' | 'semi_finished' | 'operation'>('ingredient');
  
  const createMutation = trpc.finalRecipes.create.useMutation({
    onSuccess: () => {
      toast.success("Ricetta creata con successo!");
      setIsCreateOpen(false);
      setCreateFormData({
        name: '',
        code: '',
        category: 'Altro',
        yieldPercentage: 100,
        serviceWastePercentage: 0,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '48 ore',
      });
      setCreateComponents([]);
      trpc.useUtils().finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante la creazione della ricetta");
    },
  });

  const updateMutation = trpc.finalRecipes.update.useMutation({
    onSuccess: () => {
      toast.success("Ricetta aggiornata con successo!");
      setIsEditOpen(false);
      setEditFormData(null);
      setEditComponents([]);
      trpc.useUtils().finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento della ricetta");
    },
  });

  const { data: recipeDetails } = trpc.finalRecipes.getDetails.useQuery(
    { id: selectedRecipeId! },
    { enabled: !!selectedRecipeId }
  );

  // Query per ricerca componenti
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: semiFinished } = trpc.semiFinished.list.useQuery();
  const { data: operations } = trpc.operations.list.useQuery();

  const utils = trpc.useUtils();

  // Filtra componenti in base alla ricerca
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    
    if (searchType === 'ingredient' && ingredients) {
      return ingredients
        .filter(i => i.name.toLowerCase().includes(term))
        .slice(0, 5)
        .map(i => ({
          type: 'ingredient' as const,
          id: i.id,
          name: i.name,
          unit: i.unitType === 'u' ? 'unità' : 'kg',
          pricePerUnit: parseFloat(i.pricePerKgOrUnit || '0'),
        }));
    }
    
    if (searchType === 'semi_finished' && semiFinished) {
      return semiFinished
        .filter(s => s.name.toLowerCase().includes(term))
        .slice(0, 5)
        .map(s => ({
          type: 'semi_finished' as const,
          id: s.id,
          name: s.name,
          unit: 'kg',
          pricePerUnit: parseFloat(s.finalPricePerKg || '0'),
        }));
    }
    
    if (searchType === 'operation' && operations) {
      return operations
        .filter(o => o.name.toLowerCase().includes(term))
        .slice(0, 5)
        .map(o => ({
          type: 'operation' as const,
          id: o.id,
          name: o.name,
          unit: 'ore',
          pricePerUnit: parseFloat(o.hourlyRate || '0'),
          costType: o.costType,
        }));
    }
    
    return [];
  }, [searchTerm, searchType, ingredients, semiFinished, operations]);

  const handleEdit = async (recipe: any) => {
    setEditFormData({
      id: recipe.id,
      category: recipe.category,
      yieldPercentage: parseFloat(recipe.yieldPercentage || "100"),
      serviceWastePercentage: parseFloat(recipe.serviceWastePercentage || "0"),
    });
    
    // Carica componenti esistenti con dettagli completi
    const components = typeof recipe.components === 'string' 
      ? JSON.parse(recipe.components) 
      : recipe.components;
    
    // Espandi componenti con dettagli (nome, prezzo)
    const expandedComponents = await Promise.all(
      (components || []).map(async (comp: any) => {
        if (comp.type === 'ingredient') {
          const ingredient = ingredients?.find(i => i.id === comp.componentId);
          return {
            ...comp,
            name: ingredient?.name || comp.componentName || 'Sconosciuto',
            unit: comp.unit || (ingredient?.unitType === 'u' ? 'unità' : 'kg'),
            pricePerUnit: ingredient ? parseFloat(ingredient.pricePerKgOrUnit || '0') : 0,
          };
        } else if (comp.type === 'semi_finished') {
          const semi = semiFinished?.find(s => s.id === comp.componentId);
          return {
            ...comp,
            name: semi?.name || comp.componentName || 'Sconosciuto',
            unit: comp.unit || 'kg',
            pricePerUnit: semi ? parseFloat(semi.finalPricePerKg || '0') : 0,
          };
        } else if (comp.type === 'operation') {
          const operation = operations?.find(o => o.name === comp.componentName);
          return {
            ...comp,
            name: operation?.name || comp.componentName || 'Operazione',
            unit: comp.unit || 'ore',
            pricePerUnit: operation ? parseFloat(operation.hourlyRate || '0') : 0,
            costType: operation?.costType || 'LAVORO',
          };
        }
        return comp;
      })
    );
    
    setEditComponents(expandedComponents);
    setIsEditOpen(true);
    setSelectedRecipeId(null);
  };

  const handleAddComponent = (component: any) => {
    const newComponent: ComponentWithDetails = {
      type: component.type,
      componentId: component.id,
      componentName: component.name,
      quantity: 1,
      unit: component.unit,
      name: component.name,
      pricePerUnit: component.pricePerUnit,
      costType: component.costType,
    };
    setEditComponents([...editComponents, newComponent]);
    setSearchTerm("");
  };

  const handleRemoveComponent = (index: number) => {
    setEditComponents(editComponents.filter((_, i) => i !== index));
  };

  const handleUpdateComponentQuantity = (index: number, quantity: number) => {
    const updated = [...editComponents];
    updated[index] = { ...updated[index], quantity };
    setEditComponents(updated);
  };

  const calculateTotalCost = () => {
    return editComponents.reduce((sum, comp) => {
      return sum + (comp.quantity * comp.pricePerUnit);
    }, 0);
  };

  const handleUpdateSubmit = () => {
    if (!editFormData) return;
    
    updateMutation.mutate({
      id: editFormData.id,
      category: editFormData.category,
      yieldPercentage: editFormData.yieldPercentage,
      serviceWastePercentage: editFormData.serviceWastePercentage,
      components: editComponents.map(comp => ({
        type: comp.type,
        componentId: comp.componentId || '',
        componentName: comp.componentName || comp.name,
        quantity: comp.quantity,
        unit: comp.unit,
        pricePerUnit: comp.pricePerUnit || 0,
        costType: comp.costType || '',
      })),
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
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsCreateOpen(true)}>
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

              <div>
                <h3 className="font-semibold text-lg mb-3">Componenti</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Nome</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Tipo</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Quantità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Prezzo/Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((recipeDetails.componentsWithDetails as ComponentWithDetails[]) || []).map((comp: ComponentWithDetails, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{comp.name}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              comp.type === 'ingredient' 
                                ? 'bg-blue-100 text-blue-700' 
                                : comp.type === 'operation'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {comp.type === 'ingredient' ? 'Ingrediente' : comp.type === 'operation' ? 'Operazione' : 'Semilavorato'}
                            </span>
                          </td>
                          <td className="p-3 text-right">{comp.quantity}</td>
                          <td className="p-3 text-right">{comp.unit}</td>
                          <td className="p-3 text-right">€ {parseFloat(String(comp.pricePerUnit || 0)).toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">
                            € {(parseFloat(String(comp.quantity)) * parseFloat(String(comp.pricePerUnit || 0))).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {recipeDetails.productionOperations && Array.isArray(recipeDetails.productionOperations) && recipeDetails.productionOperations.length > 0 ? (
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
              ) : null}

              {recipeDetails.serviceWastePercentage && parseFloat(recipeDetails.serviceWastePercentage) > 0 ? (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Scarti al Servizio</h3>
                  <p className="text-slate-700">
                    Percentuale scarto: <span className="font-medium">{recipeDetails.serviceWastePercentage}%</span>
                  </p>
                  {recipeDetails.serviceWastePerIngredient && Array.isArray(recipeDetails.serviceWastePerIngredient) && recipeDetails.serviceWastePerIngredient.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {(recipeDetails.serviceWastePerIngredient as any[]).map((waste: any, idx: number) => (
                        <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                          <span className="font-medium">{waste.ingredientName}</span>: {waste.wastePercentage}%
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Ricetta */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Modifica Ricetta</DialogTitle>
            <DialogDescription>
              Modifica categoria, resa produzione, scarto al servizio e componenti
            </DialogDescription>
          </DialogHeader>
          {editFormData && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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

              {/* Gestione Componenti */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xl">Componenti</h3>
                  <div className="text-base text-slate-700 bg-white px-4 py-2 rounded-lg border-2 border-green-500">
                    Costo totale: <span className="font-bold text-green-600 text-lg">€ {calculateTotalCost().toFixed(2)}</span>
                  </div>
                </div>

                {/* Lista componenti attuali */}
                <div className="border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Nome</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Tipo</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Quantità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Prezzo/Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Costo</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-700">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editComponents.map((comp, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{comp.name}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              comp.type === 'ingredient' 
                                ? 'bg-blue-100 text-blue-700' 
                                : comp.type === 'operation'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {comp.type === 'ingredient' ? 'Ingrediente' : comp.type === 'operation' ? 'Operazione' : 'Semilavorato'}
                            </span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={comp.quantity}
                              onChange={(e) => handleUpdateComponentQuantity(idx, parseFloat(e.target.value))}
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="p-3 text-right">€ {comp.pricePerUnit.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">
                            € {(comp.quantity * comp.pricePerUnit).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveComponent(idx)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ricerca e aggiunta componenti */}
                <div className="space-y-3 p-5 bg-white border-2 border-dashed border-slate-300 rounded-lg">
                  <Label className="text-base font-semibold">Aggiungi Componente</Label>
                  <div className="flex gap-3">
                    <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingredient">Ingrediente</SelectItem>
                        <SelectItem value="semi_finished">Semilavorato</SelectItem>
                        <SelectItem value="operation">Operazione</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Cerca per nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Risultati ricerca */}
                  {searchTerm && filteredComponents.length > 0 && (
                    <div className="border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
                      {filteredComponents.map((comp: any) => (
                        <div
                          key={comp.id}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          onClick={() => handleAddComponent(comp)}
                        >
                          <div>
                            <p className="font-medium">{comp.name}</p>
                            <p className="text-sm text-slate-500">
                              {comp.unit} - € {comp.pricePerUnit.toFixed(2)}/{comp.unit}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

      {/* Dialog Creazione Nuova Ricetta */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Crea Nuova Ricetta</DialogTitle>
            <DialogDescription>
              Compila i campi e aggiungi i componenti per creare una nuova ricetta
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Informazioni Base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome Ricetta *</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="es. Pulled Pork Burger"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-code">Codice *</Label>
                <Input
                  id="create-code"
                  value={createFormData.code}
                  onChange={(e) => setCreateFormData({ ...createFormData, code: e.target.value })}
                  placeholder="es. CARNE_PULLED_PORK"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="create-category">Categoria</Label>
              <Select
                value={createFormData.category}
                onValueChange={(value) => setCreateFormData({ ...createFormData, category: value })}
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

            {/* Resa e Scarto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-yield">Resa Produzione (%)</Label>
                <Input
                  id="create-yield"
                  type="number"
                  step="0.01"
                  value={createFormData.yieldPercentage}
                  onChange={(e) => setCreateFormData({ ...createFormData, yieldPercentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-waste">Scarto al Servizio (%)</Label>
                <Input
                  id="create-waste"
                  type="number"
                  step="0.01"
                  value={createFormData.serviceWastePercentage}
                  onChange={(e) => setCreateFormData({ ...createFormData, serviceWastePercentage: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Conservazione */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-conservation">Metodo Conservazione</Label>
                <Input
                  id="create-conservation"
                  value={createFormData.conservationMethod}
                  onChange={(e) => setCreateFormData({ ...createFormData, conservationMethod: e.target.value })}
                  placeholder="es. Refrigerato, Congelato"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-maxtime">Tempo Max Conservazione</Label>
                <Input
                  id="create-maxtime"
                  value={createFormData.maxConservationTime}
                  onChange={(e) => setCreateFormData({ ...createFormData, maxConservationTime: e.target.value })}
                  placeholder="es. 48 ore, 3 giorni"
                />
              </div>
            </div>

            {/* Gestione Componenti */}
            <div className="space-y-4 bg-slate-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xl">Componenti</h3>
                <div className="text-base text-slate-700 bg-white px-4 py-2 rounded-lg border-2 border-green-500">
                  Costo totale: <span className="font-bold text-green-600 text-lg">€ {createComponents.reduce((sum, comp) => sum + (comp.quantity * comp.pricePerUnit), 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Lista componenti */}
              {createComponents.length > 0 ? (
                <div className="border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Nome</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-700">Tipo</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Quantità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Prezzo/Unità</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-700">Costo</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-700">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createComponents.map((comp, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{comp.name}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              comp.type === 'ingredient' 
                                ? 'bg-blue-100 text-blue-700' 
                                : comp.type === 'operation'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {comp.type === 'ingredient' ? 'Ingrediente' : comp.type === 'operation' ? 'Operazione' : 'Semilavorato'}
                            </span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={comp.quantity}
                              onChange={(e) => {
                                const updated = [...createComponents];
                                updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) };
                                setCreateComponents(updated);
                              }}
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="p-3 text-right">€ {comp.pricePerUnit.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">
                            € {(comp.quantity * comp.pricePerUnit).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCreateComponents(createComponents.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 border rounded-lg">
                  <p>Nessun componente aggiunto. Usa la ricerca qui sotto per aggiungerne.</p>
                </div>
              )}

              {/* Ricerca e aggiunta componenti */}
              <div className="space-y-3 p-5 bg-white border-2 border-dashed border-slate-300 rounded-lg">
                <Label className="text-base font-semibold">Aggiungi Componente</Label>
                <div className="flex gap-3">
                  <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredient">Ingrediente</SelectItem>
                      <SelectItem value="semi_finished">Semilavorato</SelectItem>
                      <SelectItem value="operation">Operazione</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cerca per nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Risultati ricerca */}
                {searchTerm && filteredComponents.length > 0 && (
                  <div className="border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
                    {filteredComponents.map((comp: any) => (
                      <div
                        key={comp.id}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          const newComponent: ComponentWithDetails = {
                            type: comp.type,
                            componentId: comp.id,
                            componentName: comp.name,
                            quantity: 1,
                            unit: comp.unit,
                            name: comp.name,
                            pricePerUnit: comp.pricePerUnit,
                            costType: comp.costType,
                          };
                          setCreateComponents([...createComponents, newComponent]);
                          setSearchTerm("");
                        }}
                      >
                        <div>
                          <p className="font-medium">{comp.name}</p>
                          <p className="text-sm text-slate-500">
                            {comp.unit} - € {comp.pricePerUnit.toFixed(2)}/{comp.unit}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pulsanti */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false);
                setCreateFormData({
                  name: '',
                  code: '',
                  category: 'Altro',
                  yieldPercentage: 100,
                  serviceWastePercentage: 0,
                  conservationMethod: 'Refrigerato',
                  maxConservationTime: '48 ore',
                });
                setCreateComponents([]);
              }}>
                Annulla
              </Button>
              <Button
                onClick={() => {
                  if (!createFormData.name || !createFormData.code) {
                    toast.error("Nome e codice sono obbligatori");
                    return;
                  }
                  if (createComponents.length === 0) {
                    toast.error("Aggiungi almeno un componente");
                    return;
                  }
                  createMutation.mutate({
                    name: createFormData.name,
                    code: createFormData.code,
                    category: createFormData.category,
                    yieldPercentage: createFormData.yieldPercentage,
                    serviceWastePercentage: createFormData.serviceWastePercentage,
                    conservationMethod: createFormData.conservationMethod,
                    maxConservationTime: createFormData.maxConservationTime,
                    components: createComponents.map(comp => ({
                      type: comp.type,
                      componentId: comp.componentId || '',
                      componentName: comp.componentName || comp.name,
                      quantity: comp.quantity,
                      unit: comp.unit,
                      pricePerUnit: comp.pricePerUnit || 0,
                      costType: comp.costType || '',
                    })),
                  });
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Crea Ricetta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
