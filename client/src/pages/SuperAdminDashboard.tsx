import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Package, ChefHat, TrendingUp, Plus, ArrowLeft, Edit3, Shield, UserCog } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Tab = "negozi" | "utenti";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("negozi");
  const { data: stores = [], isLoading, refetch } = trpc.stores.list.useQuery();
  const createStoreMutation = trpc.stores.create.useMutation();

  // Stato form nuovo store
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStoreEmail, setNewStoreEmail] = useState("");

  // Gestione utenti
  const { data: users, isLoading: usersLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo utente aggiornato!");
      setIsEditRoleOpen(false);
      setSelectedUser(null);
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore aggiornamento ruolo");
    },
  });

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
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "negozi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("negozi")}
        >
          <Building2 className="inline h-4 w-4 mr-2" />
          Punti Vendita
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "utenti"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("utenti")}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Gestione Utenti
          {users && <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{users.length}</span>}
        </button>
      </div>

      {/* Tab: Negozi */}
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

          {/* Statistiche */}
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
                        <CardDescription className="line-clamp-2">{store.storeAddress || "Nessun indirizzo"}</CardDescription>
                      </div>
                      <Badge variant={store.storeIsActive ? "default" : "secondary"}>
                        {store.storeIsActive ? "Attivo" : "Inattivo"}
                      </Badge>
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
                <p className="text-sm text-muted-foreground text-center mb-4">Crea il tuo primo punto vendita per iniziare</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Primo Negozio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Utenti */}
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
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser({ id: user.id, name: user.name || "Utente", role: user.role });
                            setNewRole(user.role);
                            setIsEditRoleOpen(true);
                          }}
                        >
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
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
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
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> I permessi verranno applicati immediatamente.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setIsEditRoleOpen(false); setSelectedUser(null); }}>Annulla</Button>
              <Button
                onClick={() => {
                  if (selectedUser && newRole) {
                    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole as any });
                  }
                }}
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
