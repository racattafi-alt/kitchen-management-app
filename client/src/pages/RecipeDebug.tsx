import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Search,
  Package,
  ChefHat,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── ComponentResolver: combobox di ricerca ingredient / semi_finished ──────

type ResolverTarget = { type: "ingredient" | "semi_finished"; id: string; name: string; price: number };

function ComponentResolver({
  defaultQuery = "",
  onSelect,
  disabled,
}: {
  defaultQuery?: string;
  onSelect: (t: ResolverTarget) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);

  const { data: ingredientsList } = trpc.ingredients.list.useQuery(undefined, { enabled: open });
  const { data: semiList } = trpc.semiFinished.list.useQuery(undefined, { enabled: open });

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const ings: ResolverTarget[] = (ingredientsList || [])
      .filter((i: any) => !q || i.name.toLowerCase().includes(q))
      .map((i: any) => ({
        type: "ingredient" as const,
        id: i.id,
        name: i.name,
        price: parseFloat(i.pricePerKgOrUnit || "0"),
      }));
    const semis: ResolverTarget[] = (semiList || [])
      .filter((s: any) => !q || s.name.toLowerCase().includes(q))
      .map((s: any) => ({
        type: "semi_finished" as const,
        id: s.id,
        name: s.name,
        price: parseFloat(s.finalPricePerKg || "0"),
      }));
    const combined = [...ings, ...semis];
    const seen = new Set<string>();
    return combined
      .filter((c) => {
        const key = `${c.type}:${c.name.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 15);
  }, [ingredientsList, semiList, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <LinkIcon className="h-3.5 w-3.5 mr-2" />
          Collega
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-3" align="end">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca ingrediente o semilavorato..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">Nessun risultato</p>
            )}
            {results.map((r) => (
              <button
                key={`${r.type}:${r.id}`}
                className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-left text-sm"
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
              >
                {r.type === "ingredient" ? (
                  <Package className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <ChefHat className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                )}
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  € {r.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Pagina principale ──────────────────────────────────────────────────────

export default function RecipeDebug() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: unmatched = [], isLoading: loadingUnmatched, refetch: refetchUnmatched } =
    trpc.recipeDebug.listUnmatched.useQuery();
  const { data: zeroPrice = [], isLoading: loadingZero, refetch: refetchZero } =
    trpc.recipeDebug.listZeroPrice.useQuery();
  const { data: orphaned = [], isLoading: loadingOrph, refetch: refetchOrph } =
    trpc.recipeDebug.listOrphaned.useQuery();

  const resolveMutation = trpc.recipeDebug.resolve.useMutation({
    onSuccess: () => {
      toast.success("Componente collegato");
      utils.recipeDebug.listUnmatched.invalidate();
      utils.recipeDebug.listOrphaned.invalidate();
      utils.semiFinished.list.invalidate();
      utils.finalRecipes.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteComponentMutation = trpc.recipeDebug.deleteComponent.useMutation({
    onSuccess: () => {
      toast.success("Riga eliminata");
      utils.recipeDebug.listUnmatched.invalidate();
      utils.recipeDebug.listOrphaned.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteUnnamedMutation = trpc.recipeDebug.deleteUnnamed.useMutation({
    onSuccess: (res) => {
      const total = res.deletedSemi + res.deletedFinal;
      if (total === 0) {
        toast.info("Nessuna riga senza nome da eliminare.");
      } else {
        toast.success(`Eliminate ${total} righe senza nome (${res.deletedSemi} semi, ${res.deletedFinal} finali).`);
      }
      utils.recipeDebug.listUnmatched.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const recoverNamesMutation = trpc.recipeDebug.recoverNames.useMutation({
    onSuccess: (res) => {
      if (res.recovered === 0) {
        toast.info("Nessun nome da recuperare (o tutti i nomi già presenti).");
      } else {
        toast.success(`Recuperati ${res.recovered} nomi originali dal blob JSON.`);
      }
      utils.recipeDebug.listUnmatched.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unnamedCount = unmatched.filter((c) =>
    !c.componentName || c.componentName === "(senza nome)" || c.componentName === "Sconosciuto"
  ).length;

  const totalIssues = unmatched.length + zeroPrice.length + orphaned.length;
  const allGood = !loadingUnmatched && !loadingZero && !loadingOrph && totalIssues === 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Debug Ricette</h1>
            <p className="text-muted-foreground mt-1">
              Componenti non collegati, prezzi a 0 e riferimenti orfani nelle ricette.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              refetchUnmatched();
              refetchZero();
              refetchOrph();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>

        {/* Contatori */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-3 rounded-lg ${unmatched.length > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${unmatched.length > 0 ? "text-red-700" : "text-green-700"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{unmatched.length}</p>
                <p className="text-xs text-muted-foreground">Componenti non collegati</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-3 rounded-lg ${zeroPrice.length > 0 ? "bg-yellow-100" : "bg-green-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${zeroPrice.length > 0 ? "text-yellow-700" : "text-green-700"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{zeroPrice.length}</p>
                <p className="text-xs text-muted-foreground">Elementi con prezzo 0</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-3 rounded-lg ${orphaned.length > 0 ? "bg-orange-100" : "bg-green-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${orphaned.length > 0 ? "text-orange-700" : "text-green-700"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{orphaned.length}</p>
                <p className="text-xs text-muted-foreground">Riferimenti orfani</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {allGood && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-700" />
              <div>
                <p className="font-medium text-green-900">Tutto a posto</p>
                <p className="text-sm text-green-800">
                  Nessun componente non collegato, nessun prezzo a 0, nessun riferimento orfano.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="unmatched" className="w-full">
          <TabsList>
            <TabsTrigger value="unmatched">
              Non collegati {unmatched.length > 0 && <Badge variant="destructive" className="ml-2">{unmatched.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="zero">
              Prezzo 0 {zeroPrice.length > 0 && <Badge variant="secondary" className="ml-2">{zeroPrice.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="orphaned">
              Orfani {orphaned.length > 0 && <Badge variant="outline" className="ml-2">{orphaned.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1 — Non collegati */}
          <TabsContent value="unmatched" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Componenti non collegati</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Righe importate che non corrispondono a nessun ingrediente o semilavorato nel DB.
                  Usa "Collega" per associarle manualmente.
                </p>
              </CardHeader>
              <CardContent>
                {/* Banner per righe senza nome: recuperabili dal blob o eliminabili */}
                {unnamedCount > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 flex-wrap">
                    <AlertTriangle className="h-5 w-5 text-yellow-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-900">
                        {unnamedCount} righe senza nome rilevate
                      </p>
                      <p className="text-xs text-yellow-800 mt-0.5">
                        Prova prima "Recupera nomi" per ripristinare i nomi originali dal blob.
                        Se non funziona, eliminale tutte e reimporta.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={recoverNamesMutation.isPending}
                      onClick={() => recoverNamesMutation.mutate()}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      {recoverNamesMutation.isPending ? "Recupero..." : "Recupera nomi"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteUnnamedMutation.isPending}
                      onClick={() => deleteUnnamedMutation.mutate()}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {deleteUnnamedMutation.isPending ? "Pulizia..." : `Elimina tutte (${unnamedCount})`}
                    </Button>
                  </div>
                )}

                {loadingUnmatched ? (
                  <p className="text-muted-foreground text-sm py-4">Caricamento...</p>
                ) : unmatched.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Nessun componente non collegato.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ricetta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Componente (nome TSV)</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>UM</TableHead>
                          <TableHead>Suggerimento</TableHead>
                          <TableHead className="text-right">Azione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unmatched.map((c) => (
                          <TableRow key={`${c.componentRow}:${c.componentId}`}>
                            <TableCell className="font-medium">
                              {c.parentName}
                              {c.parentCode && (
                                <span className="text-xs text-muted-foreground ml-2">({c.parentCode})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={c.parentType === "final_recipe" ? "default" : "secondary"}>
                                {c.parentType === "final_recipe" ? "Ricetta finale" : "Semilavorato"}
                              </Badge>
                            </TableCell>
                            <TableCell>{c.componentName}</TableCell>
                            <TableCell className="text-right font-mono">{parseFloat(c.quantity).toFixed(3)}</TableCell>
                            <TableCell>{c.unit || "-"}</TableCell>
                            <TableCell>
                              {c.suggestion ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {c.suggestion.type === "ingredient" ? (
                                    <Package className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                  ) : (
                                    <ChefHat className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{c.suggestion.name}</p>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Badge
                                        variant="outline"
                                        className={c.suggestion.confidence === "exact" ? "text-green-700 border-green-300" : "text-yellow-700 border-yellow-300"}
                                      >
                                        {c.suggestion.confidence === "exact" ? "esatto" : "parziale"}
                                      </Badge>
                                      <span className="text-muted-foreground">€ {c.suggestion.price.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Nessun match</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {c.suggestion && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={resolveMutation.isPending}
                                    onClick={() =>
                                      resolveMutation.mutate({
                                        componentRow: c.componentRow,
                                        componentId: c.componentId,
                                        targetType: c.suggestion!.type,
                                        targetId: c.suggestion!.id,
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Usa
                                  </Button>
                                )}
                                <ComponentResolver
                                  defaultQuery={c.componentName}
                                  disabled={resolveMutation.isPending}
                                  onSelect={(t) =>
                                    resolveMutation.mutate({
                                      componentRow: c.componentRow,
                                      componentId: c.componentId,
                                      targetType: t.type,
                                      targetId: t.id,
                                    })
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={deleteComponentMutation.isPending}
                                  title="Elimina riga"
                                  onClick={() => {
                                    if (confirm(`Eliminare "${c.componentName}" da ${c.parentName}?`)) {
                                      deleteComponentMutation.mutate({
                                        componentRow: c.componentRow,
                                        componentId: c.componentId,
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2 — Prezzo 0 */}
          <TabsContent value="zero" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Elementi con prezzo a 0</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ingredienti e semilavorati con prezzo 0. Le ricette che li usano
                  risulteranno sottostimate nei costi.
                </p>
              </CardHeader>
              <CardContent>
                {loadingZero ? (
                  <p className="text-muted-foreground text-sm py-4">Caricamento...</p>
                ) : zeroPrice.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Nessun elemento a prezzo 0.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Usato in</TableHead>
                          <TableHead className="text-right">Azione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zeroPrice.map((item) => (
                          <TableRow key={`${item.type}:${item.id}`}>
                            <TableCell>
                              <Badge variant={item.type === "ingredient" ? "default" : "secondary"}>
                                {item.type === "ingredient" ? "Ingrediente" : "Semilavorato"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.name}
                              {item.code && (
                                <span className="text-xs text-muted-foreground ml-2">({item.code})</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.usedInRecipes} ricette
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(item.type === "ingredient" ? "/ingredients" : "/final-recipes")}
                              >
                                Apri
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3 — Orfani */}
          <TabsContent value="orphaned" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riferimenti orfani</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Componenti che puntano a un ingrediente o semilavorato che non
                  esiste più. Usa "Collega" per sostituire con un target valido.
                </p>
              </CardHeader>
              <CardContent>
                {loadingOrph ? (
                  <p className="text-muted-foreground text-sm py-4">Caricamento...</p>
                ) : orphaned.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">Nessun riferimento orfano.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ricetta</TableHead>
                          <TableHead>Componente</TableHead>
                          <TableHead>Riferimento rotto</TableHead>
                          <TableHead className="text-right">Azione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orphaned.map((c) => (
                          <TableRow key={`${c.componentRow}:${c.componentId}:${c.brokenRef}`}>
                            <TableCell className="font-medium">{c.parentName}</TableCell>
                            <TableCell>{c.componentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {c.brokenRef === "ingredient" ? "Ingrediente" : "Semilavorato"}
                              </Badge>
                              <span className="ml-2 text-xs text-muted-foreground font-mono">
                                {c.brokenId.slice(0, 8)}...
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <ComponentResolver
                                defaultQuery={c.componentName}
                                disabled={resolveMutation.isPending}
                                onSelect={(t) =>
                                  resolveMutation.mutate({
                                    componentRow: c.componentRow,
                                    componentId: c.componentId,
                                    targetType: t.type,
                                    targetId: t.id,
                                  })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
