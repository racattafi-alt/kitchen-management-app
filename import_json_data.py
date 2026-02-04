#!/usr/bin/env python3
"""
Script per importare dati da menu_union_2026.json nel database.
Aggiorna le ricette finali con peso finale, quantità prodotta e resa corretta.
"""

import json
import os
from dotenv import load_dotenv
import mysql.connector

# Carica variabili ambiente
load_dotenv()

# Connessione database
db_url = os.getenv('DATABASE_URL')
if not db_url:
    raise ValueError("DATABASE_URL not found in environment")

# Parse connection string (formato: mysql://user:pass@host:port/dbname?params)
db_url = db_url.replace('mysql://', '')
user_pass, host_db = db_url.split('@')
user, password = user_pass.split(':')
host_port_db = host_db.split('/')
host_port = host_port_db[0]
dbname_params = host_port_db[1]
dbname = dbname_params.split('?')[0]  # Rimuovi parametri SSL
host, port = host_port.split(':') if ':' in host_port else (host_port, '3306')

conn = mysql.connector.connect(
    host=host,
    port=int(port),
    user=user,
    password=password,
    database=dbname
)
cursor = conn.cursor()

# Carica dati JSON
with open('/home/ubuntu/upload/menu_union_2026.json', 'r', encoding='utf-8') as f:
    ricette_json = json.load(f)

print(f"Caricati {len(ricette_json)} ricette dal JSON")

# Aggiorna ogni ricetta
updated_count = 0
not_found_count = 0

for ricetta in ricette_json:
    codice = ricetta['codice_ricetta']
    
    # Cerca ricetta nel database
    cursor.execute("SELECT id, code FROM final_recipes WHERE code = %s", (codice,))
    result = cursor.fetchone()
    
    if not result:
        print(f"❌ Ricetta {codice} non trovata nel database")
        not_found_count += 1
        continue
    
    recipe_id = result[0]
    
    # Prepara dati da aggiornare
    quantita_prodotto_pronto = ricetta['quantita_prodotto_pronto']
    um_prodotto_pronto = ricetta['um_prodotto_pronto']
    resa_percentuale = ricetta['resa_percentuale']
    
    # Se unità è "u" (unità), salva producedQuantity
    # Se unità è "k" (kg), salva unitWeight
    if um_prodotto_pronto == 'u':
        unit_weight = None
        produced_quantity = quantita_prodotto_pronto
    else:  # 'k' = kg
        unit_weight = quantita_prodotto_pronto
        produced_quantity = None
    
    # Aggiorna database
    cursor.execute("""
        UPDATE final_recipes 
        SET 
            yieldPercentage = %s,
            unitWeight = %s,
            producedQuantity = %s
        WHERE id = %s
    """, (str(resa_percentuale), unit_weight, produced_quantity, recipe_id))
    
    updated_count += 1
    print(f"✓ Aggiornata {codice}: resa={resa_percentuale}%, peso={unit_weight}, quantità={produced_quantity}")

# Commit changes
conn.commit()

print(f"\n=== RIEPILOGO ===")
print(f"Ricette aggiornate: {updated_count}")
print(f"Ricette non trovate: {not_found_count}")

cursor.close()
conn.close()
