import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Save,
  ExternalLink,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

interface PriceEdit {
  packagePrice: string;
  packageQuantity: string;
}

export default function PriceUpdate() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceEdits, setPriceEdits] = useState<Record<string, PriceEdit>>({});

  const { data: ingredients, isLoading, refetch } = trpc.ingredients.list.useQuery();

  const utils = trpc.useUtils();

  const bulkUpdateMutation = trpc.ingredients.bulkUpdatePrices.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.updated} prezzi aggiornati`);
      setPriceEdits({});
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Errore durante il salvataggio");
    },
  });

  const createSnapshotMutation = trpc.foodMatrixV2.createPriceUpdateSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Snapshot food matrix creato");
      utils.foodMatrixV2.snapshots.list.invalidate();
    },
  });

  const filteredIngredients = useMemo(() => {
    let list = (ingredients || []).filter((i: any) => i.isActive !== false);
    if (categoryFilter !== "all") {
      list = list.filter((i: any) => i.category === categoryFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (i: any) =>
          i.name.toLowerCase().includes(term) ||
          (i.supplier || "").toLowerCase().includes(term)
      );
    }
    return list.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [ingredients, categoryFilter, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set((ingredients || []).map((i: any) => i.category));
    return Array.from(cats).sort();
  }, [ingredients]);

  const changedCount = Object.keys(priceEdits).length;

  function handlePriceChange(
    id: string,
    field: "packagePrice" | "packageQuantity",
    value: string,
    ingredient: any
  ) {
    setPriceEdits((prev) => {
      const existing = prev[id] || {
        packagePrice: ingredient.packagePrice,
        packageQuantity: ingredient.packageQuantity,
      };
      return { ...prev, [id]: { ...existing, [field]: value } };
    });
  }

  function getNewPricePerUnit(ingredient: any) {
    const edit = priceEdits[ingredient.id];
    if (!edit) return null;
    const pkg = parseFloat(edit.packagePrice);
    const qty = parseFloat(edit.packageQuantity);
    if (isNaN(pkg) || isNaN(qty) || qty <= 0) return null;
    return pkg / qty;
  }

  function getVariationPct(ingredient: any) {
    const newPpu = getNewPricePerUnit(ingredient);
    if (newPpu === null) return null;
    const oldPpu = parseFloat(ingredient.pricePerKgOrUnit || "0");
    if (oldPpu === 0) return null;
    return ((newPpu - oldPpu) / oldPpu) * 100;
  }

  async function handleSaveAll() {
    if (changedCount === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }

    const updates = Object.entries(priceEdits)
      .map(([id, edit]) => {
        const ingredient = (ingredients || []).find((i: any) => i.id === id);
        if (!ingredient) return null;
        const pkg = parseFloat(edit.packagePrice);
        const qty = parseFloat(edit.packageQuantity);
        if (isNaN(pkg) || isNaN(qty) || qty <= 0) return null;
        const ppu = pkg / qty;
        return {
          id,
          name: ingredient.name,
          packagePrice: pkg,
          packageQuantity: qty,
          pricePerKgOrUnit: ppu,
        };
      })
      .filter(Boolean) as any[];

    if (updates.length === 0) {
      toast.error("Dati non validi");
      return;
    }

    // Prepare snapshot data
    const ingredientUpdates = updates.map((u) => {
      const ingredient = (ingredients || []).find((i: any) => i.id === u.id);
      return {
        name: u.name,
        oldPrice: parseFloat(ingredient?.pricePerKgOrUnit || "0"),
        newPrice: u.pricePerKgOrUnit,
      };
    });

    await bulkUpdateMutation.mutateAsync(updates);
    createSnapshotMutation.mutate({
      description: `Aggiornamento ${updates.length} prezzi ingredienti`,
      ingredientUpdates,
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Super Admin", href: "/super-admin" },
            { label: "Aggiorna Prezzi Ingredienti" },
          ]}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/super-admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Aggiorna Prezzi Ingredienti
              </h1>
              <p className="text-slate-600 mt-1">
                Modifica i prezzi di tutti gli ingredienti e salva in blocco
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={changedCount === 0 || bulkUpdateMutation.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {bulkUpdateMutation.isPending
              ? "Salvataggio..."
              : changedCount > 0
              ? `Salva Tutto (${changedCount} modifiche)`
              : "Salva Tutto"}
          </Button>
        </div>

        {/* Filtri */}
        <Card>
          <CardContent className="pt-4">
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabella ingredienti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingredienti ({filteredIngredients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">
                Caricamento ingredienti...
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nessun ingrediente trovato
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left p-3 border-b font-medium text-slate-700">
                          Ingrediente
                        </th>
                        <th className="text-left p-3 border-b font-medium text-slate-700">
                          Fornitore
                        </th>
                        <th className="text-left p-3 border-b font-medium text-slate-700">
                          Categoria
                        </th>
                        <th className="text-right p-3 border-b font-medium text-slate-700">
                          Prezzo Attuale
                        </th>
                        <th className="text-right p-3 border-b font-medium text-slate-700 w-36">
                          Prezzo Confezione (€)
                        </th>
                        <th className="text-right p-3 border-b font-medium text-slate-700 w-28">
                          Quantità
                        </th>
                        <th className="text-right p-3 border-b font-medium text-slate-700">
                          Nuovo €/kg
                        </th>
                        <th className="text-right p-3 border-b font-medium text-slate-700">
                          Variazione
                        </th>
                        <th className="p-3 border-b"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ingredient: any) => {
                        const edit = priceEdits[ingredient.id];
                        const currentPpu = parseFloat(
                          ingredient.pricePerKgOrUnit || "0"
                        );
                        const newPpu = getNewPricePerUnit(ingredient);
                        const variationPct = getVariationPct(ingredient);
                        const isModified = !!edit;

                        return (
                          <tr
                            key={ingredient.id}
                            className={`border-b ${
                              isModified ? "bg-amber-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="p-3 font-medium">{ingredient.name}</td>
                            <td className="p-3 text-slate-600">
                              {ingredient.supplier || "—"}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {ingredient.category}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              € {currentPpu.toFixed(4)}/
                              {ingredient.unitType === "k" ? "kg" : "u"}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={ingredient.packagePrice}
                                value={edit?.packagePrice ?? ""}
                                onChange={(e) =>
                                  handlePriceChange(
                                    ingredient.id,
                                    "packagePrice",
                                    e.target.value,
                                    ingredient
                                  )
                                }
                                className="text-right h-8"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder={ingredient.packageQuantity}
                                value={edit?.packageQuantity ?? ""}
                                onChange={(e) =>
                                  handlePriceChange(
                                    ingredient.id,
                                    "packageQuantity",
                                    e.target.value,
                                    ingredient
                                  )
                                }
                                className="text-right h-8"
                              />
                            </td>
                            <td className="p-3 text-right font-medium">
                              {newPpu !== null ? (
                                <span className="text-amber-700">
                                  € {newPpu.toFixed(4)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {variationPct !== null ? (
                                <span
                                  className={`flex items-center justify-end gap-1 font-medium ${
                                    variationPct > 0
                                      ? "text-red-600"
                                      : variationPct < 0
                                      ? "text-green-600"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {variationPct > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : variationPct < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {variationPct > 0 ? "+" : ""}
                                  {variationPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() =>
                                  navigate(
                                    `/ingredients`
                                  )
                                }
                                title="Apri scheda ingrediente"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filteredIngredients.map((ingredient: any) => {
                    const edit = priceEdits[ingredient.id];
                    const currentPpu = parseFloat(
                      ingredient.pricePerKgOrUnit || "0"
                    );
                    const newPpu = getNewPricePerUnit(ingredient);
                    const variationPct = getVariationPct(ingredient);
                    const isModified = !!edit;

                    return (
                      <div
                        key={ingredient.id}
                        className={`border rounded-lg p-4 space-y-3 ${
                          isModified ? "bg-amber-50 border-amber-200" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{ingredient.name}</div>
                            <div className="text-xs text-slate-500">
                              {ingredient.supplier || "Nessun fornitore"} ·{" "}
                              {ingredient.category}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-slate-600">
                              € {currentPpu.toFixed(4)}/
                              {ingredient.unitType === "k" ? "kg" : "u"}
                            </div>
                            {newPpu !== null && (
                              <div className="font-medium text-amber-700">
                                → € {newPpu.toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Prezzo Confezione (€)
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={ingredient.packagePrice}
                              value={edit?.packagePrice ?? ""}
                              onChange={(e) =>
                                handlePriceChange(
                                  ingredient.id,
                                  "packagePrice",
                                  e.target.value,
                                  ingredient
                                )
                              }
                              className="h-8 text-right"
                            />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Quantità (kg/u)
                            </div>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder={ingredient.packageQuantity}
                              value={edit?.packageQuantity ?? ""}
                              onChange={(e) =>
                                handlePriceChange(
                                  ingredient.id,
                                  "packageQuantity",
                                  e.target.value,
                                  ingredient
                                )
                              }
                              className="h-8 text-right"
                            />
                          </div>
                        </div>

                        {variationPct !== null && (
                          <div
                            className={`text-sm font-medium flex items-center gap-1 ${
                              variationPct > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {variationPct > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {variationPct > 0 ? "+" : ""}
                            {variationPct.toFixed(1)}% rispetto al prezzo attuale
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer salvataggio */}
        {changedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center justify-between z-10">
            <div className="text-sm text-slate-600">
              {changedCount} ingredient{changedCount === 1 ? "e" : "i"} con
              modifiche in attesa
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPriceEdits({})}
                disabled={bulkUpdateMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={bulkUpdateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {bulkUpdateMutation.isPending
                  ? "Salvataggio..."
                  : `Salva ${changedCount} modifiche`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
