import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChefHat, Package, Plus } from "lucide-react";

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: semiFinished, isLoading: loadingSemi } = trpc.semiFinished.list.useQuery();
  const { data: finalRecipes, isLoading: loadingFinal } = trpc.finalRecipes.list.useQuery();

  const filteredSemi = semiFinished?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedCategory || item.category === selectedCategory)
  );

  const filteredFinal = finalRecipes?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedCategory || item.category === selectedCategory)
  );

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Database Ricette</h1>
            <p className="text-muted-foreground mt-2">
              Gestisci semilavorati e ricette finali
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Ricetta
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca ricette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="semi" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="semi">
              <Package className="mr-2 h-4 w-4" />
              Semilavorati ({semiFinished?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="final">
              <ChefHat className="mr-2 h-4 w-4" />
              Ricette Finali ({finalRecipes?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Semilavorati Tab */}
          <TabsContent value="semi" className="mt-6">
            {loadingSemi ? (
              <div className="text-center py-12">Caricamento...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSemi?.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{item.code}</p>
                        </div>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resa:</span>
                          <span className="font-medium">{item.yieldPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conservazione:</span>
                          <span className="font-medium">{item.shelfLifeDays} giorni</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Costo/kg:</span>
                          <span className="font-semibold text-primary">
                            €{Number(item.finalPricePerKg || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ricette Finali Tab */}
          <TabsContent value="final" className="mt-6">
            {loadingFinal ? (
              <div className="text-center py-12">Caricamento...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFinal?.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{item.code}</p>
                        </div>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resa:</span>
                          <span className="font-medium">{item.yieldPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conservazione:</span>
                          <span className="font-medium">{item.conservationMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scarto servizio:</span>
                          <span className="font-medium">{item.serviceWastePercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Costo totale:</span>
                          <span className="font-semibold text-primary">
                            €{Number(item.totalCost || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
