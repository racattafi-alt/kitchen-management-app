#!/usr/bin/env python3
"""
Script per importare componenti ricette da JSON estratto da Excel
"""
import mysql.connector
import os
import json
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = os.getenv('DATABASE_URL')
parsed = urlparse(db_url)

conn = mysql.connector.connect(
    host=parsed.hostname,
    port=parsed.port or 3306,
    user=parsed.username,
    password=parsed.password,
    database=parsed.path[1:],
    ssl_disabled=False
)

cursor = conn.cursor(dictionary=True)

# Carica JSON
with open('/home/ubuntu/upload/menuunion2026_components_target.json', 'r') as f:
    recipes_data = json.load(f)

print("="*70)
print("IMPORTAZIONE COMPONENTI DA JSON")
print("="*70)
print()

# Mapping codici vecchi → nuovi (dopo rinomina)
code_mapping = {
    'SL_BBQ': None,  # Eliminato
    'SL_BBQRIBS': 'BBQ_RIBS',
    'SL_SBACON': 'SPEZIE_BACON',
    'SL_SPULLED': 'SPEZIE_PULLED',
    'SL_SRIBS': 'SPEZIE_RIBS',
    'SL_SSOVRACOSCE': 'SPEZIE_SOVRACOSCE',
    'SL_STENDERS': 'SPEZIE_TENDERS'
}

# Carica tutti gli ingredienti per mapping nome → ID
cursor.execute("SELECT id, name FROM ingredients")
ingredients_map = {row['name'].lower().strip(): row['id'] for row in cursor.fetchall()}

# Carica tutti i semilavorati per mapping nome → ID
cursor.execute("SELECT id, name, code FROM semi_finished_recipes")
semi_finished_map = {}
for row in cursor.fetchall():
    semi_finished_map[row['name'].lower().strip()] = row['id']
    semi_finished_map[row['code'].lower().strip()] = row['id']

updated_count = 0
skipped_count = 0
error_count = 0

for old_code, recipe_data in recipes_data.items():
    # Salta se eliminato
    if old_code in code_mapping and code_mapping[old_code] is None:
        print(f"⊘ {old_code}: Saltato (eliminato)")
        skipped_count += 1
        continue
    
    # Usa nuovo codice se rinominato
    current_code = code_mapping.get(old_code, old_code)
    
    # Verifica se ricetta esiste
    cursor.execute("SELECT id, name, components FROM final_recipes WHERE code = %s", (current_code,))
    recipe = cursor.fetchone()
    
    if not recipe:
        print(f"✗ {current_code}: Ricetta non trovata nel database")
        error_count += 1
        continue
    
    components = recipe_data.get('components', [])
    
    if not components or len(components) == 0:
        print(f"⊘ {current_code}: Nessun componente nel JSON")
        skipped_count += 1
        continue
    
    # Costruisci array componenti con ID risolti
    resolved_components = []
    missing_ingredients = []
    
    for comp in components:
        comp_type = comp.get('type', 'ingredient')
        comp_name = comp.get('name', '').strip()
        comp_name_lower = comp_name.lower()
        quantity = comp.get('quantity', 0)
        unit = comp.get('unit', 'kg')
        
        component_obj = {
            'type': comp_type,
            'quantity': quantity,
            'unit': unit
        }
        
        if comp_type == 'ingredient':
            # Cerca ingrediente
            ingredient_id = ingredients_map.get(comp_name_lower)
            if ingredient_id:
                component_obj['componentId'] = ingredient_id
                component_obj['componentName'] = comp_name
                resolved_components.append(component_obj)
            else:
                missing_ingredients.append(comp_name)
        
        elif comp_type == 'semi_finished':
            # Cerca semilavorato
            semi_id = semi_finished_map.get(comp_name_lower)
            if semi_id:
                component_obj['componentId'] = semi_id
                component_obj['componentName'] = comp_name
                resolved_components.append(component_obj)
            else:
                missing_ingredients.append(f"{comp_name} (semi)")
        
        elif comp_type == 'operation':
            # Operation non ha componentId
            component_obj['componentName'] = comp_name
            component_obj['costType'] = 'LAVORO'  # Default
            resolved_components.append(component_obj)
    
    if missing_ingredients:
        print(f"⚠ {current_code}: Ingredienti mancanti: {', '.join(missing_ingredients[:3])}")
    
    if resolved_components:
        # Aggiorna componenti nel database
        components_json = json.dumps(resolved_components)
        
        # Calcola totalCost
        total_cost = sum(c.get('quantity', 0) * c.get('pricePerUnit', 0) for c in resolved_components if 'pricePerUnit' in c)
        
        cursor.execute("""
            UPDATE final_recipes
            SET components = %s
            WHERE id = %s
        """, (components_json, recipe['id']))
        
        print(f"✓ {current_code}: {len(resolved_components)} componenti importati")
        updated_count += 1
    else:
        print(f"✗ {current_code}: Nessun componente risolto")
        error_count += 1

conn.commit()

print()
print("="*70)
print("RIEPILOGO IMPORTAZIONE")
print("="*70)
print(f"Ricette aggiornate: {updated_count}")
print(f"Ricette saltate: {skipped_count}")
print(f"Errori: {error_count}")
print()

cursor.close()
conn.close()
