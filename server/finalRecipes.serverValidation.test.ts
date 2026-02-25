import { describe, it, expect } from 'vitest';
import { validateRecipe } from '../shared/recipeValidation';

describe('Server-side Recipe Validation', () => {
  describe('Validazione creazione ricetta', () => {
    it('dovrebbe accettare ricetta valida completa', () => {
      const formData = {
        name: 'Hamburger Classico',
        code: 'HB001',
        category: 'Carne' as const,
        yieldPercentage: 95,
        serviceWastePercentage: 5,
        conservationMethod: 'Refrigerato 0-4°C',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Carne macinata',
          quantity: 0.2,
          unit: 'kg',
          name: 'Carne macinata',
          pricePerUnit: 8.5,
        },
        {
          type: 'ingredient' as const,
          componentId: '2',
          componentName: 'Pane per hamburger',
          quantity: 1,
          unit: 'unità',
          name: 'Pane per hamburger',
          pricePerUnit: 0.5,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(true);
    });

    it('dovrebbe rifiutare ricetta con nome troppo lungo', () => {
      const formData = {
        name: 'A'.repeat(201), // 201 caratteri
        code: 'TEST001',
        category: 'Altro' as const,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Test',
          quantity: 1,
          unit: 'kg',
          name: 'Test',
          pricePerUnit: 1,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('troppo lungo');
    });

    it('dovrebbe rifiutare ricetta con codice troppo lungo', () => {
      const formData = {
        name: 'Test Recipe',
        code: 'A'.repeat(51), // 51 caratteri
        category: 'Altro' as const,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Test',
          quantity: 1,
          unit: 'kg',
          name: 'Test',
          pricePerUnit: 1,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('troppo lungo');
    });

    it('dovrebbe rifiutare ricetta con quantità eccessiva (>1000)', () => {
      const formData = {
        name: 'Test Recipe',
        code: 'TEST001',
        category: 'Altro' as const,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Ingrediente sospetto',
          quantity: 1500, // Quantità eccessiva
          unit: 'kg',
          name: 'Ingrediente sospetto',
          pricePerUnit: 1,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sospetta');
    });

    it('dovrebbe rifiutare ricetta con percentuale resa non valida', () => {
      const formData = {
        name: 'Test Recipe',
        code: 'TEST001',
        category: 'Altro' as const,
        yieldPercentage: 150, // Oltre 100%
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Test',
          quantity: 1,
          unit: 'kg',
          name: 'Test',
          pricePerUnit: 1,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('resa');
    });

    it('dovrebbe rifiutare ricetta con scarto al servizio non valido', () => {
      const formData = {
        name: 'Test Recipe',
        code: 'TEST001',
        category: 'Altro' as const,
        serviceWastePercentage: -5, // Negativo
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Test',
          quantity: 1,
          unit: 'kg',
          name: 'Test',
          pricePerUnit: 1,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('scarto');
    });
  });

  describe('Validazione componenti multipli', () => {
    it('dovrebbe accettare ricetta con ingredienti, semilavorati e operazioni', () => {
      const formData = {
        name: 'Ricetta Complessa',
        code: 'RC001',
        category: 'Altro' as const,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '48 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Pomodoro',
          quantity: 2,
          unit: 'kg',
          name: 'Pomodoro',
          pricePerUnit: 3.5,
        },
        {
          type: 'semi_finished' as const,
          componentId: '2',
          componentName: 'Salsa Base',
          quantity: 1,
          unit: 'kg',
          name: 'Salsa Base',
          pricePerUnit: 8.0,
        },
        {
          type: 'operation' as const,
          componentId: '3',
          componentName: 'Cottura',
          quantity: 2,
          unit: 'ore',
          name: 'Cottura',
          pricePerUnit: 15.0,
          costType: 'direct',
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(true);
    });

    it('dovrebbe rifiutare se anche un solo componente ha quantità non valida', () => {
      const formData = {
        name: 'Test Recipe',
        code: 'TEST001',
        category: 'Altro' as const,
        conservationMethod: 'Refrigerato',
        maxConservationTime: '24 ore',
        isSellable: true,
        isSemiFinished: false,
      };

      const components = [
        {
          type: 'ingredient' as const,
          componentId: '1',
          componentName: 'Ingrediente OK',
          quantity: 1,
          unit: 'kg',
          name: 'Ingrediente OK',
          pricePerUnit: 5,
        },
        {
          type: 'ingredient' as const,
          componentId: '2',
          componentName: 'Ingrediente Errato',
          quantity: 0, // Quantità zero
          unit: 'kg',
          name: 'Ingrediente Errato',
          pricePerUnit: 3,
        },
      ];

      const result = validateRecipe(formData, components);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ingrediente Errato');
    });
  });
});
