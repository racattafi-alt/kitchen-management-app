import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function OrderHistory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Admin vede tutti gli ordini, utenti normali solo i propri
  const { data: allOrders = [], isLoading: isLoadingAll } = trpc.orderSessions.getAllHistory.useQuery(
    undefined,
    { enabled: isAdmin }
  );
  const { data: myOrders = [], isLoading: isLoadingMy } = trpc.orderSessions.getMyHistory.useQuery(
    undefined,
    { enabled: !isAdmin }
  );
  
  const orders = isAdmin ? allOrders : myOrders;
  const isLoading = isAdmin ? isLoadingAll : isLoadingMy;

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
        <div className="container py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">Storico Ordini</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                {orders.length} ordini inviati
              </p>
            </div>
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
          <div className="space-y-3 md:space-y-4">
            {orders.map((order) => {
              const orderData = typeof order.orderData === "string" 
                ? JSON.parse(order.orderData) 
                : order.orderData;
              
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg truncate">
                          Ordine #{order.id.slice(0, 8)}
                        </CardTitle>
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 mt-1">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(order.createdAt).toLocaleDateString("it-IT", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {order.userName && (
                          <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                            Da: <span className="font-medium">{order.userName}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl md:text-2xl font-bold text-green-600">
                          {order.totalItems}
                        </p>
                        <p className="text-xs text-gray-600">articoli</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Note */}
                    {order.notes && (
                      <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs md:text-sm">
                          <strong>Note:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Lista articoli */}
                    <div className="space-y-2">
                      <p className="font-semibold text-xs md:text-sm text-gray-700 mb-2">
                        Articoli ordinati:
                      </p>
                      {orderData.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-gray-50 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-600 truncate">
                              {item.category} {item.supplier && `• ${item.supplier}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm md:text-base font-semibold">
                              {item.quantity} {item.unit === "k" ? "kg" : "pz"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PDF Link (se disponibile) */}
                    {order.pdfUrl && (
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(order.pdfUrl!, "_blank")}
                          className="w-full sm:w-auto"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="ml-2">Scarica PDF</span>
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
