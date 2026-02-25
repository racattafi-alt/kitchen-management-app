import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ArrowLeft, ShoppingCart, Search, Send } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function OrdersNew() {
  const [, setLocation] = useLocation();
  // Toast notifications removed for simplicity
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Ottieni lista ingredienti
  const { data: ingredients = [], isLoading: loadingIngredients } = trpc.ingredients.list.useQuery();
  
  // Ottieni carrello utente
  const { data: cartItems = [], refetch: refetchCart } = trpc.orderSessions.getMyCart.useQuery();
  
  // Mutation per aggiornare item
  const updateItemMutation = trpc.orderSessions.updateItem.useMutation({
    onSuccess: () => {
      refetchCart();
    },
    onError: (error) => {
      console.error("Errore aggiornamento carrello:", error.message);
      alert(`Errore: ${error.message}`);
    },
  });

  // Mutation per inviare ordine
  const submitOrderMutation = trpc.orderSessions.submitOrder.useMutation({
    onSuccess: (data) => {
      // Genera PDF
      generatePDF(data.orderData);
      
      alert(`Ordine #${data.orderId.slice(0, 8)} inviato con successo!`);
      
      setNotes("");
      refetchCart();
    },
    onError: (error) => {
      console.error("Errore invio ordine:", error.message);
      alert(`Errore: ${error.message}`);
    },
  });

  // Filtra ingredienti in base alla ricerca e department
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === null || ing.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Ottieni quantità corrente dal carrello
  const getCartQuantity = (ingredientId: string) => {
    const item = cartItems.find((i) => i.ingredientId === ingredientId);
    return item?.quantity || 0;
  };

  // Aggiorna quantità
  const handleQuantityChange = (ingredientId: string, value: string) => {
    const quantity = parseFloat(value) || 0;
    updateItemMutation.mutate({ ingredientId, quantity });
  };

  // Genera PDF ordine
  const generatePDF = (orderData: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Ordine Ingredienti", 14, 20);

    doc.setFontSize(11);
    doc.text(`Ordinato da: ${user?.name}`, 14, 32);
    doc.text(`Data: ${new Date().toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`, 14, 39);

    if (notes) {
      doc.setFontSize(10);
      doc.text(`Note: ${notes}`, 14, 46);
    }

    // Tabella articoli (SENZA PREZZI)
    const tableData = orderData.items.map((item: any) => [
      item.name,
      item.quantity.toString(),
      item.unit === "k" ? "kg" : "pz",
      item.supplier || "-",
    ]);

    autoTable(doc, {
      startY: notes ? 52 : 45,
      head: [["Articolo", "Quantità", "Unità", "Fornitore"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: "right" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 50 },
      },
    });

    // Salva PDF
    const dateStr = new Date().toISOString().split("T")[0];
    const userSlug = (user?.name || "utente").toLowerCase().replace(/\s+/g, "_");
    doc.save(`ordine_${userSlug}_${dateStr}.pdf`);
  };

  // Invia ordine
  const handleSubmitOrder = () => {
    if (cartItems.length === 0) {
      alert("Carrello vuoto. Aggiungi almeno un articolo prima di inviare l'ordine.");
      return;
    }

    submitOrderMutation.mutate({ notes: notes || undefined });
  };

  // Calcola totale items nel carrello
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loadingIngredients) {
    return (
      <div className="container py-8">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">Ordini Ingredienti</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                {totalCartItems > 0 ? `${totalCartItems} articoli nel carrello` : "Carrello vuoto"}
              </p>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={cartItems.length === 0 || submitOrderMutation.isPending}
              size="sm"
              className="md:size-default"
            >
              <Send className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline ml-2">Invia Ordine</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Barra ricerca */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <Input
              placeholder="Cerca ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Filtro Reparto */}
        <div className="mb-4 md:mb-6 flex gap-2 flex-wrap">
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

        {/* Note ordine */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg">Note Ordine (opzionale)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Aggiungi note per questo ordine..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm md:text-base"
            />
          </CardContent>
        </Card>

        {/* Lista ingredienti */}
        <div className="space-y-2">
          {filteredIngredients.map((ingredient) => {
            const cartQty = getCartQuantity(ingredient.id);
            const isAdmin = user?.role === "admin";

            return (
              <Card key={ingredient.id} className={cartQty > 0 ? "border-green-500" : ""}>
                <CardContent className="py-3 md:py-4">
                  <div className="flex items-start md:items-center gap-2 md:gap-4">
                    {/* Nome ingrediente */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-semibold truncate">{ingredient.name}</h3>
                      <div className="flex flex-wrap gap-1 md:gap-2 text-xs md:text-sm text-gray-600 mt-1">
                        <span className="bg-gray-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                          {ingredient.category}
                        </span>
                        {ingredient.supplierName && (
                          <span className="bg-blue-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                            {ingredient.supplierName}
                          </span>
                        )}
                        {isAdmin && parseFloat(ingredient.pricePerKgOrUnit as any) > 0 && (
                          <span className="bg-yellow-100 px-1.5 md:px-2 py-0.5 rounded font-mono text-xs">
                            €{parseFloat(ingredient.pricePerKgOrUnit as any).toFixed(2)}/{ingredient.unitType === "k" ? "kg" : "pz"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Campo quantità */}
                    <div className="w-24 md:w-32 flex-shrink-0">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={cartQty || ""}
                        onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                        placeholder="0"
                        className="text-right text-sm md:text-base h-10"
                      />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {ingredient.unitType === "k" ? "kg" : "pz"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredIngredients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nessun ingrediente trovato
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
