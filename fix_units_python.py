#!/usr/bin/env python3
"""
Script per correggere la conversione errata grammi -> kg nelle ricette finali.

Problema: Durante l'importazione, i valori in grammi sono stati salvati come kg
Esempio: 490 grammi è stato salvato come 490 kg invece di 0.49 kg

Questo script:
1. Legge tutte le ricette finali
2. Identifica componenti con quantità sospette (> 50 kg per componente singolo)
3. Divide per 1000 le quantità sospette
4. Aggiorna il database

ATTENZIONE: Eseguire un backup prima di procedere!
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

# Leggi tutte le ricette
cursor.execute("SELECT id, name, code, components FROM final_recipes")
recipes = cursor.fetchall()

print(f"=== ANALISI RICETTE ===")
print(f"Totale ricette: {len(recipes)}\n")

fixed_count = 0
dry_run = True  # Cambia a False per applicare le modifiche

for recipe in recipes:
    if not recipe['components']:
        continue
    
    try:
        components = recipe['components']
        
        # Doppio parsing se necessario (JSON dentro JSON)
        if isinstance(components, str):
            components = json.loads(components)
        if isinstance(components, str):
            components = json.loads(components)
        
        # Verifica che sia una lista
        if not isinstance(components, list):
            print(f"⚠️  Components non è una lista per {recipe['name']}: {type(components)}")
            continue
            
    except Exception as e:
        print(f"⚠️  Errore parsing JSON per {recipe['name']}: {e}")
        continue
    
    modified = False
    suspicious_components = []
    
    for comp in components:
        qty = comp.get('quantity', 0)
        
        # Soglia: se un componente ha > 50 kg, probabilmente è un errore
        # (es. 490g salvato come 490kg)
        if qty > 50:
            suspicious_components.append({
                'name': comp.get('componentName', 'unknown'),
                'old_qty': qty,
                'new_qty': qty / 1000
            })
            comp['quantity'] = qty / 1000
            modified = True
    
    if modified:
        fixed_count += 1
        print(f"{'[DRY RUN] ' if dry_run else ''}✓ {recipe['name']} ({recipe['code']})")
        for sc in suspicious_components:
            print(f"  - {sc['name']}: {sc['old_qty']:.2f} kg → {sc['new_qty']:.3f} kg")
        
        if not dry_run:
            new_components_json = json.dumps(components)
            cursor.execute(
                "UPDATE final_recipes SET components = %s WHERE id = %s",
                (new_components_json, recipe['id'])
            )

if not dry_run:
    conn.commit()
    print(f"\n=== COMPLETATO ===")
    print(f"Ricette corrette: {fixed_count}")
else:
    print(f"\n=== DRY RUN COMPLETATO ===")
    print(f"Ricette da correggere: {fixed_count}")
    print(f"\nPer applicare le modifiche, modifica la riga:")
    print(f"  dry_run = True  →  dry_run = False")
    print(f"e riesegui lo script.")

cursor.close()
conn.close()
