import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Download, Filter, Search, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ShoppingList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedWeekGroup, setSelectedWeekGroup] = useState<string | null>(null);

  // Carica tutte le produzioni
  const { data: allProductions } = trpc.production.list.useQuery({});
  
  // Raggruppa produzioni per settimana
  const weekGroups = allProductions?.reduce((groups: Record<string, any[]>, prod: any) => {
    const weekKey = new Date(prod.weekStartDate).toISOString().split('T')[0];
    if (!groups[weekKey]) groups[weekKey] = [];
    groups[weekKey].push(prod);
    return groups;
  }, {}) || {};

  const weekKeys = Object.keys(weekGroups).sort((a, b) => b.localeCompare(a)); // Più recenti prima

  // Genera lista acquisti per la settimana selezionata (o tutte)
  const { data: shoppingList, isLoading } = trpc.production.generateShoppingList.useQuery(
    { weekId: selectedWeekGroup || undefined },
    { enabled: true }
  );

  const filteredList = shoppingList?.filter((item: any) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedSupplier || item.supplier === selectedSupplier)
  );

  const suppliers = Array.from(new Set(shoppingList?.map((item: any) => item.supplier) || [])) as string[];
  
  const totalCost = filteredList?.reduce((sum: number, item: any) => sum + Number(item.totalCost || 0), 0) || 0;

  const handleExport = () => {
    if (!filteredList || filteredList.length === 0) {
      toast.error("Nessun dato da esportare");
      return;
    }

    const csvContent = [
      ["Item", "Tipo", "Categoria", "Fornitore", "Quantità", "Unità", "Prezzo Unitario", "Costo Totale"].join(","),
      ...filteredList.map((item: any) =>
        [
          item.itemName,
          item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato',
          item.category,
          item.supplier,
          Number(item.quantityNeeded || 0).toFixed(3),
          item.unitType,
          Number(item.pricePerUnit || 0).toFixed(2),
          Number(item.totalCost || 0).toFixed(2)
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shopping-list-${selectedWeekGroup || "tutte-settimane"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Lista esportata con successo");
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lista Acquisti</h1>
            <p className="text-muted-foreground mt-2">
              Aggregazione automatica ingredienti per settimana di produzione
            </p>
          </div>
          <Button onClick={handleExport} disabled={!filteredList || filteredList.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
        </div>

        {/* Filtri */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selezione Settimana */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Settimana di Produzione
              </label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedWeekGroup === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeekGroup(null)}
                >
                  Tutte le Settimane ({Object.keys(weekGroups).length})
                </Button>
                {weekKeys.map((weekKey) => {
                  const weekDate = new Date(weekKey);
                  const productionCount = weekGroups[weekKey]?.length || 0;
                  return (
                    <Button
                      key={weekKey}
                      variant={selectedWeekGroup === weekKey ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedWeekGroup(weekKey)}
                    >
                      {weekDate.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                      <Badge variant="secondary" className="ml-2">{productionCount}</Badge>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ricerca Ingrediente */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Cerca Ingrediente
                </label>
                <Input
                  placeholder="Nome ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtro Fornitore */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fornitore</label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedSupplier === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSupplier(null)}
                  >
                    Tutti
                  </Button>
                  {suppliers.map((supplier) => (
                    <Button
                      key={supplier}
                      variant={selectedSupplier === supplier ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSupplier(supplier)}
                    >
                      {supplier}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista Acquisti */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Ingredienti da Acquistare
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo Totale</p>
                <p className="text-2xl font-bold">€ {totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Caricamento...</p>
            ) : !filteredList || filteredList.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {shoppingList?.length === 0 
                    ? "Nessuna produzione pianificata per questa settimana" 
                    : "Nessun ingrediente trovato con i filtri applicati"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead>Unità</TableHead>
                    <TableHead className="text-right">Prezzo/Unit</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>
                        <Badge variant={item.itemType === 'INGREDIENT' ? 'default' : 'secondary'}>
                          {item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.quantityNeeded || 0).toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.unitType === "k" ? "Kg" : "Unità"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        € {Number(item.pricePerUnit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        € {Number(item.totalCost || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
