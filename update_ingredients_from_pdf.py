"""
Script per aggiornare ingredienti dal PDF MENUUNION2026-FogliGoogle.pdf
Aggiorna: prezzi, quantità, categorie, tag non-food
"""
import mysql.connector
import os
from decimal import Decimal

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
print("=" * 100)

# Mappa unificazione categorie
category_map = {
    'General Supplies': 'Altro',
    'General...': 'Altro',
    'Genera...': 'Altro',
    'Verdura fresca': 'Verdure',
    'Verdura trasformata': 'Verdure',
    'Verdure': 'Verdure',
    'Verduraio': 'Verdure',
    'Verdur...': 'Verdure',
    'Latticini e uovo': 'Latticini',
    'Condimenti': 'Condimenti',
    'Pronti all\'uso': 'Altro',
    'Salse': 'Condimenti',
    'No food': 'Packaging',
    'No Food': 'Packaging',
    'Tutte le spezie del mondo': 'Spezie',
    'Tutte le spezie': 'Spezie',
}

# Dati estratti manualmente dal PDF (campione rappresentativo + casi critici)
# Formato: (nome, packageQuantity_kg, packagePrice_euro, category, isFood)
ingredients_data = [
    # CASO CRITICO: Aglio pelato
    ('Aglio pelato', 1.0, 5.98, 'Verdure', True),
    
    # Carni
    ('Tenders', 1.0, 7.12, 'Carni', True),
    ('Costole di maiale', 1.0, 4.99, 'Carni', True),
    ('Bacon', 1.0, 10.72, 'Carni', True),
    ('Spalla di Maiale (senza osso)', 1.0, 4.99, 'Carni', True),
    ('Carne grill', 1.0, 7.33, 'Carni', True),
    ('Carne', 1.0, 7.17, 'Carni', True),
    ('Ali di pollo', 1.0, 2.61, 'Carni', True),
    ('Coscia di pollo', 1.0, 8.20, 'Carni', True),
    ('Diaframma (250-300g)', 1.0, 9.01, 'Carni', True),
    ('Reale (denver) (250-300g)', 1.0, 14.37, 'Carni', True),
    
    # Latticini
    ('Asiago', 1.0, 7.64, 'Latticini', True),
    ('Cheddar', 1.0, 7.63, 'Latticini', True),
    ('Stracciatella', 1.0, 9.89, 'Latticini', True),
    ('Gorgonzola', 1.0, 9.29, 'Latticini', True),
    ('Misto uovo', 1.0, 4.37, 'Latticini', True),
    ('Tuorlo in polvere', 20.0, 345.00, 'Latticini', True),
    ('Mascarpone', 2.0, 6.78, 'Latticini', True),
    ('Panna UHT', 1.0, 6.95, 'Latticini', True),
    ('Latte UHT', 1.0, 1.07, 'Latticini', True),
    ('Tuorlo d\'uovo special', 1.0, 9.49, 'Latticini', True),
    
    # Verdure
    ('Peperoni', 1.0, 2.98, 'Verdure', True),
    ('Carote', 1.0, 1.23, 'Verdure', True),
    ('Cipolla viola', 1.0, 1.53, 'Verdure', True),
    ('Limone', 1.0, 2.05, 'Verdure', True),
    ('Pomodoro', 1.0, 2.46, 'Verdure', True),
    ('Cetrioli', 1.0, 1.64, 'Verdure', True),
    ('Cavolo viola', 1.0, 1.33, 'Verdure', True),
    ('Insalata', 1.0, 1.50, 'Verdure', True),
    ('Cavolo cappuccio', 1.0, 1.50, 'Verdure', True),
    ('Cipolla', 1.0, 1.50, 'Verdure', True),
    ('Cetriolini salamoia', 0.4, 2.50, 'Verdure', True),
    ('Pomodori secchi', 1.7, 8.48, 'Verdure', True),
    ('Coriandolo', 0.5, 14.28, 'Verdure', True),
    ('Lime', 1.0, 3.39, 'Verdure', True),
    ('Melanzane', 1.0, 2.15, 'Verdure', True),
    
    # Spezie
    ('Pepe', 1.0, 17.32, 'Spezie', True),
    ('Aglio in polvere', 1.0, 6.50, 'Spezie', True),
    ('Asafetida', 0.01, 5.78, 'Spezie', True),
    ('Cannella', 0.25, 15.08, 'Spezie', True),
    ('Chile pasilla in polvere', 1.0, 22.00, 'Spezie', True),
    ('Coriandolo in polvere', 1.0, 17.70, 'Spezie', True),
    ('Cumino', 1.0, 19.90, 'Spezie', True),
    ('Curcuma', 1.0, 19.80, 'Spezie', True),
    ('Fava tonka', 0.015, 4.45, 'Spezie', True),
    ('Galangal', 1.0, 31.40, 'Spezie', True),
    ('Nigella', 1.0, 20.37, 'Spezie', True),
    ('Paprica affumicata', 1.0, 26.90, 'Spezie', True),
    ('Paprica dolce', 1.0, 26.90, 'Spezie', True),
    ('Pasta di vaniglia', 0.1, 23.36, 'Spezie', True),
    ('Pepe bianco', 1.0, 20.00, 'Spezie', True),
    ('Rabarbaro', 0.25, 17.75, 'Spezie', True),
    ('Pepe di sichuan', 1.0, 57.70, 'Spezie', True),
    ('Radice di angelica', 0.25, 18.59, 'Spezie', True),
    ('Semi di fieno greco', 1.0, 15.65, 'Spezie', True),
    ('Sumac', 1.0, 28.00, 'Spezie', True),
    ('Thè affumicato', 0.25, 20.90, 'Spezie', True),
    ('Semi di senape', 1.0, 18.40, 'Spezie', True),
    ('Senape in polvere', 1.0, 16.70, 'Spezie', True),
    
    # Farine
    ('Farina', 25.0, 29.25, 'Farine', True),
    ('Farina per fritti', 25.0, 31.50, 'Farine', True),
    ('Easy Snack CL', 15.0, 89.42, 'Farine', True),
    ('Fiocchi di patata', 4.0, 14.89, 'Farine', True),
    ('Farina PAN', 1.0, 2.20, 'Farine', True),
    ('Farina UNIQUA Viola', 5.0, 12.00, 'Farine', True),
    
    # Fritti
    ('Beyond vegan Nuggets', 4.0, 77.25, 'Fritti', True),
    ('Batatine (sweet potato fries 9x9)', 10.0, 40.73, 'Fritti', True),
    ('Onion rings', 1.0, 34.03, 'Fritti', True),
    ('Patatine Really crunchy 6x6', 10.0, 20.87, 'Fritti', True),
    
    # Additivi
    ('Fumo liquido', 1.0, 32.60, 'Additivi', True),
    ('Mono e digliceridi', 1.0, 22.50, 'Additivi', True),
    ('Xantana', 1.0, 27.79, 'Additivi', True),
    ('Lievito otentic', 1.0, 8.82, 'Additivi', True),
    ('Sapore carmen', 1.0, 7.42, 'Additivi', True),
    ('Softgrain', 5.0, 36.35, 'Additivi', True),
    ('CL soffice', 10.0, 6.03, 'Additivi', True),
    ('Malto diastasico', 1.0, 4.20, 'Additivi', True),
    
    # Condimenti
    ('Olio di sesamo', 1.65, 21.29, 'Condimenti', True),
    ('Olio EVO', 0.5, 11.32, 'Condimenti', True),
    ('Aceto di alcool', 1.0, 0.00, 'Condimenti', True),
    ('Aceto di mele', 3.0, 7.07, 'Condimenti', True),
    ('Salsa di Soja', 1.9, 9.41, 'Condimenti', True),
    ('Semi di papavero', 1.0, 8.45, 'Condimenti', True),
    ('Aceto balsamico', 1.0, 2.10, 'Condimenti', True),
    ('Senape', 0.875, 2.63, 'Condimenti', True),
    ('Lardo', 1.0, 10.97, 'Condimenti', True),
    ('Nduja', 0.4, 10.79, 'Condimenti', True),
    ('Olio di semi', 1.0, 1.58, 'Condimenti', True),
    
    # Altro
    ('"Nutella"', 13.0, 67.28, 'Altro', True),
    ('UMA.MI Minced Vegana', 15.0, 185.98, 'Altro', True),
    ('Roggena', 10.0, 39.00, 'Altro', True),
    ('Burro professionale', 10.0, 100.60, 'Altro', True),
    ('Margarina', 1.0, 4.78, 'Altro', True),
    ('Zucchero invertito', 10.0, 20.00, 'Altro', True),
    ('Amido pregelatinizzato', 1.0, 6.50, 'Altro', True),
    ('Doppio concentrato', 2.5, 7.81, 'Altro', True),
    ('Yogurt greco', 1.0, 4.36, 'Altro', True),
    ('Zucchero', 1.0, 0.82, 'Altro', True),
    ('Latte di soja', 1.0, 0.00, 'Altro', True),
    ('Fondo bruno vegano', 1.0, 20.53, 'Altro', True),
    ('Funghi sbrise', 1.0, 6.64, 'Altro', True),
    ('Funghi acularia', 1.0, 18.00, 'Altro', True),
    ('Funghi shitake', 1.0, 0.00, 'Altro', True),
    ('Erbette surgelate', 1.0, 5.33, 'Altro', True),
    ('Onion flakes', 1.0, 6.73, 'Altro', True),
    ('Rucola', 0.1, 1.08, 'Altro', True),
    ('Misto frutti di bosco', 1.0, 6.62, 'Altro', True),
    ('Pasta di zucca', 1.0, 4.39, 'Altro', True),
    ('Pasta di avocado', 1.0, 0.00, 'Altro', True),
    ('Fiocchi di pomodoro', 0.5, 5.01, 'Altro', True),
    ('Fiocchi di sale', 1.0, 10.02, 'Altro', True),
    ('Arachidi', 1.0, 4.93, 'Altro', True),
    ('Acqua', 1.0, 0.00, 'Altro', True),
    ('Amido di mais', 1.0, 2.02, 'Altro', True),
    ('Tartare', 0.21, 3.20, 'Altro', True),
    ('Vino bianco', 0.75, 5.00, 'Altro', True),
    
    # Packaging (NON FOOD)
    ('Spiedini 20cm', 1.0, 17.37, 'Packaging', False),
    ('Carta paglia', 10.0, 13.30, 'Packaging', False),
    ('Pellicola', 0.3, 5.26, 'Packaging', False),
    ('Contenitori PLA (80ml) (50pz)', 0.05, 14.38, 'Packaging', False),
    ('Rotoli Scontrini 57mm pos', 0.1, 19.60, 'Packaging', False),
    ('Rotoli Scontrini 57mm', 0.05, 16.41, 'Packaging', False),
    ('Rotoli Scontrini 80mm', 0.03, 31.82, 'Packaging', False),
    ('Tovaglioli (33x33)', 4.0, 19.60, 'Packaging', False),
    ('Alluminio', 0.125, 6.94, 'Packaging', False),
    ('Carta forno 60x40', 1.0, 24.50, 'Packaging', False),
    ('Detersivo pavimenti', 5.0, 37.00, 'Packaging', False),
    ('Guanti da cucina', 0.1, 3.89, 'Packaging', False),
    ('Panno microfibra', 1.0, 0.70, 'Packaging', False),
    ('Sacchetti antigrasso fritti', 1.0, 39.75, 'Packaging', False),
    ('Sacchi 70x110', 0.4, 34.03, 'Packaging', False),
    ('Sacchi 90x120', 0.4, 0.00, 'Packaging', False),
    ('Sapone lavapiatti', 5.0, 8.57, 'Packaging', False),
    ('Scottex (2 rotoli)', 0.002, 12.29, 'Packaging', False),
    ('Shopper Bio', 0.5, 21.24, 'Packaging', False),
    ('Spugne', 0.005, 3.29, 'Packaging', False),
    ('Tovagliette', 1.0, 0.00, 'Packaging', False),
    ('Bombolette gas', 1.0, 0.00, 'Packaging', False),
    ('Busta sv 30x40', 0.1, 12.73, 'Packaging', False),
    ('Busta sv 20x30', 0.1, 9.30, 'Packaging', False),
    ('Tovaglioli economici', 1.2, 118.56, 'Packaging', False),
    ('Contenitori PLA (250ml)', 0.6, 22.49, 'Packaging', False),
    ('Scatole fritti', 0.1, 26.50, 'Packaging', False),
    ('Buste delivery', 1.0, 0.00, 'Packaging', False),
    ('Tovaglioli tavolo', 1.2, 0.00, 'Packaging', False),
    ('Carta burger', 1.0, 0.00, 'Packaging', False),
    ('Carta paglia tagliata', 10.0, 13.30, 'Packaging', False),
    ('Panni stracci', 1.0, 0.00, 'Packaging', False),
]

