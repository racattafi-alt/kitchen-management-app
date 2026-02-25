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
import { ChefHat, Plus, Eye, Pencil, Trash2, Search, FileSpreadsheet, History, EyeOff, ArrowLeft } from "lucide-react";
import RecipeForm, { ComponentWithDetails } from "@/components/RecipeForm";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ComponentWithDetails importato da RecipeForm

// Componente per visualizzare allergeni nel dialog dettaglio
function AllergensSection({ recipeId }: { recipeId: string }) {
  const { data: allergens, isLoading } = trpc.finalRecipes.getAllergens.useQuery({ id: recipeId });
  
  if (isLoading) {
    return <div className="text-sm text-slate-500">Caricamento allergeni...</div>;
  }
  
  if (!allergens || allergens.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-700 font-medium">✓ Nessun allergene presente</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600 mb-3">
        Questa ricetta contiene i seguenti allergeni (calcolati automaticamente dai componenti):
      </p>
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => (
          <span
            key={allergen}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200"
          >
            ⚠️ {allergen}
          </span>
        ))}
      </div>
    </div>
  );
}

// Componente per badge allergeni nelle card ricette
function RecipeAllergensBadge({ recipeId }: { recipeId: string }) {
  const { data: allergens } = trpc.finalRecipes.getAllergens.useQuery({ id: recipeId });
  
  if (!allergens || allergens.length === 0) {
    return null;
  }
  
  // Mostra solo il numero di allergeni nella card
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      ⚠️ {allergens.length} allergeni
    </span>
  );
}

