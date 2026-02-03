import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Production() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split('T')[0],
    recipeFinalId: "",
    desiredQuantity: 1,
    unitType: "k" as "k" | "u",
  });

  const utils = trpc.useUtils();
  const { data: productions, isLoading } = trpc.production.list.useQuery({ weekStartDate: undefined });
  const { data: finalRecipes } = trpc.finalRecipes.list.useQuery();
  
  const createMutation = trpc.production.create.useMutation({
    onSuccess: () => {
      utils.production.list.invalidate();
      setIsOpen(false);
      toast.success("Produzione creata con successo");
      setFormData({
        weekStartDate: new Date().toISOString().split('T')[0],
        recipeFinalId: "",
        desiredQuantity: 1,
        unitType: "k",
      });
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.recipeFinalId) {
      toast.error("Seleziona una ricetta");
      return;
    }
    createMutation.mutate({
      ...formData,
      weekStartDate: new Date(formData.weekStartDate),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Produzione Settimanale</h1>
            <p className="text-slate-600 mt-1">Pianifica e gestisci la produzione</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Produzione
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crea Nuova Produzione</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Data Inizio Settimana</Label>
                  <Input
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ricetta</Label>
                  <Select
                    value={formData.recipeFinalId}
                    onValueChange={(value) => setFormData({ ...formData, recipeFinalId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ricetta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {finalRecipes?.map((recipe: any) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantità Desiderata</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.desiredQuantity}
                    onChange={(e) => setFormData({ ...formData, desiredQuantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Unità</Label>
                  <Select
                    value={formData.unitType}
                    onValueChange={(value: "k" | "u") => setFormData({ ...formData, unitType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="k">Kg</SelectItem>
                      <SelectItem value="u">Unità</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creazione..." : "Crea Produzione"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Produzioni Pianificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : productions && productions.length > 0 ? (
              <div className="space-y-4">
                {productions.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <p className="font-semibold">Ricetta ID: {item.recipeFinalId}</p>
                    <p className="text-sm text-slate-500">
                      Quantità: {item.desiredQuantity} {item.unitType === 'k' ? 'kg' : 'unità'} - Status: {item.status}
                    </p>
                    <p className="text-xs text-slate-400">
                      Settimana: {new Date(item.weekStartDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessuna produzione pianificata</p>
                <p className="text-sm mt-2">Clicca su "Nuova Produzione" per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
