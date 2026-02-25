/**
 * Modulo condiviso per validazione ricette
 * Usabile sia dal client (RecipeForm) che dal server (tRPC routers)
 */

export interface RecipeFormData {
  name: string;
  code: string;
  category: string;
  yieldPercentage?: number;
  serviceWastePercentage?: number;
  conservationMethod: string;
  maxConservationTime: string;
  isSellable: boolean;
  isSemiFinished: boolean;
}

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

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida una ricetta completa prima del salvataggio
 * @param formData - Dati del form ricetta
 * @param components - Lista componenti della ricetta
 * @returns Risultato validazione con eventuale messaggio di errore
 */
export function validateRecipe(
  formData: RecipeFormData,
  components: ComponentWithDetails[]
): ValidationResult {
  // Validazione nome
  if (!formData.name || formData.name.trim() === '') {
    return { valid: false, error: 'Il nome della ricetta è obbligatorio' };
  }
  
  if (formData.name.length > 200) {
    return { valid: false, error: 'Il nome della ricetta è troppo lungo (max 200 caratteri)' };
  }
  
  // Validazione codice
  if (!formData.code || formData.code.trim() === '') {
    return { valid: false, error: 'Il codice della ricetta è obbligatorio' };
  }
  
  if (formData.code.length > 50) {
    return { valid: false, error: 'Il codice della ricetta è troppo lungo (max 50 caratteri)' };
  }
  
  // Validazione componenti
  if (components.length === 0) {
    return { valid: false, error: 'Aggiungi almeno un componente alla ricetta' };
  }
  
  // Verifica che tutte le quantità siano valide
  const invalidQuantity = components.find(c => c.quantity <= 0 || isNaN(c.quantity));
  if (invalidQuantity) {
    return { 
      valid: false, 
      error: `Quantità non valida per "${invalidQuantity.name}": deve essere maggiore di zero` 
    };
  }
  
  // Verifica quantità ragionevoli (warning per valori molto alti)
  const veryHighQuantity = components.find(c => c.quantity > 1000);
  if (veryHighQuantity) {
    return { 
      valid: false, 
      error: `Quantità sospetta per "${veryHighQuantity.name}": ${veryHighQuantity.quantity} ${veryHighQuantity.unit} sembra eccessiva` 
    };
  }
  
  // Validazione conservazione
  if (!formData.conservationMethod || formData.conservationMethod.trim() === '') {
    return { valid: false, error: 'Il metodo di conservazione è obbligatorio' };
  }
  
  if (!formData.maxConservationTime || formData.maxConservationTime.trim() === '') {
    return { valid: false, error: 'Il tempo massimo di conservazione è obbligatorio' };
  }
  
  // Validazione percentuali
  if (formData.yieldPercentage !== undefined && (formData.yieldPercentage < 0 || formData.yieldPercentage > 100)) {
    return { valid: false, error: 'La resa percentuale deve essere tra 0 e 100' };
  }
  
  if (formData.serviceWastePercentage !== undefined && (formData.serviceWastePercentage < 0 || formData.serviceWastePercentage > 100)) {
    return { valid: false, error: 'Lo scarto al servizio deve essere tra 0 e 100' };
  }
  
  // Validazione categoria
  if (!formData.category || formData.category.trim() === '') {
    return { valid: false, error: 'La categoria è obbligatoria' };
  }
  
  // Tutto ok
  return { valid: true };
}

/**
 * Verifica se un componente è duplicato nella lista
 * @param components - Lista componenti esistenti
 * @param newComponent - Nuovo componente da aggiungere
 * @returns true se il componente è già presente
 */
export function isDuplicateComponent(
  components: ComponentWithDetails[],
  newComponent: { type: string; componentId: string }
): boolean {
  return components.some(
    c => c.type === newComponent.type && c.componentId === newComponent.componentId
  );
}
