import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, AlertTriangle, Check } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import RecipeForm, { RecipeFormData, ComponentWithDetails } from "@/components/RecipeForm";

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
