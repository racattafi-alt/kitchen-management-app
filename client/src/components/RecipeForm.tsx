import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ComponentWithDetails {
  type: 'ingredient' | 'semi_finished' | 'operation';
  componentId: string;
  componentName: string;
  quantity: number;
  unit: string;
  name: string;
  pricePerUnit: number;
  costType?: string;
}

// Funzione helper per validare ricetta completa
export function validateRecipe(formData: RecipeFormData, components: ComponentWithDetails[]): { valid: boolean; error?: string } {
  if (!formData.name || formData.name.trim() === '') {
    return { valid: false, error: 'Il nome della ricetta è obbligatorio' };
  }
  
  if (!formData.code || formData.code.trim() === '') {
    return { valid: false, error: 'Il codice della ricetta è obbligatorio' };
  }
  
  if (components.length === 0) {
    return { valid: false, error: 'Aggiungi almeno un componente alla ricetta' };
  }
  
  // Verifica che tutte le quantità siano valide
  const invalidQuantity = components.find(c => c.quantity <= 0 || isNaN(c.quantity));
  if (invalidQuantity) {
    return { valid: false, error: `Quantità non valida per "${invalidQuantity.name}"` };
  }
  
  if (!formData.conservationMethod || formData.conservationMethod.trim() === '') {
    return { valid: false, error: 'Il metodo di conservazione è obbligatorio' };
  }
  
  if (!formData.maxConservationTime || formData.maxConservationTime.trim() === '') {
    return { valid: false, error: 'Il tempo massimo di conservazione è obbligatorio' };
  }
  
  return { valid: true };
}

export interface RecipeFormData {
  name: string;
  code: string;
  category: string;
  yieldPercentage?: number;
  serviceWastePercentage?: number;
  unitWeight?: number;
  producedQuantity?: number;
  conservationMethod: string;
  maxConservationTime: string;
  isSellable?: boolean;
  isSemiFinished?: boolean;
  measurementType?: string;
  pieceWeight?: number;
}

interface RecipeFormProps {
  formData: RecipeFormData;
  components: ComponentWithDetails[];
  onFormDataChange: (data: RecipeFormData) => void;
  onComponentsChange: (components: ComponentWithDetails[]) => void;
  showAllFields?: boolean; // Se false, mostra solo campi essenziali
}

