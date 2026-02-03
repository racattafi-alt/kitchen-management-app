import { getSemiFinishedById, getIngredientById, getOperations } from "./db";

/**
 * Interfaccia per un componente di ricetta (ingrediente o semilavorato)
 */
interface RecipeComponent {
  type: "INGREDIENT" | "SEMI_FINISHED";
  componentId: string;
  quantity: number; // in grammi
  unit: "u" | "k";
  wastePercentage?: number;
}

/**
 * Interfaccia per un'operazione di produzione
 */
interface ProductionOperation {
  operationId: string;
  hours: number;
}

/**
 * Calcola il costo di una ricetta in modo ricorsivo
 * @param components Array di componenti (ingredienti o semilavorati)
 * @param operations Array di operazioni di produzione
 * @param yieldPercentage Percentuale di resa della ricetta
 * @returns Costo totale per kg
 */
export async function calculateRecipeCost(
  components: RecipeComponent[],
  operations: ProductionOperation[],
  yieldPercentage: number
): Promise<number> {
  let totalCost = 0;

  // 1. Calcola costo dei componenti
  for (const component of components) {
    let componentCost = 0;

    if (component.type === "INGREDIENT") {
      const ingredient = await getIngredientById(component.componentId);
      if (!ingredient) continue;

      // Converti grammi in kg
      const quantityInKg = component.quantity / 1000;
      componentCost = ingredient.pricePerKgOrUnit as unknown as number * quantityInKg;
    } else if (component.type === "SEMI_FINISHED") {
      const semiFinished = await getSemiFinishedById(component.componentId);
      if (!semiFinished) continue;

      const quantityInKg = component.quantity / 1000;
      // Ricorsione: calcola il costo del semilavorato
      const semiFinishedComponents = (semiFinished.components as any) || [];
      const semiFinishedOps = (semiFinished.productionSteps as any) || [];
      const semiFinishedCost = await calculateRecipeCost(
        semiFinishedComponents,
        semiFinishedOps,
        semiFinished.yieldPercentage as unknown as number
      );
      componentCost = semiFinishedCost * quantityInKg;
    }

    // Applica scarto componente se presente
    if (component.wastePercentage && component.wastePercentage > 0) {
      componentCost = componentCost / (1 - component.wastePercentage);
    }

    totalCost += componentCost;
  }

  // 2. Aggiungi costi operativi
  const operationsList = await getOperations();
  for (const op of operations) {
    const operation = operationsList.find((o) => o.id === op.operationId);
    if (operation) {
      totalCost += op.hours * (operation.hourlyRate as unknown as number);
    }
  }

  // 3. Applica resa (yield)
  if (yieldPercentage > 0) {
    return totalCost / yieldPercentage;
  }

  return totalCost;
}

/**
 * Interfaccia per una produzione pianificata
 */
interface PlannedProduction {
  recipeFinalId: string;
  desiredQuantity: number;
  components: RecipeComponent[];
  yieldPercentage: number;
}

/**
 * Aggregazione dei fabbisogni di ingredienti e semilavorati
 * @param productions Array di produzioni pianificate
 * @returns Oggetto con mappe {ingredients, semiFinished}
 */
export async function aggregateProductionRequirements(
  productions: PlannedProduction[]
): Promise<{
  ingredients: Map<string, number>;
  semiFinished: Map<string, number>;
}> {
  const ingredients = new Map<string, number>();
  const semiFinished = new Map<string, number>();

  function extractComponents(
    components: RecipeComponent[],
    multiplier: number
  ): void {
    for (const component of components) {
      const quantityNeeded = (component.quantity / 1000) * multiplier;

      if (component.type === "INGREDIENT") {
        const currentQty = ingredients.get(component.componentId) || 0;
        ingredients.set(component.componentId, currentQty + quantityNeeded);
      } else if (component.type === "SEMI_FINISHED") {
        // NON espandere i semilavorati, trattali come item da acquistare
        const currentQty = semiFinished.get(component.componentId) || 0;
        semiFinished.set(component.componentId, currentQty + quantityNeeded);
      }
    }
  }

  for (const production of productions) {
    const effectiveMultiplier = production.desiredQuantity / production.yieldPercentage;
    extractComponents(production.components, effectiveMultiplier);
  }

  return { ingredients, semiFinished };
}

/**
 * Calcola il food cost di un piatto nel menu
 * @param components Array di componenti del piatto
 * @param salePrice Prezzo di vendita
 * @returns Oggetto con costo totale, food cost % e margine
 */
export async function calculateMenuItemCost(
  components: RecipeComponent[],
  salePrice: number
): Promise<{
  totalCost: number;
  foodCostPercentage: number;
  margin: number;
  marginPercentage: number;
}> {
  let totalCost = 0;

  for (const component of components) {
    let componentCost = 0;

    if (component.type === "INGREDIENT") {
      const ingredient = await getIngredientById(component.componentId);
      if (!ingredient) continue;
      const quantityInKg = component.quantity / 1000;
      componentCost = (ingredient.pricePerKgOrUnit as unknown as number) * quantityInKg;
    } else if (component.type === "SEMI_FINISHED") {
      const semiFinished = await getSemiFinishedById(component.componentId);
      if (!semiFinished) continue;
      const quantityInKg = component.quantity / 1000;
      componentCost = (semiFinished.finalPricePerKg as unknown as number) * quantityInKg;
    }

    // Applica scarto di servizio
    if (component.wastePercentage && component.wastePercentage > 0) {
      componentCost = componentCost / (1 - component.wastePercentage);
    }

    totalCost += componentCost;
  }

  const foodCostPercentage = (totalCost / salePrice) * 100;
  const margin = salePrice - totalCost;
  const marginPercentage = (margin / salePrice) * 100;

  return {
    totalCost,
    foodCostPercentage,
    margin,
    marginPercentage,
  };
}

/**
 * Calcola il food cost di una promozione (combo)
 */
export async function calculatePromotionCost(
  promotionItems: Array<{ menuItemId: string; quantity: number; components: RecipeComponent[] }>,
  promotionPrice: number
): Promise<{
  totalCost: number;
  foodCostPercentage: number;
  margin: number;
  discount: number;
}> {
  let totalCost = 0;

  for (const item of promotionItems) {
    const itemCost = await calculateMenuItemCost(item.components, 0);
    totalCost += itemCost.totalCost * item.quantity;
  }

  const foodCostPercentage = (totalCost / promotionPrice) * 100;
  const margin = promotionPrice - totalCost;

  return {
    totalCost,
    foodCostPercentage,
    margin,
    discount: margin > 0 ? margin : 0,
  };
}
