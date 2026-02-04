#!/usr/bin/env python3
import os
import mysql.connector

# Connessione database
conn = mysql.connector.connect(
    host=os.environ['DATABASE_HOST'],
    user=os.environ['DATABASE_USER'],
    password=os.environ['DATABASE_PASSWORD'],
    database=os.environ['DATABASE_NAME']
)

cursor = conn.cursor()
cursor.execute("SELECT id, code, name FROM semi_finished_recipes WHERE category = 'SALSE' ORDER BY name")

print("\n=== SALSE ATTUALI NEI SEMILAVORATI ===\n")
for row in cursor.fetchall():
    print(f"  - {row[2]} (code: {row[1]})")

print(f"\nTotale: {cursor.rowcount} salse\n")

cursor.close()
conn.close()
