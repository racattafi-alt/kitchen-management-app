import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export default function CostAnalysisDashboard() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"totalCost" | "pricePerUnit" | "yieldPercentage">("totalCost");
  
  const { data: finalRecipes, isLoading } = trpc.finalRecipes.list.useQuery();

  const categories = ["Pane", "Carne", "Salse", "Verdure", "Formaggi"];
  
  const filteredRecipes = useMemo(() => {
    if (!finalRecipes) return [];
    
    let filtered = finalRecipes.filter((recipe: any) => 
      categories.includes(recipe.category)
    );
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter((recipe: any) => recipe.category === selectedCategory);
    }
    
    return filtered.sort((a: any, b: any) => {
      const aValue = parseFloat(a[sortBy]) || 0;
      const bValue = parseFloat(b[sortBy]) || 0;
      return bValue - aValue; // Descending order
    });
  }, [finalRecipes, selectedCategory, sortBy]);

  const stats = useMemo(() => {
    if (!filteredRecipes.length) return { avgCost: 0, maxCost: 0, minCost: 0, avgYield: 0 };
    
    const costs = filteredRecipes.map((r: any) => parseFloat(r.totalCost) || 0);
    const yields = filteredRecipes.map((r: any) => parseFloat(r.yieldPercentage) || 0);
    
    return {
      avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
      maxCost: Math.max(...costs),
      minCost: Math.min(...costs),
      avgYield: yields.reduce((a, b) => a + b, 0) / yields.length,
    };
  }, [filteredRecipes]);

  const canViewPrices = user?.role === "admin" || user?.role === "manager";

  const handleExportExcel = () => {
    if (!filteredRecipes.length) return;
    
    // Prepare CSV data
    const headers = ["Codice", "Nome", "Categoria", "Costo Totale (€)", "Prezzo/kg (€)", "Prezzo Unitario (€)", "Resa (%)"];
    const rows = filteredRecipes.map((recipe: any) => {
      const pricePerKg = recipe.unitWeight > 0 ? (parseFloat(recipe.totalCost) / parseFloat(recipe.unitWeight)).toFixed(2) : "N/A";
      const pricePerUnit = recipe.producedQuantity > 0 ? (parseFloat(recipe.totalCost) / parseFloat(recipe.producedQuantity)).toFixed(2) : "N/A";
      
      return [
        recipe.code,
        recipe.name,
        recipe.category,
        parseFloat(recipe.totalCost).toFixed(2),
        pricePerKg,
        pricePerUnit,
        parseFloat(recipe.yieldPercentage).toFixed(1)
      ];
    });
    
    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analisi_costi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canViewPrices) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Accesso Limitato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Solo amministratori e manager possono visualizzare l'analisi costi.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Analisi Costi</h1>
            <p className="text-slate-600 mt-2">Analisi comparativa costi e resa ricette finali</p>
          </div>
          <Button
            onClick={handleExportExcel}
            disabled={!filteredRecipes.length}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Esporta Excel
          </Button>
        </div>

        {/* Statistiche Generali */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Costo Medio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                €{stats.avgCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Costo Massimo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                €{stats.maxCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Costo Minimo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{stats.minCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Resa Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgYield.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtri */}
        <Card>
          <CardHeader>
            <CardTitle>Filtri e Ordinamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ordina per</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalCost">Costo Totale</SelectItem>
                    <SelectItem value="pricePerUnit">Prezzo Unitario</SelectItem>
                    <SelectItem value="yieldPercentage">Resa %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grafico a Barre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Confronto Ricette per {sortBy === "totalCost" ? "Costo Totale" : sortBy === "pricePerUnit" ? "Prezzo Unitario" : "Resa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Caricamento...</div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nessuna ricetta trovata</div>
            ) : (
              <div className="space-y-3">
                {filteredRecipes.map((recipe: any, index: number) => {
                  const value = parseFloat(recipe[sortBy]) || 0;
                  const maxValue = sortBy === "totalCost" ? stats.maxCost : 
                                  sortBy === "pricePerUnit" ? Math.max(...filteredRecipes.map((r: any) => parseFloat(r.pricePerUnit) || 0)) :
                                  100;
                  const percentage = (value / maxValue) * 100;
                  const isHighest = index === 0;
                  const isLowest = index === filteredRecipes.length - 1;
                  
                  return (
                    <div key={recipe.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{recipe.name}</span>
                          <span className="text-xs text-slate-500">({recipe.category})</span>
                          {isHighest && sortBy === "totalCost" && (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <TrendingUp className="h-3 w-3" />
                              Più costoso
                            </span>
                          )}
                          {isLowest && sortBy === "totalCost" && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <TrendingDown className="h-3 w-3" />
                              Meno costoso
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-emerald-600">
                          {sortBy === "yieldPercentage" ? `${value.toFixed(1)}%` : `€${value.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full flex items-center px-3 text-xs font-medium text-white transition-all ${
                            isHighest && sortBy === "totalCost" ? "bg-red-500" :
                            isLowest && sortBy === "totalCost" ? "bg-green-500" :
                            "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                          {recipe.code}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabella Dettagliata */}
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio Ricette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Codice</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Categoria</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Costo Totale</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Prezzo/kg</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Prezzo Unitario</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Resa %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipes.map((recipe: any) => {
                    const pricePerKg = recipe.unitWeight > 0 ? (parseFloat(recipe.totalCost) / parseFloat(recipe.unitWeight)).toFixed(2) : "N/A";
                    const pricePerUnit = recipe.producedQuantity > 0 ? (parseFloat(recipe.totalCost) / parseFloat(recipe.producedQuantity)).toFixed(2) : "N/A";
                    
                    return (
                      <tr key={recipe.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-sm">{recipe.code}</td>
                        <td className="py-3 px-4">{recipe.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">
                            {recipe.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                          €{parseFloat(recipe.totalCost).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pricePerKg !== "N/A" ? `€${pricePerKg}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pricePerUnit !== "N/A" ? `€${pricePerUnit}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {parseFloat(recipe.yieldPercentage).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
