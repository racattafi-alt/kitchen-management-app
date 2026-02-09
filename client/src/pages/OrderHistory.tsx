import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function OrderHistory() {
  const [, setLocation] = useLocation();

  // Ottieni storico ordini
  const { data: orders = [], isLoading } = trpc.orderSessions.getMyHistory.useQuery();

  if (isLoading) {
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
            <h1 className="text-2xl font-bold">Storico Ordini</h1>
            <p className="text-sm text-gray-600">
              {orders.length} ordini inviati
            </p>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nessun ordine inviato</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderData = typeof order.orderData === "string" 
                ? JSON.parse(order.orderData) 
                : order.orderData;
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Ordine #{order.id.slice(0, 8)}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("it-IT", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {order.totalItems}
                        </p>
                        <p className="text-xs text-gray-600">articoli</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Note */}
                    {order.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm">
                          <strong>Note:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Lista articoli */}
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-700 mb-2">
                        Articoli ordinati:
                      </p>
                      {orderData.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              {item.category} {item.supplier && `• ${item.supplier}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {item.quantity} {item.unit === "k" ? "kg" : "pz"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PDF Link (se disponibile) */}
                    {order.pdfUrl && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(order.pdfUrl!, "_blank")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Scarica PDF
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
