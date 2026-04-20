/**
 * seed_ingredients.mjs
 *
 * Importa tutti gli ingredienti dal catalogo MENUUNION2026 nel database.
 * Chiama l'API dell'app (tRPC) con autenticazione cookie.
 *
 * Uso:
 *   API_URL=https://tua-app.railway.app \
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD=tua_password \
 *   node seed_ingredients.mjs
 *
 * Se l'app gira in locale:
 *   API_URL=http://localhost:5000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node seed_ingredients.mjs
 */

import { randomUUID } from "crypto";

const API_URL = process.env.API_URL || "http://localhost:5000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Imposta ADMIN_EMAIL e ADMIN_PASSWORD come variabili d'ambiente");
  process.exit(1);
}

// ─── TUTTI GLI INGREDIENTI DAL PDF MENUUNION2026 ───────────────────────────
// Formato: [nome, qtyGrammi, prezzoConfezione, categoria, isFood]
const INGREDIENTS = [
  // Additivi
  ["Fumo liquido", 1000, 32.60, "Additivi", true],
  ["Mono e diglice", 1000, 22.50, "Additivi", true],
  ["Xantana", 1000, 27.79, "Additivi", true],
  ["CL soffice", 10000, 6.03, "Additivi", true],
  ["Lievito olentic", 1000, 8.82, "Additivi", true],
  ["Sapore carmen", 1000, 7.42, "Additivi", true],
  ["Softgrain", 5000, 36.35, "Additivi", true],
  ["Malto diastasico", 1000, 4.20, "Additivi", true],
  // Carni
  ["Tenders", 1000, 7.12, "Carni", true],
  ["Costole di maiale", 1000, 4.99, "Carni", true],
  ["Bacon", 1000, 10.72, "Carni", true],
  ["Spalla di Maiale (senza osso)", 1000, 4.99, "Carni", true],
  ["Carne grill", 1000, 7.33, "Carni", true],
  ["Carne", 1000, 7.17, "Carni", true],
  ["Ali di pollo", 1000, 2.61, "Carni", true],
  ["Coscia di pollo", 1000, 8.20, "Carni", true],
  ["Diaframma (250-300g)", 1000, 9.01, "Carni", true],
  ["Reale (denver) (250-300g)", 1000, 14.37, "Carni", true],
  ["Tartare", 210, 3.20, "Carni", true],
  ["Lardo", 1000, 10.97, "Carni", true],
  ["Nduja", 400, 10.79, "Carni", true],
  // Latticini
  ["Asiago", 1000, 7.64, "Latticini", true],
  ["Mascarpone", 2000, 6.78, "Latticini", true],
  ["Cheddar", 1000, 7.63, "Latticini", true],
  ["Stracciatella", 1000, 9.89, "Latticini", true],
  ["Gorgonzola", 1000, 9.29, "Latticini", true],
  ["Misto uovo", 1000, 4.37, "Latticini", true],
  // Farine
  ["Farina", 25000, 29.25, "Farine", true],
  ["Farina per fritti", 25000, 31.50, "Farine", true],
  ["Easy Snack CL", 15000, 89.42, "Farine", true],
  ["Fiocchi di patate", 4000, 14.89, "Farine", true],
  ["Farina UNIQUA Viola", 5000, 12.00, "Farine", true],
  ["Farina PAN", 1000, 2.20, "Farine", true],
  // Spezie
  ["Semi di papavero", 1000, 8.45, "Spezie", true],
  ["Pepe", 1000, 17.32, "Spezie", true],
  ["Aglio in polvere", 1000, 6.50, "Spezie", true],
  ["Asafetida", 10, 5.78, "Spezie", true],
  ["Cannella", 250, 15.08, "Spezie", true],
  ["Chile pasilla in polvere", 1000, 22.00, "Spezie", true],
  ["Coriandolo in polvere", 1000, 17.70, "Spezie", true],
  ["Cumino", 1000, 19.90, "Spezie", true],
  ["Curcuma", 1000, 19.80, "Spezie", true],
  ["Fava tonka", 15, 4.45, "Spezie", true],
  ["Galangal", 1000, 31.40, "Spezie", true],
  ["Nigella", 1000, 20.37, "Spezie", true],
  ["Paprica affumicata", 1000, 26.90, "Spezie", true],
  ["Paprica dolce", 1000, 26.90, "Spezie", true],
  ["Pasta di vaniglia", 100, 23.36, "Spezie", true],
  ["Pepe bianco", 1000, 20.00, "Spezie", true],
  ["Rabarbaro", 250, 17.75, "Spezie", true],
  ["Pepe di sichuan", 1000, 57.70, "Spezie", true],
  ["Radice di angelica", 250, 18.59, "Spezie", true],
  ["Semi di fieno greco", 1000, 15.65, "Spezie", true],
  ["Sumac", 1000, 28.00, "Spezie", true],
  ["Thè affumicato", 250, 20.90, "Spezie", true],
  ["Semi di senape", 1000, 17.45, "Spezie", true],
  ["Senape in polvere", 1000, 16.70, "Spezie", true],
  // Verdura
  ["Peperoni", 1000, 2.98, "Verdura", true],
  ["Aglio pelato", 1000, 5.98, "Verdura", true],
  ["Cetriolini salamoia", 400, 2.50, "Verdura", true],
  ["Carote", 1000, 1.23, "Verdura", true],
  ["Melanzane", 1000, 2.15, "Verdura", true],
  ["Rucola", 100, 1.08, "Verdura", true],
  ["Cavolo viola", 1000, 1.33, "Verdura", true],
  ["Cetrioli", 1000, 1.64, "Verdura", true],
  ["Cipolla viola", 1000, 1.53, "Verdura", true],
  ["Limone", 1000, 2.05, "Verdura", true],
  ["Pomodoro", 1000, 2.46, "Verdura", true],
  ["Pomodori secchi", 1700, 8.48, "Verdura", true],
  ["Coriandolo", 500, 14.28, "Verdura", true],
  ["Lime", 1000, 3.39, "Verdura", true],
  ["Cipolla", 1000, 1.50, "Verdura", true],
  ["Insalata", 1000, 1.50, "Verdura", true],
  ["Cavolo cappuccio", 1000, 1.50, "Verdura", true],
  // Altro (food)
  ["Funghi acularia", 1000, 18.00, "Altro", true],
  ["Doppio concentrato", 2500, 7.81, "Altro", true],
  ["Yogurt greco", 1000, 4.36, "Altro", true],
  ["Aceto balsamico", 1000, 2.10, "Altro", true],
  ["Zucchero", 1000, 0.82, "Altro", true],
  ["Beyond vegan Nuggets", 4000, 77.25, "Altro", true],
  ["UMA.MI Minced Vegana", 15000, 185.98, "Altro", true],
  ["Burro professional e", 10000, 100.60, "Altro", true],
  ["Margarina", 1000, 4.78, "Altro", true],
  ["Zucchero invertito", 10000, 20.00, "Altro", true],
  ["Amido pregelatinizzato", 1000, 6.50, "Altro", true],
  ["Tuorlo in polvere", 20000, 345.00, "Altro", true],
  ["Roggena", 10000, 39.00, "Altro", true],
  ['"Nutella"', 13000, 67.28, "Altro", true],
  ["Amido di mais", 10000, 20.20, "Altro", true],
  ["Erbette surgelate", 1000, 5.33, "Altro", true],
  ["Batatine (sweet potato fries 9x9)", 10000, 40.73, "Altro", true],
  ["Onion rings", 1000, 34.03, "Altro", true],
  ["Patatine Really crunchy 6x6", 10000, 20.87, "Altro", true],
  ["Pasta di avocado", 1000, 0.00, "Altro", true],
  ["Latte UHT", 1000, 1.07, "Altro", true],
  ["Olio di semi", 1000, 1.58, "Altro", true],
  ["Sriracha", 475, 3.79, "Altro", true],
  ["Uova", 90, 21.76, "Altro", true],
  ["Zucchero a velo", 1000, 0.00, "Altro", true],
  ["Olio EVO", 500, 11.32, "Altro", true],
  ["Aceto di alcool", 1000, 0.00, "Altro", true],
  ["Aceto di mele", 3000, 7.07, "Altro", true],
  ["Arachidi", 1000, 4.93, "Altro", true],
  ["Misto frutti di bosco", 1000, 6.62, "Altro", true],
  ["Panna UHT", 1000, 6.95, "Altro", true],
  ["Pasta di zucca", 1000, 4.39, "Altro", true],
  ["Sale", 12000, 3.55, "Altro", true],
  ["Sale grosso", 12000, 3.68, "Altro", true],
  ["Salsa di Soja", 1900, 9.41, "Altro", true],
  ["Latte di soja", 1000, 0.00, "Altro", true],
  ["Fondo bruno vegano", 1000, 20.53, "Altro", true],
  ["Funghi sbrise", 1000, 6.64, "Altro", true],
  ["Tuorlo d'uovo special", 1000, 9.49, "Altro", true],
  ["Funghi shitake", 100, 0.00, "Altro", true],
  ["Fiocchi di sale", 500, 5.01, "Altro", true],
  ["Onion flakes", 1000, 6.73, "Altro", true],
  ["Senape", 875, 2.63, "Altro", true],
  ["Olio di sesamo", 1650, 21.29, "Altro", true],
  ["Fiocchi di pomodoro", 170, 8.39, "Altro", true],
  // Bevande
  ["Acqua", 1000, 0.00, "Bevande", true],
  // Alcolici
  ["Vino bianco", 750, 5.00, "Alcolici", true],
  // Packaging / Non Food
  ["Spiedini 20cm", 1000, 17.37, "Packaging", false],
  ["Carta paglia", 10000, 13.30, "Packaging", false],
  ["Pellicola", 300, 5.26, "Packaging", false],
  ["Contenitori PLA (80ml) (50pz)", 50, 14.38, "Packaging", false],
  ["Rotoli Scontrini 57mm pos", 100, 19.60, "Packaging", false],
  ["Rotoli Scontrini 57mm", 50, 16.41, "Packaging", false],
  ["Rotoli Scontrini 80mm", 30, 31.82, "Packaging", false],
  ["Tovaglioli (33x33)", 4000, 19.60, "Packaging", false],
  ["Alluminio", 125, 6.94, "Packaging", false],
  ["Carta forno 60x40", 1000, 24.50, "Packaging", false],
  ["Guanti da cucina", 100, 3.89, "Packaging", false],
  ["Sacchetti antifog", 1000, 39.75, "Packaging", false],
  ["Sacchi 70x110", 400, 34.03, "Packaging", false],
  ["Sacchi 50x120", 400, 0.00, "Packaging", false],
  ["Carta paglia tagliata", 10000, 13.30, "Packaging", false],
  ["Scatole fritti", 100, 26.50, "Packaging", false],
  ["Tovaglioli tavolo", 1200, 118.56, "Packaging", false],
  ["Contenitori PLA (250ml)", 600, 22.49, "Packaging", false],
  ["Shopper Bio", 500, 21.24, "Packaging", false],
  ["Busta sv 30x40", 100, 12.73, "Packaging", false],
  ["Busta sv 20x30", 100, 9.30, "Packaging", false],
  ["Scottex (2 rotoli)", 2, 12.29, "Packaging", false],
  ["Detersivo pavimenti", 5000, 37.00, "Non Food", false],
  ["Panno microfibra", 1, 0.70, "Non Food", false],
  ["Sapone lavapiatti", 5000, 8.57, "Non Food", false],
  ["Spugne", 5, 3.29, "Non Food", false],
];

