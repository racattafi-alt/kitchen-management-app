import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Upload, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from "lucide-react";

// ─── Tipi ────────────────────────────────────────────────────────────────────

type ImportRow = { sl_id: string; ingrediente_nome: string; qty: number; um: number; eur_riga: number };

type SlMetadata = {
  name: string;
  category: "SPEZIE" | "SALSE" | "VERDURA" | "CARNE" | "ALTRO";
  shelfLifeDays: number;
  storageMethod: string;
};

type MatchType = "ingredient_exact" | "ingredient_partial" | "semi_exact" | "semi_partial" | "not_found";

type ComponentMatch = {
  ingrediente_nome: string;
  qty: number;
  um: number;
  matchType: MatchType;
  matchId?: string;
  matchName?: string;
  matchedType?: "ingredient" | "semi_finished";
  livePricePerUnit?: number;
  liveCost?: number;
  tsvEurRiga: number;
  tsvPricePerUnit?: number;
};

type SlPreview = {
  sl_id: string;
  components: ComponentMatch[];
  totalCostTsv: number;
  totalCostDb: number;
  totalQtyKg: number;
  estimatedPricePerKgTsv: number;
  estimatedPricePerKgDb: number;
  unmatchedCount: number;
  // alias backward-compat
  totalCost?: number;
  estimatedPricePerKg?: number;
};

// ─── Default metadata ─────────────────────────────────────────────────────────

const SL_DEFAULTS: Record<string, Partial<SlMetadata>> = {
  SL_SBACON:     { name: "Spezia Bacon",        category: "SPEZIE" },
  SL_SPULLED:    { name: "Spezia Pulled Pork",  category: "SPEZIE" },
  SL_SRIBS:      { name: "Spezia Ribs",         category: "SPEZIE" },
  SL_STENDERS:   { name: "Spezia Tenders",      category: "SPEZIE" },
  SL_KETCHUP:    { name: "Ketchup",             category: "SALSE"  },
  SL_BBQ:        { name: "Salsa BBQ",           category: "SALSE"  },
  SL_BBQRIBS:    { name: "Salsa BBQ Ribs",      category: "SALSE"  },
  SL_MEMPHIS:    { name: "Salsa Memphis",        category: "SALSE"  },
  SL_SENAPE:     { name: "Senape",              category: "SALSE"  },
  SL_SSOVRACOSCE:{ name: "Spezia Sovracosce",   category: "SPEZIE" },
};

function defaultMeta(sl_id: string): SlMetadata {
  return {
    name: SL_DEFAULTS[sl_id]?.name ?? sl_id,
    category: SL_DEFAULTS[sl_id]?.category ?? "ALTRO",
    shelfLifeDays: 30,
    storageMethod: "Refrigerato",
  };
}

// ─── Parser TSV ──────────────────────────────────────────────────────────────

function parseEurValue(s: string): number {
  // Gestisce "€ 0,31" oppure "3,86" (senza simbolo)
  return parseFloat(s.replace(/[€\s]/g, "").replace(",", ".")) || 0;
}

function parseTSV(text: string): { rows: ImportRow[]; skipped: number } {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  const rows: ImportRow[] = [];
  let skipped = 0;
  for (const line of lines) {
    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length < 4) { skipped++; continue; }
    const [sl_id, ingrediente_nome, qtyRaw, umRaw, , eurRaw] = cols;
    if (!sl_id || sl_id === "SL_ID") continue; // salta intestazione
    // Scarta righe senza nome ingrediente: non possiamo salvarle senza perdere
    // il riferimento e risulterebbero irrecuperabili nella pagina debug.
    if (!ingrediente_nome || ingrediente_nome.trim() === "") { skipped++; continue; }
    const qty = parseFloat(qtyRaw.replace(",", ".")) || 0;
    const um = parseFloat(umRaw.replace(",", ".")) || 1;
    const eur_riga = parseEurValue(eurRaw ?? "0");
    rows.push({ sl_id, ingrediente_nome, qty, um, eur_riga });
  }
  return { rows, skipped };
}

