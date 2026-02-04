import * as db from "./db";

/**
 * Calcola tutti gli allergeni presenti in una ricetta finale
 * analizzando ricorsivamente tutti i suoi componenti
 */
export async function calculateRecipeAllergens(recipeId: string): Promise<string[]> {
  const allergensSet = new Set<string>();
  
  // Ottieni la ricetta finale
  const recipe = await db.getFinalRecipeById(recipeId);
  if (!recipe) return [];
  
  // Analizza i componenti
  const components = typeof recipe.components === 'string' 
    ? JSON.parse(recipe.components) 
    : recipe.components;
  
  if (!Array.isArray(components)) return [];
  
  for (const component of components) {
    // Se il componente è un ingrediente
    if (component.type === 'ingredient') {
      const ingredient = await db.getIngredientById(component.componentId);
      if (ingredient && ingredient.allergens) {
        const allergensList = typeof ingredient.allergens === 'string'
          ? JSON.parse(ingredient.allergens)
          : ingredient.allergens;
        if (Array.isArray(allergensList)) {
          allergensList.forEach(a => allergensSet.add(a));
        }
      }
    }
    // Se il componente è un semilavorato
    else if (component.type === 'semi_finished') {
      const semiFinished = await db.getSemiFinishedById(component.componentId);
      if (semiFinished && semiFinished.components) {
        const semiComponents = typeof semiFinished.components === 'string'
          ? JSON.parse(semiFinished.components)
          : semiFinished.components;
        
        if (Array.isArray(semiComponents)) {
          for (const semiComp of semiComponents) {
            const ingredient = await db.getIngredientById(semiComp.componentId);
            if (ingredient && ingredient.allergens) {
              const allergensList = typeof ingredient.allergens === 'string'
                ? JSON.parse(ingredient.allergens)
                : ingredient.allergens;
              if (Array.isArray(allergensList)) {
                allergensList.forEach(a => allergensSet.add(a));
              }
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
