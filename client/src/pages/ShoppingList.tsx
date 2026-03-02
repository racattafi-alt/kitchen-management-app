import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Download, Filter, Search, Calendar, MessageCircle, FileText, CheckCircle, Copy, Mail, ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedWeekGroup, setSelectedWeekGroup] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'supplier' | 'name' | 'category'>('supplier');
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [orderPackages, setOrderPackages] = useState<Record<string, number>>({});
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
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderText, setOrderText] = useState("");
  const [isSavingSession, setIsSavingSession] = useState(false);
  
  const saveShoppingListOrderMutation = trpc.orderSessions.saveShoppingListOrder.useMutation();
  const saveSessionMutation = trpc.orderSessions.saveShoppingListSession.useMutation();
  const clearSessionMutation = trpc.orderSessions.clearShoppingListSession.useMutation();
  const { data: savedSession } = trpc.orderSessions.getShoppingListSession.useQuery();

  // Salva articoli extra in localStorage
  useEffect(() => {
    localStorage.setItem('extraItems', JSON.stringify(extraItems));
  }, [extraItems]);

  // Ripristina sessione salvata al caricamento
  useEffect(() => {
    if (savedSession && Object.keys(orderQuantities).length === 0) {
      setOrderQuantities(savedSession.orderQuantities);
      setOrderPackages(savedSession.orderPackages);
    }
  }, [savedSession]);

  // Auto-save sessione quando cambiano quantità (debounced)
  useEffect(() => {
    if (Object.keys(orderQuantities).length === 0 && Object.keys(orderPackages).length === 0) return;
    
    const timer = setTimeout(() => {
      setIsSavingSession(true);
      saveSessionMutation.mutate(
        { orderQuantities, orderPackages },
        {
          onSuccess: () => setIsSavingSession(false),
          onError: () => setIsSavingSession(false),
        }
      );
    }, 1000); // Salva dopo 1 secondo di inattività

    return () => clearTimeout(timer);
  }, [orderQuantities, orderPackages]);

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
    (!selectedSupplier || item.supplier === selectedSupplier) &&
    (!selectedDepartment || item.department === selectedDepartment)
  ).sort((a: any, b: any) => {
    if (sortBy === 'name') {
      return (a.itemName || '').localeCompare(b.itemName || '');
    } else if (sortBy === 'category') {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.itemName || '').localeCompare(b.itemName || '');
    } else {
      // Default: ordina per fornitore, poi per nome
      const supplierCompare = (a.supplier || '').localeCompare(b.supplier || '');
      if (supplierCompare !== 0) return supplierCompare;
      return (a.itemName || '').localeCompare(b.itemName || '');
    }
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

  // Calcola confezioni necessarie
  const calculatePackages = (quantityNeeded: number, packageQuantity: number | null): number => {
    if (!packageQuantity || packageQuantity <= 0) return 0;
    return Math.ceil(quantityNeeded / packageQuantity);
  };

  // Calcola quantità totale da confezioni
  const calculateTotalQuantity = (packages: number, packageQuantity: number | null): number => {
    if (!packageQuantity || packageQuantity <= 0) return 0;
    return packages * packageQuantity;
  };

  // Determina se un articolo va ordinato in confezioni (ha isSoldByPackage o packageQuantity > 1)
  const isPkgMode = (item: any): boolean =>
    item.isSoldByPackage === true || (item.packageQuantity && item.packageQuantity > 1);

  // Restituisce la packageQuantity effettiva: se isSoldByPackage ma pkgQty mancante, usa 1
  const effPkgQty = (item: any): number => {
    if (item.packageQuantity && item.packageQuantity > 0) return item.packageQuantity;
    return item.isSoldByPackage ? 1 : 0;
  };

  // Aggiorna quantità da ordinare (deprecato, ora usiamo confezioni)
  const handleQuantityChange = (itemId: string, value: number) => {
    setOrderQuantities(prev => ({ ...prev, [itemId]: value }));
  };

  // Aggiorna confezioni da ordinare
  const handlePackagesChange = (itemId: string, packages: number, item: any) => {
    setOrderPackages(prev => ({ ...prev, [itemId]: packages }));
    // Calcola quantità totale basata su confezioni
    const totalQty = packages * effPkgQty(item);
    setOrderQuantities(prev => ({ ...prev, [itemId]: totalQty }));
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

  // Verifica se ci sono articoli con quantità > 0 (indipendentemente dal prezzo)
  const hasOrderedItems = filteredList?.some((item: any) => (orderQuantities[item.id] || 0) > 0) || false;

  // Genera ordine per fornitore (apre dialog con opzioni)
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
      
      const packages = orderPackages[item.id];
      const totalQty = orderQuantities[item.id] || 0;
      const unit = item.unitType === 'k' ? 'kg' : 'pz';
      const pkgQty = effPkgQty(item);

      if (packages && isPkgMode(item)) {
        const pkgLabel = item.packageType?.toLowerCase() || 'conf.';
        const qtyDetail = pkgQty > 1
          ? ` (${pkgQty.toFixed(2)} ${unit}/conf) = ${totalQty.toFixed(2)} ${unit}`
          : '';
        supplierGroups[supplier].push({
          name: item.itemName,
          qty: `${packages} ${pkgLabel}${qtyDetail}`,
          unit: '',
        });
      } else {
        supplierGroups[supplier].push({
          name: item.itemName,
          qty: totalQty,
          unit: unit,
        });
      }
    });

    // Aggiungi articoli extra
    validExtraItems.forEach(item => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push({
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
      });
    });

    // Prepara testo ordine (senza prezzi)
    const orderSummary = Object.entries(supplierGroups)
      .map(([supplier, items]) => {
        const itemsList = items.map(item => {
          if (typeof item.qty === 'string') {
            return `- ${item.name}: ${item.qty}`;
          } else {
            return `- ${item.name}: ${item.qty.toFixed(2)} ${item.unit}`;
          }
        }).join('\n');
        return `*${supplier}*\n${itemsList}`;
      })
      .join('\n\n');

    const fullOrderText = `🛒 ORDINE FORNITORI\n\n${orderSummary}`;
    
    setOrderText(fullOrderText);
    setShowOrderDialog(true);
  };
  
  // Salva ordine nel database
  const saveOrder = async () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    if (!orderedItems || orderedItems.length === 0) return;
    
    try {
      // Prepara items per salvataggio
      const items = orderedItems.map((item: any) => ({
        ingredientId: item.id,
        name: item.itemName,
        quantity: orderQuantities[item.id],
        unit: item.unitType,
        category: item.category,
        supplier: item.supplier,
      }));

      await saveShoppingListOrderMutation.mutateAsync({
        items,
        notes: `Ordine settimana ${selectedWeekGroup || 'tutte'}`,
      });
      toast.success("Ordine salvato nello storico!");
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
  };
  
  // Copia testo ordine
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
    } catch (error) {
      console.error("Errore copia testo:", error);
    }
    try {
      await saveOrder();
      await clearSessionMutation.mutateAsync();
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
    setOrderQuantities({});
    setOrderPackages({});
    toast.success("Testo copiato e ordine salvato!");
    setShowOrderDialog(false);
  };

  // Apri WhatsApp
  const handleWhatsApp = async () => {
    const whatsappMessage = encodeURIComponent(orderText);
    const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
    // Open before awaits to avoid browser popup blocker
    window.open(whatsappUrl, '_blank');
    try {
      await saveOrder();
      await clearSessionMutation.mutateAsync();
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
    setOrderQuantities({});
    setOrderPackages({});
    toast.success("Ordine inviato su WhatsApp!");
    setShowOrderDialog(false);
  };

  // Apri Email
  const handleEmail = async () => {
    const subject = encodeURIComponent(`Ordine Settimanale - ${selectedWeekGroup || 'Tutte'}`);
    const body = encodeURIComponent(orderText);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    // Navigate before awaits to avoid browser popup blocker
    window.location.href = mailtoLink;
    try {
      await saveOrder();
      await clearSessionMutation.mutateAsync();
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
    setOrderQuantities({});
    setOrderPackages({});
    toast.success("Email preparata e ordine salvato!");
    setShowOrderDialog(false);
  };

  // Esporta CSV e cancella sessione
  const handleExportCSV = async () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    if (!orderedItems || orderedItems.length === 0) {
      toast.error("Nessun articolo da ordinare");
      return;
    }

    // Raggruppa per fornitore per una visualizzazione ordinata
    const supplierGroups: Record<string, any[]> = {};
    orderedItems.forEach((item: any) => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      supplierGroups[supplier].push(item);
    });

    // Crea CSV con separatore punto e virgola (standard Excel italiano)
    const rows: string[][] = [
      ["Fornitore", "Articolo", "Categoria", "Quantità Necessaria", "Quantità da Ordinare", "Unità", "Confezioni", "Tipo Confezione", "Prezzo Unitario", "Costo Totale"]
    ];

    Object.entries(supplierGroups).sort(([a], [b]) => a.localeCompare(b)).forEach(([supplier, items]) => {
      items.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)).forEach((item: any) => {
        const qty = orderQuantities[item.id] || 0;
        const packages = orderPackages[item.id] || 0;
        const unit = item.unitType === 'k' ? 'kg' : 'pz';
        rows.push([
          supplier,
          item.itemName,
          item.category || '',
          item.quantityNeeded.toFixed(3).replace('.', ','),
          qty.toFixed(3).replace('.', ','),
          unit,
          packages > 0 ? packages.toString() : '',
          item.packageType || '',
          item.pricePerUnit.toFixed(2).replace('.', ','),
          (qty * item.pricePerUnit).toFixed(2).replace('.', ','),
        ]);
      });
    });

    // Escape campi che contengono separatore o virgolette
    const csvContent = rows.map(row => 
      row.map(cell => {
        const str = String(cell);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(';')
    ).join('\n');

    // BOM UTF-8 per compatibilità Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordine_${selectedWeekGroup || 'tutte'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Salva ordine e cancella sessione
    try {
      await saveOrder();
      await clearSessionMutation.mutateAsync();
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
    setOrderQuantities({});
    setOrderPackages({});
    toast.success("Ordine esportato e salvato!");
    setShowOrderDialog(false);
  };

  // Esporta ordine per email (senza prezzi)
  const handleFillAll = () => {
    if (!filteredList) return;
    
    const newQuantities: Record<string, number> = { ...orderQuantities };
    const newPackages: Record<string, number> = { ...orderPackages };
    let count = 0;
    
    filteredList.forEach((item: any) => {
      if (item.quantityNeeded > 0 && !orderQuantities[item.id]) {
        if (isPkgMode(item)) {
          const pkgQty = effPkgQty(item);
          const packages = pkgQty > 0 ? Math.ceil(item.quantityNeeded / pkgQty) : 1;
          newPackages[item.id] = packages;
          newQuantities[item.id] = packages * pkgQty;
        } else {
          newQuantities[item.id] = item.quantityNeeded;
        }
        count++;
      }
    });
    
    setOrderPackages(newPackages);
    setOrderQuantities(newQuantities);
    toast.success(`${count} quantità compilate automaticamente`);
  };

  const handleEmailExport = () => {
    const orderedItems = filteredList?.filter((item: any) => (orderQuantities[item.id] || 0) > 0);
    const validExtraItems = extraItems.filter(item => item.name && item.quantity > 0);
    
    if ((!orderedItems || orderedItems.length === 0) && validExtraItems.length === 0) {
      toast.error("Nessun articolo da ordinare");
      return;
    }

    // Raggruppa per fornitore
    const supplierGroups: Record<string, Array<{ name: string; qty: number | string; unit: string }>> = {};
    
    orderedItems?.forEach((item: any) => {
      const supplier = item.supplier || 'Senza Fornitore';
      if (!supplierGroups[supplier]) supplierGroups[supplier] = [];
      
      const packages = orderPackages[item.id];
      const totalQty = orderQuantities[item.id] || 0;
      const unit = item.unitType === 'k' ? 'kg' : 'pz';
      const pkgQty = effPkgQty(item);

      if (packages && isPkgMode(item)) {
        const pkgLabel = item.packageType?.toLowerCase() || 'conf.';
        const qtyDetail = pkgQty > 1
          ? ` (${pkgQty.toFixed(2)} ${unit}/conf) = ${totalQty.toFixed(2)} ${unit}`
          : '';
        supplierGroups[supplier].push({
          name: item.itemName,
          qty: `${packages} ${pkgLabel}${qtyDetail}`,
          unit: '',
        });
      } else {
        supplierGroups[supplier].push({
          name: item.itemName,
          qty: totalQty,
          unit: unit,
        });
      }
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
        if (typeof item.qty === 'string') {
          emailBody += `- ${item.name}: ${item.qty}\n`;
        } else {
          emailBody += `- ${item.name}: ${item.qty.toFixed(3)} ${item.unit}\n`;
        }
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
      <div className="space-y-6 pb-24 md:pb-6">
        <Breadcrumb items={[{ label: "Lista Acquisti" }]} />
        {/* Sticky Footer Mobile con Totale */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50 border-t-2 border-primary-foreground/20">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div>
              <div className="text-sm opacity-90">Totale Ordine</div>
              <div className="text-2xl font-bold">€{totalOrderCost.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEmailExport} disabled={!hasOrderedItems} variant="secondary" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
              <Button onClick={handleExportCSV} disabled={!hasOrderedItems} variant="secondary" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = '/dashboard'}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Lista Acquisti</h1>
              <p className="text-muted-foreground">
                Gestisci ordini per tutti gli articoli ordinabili
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleFillAll} variant="secondary" className="w-full sm:w-auto">
              <CheckCircle className="mr-2 h-4 w-4" />
              Compila Tutto
            </Button>
            <Button onClick={handleSupplierOrder} disabled={!hasOrderedItems} variant="default" className="w-full sm:w-auto" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Crea Ordine
            </Button>
            {isSavingSession && (
              <span className="text-xs text-muted-foreground self-center">Salvataggio...</span>
            )}
          </div>
        </div>

        {/* Filtri */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              {/* Ordinamento */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortBy === 'supplier' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy('supplier')}
                >
                  Fornitore
                </Button>
                <Button
                  variant={sortBy === 'name' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy('name')}
                >
                  Nome
                </Button>
                <Button
                  variant={sortBy === 'category' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy('category')}
                >
                  Categoria
                </Button>
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

              {/* Filtro Reparto */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedDepartment === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment(null)}
                >
                  Tutti i Reparti
                </Button>
                <Button
                  variant={selectedDepartment === "Cucina" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment("Cucina")}
                >
                  Cucina
                </Button>
                <Button
                  variant={selectedDepartment === "Sala" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment("Sala")}
                >
                  Sala
                </Button>
              </div>

              {/* Filtro Fornitore */}
              <div>
                <Select value={selectedSupplier || "all"} onValueChange={(value) => setSelectedSupplier(value === "all" ? null : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona fornitore" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        Tutti i Fornitori
                      </div>
                    </SelectItem>
                    {suppliers.sort().map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <>
                {/* Layout Mobile: Card */}
                <div className="block md:hidden space-y-3">
                  {filteredList.reduce((acc: any[], item: any, index: number) => {
                    const orderQty = orderQuantities[item.id] || 0;
                    const orderCost = orderQty * item.pricePerUnit;
                    const prevItem = index > 0 ? filteredList[index - 1] : null;
                    const showSupplierHeader = !prevItem || prevItem.supplier !== item.supplier;
                    
                    if (showSupplierHeader) {
                      acc.push(
                        <div key={`supplier-header-${index}`} className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold">
                          {item.supplier}
                        </div>
                      );
                    }
                    
                    acc.push(
                      <Card key={item.id} className={item.quantityNeeded > 0 ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : ""}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1">{item.itemName}</div>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <Badge variant={item.itemType === 'INGREDIENT' ? 'default' : 'secondary'} className="text-xs">
                                  {item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato'}
                                </Badge>
                                {item.department && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      item.department === 'Cucina' 
                                        ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                                        : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                                    }`}
                                  >
                                    {item.department}
                                  </Badge>
                                )}
                                <span>•</span>
                                <span>{item.unitType === 'k' ? 'kg' : 'pz'}</span>
                                <span>•</span>
                                <span>€{item.pricePerUnit.toFixed(2)}/{item.unitType === 'k' ? 'kg' : 'pz'}</span>
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-2 w-full md:w-auto">
                              {isPkgMode(item) ? (
                                <>
                                  <div className="text-xs text-muted-foreground text-right">
                                    Confezioni:
                                  </div>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={orderPackages[item.id] || ""}
                                    placeholder="0"
                                    onFocus={(e) => {
                                      e.target.select();
                                      if (!orderPackages[item.id] && item.quantityNeeded > 0) {
                                        const pkgQty = effPkgQty(item);
                                        const packages = pkgQty > 0 ? Math.ceil(item.quantityNeeded / pkgQty) : 1;
                                        handlePackagesChange(item.id, packages, item);
                                      }
                                    }}
                                    onChange={(e) => handlePackagesChange(item.id, parseInt(e.target.value) || 0, item)}
                                    className="w-20 h-10 text-right text-base font-semibold"
                                  />
                                  {orderPackages[item.id] > 0 && (
                                    <div className="text-xs text-muted-foreground text-right">
                                      {effPkgQty(item) > 1
                                        ? `${orderPackages[item.id]} ${item.packageType?.toLowerCase() || 'conf.'} × ${effPkgQty(item).toFixed(2)} ${item.unitType === 'k' ? 'kg' : 'pz'} = ${orderQty.toFixed(2)} ${item.unitType === 'k' ? 'kg' : 'pz'}`
                                        : `${orderPackages[item.id]} ${item.packageType?.toLowerCase() || 'confezioni'}`}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={orderQty || ""}
                                  placeholder=""
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 h-12 text-right text-lg font-semibold"
                                  style={{ color: orderQty ? 'inherit' : 'transparent' }}
                                />
                              )}
                            </div>
                          </div>
                          {item.quantityNeeded > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-sm font-medium">Necessario:</span>
                              <Badge variant="destructive" className="font-semibold">
                                {item.quantityNeeded.toFixed(3)} {item.unitType === 'k' ? 'kg' : 'pz'}
                              </Badge>
                            </div>
                          )}
                          {orderQty > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                              <span className="text-sm font-medium">Costo:</span>
                              <span className="font-semibold text-lg">€{orderCost.toFixed(2)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                    
                    return acc;
                  }, [])}
                </div>
                
                {/* Layout Desktop: Tabella */}
                <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Articolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fornitore</TableHead>
                      <TableHead className="text-right">Necessario</TableHead>
                      <TableHead className="text-right">Confezioni</TableHead>
                      <TableHead className="text-right">Totale Ordine</TableHead>
                      <TableHead className="text-right">Unità</TableHead>
                      <TableHead className="text-right">Prezzo/Unità</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
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
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={item.itemType === 'INGREDIENT' ? 'default' : 'secondary'}>
                                {item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato'}
                              </Badge>
                              {item.department && (
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    item.department === 'Cucina' 
                                      ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800' 
                                      : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                                  }`}
                                >
                                  {item.department}
                                </Badge>
                              )}
                            </div>
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
                            {isPkgMode(item) ? (
                              <div className="flex flex-col items-end gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={orderPackages[item.id] || ""}
                                  placeholder="0"
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (!orderPackages[item.id] && item.quantityNeeded > 0) {
                                      const pkgQty = effPkgQty(item);
                                      const packages = pkgQty > 0 ? Math.ceil(item.quantityNeeded / pkgQty) : 1;
                                      handlePackagesChange(item.id, packages, item);
                                    }
                                  }}
                                  onChange={(e) => handlePackagesChange(item.id, parseInt(e.target.value) || 0, item)}
                                  className="w-20 text-right"
                                />
                                {orderPackages[item.id] > 0 && effPkgQty(item) > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    {effPkgQty(item).toFixed(2)} {item.unitType === 'k' ? 'kg' : 'pz'}/{item.packageType?.toLowerCase() || 'conf.'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={orderQty || ""}
                                placeholder="0"
                                onFocus={(e) => {
                                  e.target.select();
                                  if (!orderQty && item.quantityNeeded > 0) {
                                    handleQuantityChange(item.id, item.quantityNeeded);
                                  }
                                }}
                                onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {orderQty > 0 ? (
                              <span>{orderQty.toFixed(3)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
              </>
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
      
      {/* Dialog Opzioni Invio Ordine */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Come vuoi inviare l'ordine?</DialogTitle>
            <DialogDescription>
              Scegli come condividere l'ordine. L'ordine verrà salvato automaticamente nello storico.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Anteprima ordine */}
            <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">{orderText}</pre>
            </div>
            
            {/* Pulsanti opzioni */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={handleCopyText} variant="outline" className="h-auto py-4 flex-col gap-2">
                <Copy className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Copia Testo</div>
                  <div className="text-xs text-muted-foreground">Incolla dove vuoi</div>
                </div>
              </Button>
              
              <Button onClick={handleWhatsApp} variant="outline" className="h-auto py-4 flex-col gap-2">
                <MessageCircle className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">WhatsApp</div>
                  <div className="text-xs text-muted-foreground">Apri in WhatsApp</div>
                </div>
              </Button>
              
              <Button onClick={handleEmail} variant="outline" className="h-auto py-4 flex-col gap-2">
                <Mail className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Email</div>
                  <div className="text-xs text-muted-foreground">Apri client email</div>
                </div>
              </Button>
              
              <Button onClick={handleExportCSV} variant="outline" className="h-auto py-4 flex-col gap-2">
                <Download className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">CSV Excel</div>
                  <div className="text-xs text-muted-foreground">Scarica file</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
