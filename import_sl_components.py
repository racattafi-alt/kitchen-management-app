#!/usr/bin/env python3
"""
Script per importare componenti ricette SL/Spezie da dati estratti PDF
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

# Carica tutti gli ingredienti per mapping nome → ID
cursor.execute("SELECT id, name FROM ingredients")
ingredients_map = {row['name'].lower().strip(): row['id'] for row in cursor.fetchall()}

print("="*70)
print("IMPORTAZIONE COMPONENTI RICETTE SL/SPEZIE DA PDF")
print("="*70)
print()

# Dati estratti dal PDF (convertiti in grammi → kg)
recipes_components = {
    'SPEZIE_BACON': [
        {'name': 'Sale grosso', 'quantity': 0.700, 'unit': 'kg'},
        {'name': 'Semi di fieno greco', 'quantity': 0.060, 'unit': 'kg'},
        {'name': 'Paprica affumicata', 'quantity': 0.080, 'unit': 'kg'},
        {'name': 'Galangal', 'quantity': 0.080, 'unit': 'kg'},
        {'name': 'Cannella', 'quantity': 0.020, 'unit': 'kg'},
        {'name': 'Aglio in polvere', 'quantity': 0.060, 'unit': 'kg'},
    ],
    'SPEZIE_PULLED': [
        {'name': 'Pepe', 'quantity': 0.120, 'unit': 'kg'},
        {'name': 'Sale', 'quantity': 0.560, 'unit': 'kg'},
        {'name': 'Coriandolo', 'quantity': 0.060, 'unit': 'kg'},
        {'name': 'Cumino', 'quantity': 0.050, 'unit': 'kg'},
        {'name': 'Paprica affumicata', 'quantity': 0.060, 'unit': 'kg'},
        {'name': 'Semi di fieno greco', 'quantity': 0.050, 'unit': 'kg'},
        {'name': 'Galangal', 'quantity': 0.015, 'unit': 'kg'},
        {'name': 'Thè affumicato', 'quantity': 0.075, 'unit': 'kg'},
    ],
    'SPEZIE_RIBS': [
        {'name': 'Sale', 'quantity': 0.150, 'unit': 'kg'},
        {'name': 'Aglio in polvere', 'quantity': 0.080, 'unit': 'kg'},
        {'name': 'Paprica affumicata', 'quantity': 0.130, 'unit': 'kg'},
    ],
    'SPEZIE_TENDERS': [
        {'name': 'Sale', 'quantity': 0.100, 'unit': 'kg'},
        {'name': 'Sumac', 'quantity': 0.030, 'unit': 'kg'},
        {'name': 'Aglio in polvere', 'quantity': 0.010, 'unit': 'kg'},
        {'name': 'Cumino', 'quantity': 0.010, 'unit': 'kg'},
        {'name': 'Senape in polvere', 'quantity': 0.030, 'unit': 'kg'},
        {'name': 'Paprica affumicata', 'quantity': 0.030, 'unit': 'kg'},
        {'name': 'Xantana', 'quantity': 0.005, 'unit': 'kg'},
        {'name': 'Pepe bianco', 'quantity': 0.010, 'unit': 'kg'},
        {'name': 'Farina per fritti', 'quantity': 0.020, 'unit': 'kg'},
        {'name': 'Amido pregelatinizzato', 'quantity': 0.025, 'unit': 'kg'},
    ],
    'SPEZIE_SOVRACOSCE': [
        {'name': 'Paprica dolce', 'quantity': 0.020, 'unit': 'kg'},
        {'name': 'Pepe', 'quantity': 0.025, 'unit': 'kg'},
        {'name': 'Pepe bianco', 'quantity': 0.010, 'unit': 'kg'},
        {'name': 'Sale', 'quantity': 0.100, 'unit': 'kg'},
        {'name': 'Amido pregelatinizzato', 'quantity': 0.030, 'unit': 'kg'},
        {'name': 'Xantana', 'quantity': 0.005, 'unit': 'kg'},
        {'name': 'Farina per fritti', 'quantity': 0.040, 'unit': 'kg'},
    ],
    'BBQ_RIBS': [
        {'name': 'Ketchup', 'quantity': 0.900, 'unit': 'kg', 'type': 'semi_finished'},
        {'name': 'Fondo bruno vegano', 'quantity': 0.200, 'unit': 'kg'},
        {'name': 'Pepe di sichuan', 'quantity': 0.005, 'unit': 'kg'},
        {'name': 'Zucchero invertito', 'quantity': 0.150, 'unit': 'kg'},
        {'name': 'Acqua', 'quantity': 0.200, 'unit': 'kg'},
        {'name': 'Limone', 'quantity': 0.080, 'unit': 'kg'},
        {'name': 'Sumac', 'quantity': 0.015, 'unit': 'kg'},
        {'name': 'Senape', 'quantity': 0.020, 'unit': 'kg'},
        {'name': 'Sale', 'quantity': 0.020, 'unit': 'kg'},
    ],
}

updated_count = 0
error_count = 0

for code, components_data in recipes_components.items():
    # Verifica se ricetta esiste
    cursor.execute("SELECT id, name FROM final_recipes WHERE code = %s", (code,))
    recipe = cursor.fetchone()
    
    if not recipe:
        print(f"✗ {code}: Ricetta non trovata nel database")
        error_count += 1
        continue
    
    # Costruisci array componenti con ID risolti
    resolved_components = []
    missing_ingredients = []
    
    for comp in components_data:
        comp_name = comp['name'].strip()
        comp_name_lower = comp_name.lower()
        quantity = comp['quantity']
        unit = comp.get('unit', 'kg')
        comp_type = comp.get('type', 'ingredient')
        
        component_obj = {
            'type': comp_type,
            'quantity': quantity,
            'unit': unit,
            'componentName': comp_name
        }
        
        if comp_type == 'ingredient':
            # Cerca ingrediente
            ingredient_id = ingredients_map.get(comp_name_lower)
            if ingredient_id:
                component_obj['componentId'] = ingredient_id
                resolved_components.append(component_obj)
            else:
                missing_ingredients.append(comp_name)
        elif comp_type == 'semi_finished':
            # Cerca semilavorato (Ketchup)
            cursor.execute("SELECT id FROM final_recipes WHERE LOWER(name) = %s OR LOWER(code) = %s", 
                          (comp_name_lower, comp_name_lower))
            semi = cursor.fetchone()
            if semi:
                component_obj['componentId'] = semi['id']
                resolved_components.append(component_obj)
            else:
                # Prova con semi_finished_recipes
                cursor.execute("SELECT id FROM semi_finished_recipes WHERE LOWER(name) = %s", (comp_name_lower,))
                semi = cursor.fetchone()
                if semi:
                    component_obj['componentId'] = semi['id']
                    resolved_components.append(component_obj)
                else:
                    missing_ingredients.append(f"{comp_name} (semi)")
    
    if missing_ingredients:
        print(f"⚠ {code}: Ingredienti mancanti: {', '.join(missing_ingredients)}")
    
    if resolved_components:
        # Aggiorna componenti nel database
        components_json = json.dumps(resolved_components)
        
        cursor.execute("""
            UPDATE final_recipes
            SET components = %s
            WHERE id = %s
        """, (components_json, recipe['id']))
        
        print(f"✓ {code} ({recipe['name']}): {len(resolved_components)} componenti importati")
        updated_count += 1
    else:
        print(f"✗ {code}: Nessun componente risolto")
        error_count += 1

conn.commit()

print()
print("="*70)
print("RIEPILOGO IMPORTAZIONE")
print("="*70)
print(f"Ricette aggiornate: {updated_count}")
print(f"Errori: {error_count}")
print()

cursor.close()
conn.close()
