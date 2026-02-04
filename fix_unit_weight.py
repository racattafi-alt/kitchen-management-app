#!/usr/bin/env python3
"""
Script per correggere il campo unitWeight nelle ricette finali.

Problema: Durante l'importazione, i pesi finali in grammi sono stati salvati come kg
Esempio: 490 grammi è stato salvato come 490.490 kg invece di 0.490 kg

Questo script:
1. Legge tutte le ricette finali
2. Identifica ricette con unitWeight > 50 kg (sospetto)
3. Divide per 1000 i valori sospetti
4. Aggiorna il database

ATTENZIONE: Eseguire un backup prima di procedere!
"""

import os
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

# Leggi tutte le ricette con unitWeight
cursor.execute("SELECT id, name, code, unitWeight FROM final_recipes WHERE unitWeight IS NOT NULL")
recipes = cursor.fetchall()

print(f"=== ANALISI RICETTE ===")
print(f"Totale ricette con unitWeight: {len(recipes)}\n")

fixed_count = 0
dry_run = False  # Modifiche attive

for recipe in recipes:
    unit_weight = float(recipe['unitWeight']) if recipe['unitWeight'] else 0
    
    # Soglia: se unitWeight > 50 kg, probabilmente è un errore
    # (es. 490g salvato come 490kg)
    if unit_weight > 50:
        new_weight = unit_weight / 1000
        fixed_count += 1
        
        print(f"{'[DRY RUN] ' if dry_run else ''}✓ {recipe['name']} ({recipe['code']})")
        print(f"  unitWeight: {unit_weight:.3f} kg → {new_weight:.3f} kg\n")
        
        if not dry_run:
            cursor.execute(
                "UPDATE final_recipes SET unitWeight = %s WHERE id = %s",
                (new_weight, recipe['id'])
            )

if not dry_run:
    conn.commit()
    print(f"\n=== COMPLETATO ===")
    print(f"Ricette corrette: {fixed_count}")
else:
    print(f"\n=== DRY RUN COMPLETATO ===")
    print(f"Ricette da correggere: {fixed_count}")
    if fixed_count > 0:
        print(f"\nPer applicare le modifiche, modifica la riga:")
        print(f"  dry_run = True  →  dry_run = False")
        print(f"e riesegui lo script.")
    else:
        print(f"\nNessuna ricetta da correggere trovata.")

cursor.close()
conn.close()
