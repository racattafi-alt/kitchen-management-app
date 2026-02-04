import sqlite3
import os

# Connessione al database
db_path = os.path.expanduser("~/.manus/kitchen-management-app/db.sqlite")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Mapping categorie PDF → Database
category_mapping = {
    "Additivi": "Additivi",
    "Carni": "Carni",
    "Farine": "Farine",
    "Latticini": "Latticini",
    "Latticini e uovo": "Latticini",
    "Verdura": "Verdura",
    "Verdure": "Verdura",
    "Verdura fresca": "Verdura",
    "Verduraio": "Verdura",
    "Spezie": "Spezie",
    "General Supplies": "Altro",
    "General...": "Altro",
    "Genera...": "Altro",
    "Fritti": "Altro",
    "Pronti all'uso": "Altro",
    "Salse": "Altro",
    "Salumi": "Carni",
    "Condimenti": "Altro",
    "No Food": "Packaging",
    "No food": "Packaging",
    "Pool Pack": "Packaging",
    "Bevande": "Bevande",
    "Alcolici": "Alcolici",
}

# Dati completi estratti dal PDF (nome, packageQuantity_g, packagePrice, categoria_pdf, isFood)
ingredients_data = [
    # Pagina 1
    ("Fumo liquido", 1000, 32.60, "Additivi", True),
    ("Mono e diglice", 1000, 22.50, "Additivi", True),
    ("Xantana", 1000, 27.79, "Additivi", True),
    ("Asiago", 1000, 7.64, "Latticini", True),
    ("Funghi acularia", 1000, 18.00, "Altro", True),
    ("Tenders", 1000, 7.12, "Carni", True),
    ("Costole di maiale", 1000, 4.99, "Carni", True),
    ("Bacon", 1000, 10.72, "Carni", True),
    ("Spalla di Maiale (senza osso)", 1000, 4.99, "Carni", True),
    ("Carne grill", 1000, 7.33, "Carni", True),
    ("Carne", 1000, 7.17, "Carni", True),
    ("Ali di pollo", 1000, 2.61, "Carni", True),
    ("Coscia di pollo", 1000, 8.20, "Carni", True),
    ("Diaframma (250-300g)", 1000, 9.01, "Carni", True),
    ("Reale (denver) (250-300g)", 1000, 14.37, "Carni", True),
    ("Tartare", 210, 3.20, "Carni", True),
    ("Doppio concentrato", 2500, 7.81, "Altro", True),
    ("Yogurt greco", 1000, 4.36, "Altro", True),
    ("Aceto balsamico", 1000, 2.10, "Altro", True),
    ("Zucchero", 1000, 0.82, "Altro", True),
    ("Peperoni", 1000, 2.98, "Verdura", True),
    ("Aglio pelato", 1000, 5.98, "Verdura", True),
    ("Beyond vegan Nuggets", 4000, 77.25, "Altro", True),
    ("UMA.MI Minced Vegana", 15000, 185.98, "Altro", True),
    ("CL soffice", 10000, 6.03, "Additivi", True),
    ("Lievito olentic", 1000, 8.82, "Additivi", True),
    ("Sapore carmen", 1000, 7.42, "Additivi", True),
    ("Softgrain", 5000, 36.35, "Additivi", True),
    ("Farina", 25000, 29.25, "Farine", True),
    ("Farina per fritti", 25000, 31.50, "Farine", True),
    ("Easy Snack CL", 15000, 89.42, "Farine", True),
    ("Fiocchi di patate", 4000, 14.89, "Farine", True),
    ("Burro professional e", 10000, 100.60, "Altro", True),
    ("Margarina", 1000, 4.78, "Altro", True),
    ("Zucchero invertito", 10000, 20.00, "Altro", True),
    ("Amido pregelatinizzato", 1000, 6.50, "Altro", True),
    
    # Pagina 2
    ("Tuorlo in polvere", 20000, 345.00, "Altro", True),
    ("Roggena", 10000, 39.00, "Altro", True),
    ('"Nutella"', 13000, 67.28, "Altro", True),
    ("Malto diastasico", 1000, 4.20, "Additivi", True),
    ("Amido di mais", 10000, 20.20, "Altro", True),
    ("Erbette surgelate", 1000, 5.33, "Altro", True),
    ("Spiedini 20cm", 1000, 17.37, "Packaging", False),
    ("Carta paglia", 10000, 13.30, "Packaging", False),
    ("Pellicola", 300, 5.26, "Packaging", False),
    ("Contenitori PLA (80ml) (50pz)", 50, 14.38, "Packaging", False),
    ("Rotoli Scontrini 57mm pos", 100, 19.60, "Packaging", False),
    ("Rotoli Scontrini 57mm", 50, 16.41, "Packaging", False),
    ("Rotoli Scontrini 80mm", 30, 31.82, "Packaging", False),
    ("Tovaglioli (33x33)", 4000, 19.60, "Packaging", False),
    ("Alluminio", 125, 6.94, "Packaging", False),
    ("Carta forno 60x40", 1000, 24.50, "Packaging", False),
    ("Detersivo pavimenti", 5000, 37.00, "Non Food", False),
    ("Guanti da cucina", 100, 3.89, "Packaging", False),
    ("Panno microfibra", 1, 0.70, "Non Food", False),
    ("Sacchetti antifog", 1000, 39.75, "Packaging", False),
    ("Farina UNIQUA Viola", 5000, 12.00, "Farine", True),
    ("Sacchi 70x110", 400, 34.03, "Packaging", False),
    ("Sacchi 50x120", 400, 0.00, "Packaging", False),
    ("Sapone lavapiatti", 5000, 8.57, "Non Food", False),
    ("Scottex (2 rotoli)", 2, 12.29, "Packaging", False),
    ("Shopper Bio", 500, 21.24, "Packaging", False),
    ("Spugne", 5, 3.29, "Non Food", False),
    ("Busta sv 30x40", 100, 12.73, "Packaging", False),
    ("Busta sv 20x30", 100, 9.30, "Packaging", False),
    ("Carta paglia tagliata", 10000, 13.30, "Packaging", False),
    
    # Pagina 3
    ("Scatole fritti", 100, 26.50, "Packaging", False),
    ("Tovaglioli tavolo", 1200, 118.56, "Packaging", False),
    ("Contenitori PLA (250ml)", 600, 22.49, "Packaging", False),
    ("Cetriolini salamoia", 400, 2.50, "Verdura", True),
    ("Olio di sesamo", 1650, 21.29, "Altro", True),
    ("Farina PAN", 1000, 2.20, "Farine", True),
    ("Batatine (sweet potato fries 9x9)", 10000, 40.73, "Altro", True),
    ("Onion rings", 1000, 34.03, "Altro", True),
    ("Patatine Really crunchy 6x6", 10000, 20.87, "Altro", True),
    ("Pasta di avocado", 1000, 0.00, "Altro", True),
    ("Latte UHT", 1000, 1.07, "Altro", True),
    ("Mascarpone", 2000, 6.78, "Latticini", True),
    ("Olio di semi", 1000, 1.58, "Altro", True),
    ("Sriracha", 475, 3.79, "Altro", True),
    ("Uova", 90, 21.76, "Altro", True),
    ("Zucchero a velo", 1000, 0.00, "Altro", True),
    ("Olio EVO", 500, 11.32, "Altro", True),
    ("Aceto di alcool", 1000, 0.00, "Altro", True),
    ("Aceto di mele", 3000, 7.07, "Altro", True),
    ("Arachidi", 1000, 4.93, "Altro", True),
    ("Misto frutti di bosco", 1000, 6.62, "Altro", True),
    ("Panna UHT", 1000, 6.95, "Altro", True),
    ("Pasta di zucca", 1000, 4.39, "Altro", True),
    ("Sale", 12000, 3.55, "Altro", True),
    ("Sale grosso", 12000, 3.68, "Altro", True),
    ("Salsa di Soja", 1900, 9.41, "Altro", True),
    ("Semi di papavero", 1000, 8.45, "Spezie", True),
    ("Latte di soja", 1000, 0.00, "Altro", True),
    ("Carote", 1000, 1.23, "Verdura", True),
    ("Fondo bruno vegano", 1000, 20.53, "Altro", True),
    ("Funghi sbrise", 1000, 6.64, "Altro", True),
    ("Tuorlo d'uovo special", 1000, 9.49, "Altro", True),
    ("Funghi shitake", 100, 0.00, "Altro", True),
    
    # Pagina 4
    ("Fiocchi di sale", 500, 5.01, "Altro", True),
    ("Cheddar", 1000, 7.63, "Latticini", True),
    ("Stracciatella", 1000, 9.89, "Latticini", True),
    ("Gorgonzola", 1000, 9.29, "Latticini", True),
    ("Misto uovo", 1000, 4.37, "Latticini", True),
    ("Melanzane", 1000, 2.15, "Verdura", True),
    ("Onion flakes", 1000, 6.73, "Altro", True),
    ("Rucola", 100, 1.08, "Verdura", True),
    ("Senape", 875, 2.63, "Altro", True),
    ("Lardo", 1000, 10.97, "Carni", True),
    ("Nduja", 400, 10.79, "Carni", True),
    ("Cavolo viola", 1000, 1.33, "Verdura", True),
    ("Cetrioli", 1000, 1.64, "Verdura", True),
    ("Cipolla viola", 1000, 1.53, "Verdura", True),
    ("Limone", 1000, 2.05, "Verdura", True),
    ("Pomodoro", 1000, 2.46, "Verdura", True),
    ("Pomodori secchi", 1700, 8.48, "Verdura", True),
    ("Coriandolo", 500, 14.28, "Verdura", True),
    ("Lime", 1000, 3.39, "Verdura", True),
    ("Pepe", 1000, 17.32, "Spezie", True),
    ("Aglio in polvere", 1000, 6.50, "Spezie", True),
    ("Asafetida", 10, 5.78, "Spezie", True),
    ("Cannella", 250, 15.08, "Spezie", True),
    ("Chile pasilla in polvere", 1000, 22.00, "Spezie", True),
    ("Coriandolo in polvere", 1000, 17.70, "Spezie", True),
    ("Cumino", 1000, 19.90, "Spezie", True),
    ("Curcuma", 1000, 19.80, "Spezie", True),
    ("Fava tonka", 15, 4.45, "Spezie", True),
    ("Galangal", 1000, 31.40, "Spezie", True),
    ("Nigella", 1000, 20.37, "Spezie", True),
    ("Paprica affumicata", 1000, 26.90, "Spezie", True),
    ("Paprica dolce", 1000, 26.90, "Spezie", True),
    
    # Pagina 5
    ("Pasta di vaniglia", 100, 23.36, "Spezie", True),
    ("Pepe bianco", 1000, 20.00, "Spezie", True),
    ("Rabarbaro", 250, 17.75, "Spezie", True),
    ("Pepe di sichuan", 1000, 57.70, "Spezie", True),
    ("Radice di angelica", 250, 18.59, "Spezie", True),
    ("Semi di fieno greco", 1000, 15.65, "Spezie", True),
    ("Sumac", 1000, 28.00, "Spezie", True),
    ("Thè affumicato", 250, 20.90, "Spezie", True),
    ("Semi di senape", 1000, 17.45, "Spezie", True),
    ("Senape in polvere", 1000, 16.70, "Spezie", True),
    ("Cipolla", 1000, 1.50, "Verdura", True),
    ("Insalata", 1000, 1.50, "Verdura", True),
    ("Cavolo cappuccio", 1000, 1.50, "Verdura", True),
    ("Acqua", 1000, 0.00, "Bevande", True),
    ("Fiocchi di pomodoro", 170, 8.39, "Altro", True),
    ("Vino bianco", 750, 5.00, "Alcolici", True),
]

