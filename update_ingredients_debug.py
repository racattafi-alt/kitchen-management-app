import mysql.connector
import os

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

conn = mysql.connector.connect(host=host, port=int(port), user=user, password=password, database=database)
cursor = conn.cursor()

# Test solo Aglio pelato
name = 'Aglio pelato'
pkg_qty = 1.0
pkg_price = 5.98
category = 'Verdure'
is_food = True
price_per_unit = round(pkg_price / pkg_qty, 2)

print(f"Test aggiornamento: {name}")
print(f"  packageQuantity: {pkg_qty} (type: {type(pkg_qty)})")
print(f"  packagePrice: {pkg_price} (type: {type(pkg_price)})")
print(f"  pricePerKgOrUnit: {price_per_unit} (type: {type(price_per_unit)})")
print(f"  category: {category} (type: {type(category)})")
print(f"  is_food: {is_food} (type: {type(is_food)})")

cursor.execute("SELECT id FROM ingredients WHERE name = %s", (name,))
result = cursor.fetchone()

if result:
    ing_id = result[0]
    print(f"  ID trovato: {ing_id}")
    
    try:
        cursor.execute("""
            UPDATE ingredients 
            SET packageQuantity = %s,
                packagePrice = %s,
                pricePerKgOrUnit = %s,
                category = %s,
                is_food = %s
            WHERE id = %s
        """, (str(pkg_qty), str(pkg_price), str(price_per_unit), category, is_food, ing_id))
        
        conn.commit()
        print("✓ Aggiornamento riuscito!")
    except Exception as e:
        print(f"✗ Errore durante UPDATE: {e}")
        print(f"  Parametri: pkg_qty={str(pkg_qty)}, pkg_price={str(pkg_price)}, price_per_unit={str(price_per_unit)}, category={category}, is_food={is_food}, id={ing_id}")
else:
    print("✗ Ingrediente non trovato")

cursor.close()
conn.close()
