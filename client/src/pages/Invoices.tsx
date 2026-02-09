import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const utils = trpc.useUtils();
  const { data: invoices = [], isLoading: loadingInvoices } = trpc.invoices.getAllInvoices.useQuery();
  const { data: invoiceDetails, isLoading: loadingDetails } = trpc.invoices.getInvoice.useQuery(
    { invoiceId: currentInvoiceId! },
    { enabled: !!currentInvoiceId }
  );
  const { data: priceReport } = trpc.invoices.getPriceReport.useQuery(
    { invoiceId: currentInvoiceId! },
    { enabled: !!currentInvoiceId && showConfirmDialog }
  );

  const uploadMutation = trpc.invoices.uploadInvoice.useMutation();
  const processMutation = trpc.invoices.processInvoice.useMutation();
  const confirmMutation = trpc.invoices.confirmInvoice.useMutation();
  const updateMatchMutation = trpc.invoices.updateItemMatch.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast.error("Solo file PDF o immagini sono supportati");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File troppo grande (max 10MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Seleziona un file");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const fileData = base64.split(',')[1]; // Remove data:...;base64, prefix

        const result = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData,
          supplierName: supplierName || undefined,
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate: invoiceDate || undefined,
        });

        toast.success("Fattura caricata! Inizio elaborazione...");
        setCurrentInvoiceId(result.invoiceId);
        
        // Auto-process
        setProcessing(true);
        try {
          await processMutation.mutateAsync({ invoiceId: result.invoiceId });
          toast.success("Fattura elaborata! Controlla gli abbinamenti");
          setActiveTab("confirm");
          utils.invoices.getAllInvoices.invalidate();
        } catch (err: any) {
          toast.error(`Errore elaborazione: ${err.message}`);
        } finally {
          setProcessing(false);
        }

        // Reset form
        setSelectedFile(null);
        setSupplierName("");
        setInvoiceNumber("");
        setInvoiceDate("");
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      toast.error(`Errore upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmInvoice = async () => {
    if (!currentInvoiceId) return;

    try {
      await confirmMutation.mutateAsync({ invoiceId: currentInvoiceId });
      toast.success("Fattura confermata! Prezzi aggiornati");
      setShowConfirmDialog(false);
      setCurrentInvoiceId(null);
      setActiveTab("history");
      utils.invoices.getAllInvoices.invalidate();
    } catch (err: any) {
      toast.error(`Errore conferma: ${err.message}`);
    }
  };

  const handleUpdateMatch = async (itemId: string, ingredientId: string) => {
    try {
      await updateMatchMutation.mutateAsync({ itemId, ingredientId });
      toast.success("Abbinamento aggiornato");
      utils.invoices.getInvoice.invalidate({ invoiceId: currentInvoiceId! });
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestione Fatture</h1>
          <p className="text-muted-foreground">
            Importa fatture, aggiorna prezzi automaticamente, monitora variazioni
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Carica Fattura
            </TabsTrigger>
            <TabsTrigger value="confirm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Conferma Abbinamenti
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              Storico
            </TabsTrigger>
          </TabsList>

          {/* TAB: Upload Fattura */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Carica Nuova Fattura</CardTitle>
                <CardDescription>
                  Carica un file PDF o immagine della fattura. Il sistema estrarrà automaticamente i dati e abbinerà i prodotti.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file">File Fattura (PDF o Immagine)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    disabled={uploading || processing}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selezionato: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="supplier">Fornitore (opzionale)</Label>
                    <Input
                      id="supplier"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="es. Soplaya"
                      disabled={uploading || processing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Numero Fattura (opzionale)</Label>
                    <Input
                      id="number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="es. FT-2024-001"
                      disabled={uploading || processing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Data Fattura (opzionale)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      disabled={uploading || processing}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading || processing}
                  className="w-full"
                >
                  {uploading ? "Caricamento..." : processing ? "Elaborazione in corso..." : "Carica ed Elabora"}
                </Button>

                {processing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      ⏳ Elaborazione in corso: OCR → AI Extraction → Matching automatico...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Conferma Abbinamenti */}
          <TabsContent value="confirm">
            {!currentInvoiceId ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nessuna fattura in elaborazione. Carica una nuova fattura per iniziare.
                </CardContent>
              </Card>
            ) : loadingDetails ? (
              <Card>
                <CardContent className="py-8 text-center">Caricamento...</CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Fattura #{invoiceDetails?.invoice.invoiceNumber || "N/A"}</CardTitle>
                    <CardDescription>
                      Fornitore: {invoiceDetails?.invoice.supplierName || "Non specificato"} •
                      Data: {invoiceDetails?.invoice.invoiceDate ? new Date(invoiceDetails.invoice.invoiceDate).toLocaleDateString() : "N/A"} •
                      Totale: €{invoiceDetails?.invoice.totalAmount?.toFixed(2) || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prodotto Fattura</TableHead>
                          <TableHead>Quantità</TableHead>
                          <TableHead>Prezzo Tot</TableHead>
                          <TableHead>Ingrediente Abbinato</TableHead>
                          <TableHead>Prezzo Vecchio</TableHead>
                          <TableHead>Prezzo Nuovo</TableHead>
                          <TableHead>Variazione</TableHead>
                          <TableHead>Metodo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDetails?.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.quantity} {item.unit}</TableCell>
                            <TableCell>€{item.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              {item.ingredientId ? (
                                <Badge variant="outline">{item.ingredientName}</Badge>
                              ) : (
                                <Badge variant="destructive">Non abbinato</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.oldPrice ? `€${item.oldPrice.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              {item.newPrice ? `€${item.newPrice.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              {item.priceChange ? (
                                <span className={item.priceChange > 0 ? "text-red-600" : "text-green-600"}>
                                  {item.priceChange > 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                                  {item.priceChange.toFixed(1)}%
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.matchMethod === 'learned' ? 'default' : item.matchMethod === 'manual' ? 'secondary' : 'outline'}>
                                {item.matchMethod || 'auto'}
                              </Badge>
                              {item.isAnomalous && <AlertTriangle className="inline w-4 h-4 ml-1 text-orange-500" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCurrentInvoiceId(null)}>
                        Annulla
                      </Button>
                      <Button onClick={() => setShowConfirmDialog(true)}>
                        Conferma e Aggiorna Prezzi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB: Storico */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Storico Fatture</CardTitle>
                <CardDescription>Fatture elaborate e confermate</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvoices ? (
                  <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nessuna fattura trovata</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Upload</TableHead>
                        <TableHead>Fornitore</TableHead>
                        <TableHead>Numero</TableHead>
                        <TableHead>Data Fattura</TableHead>
                        <TableHead>Totale</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell>{new Date(inv.uploadedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{inv.supplierName || "-"}</TableCell>
                          <TableCell>{inv.invoiceNumber || "-"}</TableCell>
                          <TableCell>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>{inv.totalAmount ? `€${inv.totalAmount.toFixed(2)}` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'confirmed' ? 'default' : inv.status === 'matched' ? 'secondary' : 'outline'}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentInvoiceId(inv.id);
                                setActiveTab("confirm");
                              }}
                            >
                              Visualizza
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Conferma con Report */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Variazioni Prezzi</DialogTitle>
              <DialogDescription>
                Riepilogo impatto aggiornamento prezzi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{priceReport?.totalItems || 0}</div>
                    <p className="text-xs text-muted-foreground">Prodotti Totali</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{priceReport?.matchedItems || 0}</div>
                    <p className="text-xs text-muted-foreground">Abbinati</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">{priceReport?.anomalousChanges || 0}</div>
                    <p className="text-xs text-muted-foreground">Variazioni Anomale</p>
                  </CardContent>
                </Card>
              </div>

              {priceReport && priceReport.anomalies.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">⚠️ Variazioni Anomale (&gt;20%)</h4>
                  <div className="space-y-2">
                    {priceReport.anomalies.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <span className="font-medium">{item.ingredientName}</span>
                        <span className="text-orange-600 font-bold">
                          {item.priceChange > 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {priceReport && priceReport.impactedRecipes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">📊 Ricette Finali Impattate</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ricetta</TableHead>
                        <TableHead>Costo Vecchio</TableHead>
                        <TableHead>Costo Nuovo</TableHead>
                        <TableHead>Aumento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceReport.impactedRecipes.map((recipe: any) => (
                        <TableRow key={recipe.id}>
                          <TableCell>{recipe.recipeName}</TableCell>
                          <TableCell>€{recipe.oldCost.toFixed(2)}</TableCell>
                          <TableCell>€{recipe.newCost.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">+{recipe.costIncrease.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleConfirmInvoice}>
                Conferma Aggiornamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
