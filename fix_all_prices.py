"""
Script per correggere tutti i prezzi degli ingredienti nel database.
Ricalcola pricePerKgOrUnit = packagePrice / packageQuantity
"""
import mysql.connector
import os

# Connessione al database
db_url = os.environ.get('DATABASE_URL', '')
if db_url.startswith('mysql://'):
    db_url = db_url.replace('mysql://', '')
    if '@' in db_url:
        auth, host_db = db_url.split('@', 1)
        user, password = auth.split(':', 1)
        if '?' in host_db:
            host_db = host_db.split('?')[0]
        if '/' in host_db:
            host_port, database = host_db.split('/', 1)
            if ':' in host_port:
                host, port = host_port.split(':', 1)
            else:
                host, port = host_port, '3306'
        else:
            host, port, database = host_db, '3306', 'kitchen'
    else:
        raise ValueError("Invalid DATABASE_URL format")
else:
    raise ValueError("DATABASE_URL must start with mysql://")

conn = mysql.connector.connect(
    host=host,
    port=int(port),
    user=user,
    password=password,
    database=database
)
cursor = conn.cursor()

print("Connesso al database")
print("=" * 80)

# Seleziona tutti gli ingredienti con packagePrice e packageQuantity
cursor.execute("""
    SELECT id, name, packagePrice, packageQuantity, pricePerKgOrUnit, unitType
    FROM ingredients
    WHERE packagePrice IS NOT NULL 
      AND packageQuantity IS NOT NULL
      AND CAST(packageQuantity AS DECIMAL(10,2)) > 0
    ORDER BY name
""")

rows = cursor.fetchall()
print(f"Totale ingredienti da verificare: {len(rows)}\n")

corretti = 0
errors_found = 0

for row in rows:
    id, name, pkg_price, pkg_qty, current_price, unit_type = row
    
    # Calcolo corretto: prezzo confezione / quantità confezione
    pkg_price_float = float(pkg_price)
    pkg_qty_float = float(pkg_qty)
    correct_price = pkg_price_float / pkg_qty_float
    
    # Arrotonda a 2 decimali
    correct_price = round(correct_price, 2)
    
    current_price_float = float(current_price) if current_price else 0.0
    
    # Verifica se il prezzo è errato (tolleranza 0.01)
    if abs(correct_price - current_price_float) > 0.01:
        errors_found += 1
        print(f"[{errors_found:3d}] {name[:40]:40} | "
              f"Pkg: €{pkg_price_float:7.2f}/{pkg_qty_float:5.2f}{unit_type} | "
              f"Era: €{current_price_float:7.2f} → Ora: €{correct_price:7.2f}")
        
        # Aggiorna il database
        cursor.execute("""
            UPDATE ingredients 
            SET pricePerKgOrUnit = %s
            WHERE id = %s
        """, (str(correct_price), id))
        corretti += 1

# Commit delle modifiche
conn.commit()

print("\n" + "=" * 80)
print(f"Ingredienti con prezzi errati trovati: {errors_found}")
print(f"Ingredienti corretti: {corretti}")
print("=" * 80)

cursor.close()
conn.close()

print("\n✅ Correzione completata!")
