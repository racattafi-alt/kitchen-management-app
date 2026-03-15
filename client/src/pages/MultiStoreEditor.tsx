import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, AlertTriangle, Check, ArrowRight, Database, GitCompare, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import RecipeForm, { RecipeFormData, ComponentWithDetails } from "@/components/RecipeForm";
import { toast } from "sonner";

type EntityType = "ingredient" | "recipe" | "supplier";

export default function MultiStoreEditor() {
  const [entityType, setEntityType] = useState<EntityType>("ingredient");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]); // Per selezione multipla
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Stati specifici per ricette
  const [recipeFormData, setRecipeFormData] = useState<RecipeFormData>({
    name: '',
    code: '',
    category: 'Altro',
    conservationMethod: 'Refrigerato',
    maxConservationTime: '48 ore',
    yieldPercentage: 100,
    serviceWastePercentage: 0,
    isSellable: true,
    isSemiFinished: false,
  });
  const [recipeComponents, setRecipeComponents] = useState<ComponentWithDetails[]>([]);

  const { data: entities, isLoading: entitiesLoading } = trpc.multiStoreEditor.listEntities.useQuery({
    entityType,
  });

  const { data: entityData, isLoading: entityLoading } = trpc.multiStoreEditor.getEntityAcrossStores.useQuery(
    {
      entityType,
      name: selectedEntity!,
    },
    {
      enabled: !!selectedEntity,
    }
  );

  const { data: stores } = trpc.stores.list.useQuery();

  // Stato per migrazione bulk store
  const [migrationSourceStoreId, setMigrationSourceStoreId] = useState<string>("");
  const [migrationDestStoreIds, setMigrationDestStoreIds] = useState<string[]>([]);
  const [migrationEntityTypes, setMigrationEntityTypes] = useState<string[]>(["ingredient", "recipe", "supplier"]);

  // Stato per confronto store
  const [compareStoreA, setCompareStoreA] = useState<string>("");
  const [compareStoreB, setCompareStoreB] = useState<string>("");
  const [compareEntityType, setCompareEntityType] = useState<EntityType>("ingredient");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: compareData, isLoading: compareLoading, refetch: refetchCompare } =
    trpc.multiStoreEditor.compareStores.useQuery(
      { entityType: compareEntityType, storeIdA: compareStoreA, storeIdB: compareStoreB },
      { enabled: compareEnabled && !!compareStoreA && !!compareStoreB && compareStoreA !== compareStoreB }
    );

  const handleCompare = () => {
    if (!compareStoreA || !compareStoreB) {
      toast.error("Seleziona entrambi gli store da confrontare");
      return;
    }
    if (compareStoreA === compareStoreB) {
      toast.error("Seleziona due store diversi");
      return;
    }
    setCompareEnabled(true);
    setCompareOpen(true);
    refetchCompare();
  };

  const copySingleToStore = (name: string, fromStoreId: string, toStoreId: string) => {
    bulkMigrateMutation.mutate({
      sourceStoreId: fromStoreId,
      destinationStoreIds: [toStoreId],
      entityTypes: [compareEntityType],
    });
  };

  const bulkMigrateMutation = trpc.multiStoreEditor.bulkMigrateFromStore.useMutation({
    onSuccess: (result) => {
      const errMsg = result.errors.length > 0
        ? ` (${result.errors.length} errori)`
        : "";
      toast.success(`Migrazione completata: ${result.totalMigrated} entità copiate${errMsg}`);
      if (result.errors.length > 0) {
        console.error("Errori migrazione:", result.errors);
      }
      setMigrationDestStoreIds([]);
      if (compareEnabled) refetchCompare();
    },
    onError: (error) => {
      toast.error(`Errore migrazione: ${error.message}`);
    },
  });

  const handleBulkMigrate = () => {
    if (!migrationSourceStoreId) {
      toast.error("Seleziona lo store sorgente");
      return;
    }
    if (migrationDestStoreIds.length === 0) {
      toast.error("Seleziona almeno uno store di destinazione");
      return;
    }
    if (migrationEntityTypes.length === 0) {
      toast.error("Seleziona almeno un tipo di dato da migrare");
      return;
    }
    bulkMigrateMutation.mutate({
      sourceStoreId: migrationSourceStoreId,
      destinationStoreIds: migrationDestStoreIds,
      entityTypes: migrationEntityTypes as any,
    });
  };

  const toggleMigrationDest = (storeId: string) => {
    setMigrationDestStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const toggleMigrationEntityType = (type: string) => {
    setMigrationEntityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const updateMutation = trpc.multiStoreEditor.updateEntityAcrossStores.useMutation({
    onSuccess: () => {
      alert("Entità aggiornata con successo in tutti gli store selezionati!");
      setSelectedEntity(null);
      setFormData({});
      setRecipeFormData({
        name: '',
        code: '',
        category: 'Altro',
        conservationMethod: 'Refrigerato',
        maxConservationTime: '48 ore',
        yieldPercentage: 100,
        serviceWastePercentage: 0,
        isSellable: true,
        isSemiFinished: false,
      });
      setRecipeComponents([]);
      setSelectedStores([]);
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!selectedEntity || selectedStores.length === 0) {
      alert("Seleziona almeno un store");
      return;
    }

    // Per ricette, costruisci dati completi con components
    let dataToSave = formData;
    if (entityType === 'recipe') {
      dataToSave = {
        ...recipeFormData,
        components: recipeComponents,
      };
    }

    updateMutation.mutate({
      entityType,
      name: selectedEntity,
      data: dataToSave,
      storeIds: selectedStores,
    });
  };

  const handleSelectAll = () => {
    if (stores) {
      setSelectedStores(stores.map(s => s.storeId));
    }
  };

  const handleDeselectAll = () => {
    setSelectedStores([]);
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  // Quando selezioniamo un'entità, carichiamo i dati del primo store come base
  const handleEntitySelect = (entityName: string) => {
    setSelectedEntity(entityName);
    setFormData({});
    setRecipeFormData({
      name: '',
      code: '',
      category: 'Altro',
      conservationMethod: 'Refrigerato',
      maxConservationTime: '48 ore',
      yieldPercentage: 100,
      serviceWastePercentage: 0,
      isSellable: true,
      isSemiFinished: false,
    });
    setRecipeComponents([]);
    setSelectedStores([]);
    setSelectedEntities([]); // Reset selezione multipla
  };

  const toggleEntitySelection = (entityName: string) => {
    setSelectedEntities(prev =>
      prev.includes(entityName)
        ? prev.filter(name => name !== entityName)
        : [...prev, entityName]
    );
  };

  const handleSelectAllEntities = () => {
    if (entities) {
      setSelectedEntities(entities.map(e => e.name));
    }
  };

  const handleDeselectAllEntities = () => {
    setSelectedEntities([]);
  };

  const handleCopySelected = () => {
    if (selectedEntities.length === 0) {
      alert("Seleziona almeno un'entità");
      return;
    }
    if (selectedStores.length === 0) {
      alert("Seleziona almeno uno store di destinazione");
      return;
    }
    // TODO: Implementare copia batch
    alert(`Copia di ${selectedEntities.length} entità in ${selectedStores.length} store`);
  };

  // Aggiorna form data quando entityData cambia
  if (entityData && entityData.length > 0 && Object.keys(formData).length === 0) {
    const firstEntity = entityData[0];
    const { id, storeId, createdAt, updatedAt, ...rest } = firstEntity;
    
    if (entityType === 'recipe') {
      // Per ricette, popola recipeFormData e components
      const components = typeof (firstEntity as any).components === 'string' 
        ? JSON.parse((firstEntity as any).components) 
        : (firstEntity as any).components || [];
      
      setRecipeFormData({
        name: firstEntity.name || '',
        code: (firstEntity as any).code || '',
        category: (firstEntity as any).category || 'Altro',
        conservationMethod: (firstEntity as any).conservationMethod || 'Refrigerato',
        maxConservationTime: (firstEntity as any).maxConservationTime || '48 ore',
        yieldPercentage: parseFloat((firstEntity as any).yieldPercentage || '100'),
        serviceWastePercentage: parseFloat((firstEntity as any).serviceWastePercentage || '0'),
        unitWeight: parseFloat((firstEntity as any).unitWeight || '0'),
        producedQuantity: parseFloat((firstEntity as any).producedQuantity || '0'),
        isSellable: (firstEntity as any).isSellable !== false,
        isSemiFinished: (firstEntity as any).isSemiFinished || false,
        measurementType: (firstEntity as any).measurementType || 'weight_only',
        pieceWeight: parseFloat((firstEntity as any).pieceWeight || '0'),
      });
      setRecipeComponents(components);
      setFormData(rest); // Mantieni anche formData per compatibilità
    } else {
      // Per ingredienti e fornitori, usa il form generico
      setFormData(rest);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editor Multi-Store Centralizzato</h1>
            <p className="text-gray-600">Modifica entità in più store contemporaneamente</p>
          </div>
        </div>
      </div>

      {/* Sezione Migrazione Bulk Store */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Migrazione Dati tra Store</CardTitle>
          </div>
          <CardDescription>
            Copia tutti i dati (ingredienti, ricette, fornitori) da uno store sorgente verso uno o più store destinazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Store sorgente */}
            <div className="col-span-3">
              <Label className="text-sm font-semibold">Store Sorgente</Label>
              <p className="text-xs text-muted-foreground mb-2">Prendi i dati da questo store</p>
              <Select value={migrationSourceStoreId} onValueChange={setMigrationSourceStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona store..." />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Freccia */}
            <div className="col-span-1 flex items-center justify-center pt-8">
              <ArrowRight className="h-6 w-6 text-blue-500" />
            </div>

            {/* Store destinazione */}
            <div className="col-span-4">
              <Label className="text-sm font-semibold">Store Destinazione</Label>
              <p className="text-xs text-muted-foreground mb-2">Copia i dati in questi store</p>
              <div className="space-y-2 border rounded-md p-3 bg-white">
                {stores?.filter(s => s.storeId !== migrationSourceStoreId).map((store) => (
                  <div key={store.storeId} className="flex items-center gap-2">
                    <Checkbox
                      id={`dest-${store.storeId}`}
                      checked={migrationDestStoreIds.includes(store.storeId)}
                      onCheckedChange={() => toggleMigrationDest(store.storeId)}
                    />
                    <label htmlFor={`dest-${store.storeId}`} className="text-sm cursor-pointer">
                      {store.storeName}
                    </label>
                  </div>
                ))}
                {!stores || stores.filter(s => s.storeId !== migrationSourceStoreId).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Seleziona prima lo store sorgente</p>
                ) : null}
              </div>
            </div>

            {/* Tipi da migrare */}
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Dati da migrare</Label>
              <p className="text-xs text-muted-foreground mb-2">Scegli cosa copiare</p>
              <div className="space-y-2 border rounded-md p-3 bg-white">
                {[
                  { value: "ingredient", label: "Ingredienti" },
                  { value: "recipe", label: "Ricette" },
                  { value: "supplier", label: "Fornitori" },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${value}`}
                      checked={migrationEntityTypes.includes(value)}
                      onCheckedChange={() => toggleMigrationEntityType(value)}
                    />
                    <label htmlFor={`type-${value}`} className="text-sm cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottone migra */}
            <div className="col-span-2 flex items-end">
              <Button
                className="w-full"
                onClick={handleBulkMigrate}
                disabled={bulkMigrateMutation.isPending || !migrationSourceStoreId || migrationDestStoreIds.length === 0}
              >
                {bulkMigrateMutation.isPending ? (
                  "Migrazione in corso..."
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Migra Dati
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Confronto Store */}
      <Card className="mb-6 border-purple-200 bg-purple-50">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setCompareOpen(prev => !prev)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">Confronta Store</CardTitle>
            </div>
            {compareOpen ? <ChevronUp className="h-4 w-4 text-purple-600" /> : <ChevronDown className="h-4 w-4 text-purple-600" />}
          </div>
          <CardDescription>
            Scopri quali prodotti esistono in uno store ma non nell'altro e copia selettivamente
          </CardDescription>
        </CardHeader>
        {compareOpen && (
          <CardContent>
            {/* Controlli confronto */}
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-sm font-semibold">Store A</Label>
                <Select value={compareStoreA} onValueChange={v => { setCompareStoreA(v); setCompareEnabled(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona store A..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map(s => (
                      <SelectItem key={s.storeId} value={s.storeId}>{s.storeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <Label className="text-sm font-semibold">Store B</Label>
                <Select value={compareStoreB} onValueChange={v => { setCompareStoreB(v); setCompareEnabled(false); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona store B..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.filter(s => s.storeId !== compareStoreA).map(s => (
                      <SelectItem key={s.storeId} value={s.storeId}>{s.storeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <Label className="text-sm font-semibold">Tipo</Label>
                <Select value={compareEntityType} onValueChange={v => { setCompareEntityType(v as EntityType); setCompareEnabled(false); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredient">Ingredienti</SelectItem>
                    <SelectItem value="recipe">Ricette</SelectItem>
                    <SelectItem value="supplier">Fornitori</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCompare}
                disabled={compareLoading || !compareStoreA || !compareStoreB}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {compareLoading ? "Confronto..." : "Confronta"}
              </Button>
            </div>

            {/* Risultati confronto */}
            {compareData && (
              <div className="grid grid-cols-3 gap-4">
                {/* Solo in A */}
                <div className="rounded border border-orange-200 bg-orange-50 p-3">
                  <div className="font-semibold text-orange-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Solo in {stores?.find(s => s.storeId === compareStoreA)?.storeName ?? "Store A"} ({compareData.onlyInA.length})
                  </div>
                  {compareData.onlyInA.length === 0 ? (
                    <p className="text-xs text-gray-500">Nessuno</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {compareData.onlyInA.map(name => (
                        <div key={name} className="flex items-center justify-between gap-2 text-sm bg-white rounded px-2 py-1">
                          <span className="truncate">{name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs shrink-0"
                            disabled={bulkMigrateMutation.isPending}
                            onClick={() => copySingleToStore(name, compareStoreA, compareStoreB)}
                            title={`Copia in ${stores?.find(s => s.storeId === compareStoreB)?.storeName}`}
                          >
                            <Copy className="h-3 w-3 mr-1" />→B
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* In entrambi */}
                <div className="rounded border border-green-200 bg-green-50 p-3">
                  <div className="font-semibold text-green-800 mb-2 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    In entrambi ({compareData.inBoth.length})
                  </div>
                  {compareData.inBoth.length === 0 ? (
                    <p className="text-xs text-gray-500">Nessuno</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {compareData.inBoth.map(item => (
                        <div key={item.name} className="flex items-center gap-2 text-sm bg-white rounded px-2 py-1">
                          {item.hasDiff ? (
                            <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" aria-label="Valori diversi tra i due store" />
                          ) : (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Solo in B */}
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <div className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Solo in {stores?.find(s => s.storeId === compareStoreB)?.storeName ?? "Store B"} ({compareData.onlyInB.length})
                  </div>
                  {compareData.onlyInB.length === 0 ? (
                    <p className="text-xs text-gray-500">Nessuno</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {compareData.onlyInB.map(name => (
                        <div key={name} className="flex items-center justify-between gap-2 text-sm bg-white rounded px-2 py-1">
                          <span className="truncate">{name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs shrink-0"
                            disabled={bulkMigrateMutation.isPending}
                            onClick={() => copySingleToStore(name, compareStoreB, compareStoreA)}
                            title={`Copia in ${stores?.find(s => s.storeId === compareStoreA)?.storeName}`}
                          >
                            <Copy className="h-3 w-3 mr-1" />→A
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {compareEnabled && !compareLoading && !compareData && (
              <p className="text-center text-sm text-gray-500 mt-4">Nessun dato disponibile</p>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Colonna 1: Selezione */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Seleziona Entità</CardTitle>
              <CardDescription>Scegli cosa modificare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={entityType}
                  onValueChange={(value) => {
                    setEntityType(value as EntityType);
                    setSelectedEntity(null);
                    setFormData({});
                    setRecipeFormData({
                      name: '',
                      code: '',
                      category: 'Altro',
                      conservationMethod: 'Refrigerato',
                      maxConservationTime: '48 ore',
                      yieldPercentage: 100,
                      serviceWastePercentage: 0,
                      isSellable: true,
                      isSemiFinished: false,
                    });
                    setRecipeComponents([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredient">Ingredienti</SelectItem>
                    <SelectItem value="recipe">Ricette</SelectItem>
                    <SelectItem value="supplier">Fornitori</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Elemento</Label>
                {entitiesLoading ? (
                  <p className="text-sm text-gray-500">Caricamento...</p>
                ) : (
                  <>
                  <div className="mb-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllEntities}
                    >
                      Seleziona Tutto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllEntities}
                    >
                      Deseleziona
                    </Button>
                    {selectedEntities.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleCopySelected}
                      >
                        Copia {selectedEntities.length}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 max-h-96 space-y-1 overflow-y-auto">
                    {entities?.map((entity) => (
                      <div
                        key={entity.name}
                        className="flex items-center gap-2 rounded p-2 hover:bg-gray-100"
                      >
                        <Checkbox
                          checked={selectedEntities.includes(entity.name)}
                          onCheckedChange={() => toggleEntitySelection(entity.name)}
                        />
                        <button
                          onClick={() => handleEntitySelect(entity.name)}
                          className={`flex-1 text-left text-sm transition-colors ${
                            selectedEntity === entity.name
                              ? "font-medium text-blue-900"
                              : ""
                          }`}
                        >
                          <div>{entity.name}</div>
                          <div className="text-xs text-gray-500">
                            {entity.storeCount} store
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna 2: Editor */}
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Modifica</CardTitle>
              <CardDescription>
                {selectedEntity ? `Modifica "${selectedEntity}"` : "Seleziona un elemento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEntity ? (
                <p className="text-center text-gray-500">
                  Seleziona un elemento dalla lista a sinistra
                </p>
              ) : entityLoading ? (
                <p className="text-center text-gray-500">Caricamento...</p>
              ) : (
                <div className="space-y-4">
                  {/* Store Selection */}
                  <div>
                    <Label>Applica modifiche a:</Label>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Tutti
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                      >
                        Nessuno
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {stores?.map((store) => (
                        <div key={store.storeId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`store-${store.storeId}`}
                            checked={selectedStores.includes(store.storeId)}
                            onCheckedChange={() => toggleStore(store.storeId)}
                          />
                          <label
                            htmlFor={`store-${store.storeId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {store.storeName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Fields - Ricette o Generico */}
                  {entityType === 'recipe' ? (
                    <RecipeForm
                      formData={recipeFormData}
                      components={recipeComponents}
                      onFormDataChange={setRecipeFormData}
                      onComponentsChange={setRecipeComponents}
                      showAllFields={true}
                    />
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(formData).map(([key, value]) => {
                        if (key === "name") return null; // Nome non modificabile

                        return (
                          <div key={key}>
                            <Label htmlFor={key} className="capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                            <Input
                              id={key}
                              type={typeof value === "number" ? "number" : "text"}
                              value={value ?? ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [key]:
                                    typeof value === "number"
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value,
                                }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    disabled={selectedStores.length === 0 || updateMutation.isPending}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending
                      ? "Salvataggio..."
                      : `Salva in ${selectedStores.length} store`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna 3: Preview Differenze */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview Multi-Store</CardTitle>
              <CardDescription>Differenze tra store</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEntity ? (
                <p className="text-center text-gray-500">
                  Seleziona un elemento per vedere le differenze
                </p>
              ) : entityLoading ? (
                <p className="text-center text-gray-500">Caricamento...</p>
              ) : (
                <div className="space-y-4">
                  {entityData && entityData.length > 0 ? (
                    <div className="space-y-3">
                      {stores?.map((store) => {
                        const storeEntity = entityData.find(
                          (e: any) => e.storeId === store.storeId
                        );

                        return (
                          <div
                            key={store.storeId}
                            className={`rounded border p-3 ${
                              selectedStores.includes(store.storeId)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium">{store.storeName}</span>
                              {selectedStores.includes(store.storeId) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>

                            {storeEntity ? (
                              <div className="space-y-1 text-xs text-gray-600">
                                {Object.entries(formData).map(([key, value]) => {
                                  const currentValue = (storeEntity as any)[key];
                                  const isDifferent =
                                    JSON.stringify(currentValue) !==
                                    JSON.stringify(value);

                                  return (
                                    <div
                                      key={key}
                                      className={
                                        isDifferent ? "font-medium text-orange-600" : ""
                                      }
                                    >
                                      <span className="capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}:
                                      </span>{" "}
                                      {isDifferent && (
                                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                                      )}
                                      {String(currentValue ?? "N/A")}
                                      {isDifferent && (
                                        <span className="ml-1 text-green-600">
                                          → {String(value)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Non presente in questo store
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">
                      Nessun dato disponibile
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