// ─── Badge colori match ───────────────────────────────────────────────────────

function MatchBadge({ type }: { type: MatchType }) {
  if (type === "ingredient_exact")
    return <Badge className="bg-green-100 text-green-800 text-xs">✓ Ingrediente esatto</Badge>;
  if (type === "ingredient_partial")
    return <Badge className="bg-yellow-100 text-yellow-800 text-xs">~ Ingrediente parziale</Badge>;
  if (type === "semi_exact")
    return <Badge className="bg-blue-100 text-blue-800 text-xs">✓ Semilavorato esatto</Badge>;
  if (type === "semi_partial")
    return <Badge className="bg-indigo-100 text-indigo-800 text-xs">~ Semilavorato parziale</Badge>;
  return <Badge className="bg-red-100 text-red-800 text-xs">✗ Non trovato</Badge>;
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function ImportRecipes() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tsvText, setTsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<SlPreview[] | null>(null);
  const [metadata, setMetadata] = useState<Record<string, SlMetadata>>({});
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.adminImport.deleteAllRecipes.useMutation({
    onSuccess: () => {
      toast.success("Tutte le ricette e i semilavorati sono stati eliminati.");
      setDeleteConfirmOpen(false);
      utils.semiFinished.list.invalidate();
      utils.finalRecipes.list.invalidate();
      setStep(2);
    },
    onError: (e) => toast.error(e.message),
  });

  const previewMutation = trpc.adminImport.previewSemiFinished.useMutation({
    onSuccess: (data) => {
      setPreview(data);
      // Inizializza metadata con defaults per ogni SL trovato
      const newMeta: Record<string, SlMetadata> = {};
      for (const sl of data) {
        newMeta[sl.sl_id] = metadata[sl.sl_id] ?? defaultMeta(sl.sl_id);
      }
      setMetadata(newMeta);
      setStep(3);
    },
    onError: (e) => toast.error("Errore preview: " + e.message),
  });

  const importMutation = trpc.adminImport.importSemiFinished.useMutation({
    onSuccess: (result) => {
      toast.success(`Importati ${result.created.length} semilavorati!`);
      if (result.unmatched.length > 0) {
        toast.warning(`${result.unmatched.length} componenti non trovati nel DB (importati senza collegamento).`);
      }
      utils.semiFinished.list.invalidate();
      setStep(4);
    },
    onError: (e) => toast.error("Errore import: " + e.message),
  });

  function handleParse() {
    const { rows, skipped } = parseTSV(tsvText);
    if (rows.length === 0) {
      toast.error("Nessuna riga valida trovata. Controlla il formato TSV.");
      return;
    }
    if (skipped > 0) {
      toast.warning(`${skipped} righe scartate (nome ingrediente mancante o colonne insufficienti).`);
    }
    setParsedRows(rows);
    previewMutation.mutate({ rows });
  }

  function handleImport() {
    importMutation.mutate({
      rows: parsedRows,
      metadata: Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k, v])
      ),
    });
  }

  function updateMeta(sl_id: string, field: keyof SlMetadata, value: string | number) {
    setMetadata((prev) => ({
      ...prev,
      [sl_id]: { ...prev[sl_id], [field]: value },
    }));
  }

  const totalUnmatched = preview?.reduce((s, sl) => s + sl.unmatchedCount, 0) ?? 0;
  const slIds = [...new Set(parsedRows.map((r) => r.sl_id))];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Importazione Ricette</h1>
          <p className="text-muted-foreground mt-1">
            Elimina le ricette esistenti e importa i semilavorati dalla tabella TSV.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 items-center text-sm">
          {[
            { n: 1, label: "Elimina" },
            { n: 2, label: "Incolla TSV" },
            { n: 3, label: "Preview" },
            { n: 4, label: "Fatto" },
          ].map(({ n, label }, i, arr) => (
            <span key={n} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {n}
              </span>
              <span className={step >= n ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {i < arr.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
            </span>
          ))}
        </div>

        {/* STEP 1: Elimina */}
        {step === 1 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                Step 1 — Elimina tutte le ricette esistenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Attenzione: questa operazione è irreversibile
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Verranno eliminati tutti i semilavorati, le ricette finali e i relativi componenti.
                  Gli ingredienti e i fornitori NON vengono toccati.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Eliminazione in corso..." : "Elimina tutte le ricette"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Oppure, se le ricette sono già vuote:{" "}
                <button className="underline text-primary" onClick={() => setStep(2)}>
                  salta e vai all'import
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Incolla TSV */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Step 2 — Incolla la tabella TSV dei semilavorati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                <p className="font-medium mb-1">Formato atteso (tab-separato):</p>
                <code>SL_ID ⇥ Ingrediente_Nome ⇥ Qty ⇥ UM ⇥ Prezzo_UM ⇥ EUR_Riga</code>
                <br />
                <code className="text-xs">SL_KETCHUP ⇥ Olio di semi ⇥ 100 ⇥ 1000 ⇥ € 1,58 ⇥ € 0,16</code>
              </div>
              <Textarea
                placeholder="Incolla qui la tabella copiata da Excel..."
                className="min-h-[300px] font-mono text-sm"
                value={tsvText}
                onChange={(e) => setTsvText(e.target.value)}
              />
              <Button
                onClick={handleParse}
                disabled={!tsvText.trim() || previewMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {previewMutation.isPending ? "Analisi in corso..." : "Analizza e mostra preview"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Preview + metadati */}
        {step === 3 && preview && (
          <div className="space-y-4">
            {/* Riepilogo matching */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {totalUnmatched === 0
                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                    : <AlertCircle className="h-5 w-5 text-yellow-600" />}
                  Step 3 — Preview matching ({preview.length} semilavorati, {parsedRows.length} righe)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-green-700 font-medium">
                    ✓ {parsedRows.length - totalUnmatched} componenti trovati
                  </span>
                  {totalUnmatched > 0 && (
                    <span className="text-red-700 font-medium">
                      ✗ {totalUnmatched} non trovati (importati senza collegamento)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schede per ogni semilavorato */}
            {preview.map((sl) => {
              const costDiff = sl.totalCostDb - sl.totalCostTsv;
              const hasDiff = Math.abs(costDiff) > 0.01;
              return (
              <Card key={sl.sl_id} className={sl.unmatchedCount > 0 ? "border-yellow-300" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">{sl.sl_id}</CardTitle>
                    <div className="flex gap-4 text-sm flex-wrap">
                      <span className="text-muted-foreground">
                        Quantità: <strong className="text-foreground">{sl.totalQtyKg.toFixed(3)} kg</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Costo TSV: <strong className="text-foreground">€ {sl.totalCostTsv.toFixed(2)}</strong>
                      </span>
                      <span className={hasDiff ? "text-blue-700" : "text-muted-foreground"}>
                        Costo DB: <strong>€ {sl.totalCostDb.toFixed(2)}</strong>
                        {hasDiff && (
                          <span className="text-xs ml-1">
                            ({costDiff > 0 ? "+" : ""}{costDiff.toFixed(2)})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        €/kg: <strong>{sl.estimatedPricePerKgDb.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metadati modificabili */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Nome display</Label>
                      <Input
                        className="h-8 text-sm"
                        value={metadata[sl.sl_id]?.name ?? ""}
                        onChange={(e) => updateMeta(sl.sl_id, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Select
                        value={metadata[sl.sl_id]?.category ?? "ALTRO"}
                        onValueChange={(v) => updateMeta(sl.sl_id, "category", v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["SPEZIE", "SALSE", "VERDURA", "CARNE", "ALTRO"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Shelf life (giorni)</Label>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        value={metadata[sl.sl_id]?.shelfLifeDays ?? 30}
                        onChange={(e) => updateMeta(sl.sl_id, "shelfLifeDays", parseInt(e.target.value) || 30)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Conservazione</Label>
                      <Input
                        className="h-8 text-sm"
                        value={metadata[sl.sl_id]?.storageMethod ?? "Refrigerato"}
                        onChange={(e) => updateMeta(sl.sl_id, "storageMethod", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tabella componenti */}
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Ingrediente (Excel)</th>
                          <th className="text-left p-2">Match DB</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">UM</th>
                          <th className="text-right p-2 border-l">€/UM TSV</th>
                          <th className="text-right p-2">€/UM DB</th>
                          <th className="text-right p-2 border-l">Costo TSV</th>
                          <th className="text-right p-2">Costo DB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sl.components.map((c, i) => {
                          const hasMatch = c.matchType !== "not_found";
                          const hasDbPrice = c.livePricePerUnit != null && c.livePricePerUnit > 0;
                          const priceDiff = hasMatch && hasDbPrice && c.tsvPricePerUnit != null
                            ? Math.abs((c.livePricePerUnit ?? 0) - c.tsvPricePerUnit) > 0.01
                            : false;
                          return (
                          <tr key={i} className={`border-t ${c.matchType === "not_found" ? "bg-red-50" : c.matchType.includes("partial") ? "bg-yellow-50" : ""}`}>
                            <td className="p-2 font-medium">{c.ingrediente_nome}</td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <MatchBadge type={c.matchType} />
                                {c.matchName && (
                                  <p className="text-xs text-muted-foreground">→ {c.matchName}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right">{c.qty}</td>
                            <td className="p-2 text-right text-muted-foreground">
                              {c.um === 1 ? "pz" : "g"}
                            </td>
                            <td className="p-2 text-right text-muted-foreground border-l">
                              {c.tsvPricePerUnit != null ? `€ ${c.tsvPricePerUnit.toFixed(2)}` : "-"}
                            </td>
                            <td className={`p-2 text-right ${hasDbPrice ? (priceDiff ? "text-blue-700 font-medium" : "") : "text-muted-foreground"}`}>
                              {hasMatch
                                ? hasDbPrice
                                  ? `€ ${(c.livePricePerUnit as number).toFixed(2)}`
                                  : <span className="text-red-600 text-xs">DB a 0</span>
                                : "-"}
                            </td>
                            <td className="p-2 text-right text-muted-foreground border-l">
                              € {c.tsvEurRiga.toFixed(2)}
                            </td>
                            <td className={`p-2 text-right ${hasMatch && hasDbPrice ? "font-medium" : "text-muted-foreground"}`}>
                              {hasMatch && c.liveCost != null
                                ? `€ ${c.liveCost.toFixed(2)}`
                                : <span className="text-muted-foreground">€ {c.tsvEurRiga.toFixed(2)}</span>}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Legenda quando ci sono discrepanze */}
                  {hasDiff && (
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      I costi sono stati ricalcolati usando i prezzi DB (fonte di verità).
                      La differenza con quelli TSV è {costDiff > 0 ? "+" : ""}{costDiff.toFixed(2)} €.
                    </p>
                  )}
                </CardContent>
              </Card>
              );
            })}

            {/* Bottoni azione */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setStep(2); setPreview(null); }}
              >
                ← Modifica TSV
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importazione in corso..." : `Importa ${preview.length} semilavorati`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 4 && (
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold text-green-700">Semilavorati importati!</h2>
                <p className="text-muted-foreground max-w-md">
                  Puoi ora verificare i semilavorati nella sezione Ricette Finali
                  e procedere con l'importazione delle ricette finali.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setStep(2); setPreview(null); setParsedRows([]); setTsvText(""); }}>
                    Importa altre ricette
                  </Button>
                  <Button onClick={() => window.location.href = "/final-recipes"}>
                    Vai alle Ricette Finali →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog conferma eliminazione */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Conferma eliminazione
              </DialogTitle>
              <DialogDescription>
                Stai per eliminare <strong>tutte</strong> le ricette finali e i semilavorati.
                Questa operazione è <strong>irreversibile</strong>.
                Gli ingredienti e i fornitori rimarranno intatti.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Annulla
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminazione..." : "Sì, elimina tutto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
