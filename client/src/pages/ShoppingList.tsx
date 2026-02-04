import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Download, Filter, Search, Calendar, MessageCircle, FileText } from "lucide-react";
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
  const [extraItems, setExtraItems] = useState<Array<{
    name: string;
    supplier: string;
    quantity: number;
    unit: string;
    price: number;
  }>>(() => {
    const saved = localStorage.getItem('extraItems');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 10 }, () => ({ name: '', supplier: '', quantity: 0, unit: 'kg', price: 0 }));
  });

  // Salva articoli extra in localStorage
  useEffect(() => {
    localStorage.setItem('extraItems', JSON.stringify(extraItems));
  }, [extraItems]);

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
    selectedWeekGroup ? { weekStartDate: new Date(selectedWeekGroup) } : undefined,
    { enabled: true }
  );

  const filteredList = shoppingList?.filter((item: any) =>
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedSupplier || item.supplier === selectedSupplier)
  ).sort((a: any, b: any) => {
    // Ordina prima per fornitore, poi per nome articolo
    const supplierCompare = (a.supplier || '').localeCompare(b.supplier || '');
    if (supplierCompare !== 0) return supplierCompare;
    return (a.itemName || '').localeCompare(b.itemName || '');
  });

  // Fornitori unici
  const suppliers = Array.from(new Set(shoppingList?.map((item: any) => item.supplier) || []));

  // Funzione per arrotondare al multiplo di minOrderQuantity più vicino
  const roundToMinOrder = (quantity: number, minOrder: number | null): number => {
    if (!minOrder || minOrder <= 0) return quantity;
    if (quantity <= 0) return 0;
    
    // Arrotonda al multiplo superiore più vicino
    const multiplier = Math.ceil(quantity / minOrder);
    return multiplier * minOrder;
  };

  // Aggiorna quantità da ordinare
  const handleQuantityChange = (itemId: string, value: number) => {
    setOrderQuantities(prev => ({ ...prev, [itemId]: value }));
  };
  
  // Auto-arrotonda quantità necessaria al minOrderQuantity
  const handleAutoRound = (item: any) => {
    const rounded = roundToMinOrder(item.quantityNeeded, item.minOrderQuantity);
    setOrderQuantities(prev => ({ ...prev, [item.id]: rounded }));
    toast.success(`Arrotondato a ${rounded.toFixed(3)} ${item.unitType === 'k' ? 'kg' : 'pz'}`);
  };

  // Calcola costo totale ordine
  const totalOrderCost = filteredList?.reduce((sum: number, item: any) => {
    const qty = orderQuantities[item.id] || 0;
    return sum + (qty * item.pricePerUnit);
  }, 0) || 0;

  // Genera ordine per fornitore con WhatsApp (senza PDF per ora)
  const handleSupplierOrder = async () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    const validExtraItems = extraItems.filter(item => item.name && item.quantity > 0);
    
    if ((!orderedItems || orderedItems.length === 0) && validExtraItems.length === 0) {
      toast.error("Nessun articolo da ordinare");
      return;
    }

    // Raggruppa per fornitore
    const supplierGroups: Record<string, any[]> = {};
    orderedItems?.forEach((item: any) => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push({
        name: item.itemName,
        qty: orderQuantities[item.id] || 0,
        unit: item.unitType === 'k' ? 'kg' : 'pz',
        price: item.pricePerUnit,
      });
    });
    
    // Aggiungi articoli extra
    validExtraItems.forEach(item => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push({
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
        price: item.price,
      });
    });

    // Prepara messaggio WhatsApp
    const orderSummary = Object.entries(supplierGroups)
      .map(([supplier, items]) => {
        const itemsList = items.map(item => 
          `- ${item.name}: ${item.qty.toFixed(2)} ${item.unit}`
        ).join('\n');
        const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        return `*${supplier}*\n${itemsList}\n_Totale: €${total.toFixed(2)}_`;
      })
      .join('\n\n');

    const whatsappMessage = encodeURIComponent(
      `🛒 *ORDINE FORNITORI*\n\n${orderSummary}\n\n*TOTALE GENERALE: €${totalOrderCost.toFixed(2)}*`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
    
    // Apri WhatsApp
    window.open(whatsappUrl, '_blank');
    toast.success("Ordine pronto per WhatsApp!");
  };

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

  // Esporta ordine per email (senza prezzi)
  const handleEmailExport = () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    const validExtraItems = extraItems.filter(item => item.name && item.quantity > 0);
    
    if ((!orderedItems || orderedItems.length === 0) && validExtraItems.length === 0) {
      toast.error("Nessun articolo da ordinare");
      return;
    }

    // Raggruppa per fornitore
    const supplierGroups: Record<string, Array<{ name: string; qty: number; unit: string }>> = {};
    
    orderedItems?.forEach((item: any) => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push({
        name: item.itemName,
        qty: orderQuantities[item.id] || 0,
        unit: item.unitType === 'k' ? 'kg' : 'pz',
      });
    });
    
    validExtraItems.forEach(item => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push({
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
      });
    });

    // Genera testo email
    let emailBody = `ORDINE SETTIMANALE\n`;
    emailBody += `Settimana: ${selectedWeekGroup || 'Tutte le settimane'}\n\n`;
    
    Object.entries(supplierGroups).forEach(([supplier, items]) => {
      emailBody += `=== ${supplier.toUpperCase()} ===\n`;
      items.forEach(item => {
        emailBody += `- ${item.name}: ${item.qty.toFixed(3)} ${item.unit}\n`;
      });
      emailBody += `\n`;
    });

    // Crea mailto link
    const subject = encodeURIComponent(`Ordine Settimanale - ${selectedWeekGroup || 'Tutte'}`);
    const body = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
    toast.success("Email ordine preparata!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Lista Acquisti</h1>
            <p className="text-muted-foreground">
              Gestisci ordini per tutti gli articoli ordinabili
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSupplierOrder} disabled={totalOrderCost === 0} variant="default" className="w-full sm:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              Ordine per Fornitore
            </Button>
            <Button onClick={handleEmailExport} disabled={totalOrderCost === 0} variant="outline" className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Esporta Email
            </Button>
            <Button onClick={handleExport} disabled={totalOrderCost === 0} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Esporta CSV
            </Button>
          </div>
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
                            <div className="flex items-center gap-2 justify-end">
                              <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={orderQty || ""}
                                placeholder=""
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-right"
                                style={{ color: orderQty ? 'inherit' : 'transparent' }}
                              />
                              {item.minOrderQuantity && item.quantityNeeded > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAutoRound(item)}
                                  title={`Arrotonda al multiplo di ${item.minOrderQuantity}`}
                                  className="h-8 px-2"
                                >
                                  Auto
                                </Button>
                              )}
                            </div>
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

        {/* Articoli Extra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Articoli Extra (non presenti nella lista)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extraItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                  <Input
                    placeholder="Nome articolo"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...extraItems];
                      newItems[index] = { ...newItems[index], name: e.target.value };
                      setExtraItems(newItems);
                    }}
                  />
                  <Input
                    placeholder="Fornitore"
                    value={item.supplier}
                    onChange={(e) => {
                      const newItems = [...extraItems];
                      newItems[index] = { ...newItems[index], supplier: e.target.value };
                      setExtraItems(newItems);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Quantità"
                    value={item.quantity || ''}
                    onChange={(e) => {
                      const newItems = [...extraItems];
                      newItems[index] = { ...newItems[index], quantity: parseFloat(e.target.value) || 0 };
                      setExtraItems(newItems);
                    }}
                  />
                  <Input
                    placeholder="Unità"
                    value={item.unit}
                    onChange={(e) => {
                      const newItems = [...extraItems];
                      newItems[index] = { ...newItems[index], unit: e.target.value };
                      setExtraItems(newItems);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Prezzo €"
                    value={item.price || ''}
                    onChange={(e) => {
                      const newItems = [...extraItems];
                      newItems[index] = { ...newItems[index], price: parseFloat(e.target.value) || 0 };
                      setExtraItems(newItems);
                    }}
                  />
                  <div className="text-right font-semibold">
                    {item.quantity > 0 && item.price > 0 ? (
                      <span className="text-primary">€ {(item.quantity * item.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
