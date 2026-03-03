import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Users, Package, ChefHat, TrendingUp, TrendingDown, Plus, ArrowLeft, Edit3, Shield, UserCog, Globe, Search, Save, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Tab = "negozi" | "utenti" | "prezzi";
type SortBy = "name" | "supplier" | "category";

interface PriceEdit {
  packagePrice: string;
  packageQuantity: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("negozi");

  // ---- Store state ----
  const { data: stores = [], isLoading, refetch } = trpc.stores.list.useQuery();
  const createStoreMutation = trpc.stores.create.useMutation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStoreEmail, setNewStoreEmail] = useState("");

  // ---- User state ----
  const { data: users, isLoading: usersLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  // ---- Prezzi state ----
  const { data: ingredients, isLoading: ingredientsLoading, refetch: refetchIngredients } =
    trpc.ingredients.list.useQuery();
  const [priceEdits, setPriceEdits] = useState<Record<string, PriceEdit>>({});
  const [sortBy, setSortBy] = useState<SortBy>("supplier");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const updateStoreMutation = trpc.stores.update.useMutation({
    onSuccess: () => { toast.success("Store aggiornato!"); utils.stores.list.invalidate(); },
    onError: (error) => { toast.error(error.message || "Errore aggiornamento store"); },
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo utente aggiornato!");
      setIsEditRoleOpen(false);
      setSelectedUser(null);
      utils.users.list.invalidate();
    },
    onError: (error) => { toast.error(error.message || "Errore aggiornamento ruolo"); },
  });

  const bulkUpdateMutation = trpc.ingredients.bulkUpdatePrices.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.updated} prezzi aggiornati`);
      setPriceEdits({});
      refetchIngredients();
    },
    onError: (error) => { toast.error(error.message || "Errore durante il salvataggio"); },
  });

  const createSnapshotMutation = trpc.foodMatrixV2.createPriceUpdateSnapshot.useMutation({
    onSuccess: () => utils.foodMatrixV2.snapshots.list.invalidate(),
  });

  // ---- Store helpers ----
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) { alert("Il nome del negozio è obbligatorio"); return; }
    try {
      await createStoreMutation.mutateAsync({
        name: newStoreName,
        address: newStoreAddress || undefined,
        phone: newStorePhone || undefined,
        email: newStoreEmail || undefined,
      });
      toast.success(`Negozio "${newStoreName}" creato con successo!`);
      setIsCreateDialogOpen(false);
      setNewStoreName(""); setNewStoreAddress(""); setNewStorePhone(""); setNewStoreEmail("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Impossibile creare il negozio");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin": return <Shield className="h-5 w-5 text-amber-600" />;
      case "admin": return <Shield className="h-5 w-5 text-red-600" />;
      case "manager": return <UserCog className="h-5 w-5 text-blue-600" />;
      case "cook": return <ChefHat className="h-5 w-5 text-green-600" />;
      default: return <Users className="h-5 w-5 text-slate-600" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "superadmin": return "bg-amber-100 text-amber-800 border-amber-200";
      case "admin": return "bg-red-100 text-red-800 border-red-200";
      case "manager": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cook": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin": return "Super Utente";
      case "admin": return "Amministratore";
      case "manager": return "Manager";
      case "cook": return "Cuoco";
      default: return "Utente";
    }
  };

  // ---- Price helpers ----
  const activeIngredients = useMemo(
    () => (ingredients || []).filter((i: any) => i.isActive !== false),
    [ingredients]
  );

  const ingredientCategories = useMemo(() => {
    const cats = new Set(activeIngredients.map((i: any) => i.category));
    return Array.from(cats).sort() as string[];
  }, [activeIngredients]);

  const filteredIngredients = useMemo(() => {
    let list = [...activeIngredients];
    if (categoryFilter !== "all") list = list.filter((i: any) => i.category === categoryFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (i: any) =>
          i.name.toLowerCase().includes(term) ||
          (i.supplier || "").toLowerCase().includes(term)
      );
    }
    list.sort((a: any, b: any) => {
      if (sortBy === "supplier") {
        const sa = (a.supplier || "").toLowerCase();
        const sb = (b.supplier || "").toLowerCase();
        return sa !== sb ? sa.localeCompare(sb) : a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        return a.category !== b.category
          ? a.category.localeCompare(b.category)
          : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [activeIngredients, categoryFilter, searchTerm, sortBy]);

  const changedCount = Object.keys(priceEdits).length;

  function handlePriceChange(id: string, field: "packagePrice" | "packageQuantity", value: string) {
    setPriceEdits((prev) => {
      const existing = prev[id] || { packagePrice: "", packageQuantity: "" };
      return { ...prev, [id]: { ...existing, [field]: value } };
    });
  }

  function getEffectivePkg(ingredient: any): { price: number; qty: number } {
    const edit = priceEdits[ingredient.id];
    const price =
      edit?.packagePrice.trim()
        ? parseFloat(edit.packagePrice)
        : parseFloat(ingredient.packagePrice || "0");
    const qty =
      edit?.packageQuantity.trim()
        ? parseFloat(edit.packageQuantity)
        : parseFloat(ingredient.packageQuantity || "1");
    return { price, qty };
  }

  function getNewPricePerUnit(ingredient: any): number | null {
    const edit = priceEdits[ingredient.id];
    if (!edit) return null;
    // At least one field was touched
    const { price, qty } = getEffectivePkg(ingredient);
    if (isNaN(price) || isNaN(qty) || qty <= 0) return null;
    return price / qty;
  }

  function getVariationPct(ingredient: any): number | null {
    const newPpu = getNewPricePerUnit(ingredient);
    if (newPpu === null) return null;
    const oldPpu = parseFloat(ingredient.pricePerKgOrUnit || "0");
    if (oldPpu === 0) return null;
    return ((newPpu - oldPpu) / oldPpu) * 100;
  }

  async function handleSaveAll() {
    if (changedCount === 0) { toast.info("Nessuna modifica da salvare"); return; }
    const updates: any[] = [];
    const ingredientUpdates: any[] = [];

    for (const [id, _edit] of Object.entries(priceEdits)) {
      const ingredient = activeIngredients.find((i: any) => i.id === id);
      if (!ingredient) continue;
      const { price, qty } = getEffectivePkg(ingredient);
      if (isNaN(price) || isNaN(qty) || qty <= 0) continue;
      const ppu = price / qty;
      updates.push({ id, name: ingredient.name, packagePrice: price, packageQuantity: qty, pricePerKgOrUnit: ppu });
      ingredientUpdates.push({ name: ingredient.name, oldPrice: parseFloat(ingredient.pricePerKgOrUnit || "0"), newPrice: ppu });
    }

    if (updates.length === 0) { toast.error("Dati non validi"); return; }
    await bulkUpdateMutation.mutateAsync(updates);
    createSnapshotMutation.mutate({
      description: `Aggiornamento ${updates.length} prezzi ingredienti`,
      ingredientUpdates,
    });
  }

  // Tab key navigation: Tab from any price field jumps to the next row's price field
  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Tab" || e.shiftKey) return;
    const all = Array.from(document.querySelectorAll<HTMLInputElement>("[data-price-col]"));
    const idx = all.indexOf(e.currentTarget);
    if (idx >= 0 && idx < all.length - 1) {
      e.preventDefault();
      all[idx + 1].focus();
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => window.history.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Gestione centralizzata di tutti i punti vendita</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/multi-store-editor"}>
          <Edit3 className="h-4 w-4 mr-2" />
          Editor Multi-Store
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "negozi" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("negozi")}
        >
          <Building2 className="inline h-4 w-4 mr-2" />Punti Vendita
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "utenti" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("utenti")}
        >
          <Users className="inline h-4 w-4 mr-2" />Gestione Utenti
          {users && <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{users.length}</span>}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "prezzi" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("prezzi")}
        >
          <TrendingUp className="inline h-4 w-4 mr-2" />Aggiorna Prezzi
          {changedCount > 0 && <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">{changedCount}</span>}
        </button>
      </div>

      {/* ===== TAB: Negozi ===== */}
      {activeTab === "negozi" && (
        <div className="space-y-8">
          <div className="flex justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nuovo Negozio</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Negozio</DialogTitle>
                  <DialogDescription>Inserisci i dettagli del nuovo punto vendita</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Negozio *</Label>
                    <Input id="name" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="es. Negozio Centro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input id="address" value={newStoreAddress} onChange={(e) => setNewStoreAddress(e.target.value)} placeholder="Via Roma 1, Milano" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input id="phone" value={newStorePhone} onChange={(e) => setNewStorePhone(e.target.value)} placeholder="+39 02 1234567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={newStoreEmail} onChange={(e) => setNewStoreEmail(e.target.value)} placeholder="negozio@example.com" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annulla</Button>
                  <Button onClick={handleCreateStore} disabled={createStoreMutation.isPending}>
                    {createStoreMutation.isPending ? "Creazione..." : "Crea Negozio"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Punti Vendita</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.length}</div>
                <p className="text-xs text-muted-foreground">{stores.filter((s) => s.storeIsActive).length} attivi</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ruolo Admin</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.filter((s) => s.role === "admin").length}</div>
                <p className="text-xs text-muted-foreground">Store con accesso admin</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ruolo Manager</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.filter((s) => s.role === "manager").length}</div>
                <p className="text-xs text-muted-foreground">Store con accesso manager</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ruolo User</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.filter((s) => s.role === "user").length}</div>
                <p className="text-xs text-muted-foreground">Store con accesso user</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Tutti i Negozi</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <Card key={store.storeId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{store.storeName}</CardTitle>
                        <CardDescription className="line-clamp-2">{store.storeAddress || "Nessun indirizzo"}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={store.storeIsActive ? "default" : "secondary"}>
                          {store.storeIsActive ? "Attivo" : "Inattivo"}
                        </Badge>
                        {(store as any).storeIsGlobal && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            <Globe className="h-3 w-3 mr-1" />Globale
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tuo ruolo:</span>
                      <Badge variant="outline" className="capitalize">{store.role}</Badge>
                    </div>
                    {store.storePhone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Telefono:</span>
                        <span className="font-medium">{store.storePhone}</span>
                      </div>
                    )}
                    {store.storeEmail && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium text-xs">{store.storeEmail}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button
                        variant={(store as any).storeIsGlobal ? "default" : "outline"}
                        size="sm"
                        className={`w-full ${(store as any).storeIsGlobal ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                        onClick={() => updateStoreMutation.mutate({ storeId: store.storeId, isGlobal: !(store as any).storeIsGlobal })}
                        disabled={updateStoreMutation.isPending}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        {(store as any).storeIsGlobal ? "Store Globale (attivo)" : "Imposta come Store Globale"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {stores.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun negozio trovato</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">Crea il tuo primo punto vendita per iniziare</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Crea Primo Negozio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TAB: Utenti ===== */}
      {activeTab === "utenti" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Gestione Utenti</h2>
            <p className="text-muted-foreground mt-1">Gestisci i ruoli e i permessi degli utenti del sistema</p>
          </div>
          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento utenti...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Utenti Registrati ({users?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">{getRoleIcon(user.role)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{user.name || "Utente senza nome"}</div>
                          <div className="text-sm text-slate-500 truncate">{user.email || "Nessuna email"}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            Login: {user.loginMethod || "N/A"} • Ultimo accesso:{" "}
                            {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("it-IT") : "Mai"}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border flex-shrink-0 ${getRoleBadgeClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedUser({ id: user.id, name: user.name || "Utente", role: user.role });
                          setNewRole(user.role);
                          setIsEditRoleOpen(true);
                        }}>
                          Modifica Ruolo
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!users || users.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Nessun utente registrato</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TAB: Prezzi ===== */}
      {activeTab === "prezzi" && (
        <div className="space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Aggiorna Prezzi Ingredienti</h2>
              <p className="text-muted-foreground mt-1">
                Modifica i prezzi in blocco. Lascia vuoto per mantenere il valore attuale. Usa <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Tab</kbd> per spostarti al prossimo prezzo.
              </p>
            </div>
            <Button
              onClick={handleSaveAll}
              disabled={changedCount === 0 || bulkUpdateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {bulkUpdateMutation.isPending ? "Salvataggio..." : changedCount > 0 ? `Salva (${changedCount} modifiche)` : "Salva Tutto"}
            </Button>
          </div>

          {/* Filtri */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cerca ingrediente o fornitore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supplier">Ordina per Fornitore</SelectItem>
                <SelectItem value="name">Ordina per Nome</SelectItem>
                <SelectItem value="category">Ordina per Categoria</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {ingredientCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabella ingredienti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Ingredienti ({filteredIngredients.length})
                {changedCount > 0 && (
                  <span className="ml-auto text-sm font-normal text-amber-600">
                    {changedCount} modifiche in attesa
                    <button className="ml-3 text-slate-400 hover:text-slate-600 underline" onClick={() => setPriceEdits({})}>
                      Annulla tutto
                    </button>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ingredientsLoading ? (
                <div className="text-center py-8 text-slate-500">Caricamento ingredienti...</div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Nessun ingrediente trovato</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-2 font-medium text-slate-700">Ingrediente</th>
                        <th className="text-left px-4 py-2 font-medium text-slate-700">Fornitore</th>
                        <th className="text-left px-4 py-2 font-medium text-slate-700">Categoria</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-700">Prezzo Attuale</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-700 w-32">€ Confezione</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-700 w-24">Quantità</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-700">Nuovo €/kg</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-700">Variazione</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ingredient: any, rowIdx: number) => {
                        const edit = priceEdits[ingredient.id];
                        const currentPpu = parseFloat(ingredient.pricePerKgOrUnit || "0");
                        const newPpu = getNewPricePerUnit(ingredient);
                        const variationPct = getVariationPct(ingredient);
                        const isModified = !!edit;

                        // Group separator by supplier when sorted by supplier
                        const prevIngredient = filteredIngredients[rowIdx - 1] as any;
                        const showSupplierHeader =
                          sortBy === "supplier" &&
                          rowIdx > 0 &&
                          (prevIngredient?.supplier || "—") !== (ingredient.supplier || "—");
                        const isFirstRow = sortBy === "supplier" && rowIdx === 0;

                        return [
                          (isFirstRow || showSupplierHeader) && (
                            <tr key={`sep-${rowIdx}`} className="bg-slate-100">
                              <td colSpan={9} className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                {ingredient.supplier || "Senza fornitore"}
                              </td>
                            </tr>
                          ),
                          <tr
                            key={ingredient.id}
                            className={`border-b transition-colors ${isModified ? "bg-amber-50" : "hover:bg-slate-50"}`}
                          >
                            <td className="px-4 py-2 font-medium">{ingredient.name}</td>
                            <td className="px-4 py-2 text-slate-500">{ingredient.supplier || "—"}</td>
                            <td className="px-4 py-2">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                {ingredient.category}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-slate-600">
                              € {currentPpu.toFixed(4)}/{ingredient.unitType === "k" ? "kg" : "u"}
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={parseFloat(ingredient.packagePrice || "0").toFixed(2)}
                                value={edit?.packagePrice ?? ""}
                                onChange={(e) => handlePriceChange(ingredient.id, "packagePrice", e.target.value)}
                                onKeyDown={handlePriceKeyDown}
                                data-price-col
                                className="h-8 text-right"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder={parseFloat(ingredient.packageQuantity || "1").toFixed(3)}
                                value={edit?.packageQuantity ?? ""}
                                onChange={(e) => handlePriceChange(ingredient.id, "packageQuantity", e.target.value)}
                                className="h-8 text-right"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              {newPpu !== null ? (
                                <span className="font-medium text-amber-700">€ {newPpu.toFixed(4)}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {variationPct !== null ? (
                                <span className={`flex items-center justify-end gap-1 font-medium ${variationPct > 0 ? "text-red-600" : variationPct < 0 ? "text-green-600" : "text-slate-500"}`}>
                                  {variationPct > 0 ? <TrendingUp className="h-3 w-3" /> : variationPct < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                  {variationPct > 0 ? "+" : ""}{variationPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => window.open("/ingredients", "_blank")}
                                title="Apri scheda ingrediente"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>,
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sticky save bar */}
          {changedCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-6 py-3 flex items-center justify-between z-20">
              <div className="text-sm text-slate-600">
                {changedCount} ingrediente{changedCount !== 1 ? "i" : ""} con modifiche in attesa
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPriceEdits({})} disabled={bulkUpdateMutation.isPending}>
                  Annulla
                </Button>
                <Button size="sm" onClick={handleSaveAll} disabled={bulkUpdateMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {bulkUpdateMutation.isPending ? "Salvataggio..." : `Salva ${changedCount} modifiche`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog modifica ruolo */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>Modifica il ruolo di <strong>{selectedUser?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Nuovo Ruolo</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-amber-600" /><span>Super Utente (modifica su tutti gli store)</span></div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-600" /><span>Amministratore (tutti i permessi)</span></div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-blue-600" /><span>Manager</span></div>
                  </SelectItem>
                  <SelectItem value="cook">
                    <div className="flex items-center gap-2"><ChefHat className="h-4 w-4 text-green-600" /><span>Cuoco</span></div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-600" /><span>Utente (permessi limitati)</span></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800"><strong>Nota:</strong> I permessi verranno applicati immediatamente.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setIsEditRoleOpen(false); setSelectedUser(null); }}>Annulla</Button>
              <Button
                onClick={() => { if (selectedUser && newRole) updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole as any }); }}
                disabled={updateRoleMutation.isPending || !newRole}
              >
                {updateRoleMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
