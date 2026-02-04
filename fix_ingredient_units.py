"""
Script per correggere unità di misura ingredienti importati in grammi invece che kg
Divide packageQuantity per 1000 per ingredienti con unitType='k' e packageQuantity > 100
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
cursor = conn.cursor(dictionary=True)

print("Connesso al database")

# Trova ingredienti con unitType='k' e packageQuantity > 100 (probabilmente in grammi)
cursor.execute("""
    SELECT id, name, packageQuantity, packagePrice, pricePerKgOrUnit, unitType
    FROM ingredients
    WHERE unitType = 'k' AND packageQuantity > 100
    ORDER BY packageQuantity DESC
""")

ingredients = cursor.fetchall()
print(f"\nTrovati {len(ingredients)} ingredienti con packageQuantity > 100 kg (probabilmente in grammi)")

if not ingredients:
    print("Nessun ingrediente da correggere!")
    conn.close()
    exit(0)

# Mostra anteprima
print("\nAnteprima correzioni:")
print("-" * 80)
for ing in ingredients[:10]:  # Mostra primi 10
    old_qty = float(ing['packageQuantity'])
    new_qty = old_qty / 1000
    print(f"{ing['name'][:30]:30} | {old_qty:>10.2f} kg → {new_qty:>10.2f} kg")

if len(ingredients) > 10:
    print(f"... e altri {len(ingredients) - 10} ingredienti")
print("-" * 80)

# Chiedi conferma
response = input(f"\nVuoi correggere {len(ingredients)} ingredienti? (y/n): ")
if response.lower() != 'y':
    print("Operazione annullata")
    conn.close()
    exit(0)

# Applica correzioni
corrected = 0
for ing in ingredients:
    old_qty = float(ing['packageQuantity'])
    new_qty = old_qty / 1000
    
    # Aggiorna packageQuantity
    cursor.execute("""
        UPDATE ingredients
        SET packageQuantity = %s
        WHERE id = %s
    """, (str(new_qty), ing['id']))
    
    corrected += 1
    if corrected % 10 == 0:
        print(f"Corretti {corrected}/{len(ingredients)} ingredienti...")

conn.commit()
print(f"\n✓ Corretti {corrected} ingredienti!")
print("Operazione completata con successo")

conn.close()
