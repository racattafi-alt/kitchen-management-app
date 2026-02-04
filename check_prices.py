import json
from pathlib import Path

# Leggi database
db_path = Path(".manus-data/db.sqlite")

import sqlite3
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Query tutti gli ingredienti
cursor.execute("""
    SELECT id, name, packagePrice, packageQuantity, pricePerKgOrUnit, unitType
    FROM ingredients
    WHERE packagePrice IS NOT NULL AND packageQuantity IS NOT NULL
    ORDER BY name
""")

rows = cursor.fetchall()

print(f"Totale ingredienti con prezzi: {len(rows)}\n")
print("=" * 100)

# Verifica calcolo
errors = []
for row in rows:
    id, name, pkg_price, pkg_qty, price_per_unit, unit_type = row
    
    # Calcolo corretto
    expected_price = float(pkg_price) / float(pkg_qty) if float(pkg_qty) > 0 else 0
    actual_price = float(price_per_unit) if price_per_unit else 0
    
    # Tolleranza 0.01 per arrotondamenti
    if abs(expected_price - actual_price) > 0.01:
        errors.append({
            'id': id,
            'name': name,
            'packagePrice': pkg_price,
            'packageQuantity': pkg_qty,
            'expected': expected_price,
            'actual': actual_price,
            'diff': expected_price - actual_price
        })

print(f"Ingredienti con prezzi ERRATI: {len(errors)}\n")

if errors:
    print("TOP 20 ERRORI PIÙ GRAVI:")
    print("-" * 100)
    sorted_errors = sorted(errors, key=lambda x: abs(x['diff']), reverse=True)[:20]
    for err in sorted_errors:
        print(f"{err['name'][:30]:30} | Pkg: €{err['packagePrice']:7.2f} / {err['packageQuantity']:5.2f}kg | "
              f"Atteso: €{err['expected']:7.2f}/kg | Attuale: €{err['actual']:7.2f}/kg | Diff: €{err['diff']:7.2f}")

conn.close()
