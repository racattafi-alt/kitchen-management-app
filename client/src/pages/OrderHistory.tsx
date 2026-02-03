import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Eye, Calendar, Package } from "lucide-react";

export default function OrderHistory() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Carica storico ordini
  const { data: orders, isLoading } = trpc.production.listOrders.useQuery({ limit: 50 });
  
  // Carica dettagli ordine selezionato
  const { data: orderDetails } = trpc.production.getOrderDetails.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-primary" />
                <CardTitle>Storico Ordini</CardTitle>
              </div>
              <Badge variant="secondary">
                {orders?.length || 0} ordini totali
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Caricamento storico ordini...
              </div>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Ordine</TableHead>
                    <TableHead>Settimana</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                    <TableHead className="text-center">WhatsApp</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(order.orderDate).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.weekId ? (
                          <Badge variant="outline">
                            {new Date(order.weekId).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        € {parseFloat(order.totalCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.whatsappSent ? (
                          <Badge variant="default" className="bg-green-600">
                            Inviato
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Non inviato
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Dettagli
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun ordine trovato</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Gli ordini generati appariranno qui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog dettagli ordine */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Ordine</DialogTitle>
          </DialogHeader>
          
          {orderDetails && orderDetails.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Articolo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead className="text-right">Prezzo/u</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDetails.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>
                        <Badge variant={item.itemType === 'INGREDIENT' ? 'default' : 'secondary'}>
                          {item.itemType === 'INGREDIENT' ? 'Ingrediente' : 'Semilavorato'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell className="text-right">
                        {parseFloat(item.quantityOrdered).toFixed(3)} {item.unitType === 'k' ? 'kg' : 'pz'}
                      </TableCell>
                      <TableCell className="text-right">
                        € {parseFloat(item.pricePerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        € {parseFloat(item.totalCost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Totale Ordine</p>
                  <p className="text-2xl font-bold">
                    € {orderDetails.reduce((sum: number, item: any) => 
                      sum + parseFloat(item.totalCost), 0
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento dettagli...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
