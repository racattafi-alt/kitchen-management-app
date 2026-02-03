#!/usr/bin/env python3
"""
Script per migrare i fornitori dal campo 'supplier' degli ingredienti
alla nuova tabella 'suppliers', eliminando i duplicati.
"""

import mysql.connector
import os
from nanoid import generate

# Connessione al database
conn = mysql.connector.connect(
    host=os.environ.get('DATABASE_HOST', 'gateway01.us-east-1.prod.aws.tidbcloud.com'),
    port=int(os.environ.get('DATABASE_PORT', 4000)),
    user=os.environ.get('DATABASE_USER', '2eCfxjqzjmDzEXM.root'),
    password=os.environ.get('DATABASE_PASSWORD', 'uNkWiWnOLqVFYIHK'),
    database=os.environ.get('DATABASE_NAME', 'kitchen_management'),
    ssl_ca='/etc/ssl/certs/ca-certificates.crt'
)

cursor = conn.cursor()

# 1. Estrai tutti i fornitori unici dal campo supplier degli ingredienti
print("Estraendo fornitori unici dagli ingredienti...")
cursor.execute("""
    SELECT DISTINCT supplier
    FROM ingredients
    WHERE supplier IS NOT NULL AND supplier != ''
    ORDER BY supplier
""")

unique_suppliers = [row[0] for row in cursor.fetchall()]
print(f"Trovati {len(unique_suppliers)} fornitori unici")

# 2. Inserisci i fornitori nella tabella suppliers
print("\nInserendo fornitori nella tabella suppliers...")
supplier_map = {}  # nome fornitore -> id

for supplier_name in unique_suppliers:
    supplier_id = generate(size=21)
    try:
        cursor.execute("""
            INSERT INTO suppliers (id, name, contact, email, phone, address, notes, createdAt, updatedAt)
            VALUES (%s, %s, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())
        """, (supplier_id, supplier_name))
        supplier_map[supplier_name] = supplier_id
        print(f"  ✓ {supplier_name} -> {supplier_id}")
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            # Fornitore già esistente, recupera l'ID
            cursor.execute("SELECT id FROM suppliers WHERE name = %s", (supplier_name,))
            existing_id = cursor.fetchone()[0]
            supplier_map[supplier_name] = existing_id
            print(f"  ⚠ {supplier_name} già esistente -> {existing_id}")
        else:
            raise

conn.commit()
print(f"\n✓ Migrazione completata: {len(supplier_map)} fornitori nella tabella suppliers")

# 3. Mostra statistiche
cursor.execute("SELECT COUNT(*) FROM suppliers")
total_suppliers = cursor.fetchone()[0]
print(f"\nStatistiche finali:")
print(f"  Fornitori totali: {total_suppliers}")

cursor.close()
conn.close()
