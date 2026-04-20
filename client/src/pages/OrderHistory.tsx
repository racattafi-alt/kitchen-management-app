import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ArrowLeft, FileText, Calendar, User, Package, ChevronRight } from "lucide-react";

export default function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { data: orders = [], isLoading } = trpc.orderSessions.getAllHistory.useQuery();

  const parseOrderData = (order: any) => {
    try {
      return typeof order.orderData === "string" ? JSON.parse(order.orderData) : order.orderData;
    } catch {
      return { items: [] };
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 text-center text-muted-foreground">Caricamento...</div>
    );
  }

  const selectedOrderData = selectedOrder ? parseOrderData(selectedOrder) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">Storico Ordini</h1>
              <p className="text-xs text-muted-foreground">{orders.length} ordini inviati</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 max-w-2xl">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <FileText className="h-12 w-12 text-gray-300" />
            <p>Nessun ordine inviato</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border divide-y">
            {orders.map((order) => {
              const orderData = parseOrderData(order);
              const date = new Date(order.createdAt).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Icona */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>

                  {/* Info principali */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.userName ? (
                        <span className="font-medium text-sm truncate">{order.userName}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Anonimo</span>
                      )}
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {order.totalItems} articoli
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{date}</span>
                    </div>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        📝 {order.notes}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog dettagli ordine */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              Dettaglio Ordine
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {new Date(selectedOrder.createdAt).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {selectedOrder.userName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-foreground">{selectedOrder.userName}</span>
                  </div>
                )}
              </div>

              {/* Note */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <strong>Note:</strong> {selectedOrder.notes}
                </div>
              )}

              {/* Articoli */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Articoli ({selectedOrder.totalItems})
                </p>
                <div className="space-y-1">
                  {selectedOrderData?.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.supplier && (
                          <p className="text-xs text-muted-foreground">{item.supplier}</p>
                        )}
                      </div>
                      <span className="font-semibold shrink-0">
                        {item.quantity} {item.unit === "k" ? "kg" : "pz"}
                      </span>
                    </div>
                  ))}
                  {(!selectedOrderData?.items || selectedOrderData.items.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nessun articolo</p>
                  )}
                </div>
              </div>

              {/* PDF */}
              {selectedOrder.pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(selectedOrder.pdfUrl, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
