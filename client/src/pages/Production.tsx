import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function Production() {
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split('T')[0],
    recipeSearch: "",
    recipeFinalId: "",
    recipeName: "",
    desiredQuantity: "",
    unitType: "k" as "k" | "u",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: productions, isLoading } = trpc.production.list.useQuery({ weekStartDate: undefined });
  const { data: finalRecipes } = trpc.finalRecipes.list.useQuery();
  
  const createMutation = trpc.production.create.useMutation({
    onSuccess: () => {
      utils.production.list.invalidate();
      utils.production.listWeekly.invalidate();
      toast.success("Produzione creata con successo");
      resetForm();
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

  const filteredRecipes = useMemo(() => {
    if (!finalRecipes || !formData.recipeSearch) return [];
    const search = formData.recipeSearch.toLowerCase();
    return finalRecipes
      .filter((r: any) => 
        r.name.toLowerCase().includes(search) || 
        r.code.toLowerCase().includes(search)
      )
      .slice(0, 5);
  }, [finalRecipes, formData.recipeSearch]);

  const resetForm = () => {
    setFormData({
      weekStartDate: new Date().toISOString().split('T')[0],
      recipeSearch: "",
      recipeFinalId: "",
      recipeName: "",
      desiredQuantity: "",
      unitType: "k",
    });
    setShowSuggestions(false);
    setEditingId(null);
  };

  const handleSelectRecipe = (recipe: any) => {
    setFormData({
      ...formData,
      recipeSearch: recipe.name,
      recipeFinalId: recipe.id,
      recipeName: recipe.name,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipeFinalId) {
      toast.error("Seleziona una ricetta valida");
      return;
    }
    if (!formData.desiredQuantity || Number(formData.desiredQuantity) <= 0) {
      toast.error("Inserisci una quantità valida");
      return;
    }

    createMutation.mutate({
      weekStartDate: new Date(formData.weekStartDate),
      recipeFinalId: formData.recipeFinalId,
      desiredQuantity: Number(formData.desiredQuantity),
      unitType: formData.unitType,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa produzione?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestione Produzioni</h1>
            <p className="text-muted-foreground mt-2">
              Pianifica la produzione settimanale
            </p>
          </div>
        </div>

        {/* Form Inline per Nuova Produzione */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Aggiungi Nuova Produzione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Data Lunedì Settimana */}
                <div className="space-y-2">
                  <Label htmlFor="weekStartDate">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Lunedì Settimana
                  </Label>
                  <Input
                    id="weekStartDate"
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                    required
                    title="Seleziona il lunedì della settimana di produzione"
                  />
                </div>

                {/* Ricerca Ricetta con Autocomplete */}
                <div className="space-y-2 relative">
                  <Label htmlFor="recipeSearch">
                    <Search className="inline h-4 w-4 mr-1" />
                    Ricetta
                  </Label>
                  <Input
                    id="recipeSearch"
                    type="text"
                    placeholder="Cerca ricetta..."
                    value={formData.recipeSearch}
                    onChange={(e) => {
                      setFormData({ ...formData, recipeSearch: e.target.value, recipeFinalId: "", recipeName: "" });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    required
                  />
                  
                  {/* Dropdown Suggerimenti */}
                  {showSuggestions && filteredRecipes.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredRecipes.map((recipe: any) => (
                        <button
                          key={recipe.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
                          onClick={() => handleSelectRecipe(recipe)}
                        >
                          <span>{recipe.name}</span>
                          <Badge variant="outline">{recipe.code}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantità */}
                <div className="space-y-2">
                  <Label htmlFor="desiredQuantity">Quantità</Label>
                  <Input
                    id="desiredQuantity"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="1.000"
                    value={formData.desiredQuantity}
                    onChange={(e) => setFormData({ ...formData, desiredQuantity: e.target.value })}
                    required
                  />
                </div>

                {/* Unità */}
                <div className="space-y-2">
                  <Label htmlFor="unitType">Unità</Label>
                  <select
                    id="unitType"
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value as "k" | "u" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="k">Kg</option>
                    <option value="u">Unità</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || !formData.recipeFinalId}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Aggiorna Produzione" : "Aggiungi Produzione"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annulla
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista Produzioni */}
        <Card>
          <CardHeader>
            <CardTitle>Produzioni Pianificate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                      <TableCell>{Number(prod.desiredQuantity || 0).toFixed(3)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {prod.unitType === "k" ? "Kg" : "Unità"}
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
      </div>
    </DashboardLayout>
  );
}
