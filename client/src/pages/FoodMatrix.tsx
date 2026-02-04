import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart3, Search, FileSpreadsheet, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function FoodMatrix() {
  const { data: allRecipes, isLoading } = trpc.finalRecipes.list.useQuery();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  const utils = trpc.useUtils();

  const updateMutation = trpc.finalRecipes.update.useMutation({
    onSuccess: () => {
      toast.success("Prezzo aggiornato!");
      setEditingPriceId(null);
      utils.finalRecipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento");
    },
  });

  // Filtra solo ricette vendibili
  const sellableRecipes = useMemo(() => {
    let filtered = (allRecipes || []).filter(r => r.isSellable !== false);
    
    // Filtro categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }
    
    // Filtro ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(term) || 
        r.code.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allRecipes, categoryFilter, searchTerm]);

  const handleStartEditPrice = (recipe: any) => {
    setEditingPriceId(recipe.id);
    setTempPrice(recipe.sellingPrice || "");
  };

  const handleSavePrice = (recipeId: string) => {
    const price = parseFloat(tempPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Inserisci un prezzo valido");
      return;
    }
    
    updateMutation.mutate({
      id: recipeId,
      sellingPrice: price,
    });
  };

  const handleCancelEdit = () => {
    setEditingPriceId(null);
    setTempPrice("");
  };

  const handleExport = () => {
    if (!sellableRecipes || sellableRecipes.length === 0) {
      toast.error('Nessun dato da esportare');
      return;
    }

    const headers = [
      'Codice',
      'Nome',
      'Categoria',
      'Costo Totale (€)',
      'Peso (kg)',
      'Prezzo al kg (€)',
      'Prezzo Vendita (€)',
      'Margine (€)',
      'Margine (%)'
    ];
    
    const rows = sellableRecipes.map(r => {
      const cost = parseFloat(r.totalCost || '0');
      const weight = parseFloat(r.unitWeight || '0');
      const pricePerKg = weight > 0 ? cost / weight : 0;
      const sellingPrice = parseFloat(r.sellingPrice || '0');
      const margin = sellingPrice - cost;
      const marginPercent = cost > 0 ? (margin / cost) * 100 : 0;
      
      return [
        r.code,
        r.name,
        r.category,
        cost.toFixed(2),
        weight.toFixed(3),
        pricePerKg.toFixed(2),
        sellingPrice.toFixed(2),
        margin.toFixed(2),
        marginPercent.toFixed(1)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `food_matrix_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export completato');
  };

  // Calcola statistiche
  const stats = useMemo(() => {
    const totalRecipes = sellableRecipes.length;
    const withPrice = sellableRecipes.filter(r => r.sellingPrice && parseFloat(r.sellingPrice) > 0).length;
    const avgMargin = sellableRecipes.reduce((sum, r) => {
      const cost = parseFloat(r.totalCost || '0');
      const price = parseFloat(r.sellingPrice || '0');
      const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
      return sum + margin;
    }, 0) / (totalRecipes || 1);
    
    return { totalRecipes, withPrice, avgMargin };
  }, [sellableRecipes]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Food Matrix</h1>
            <p className="text-slate-600 mt-1">
              Gestisci prezzi di vendita e margini per tutte le ricette vendibili
            </p>
          </div>
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Ricette Vendibili</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.withPrice} con prezzo impostato
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Margine Medio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {stats.avgMargin.toFixed(1)}%
                </div>
                {stats.avgMargin > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Categorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(sellableRecipes.map(r => r.category)).size}
              </div>
              <p className="text-xs text-slate-500 mt-1">Categorie attive</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ricette Vendibili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    <SelectItem value="Pane">Pane</SelectItem>
                    <SelectItem value="Carne">Carne</SelectItem>
                    <SelectItem value="Salse">Salse</SelectItem>
                    <SelectItem value="Verdure">Verdure</SelectItem>
                    <SelectItem value="Formaggi">Formaggi</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Ricerca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cerca per nome o codice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Tabella */}
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : sellableRecipes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 text-sm font-medium text-slate-700 border-b">Codice</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700 border-b">Nome</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700 border-b">Categoria</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-700 border-b">Costo (€)</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-700 border-b">Peso (kg)</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-700 border-b">€/kg</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-700 border-b">Prezzo Vendita (€)</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-700 border-b">Margine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellableRecipes.map((recipe: any) => {
                      const cost = parseFloat(recipe.totalCost || '0');
                      const weight = parseFloat(recipe.unitWeight || '0');
                      const pricePerKg = weight > 0 ? cost / weight : 0;
                      const sellingPrice = parseFloat(recipe.sellingPrice || '0');
                      const margin = sellingPrice - cost;
                      const marginPercent = cost > 0 ? (margin / cost) * 100 : 0;
                      const isEditing = editingPriceId === recipe.id;
                      
                      return (
                        <tr key={recipe.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-sm">{recipe.code}</td>
                          <td className="p-3 text-sm font-medium">{recipe.name}</td>
                          <td className="p-3 text-sm">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              {recipe.category}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right">€ {cost.toFixed(2)}</td>
                          <td className="p-3 text-sm text-right">{weight.toFixed(3)}</td>
                          <td className="p-3 text-sm text-right">€ {pricePerKg.toFixed(2)}</td>
                          <td className="p-3 text-sm text-right">
                            {isEditing ? (
                              <div className="flex items-center gap-2 justify-end">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                  className="w-24 h-8 text-right"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePrice(recipe.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSavePrice(recipe.id)}
                                  className="h-8 px-2"
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditPrice(recipe)}
                                className="hover:bg-slate-100 px-2 py-1 rounded"
                              >
                                {sellingPrice > 0 ? `€ ${sellingPrice.toFixed(2)}` : '—'}
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-sm text-right">
                            {sellingPrice > 0 ? (
                              <div>
                                <div className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  € {margin.toFixed(2)}
                                </div>
                                <div className={`text-xs ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({marginPercent.toFixed(1)}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nessuna ricetta vendibile trovata
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
