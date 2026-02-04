#!/usr/bin/env python3
"""
Script per tagging automatico ricette e identificazione duplicati
"""
import mysql.connector
import os
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

print("="*60)
print("ANALISI RICETTE E DUPLICATI")
print("="*60)
print()

# 1. Identifica ricette che dovrebbero essere semilavorati
semi_keywords = ['spezie', 'salsa', 'sl_', 'mix', 'marinata', 'condimento']

cursor.execute("""
    SELECT id, code, name, category, isSemiFinished, isSellable
    FROM final_recipes
    ORDER BY name
""")
recipes = cursor.fetchall()

print(f"Totale ricette: {len(recipes)}")
print()

# Ricette da taggare come semilavorati
to_tag_semi = []
for recipe in recipes:
    name_lower = recipe['name'].lower()
    code_lower = recipe['code'].lower()
    
    # Se contiene keywords e non è già taggato
    is_semi_keyword = any(kw in name_lower or kw in code_lower for kw in semi_keywords)
    
    if is_semi_keyword and not recipe['isSemiFinished']:
        to_tag_semi.append(recipe)

print(f"Ricette da taggare come SEMILAVORATI: {len(to_tag_semi)}")
for r in to_tag_semi:
    print(f"  - {r['code']}: {r['name']}")
print()

# 2. Identifica duplicati
print("="*60)
print("DUPLICATI IDENTIFICATI")
print("="*60)
print()

duplicates = []
for i, r1 in enumerate(recipes):
    for r2 in recipes[i+1:]:
        name1 = r1['name'].lower().replace('sl ', '').replace('_', ' ').strip()
        name2 = r2['name'].lower().replace('sl ', '').replace('_', ' ').strip()
        
        if name1 in name2 or name2 in name1:
            duplicates.append((r1, r2))

print(f"Coppie duplicate trovate: {len(duplicates)}")
for r1, r2 in duplicates:
    print(f"\n  COPPIA DUPLICATA:")
    print(f"    A) ID:{r1['id']} | {r1['code']}: {r1['name']}")
    print(f"    B) ID:{r2['id']} | {r2['code']}: {r2['name']}")
    
    # Verifica se una delle due è usata come componente
    cursor.execute("""
        SELECT COUNT(*) as count FROM final_recipes 
        WHERE JSON_SEARCH(components, 'one', %s) IS NOT NULL
    """, (r1['id'],))
    usage1 = cursor.fetchone()['count']
    
    cursor.execute("""
        SELECT COUNT(*) as count FROM final_recipes 
        WHERE JSON_SEARCH(components, 'one', %s) IS NOT NULL
    """, (r2['id'],))
    usage2 = cursor.fetchone()['count']
    
    print(f"    Utilizzo come componente: A={usage1}, B={usage2}")
    
    if usage1 > usage2:
        print(f"    SUGGERIMENTO: Mantieni A (più usata), elimina B")
    elif usage2 > usage1:
        print(f"    SUGGERIMENTO: Mantieni B (più usata), elimina A")
    else:
        print(f"    SUGGERIMENTO: Mantieni quella con codice più standard")

print()
print("="*60)
print("AZIONI DA ESEGUIRE")
print("="*60)
print()
print(f"1. Taggare {len(to_tag_semi)} ricette come semilavorati")
print(f"2. Decidere quali duplicati eliminare ({len(duplicates)} coppie)")
print()

# Chiedi conferma per tagging
apply_tagging = input("Vuoi applicare il tagging automatico dei semilavorati? (y/n): ").lower().strip()

if apply_tagging == 'y':
    print("\nApplicazione tagging...")
    for recipe in to_tag_semi:
        cursor.execute("""
            UPDATE final_recipes 
            SET isSemiFinished = 1
            WHERE id = %s
        """, (recipe['id'],))
        print(f"  ✓ Taggato: {recipe['code']}")
    
    conn.commit()
    print(f"\n✓ Tagging completato: {len(to_tag_semi)} ricette aggiornate")
else:
    print("\nTagging annullato")

print()
print("="*60)
print("LISTA ID DUPLICATI DA ELIMINARE")
print("="*60)
print()
print("Copia gli ID delle ricette da eliminare e usali nel database:")
print()

for r1, r2 in duplicates:
    print(f"-- Coppia: {r1['name']} vs {r2['name']}")
    print(f"DELETE FROM final_recipes WHERE id = '{r1['id']}';  -- {r1['code']}")
    print(f"-- oppure")
    print(f"DELETE FROM final_recipes WHERE id = '{r2['id']}';  -- {r2['code']}")
    print()

cursor.close()
conn.close()
