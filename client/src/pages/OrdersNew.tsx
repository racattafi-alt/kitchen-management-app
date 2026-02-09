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

  // Filtra ingredienti in base alla ricerca
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Ordini Ingredienti</h1>
            <p className="text-sm text-gray-600">
              {totalCartItems > 0 ? `${totalCartItems} articoli nel carrello` : "Carrello vuoto"}
            </p>
          </div>
          <Button
            onClick={handleSubmitOrder}
            disabled={cartItems.length === 0 || submitOrderMutation.isPending}
            size="lg"
          >
            <Send className="h-5 w-5 mr-2" />
            Invia Ordine
          </Button>
        </div>
      </div>

      <div className="container py-6">
        {/* Barra ricerca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Cerca ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Note ordine */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Note Ordine (opzionale)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Aggiungi note per questo ordine..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Nome ingrediente */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{ingredient.name}</h3>
                      <div className="flex gap-2 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {ingredient.category}
                        </span>
                        {ingredient.supplierName && (
                          <span className="bg-blue-100 px-2 py-0.5 rounded">
                            {ingredient.supplierName}
                          </span>
                        )}
                        {isAdmin && parseFloat(ingredient.pricePerKgOrUnit as any) > 0 && (
                          <span className="bg-yellow-100 px-2 py-0.5 rounded font-mono">
                            €{parseFloat(ingredient.pricePerKgOrUnit as any).toFixed(2)}/{ingredient.unitType === "k" ? "kg" : "pz"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Campo quantità */}
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={cartQty || ""}
                        onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                        placeholder="0"
                        className="text-right"
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