// ─── HELPERS ───────────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login fallito (${res.status}): ${body}`);
  }
  // Estrai cookie di sessione
  const setCookie = res.headers.get("set-cookie") || "";
  const sessionCookie = setCookie.split(";")[0];
  console.log("✅ Login effettuato\n");
  return sessionCookie;
}

async function getExistingIngredients(cookie) {
  const res = await fetch(`${API_URL}/api/trpc/ingredients.list`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  // tRPC v11 batch format: array of results
  const items = Array.isArray(data) ? data[0]?.result?.data : data?.result?.data;
  return items || [];
}

async function createIngredient(cookie, ingredient) {
  const res = await fetch(`${API_URL}/api/trpc/ingredients.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ "0": { json: ingredient } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  const result = Array.isArray(data) ? data[0] : data;
  if (result?.error) throw new Error(JSON.stringify(result.error));
  return result?.result?.data;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

console.log("=".repeat(60));
console.log("IMPORT INGREDIENTI - MENUUNION2026");
console.log(`API: ${API_URL}`);
console.log(`Ingredienti da importare: ${INGREDIENTS.length}`);
console.log("=".repeat(60) + "\n");

const cookie = await login();

// Carica ingredienti esistenti
const existing = await getExistingIngredients(cookie);
const existingNames = new Set(existing.map((i) => i.name.toLowerCase().trim()));
console.log(`Ingredienti già nel DB: ${existing.length}\n`);

let created = 0;
let skipped = 0;
let errors = 0;

for (const [name, qtyG, price, category, isFood] of INGREDIENTS) {
  const nameKey = name.toLowerCase().trim();

  if (existingNames.has(nameKey)) {
    skipped++;
    continue;
  }

  const pkgQty = qtyG / 1000.0;
  // Per packaging/non-food venduti a unità, usa unitType 'u'; per food usa 'k'
  const unitType = isFood ? "k" : "u";
  const pricePerKgOrUnit = pkgQty > 0 ? price / pkgQty : 0;

  try {
    await createIngredient(cookie, {
      id: randomUUID(),
      name,
      category,
      unitType,
      packageQuantity: pkgQty,
      packagePrice: price,
      pricePerKgOrUnit: Math.round(pricePerKgOrUnit * 100) / 100,
      isFood,
      supplier: "Non specificato",
    });
    console.log(`+ ${name} → €${price}/${pkgQty}kg (${category})`);
    created++;
    existingNames.add(nameKey);
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    errors++;
  }

  // Piccola pausa per non sovraccaricare l'API
  await new Promise((r) => setTimeout(r, 80));
}

console.log("\n" + "=".repeat(60));
console.log(`✅ Creati:   ${created}`);
console.log(`⏭  Saltati:  ${skipped} (già presenti)`);
if (errors) console.log(`❌ Errori:   ${errors}`);
console.log(`📦 Totale:   ${INGREDIENTS.length}`);
console.log("=".repeat(60));
