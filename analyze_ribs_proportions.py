#!/usr/bin/env python3
"""
Analizza proporzioni ricetta RIBS e confronta con Excel
"""
import json
import sys

# Simula risultato query (da sostituire con dati reali)
ribs_data = {
    'code': 'CARNE_RIBS',
    'name': 'Carne Ribs',
    'unitWeight': 32.0,  # kg prodotti
    'yieldPercentage': 1.0,
    'components': None  # Da ottenere dal database
}

print("="*60)
print("ANALISI PROPORZIONI RICETTA RIBS")
print("="*60)
print(f"\nRicetta: {ribs_data['name']} ({ribs_data['code']})")
print(f"Peso finale: {ribs_data['unitWeight']} kg")
print(f"Resa: {ribs_data['yieldPercentage']}")

# Chiedi all'utente di fornire il JSON components
print("\n" + "="*60)
print("PASSO 1: Ottieni il JSON components dal database")
print("="*60)
print("Esegui questa query e copia il risultato:")
print("SELECT components FROM final_recipes WHERE code = 'CARNE_RIBS';")
print("\nIncolla il JSON qui sotto (premi CTRL+D quando finito):")

try:
    components_json = sys.stdin.read().strip()
    if components_json:
        components = json.loads(components_json)
        
        print("\n" + "="*60)
        print("COMPONENTI TROVATI")
        print("="*60)
        
        total_input = 0
        for comp in components:
            print(f"\n{comp.get('name', 'UNKNOWN')}:")
            print(f"  Quantità: {comp.get('quantity', 0)} kg")
            print(f"  Tipo: {comp.get('type', 'UNKNOWN')}")
            total_input += float(comp.get('quantity', 0))
        
        print("\n" + "="*60)
        print("CALCOLI")
        print("="*60)
        print(f"Totale input: {total_input} kg")
        print(f"Output finale: {ribs_data['unitWeight']} kg")
        print(f"Rapporto input/output: {total_input / ribs_data['unitWeight']:.2f}x")
        print(f"Resa effettiva: {(ribs_data['unitWeight'] / total_input * 100):.1f}%")
        
        print("\n" + "="*60)
        print("VERIFICA")
        print("="*60)
        print(f"Per produrre 100 kg di RIBS servono:")
        for comp in components:
            qty_for_100kg = (float(comp.get('quantity', 0)) / ribs_data['unitWeight']) * 100
            print(f"  - {comp.get('name', 'UNKNOWN')}: {qty_for_100kg:.2f} kg")
            
except Exception as e:
    print(f"\nErrore: {e}")
