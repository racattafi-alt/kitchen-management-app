import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Package, Pencil, Trash2, Download, Upload, ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { useState, useEffect as React_useEffect } from "react";
import * as React from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset pagina quando cambiano i filtri
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedFoodType, sortBy]);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    name: "",
    supplier: "",
    category: "Altro" as const,
    unitType: "k" as const,
    packageType: "" as "Sacco" | "Busta" | "Brick" | "Cartone" | "Scatola" | "Bottiglia" | "Barattolo" | "Lattina" | "Sfuso" | "",
    department: "Cucina" as "Cucina" | "Sala",
    packageQuantity: 0,
    packagePrice: 0,
    brand: "",
    notes: "",
    isSoldByPackage: false,
    allergens: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    supplierId: "",
    supplier: "",
    category: "Altro" as const,
    unitType: "k" as const,
    packageType: "" as "Sacco" | "Busta" | "Brick" | "Cartone" | "Scatola" | "Bottiglia" | "Barattolo" | "Lattina" | "Sfuso" | "",
    department: "Cucina" as "Cucina" | "Sala",
    packageQuantity: 0,
    packagePrice: 0,
    brand: "",
    notes: "",
    isFood: true,
    isSoldByPackage: false,
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
      let compareA, compareB;
      if (sortBy === 'supplier') {
        compareA = a.supplier || a.supplierName || '';
        compareB = b.supplier || b.supplierName || '';
      } else {
        compareA = a[sortBy] || '';
        compareB = b[sortBy] || '';
      }
      
      if (typeof compareA === 'string') compareA = compareA.toLowerCase();
      if (typeof compareB === 'string') compareB = compareB.toLowerCase();
      
      // Sempre ordinamento alfabetico ascendente
      if (compareA < compareB) return -1;
      if (compareA > compareB) return 1;
      return 0;
    });

  // Calcolo paginazione
  const totalPages = Math.ceil((ingredients?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIngredients = ingredients?.slice(startIndex, endIndex);
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
      
      // Ottieni lista ingredienti esistenti
      const existingIngredients = ingredients || [];
      
      let updated = 0;
      for (const item of salaData) {
        try {
          // Cerca ingrediente esistente tramite code (campo code nel JSON corrisponde a name nel DB)
          const existing = existingIngredients.find(ing => ing.name === item.name);
          
          if (!existing) {
            console.warn(`Ingrediente ${item.code} non trovato, skip`);
            continue;
          }
          
          // Valida e mappa unitType
          const validUnitType = item.unitType === 'u' || item.unitType === 'k' ? item.unitType : 'u';
          
          // Valida e mappa packageType
          const validPackageTypes = ["Sacco", "Busta", "Brick", "Cartone", "Scatola", "Bottiglia", "Barattolo", "Lattina", "Sfuso"];
          const validPackageType = validPackageTypes.includes(item.packageType) ? item.packageType : undefined;
          
          await updateMutation.mutateAsync({
            id: existing.id,
            name: item.name,
            supplier: item.supplier || undefined,
            category: item.category,
            unitType: validUnitType,
            packageType: validPackageType,
            packageQuantity: item.packageQuantity || 1,
            packagePrice: item.packagePrice || 0,
            pricePerKgOrUnit: item.pricePerKgOrUnit || 0,
            minOrderQuantity: item.minOrderQuantity || 1,
            brand: item.brand || undefined,
            notes: item.notes || undefined,
            department: item.department || 'Sala',
          });
          updated++;
        } catch (err) {
          console.error(`Errore aggiornamento ${item.code}:`, err);
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
      isSoldByPackage: false,
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
      isSoldByPackage: formData.isSoldByPackage,
      allergens: formData.allergens,
    });
  };

  const handleEdit = (ingredient: any) => {
    setEditingIngredient(ingredient);
    setEditFormData({
      name: ingredient.name,
      supplierId: ingredient.supplierId || "",
      supplier: ingredient.supplier || ingredient.supplierName || "",
      category: ingredient.category,
      unitType: ingredient.unitType,
      packageType: ingredient.packageType || "",
      department: ingredient.department || "Cucina",
      packageQuantity: parseFloat(ingredient.packageQuantity) || 0,
      packagePrice: parseFloat(ingredient.packagePrice) || 0,
      brand: ingredient.brand || "",
      notes: ingredient.notes || "",
      isFood: ingredient.isFood !== false,
      isSoldByPackage: ingredient.isSoldByPackage === true,
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
      supplier: editFormData.supplier || undefined,
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
      isSoldByPackage: editFormData.isSoldByPackage,
      allergens: editFormData.allergens,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Ingredienti" }]} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = '/dashboard'}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ingredienti</h1>
              <p className="text-slate-600 mt-1">
                Gestisci le materie prime (Livello 0)
              </p>
            </div>
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
                      <Combobox
                        value={formData.supplier}
                        onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                        options={suppliers?.map((s: any) => ({ value: s.name, label: s.name })) || []}
                        placeholder="Seleziona o scrivi fornitore..."
                        searchPlaceholder="Cerca fornitore..."
                        emptyText="Nessun fornitore trovato"
                        allowCustom={true}
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
                          <SelectItem value="Caffè">Caffè</SelectItem>
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
                          <SelectItem value="Lattina">Lattina</SelectItem>
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
                      <Label className="mb-2 block">Modalità vendita</Label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isSoldByPackage: !formData.isSoldByPackage })}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          formData.isSoldByPackage
                            ? "bg-blue-100 border-blue-400 text-blue-700"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                      >
                        <Package className="h-4 w-4" />
                        Venduto per confezione
                      </button>
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
                    value={editFormData.supplierId || `custom-${editFormData.supplier}`}
                    onValueChange={(value: string) => {
                      if (value.startsWith('custom-')) {
                        // Mantieni il fornitore custom esistente
                        return;
                      }
                      const selectedSupplier = suppliers?.find((s: any) => s.id === value);
                      setEditFormData({ ...editFormData, supplierId: value, supplier: selectedSupplier?.name || value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona fornitore" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Mostra fornitore custom se non è nella lista suppliers */}
                      {editFormData.supplier && !editFormData.supplierId && (
                        <SelectItem key={`custom-${editFormData.supplier}`} value={`custom-${editFormData.supplier}`}>
                          {editFormData.supplier} (custom)
                        </SelectItem>
                      )}
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
                      <SelectItem value="Caffè">Caffè</SelectItem>
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
                      <SelectItem value="Lattina">Lattina</SelectItem>
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
                  <Label className="mb-2 block">Modalità vendita</Label>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, isSoldByPackage: !editFormData.isSoldByPackage })}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      editFormData.isSoldByPackage
                        ? "bg-blue-100 border-blue-400 text-blue-700"
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    Venduto per confezione
                  </button>
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
                    <SelectItem value="Caffè">Caffè</SelectItem>
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
            ) : paginatedIngredients && paginatedIngredients.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="border-b">
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
                  {paginatedIngredients.map((ingredient: any) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-sm">
                          {ingredient.category}
                        </span>
                      </TableCell>
                      <TableCell>{ingredient.supplier || ingredient.supplierName || 'Non specificato'}</TableCell>
                      <TableCell>{ingredient.unitType === "k" ? "kg" : "pz"}</TableCell>
                      {canViewPrices && (
                        <TableCell className="font-semibold text-emerald-600">
                          €{parseFloat(ingredient.pricePerKgOrUnit).toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ingredient.isFood === false
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {ingredient.isFood === false ? 'Non-Food' : 'Food'}
                          </span>
                          {ingredient.isSoldByPackage && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Confezione
                            </span>
                          )}
                        </div>
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
            ) : null}
            
            {/* Controlli Paginazione */}
            {!isLoading && ingredients && ingredients.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, ingredients.length)} di {ingredients.length} ingredienti
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Prima
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Precedente
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium px-3 py-1 bg-primary text-primary-foreground rounded">
                      {currentPage}
                    </span>
                    <span className="text-sm text-muted-foreground">di {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Successiva
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Ultima
                  </Button>
                </div>
              </div>
            )}
            
            {!isLoading && (!paginatedIngredients || paginatedIngredients.length === 0) && (
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
