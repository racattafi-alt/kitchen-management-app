import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChefHat, Plus } from "lucide-react";
import RecipeDetailDialog from "@/components/RecipeDetailDialog";

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'final' | 'semi' | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Carica ricette finali
  const { data: finalRecipes, isLoading: loadingFinal } = trpc.finalRecipes.list.useQuery();
  
  // Carica semilavorati
  const { data: semiFinished, isLoading: loadingSemi } = trpc.semiFinished.list.useQuery();

  // Combina ricette finali e semilavorati
  const allRecipes = [
    ...(finalRecipes || []).map((r: any) => ({ ...r, type: 'final' as const })),
    ...(semiFinished || []).map((s: any) => ({ ...s, type: 'semi' as const })),
  ];

  // Filtra per ricerca
  const filteredRecipes = allRecipes.filter((recipe: any) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Raggruppa per categoria
  const groupedByCategory = filteredRecipes.reduce((groups: Record<string, any[]>, recipe: any) => {
    const category = recipe.category || 'Altro';
    if (!groups[category]) groups[category] = [];
    groups[category].push(recipe);
    return groups;
  }, {});

  const categories = Object.keys(groupedByCategory).sort();

  const handleRecipeClick = (recipeId: string, recipeType: 'final' | 'semi') => {
    setSelectedRecipeId(recipeId);
    setSelectedRecipeType(recipeType);
    setIsDetailOpen(true);
  };

  const isLoading = loadingFinal || loadingSemi;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ricette</h1>
            <p className="text-muted-foreground mt-2">
              Gestisci ricette finali e semilavorati con ingredienti e procedura
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Ricetta
          </Button>
        </div>

        {/* Barra Ricerca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca ricetta per nome, codice o categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Totale ricette:</span>
              <Badge variant="secondary">{filteredRecipes.length}</Badge>
              <span className="mx-2">•</span>
              <span>Finali:</span>
              <Badge variant="secondary">{finalRecipes?.length || 0}</Badge>
              <span className="mx-2">•</span>
              <span>Semilavorati:</span>
              <Badge variant="secondary">{semiFinished?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista Ricette per Categoria */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Caricamento ricette...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ChefHat className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nessuna ricetta trovata</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  {category}
                  <Badge variant="secondary">{groupedByCategory[category].length}</Badge>
                </h2>
                <div className="grid gap-3">
                  {groupedByCategory[category].map((recipe: any) => (
                    <Card
                      key={recipe.id}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handleRecipeClick(recipe.id, recipe.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChefHat className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-medium">{recipe.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {recipe.code || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={recipe.type === 'final' ? 'default' : 'secondary'}>
                              {recipe.type === 'final' ? 'Ricetta Finale' : 'Semilavorato'}
                            </Badge>
                            {recipe.type === 'final' && recipe.totalCost && (
                              <Badge variant="outline">
                                € {Number(recipe.totalCost).toFixed(2)}/kg
                              </Badge>
                            )}
                            {recipe.type === 'semi' && recipe.finalPricePerKg && (
                              <Badge variant="outline">
                                € {Number(recipe.finalPricePerKg).toFixed(2)}/kg
                              </Badge>
                            )}
                            <Badge variant="outline">
                              Resa: {recipe.yieldPercentage}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Dettaglio Ricetta */}
      <RecipeDetailDialog
        recipeId={selectedRecipeId}
        recipeType={selectedRecipeType}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </DashboardLayout>
  );
}
