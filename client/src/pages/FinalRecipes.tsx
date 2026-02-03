import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ChefHat, Plus } from "lucide-react";
import { toast } from "sonner";

export default function FinalRecipes() {
  const { data: recipes, isLoading } = trpc.finalRecipes.list.useQuery();

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
                  <div key={item.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-slate-500">Codice: {item.code}</p>
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
    </DashboardLayout>
  );
}
