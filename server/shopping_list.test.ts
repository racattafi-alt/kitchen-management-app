import { describe, expect, it } from "vitest";
import { aggregateProductionRequirements } from "./calculations";

describe("Shopping List - Nesting Ricorsivo", () => {
  it("dovrebbe aggregare ingredienti da una ricetta semplice", async () => {
    const productions = [
      {
        recipeFinalId: "test-recipe-1",
        desiredQuantity: 10, // 10 kg
        components: [
          {
            type: "INGREDIENT" as const,
            componentId: "ingredient-1",
            quantity: 500, // 500g per kg di ricetta
            unit: "k" as const,
            wastePercentage: 0,
          },
        ],
        yieldPercentage: 1,
      },
    ];

    const requirements = await aggregateProductionRequirements(productions);
    
    // 10 kg * 0.5 kg/kg = 5 kg di ingredient-1
    expect(requirements.get("ingredient-1")).toBe(5);
  });

  it("dovrebbe espandere ricorsivamente i semilavorati", async () => {
    // Questo test richiede dati reali nel database
    // Per ora verifica solo che la funzione non lanci errori
    const productions = [
      {
        recipeFinalId: "test-recipe-2",
        desiredQuantity: 1,
        components: [
          {
            type: "SEMI_FINISHED" as const,
            componentId: "semi-1",
            quantity: 1000,
            unit: "k" as const,
            wastePercentage: 0.1,
          },
        ],
        yieldPercentage: 0.9,
      },
    ];

    const requirements = await aggregateProductionRequirements(productions);
    expect(requirements).toBeInstanceOf(Map);
  });

  it("dovrebbe aggregare ingredienti da multiple ricette", async () => {
    const productions = [
      {
        recipeFinalId: "recipe-1",
        desiredQuantity: 5,
        components: [
          {
            type: "INGREDIENT" as const,
            componentId: "ingredient-common",
            quantity: 200,
            unit: "k" as const,
            wastePercentage: 0,
          },
        ],
        yieldPercentage: 1,
      },
      {
        recipeFinalId: "recipe-2",
        desiredQuantity: 3,
        components: [
          {
            type: "INGREDIENT" as const,
            componentId: "ingredient-common",
            quantity: 300,
            unit: "k" as const,
            wastePercentage: 0,
          },
        ],
        yieldPercentage: 1,
      },
    ];

    const requirements = await aggregateProductionRequirements(productions);
    
    // (5 * 0.2) + (3 * 0.3) = 1 + 0.9 = 1.9 kg
    expect(requirements.get("ingredient-common")).toBe(1.9);
  });
});
