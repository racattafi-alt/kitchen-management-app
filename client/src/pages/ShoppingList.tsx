import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";

export default function ShoppingList() {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const { data: weeklyProductions } = trpc.production.listWeekly.useQuery();
  const { data: shoppingList, isLoading } = trpc.production.generateShoppingList.useQuery(
    { weekId: selectedWeek || undefined },
    { enabled: true }
  );

  const filteredList = shoppingList?.filter((item: any) =>
    item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
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
      ["Ingrediente", "Categoria", "Fornitore", "Quantità", "Unità", "Prezzo Unitario", "Costo Totale"].join(","),
      ...filteredList.map((item: any) =>
        [
          item.ingredientName,
          item.category,
          item.supplier,
          item.quantityNeeded,
          item.unitType,
          Number(item.pricePerUnit || 0).toFixed(2),
          Number(item.totalCost || 0).toFixed(2)
        ].join(",")
      )
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shopping-list-${selectedWeek || "export"}.csv`;
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
              Genera lista acquisti dalla produzione settimanale
            </p>
          </div>
          <Button onClick={handleExport} disabled={!filteredList || filteredList.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
        </div>

        {/* Week Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleziona Settimana di Produzione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant={selectedWeek === "" ? "default" : "outline"}
                onClick={() => setSelectedWeek("")}
                className="justify-start"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Tutte le settimane
              </Button>
              {weeklyProductions?.map((week: any) => (
                <Button
                  key={week.id}
                  variant={selectedWeek === week.id ? "default" : "outline"}
                  onClick={() => setSelectedWeek(week.id)}
                  className="justify-start"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Settimana {new Date(week.weekStartDate).toLocaleDateString("it-IT")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {(
          <>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca ingredienti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedSupplier === null ? "default" : "outline"}
                  onClick={() => setSelectedSupplier(null)}
                >
                  Tutti
                </Button>
                {suppliers.map((supplier: string) => (
                  <Button
                    key={supplier}
                    variant={selectedSupplier === supplier ? "default" : "outline"}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    {supplier}
                  </Button>
                ))}
              </div>
            </div>

            {/* Shopping List Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lista Ingredienti</CardTitle>
                  <Badge variant="secondary" className="text-lg">
                    Totale: €{totalCost.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">Caricamento...</div>
                ) : filteredList && filteredList.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead className="text-right">Quantità</TableHead>
                        <TableHead>Unità</TableHead>
                        <TableHead className="text-right">Prezzo/Unità</TableHead>
                        <TableHead className="text-right">Costo Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredList.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.ingredientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell className="text-right">{Number(item.quantityNeeded || 0).toFixed(2)}</TableCell>
                          <TableCell>{item.unitType}</TableCell>
                          <TableCell className="text-right">€{Number(item.pricePerUnit || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            €{Number(item.totalCost || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nessun ingrediente trovato per questa settimana
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedWeek && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Seleziona una settimana di produzione per generare la lista acquisti
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