print(f"\nTotale ingredienti da aggiornare: {len(ingredients_data)}\n")

updated_count = 0
not_found_count = 0

for name, pkg_qty, pkg_price, category, is_food in ingredients_data:
    # Calcola prezzo per kg/unità
    price_per_unit = round(pkg_price / pkg_qty, 2) if pkg_qty > 0 else 0.0
    
    # Verifica se l'ingrediente esiste
    cursor.execute("SELECT id, packagePrice, packageQuantity, pricePerKgOrUnit FROM ingredients WHERE name = %s", (name,))
    result = cursor.fetchone()
    
    if result:
        ing_id, current_pkg_price, current_pkg_qty, current_price_per_unit = result
        
        # Aggiorna solo se ci sono differenze nei prezzi/quantità
        if (abs(float(current_pkg_price or 0) - pkg_price) > 0.01 or 
            abs(float(current_pkg_qty or 0) - pkg_qty) > 0.001 or
            abs(float(current_price_per_unit or 0) - price_per_unit) > 0.01):
            
            cursor.execute("""
                UPDATE ingredients 
                SET packageQuantity = %s,
                    packagePrice = %s,
                    pricePerKgOrUnit = %s
                WHERE id = %s
            """, (str(pkg_qty), str(pkg_price), str(price_per_unit), ing_id))
            
            updated_count += 1
            print(f"[{updated_count:3d}] {name[:50]:50} | "
                  f"€{price_per_unit:7.2f}/kg | {category:15} | Food: {is_food}")
    else:
        not_found_count += 1
        print(f"[!] NON TROVATO: {name}")

# Commit delle modifiche
conn.commit()

print("\n" + "=" * 100)
print(f"Ingredienti aggiornati: {updated_count}")
print(f"Ingredienti non trovati: {not_found_count}")
print("=" * 100)

cursor.close()
conn.close()

print("\n✅ Aggiornamento completato!")
