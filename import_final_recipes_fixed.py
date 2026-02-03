import openpyxl
import os
import json
from collections import defaultdict
from urllib.parse import urlparse
import mysql.connector

# Carica il file Excel
wb = openpyxl.load_workbook('/home/ubuntu/upload/MENUUNION2026.xlsx', data_only=True)
ws_rec = wb['REC_FINALE']

# Connessione database
db_url = os.environ.get('DATABASE_URL', '')
parsed = urlparse(db_url)

conn = mysql.connector.connect(
    host=parsed.hostname,
    port=parsed.port or 3306,
    user=parsed.username,
    password=parsed.password,
    database=parsed.path.lstrip('/'),
    ssl_ca='',
    ssl_verify_cert=False
)
cursor = conn.cursor(dictionary=True)

# Mappa ingredienti per nome
cursor.execute("SELECT id, name FROM ingredients")
ingredients_map = {row['name']: row['id'] for row in cursor.fetchall()}

# Mappa semilavorati per codice
cursor.execute("SELECT id, code FROM semi_finished_recipes")
semi_map = {row['code']: row['id'] for row in cursor.fetchall()}

print(f"Ingredienti disponibili: {len(ingredients_map)}")
print(f"Semilavorati disponibili: {len(semi_map)}")

# Raggruppa componenti per RC_ID
recipes_data = defaultdict(list)

for row_idx, row in enumerate(ws_rec.iter_rows(min_row=2, values_only=True), start=2):
    rc_id = row[0]  # Col A: RC_ID
    component_name = row[1]  # Col B: COMPONENTE
    cod = row[2]  # Col C: COD
    um = row[3]  # Col D: UM
    price_um = row[4]  # Col E: Prezzo_UM
    qty = row[5]  # Col F: Qty
    eur = row[6]  # Col G: EUR
    
    if not rc_id or not component_name:
        continue
    
    # Determina se è ingrediente o semilavorato
    component_id = None
    component_type = None
    
    # Prima cerca nei semilavorati per codice
    if cod and cod in semi_map:
        component_id = semi_map[cod]
        component_type = "SEMI_FINISHED"
    # Poi cerca negli ingredienti per nome
    elif component_name in ingredients_map:
        component_id = ingredients_map[component_name]
        component_type = "INGREDIENT"
    else:
        print(f"⚠️  Componente non trovato: {component_name} (cod: {cod})")
        continue
    
    # Converti quantità in grammi
    qty_g = float(qty) if qty else 0
    if um and um.lower() == 'kg':
        qty_g *= 1000
    
    component = {
        "type": component_type,
        "componentId": component_id,
        "quantity": qty_g,
        "unit": "k",  # Sempre in kg per standardizzazione
        "wastePercentage": 0,  # Default, può essere modificato dopo
    }
    
    recipes_data[rc_id].append(component)

print(f"\n=== RICETTE TROVATE: {len(recipes_data)} ===")

# Aggiorna le ricette nel database
updated_count = 0
for rc_id, components in recipes_data.items():
    components_json = json.dumps(components)
    
    # Trova la ricetta per codice
    cursor.execute("SELECT id, name FROM final_recipes WHERE code = %s", (rc_id,))
    recipe = cursor.fetchone()
    
    if recipe:
        cursor.execute(
            "UPDATE final_recipes SET components = %s WHERE id = %s",
            (components_json, recipe['id'])
        )
        updated_count += 1
        print(f"✓ Aggiornata: {recipe['name']} ({rc_id}) - {len(components)} componenti")
    else:
        print(f"✗ Ricetta non trovata nel DB: {rc_id}")

conn.commit()
cursor.close()
conn.close()

print(f"\n=== COMPLETATO ===")
print(f"Ricette aggiornate: {updated_count}/{len(recipes_data)}")
