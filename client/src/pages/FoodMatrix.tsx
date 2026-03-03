import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Search,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  Clock,
  Camera,
  X,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---- Types ----
type ComponentType = "INGREDIENT" | "SEMI_FINISHED" | "FINAL_RECIPE" | "MANUAL";

interface ComponentRow {
  type: ComponentType;
  sourceId?: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number; // only for MANUAL
  resolvedPrice?: number; // filled from DB data (ingredients/recipes)
}

const CATEGORIES = [
  "Antipasti",
  "Primi",
  "Secondi",
  "Contorni",
  "Dolci",
  "Bevande",
  "Pizze",
  "Panini",
  "Snack",
  "Altro",
];

// ---- Helpers ----
function computeLocalCost(components: ComponentRow[]): number {
  return components.reduce((sum, c) => {
    const price =
      c.type === "MANUAL" ? (c.pricePerUnit ?? 0) : (c.resolvedPrice ?? 0);
    return sum + price * c.quantity;
  }, 0);
}

function foodCostClass(pct: number): string {
  if (pct <= 30) return "text-green-600";
  if (pct <= 40) return "text-amber-600";
  return "text-red-600";
}

function foodCostBg(pct: number): string {
  if (pct <= 30) return "bg-green-100 text-green-700";
  if (pct <= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ---- AddProductDialog ----
interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  editEntry?: any;
  ingredients: any[];
  semiFinished: any[];
  finalRecipes: any[];
  onSaved: () => void;
}

function AddProductDialog({
  open,
  onClose,
  editEntry,
  ingredients,
  semiFinished,
  finalRecipes,
  onSaved,
}: AddProductDialogProps) {
  const [name, setName] = useState(editEntry?.name ?? "");
  const [category, setCategory] = useState(editEntry?.category ?? "Altro");
  const [servingSize, setServingSize] = useState(
    editEntry?.servingSize ? parseFloat(editEntry.servingSize) : 1
  );
  const [servingUnit, setServingUnit] = useState(
    editEntry?.servingUnit ?? "porzione"
  );
  const [sellingPrice, setSellingPrice] = useState(
    editEntry?.sellingPrice ? parseFloat(editEntry.sellingPrice) : null as number | null
  );
  const [components, setComponents] = useState<ComponentRow[]>(
    editEntry?.components
      ? editEntry.components.map((c: any) => ({
          ...c,
          resolvedPrice:
            c.type === "INGREDIENT"
              ? parseFloat(
                  ingredients.find((i: any) => i.id === c.sourceId)
                    ?.pricePerKgOrUnit ?? "0"
                )
              : c.type === "SEMI_FINISHED"
              ? parseFloat(
                  semiFinished.find((s: any) => s.id === c.sourceId)
                    ?.totalCost ?? "0"
                )
              : c.type === "FINAL_RECIPE"
              ? parseFloat(
                  finalRecipes.find((r: any) => r.id === c.sourceId)
                    ?.totalCost ?? "0"
                )
              : 0,
        }))
      : []
  );

  const [addType, setAddType] = useState<ComponentType>("INGREDIENT");
  const [addSearch, setAddSearch] = useState("");

  const upsertMutation = trpc.foodMatrixV2.entries.upsert.useMutation({
    onSuccess: () => {
      toast.success(editEntry ? "Prodotto aggiornato" : "Prodotto aggiunto");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message || "Errore"),
  });

  const localCost = useMemo(() => computeLocalCost(components), [components]);

  const filteredSources = useMemo(() => {
    const term = addSearch.toLowerCase();
    if (addType === "INGREDIENT")
      return ingredients.filter((i: any) =>
        i.name.toLowerCase().includes(term)
      );
    if (addType === "SEMI_FINISHED")
      return semiFinished.filter((s: any) =>
        s.name.toLowerCase().includes(term)
      );
    if (addType === "FINAL_RECIPE")
      return finalRecipes.filter((r: any) =>
        r.name.toLowerCase().includes(term)
      );
    return [];
  }, [addType, addSearch, ingredients, semiFinished, finalRecipes]);

  function addCodedComponent(source: any) {
    let resolvedPrice = 0;
    if (addType === "INGREDIENT")
      resolvedPrice = parseFloat(source.pricePerKgOrUnit ?? "0");
    else if (addType === "SEMI_FINISHED" || addType === "FINAL_RECIPE")
      resolvedPrice = parseFloat(source.totalCost ?? "0");

    setComponents((prev) => [
      ...prev,
      {
        type: addType,
        sourceId: source.id,
        name: source.name,
        quantity: 1,
        unit: addType === "INGREDIENT" && source.unitType === "k" ? "kg" : "u",
        resolvedPrice,
      },
    ]);
    setAddSearch("");
  }

  function addManualComponent() {
    setComponents((prev) => [
      ...prev,
      {
        type: "MANUAL",
        name: "Ingrediente manuale",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
      },
    ]);
  }

  function removeComponent(idx: number) {
    setComponents((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: any) {
    setComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Inserisci un nome per il prodotto");
      return;
    }
    upsertMutation.mutate({
      id: editEntry?.id,
      name: name.trim(),
      category,
      servingSize,
      servingUnit,
      sellingPrice: sellingPrice ?? undefined,
      components: components.map(({ resolvedPrice: _r, ...rest }) => rest) as any,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editEntry ? "Modifica Prodotto" : "Aggiungi Prodotto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome prodotto *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Pepsi grande 0.5L"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                list="fme-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Es. Bevande, Antipasti..."
              />
              <datalist id="fme-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Prezzo vendita (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sellingPrice ?? ""}
                onChange={(e) =>
                  setSellingPrice(
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
              />
            </div>
            <div>
              <Label>Quantità servita</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={servingSize}
                onChange={(e) => setServingSize(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Unità di misura</Label>
              <Input
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                placeholder="Es. porzione, L, ml, pz"
              />
            </div>
          </div>

          {/* Components */}
          <div>
            <Label className="text-sm font-semibold">Composizione</Label>

            {/* Add component controls */}
            <div className="mt-2 p-3 border rounded-lg bg-slate-50 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={addType}
                  onValueChange={(v) => {
                    setAddType(v as ComponentType);
                    setAddSearch("");
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGREDIENT">Ingrediente</SelectItem>
                    <SelectItem value="SEMI_FINISHED">Semilavorato</SelectItem>
                    <SelectItem value="FINAL_RECIPE">Ricetta finale</SelectItem>
                    <SelectItem value="MANUAL">Non codificato</SelectItem>
                  </SelectContent>
                </Select>
                {addType !== "MANUAL" && (
                  <Input
                    placeholder="Cerca..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="flex-1 min-w-32"
                  />
                )}
                {addType === "MANUAL" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addManualComponent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                )}
              </div>

              {/* Dropdown results */}
              {addType !== "MANUAL" && addSearch.length > 0 && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto shadow-sm">
                  {filteredSources.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">
                      Nessun risultato
                    </div>
                  ) : (
                    filteredSources.slice(0, 10).map((src: any) => (
                      <button
                        key={src.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex justify-between"
                        onClick={() => addCodedComponent(src)}
                      >
                        <span>{src.name}</span>
                        <span className="text-slate-500">
                          {addType === "INGREDIENT"
                            ? `€${parseFloat(src.pricePerKgOrUnit || "0").toFixed(4)}/${src.unitType === "k" ? "kg" : "u"}`
                            : `€${parseFloat(src.totalCost || "0").toFixed(4)}/u`}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Component list */}
            {components.length > 0 && (
              <div className="mt-2 space-y-2">
                {components.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 border rounded bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      {comp.type === "MANUAL" ? (
                        <Input
                          value={comp.name}
                          onChange={(e) =>
                            updateComponent(idx, "name", e.target.value)
                          }
                          placeholder="Nome ingrediente"
                          className="h-7 text-sm"
                        />
                      ) : (
                        <div className="text-sm font-medium truncate">
                          {comp.name}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">
                        {comp.type === "INGREDIENT"
                          ? "Ingrediente"
                          : comp.type === "SEMI_FINISHED"
                          ? "Semilavorato"
                          : comp.type === "FINAL_RECIPE"
                          ? "Ricetta"
                          : "Non codificato"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {comp.type === "MANUAL" && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={comp.pricePerUnit ?? 0}
                          onChange={(e) =>
                            updateComponent(
                              idx,
                              "pricePerUnit",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 h-7 text-right text-sm"
                          placeholder="€/u"
                        />
                      )}
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={comp.quantity}
                        onChange={(e) =>
                          updateComponent(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 h-7 text-right text-sm"
                      />
                      <Input
                        value={comp.unit}
                        onChange={(e) =>
                          updateComponent(idx, "unit", e.target.value)
                        }
                        className="w-12 h-7 text-sm"
                        placeholder="kg"
                      />
                      <button
                        type="button"
                        onClick={() => removeComponent(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cost preview */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="text-sm font-medium text-blue-700">
                Costo calcolato
              </div>
              <div className="text-lg font-bold text-blue-800">
                € {localCost.toFixed(4)}
              </div>
            </div>
            {sellingPrice && sellingPrice > 0 && (
              <div className="mt-1 p-2 rounded-lg flex items-center justify-between text-sm">
                <div>Food cost %</div>
                <div
                  className={`font-semibold ${foodCostClass(
                    (localCost / sellingPrice) * 100
                  )}`}
                >
                  {((localCost / sellingPrice) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? "Salvataggio..." : "Salva Prodotto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main FoodMatrix page ----
export default function FoodMatrix() {
  const [activeTab, setActiveTab] = useState<"matrice" | "storico">("matrice");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  // Data queries
  const {
    data: entries,
    refetch: refetchEntries,
    isLoading: entriesLoading,
    isError: entriesError,
  } = trpc.foodMatrixV2.entries.list.useQuery();
  const { data: snapshots } = trpc.foodMatrixV2.snapshots.list.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();
  const { data: allSemiFinished } = trpc.semiFinished.list.useQuery();
  const { data: allRecipes } = trpc.finalRecipes.list.useQuery();

  const utils = trpc.useUtils();

  const deleteMutation = trpc.foodMatrixV2.entries.delete.useMutation({
    onSuccess: () => {
      toast.success("Prodotto rimosso");
      refetchEntries();
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePricesMutation = trpc.foodMatrixV2.updateSellingPrices.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.updated} prezzi salvati · Snapshot creato`);
      setLocalPrices({});
      refetchEntries();
      utils.foodMatrixV2.snapshots.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let list = entries || [];
    if (categoryFilter !== "all") {
      list = list.filter((e: any) => e.category === categoryFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((e: any) => e.name.toLowerCase().includes(term));
    }
    return list;
  }, [entries, categoryFilter, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set((entries || []).map((e: any) => e.category));
    return Array.from(cats).sort();
  }, [entries]);

  const changedPricesCount = Object.keys(localPrices).length;

  function getDisplayPrice(entry: any): number {
    return localPrices[entry.id] !== undefined
      ? parseFloat(localPrices[entry.id]) || 0
      : parseFloat(entry.sellingPrice ?? "0");
  }

  function handleSavePrices() {
    if (changedPricesCount === 0) return;
    const updates = Object.entries(localPrices)
      .map(([entryId, sp]) => ({
        entryId,
        sellingPrice: parseFloat(sp) || 0,
      }))
      .filter((u) => u.sellingPrice >= 0);
    updatePricesMutation.mutate({ updates });
  }

  function handleExport() {
    if (!filteredEntries.length) {
      toast.error("Nessun dato da esportare");
      return;
    }
    const headers = [
      "Nome",
      "Categoria",
      "Porzione",
      "Costo (€)",
      "Prezzo Vendita (€)",
      "Food Cost %",
    ];
    const rows = filteredEntries.map((e: any) => {
      const cost = parseFloat(e.costPerServing ?? "0");
      const price = getDisplayPrice(e);
      const fc = price > 0 ? ((cost / price) * 100).toFixed(1) : "—";
      return [
        e.name,
        e.category,
        `${e.servingSize} ${e.servingUnit}`,
        cost.toFixed(4),
        price > 0 ? price.toFixed(2) : "—",
        fc,
      ];
    });
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `food_matrix_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export completato");
  }

  // Chart data from snapshots
  const chartData = useMemo(() => {
    if (!snapshots?.length) return [];
    // For each snapshot, compute average food cost % per category
    return (snapshots as any[])
      .slice()
      .reverse()
      .map((snap: any) => {
        const entries: any[] = Array.isArray(snap.data)
          ? snap.data
          : snap.data?.entries ?? [];
        const point: Record<string, any> = {
          date: new Date(snap.createdAt).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
          }),
          type: snap.snapshotType,
        };
        // Group by category
        const byCat: Record<string, number[]> = {};
        for (const e of entries) {
          const cost = e.costPerServing ?? 0;
          const selling = e.sellingPrice ?? 0;
          if (selling > 0) {
            const pct = (cost / selling) * 100;
            if (!byCat[e.category]) byCat[e.category] = [];
            byCat[e.category].push(pct);
          }
        }
        for (const [cat, vals] of Object.entries(byCat)) {
          point[cat] =
            Math.round(
              (vals.reduce((a, b) => a + b, 0) / vals.length) * 10
            ) / 10;
        }
        return point;
      });
  }, [snapshots]);

  const chartCategories = useMemo(() => {
    const cats = new Set<string>();
    chartData.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "date" && k !== "type") cats.add(k);
      });
    });
    return Array.from(cats);
  }, [chartData]);

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Food Matrix" }]} />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Food Matrix</h1>
              <p className="text-slate-600 mt-1">
                Gestisci prodotti vendibili, food cost e storico prezzi
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("matrice")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "matrice"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="inline h-4 w-4 mr-1" />
            Matrice
          </button>
          <button
            onClick={() => setActiveTab("storico")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "storico"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="inline h-4 w-4 mr-1" />
            Storico ({snapshots?.length ?? 0})
          </button>
        </div>

        {/* ===== MATRICE TAB ===== */}
        {activeTab === "matrice" && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cerca prodotto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {changedPricesCount > 0 && (
                  <Button
                    onClick={handleSavePrices}
                    disabled={updatePricesMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updatePricesMutation.isPending
                      ? "Salvataggio..."
                      : `Salva Prezzi (${changedPricesCount})`}
                  </Button>
                )}
                <Button onClick={() => { setEditEntry(null); setIsAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Prodotto
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {filteredEntries.length}
                  </div>
                  <div className="text-xs text-slate-500">Prodotti attivi</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {
                      filteredEntries.filter(
                        (e: any) =>
                          e.sellingPrice && parseFloat(e.sellingPrice) > 0
                      ).length
                    }
                  </div>
                  <div className="text-xs text-slate-500">Con prezzo vendita</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {changedPricesCount > 0 ? (
                      <span className="text-amber-600">{changedPricesCount}</span>
                    ) : (
                      "0"
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Modifiche non salvate
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product table */}
            <Card>
              <CardContent className="pt-4">
                {entriesLoading ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <div className="text-sm">Caricamento prodotti...</div>
                  </div>
                ) : entriesError ? (
                  <div className="text-center py-12 text-red-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <div className="font-medium">Errore nel caricamento</div>
                    <div className="text-sm mt-1 text-slate-500">
                      Tabelle non ancora create — riavviare il server per applicare le migrazioni
                    </div>
                    <button
                      className="mt-3 text-sm text-blue-600 underline"
                      onClick={() => refetchEntries()}
                    >
                      Riprova
                    </button>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <div className="font-medium">Nessun prodotto nella Food Matrix</div>
                    <div className="text-sm mt-1">
                      Clicca "Aggiungi Prodotto" per iniziare
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left p-3 border-b font-medium">
                              Prodotto
                            </th>
                            <th className="text-left p-3 border-b font-medium">
                              Categoria
                            </th>
                            <th className="text-left p-3 border-b font-medium">
                              Porzione
                            </th>
                            <th className="text-right p-3 border-b font-medium">
                              Costo (€)
                            </th>
                            <th className="text-right p-3 border-b font-medium w-32">
                              Prezzo Vendita
                            </th>
                            <th className="text-right p-3 border-b font-medium">
                              Food Cost %
                            </th>
                            <th className="p-3 border-b"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((entry: any) => {
                            const cost = parseFloat(entry.costPerServing ?? "0");
                            const displayPrice = getDisplayPrice(entry);
                            const hasLocalEdit =
                              localPrices[entry.id] !== undefined;
                            const fcPct =
                              displayPrice > 0
                                ? (cost / displayPrice) * 100
                                : null;

                            return (
                              <tr
                                key={entry.id}
                                className={`border-b ${
                                  hasLocalEdit ? "bg-amber-50" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="p-3 font-medium">{entry.name}</td>
                                <td className="p-3">
                                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600">
                                  {parseFloat(entry.servingSize).toString()}{" "}
                                  {entry.servingUnit}
                                </td>
                                <td className="p-3 text-right">
                                  € {cost.toFixed(4)}
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={
                                      localPrices[entry.id] ??
                                      (entry.sellingPrice
                                        ? parseFloat(entry.sellingPrice).toFixed(2)
                                        : "")
                                    }
                                    onChange={(e) =>
                                      setLocalPrices((prev) => ({
                                        ...prev,
                                        [entry.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="0.00"
                                    className="h-8 text-right"
                                  />
                                </td>
                                <td className="p-3 text-right">
                                  {fcPct !== null ? (
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${foodCostBg(
                                        fcPct
                                      )}`}
                                    >
                                      {fcPct.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => {
                                        setEditEntry(entry);
                                        setIsAddOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 hover:text-red-600"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Rimuovere "${entry.name}"?`
                                          )
                                        ) {
                                          deleteMutation.mutate({
                                            id: entry.id,
                                          });
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {filteredEntries.map((entry: any) => {
                        const cost = parseFloat(entry.costPerServing ?? "0");
                        const displayPrice = getDisplayPrice(entry);
                        const hasLocalEdit = localPrices[entry.id] !== undefined;
                        const fcPct =
                          displayPrice > 0 ? (cost / displayPrice) * 100 : null;

                        return (
                          <div
                            key={entry.id}
                            className={`border rounded-lg p-4 space-y-3 ${
                              hasLocalEdit ? "bg-amber-50" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold">{entry.name}</div>
                                <div className="text-xs text-slate-500">
                                  {entry.category} ·{" "}
                                  {parseFloat(entry.servingSize).toString()}{" "}
                                  {entry.servingUnit}
                                </div>
                              </div>
                              {fcPct !== null && (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${foodCostBg(
                                    fcPct
                                  )}`}
                                >
                                  {fcPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <div className="text-xs text-slate-500">Costo</div>
                                <div className="font-medium">
                                  € {cost.toFixed(4)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">
                                  Prezzo vendita
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    localPrices[entry.id] ??
                                    (entry.sellingPrice
                                      ? parseFloat(entry.sellingPrice).toFixed(2)
                                      : "")
                                  }
                                  onChange={(e) =>
                                    setLocalPrices((prev) => ({
                                      ...prev,
                                      [entry.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="0.00"
                                  className="h-7 text-right mt-0.5"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  setEditEntry(entry);
                                  setIsAddOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 hover:text-red-600"
                                onClick={() => {
                                  if (confirm(`Rimuovere "${entry.name}"?`)) {
                                    deleteMutation.mutate({ id: entry.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== STORICO TAB ===== */}
        {activeTab === "storico" && (
          <>
            {/* Chart */}
            {chartData.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Andamento Food Cost % per Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        unit="%"
                        domain={[0, "auto"]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip formatter={(v: any) => `${v}%`} />
                      <Legend />
                      {chartCategories.map((cat, idx) => (
                        <Line
                          key={cat}
                          type="monotone"
                          dataKey={cat}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Snapshot list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Snapshot ({snapshots?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!snapshots?.length ? (
                  <div className="text-center py-8 text-slate-500">
                    Nessuno snapshot ancora.
                    <br />
                    Verrà creato automaticamente quando aggiorni i prezzi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(snapshots as any[]).map((snap: any) => (
                      <div
                        key={snap.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              snap.snapshotType === "PRICE_UPDATE"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {snap.snapshotType === "PRICE_UPDATE"
                              ? "Aggiornamento Prezzi"
                              : "Modifica Prezzi Vendita"}
                          </span>
                          <div>
                            <div className="text-sm font-medium">
                              {snap.description || "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(snap.createdAt).toLocaleString("it-IT")}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {snap.createdBy}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Add/Edit dialog */}
        {isAddOpen && (
          <AddProductDialog
            open={isAddOpen}
            onClose={() => { setIsAddOpen(false); setEditEntry(null); }}
            editEntry={editEntry}
            ingredients={allIngredients || []}
            semiFinished={allSemiFinished || []}
            finalRecipes={allRecipes || []}
            onSaved={() => {
              refetchEntries();
              utils.foodMatrixV2.entries.list.invalidate();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