updated_count = 0
created_count = 0
skipped_count = 0

for name, qty_g, price, cat_pdf, is_food in ingredients_data:
    # Converti quantità da grammi a kg
    pkg_qty_kg = qty_g / 1000.0
    
    # Calcola pricePerKgOrUnit
    if pkg_qty_kg > 0:
        price_per_kg = price / pkg_qty_kg
    else:
        price_per_kg = 0.0
    
    # Mappa categoria
    category_db = category_mapping.get(cat_pdf, "Altro")
    
    # Verifica se esiste già
    cursor.execute("SELECT id, package_price, package_quantity, category, is_food FROM ingredients WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))", (name,))
    existing = cursor.fetchone()
    
    if existing:
        ing_id, old_price, old_qty, old_cat, old_is_food = existing
        # Aggiorna solo se i dati sono diversi
        if (abs(float(old_price) - price) > 0.01 or 
            abs(float(old_qty) - pkg_qty_kg) > 0.001 or 
            old_cat != category_db or 
            (old_is_food == 1) != is_food):
            
            cursor.execute("""
                UPDATE ingredients 
                SET package_price = ?, 
                    package_quantity = ?, 
                    price_per_kg_or_unit = ?,
                    category = ?,
                    is_food = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (price, pkg_qty_kg, price_per_kg, category_db, 1 if is_food else 0, ing_id))
            updated_count += 1
            print(f"✓ Aggiornato: {name} → €{price}/{pkg_qty_kg}kg = €{price_per_kg:.2f}/kg | {category_db} | Food={is_food}")
        else:
            skipped_count += 1
    else:
        # Crea nuovo ingrediente
        cursor.execute("""
            INSERT INTO ingredients (name, package_price, package_quantity, price_per_kg_or_unit, category, unit, is_food, supplier, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'kg', ?, 'Non specificato', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (name, price, pkg_qty_kg, price_per_kg, category_db, 1 if is_food else 0))
        created_count += 1
        print(f"+ Creato: {name} → €{price}/{pkg_qty_kg}kg = €{price_per_kg:.2f}/kg | {category_db} | Food={is_food}")

conn.commit()
conn.close()

print(f"\n=== RIEPILOGO ===")
print(f"Ingredienti aggiornati: {updated_count}")
print(f"Ingredienti creati: {created_count}")
print(f"Ingredienti saltati (già corretti): {skipped_count}")
print(f"Totale processati: {len(ingredients_data)}")
