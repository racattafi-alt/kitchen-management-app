import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Ingredients() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    supplier: "",
    category: "Altro" as const,
    unitType: "k" as const,
    packageQuantity: 0,
    packagePrice: 0,
    brand: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: ingredients, isLoading } = trpc.ingredients.list.useQuery();
  const createMutation = trpc.ingredients.create.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Ingrediente creato con successo");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.ingredients.delete.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      toast.success("Ingrediente eliminato");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const canEdit = user?.role === "admin" || user?.role === "manager";
  const canDelete = user?.role === "admin";
  const canViewPrices = user?.role === "admin" || user?.role === "manager";

  const resetForm = () => {
    setFormData({
      name: "",
      supplier: "",
      category: "Altro",
      unitType: "k",
      packageQuantity: 0,
      packagePrice: 0,
      brand: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ingredienti</h1>
            <p className="text-slate-600 mt-1">
              Gestisci le materie prime (Livello 0)
            </p>
          </div>
          {canEdit && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Ingrediente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Aggiungi Ingrediente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Fornitore</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Additivi">Additivi</SelectItem>
                          <SelectItem value="Carni">Carni</SelectItem>
                          <SelectItem value="Farine">Farine</SelectItem>
                          <SelectItem value="Latticini">Latticini</SelectItem>
                          <SelectItem value="Verdura">Verdura</SelectItem>
                          <SelectItem value="Spezie">Spezie</SelectItem>
                          <SelectItem value="Altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unitType">Unità di Misura</Label>
                      <Select
                        value={formData.unitType}
                        onValueChange={(value: any) => setFormData({ ...formData, unitType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="k">Chilogrammi (kg)</SelectItem>
                          <SelectItem value="u">Unità (pz)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="packageQuantity">Quantità Confezione</Label>
                      <Input
                        id="packageQuantity"
                        type="number"
                        step="0.001"
                        value={formData.packageQuantity}
                        onChange={(e) => setFormData({ ...formData, packageQuantity: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="packagePrice">Prezzo Confezione (€)</Label>
                      <Input
                        id="packagePrice"
                        type="number"
                        step="0.01"
                        value={formData.packagePrice}
                        onChange={(e) => setFormData({ ...formData, packagePrice: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Marca (opzionale)</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Note (opzionale)</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Annulla
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      Salva
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Lista Ingredienti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : ingredients && ingredients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead>Unità</TableHead>
                    {canViewPrices && <TableHead>Prezzo/kg o unità</TableHead>}
                    {canEdit && <TableHead>Azioni</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ingredient: any) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-sm">
                          {ingredient.category}
                        </span>
                      </TableCell>
                      <TableCell>{ingredient.supplier}</TableCell>
                      <TableCell>{ingredient.unitType === "k" ? "kg" : "pz"}</TableCell>
                      {canViewPrices && (
                        <TableCell className="font-semibold text-emerald-600">
                          €{parseFloat(ingredient.pricePerKgOrUnit).toFixed(2)}
                        </TableCell>
                      )}
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate({ id: ingredient.id })}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessun ingrediente trovato</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsOpen(true)}
                  >
                    Aggiungi il primo ingrediente
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
