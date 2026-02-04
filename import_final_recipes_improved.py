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

# Mappa ingredienti per nome (case-insensitive)
cursor.execute("SELECT id, name FROM ingredients")
ingredients_map = {}
for row in cursor.fetchall():
    ingredients_map[row['name'].lower()] = {'id': row['id'], 'name': row['name']}

# Mappa semilavorati per codice E per nome (case-insensitive)
cursor.execute("SELECT id, code, name FROM semi_finished_recipes")
semi_map_by_code = {}
semi_map_by_name = {}
for row in cursor.fetchall():
    semi_map_by_code[row['code']] = {'id': row['id'], 'name': row['name'], 'code': row['code']}
    semi_map_by_name[row['name'].lower()] = {'id': row['id'], 'name': row['name'], 'code': row['code']}

print(f"Ingredienti disponibili: {len(ingredients_map)}")
print(f"Semilavorati disponibili: {len(semi_map_by_code)}")

# Lista di operazioni da ignorare
OPERATIONS = ['cuoco', 'forno', 'mixer', 'piastra', 'abbattitore', 'tagliaverdure', 'friggitrice']

# Raggruppa componenti per RC_ID
recipes_data = defaultdict(list)
skipped_operations = set()
not_found = set()

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
    
    # Ignora operazioni
    if component_name.lower() in OPERATIONS or cod == 'ops':
        skipped_operations.add(component_name)
        continue
    
    # Determina se è ingrediente o semilavorato
    component_id = None
    component_type = None
    component_name_lower = component_name.lower()
    
    # 1. Cerca nei semilavorati per codice
    if cod and cod in semi_map_by_code:
        semi = semi_map_by_code[cod]
        component_id = semi['id']
        component_type = "SEMI_FINISHED"
    # 2. Cerca nei semilavorati per nome (case-insensitive)
    elif component_name_lower in semi_map_by_name:
        semi = semi_map_by_name[component_name_lower]
        component_id = semi['id']
        component_type = "SEMI_FINISHED"
    # 3. Cerca negli ingredienti per nome (case-insensitive)
    elif component_name_lower in ingredients_map:
        ing = ingredients_map[component_name_lower]
        component_id = ing['id']
        component_type = "INGREDIENT"
    else:
        not_found.add(f"{component_name} (cod: {cod})")
        continue
    
    # Converti quantità: tutto in kg
    qty_kg = float(qty) if qty else 0
    if um and um.lower() != 'kg':
        # Se l'unità NON è kg (quindi grammi o altro), dividi per 1000
        qty_kg = qty_kg / 1000
    # Se è già kg, resta invariato
    
    component = {
        "type": component_type,
        "componentId": component_id,
        "quantity": qty_kg,
        "unit": "k",  # Sempre in kg per standardizzazione
        "wastePercentage": 0,  # Default, può essere modificato dopo
    }
    
    recipes_data[rc_id].append(component)

print(f"\n=== STATISTICHE ===")
print(f"Ricette trovate: {len(recipes_data)}")
print(f"Operazioni ignorate: {len(skipped_operations)}")
if skipped_operations:
    print(f"  {', '.join(sorted(skipped_operations))}")
print(f"Componenti non trovati: {len(not_found)}")
if not_found:
    for item in sorted(not_found):
        print(f"  ⚠️  {item}")

# Aggiorna le ricette nel database
print(f"\n=== AGGIORNAMENTO DATABASE ===")
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
        print(f"✓ {recipe['name']} ({rc_id}) - {len(components)} componenti")
    else:
        print(f"✗ Ricetta non trovata nel DB: {rc_id}")

conn.commit()
cursor.close()
conn.close()

print(f"\n=== COMPLETATO ===")
print(f"Ricette aggiornate: {updated_count}/{len(recipes_data)}")
