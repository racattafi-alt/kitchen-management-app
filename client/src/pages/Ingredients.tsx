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
import { Plus, Package, Pencil, Trash2, Download, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { STANDARD_ALLERGENS } from "../../../shared/allergens";

export default function Ingredients() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportingSala, setIsImportingSala] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all"); // all, food, non-food
  const [sortBy, setSortBy] = useState<"name" | "category" | "supplier">("name");
  const [formData, setFormData] = useState({
    name: "",
    supplier: "",
    category: "Altro" as const,
    unitType: "k" as const,
    packageType: "" as "Sacco" | "Busta" | "Brick" | "Cartone" | "Scatola" | "Bottiglia" | "Barattolo" | "Sfuso" | "",
    department: "Cucina" as "Cucina" | "Sala",
    packageQuantity: 0,
    packagePrice: 0,
    brand: "",
    notes: "",
    allergens: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    supplierId: "",
    category: "Altro" as const,
    unitType: "k" as const,
    packageType: "" as "Sacco" | "Busta" | "Brick" | "Cartone" | "Scatola" | "Bottiglia" | "Barattolo" | "Sfuso" | "",
    department: "Cucina" as "Cucina" | "Sala",
    packageQuantity: 0,
    packagePrice: 0,
    brand: "",
    notes: "",
    isFood: true,
    allergens: [] as string[],
  });

  const utils = trpc.useUtils();
  const { data: ingredientsRaw, isLoading } = trpc.ingredients.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  
  const ingredients = ingredientsRaw
    ?.filter((ingredient: any) => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || ingredient.category === selectedCategory;
      const matchesFoodType = selectedFoodType === "all" || 
        (selectedFoodType === "food" && ingredient.isFood) ||
        (selectedFoodType === "non-food" && !ingredient.isFood);
      return matchesSearch && matchesCategory && matchesFoodType;
    })
    ?.sort((a: any, b: any) => {
      // Mappare sortBy al campo corretto
      const fieldName = sortBy === 'supplier' ? 'supplierName' : sortBy;
      let compareA = a[fieldName] || '';
      let compareB = b[fieldName] || '';
      
      if (typeof compareA === 'string') compareA = compareA.toLowerCase();
      if (typeof compareB === 'string') compareB = compareB.toLowerCase();
      
      // Sempre ordinamento alfabetico ascendente
      if (compareA < compareB) return -1;
      if (compareA > compareB) return 1;
      return 0;
    });
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

  const updateMutation = trpc.ingredients.update.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      setIsEditOpen(false);
      setEditingIngredient(null);
      toast.success("Ingrediente aggiornato con successo");
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

  const exportQuery = trpc.ingredients.exportToExcel.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.ingredients.importFromExcel.useMutation({
    onSuccess: (result) => {
      utils.ingredients.list.invalidate();
      setIsImportOpen(false);
      setSelectedFile(null);
      if (result.errors && result.errors.length > 0) {
        toast.warning(`Importati ${result.imported} ingredienti con ${result.errors.length} errori`);
      } else {
        toast.success(`${result.imported} ingredienti importati con successo`);
      }
    },
    onError: (error) => {
      toast.error(`Errore import: ${error.message}`);
    },
  });

  const handleExportExcel = async () => {
    const result = await exportQuery.refetch();
    if (result.data) {
      const data = result.data;
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("File Excel esportato con successo");
    } else if (result.error) {
      toast.error(`Errore export: ${result.error.message}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImportSalaData = async () => {
    setIsImportingSala(true);
    try {
      const response = await fetch('/sala_data.json');
      const salaData = await response.json();
      
      let updated = 0;
      for (const item of salaData) {
        try {
          await updateMutation.mutateAsync({
            id: item.id,
            name: item.name,
            supplier: item.supplier || undefined,
            category: item.category,
            unitType: item.unitType,
            packageType: item.packageType || undefined,
            packageQuantity: item.packageQuantity,
            packagePrice: item.packagePrice,
            pricePerKgOrUnit: item.pricePerKgOrUnit,
            minOrderQuantity: item.minOrderQuantity,
            brand: item.brand || undefined,
            notes: item.notes || undefined,
          });
          updated++;
        } catch (err) {
          console.error(`Errore aggiornamento ${item.id}:`, err);
        }
      }
      
      toast.success(`Importati ${updated}/${salaData.length} ingredienti sala!`);
      utils.ingredients.list.invalidate();
    } catch (error) {
      toast.error('Errore durante l\'import dei dati sala');
      console.error(error);
    } finally {
      setIsImportingSala(false);
    }
  };

  const handleImportExcel = async () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1]; // Rimuovi prefix data:...
      
      importMutation.mutate({
        fileData: base64Data,
        filename: selectedFile.name
      });
    };
    reader.readAsDataURL(selectedFile);
  };



  const canEdit = user?.role === "admin" || user?.role === "manager";
  const canDelete = user?.role === "admin";
  const canViewPrices = user?.role === "admin" || user?.role === "manager";

  const resetForm = () => {
    setFormData({
      name: "",
      supplier: "",
      category: "Altro" as const,
      unitType: "k" as const,
      packageType: "",
      department: "Cucina" as "Cucina" | "Sala",
      packageQuantity: 0,
      packagePrice: 0,
      brand: "",
      notes: "",
      allergens: [] as string[],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione prezzi
    if (formData.packagePrice < 0) {
      toast.error("Il prezzo non può essere negativo");
      return;
    }
    if (formData.packageQuantity <= 0) {
      toast.error("La quantità deve essere maggiore di zero");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }
    
    const pricePerUnit = formData.packagePrice / formData.packageQuantity;
    // Warning per prezzi anomali
    if (pricePerUnit > 100) {
      toast.warning(`Attenzione: prezzo unitario elevato (€${pricePerUnit.toFixed(2)}/${formData.unitType === 'k' ? 'kg' : 'pz'})`);
    }
    
    createMutation.mutate({
      id: crypto.randomUUID(),
      name: formData.name,
      supplierId: formData.supplier || undefined,
      category: formData.category,
      unitType: formData.unitType,
      packageType: formData.packageType || undefined,
      department: formData.department,
      packageQuantity: formData.packageQuantity,
      packagePrice: formData.packagePrice,
      pricePerKgOrUnit: pricePerUnit,
      brand: formData.brand || undefined,
      notes: formData.notes || undefined,
      allergens: formData.allergens,
    });
  };

  const handleEdit = (ingredient: any) => {
    setEditingIngredient(ingredient);
    setEditFormData({
      name: ingredient.name,
      supplierId: ingredient.supplierId || "",
      category: ingredient.category,
      unitType: ingredient.unitType,
      packageType: ingredient.packageType || "",
      department: ingredient.department || "Cucina",
      packageQuantity: parseFloat(ingredient.packageQuantity) || 0,
      packagePrice: parseFloat(ingredient.packagePrice) || 0,
      brand: ingredient.brand || "",
      notes: ingredient.notes || "",
      isFood: ingredient.isFood !== false,
      allergens: ingredient.allergens || [],
    });
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    
    const pkgQty = parseFloat(editFormData.packageQuantity as any) || 0;
    const pkgPrice = parseFloat(editFormData.packagePrice as any) || 0;
    
    // Validazione prezzi
    if (pkgPrice < 0) {
      toast.error("Il prezzo non può essere negativo");
      return;
    }
    if (pkgQty <= 0) {
      toast.error("La quantità deve essere maggiore di zero");
      return;
    }
    if (!editFormData.name.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }
    
    const pricePerUnit = pkgPrice / pkgQty;
    // Warning per prezzi anomali
    if (pricePerUnit > 100) {
      toast.warning(`Attenzione: prezzo unitario elevato (€${pricePerUnit.toFixed(2)}/${editFormData.unitType === 'k' ? 'kg' : 'pz'})`);
    }
    
    updateMutation.mutate({
      id: editingIngredient.id,
      name: editFormData.name,
      supplierId: editFormData.supplierId || undefined,
      category: editFormData.category,
      unitType: editFormData.unitType,
      packageType: editFormData.packageType || undefined,
      department: editFormData.department,
      packageQuantity: pkgQty,
      packagePrice: pkgPrice,
      brand: editFormData.brand || undefined,
      notes: editFormData.notes || undefined,
      isFood: editFormData.isFood,
      allergens: editFormData.allergens,
    });
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
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleImportSalaData}
                  disabled={isImportingSala}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImportingSala ? 'Importazione...' : 'Importa Dati Sala'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  disabled={exportQuery.isFetching}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportQuery.isFetching ? 'Esportazione...' : 'Esporta Excel'}
                </Button>
                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Importa Excel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importa Ingredienti da Excel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="excel-file">File Excel</Label>
                        <Input
                          id="excel-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                        />
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>Il file deve contenere le colonne:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>ID (obbligatorio)</li>
                          <li>Nome, Categoria, Qtà Confezione, Prezzo Confezione, ecc.</li>
                        </ul>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                          Annulla
                        </Button>
                        <Button 
                          onClick={handleImportExcel}
                          disabled={!selectedFile || importMutation.isPending}
                        >
                          {importMutation.isPending ? 'Importazione...' : 'Importa'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {canEdit && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Ingrediente
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Aggiungi Ingrediente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <SelectItem value="Alcolici">Alcolici</SelectItem>
                          <SelectItem value="Bevande">Bevande</SelectItem>
                          <SelectItem value="Birra">Birra</SelectItem>
                          <SelectItem value="Carni">Carni</SelectItem>
                          <SelectItem value="Farine">Farine</SelectItem>
                          <SelectItem value="Latticini">Latticini</SelectItem>
                          <SelectItem value="Non Food">Non Food</SelectItem>
                          <SelectItem value="Packaging">Packaging</SelectItem>
                          <SelectItem value="Spezie">Spezie</SelectItem>
                          <SelectItem value="Verdura">Verdura</SelectItem>
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
                      <Label htmlFor="packageType">Tipo Confezione</Label>
                      <Select
                        value={formData.packageType}
                        onValueChange={(value: any) => setFormData({ ...formData, packageType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sacco">Sacco</SelectItem>
                          <SelectItem value="Busta">Busta</SelectItem>
                          <SelectItem value="Brick">Brick</SelectItem>
                          <SelectItem value="Cartone">Cartone</SelectItem>
                          <SelectItem value="Scatola">Scatola</SelectItem>
                          <SelectItem value="Bottiglia">Bottiglia</SelectItem>
                          <SelectItem value="Barattolo">Barattolo</SelectItem>
                          <SelectItem value="Sfuso">Sfuso (peso variabile)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Reparto</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value: any) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona reparto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cucina">Cucina</SelectItem>
                          <SelectItem value="Sala">Sala</SelectItem>
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
                    <div className="col-span-2">
                      <Label>Allergeni</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
                        {STANDARD_ALLERGENS.map((allergen) => (
                          <div key={allergen} className="flex items-center space-x-2">
                            <Checkbox
                              id={`allergen-${allergen}`}
                              checked={formData.allergens.includes(allergen)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({ ...formData, allergens: [...formData.allergens, allergen] });
                                } else {
                                  setFormData({ ...formData, allergens: formData.allergens.filter(a => a !== allergen) });
                                }
                              }}
                            />
                            <label htmlFor={`allergen-${allergen}`} className="text-sm cursor-pointer">
                              {allergen}
                            </label>
                          </div>
                        ))}
                      </div>
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
        </div>

        {/* Dialog Modifica Ingrediente */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Ingrediente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-supplier">Fornitore</Label>
                  <Select
                    value={editFormData.supplierId}
                    onValueChange={(value: string) => setEditFormData({ ...editFormData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona fornitore" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Additivi">Additivi</SelectItem>
                      <SelectItem value="Alcolici">Alcolici</SelectItem>
                      <SelectItem value="Bevande">Bevande</SelectItem>
                      <SelectItem value="Birra">Birra</SelectItem>
                      <SelectItem value="Carni">Carni</SelectItem>
                      <SelectItem value="Farine">Farine</SelectItem>
                      <SelectItem value="Latticini">Latticini</SelectItem>
                      <SelectItem value="Non Food">Non Food</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Spezie">Spezie</SelectItem>
                      <SelectItem value="Verdura">Verdura</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-unitType">Unità di Misura</Label>
                  <Select
                    value={editFormData.unitType}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, unitType: value })}
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
                  <Label htmlFor="edit-packageType">Tipo Confezione</Label>
                  <Select
                    value={editFormData.packageType}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, packageType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sacco">Sacco</SelectItem>
                      <SelectItem value="Busta">Busta</SelectItem>
                      <SelectItem value="Brick">Brick</SelectItem>
                      <SelectItem value="Cartone">Cartone</SelectItem>
                      <SelectItem value="Scatola">Scatola</SelectItem>
                      <SelectItem value="Bottiglia">Bottiglia</SelectItem>
                      <SelectItem value="Barattolo">Barattolo</SelectItem>
                      <SelectItem value="Sfuso">Sfuso (peso variabile)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-department">Reparto</Label>
                  <Select
                    value={editFormData.department}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona reparto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cucina">Cucina</SelectItem>
                      <SelectItem value="Sala">Sala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-packageQuantity">Quantità Confezione</Label>
                  <Input
                    id="edit-packageQuantity"
                    type="number"
                    step="0.001"
                    value={editFormData.packageQuantity}
                    onChange={(e) => setEditFormData({ ...editFormData, packageQuantity: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-packagePrice">Prezzo Confezione (€)</Label>
                  <Input
                    id="edit-packagePrice"
                    type="number"
                    step="0.01"
                    value={editFormData.packagePrice}
                    onChange={(e) => setEditFormData({ ...editFormData, packagePrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-brand">Marca (opzionale)</Label>
                  <Input
                    id="edit-brand"
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Note (opzionale)</Label>
                  <Input
                    id="edit-notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-isFood"
                      checked={editFormData.isFood !== false}
                      onChange={(e) => setEditFormData({ ...editFormData, isFood: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="edit-isFood" className="cursor-pointer">
                      Ingrediente Food (deseleziona per packaging/materiali non-food)
                    </Label>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Allergeni</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
                    {STANDARD_ALLERGENS.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-allergen-${allergen}`}
                          checked={editFormData.allergens?.includes(allergen) || false}
                          onCheckedChange={(checked) => {
                            const currentAllergens = editFormData.allergens || [];
                            if (checked) {
                              setEditFormData({ ...editFormData, allergens: [...currentAllergens, allergen] });
                            } else {
                              setEditFormData({ ...editFormData, allergens: currentAllergens.filter(a => a !== allergen) });
                            }
                          }}
                        />
                        <label htmlFor={`edit-allergen-${allergen}`} className="text-sm cursor-pointer">
                          {allergen}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Salva Modifiche
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filtri e Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Cerca per nome</Label>
                <Input
                  placeholder="Cerca ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label>Filtra per categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    <SelectItem value="Additivi">Additivi</SelectItem>
                    <SelectItem value="Alcolici">Alcolici</SelectItem>
                    <SelectItem value="Bevande">Bevande</SelectItem>
                    <SelectItem value="Birra">Birra</SelectItem>
                    <SelectItem value="Carni">Carni</SelectItem>
                    <SelectItem value="Farine">Farine</SelectItem>
                    <SelectItem value="Latticini">Latticini</SelectItem>
                    <SelectItem value="Non Food">Non Food</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                    <SelectItem value="Spezie">Spezie</SelectItem>
                    <SelectItem value="Verdura">Verdura</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={selectedFoodType} onValueChange={setSelectedFoodType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="food">Solo Food</SelectItem>
                    <SelectItem value="non-food">Solo Non-Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordina per</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="supplier">Fornitore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Lista Ingredienti ({ingredients?.length || 0})
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
                    <TableHead>Tipo</TableHead>
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
                      <TableCell>{ingredient.supplierName || 'Non specificato'}</TableCell>
                      <TableCell>{ingredient.unitType === "k" ? "kg" : "pz"}</TableCell>
                      {canViewPrices && (
                        <TableCell className="font-semibold text-emerald-600">
                          €{parseFloat(ingredient.pricePerKgOrUnit).toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ingredient.isFood === false 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {ingredient.isFood === false ? 'Non-Food' : 'Food'}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(ingredient)}
                            >
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
