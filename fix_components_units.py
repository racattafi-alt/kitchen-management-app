#!/usr/bin/env python3
"""
Corregge le unità dei componenti ricette: converte da grammi a kg
PROBLEMA: normalize_recipe_quantities.py ha salvato quantità in grammi,
ma il backend si aspetta kg
"""
import os
import json
from urllib.parse import urlparse
import mysql.connector

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

# Ottieni tutte le ricette con componenti
cursor.execute("SELECT id, code, name, unitWeight, components FROM final_recipes WHERE components IS NOT NULL")
recipes = cursor.fetchall()

print(f"="*60)
print(f"CORREZIONE UNITÀ COMPONENTI")
print(f"="*60)
print(f"Ricette da analizzare: {len(recipes)}\n")

updated_count = 0
for recipe in recipes:
    try:
        # Il campo components è già una stringa JSON nel database
        components = json.loads(recipe['components'])
    except (json.JSONDecodeError, TypeError) as e:
        print(f"⚠️  {recipe['code']}: Errore parsing JSON: {e}")
        components = []
    
    if not components or not isinstance(components, list):
        continue
    
    # Verifica se le quantità sono in grammi (>100 è sospetto per kg)
    needs_fix = False
    for comp in components:
        if not isinstance(comp, dict):
            print(f"⚠️  {recipe['code']}: componente non è un dict, tipo: {type(comp)}")
            continue
        qty = float(comp.get('quantity', 0))
        if qty > 100:  # Probabilmente grammi
            needs_fix = True
            break
    
    if not needs_fix:
        continue
    
    # Converti da grammi a kg
    fixed_components = []
    total_before = 0
    total_after = 0
    
    for comp in components:
        fixed_comp = comp.copy()
        qty_g = float(comp.get('quantity', 0))
        qty_kg = qty_g / 1000
        fixed_comp['quantity'] = qty_kg
        fixed_components.append(fixed_comp)
        
        total_before += qty_g
        total_after += qty_kg
    
    # Aggiorna database
    components_json = json.dumps(fixed_components)
    cursor.execute(
        "UPDATE final_recipes SET components = %s WHERE id = %s",
        (components_json, recipe['id'])
    )
    
    updated_count += 1
    unit_weight = float(recipe['unitWeight']) if recipe['unitWeight'] else 0
    ratio = total_after / unit_weight if unit_weight > 0 else 0
    
    print(f"✓ {recipe['code']} - {recipe['name']}")
    print(f"  Input totale: {total_before:.0f}g → {total_after:.3f}kg")
    print(f"  Output: {unit_weight:.3f}kg")
    print(f"  Rapporto: {ratio:.2f}x")
    print()

conn.commit()
cursor.close()
conn.close()

print(f"="*60)
print(f"COMPLETATO")
print(f"="*60)
print(f"Ricette aggiornate: {updated_count}/{len(recipes)}")
