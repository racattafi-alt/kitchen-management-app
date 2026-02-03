import { drizzle } from 'drizzle-orm/mysql2';
import { ingredients, semiFinishedRecipes, finalRecipes } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

// Carica JSON
const recipesData = JSON.parse(fs.readFileSync('/home/ubuntu/upload/ricette_finali.json', 'utf-8'));

console.log(`📥 Caricamento ${recipesData.length} ricette...`);

// Carica tutti gli ingredienti e semilavorati per il mapping
const allIngredients = await db.select().from(ingredients);
const allSemiFinished = await db.select().from(semiFinishedRecipes);

console.log(`📦 ${allIngredients.length} ingredienti e ${allSemiFinished.length} semilavorati nel database`);

// Crea mappe nome -> ID
const ingredientMap = new Map();
allIngredients.forEach(ing => {
  ingredientMap.set(ing.name.toLowerCase().trim(), ing.id);
});

const semiFinishedMap = new Map();
allSemiFinished.forEach(semi => {
  semiFinishedMap.set(semi.name.toLowerCase().trim(), semi.id);
});

// Processa ogni ricetta
let updated = 0;
let notFound = 0;
const missingComponents = new Set();

for (const recipe of recipesData) {
  console.log(`\n🔄 Processando ${recipe.code}...`);
  
  // Trova la ricetta nel database
  const existingRecipe = await db.select().from(finalRecipes).where(eq(finalRecipes.code, recipe.code)).limit(1);
  
  if (existingRecipe.length === 0) {
    console.log(`  ⚠️  Ricetta ${recipe.code} non trovata nel database, skip`);
    continue;
  }
  
  // Mappa i componenti agli ID
  const mappedComponents = [];
  
  for (const comp of recipe.components) {
    const compNameLower = comp.componentName.toLowerCase().trim();
    
    if (comp.type === 'ingredient') {
      const ingredientId = ingredientMap.get(compNameLower);
      if (ingredientId) {
        mappedComponents.push({
          type: 'ingredient',
          componentId: ingredientId,
          quantity: comp.quantity,
          unit: comp.unit
        });
      } else {
        console.log(`  ❌ Ingrediente non trovato: ${comp.componentName}`);
        missingComponents.add(`ingredient: ${comp.componentName}`);
        notFound++;
      }
    } else if (comp.type === 'semi_finished') {
      const semiId = semiFinishedMap.get(compNameLower);
      if (semiId) {
        mappedComponents.push({
          type: 'semi_finished',
          componentId: semiId,
          quantity: comp.quantity,
          unit: comp.unit
        });
      } else {
        console.log(`  ❌ Semilavorato non trovato: ${comp.componentName}`);
        missingComponents.add(`semi_finished: ${comp.componentName}`);
        notFound++;
      }
    } else if (comp.type === 'operation') {
      // Le operazioni non hanno ID, salviamo direttamente il nome
      mappedComponents.push({
        type: 'operation',
        componentName: comp.componentName,
        quantity: comp.quantity,
        unit: comp.unit
      });
    }
  }
  
  console.log(`  ✅ Mappati ${mappedComponents.length}/${recipe.components.length} componenti`);
  
  // Aggiorna la ricetta nel database
  await db.update(finalRecipes)
    .set({ components: JSON.stringify(mappedComponents) })
    .where(eq(finalRecipes.id, existingRecipe[0].id));
  
  updated++;
}

console.log(`\n\n📊 RIEPILOGO:`);
console.log(`✅ Ricette aggiornate: ${updated}`);
console.log(`❌ Componenti non trovati: ${notFound}`);

if (missingComponents.size > 0) {
  console.log(`\n⚠️  Componenti mancanti nel database:`);
  missingComponents.forEach(comp => console.log(`  - ${comp}`));
}
