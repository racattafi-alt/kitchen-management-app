import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
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
import { Users as UsersIcon, Shield, UserCog, ChefHat, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Users() {
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("");

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-5 w-5 text-red-600" />;
      case "manager":
        return <UserCog className="h-5 w-5 text-blue-600" />;
      case "cook":
        return <ChefHat className="h-5 w-5 text-green-600" />;
      default:
        return <UsersIcon className="h-5 w-5 text-slate-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Amministratore";
      case "manager":
        return "Manager";
      case "cook":
        return "Cuoco";
      default:
        return "Utente";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cook":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
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
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna Indietro
          </Button>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-emerald-600" />
            Gestione Utenti
          </h1>
          <div className="w-32" /> {/* Spacer per centrare il titolo */}
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-6">
          <p className="text-slate-600">
            Gestisci i ruoli e i permessi degli utenti del sistema
          </p>
        </div>

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
                  <div className="flex-shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {user.name || "Utente senza nome"}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {user.email || "Nessuna email"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Login: {user.loginMethod || "N/A"} • Ultimo accesso:{" "}
                      {user.lastSignedIn
                        ? new Date(user.lastSignedIn).toLocaleDateString("it-IT")
                        : "Mai"}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser({
                        id: user.id,
                        name: user.name || "Utente",
                        role: user.role,
                      });
                      setNewRole(user.role);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Modifica Ruolo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Dialog Modifica Ruolo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Modifica il ruolo di <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Nuovo Ruolo
              </label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
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
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Annulla
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser && newRole) {
                    updateRoleMutation.mutate({
                      userId: selectedUser.id,
                      role: newRole as "user" | "admin" | "manager" | "cook",
                    });
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
