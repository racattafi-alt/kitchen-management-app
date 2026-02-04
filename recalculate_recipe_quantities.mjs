import mysql from 'mysql2/promise';

// Connessione database
const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔄 Ricalcolo quantità finale ricette...\n');

// Recupera tutte le ricette (finali e semilavorati)
const [finalRecipes] = await connection.query('SELECT * FROM final_recipes');
const [semiFinished] = await connection.query('SELECT * FROM semi_finished_recipes');
const [ingredients] = await connection.query('SELECT id, name, is_food FROM ingredients');

// Mappa ingredienti per ID
const ingredientsMap = new Map();
ingredients.forEach(ing => {
  ingredientsMap.set(ing.id, ing);
});

let updated = 0;
let errors = 0;

// Funzione per calcolare quantità food
function calculateFoodQuantity(components) {
  if (!components || !Array.isArray(components)) return null;
  
  let totalFood = 0;
  for (const comp of components) {
    const ingredient = ingredientsMap.get(comp.ingredientId || comp.ingredient_id);
    if (ingredient && ingredient.is_food === 1) {
      totalFood += parseFloat(comp.quantity || 0);
    }
  }
  return totalFood > 0 ? totalFood : null;
}

// Aggiorna ricette finali
console.log('📋 Ricette finali:');
for (const recipe of finalRecipes) {
  try {
    const components = typeof recipe.components === 'string' 
      ? JSON.parse(recipe.components) 
      : recipe.components;
    
    const newQuantity = calculateFoodQuantity(components);
    
    if (newQuantity !== null && newQuantity !== parseFloat(recipe.producedQuantity)) {
      await connection.query(
        'UPDATE final_recipes SET producedQuantity = ? WHERE id = ?',
        [newQuantity, recipe.id]
      );
      console.log(`✅ ${recipe.name}: ${recipe.producedQuantity} → ${newQuantity.toFixed(3)} kg`);
      updated++;
    }
  } catch (error) {
    console.error(`❌ Errore ${recipe.name}:`, error.message);
    errors++;
  }
}

// Aggiorna semilavorati
console.log('\n🥘 Semilavorati:');
for (const recipe of semiFinished) {
  try {
    const components = typeof recipe.components === 'string' 
      ? JSON.parse(recipe.components) 
      : recipe.components;
    
    const newQuantity = calculateFoodQuantity(components);
    
    if (newQuantity !== null && newQuantity !== parseFloat(recipe.totalQuantityProduced)) {
      await connection.query(
        'UPDATE semi_finished_recipes SET totalQuantityProduced = ? WHERE id = ?',
        [newQuantity, recipe.id]
      );
      console.log(`✅ ${recipe.name}: ${recipe.totalQuantityProduced} → ${newQuantity.toFixed(3)} kg`);
      updated++;
    }
  } catch (error) {
    console.error(`❌ Errore ${recipe.name}:`, error.message);
    errors++;
  }
}

console.log(`\n✨ Completato: ${updated} ricette aggiornate, ${errors} errori`);
await connection.end();
