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

# Mappa ingredienti per nome
cursor.execute("SELECT id, name FROM ingredients")
ingredients_map = {}
for row in cursor.fetchall():
    ingredients_map[row['name']] = row['id']
    ingredients_map[row['name'].lower()] = row['id']

print(f"Ingredienti disponibili: {len(ingredients_map)}")

# Ottieni tutti i semilavorati
cursor.execute("SELECT id, code, name, components FROM semi_finished_recipes")
semilavorati = cursor.fetchall()

print(f"\n=== AGGIORNAMENTO STRUTTURA SEMILAVORATI ===")
updated_count = 0

for semi in semilavorati:
    if not semi['components']:
        print(f"⚠️  {semi['code']}: Nessun componente")
        continue
    
    components = json.loads(semi['components'])
    
    # Verifica se usa la struttura vecchia
    if components and 'ingredientId' in components[0]:
        print(f"🔄 {semi['code']}: Conversione struttura...")
        
        new_components = []
        for comp in components:
            ingredient_name = comp.get('ingredientId', '')
            
            # Cerca l'ID dell'ingrediente
            ingredient_id = ingredients_map.get(ingredient_name) or ingredients_map.get(ingredient_name.lower())
            
            if not ingredient_id:
                print(f"  ⚠️  Ingrediente non trovato: {ingredient_name}")
                continue
            
            # Converti nella nuova struttura
            new_comp = {
                "type": "INGREDIENT",
                "componentId": ingredient_id,
                "quantity": comp.get('quantity', 0),
                "unit": "k",
                "wastePercentage": 0
            }
            new_components.append(new_comp)
        
        # Aggiorna nel database
        components_json = json.dumps(new_components)
        cursor.execute(
            "UPDATE semi_finished_recipes SET components = %s WHERE id = %s",
            (components_json, semi['id'])
        )
        updated_count += 1
        print(f"  ✓ Aggiornato: {len(new_components)} componenti")
    else:
        print(f"✓ {semi['code']}: Struttura già corretta")

conn.commit()
cursor.close()
conn.close()

print(f"\n=== COMPLETATO ===")
print(f"Semilavorati aggiornati: {updated_count}/{len(semilavorati)}")
