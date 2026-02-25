import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Package, ChefHat, TrendingUp, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function SuperAdminDashboard() {
  const { data: stores = [], isLoading, refetch } = trpc.stores.list.useQuery();
  const createStoreMutation = trpc.stores.create.useMutation();


  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStoreEmail, setNewStoreEmail] = useState("");

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      alert("Il nome del negozio è obbligatorio");
      return;
    }

    try {
      await createStoreMutation.mutateAsync({
        name: newStoreName,
        address: newStoreAddress || undefined,
        phone: newStorePhone || undefined,
        email: newStoreEmail || undefined,
      });

      alert(`Negozio "${newStoreName}" creato con successo!`);

      setIsCreateDialogOpen(false);
      setNewStoreName("");
      setNewStoreAddress("");
      setNewStorePhone("");
      setNewStoreEmail("");
      refetch();
    } catch (error: any) {
      alert(error.message || "Impossibile creare il negozio");
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Gestione centralizzata di tutti i punti vendita
            </p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Negozio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Negozio</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del nuovo punto vendita
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Negozio *</Label>
                <Input
                  id="name"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="es. Negozio Centro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input
                  id="address"
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  placeholder="Via Roma 1, Milano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={newStorePhone}
                  onChange={(e) => setNewStorePhone(e.target.value)}
                  placeholder="+39 02 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStoreEmail}
                  onChange={(e) => setNewStoreEmail(e.target.value)}
                  placeholder="negozio@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateStore} disabled={createStoreMutation.isPending}>
                {createStoreMutation.isPending ? "Creazione..." : "Crea Negozio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche Aggregate */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punti Vendita</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">
              {stores.filter((s) => s.storeIsActive).length} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruolo Admin</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s) => s.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground">Store con accesso admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruolo Manager</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s) => s.role === "manager").length}
            </div>
            <p className="text-xs text-muted-foreground">Store con accesso manager</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruolo User</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s) => s.role === "user").length}
            </div>
            <p className="text-xs text-muted-foreground">Store con accesso user</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Stores */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tutti i Negozi</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.storeId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{store.storeName}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {store.storeAddress || "Nessun indirizzo"}
                    </CardDescription>
                  </div>
                  <Badge variant={store.storeIsActive ? "default" : "secondary"}>
                    {store.storeIsActive ? "Attivo" : "Inattivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tuo ruolo:</span>
                  <Badge variant="outline" className="capitalize">
                    {store.role}
                  </Badge>
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
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Vedi Statistiche
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
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crea il tuo primo punto vendita per iniziare
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crea Primo Negozio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
