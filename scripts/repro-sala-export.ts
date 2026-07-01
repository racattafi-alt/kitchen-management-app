import "dotenv/config";
import crypto from "crypto";
import { getDb, getIngredients } from "../server/db";
import { ingredients } from "../drizzle/schema";
import { exportIngredientsToExcel } from "../server/exportExcel";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  // semina 3 prodotti sala + 1 cucina per verificare il filtro
  const sample = [
    { name: "Pepsi Lattina", category: "Bevande", department: "Sala", price: "1.20" },
    { name: "Birra Moretti 33cl", category: "Birra", department: "Sala", price: "1.80" },
    { name: "Caffè Espresso", category: "Caffè", department: "Sala", price: "0.35" },
    { name: "Farina 00 (cucina)", category: "Farine", department: "Cucina", price: "1.17" },
  ];
  for (const s of sample) {
    await db.insert(ingredients).values({
      id: crypto.randomUUID(), name: s.name, category: s.category as any,
      unitType: "u", department: s.department as any,
      packageQuantity: "1", packagePrice: s.price, pricePerKgOrUnit: s.price,
    } as any).catch(() => {});
  }

  const all = await getIngredients();
  const sala = all.filter((i: any) => String(i.department ?? "").toLowerCase() === "sala");
  console.log(`ingredienti totali: ${all.length} | reparto Sala: ${sala.length}`);
  console.log("sala:", sala.map((i: any) => `${i.name} [${i.category}] €${i.pricePerKgOrUnit}`));

  const buffer = await exportIngredientsToExcel(sala);
  console.log(`Excel generato: ${buffer.length} byte -> OK`);
  process.exit(0);
}
main().catch((e) => { console.error("ERRORE:", e?.message); console.error(e?.stack); process.exit(1); });
