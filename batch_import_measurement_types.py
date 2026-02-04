#!/usr/bin/env python3
"""
Batch Import Measurement Types from Excel

Formato Excel richiesto:
- Colonna A: Codice Ricetta (es. TENDERS)
- Colonna B: Tipo Unità (weight_only | unit_only | both)
- Colonna C: Peso Pezzo in kg (opzionale, richiesto solo per unit_only e both)

Esempio:
| Codice    | Tipo         | Peso Pezzo |
|-----------|--------------|------------|
| TENDERS   | both         | 0.05097    |
| SALSA_BBQ | weight_only  |            |
"""

import sys
import os
import openpyxl
from dotenv import load_dotenv
import mysql.connector

# Carica variabili ambiente
load_dotenv()

def parse_database_url(url):
    """Estrae host, user, password, database da DATABASE_URL"""
    # Formato: mysql://user:password@host:port/database
    if not url or not url.startswith('mysql://'):
        raise ValueError("DATABASE_URL non valido")
    
    url = url.replace('mysql://', '')
    auth, rest = url.split('@')
    user, password = auth.split(':')
    host_port, database = rest.split('/')
    host = host_port.split(':')[0]
    
    return {
        'host': host,
        'user': user,
        'password': password,
        'database': database
    }

def import_from_excel(excel_path, dry_run=True):
    """Importa measurementType e pieceWeight da Excel"""
    
    # Connessione database
    db_config = parse_database_url(os.getenv('DATABASE_URL'))
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Carica Excel
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active
    
    updates = []
    errors = []
    
    # Salta header (riga 1)
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        code = row[0]
        measurement_type = row[1]
        piece_weight = row[2] if len(row) > 2 else None
        
        if not code or not measurement_type:
            continue
        
        # Validazione
        if measurement_type not in ['weight_only', 'unit_only', 'both']:
            errors.append(f"Riga {row_idx}: tipo '{measurement_type}' non valido per {code}")
            continue
        
        if measurement_type in ['unit_only', 'both'] and not piece_weight:
            errors.append(f"Riga {row_idx}: peso pezzo mancante per {code} (tipo {measurement_type})")
            continue
        
        # Verifica ricetta esiste
        cursor.execute("SELECT id, name FROM final_recipes WHERE code = %s", (code,))
        recipe = cursor.fetchone()
        
        if not recipe:
            errors.append(f"Riga {row_idx}: ricetta {code} non trovata nel database")
            continue
        
        updates.append({
            'id': recipe['id'],
            'name': recipe['name'],
            'code': code,
            'measurement_type': measurement_type,
            'piece_weight': piece_weight
        })
    
    # Mostra riepilogo
    print(f"\n{'='*60}")
    print(f"RIEPILOGO IMPORT")
    print(f"{'='*60}")
    print(f"Ricette da aggiornare: {len(updates)}")
    print(f"Errori: {len(errors)}")
    
    if errors:
        print(f"\n{'='*60}")
        print("ERRORI:")
        print(f"{'='*60}")
        for error in errors:
            print(f"  ❌ {error}")
    
    if updates:
        print(f"\n{'='*60}")
        print("AGGIORNAMENTI:")
        print(f"{'='*60}")
        for upd in updates:
            piece_info = f" ({upd['piece_weight']}kg/pz)" if upd['piece_weight'] else ""
            print(f"  ✓ {upd['code']} - {upd['name']}: {upd['measurement_type']}{piece_info}")
    
    # Applica aggiornamenti
    if not dry_run and updates:
        print(f"\n{'='*60}")
        print("APPLICAZIONE MODIFICHE...")
        print(f"{'='*60}")
        
        for upd in updates:
            cursor.execute("""
                UPDATE final_recipes 
                SET measurementType = %s, pieceWeight = %s
                WHERE id = %s
            """, (upd['measurement_type'], upd['piece_weight'], upd['id']))
        
        conn.commit()
        print(f"✅ {len(updates)} ricette aggiornate con successo!")
    elif dry_run:
        print(f"\n{'='*60}")
        print("DRY RUN - Nessuna modifica applicata")
        print("Esegui con --apply per applicare le modifiche")
        print(f"{'='*60}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 batch_import_measurement_types.py <file.xlsx> [--apply]")
        print("\nFormato Excel richiesto:")
        print("  Colonna A: Codice Ricetta")
        print("  Colonna B: Tipo Unità (weight_only | unit_only | both)")
        print("  Colonna C: Peso Pezzo in kg (opzionale)")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    dry_run = '--apply' not in sys.argv
    
    if not os.path.exists(excel_path):
        print(f"❌ File non trovato: {excel_path}")
        sys.exit(1)
    
    import_from_excel(excel_path, dry_run=dry_run)
