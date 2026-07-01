import * as db from "./db";

/**
 * Calcola tutti gli allergeni presenti in una ricetta finale
 * analizzando ricorsivamente tutti i suoi componenti via tabelle relazionali.
 */
export async function calculateRecipeAllergens(recipeId: string): Promise<string[]> {
  const allergensSet = new Set<string>();

  const components = await db.getRecipeComponents(recipeId);

  for (const component of components) {
    if (component.type === "ingredient") {
      const ingredient = await db.getIngredientById(component.componentId);
      if (ingredient && ingredient.allergens) {
        const allergensList =
          typeof ingredient.allergens === "string"
            ? JSON.parse(ingredient.allergens)
            : ingredient.allergens;
        if (Array.isArray(allergensList)) {
          allergensList.forEach((a: string) => allergensSet.add(a));
        }
      }
    } else if (component.type === "semi_finished") {
      // Carica i componenti del semilavorato con una sola JOIN
      const semiComponents = await db.getSemiFinishedComponentsRelational(component.componentId);
      for (const semiComp of semiComponents) {
        if (semiComp.type === "ingredient") {
          const ingredient = await db.getIngredientById(semiComp.componentId);
          if (ingredient && ingredient.allergens) {
            const allergensList =
              typeof ingredient.allergens === "string"
                ? JSON.parse(ingredient.allergens)
                : ingredient.allergens;
            if (Array.isArray(allergensList)) {
              allergensList.forEach((a: string) => allergensSet.add(a));
            }
          }
        }
      }
    }
  }

  return Array.from(allergensSet).sort();
}

/**
 * Calcola allergeni per tutte le ricette finali e restituisce un mapping
 */
export async function calculateAllRecipesAllergens(): Promise<Record<string, string[]>> {
  const recipes = await db.getAllFinalRecipes();
  const result: Record<string, string[]> = {};

  for (const recipe of recipes) {
    result[recipe.id] = await calculateRecipeAllergens(recipe.id);
  }

  return result;
}
