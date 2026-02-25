import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ChefHat, Package, ArrowLeft, Calculator } from "lucide-react";
import { useLocation } from "wouter";

export default function RecipeDetails() {
  const [, navigate] = useLocation();
  
  const { data: semiFinished, isLoading: loadingSemi } = trpc.semiFinished.list.useQuery();
  const { data: finalRecipes, isLoading: loadingFinal } = trpc.finalRecipes.list.useQuery();

  const allRecipes = [
    ...(semiFinished || []).map((r: any) => ({ ...r, type: "SEMI_FINISHED" })),
    ...(finalRecipes || []).map((r: any) => ({ ...r, type: "FINAL_RECIPE" })),
  ];

  const isLoading = loadingSemi || loadingFinal;

  const RecipeCard = ({ recipe }: { recipe: any }) => {
    const components = typeof recipe.components === 'string' 
      ? JSON.parse(recipe.components || '[]') 
      : (recipe.components || []);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                {recipe.type === "SEMI_FINISHED" ? (
                  <Package className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChefHat className="h-5 w-5 text-purple-600" />
                )}
                {recipe.name}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">Codice: {recipe.code}</p>
            </div>
            <Badge variant={recipe.type === "SEMI_FINISHED" ? "secondary" : "default"}>
              {recipe.type === "SEMI_FINISHED" ? "Semilavorato" : "Ricetta Finale"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informazioni Base */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Categoria:</span>
              <p className="font-medium">{recipe.category || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">Resa:</span>
              <p className="font-medium">{Number(recipe.yieldPercentage || 0) * 100}%</p>
            </div>
            <div>
              <span className="text-slate-500">Conservazione:</span>
              <p className="font-medium">{recipe.storageMethod || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">Scarto Servizio:</span>
              <p className="font-medium">{Number(recipe.serviceWastePercentage || 0) * 100}%</p>
            </div>
          </div>

          {/* Costi */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-slate-600" />
              <span className="font-semibold text-slate-700">Analisi Costi</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Costo Totale:</span>
                <p className="font-bold text-lg text-slate-900">
                  €{Number(recipe.totalCost || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Prezzo/kg:</span>
                <p className="font-bold text-lg text-slate-900">
                  €{Number(recipe.finalPricePerKg || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Componenti */}
          {components.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Componenti ({components.length})</h4>
              <div className="space-y-2">
                {components.slice(0, 3).map((comp: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                    <span className="text-slate-700">
                      {comp.ingredientId ? "Ingrediente" : "Semilavorato"} #{comp.ingredientId || comp.semiFinishedId}
                    </span>
                    <span className="font-medium">{comp.quantity}g</span>
                  </div>
                ))}
                {components.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{components.length - 3} altri componenti
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Database Ricette</h1>
            <p className="text-slate-600 mt-1">
              Visualizza tutte le ricette con dettagli completi
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Tutte ({allRecipes.length})
            </TabsTrigger>
            <TabsTrigger value="semi">
              Semilavorati ({semiFinished?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="final">
              Ricette Finali ({finalRecipes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Caricamento...</div>
            ) : allRecipes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allRecipes.map((recipe: any) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Nessuna ricetta disponibile
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="semi" className="mt-6">
            {loadingSemi ? (
              <div className="text-center py-12">Caricamento...</div>
            ) : semiFinished && semiFinished.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {semiFinished.map((recipe: any) => (
                  <RecipeCard key={recipe.id} recipe={{ ...recipe, type: "SEMI_FINISHED" }} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Nessun semilavorato disponibile
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="final" className="mt-6">
            {loadingFinal ? (
              <div className="text-center py-12">Caricamento...</div>
            ) : finalRecipes && finalRecipes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {finalRecipes.map((recipe: any) => (
                  <RecipeCard key={recipe.id} recipe={{ ...recipe, type: "FINAL_RECIPE" }} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Nessuna ricetta finale disponibile
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
