import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/trpc';

// Mapping categorie
const categoryMapping = {
  "Additivi": "Additivi",
  "Carni": "Carni",
  "Farine": "Farine",
  "Latticini": "Latticini",
  "Verdura": "Verdura",
  "Spezie": "Spezie",
  "Altro": "Altro",
  "Packaging": "Packaging",
  "Non Food": "Non Food",
  "Bevande": "Bevande",
  "Alcolici": "Alcolici",
};

// Dati ingredienti (primi 20 per test)
const ingredients = [
  { name: "Fumo liquido", qty_g: 1000, price: 32.60, cat: "Additivi", isFood: true },
  { name: "Mono e diglice", qty_g: 1000, price: 22.50, cat: "Additivi", isFood: true },
  { name: "Xantana", qty_g: 1000, price: 27.79, cat: "Additivi", isFood: true },
  { name: "Asiago", qty_g: 1000, price: 7.64, cat: "Latticini", isFood: true },
  { name: "Funghi acularia", qty_g: 1000, price: 18.00, cat: "Altro", isFood: true },
  { name: "Tenders", qty_g: 1000, price: 7.12, cat: "Carni", isFood: true },
  { name: "Costole di maiale", qty_g: 1000, price: 4.99, cat: "Carni", isFood: true },
  { name: "Bacon", qty_g: 1000, price: 10.72, cat: "Carni", isFood: true },
  { name: "Spalla di Maiale (senza osso)", qty_g: 1000, price: 4.99, cat: "Carni", isFood: true },
  { name: "Carne grill", qty_g: 1000, price: 7.33, cat: "Carni", isFood: true },
  { name: "Carne", qty_g: 1000, price: 7.17, cat: "Carni", isFood: true },
  { name: "Ali di pollo", qty_g: 1000, price: 2.61, cat: "Carni", isFood: true },
  { name: "Coscia di pollo", qty_g: 1000, price: 8.20, cat: "Carni", isFood: true },
  { name: "Diaframma (250-300g)", qty_g: 1000, price: 9.01, cat: "Carni", isFood: true },
  { name: "Reale (denver) (250-300g)", qty_g: 1000, price: 14.37, cat: "Carni", isFood: true },
  { name: "Tartare", qty_g: 210, price: 3.20, cat: "Carni", isFood: true },
  { name: "Doppio concentrato", qty_g: 2500, price: 7.81, cat: "Altro", isFood: true },
  { name: "Yogurt greco", qty_g: 1000, price: 4.36, cat: "Altro", isFood: true },
  { name: "Aceto balsamico", qty_g: 1000, price: 2.10, cat: "Altro", isFood: true },
  { name: "Zucchero", qty_g: 1000, price: 0.82, cat: "Altro", isFood: true },
];

console.log('Inizio import ingredienti...\n');

// Prima ottieni la lista ingredienti esistenti
const listResponse = await fetch(`${API_URL}/ingredients.list`);
const listData = await listResponse.json();
const existingIngredients = listData.result.data;

console.log(`Trovati ${existingIngredients.length} ingredienti esistenti nel database\n`);

let updated = 0;
let created = 0;
let skipped = 0;

for (const ing of ingredients) {
  const pkgQty = ing.qty_g / 1000.0;
  const pricePerKg = pkgQty > 0 ? ing.price / pkgQty : 0;
  const category = categoryMapping[ing.cat] || "Altro";
  
  // Cerca ingrediente esistente
  const existing = existingIngredients.find(e => 
    e.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
  );
  
  if (existing) {
    // Verifica se serve aggiornare
    const needsUpdate = (
      Math.abs(parseFloat(existing.packagePrice) - ing.price) > 0.01 ||
      Math.abs(parseFloat(existing.packageQuantity) - pkgQty) > 0.001 ||
      existing.category !== category ||
      existing.isFood !== ing.isFood
    );
    
    if (needsUpdate) {
      try {
        const updateResponse = await fetch(`${API_URL}/ingredients.update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existing.id,
            packagePrice: ing.price.toString(),
            packageQuantity: pkgQty.toString(),
            category: category,
            isFood: ing.isFood
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✓ Aggiornato: ${ing.name} → €${ing.price}/${pkgQty}kg = €${pricePerKg.toFixed(2)}/kg | ${category} | Food=${ing.isFood}`);
          updated++;
        } else {
          console.log(`✗ Errore aggiornamento: ${ing.name}`);
        }
      } catch (error) {
        console.log(`✗ Errore: ${ing.name} - ${error.message}`);
      }
    } else {
      skipped++;
    }
  } else {
    // Crea nuovo
    try {
      const createResponse = await fetch(`${API_URL}/ingredients.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ing.name,
          packagePrice: ing.price.toString(),
          packageQuantity: pkgQty.toString(),
          category: category,
          unit: 'kg',
          isFood: ing.isFood,
          supplier: 'Non specificato',
          contact: '',
          email: '',
          phone: '',
          address: '',
          notes: ''
        })
      });
      
      if (createResponse.ok) {
        console.log(`+ Creato: ${ing.name} → €${ing.price}/${pkgQty}kg = €${pricePerKg.toFixed(2)}/kg | ${category} | Food=${ing.isFood}`);
        created++;
      } else {
        console.log(`✗ Errore creazione: ${ing.name}`);
      }
    } catch (error) {
      console.log(`✗ Errore: ${ing.name} - ${error.message}`);
    }
  }
  
  // Piccola pausa per non sovraccaricare
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log(`\n=== RIEPILOGO ===`);
console.log(`Ingredienti aggiornati: ${updated}`);
console.log(`Ingredienti creati: ${created}`);
console.log(`Ingredienti saltati (già corretti): ${skipped}`);
console.log(`Totale processati: ${ingredients.length}`);
