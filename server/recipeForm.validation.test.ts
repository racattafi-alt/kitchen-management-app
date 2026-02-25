import { describe, it, expect } from 'vitest';
import { validateRecipe, RecipeFormData, ComponentWithDetails } from '../client/src/components/RecipeForm';

describe('RecipeForm Validation', () => {
  const validFormData: RecipeFormData = {
    name: 'Test Recipe',
    code: 'TR001',
    category: 'Altro',
    conservationMethod: 'Refrigerato',
    maxConservationTime: '48 ore',
    yieldPercentage: 100,
    serviceWastePercentage: 0,
    isSellable: true,
    isSemiFinished: false,
  };

  const validComponents: ComponentWithDetails[] = [
    {
      type: 'ingredient',
      componentId: '1',
      componentName: 'Pomodoro',
      quantity: 2,
      unit: 'kg',
      name: 'Pomodoro',
      pricePerUnit: 3.5,
    },
  ];

  it('dovrebbe validare una ricetta completa e corretta', () => {
    const result = validateRecipe(validFormData, validComponents);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('dovrebbe rifiutare ricetta senza nome', () => {
    const invalidData = { ...validFormData, name: '' };
    const result = validateRecipe(invalidData, validComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('nome');
  });

  it('dovrebbe rifiutare ricetta senza codice', () => {
    const invalidData = { ...validFormData, code: '' };
    const result = validateRecipe(invalidData, validComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('codice');
  });

  it('dovrebbe rifiutare ricetta senza componenti', () => {
    const result = validateRecipe(validFormData, []);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('componente');
  });

  it('dovrebbe rifiutare ricetta con quantità negativa', () => {
    const invalidComponents: ComponentWithDetails[] = [
      {
        type: 'ingredient',
        componentId: '1',
        componentName: 'Pomodoro',
        quantity: -1,
        unit: 'kg',
        name: 'Pomodoro',
        pricePerUnit: 3.5,
      },
    ];
    const result = validateRecipe(validFormData, invalidComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Quantità non valida');
  });

  it('dovrebbe rifiutare ricetta con quantità zero', () => {
    const invalidComponents: ComponentWithDetails[] = [
      {
        type: 'ingredient',
        componentId: '1',
        componentName: 'Pomodoro',
        quantity: 0,
        unit: 'kg',
        name: 'Pomodoro',
        pricePerUnit: 3.5,
      },
    ];
    const result = validateRecipe(validFormData, invalidComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Quantità non valida');
  });

  it('dovrebbe rifiutare ricetta senza metodo conservazione', () => {
    const invalidData = { ...validFormData, conservationMethod: '' };
    const result = validateRecipe(invalidData, validComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('conservazione');
  });

  it('dovrebbe rifiutare ricetta senza tempo massimo conservazione', () => {
    const invalidData = { ...validFormData, maxConservationTime: '' };
    const result = validateRecipe(invalidData, validComponents);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tempo massimo');
  });

  it('dovrebbe accettare ricetta con più componenti validi', () => {
    const multipleComponents: ComponentWithDetails[] = [
      {
        type: 'ingredient',
        componentId: '1',
        componentName: 'Pomodoro',
        quantity: 2,
        unit: 'kg',
        name: 'Pomodoro',
        pricePerUnit: 3.5,
      },
      {
        type: 'semi_finished',
        componentId: '2',
        componentName: 'Salsa Base',
        quantity: 1.5,
        unit: 'kg',
        name: 'Salsa Base',
        pricePerUnit: 8.0,
      },
      {
        type: 'operation',
        componentId: '3',
        componentName: 'Cottura',
        quantity: 2,
        unit: 'ore',
        name: 'Cottura',
        pricePerUnit: 15.0,
      },
    ];
    const result = validateRecipe(validFormData, multipleComponents);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