function RecipeForm({
  formData,
  components,
  onFormDataChange,
  onComponentsChange,
  showAllFields = true,
}: RecipeFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'ingredient' | 'semi_finished' | 'operation'>('ingredient');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Query per ricerca componenti
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: semiFinished } = trpc.semiFinished.list.useQuery();
  const { data: operations } = trpc.operations.list.useQuery();
  const { data: allRecipes } = trpc.finalRecipes.list.useQuery();

  // Filtra componenti in base alla ricerca
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    
    if (searchType === 'ingredient' && ingredients) {
      let filtered = ingredients
        .filter(i => i.name.toLowerCase().includes(term))
        .map(i => ({
          type: 'ingredient' as const,
          id: i.id,
          name: i.name,
          unit: i.unitType === 'u' ? 'unità' : 'kg',
          pricePerUnit: parseFloat(i.pricePerKgOrUnit || '0'),
          category: i.category || 'Altro',
        }));
      
      // Applica filtro categoria
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(i => i.category === categoryFilter);
      }
      
      // Applica ordinamento
      if (sortBy === 'price') {
        filtered.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return filtered.slice(0, 10); // Aumentato limite a 10
    }
    
    if (searchType === 'semi_finished') {
      const semiFromTable = (semiFinished || [])
        .filter(s => s.name.toLowerCase().includes(term))
        .map(s => ({
          type: 'semi_finished' as const,
          id: s.id,
          name: s.name,
          unit: 'kg',
          pricePerUnit: parseFloat(s.finalPricePerKg || '0'),
        }));
      
      const semiFromRecipes = (allRecipes || [])
        .filter(r => !!r.isSemiFinished && r.name.toLowerCase().includes(term))
        .map(r => ({
          type: 'semi_finished' as const,
          id: r.id,
          name: r.name,
          unit: 'kg',
          pricePerUnit: parseFloat(r.totalCost || '0'),
        }));
      
      let combined = [...semiFromTable, ...semiFromRecipes];
      
      // Applica ordinamento
      if (sortBy === 'price') {
        combined.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      } else {
        combined.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return combined.slice(0, 10);
    }
    
    if (searchType === 'operation' && operations) {
      let filtered = operations
        .filter(o => o.name.toLowerCase().includes(term))
        .map(o => ({
          type: 'operation' as const,
          id: o.id,
          name: o.name,
          unit: 'ore',
          pricePerUnit: parseFloat(o.hourlyRate || '0'),
          costType: o.costType,
        }));
      
      // Applica ordinamento
      if (sortBy === 'price') {
        filtered.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return filtered.slice(0, 10);
    }
    
    return [];
  }, [searchTerm, searchType, ingredients, semiFinished, operations, allRecipes, sortBy, categoryFilter]);

  const calculateTotalCost = () => {
    return components.reduce((sum, comp) => {
      const quantity = parseFloat(String(comp.quantity)) || 0;
      const price = parseFloat(String(comp.pricePerUnit)) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const handleAddComponent = (comp: any) => {
    // Validazione: controlla se il componente è già presente
    const isDuplicate = components.some(
      (existing) => existing.componentId === comp.id && existing.type === comp.type
    );
    
    if (isDuplicate) {
      toast.error(`"${comp.name}" è già presente nei componenti`);
      return;
    }
    
    const newComponent: ComponentWithDetails = {
      type: comp.type,
      componentId: comp.id,
      componentName: comp.name,
      quantity: 1,
      unit: comp.unit,
      name: comp.name,
      pricePerUnit: comp.pricePerUnit,
      costType: comp.costType,
    };
    onComponentsChange([...components, newComponent]);
    setSearchTerm("");
    toast.success(`"${comp.name}" aggiunto con successo`);
  };

  const handleRemoveComponent = (index: number) => {
    onComponentsChange(components.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    // Validazione: quantità deve essere > 0
    if (quantity <= 0 || isNaN(quantity)) {
      toast.error('La quantità deve essere maggiore di zero');
      return;
    }
    
    // Warning per quantità elevate
    if (quantity > 100) {
      toast.warning('Quantità elevata (>100kg) - verifica che sia corretta');
    }
    
    const updated = [...components];
    updated[index] = { ...updated[index], quantity };
    onComponentsChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Informazioni Base */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-name">Nome Ricetta *</Label>
          <Input
            id="recipe-name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            placeholder="es. Pulled Pork Burger"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipe-code">Codice *</Label>
          <Input
            id="recipe-code"
            value={formData.code}
            onChange={(e) => onFormDataChange({ ...formData, code: e.target.value })}
            placeholder="es. CARNE_PULLED_PORK"
          />
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label htmlFor="recipe-category">Categoria</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => onFormDataChange({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pane">Pane</SelectItem>
            <SelectItem value="Carne">Carne</SelectItem>
            <SelectItem value="Salse">Salse</SelectItem>
            <SelectItem value="Verdure">Verdure</SelectItem>
            <SelectItem value="Formaggi">Formaggi</SelectItem>
            <SelectItem value="Altro">Altro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Peso Finale e Quantità */}
      {showAllFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-weight">Peso Finale Prodotto (kg)</Label>
            <Input
              id="recipe-weight"
              type="number"
              step="0.01"
              value={formData.unitWeight || ''}
              onChange={(e) => onFormDataChange({ ...formData, unitWeight: parseFloat(e.target.value) || 0 })}
              placeholder="Peso sperimentale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipe-quantity">Quantità Prodotta (opzionale)</Label>
            <Input
              id="recipe-quantity"
              type="number"
              step="0.01"
              value={formData.producedQuantity || ''}
              onChange={(e) => onFormDataChange({ ...formData, producedQuantity: parseFloat(e.target.value) || 0 })}
              placeholder="Unità prodotte"
            />
          </div>
        </div>
      )}

      {/* Scarto al Servizio */}
      {showAllFields && (
        <div className="space-y-2">
          <Label htmlFor="recipe-waste">Scarto al Servizio (%)</Label>
          <Input
            id="recipe-waste"
            type="number"
            step="0.01"
            value={formData.serviceWastePercentage || 0}
            onChange={(e) => onFormDataChange({ ...formData, serviceWastePercentage: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )}

      {/* Conservazione */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-conservation">Metodo Conservazione *</Label>
          <Input
            id="recipe-conservation"
            value={formData.conservationMethod}
            onChange={(e) => onFormDataChange({ ...formData, conservationMethod: e.target.value })}
            placeholder="es. Refrigerato, Congelato"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipe-maxtime">Tempo Max Conservazione *</Label>
          <Input
            id="recipe-maxtime"
            value={formData.maxConservationTime}
            onChange={(e) => onFormDataChange({ ...formData, maxConservationTime: e.target.value })}
            placeholder="es. 48 ore, 3 giorni"
          />
        </div>
      </div>

      {/* Flags Vendibile e Semilavorato */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="recipe-sellable"
            checked={formData.isSellable ?? true}
            onChange={(e) => onFormDataChange({ ...formData, isSellable: e.target.checked })}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <Label htmlFor="recipe-sellable" className="cursor-pointer">
            Vendibile (apparirà in Food Matrix)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="recipe-semifinished"
            checked={formData.isSemiFinished ?? false}
            onChange={(e) => onFormDataChange({ ...formData, isSemiFinished: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <Label htmlFor="recipe-semifinished" className="cursor-pointer">
            Semilavorato (usabile in altre ricette)
          </Label>
        </div>
      </div>

      {/* Gestione Componenti */}
      <div className="space-y-4 bg-slate-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xl">Componenti</h3>
          <div className="text-base text-slate-700 bg-white px-4 py-2 rounded-lg border-2 border-green-500">
            Costo totale: <span className="font-bold text-green-600 text-lg">€ {calculateTotalCost().toFixed(2)}</span>
          </div>
        </div>

        {/* Lista componenti */}
        {components.length > 0 ? (
          <div className="border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Nome</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Tipo</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-700">Quantità</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Unità</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-700">Prezzo/Unità</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-700">Costo</th>
                  <th className="text-center p-3 text-sm font-medium text-slate-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {components.map((comp, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{comp.name}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        comp.type === 'ingredient' 
                          ? 'bg-blue-100 text-blue-700' 
                          : comp.type === 'operation'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {comp.type === 'ingredient' ? 'Ingrediente' : comp.type === 'operation' ? 'Operazione' : 'Semilavorato'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={comp.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val <= 0 || isNaN(val)) {
                            toast.error('La quantità deve essere maggiore di zero');
                            return;
                          }
                          if (val > 100) {
                            toast.warning('Quantità elevata (>100kg) - verifica che sia corretta');
                          }
                          handleUpdateQuantity(idx, val);
                        }}
                        className="w-24 text-right"
                      />
                    </td>
                    <td className="p-3 text-slate-600">{comp.unit || 'kg'}</td>
                    <td className="p-3 text-right">€ {comp.pricePerUnit.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">
                      € {(comp.quantity * comp.pricePerUnit).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveComponent(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 border rounded-lg">
            <p>Nessun componente aggiunto. Usa la ricerca qui sotto per aggiungerne.</p>
          </div>
        )}

        {/* Ricerca e aggiunta componenti */}
        <div className="space-y-3 p-5 bg-white border-2 border-dashed border-slate-300 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Aggiungi Componente</Label>
            {searchTerm && filteredComponents.length > 0 && (
              <span className="text-sm text-slate-600">
                {filteredComponents.length} risultat{filteredComponents.length === 1 ? 'o' : 'i'}
              </span>
            )}
          </div>
          
          {/* Filtri e Ordinamento */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="price">Prezzo ↑</SelectItem>
              </SelectContent>
            </Select>
            
            {searchType === 'ingredient' && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="Verdure">Verdure</SelectItem>
                  <SelectItem value="Carne">Carne</SelectItem>
                  <SelectItem value="Formaggi">Formaggi</SelectItem>
                  <SelectItem value="Salse">Salse</SelectItem>
                  <SelectItem value="Pane">Pane</SelectItem>
                  <SelectItem value="Altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex gap-3">
            <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingredient">Ingrediente</SelectItem>
                <SelectItem value="semi_finished">Semilavorato</SelectItem>
                <SelectItem value="operation">Operazione</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cerca per nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Risultati ricerca */}
          {searchTerm && filteredComponents.length > 0 && (
            <div className="border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
              {filteredComponents.map((comp: any) => (
                <div
                  key={comp.id}
                  className="p-3 hover:bg-green-50 cursor-pointer flex items-center justify-between transition-colors group"
                  onClick={() => handleAddComponent(comp)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-sm text-slate-500">
                      {comp.unit} - € {comp.pricePerUnit.toFixed(2)}/{comp.unit}
                    </p>
                    {comp.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                        {comp.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-slate-500">Costo iniziale</p>
                      <p className="text-sm font-medium text-green-600">€ {(1 * comp.pricePerUnit).toFixed(2)}</p>
                    </div>
                    <Plus className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeForm;