export default function FinalRecipes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedRecipeForHistory, setSelectedRecipeForHistory] = useState<string | null>(null);
  
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
    isSellable: true,
    isSemiFinished: false,
  });
  const [createComponents, setCreateComponents] = useState<ComponentWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'ingredient' | 'semi_finished' | 'operation'>('ingredient');
  
  const { data: allRecipes, isLoading } = trpc.finalRecipes.list.useQuery();
  // Filtra solo ricette finali (escludendo semilavorati che potrebbero essere nella tabella)
  const allFinalRecipes = allRecipes?.filter(r => r.category && ['Pane', 'Carne', 'Salse', 'Verdure', 'Formaggi', 'Altro'].includes(r.category)) || [];
  
  // Applica filtro stato (attive/nascoste) e ricerca
  const recipes = useMemo(() => {
    return allFinalRecipes.filter(r => {
      // Filtro stato
      if (filterStatus === 'active' && r.isActive === false) return false;
      if (filterStatus === 'hidden' && r.isActive !== false) return false;
      
      // Filtro ricerca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(query) ||
          r.code.toLowerCase().includes(query) ||
          (r.category && r.category.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [allFinalRecipes, filterStatus, searchQuery]);

  // Paginazione
  const totalPages = recipes ? Math.ceil(recipes.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecipes = recipes?.slice(startIndex, endIndex);

  // Reset pagina quando cambiano filtri o ricerca
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: 'all' | 'active' | 'hidden') => {
    setFilterStatus(value);
    setCurrentPage(1);
  };
  
  const utils = trpc.useUtils();
  
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
        isSellable: true,
        isSemiFinished: false,
      });
      setCreateComponents([]);
      utils.finalRecipes.list.invalidate();
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
      utils.finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento della ricetta");
    },
  });

  const toggleActiveMutation = trpc.finalRecipes.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Stato ricetta aggiornato!");
      utils.finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento dello stato");
    },
  });

  const deleteMutation = trpc.finalRecipes.delete.useMutation({
    onSuccess: () => {
      toast.success("Ricetta eliminata con successo!");
      setIsDeleteDialogOpen(false);
      setRecipeToDelete(null);
      utils.finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'eliminazione della ricetta");
    },
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: recipeDetails } = trpc.finalRecipes.getDetails.useQuery(
    { id: selectedRecipeId! },
    { enabled: !!selectedRecipeId }
  );

  // Query per ricerca componenti
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: semiFinished } = trpc.semiFinished.list.useQuery();
  const { data: operations } = trpc.operations.list.useQuery();

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
    
    if (searchType === 'semi_finished') {
      // Mostra sia i semilavorati della tabella semi_finished_recipes
      // che le ricette finali con flag isSemiFinished=true
      const semiFromTable = (semiFinished || [])
        .filter(s => s.name.toLowerCase().includes(term))
        .map(s => ({
          type: 'semi_finished' as const,
          id: s.id,
          name: s.name,
          unit: 'kg',
          pricePerUnit: parseFloat(s.finalPricePerKg || '0'),
        }));
      
      const semiFromRecipes = (allRecipes || [])
        .filter(r => r.isSemiFinished && r.name.toLowerCase().includes(term))
        .map(r => ({
          type: 'semi_finished' as const,
          id: r.id,
          name: r.name,
          unit: 'kg',
          pricePerUnit: r.unitWeight ? parseFloat(r.totalCost || '0') / parseFloat(r.unitWeight) : 0,
        }));
      
      return [...semiFromTable, ...semiFromRecipes].slice(0, 5);
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
      name: recipe.name,
      category: recipe.category,
      yieldPercentage: parseFloat(recipe.yieldPercentage || "100"),
      serviceWastePercentage: parseFloat(recipe.serviceWastePercentage || "0"),
      unitWeight: parseFloat(recipe.unitWeight || "0"),
      producedQuantity: parseFloat(recipe.producedQuantity || "0"),
      measurementType: recipe.measurementType || 'weight_only',
      pieceWeight: parseFloat(recipe.pieceWeight || "0"),
      isSemiFinished: recipe.isSemiFinished || false,
      isSellable: recipe.isSellable !== false,
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
      const quantity = parseFloat(String(comp.quantity)) || 0;
      const price = parseFloat(String(comp.pricePerUnit)) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const calculateTotalCostForCreate = () => {
    return createComponents.reduce((sum, comp) => {
      const quantity = parseFloat(String(comp.quantity)) || 0;
      const price = parseFloat(String(comp.pricePerUnit)) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const calculateWeightForFood = (components: ComponentWithDetails[]) => {
    // Escludi operations e non-food (buste SV, packaging, etc.)
    const nonFoodKeywords = ['busta', 'sv', 'sottovuoto', 'packaging', 'sacchetto', 'contenitore'];
    
    return components.reduce((sum, comp) => {
      if (comp.type === 'operation') return sum;
      
      // Escludi non-food basandosi sul nome
      const isNonFood = nonFoodKeywords.some(keyword => 
        comp.name.toLowerCase().includes(keyword)
      );
      if (isNonFood) return sum;
      
      const quantity = parseFloat(String(comp.quantity)) || 0;
      return sum + quantity;
    }, 0);
  };

  const handleUpdateSubmit = () => {
    if (!editFormData) return;
    
    updateMutation.mutate({
      id: editFormData.id,
      name: editFormData.name,
      category: editFormData.category,
      yieldPercentage: editFormData.yieldPercentage,
      serviceWastePercentage: editFormData.serviceWastePercentage,
      unitWeight: editFormData.unitWeight,
      producedQuantity: editFormData.producedQuantity,
      measurementType: editFormData.measurementType,
      pieceWeight: editFormData.pieceWeight,
      isSemiFinished: editFormData.isSemiFinished,
      isSellable: editFormData.isSellable,
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

  const handleExportPDF = async () => {
    if (!editFormData) return;
    
    try {
      // Crea contenuto HTML per PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #95a5a6; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #3498db; color: white; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #ecf0f1; padding: 15px; border-radius: 5px; }
            .info-label { font-weight: bold; color: #2c3e50; }
            .cost-highlight { background: #2ecc71; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Scheda Tecnica Ricetta: ${editFormData.name}</h1>
          
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Codice:</span> ${editFormData.code}</div>
            <div class="info-item"><span class="info-label">Categoria:</span> ${editFormData.category}</div>
            <div class="info-item"><span class="info-label">Resa Produzione:</span> ${editFormData.yieldPercentage}%</div>
            <div class="info-item"><span class="info-label">Scarto al Servizio:</span> ${editFormData.serviceWastePercentage}%</div>
            <div class="info-item"><span class="info-label">Peso Finale:</span> ${editFormData.unitWeight || 'N/A'} kg</div>
            <div class="info-item"><span class="info-label">Quantità Prodotta:</span> ${editFormData.producedQuantity || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Metodo Conservazione:</span> ${editFormData.conservationMethod || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Tempo Max Conservazione:</span> ${editFormData.maxConservationTime || 'N/A'}</div>
          </div>
          
          <div class="cost-highlight">Costo Totale: €${calculateTotalCost().toFixed(2)}</div>
          
          <h2>Componenti</h2>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Quantità</th>
                <th>Unità</th>
                <th>Prezzo Unitario (€)</th>
                <th>Costo Totale (€)</th>
              </tr>
            </thead>
            <tbody>
              ${editComponents.map(comp => `
                <tr>
                  <td>${comp.type === 'ingredient' ? 'Ingrediente' : comp.type === 'semi_finished' ? 'Semilavorato' : 'Operazione'}</td>
                  <td>${comp.name}</td>
                  <td>${comp.quantity}</td>
                  <td>${comp.unit}</td>
                  <td>${comp.pricePerUnit.toFixed(2)}</td>
                  <td>${(comp.quantity * comp.pricePerUnit).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 40px; color: #7f8c8d; font-size: 12px;">
            Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
          </p>
        </body>
        </html>
      `;
      
      // Crea Blob e download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheda_ricetta_${editFormData.code}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Scheda tecnica esportata! Apri il file HTML e stampalo come PDF dal browser.');
    } catch (error) {
      toast.error('Errore durante l\'esportazione PDF');
      console.error(error);
    }
  };

  const handleExportExcel = () => {
    if (!recipes || recipes.length === 0) {
      toast.error('Nessuna ricetta da esportare');
      return;
    }

    // Crea CSV (compatibile Excel)
    const headers = ['Codice', 'Nome', 'Categoria', 'Costo Totale (€)', 'Peso Finale (kg)', 'Prezzo al kg (€)', 'Quantità Prodotta', 'Prezzo Unitario (€)', 'Resa (%)'];
    const rows = recipes.map(r => [
      r.code,
      r.name,
      r.category,
      parseFloat(r.totalCost || '0').toFixed(2),
      r.unitWeight ? parseFloat(r.unitWeight).toFixed(2) : '',
      r.unitWeight ? (parseFloat(r.totalCost || '0') / parseFloat(r.unitWeight)).toFixed(2) : '',
      r.producedQuantity ? parseFloat(r.producedQuantity).toFixed(0) : '',
      r.producedQuantity ? (parseFloat(r.totalCost || '0') / parseFloat(r.producedQuantity)).toFixed(2) : '',
      r.yieldPercentage ? parseFloat(r.yieldPercentage).toFixed(2) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ricette_finali_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export Excel completato');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Ricette Finali" }]} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = '/dashboard'}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ricette Finali</h1>
              <p className="text-slate-600 mt-1">Piatti pronti per il menu (Livello 2)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Esporta Excel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Ricetta
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4 mb-4">
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                Lista Ricette
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Cerca ricetta..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => handleFilterChange(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-10">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte ({allFinalRecipes.length})</SelectItem>
                  <SelectItem value="active">Solo Attive ({allFinalRecipes.filter(r => r.isActive !== false).length})</SelectItem>
                  <SelectItem value="hidden">Solo Nascoste ({allFinalRecipes.filter(r => r.isActive === false).length})</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
            {searchQuery.trim() && (
              <p className="text-sm text-slate-500 mt-2">
                {recipes.length} ricette trovate su {allFinalRecipes.length} totali
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : recipes && recipes.length > 0 ? (
              <div className="space-y-4">
                {paginatedRecipes?.map((item: any) => (
                  <div key={item.id} className="p-3 md:p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm md:text-base truncate">{item.name}</h3>
                        {item.isSemiFinished && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            Semilavorato
                          </span>
                        )}
                        {item.isSellable && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Vendibile
                          </span>
                        )}
                        {item.isActive === false && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Nascosta
                          </span>
                        )}
                        {/* Badge Unità Misura */}
                        {item.measurementType === 'weight_only' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Solo kg
                          </span>
                        )}
                        {item.measurementType === 'unit_only' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            Solo pezzi
                          </span>
                        )}
                        {item.measurementType === 'both' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            kg + pezzi
                          </span>
                        )}
                        {/* Badge Allergeni */}
                        <RecipeAllergensBadge recipeId={item.id} />
                      </div>
                      <p className="text-xs md:text-sm text-slate-500">Codice: {item.code}</p>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">
                        Categoria: <span className="font-medium">{item.category}</span>
                      </p>
                      {item.totalCost && (
                        <div className="text-xs md:text-sm text-slate-600 mt-2 space-y-1">
                          <div>
                            <span className="text-slate-500">Costo:</span>{' '}
                            <span className="font-medium text-green-600">€ {parseFloat(item.totalCost).toFixed(2)}</span>
                          </div>
                          {item.unitWeight && (
                            <div>
                              <span className="text-slate-500">€/kg:</span>{' '}
                              <span className="font-medium text-blue-600">
                                € {(parseFloat(item.totalCost) / parseFloat(item.unitWeight)).toFixed(2)}/kg
                              </span>
                              <span className="text-slate-400 ml-1 text-xs">(peso: {parseFloat(item.unitWeight).toFixed(2)} kg)</span>
                            </div>
                          )}
                          {item.producedQuantity && (
                            <div>
                              <span className="text-slate-500">Prezzo unitario:</span>{' '}
                              <span className="font-medium text-purple-600">
                                € {(parseFloat(item.totalCost) / parseFloat(item.producedQuantity)).toFixed(2)}/unità
                              </span>
                              <span className="text-slate-400 ml-2">(quantità prodotta: {parseFloat(item.producedQuantity).toFixed(0)} unità)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecipeId(item.id)}
                        className="h-9"
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Dettagli</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="h-9"
                      >
                        <Pencil className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Modifica</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecipeForHistory(item.id);
                          setIsVersionHistoryOpen(true);
                        }}
                        className="h-9"
                      >
                        <History className="h-4 w-4 sm:mr-2" />
                        Storico
                      </Button>
                      <Button
                        variant={item.isActive === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive })}
                      >
                        {item.isActive === false ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Attiva
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Nascondi
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRecipeToDelete({ id: item.id, name: item.name });
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Controlli Paginazione */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1}-{Math.min(endIndex, recipes?.length || 0)} di {recipes?.length || 0} ricette
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        Prima
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Precedente
                      </Button>
                      <span className="text-sm px-3 py-1 bg-muted rounded">
                        Pagina {currentPage} di {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Successiva
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Ultima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessuna ricetta trovata</p>
              </div>
            )}          </CardContent>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {((recipeDetails.components as ComponentWithDetails[]) || []).map((comp: ComponentWithDetails, idx: number) => (
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

              {/* Sezione Allergeni */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Allergeni</h3>
                <AllergensSection recipeId={recipeDetails.id} />
              </div>
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
              <RecipeForm
                formData={editFormData}
                components={editComponents}
                onFormDataChange={setEditFormData}
                onComponentsChange={setEditComponents}
                showAllFields={true}
              />

              {/* Pulsanti */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annulla
                </Button>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Scarica PDF
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
            <RecipeForm
              formData={createFormData}
              components={createComponents}
              onFormDataChange={setCreateFormData}
              onComponentsChange={setCreateComponents}
              showAllFields={true}
            />

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
                  // Validazione campi obbligatori
                  if (!createFormData.conservationMethod || createFormData.conservationMethod.trim() === '') {
                    toast.error("Il metodo di conservazione è obbligatorio");
                    return;
                  }
                  if (!createFormData.maxConservationTime || createFormData.maxConservationTime.trim() === '') {
                    toast.error("Il tempo massimo di conservazione è obbligatorio");
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
                    isSellable: createFormData.isSellable ?? true,
                    isSemiFinished: createFormData.isSemiFinished ?? false,
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

      {/* Dialog Conferma Eliminazione */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la ricetta <strong>{recipeToDelete?.name}</strong>?
              <br />
              <span className="text-red-600 font-medium">Questa azione è irreversibile.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setRecipeToDelete(null);
              }}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (recipeToDelete) {
                  deleteMutation.mutate({ id: recipeToDelete.id });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Storico Versioni */}
      <VersionHistoryDialog
        isOpen={isVersionHistoryOpen}
        onClose={() => {
          setIsVersionHistoryOpen(false);
          setSelectedRecipeForHistory(null);
        }}
        recipeId={selectedRecipeForHistory}
        onRollback={() => {
          utils.finalRecipes.list.invalidate();
          setIsVersionHistoryOpen(false);
        }}
      />
    </DashboardLayout>
  );
}

// Componente Dialog Storico Versioni
function VersionHistoryDialog({
  isOpen,
  onClose,
  recipeId,
  onRollback,
}: {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string | null;
  onRollback: () => void;
}) {
  const { data: versions, isLoading } = trpc.finalRecipes.getVersions.useQuery(
    { id: recipeId! },
    { enabled: !!recipeId && isOpen }
  );

  const rollbackMutation = trpc.finalRecipes.rollbackVersion.useMutation({
    onSuccess: () => {
      toast.success("Versione ripristinata con successo!");
      onRollback();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante il ripristino");
    },
  });

  const handleRollback = (versionId: number) => {
    if (!recipeId) return;
    if (confirm("Sei sicuro di voler ripristinare questa versione?")) {
      rollbackMutation.mutate({ recipeId, versionId });
    }
  };

  const getComponentsDiff = (oldComponents: any[], newComponents: any[]) => {
    const changes: string[] = [];
    
    // Componenti aggiunti
    newComponents.forEach(nc => {
      const found = oldComponents.find(oc => oc.componentId === nc.componentId);
      if (!found) {
        changes.push(`+ Aggiunto: ${nc.componentName || nc.name} (${nc.quantity} ${nc.unit})`);
      } else if (found.quantity !== nc.quantity) {
        changes.push(`~ Modificato: ${nc.componentName || nc.name} da ${found.quantity} a ${nc.quantity} ${nc.unit}`);
      }
    });
    
    // Componenti rimossi
    oldComponents.forEach(oc => {
      const found = newComponents.find(nc => nc.componentId === oc.componentId);
      if (!found) {
        changes.push(`- Rimosso: ${oc.componentName || oc.name}`);
      }
    });
    
    return changes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Storico Versioni</DialogTitle>
          <DialogDescription>
            Visualizza le modifiche precedenti e ripristina una versione specifica
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Caricamento...</div>
          ) : !versions || versions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nessuna versione precedente disponibile
            </div>
          ) : (
            versions.map((version: any, index: number) => {
              const snapshot = version.snapshot as any;
              const prevVersion = versions[index + 1];
              const prevSnapshot = prevVersion?.snapshot as any;
              
              let componentsDiff: string[] = [];
              if (prevSnapshot) {
                const oldComps = typeof prevSnapshot.components === 'string' 
                  ? JSON.parse(prevSnapshot.components) 
                  : prevSnapshot.components || [];
                const newComps = typeof snapshot.components === 'string'
                  ? JSON.parse(snapshot.components)
                  : snapshot.components || [];
                componentsDiff = getComponentsDiff(oldComps, newComps);
              }

              return (
                <Card key={version.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Versione {version.versionNumber}
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Corrente
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(version.createdAt).toLocaleString('it-IT')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {version.changeDescription}
                        </p>
                      </div>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRollback(version.id)}
                          disabled={rollbackMutation.isPending}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <History className="h-4 w-4 mr-2" />
                          Ripristina
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Categoria:</span> {snapshot.category}
                        </div>
                        <div>
                          <span className="font-medium">Resa:</span> {parseFloat(snapshot.yieldPercentage).toFixed(1)}%
                        </div>
                        <div>
                          <span className="font-medium">Peso Finale:</span> {snapshot.unitWeight ? `${snapshot.unitWeight} kg` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Costo Totale:</span> €{parseFloat(snapshot.totalCost).toFixed(2)}
                        </div>
                      </div>
                      
                      {componentsDiff.length > 0 && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Modifiche rispetto alla versione precedente:</p>
                          <div className="space-y-1">
                            {componentsDiff.map((change, idx) => (
                              <p key={idx} className="text-xs font-mono">
                                {change.startsWith('+') && <span className="text-green-600">{change}</span>}
                                {change.startsWith('-') && <span className="text-red-600">{change}</span>}
                                {change.startsWith('~') && <span className="text-orange-600">{change}</span>}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
