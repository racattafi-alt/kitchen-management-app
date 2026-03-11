import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Users as UsersIcon,
  Shield,
  UserCog,
  ChefHat,
  ArrowLeft,
  Crown,
  Building2,
  Trash2,
  Star,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export default function Users() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: stores } = trpc.stores.list.useQuery();
  const utils = trpc.useUtils();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    name: string;
    role: string;
    preferredStoreId?: string | null;
  } | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"role" | "store">("role");
  const [addStoreId, setAddStoreId] = useState<string>("");
  const [addStoreRole, setAddStoreRole] = useState<"admin" | "manager" | "user">("user");

  const { data: userStores, refetch: refetchUserStores } = trpc.users.getUserStores.useQuery(
    { userId: selectedUser?.id ?? 0 },
    { enabled: !!selectedUser && isEditDialogOpen && activeTab === "store" }
  );

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo utente aggiornato!");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento del ruolo");
    },
  });

  const addUserToStoreMutation = trpc.users.addUserToStore.useMutation({
    onSuccess: () => {
      toast.success("Utente aggiunto al locale!");
      setAddStoreId("");
      setAddStoreRole("user");
      refetchUserStores();
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiunta");
    },
  });

  const removeUserFromStoreMutation = trpc.users.removeUserFromStore.useMutation({
    onSuccess: () => {
      toast.success("Utente rimosso dal locale");
      refetchUserStores();
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante la rimozione");
    },
  });

  const updateUserStoreRoleMutation = trpc.users.updateUserStoreRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo nel locale aggiornato!");
      refetchUserStores();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento del ruolo");
    },
  });

  const setPreferredStoreMutation = trpc.users.setPreferredStore.useMutation({
    onSuccess: () => {
      toast.success("Locale preferito impostato!");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante l'aggiornamento");
    },
  });

  const deduplicateMutation = trpc.users.deduplicateIngredients.useMutation({
    onSuccess: (result) => {
      toast.success(`Deduplicazione completata: ${result.removed} duplicati rimossi`);
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante la deduplicazione");
    },
  });

  const { data: currentUser } = trpc.auth.me.useQuery();
  const isSuperAdmin = currentUser?.role === "superadmin" || currentUser?.role === "admin";

  // Store già assegnati all'utente (per escluderli dal select "aggiungi")
  const availableStores = (stores || []).filter(
    (s: any) => !userStores?.some((us) => us.storeId === s.storeId)
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin": return <Crown className="h-5 w-5 text-amber-600" />;
      case "admin":      return <Shield className="h-5 w-5 text-red-600" />;
      case "manager":    return <UserCog className="h-5 w-5 text-blue-600" />;
      case "cook":       return <ChefHat className="h-5 w-5 text-green-600" />;
      default:           return <UsersIcon className="h-5 w-5 text-slate-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin": return "Super Utente";
      case "admin":      return "Amministratore";
      case "manager":    return "Manager";
      case "cook":       return "Cuoco";
      default:           return "Utente";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "superadmin": return "bg-amber-100 text-amber-800 border-amber-200";
      case "admin":      return "bg-red-100 text-red-800 border-red-200";
      case "manager":    return "bg-blue-100 text-blue-800 border-blue-200";
      case "cook":       return "bg-green-100 text-green-800 border-green-200";
      default:           return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStoreName = (storeId?: string | null) => {
    if (!storeId) return "Nessun locale";
    const store = stores?.find((s: any) => s.storeId === storeId);
    return store?.storeName || storeId;
  };

  const openEditDialog = (user: any) => {
    setSelectedUser({
      id: user.id,
      name: user.name || "Utente",
      role: user.role,
      preferredStoreId: user.preferredStoreId,
    });
    setNewRole(user.role);
    setAddStoreId("");
    setAddStoreRole("user");
    setActiveTab("role");
    setIsEditDialogOpen(true);
  };

  const closeDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Caricamento utenti...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna Indietro
          </Button>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-emerald-600" />
            Gestione Utenti
          </h1>
          <div className="w-32" />
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-slate-600">
            Gestisci i ruoli, i permessi e i locali degli utenti del sistema
          </p>
          {isSuperAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Rimuovere tutti gli ingredienti duplicati? Questa operazione non è reversibile.")) {
                  deduplicateMutation.mutate();
                }
              }}
              disabled={deduplicateMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deduplicateMutation.isPending ? "Deduplicazione in corso..." : "Deduplica Ingredienti"}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utenti Registrati ({users?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users?.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">{getRoleIcon(user.role)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {user.name || "Utente senza nome"}
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {user.email || "Nessuna email"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Login: {user.loginMethod || "N/A"}</span>
                        <span>•</span>
                        <span>
                          Ultimo accesso:{" "}
                          {user.lastSignedIn
                            ? new Date(user.lastSignedIn).toLocaleDateString("it-IT")
                            : "Mai"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getStoreName(user.preferredStoreId)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeClass(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                      Modifica
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Modifica Utente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica ruolo e locali di <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Tab selector */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={activeTab === "role" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("role")}
            >
              Ruolo
            </Button>
            {isSuperAdmin && (
              <Button
                variant={activeTab === "store" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("store")}
              >
                Locali
              </Button>
            )}
          </div>

          <div className="space-y-4 mt-2">
            {/* ─── TAB RUOLO ─── */}
            {activeTab === "role" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Nuovo Ruolo
                  </label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <span>Super Utente (modifica su tutti gli store)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-600" />
                          <span>Amministratore (tutti i permessi)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-600" />
                          <span>Manager (non può modificare ricette)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cook">
                        <div className="flex items-center gap-2">
                          <ChefHat className="h-4 w-4 text-green-600" />
                          <span>Cuoco (permessi da definire)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-slate-600" />
                          <span>Utente (permessi limitati)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> I permessi verranno applicati immediatamente.
                    L'utente potrebbe dover effettuare nuovamente il login per vedere le modifiche.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={closeDialog}>
                    Annulla
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedUser && newRole) {
                        updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole as any });
                      }
                    }}
                    disabled={updateRoleMutation.isPending || !newRole}
                  >
                    {updateRoleMutation.isPending ? "Salvataggio..." : "Salva Ruolo"}
                  </Button>
                </div>
              </>
            )}

            {/* ─── TAB LOCALI ─── */}
            {activeTab === "store" && isSuperAdmin && (
              <div className="space-y-4">
                {/* Lista store assegnati */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Locali assegnati
                  </label>

                  {!userStores || userStores.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-2">Nessun locale assegnato</p>
                  ) : (
                    <div className="space-y-2">
                      {userStores.map((us) => {
                        const isPreferred = selectedUser?.preferredStoreId === us.storeId;
                        return (
                          <div
                            key={us.storeId}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              isPreferred
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            {/* Stella preferito + nome store */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isPreferred ? (
                                <Star className="h-4 w-4 text-emerald-600 fill-emerald-500 flex-shrink-0" />
                              ) : (
                                <button
                                  title="Imposta come locale preferito"
                                  onClick={() => {
                                    if (selectedUser) {
                                      setPreferredStoreMutation.mutate({
                                        userId: selectedUser.id,
                                        storeId: us.storeId,
                                      });
                                      setSelectedUser({
                                        ...selectedUser,
                                        preferredStoreId: us.storeId,
                                      });
                                    }
                                  }}
                                  className="text-slate-300 hover:text-emerald-500 transition-colors flex-shrink-0"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                              )}
                              <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="font-medium text-slate-800 text-sm truncate">
                                {us.storeName}
                              </span>
                              {isPreferred && (
                                <span className="text-xs text-emerald-600 font-medium flex-shrink-0">
                                  (preferito)
                                </span>
                              )}
                            </div>

                            {/* Ruolo nel locale + rimuovi */}
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <Select
                                value={us.role}
                                onValueChange={(role) => {
                                  if (selectedUser) {
                                    updateUserStoreRoleMutation.mutate({
                                      userId: selectedUser.id,
                                      storeId: us.storeId,
                                      role: role as "admin" | "manager" | "user",
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="user">Utente</SelectItem>
                                </SelectContent>
                              </Select>

                              <button
                                title="Rimuovi dal locale"
                                onClick={() => {
                                  if (
                                    selectedUser &&
                                    confirm(`Rimuovere ${selectedUser.name} da "${us.storeName}"?`)
                                  ) {
                                    removeUserFromStoreMutation.mutate({
                                      userId: selectedUser.id,
                                      storeId: us.storeId,
                                    });
                                  }
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Aggiungi a un nuovo locale */}
                {availableStores.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Aggiungi a un locale
                    </label>
                    <div className="flex gap-2">
                      <Select value={addStoreId} onValueChange={setAddStoreId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleziona locale..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStores.map((store: any) => (
                            <SelectItem key={store.storeId} value={store.storeId}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span>{store.storeName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={addStoreRole}
                        onValueChange={(v) => setAddStoreRole(v as "admin" | "manager" | "user")}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">Utente</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedUser && addStoreId) {
                            addUserToStoreMutation.mutate({
                              userId: selectedUser.id,
                              storeId: addStoreId,
                              role: addStoreRole,
                            });
                          }
                        }}
                        disabled={!addStoreId || addUserToStoreMutation.isPending}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <Button variant="outline" onClick={closeDialog}>
                    Chiudi
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
