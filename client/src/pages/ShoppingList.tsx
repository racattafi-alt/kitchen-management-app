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

// Funzione per calcolare il lunedì della settimana (in UTC)
function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  // Usa UTC per evitare problemi di timezone
  const day = d.getUTCDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

export default function ShoppingList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedWeekGroup, setSelectedWeekGroup] = useState<string | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  // Carica tutte le produzioni
  const { data: allProductions } = trpc.production.list.useQuery({});
  
  // Raggruppa produzioni per settimana (usando il lunedì come chiave)
  const weekGroups = allProductions?.reduce((groups: Record<string, any[]>, prod: any) => {
    const weekKey = getMondayOfWeek(new Date(prod.weekStartDate));
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

  // Fornitori unici
  const suppliers = Array.from(new Set(shoppingList?.map((item: any) => item.supplier) || []));

  // Aggiorna quantità da ordinare
  const handleQuantityChange = (itemId: string, value: number) => {
    setOrderQuantities(prev => ({ ...prev, [itemId]: value }));
  };

  // Calcola costo totale ordine
  const totalOrderCost = filteredList?.reduce((sum: number, item: any) => {
    const qty = orderQuantities[item.id] || 0;
    return sum + (qty * item.pricePerUnit);
  }, 0) || 0;

  // Esporta lista ordini
  const handleExport = () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    if (!orderedItems || orderedItems.length === 0) {
      toast.error("Nessun articolo da ordinare");
      return;
    }

    const csv = [
      ["Articolo", "Fornitore", "Quantità Necessaria", "Quantità da Ordinare", "Unità", "Prezzo Unitario", "Costo Totale"],
      ...orderedItems.map((item: any) => [
        item.itemName,
        item.supplier,
        item.quantityNeeded.toFixed(3),
        (orderQuantities[item.id] || 0).toFixed(3),
        item.unitType === 'u' ? 'Unità' : 'kg',
        `€ ${item.pricePerUnit.toFixed(2)}`,
        `€ ${((orderQuantities[item.id] || 0) * item.pricePerUnit).toFixed(2)}`,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordine_${selectedWeekGroup || 'tutte'}.csv`;
    a.click();
    toast.success("Lista ordini esportata");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lista Acquisti</h1>
            <p className="text-muted-foreground">
              Gestisci ordini per tutti gli articoli ordinabili
            </p>
          </div>
          <Button onClick={handleExport} disabled={totalOrderCost === 0}>
            <Download className="mr-2 h-4 w-4" />
            Esporta Ordini
          </Button>
        </div>

        {/* Filtri */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ricerca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca articolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro Settimana */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedWeekGroup === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeekGroup(null)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Tutte le Settimane
                </Button>
                {weekKeys.map((weekKey) => (
                  <Button
                    key={weekKey}
                    variant={selectedWeekGroup === weekKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWeekGroup(weekKey)}
                  >
                    {new Date(weekKey).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    <Badge variant="secondary" className="ml-2">
                      {weekGroups[weekKey].length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Filtro Fornitore */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedSupplier === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSupplier(null)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Tutti i Fornitori
                </Button>
                {suppliers.slice(0, 3).map((supplier) => (
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
          </CardContent>
        </Card>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Articoli Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredList?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Articoli Necessari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredList?.filter((item: any) => item.quantityNeeded > 0).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Articoli da Ordinare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(orderQuantities).filter(qty => qty > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Costo Totale Ordine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                € {totalOrderCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabella */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Lista Articoli Ordinabili
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Caricamento lista acquisti...
              </div>
            ) : !filteredList || filteredList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun articolo trovato
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Articolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fornitore</TableHead>
                      <TableHead className="text-right">Quantità Necessaria</TableHead>
                      <TableHead className="text-right">Quantità da Ordinare</TableHead>
                      <TableHead className="text-right">Unità</TableHead>
                      <TableHead className="text-right">Prezzo/Unità</TableHead>
                      <TableHead className="text-right">Costo Ordine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.map((item: any) => {
                      const orderQty = orderQuantities[item.id] || 0;
                      const orderCost = orderQty * item.pricePerUnit;
                      
                      return (
                        <TableRow 
                          key={item.id}
                          className={item.quantityNeeded > 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                        >
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <Badge variant={item.itemType === 'INGREDIENT' ? 'default' : 'secondary'}>
                              {item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantityNeeded > 0 ? (
                              <span className="text-orange-600 dark:text-orange-400">
                                {item.quantityNeeded.toFixed(3)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={orderQty}
                              onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {item.unitType === 'u' ? 'Unità' : 'kg'}
                          </TableCell>
                          <TableCell className="text-right">
                            € {item.pricePerUnit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {orderQty > 0 ? (
                              <span className="text-primary">€ {orderCost.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
