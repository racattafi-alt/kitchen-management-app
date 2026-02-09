import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Upload, Trash2, ExternalLink, AlertCircle, Folder } from "lucide-react";

export default function DocumentArchive() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const utils = trpc.useUtils();
  const { data: categories = [], isLoading: loadingCategories } = trpc.documents.getCategories.useQuery();
  const { data: allDocuments = [], isLoading: loadingDocs } = trpc.documents.getAll.useQuery();
  const { data: expiringDocs = [] } = trpc.documents.getExpiring.useQuery({ daysAhead: 30 });
  
  const uploadMutation = trpc.documents.upload.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();

  // Imposta tab attivo quando le categorie sono caricate
  useState(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDocumentDate("");
    setExpiryDate("");
    setReferenceNumber("");
    setNotes("");
    setSelectedFile(null);
    setSelectedCategory("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Valida tipo file
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo file non supportato. Usa PDF, JPG o PNG.");
        return;
      }
      
      // Valida dimensione (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        toast.error("File troppo grande. Dimensione massima: 16MB.");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !selectedCategory) {
      toast.error("Compila tutti i campi obbligatori e seleziona un file");
      return;
    }

    try {
      // Converti file in base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Rimuovi prefisso data:...;base64,
        
        // Determina tipo file
        let fileType: "pdf" | "jpg" | "jpeg" | "png" = "pdf";
        if (selectedFile.type === "image/jpeg" || selectedFile.type === "image/jpg") {
          fileType = "jpg";
        } else if (selectedFile.type === "image/png") {
          fileType = "png";
        }
        
        await uploadMutation.mutateAsync({
          categoryId: selectedCategory,
          title,
          description,
          fileBase64: base64Data,
          fileName: selectedFile.name,
          fileType,
          documentDate: documentDate ? new Date(documentDate) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          referenceNumber,
          notes,
        });
        
        toast.success("Documento caricato con successo!");
        setShowUploadDialog(false);
        resetForm();
        utils.documents.getAll.invalidate();
        utils.documents.getByCategory.invalidate();
        utils.documents.getExpiring.invalidate();
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Documento eliminato!");
      utils.documents.getAll.invalidate();
      utils.documents.getByCategory.invalidate();
      utils.documents.getExpiring.invalidate();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const getDocumentsByCategory = (categoryId: string) => {
    return allDocuments.filter((doc: any) => doc.categoryId === categoryId);
  };

  const isExpiringSoon = (doc: any) => {
    if (!doc.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  if (loadingCategories) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-4 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Archivio Documenti Normativi</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestione documenti: certificati sanitari, permessi, storico controlli forze dell'ordine
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} className="w-full md:w-auto">
            <Upload className="h-4 w-4" />
            <span className="ml-2">Carica Documento</span>
          </Button>
        </div>

        {/* Alert documenti in scadenza */}
        {expiringDocs.length > 0 && (
          <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-base md:text-lg">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                Documenti in Scadenza (prossimi 30 giorni)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringDocs.map((doc: any) => {
                  const daysLeft = Math.ceil(
                    (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs md:text-sm">
                      <span className="font-medium truncate">{doc.title}</span>
                      <Badge variant="destructive" className="w-fit">
                        {daysLeft} giorni rimanenti
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs per categorie */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {categories.map((cat: any) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs md:text-sm">
                <Folder className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat: any) => {
            const docs = getDocumentsByCategory(cat.id);
            return (
              <TabsContent key={cat.id} value={cat.id}>
                <Card>
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="text-base md:text-lg">{cat.name}</CardTitle>
                    {cat.description && (
                      <CardDescription className="text-xs md:text-sm">{cat.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingDocs ? (
                      <p className="text-center py-8 text-muted-foreground text-sm">Caricamento documenti...</p>
                    ) : docs.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm md:text-base text-muted-foreground">
                          Nessun documento in questa categoria
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {docs.map((doc: any) => (
                          <Card key={doc.id} className={isExpiringSoon(doc) ? "border-orange-300" : ""}>
                            <CardContent className="py-3 md:py-4">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 mb-2">
                                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm md:text-base font-semibold truncate">{doc.title}</h3>
                                      {doc.description && (
                                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                                          {doc.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>Caricato: {new Date(doc.uploadDate).toLocaleDateString("it-IT")}</span>
                                    {doc.documentDate && (
                                      <>
                                        <span>•</span>
                                        <span>Data doc: {new Date(doc.documentDate).toLocaleDateString("it-IT")}</span>
                                      </>
                                    )}
                                    {doc.expiryDate && (
                                      <>
                                        <span>•</span>
                                        <span className={isExpiringSoon(doc) ? "text-orange-600 font-medium" : ""}>
                                          Scadenza: {new Date(doc.expiryDate).toLocaleDateString("it-IT")}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {doc.referenceNumber && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Rif: {doc.referenceNumber}
                                    </p>
                                  )}
                                  
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Caricato da: {doc.uploadedByUserName}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(doc.fileUrl, "_blank")}
                                    className="w-full sm:w-auto"
                                  >
                                    <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="ml-2">Apri</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(doc.id)}
                                  >
                                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Dialog Upload */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carica Nuovo Documento</DialogTitle>
            <DialogDescription>
              Carica PDF, JPG o PNG (max 16MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category" className="text-sm md:text-base">
                  <SelectValue placeholder="Seleziona categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="title">Titolo Documento *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Certificato HACCP 2026"
                className="text-sm md:text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale del documento..."
                rows={3}
                className="text-sm md:text-base"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentDate">Data Documento</Label>
                <Input
                  id="documentDate"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Data Scadenza</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="referenceNumber">Numero di Riferimento</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Es: CERT-2026-001"
                className="text-sm md:text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                rows={2}
                className="text-sm md:text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="text-sm md:text-base"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  File selezionato: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="w-full sm:w-auto">
              Annulla
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full sm:w-auto">
              {uploadMutation.isPending ? "Caricamento..." : "Carica Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
